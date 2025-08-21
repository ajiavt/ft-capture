const { app, BrowserWindow, globalShortcut, Tray, Menu, screen, clipboard, nativeImage, ipcMain, Notification, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

class FTCapture {
  constructor() {
    this.store = new Store();
    this.tray = null;
    this.settingsWindow = null;
    this.overlayWindows = [];
    this.macros = this.store.get('macros', []);
    this.isSelecting = false;

    this.setupIPC();
  }

  setupIPC() {
    // Debug log handler - displays overlay logs in WebStorm terminal
    ipcMain.on('debug-log', (event, message) => {
      console.log('[OVERLAY]', message);
    });

    ipcMain.on('start-area-selection', () => {
      console.log('IPC: start-area-selection received');
      this.startAreaSelection();
    });

    ipcMain.on('macro-area-assigned', (event, macroId, area) => {
      console.log('=== IPC: macro-area-assigned received ===');
      console.log('Macro ID:', macroId);
      console.log('Area data:', area);

      console.log('Reloading macros from store...');
      this.macros = this.store.get('macros', []);
      console.log('Current macros after reload:', this.macros);

      this.closeOverlays();
      this.isSelecting = false;

      console.log('Updating tray menu...');
      // Update tray menu to reflect new macro count
      this.updateTrayMenu();

      console.log('Refreshing hotkeys...');
      // Refresh hotkeys to include new macro
      this.registerHotkeys();

      // Notify settings window if open
      if (this.settingsWindow) {
        console.log('Notifying settings window...');
        this.settingsWindow.webContents.send('area-assigned');
      }
      console.log('=== IPC: macro-area-assigned completed ===');
    });

    ipcMain.on('area-selection-cancelled', () => {
      this.closeOverlays();
      this.isSelecting = false;
    });

    ipcMain.on('refresh-hotkeys', () => {
      this.macros = this.store.get('macros', []);
      this.registerHotkeys();
      this.updateTrayMenu();
    });

    ipcMain.on('test-capture', (event, macroId) => {
      this.captureMacro(macroId);
    });

    ipcMain.handle('dialog:openFile', async (event, options) => {
      const result = await dialog.showOpenDialog(this.settingsWindow, {
        properties: ['openFile', 'multiSelections'],
        ...options
      });
      return result.filePaths;
    });

    ipcMain.handle('dialog:openDirectory', async (event, options) => {
      const result = await dialog.showOpenDialog(this.settingsWindow, {
        properties: ['openDirectory'],
        ...options
      });
      return result.filePaths;
    });
  }

  init() {
    this.createTray();
    this.registerHotkeys();
  }

  createTray() {
    // Create simple tray icon using text
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    this.tray = new Tray(icon);
    this.tray.setTitle('📷');

    this.updateTrayMenu();
  }

  updateTrayMenu() {
    const macros = this.store.get('macros', []);
    const macroMenuItems = macros.length > 0 ? [
      {
        type: 'separator'
      },
      {
        label: 'Quick Capture:',
        enabled: false
      },
      ...macros.filter(m => m.area).map(macro => ({
        label: `${macro.name} (${macro.hotkey})`,
        click: () => this.captureMacro(macro.id)
      }))
    ] : [];

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Settings',
        click: () => this.openSettings()
      },
      {
        type: 'separator'
      },
      {
        label: `Macros: ${macros.length}`,
        enabled: false
      },
      {
        label: `Ready: ${macros.filter(m => m.area).length}`,
        enabled: false
      },
      ...macroMenuItems,
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  openSettings() {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'FT Capture Settings',
      titleBarStyle: 'hiddenInset',
      vibrancy: 'window',
      backgroundColor: '#f5f5f5'
    });

    this.settingsWindow.loadFile('src/settings.html');

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  startAreaSelection() {
    if (this.isSelecting) return;

    this.isSelecting = true;
    const displays = screen.getAllDisplays();

    // Close settings window during selection
    if (this.settingsWindow) {
      this.settingsWindow.hide();
    }

    // Create overlay window for each display
    displays.forEach(display => {
      this.createOverlay(display);
    });
  }

  createOverlay(display) {
    const overlay = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    overlay.loadFile('src/overlay.html');
    overlay.setAlwaysOnTop(true, 'screen-saver');

    overlay.on('closed', () => {
      this.overlayWindows = this.overlayWindows.filter(w => w !== overlay);
    });

    this.overlayWindows.push(overlay);
  }

  closeOverlays() {
    this.overlayWindows.forEach(overlay => {
      if (!overlay.isDestroyed()) {
        overlay.close();
      }
    });
    this.overlayWindows = [];

    // Show settings window again if it was open
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.show();
    }
  }

  async captureMacro(macroId) {
    const macros = this.store.get('macros', []);
    const macro = macros.find(m => m.id === macroId);

    if (!macro) {
      this.showNotification('Macro not found!');
      return;
    }

    if (!macro.area) {
      this.showNotification(`Macro "${macro.name}" has no area assigned!`);
      return;
    }

    try {
      console.log('Capturing macro:', macro.name, 'with area:', macro.area);

      // Use desktopCapturer for reliable cross-platform capture
      const { desktopCapturer } = require('electron');

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: screen.getPrimaryDisplay().size
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      // Get the appropriate screen source
      const source = sources[0];
      const fullImage = source.thumbnail;

      console.log('Full image size:', fullImage.getSize());
      console.log('Screen size:', screen.getPrimaryDisplay().size);

      // Crop the image to the specified area (area coordinates are already screen coordinates)
      const croppedImage = await this.cropImageAsync(fullImage, macro.area);

      // Copy to clipboard (main feature as requested)
      clipboard.writeImage(croppedImage);

      // Auto-save to file (default behavior)
      const autoSave = this.store.get('autoSave', true);
      if (autoSave) {
        this.saveImage(croppedImage, macro);
      }

      // Show notification
      this.showSuccessNotification(macro.name);

    } catch (error) {
      console.error('Capture failed:', error);
      this.showNotification('Capture failed: ' + error.message);
    }
  }

  async cropImageAsync(image, area) {
    // Create a cropped version using nativeImage methods
    const originalSize = image.getSize();
    const primaryDisplay = screen.getPrimaryDisplay();
    const scale = originalSize.width / primaryDisplay.size.width;

    // Scale coordinates based on image resolution
    const scaledArea = {
      x: Math.round(area.x * scale),
      y: Math.round(area.y * scale),
      width: Math.round(area.width * scale),
      height: Math.round(area.height * scale)
    };

    // Ensure coordinates are within bounds
    scaledArea.x = Math.max(0, Math.min(scaledArea.x, originalSize.width - 1));
    scaledArea.y = Math.max(0, Math.min(scaledArea.y, originalSize.height - 1));
    scaledArea.width = Math.min(scaledArea.width, originalSize.width - scaledArea.x);
    scaledArea.height = Math.min(scaledArea.height, originalSize.height - scaledArea.y);

    // Use nativeImage crop method
    return image.crop({
      x: scaledArea.x,
      y: scaledArea.y,
      width: scaledArea.width,
      height: scaledArea.height
    });
  }

  saveImage(image, macro) {
    const fs = require('fs');
    const os = require('os');

    const defaultPath = path.join(os.homedir(), 'Desktop');
    const savePath = this.store.get('savePath', defaultPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    // Use sequential numbering
    const timestamp = Date.now();
    const safeName = macro.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `ft-capture-${safeName}-${timestamp}.png`;
    const filepath = path.join(savePath, filename);

    try {
      fs.writeFileSync(filepath, image.toPNG());
      console.log(`Saved to: ${filepath}`);
    } catch (error) {
      console.error('Save failed:', error);
    }
  }

  showNotification(message) {
    console.log('Notification:', message);

    // Show system notification
    if (Notification.isSupported()) {
      new Notification({
        title: 'FT Capture',
        body: message,
        icon: path.join(__dirname, '../assets/icon.png'),
        silent: false
      }).show();
    }
  }

  // Add new method for screenshot success notification
  showSuccessNotification(macroName) {
    // 1. Show screenshot area indicator
    this.showScreenshotAreaIndicator(macroName);

    // 2. Toast notification
    this.showToastNotification(macroName);

    // 3. System notification
    this.showNotification(`"${macroName}" captured! 📋 Ready to paste`);
  }

  showScreenshotAreaIndicator(macroName) {
    const macros = this.store.get('macros', []);
    const macro = macros.find(m => m.name === macroName);

    if (!macro || !macro.area) return;

    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = macro.area;

    const indicatorWindow = new BrowserWindow({
      x: x - 2,
      y: y - 2,
      width: width + 4,
      height: height + 4,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      resizable: false,
      movable: false,
      skipTaskbar: true,
      focusable: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const macroColor = macro?.color || '#4CAF50';

    // Convert hex to RGB for calculations
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(macroColor);

    const indicatorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: transparent;
          }
          .area-indicator {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 3px dashed ${macroColor};
            border-radius: 4px;
            box-shadow: 
              0 0 0 1px rgba(255, 255, 255, 0.8),
              0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6),
              inset 0 0 0 1px rgba(255, 255, 255, 0.4);
            animation: areaHighlight 1.0s ease-out;
            pointer-events: none;
          }
          .area-indicator::before {
            content: '';
            position: absolute;
            top: -6px;
            left: -6px;
            right: -6px;
            bottom: -6px;
            border: 2px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3);
            border-radius: 8px;
            animation: outerGlow 1.0s ease-out;
          }
          @keyframes areaHighlight {
            0% { 
              opacity: 0;
              transform: scale(1.1);
              border-width: 1px;
            }
            20% { 
              opacity: 1;
              transform: scale(1);
              border-width: 3px;
            }
            80% { 
              opacity: 1;
              transform: scale(1);
              border-width: 3px;
            }
            100% { 
              opacity: 0;
              transform: scale(0.98);
              border-width: 2px;
            }
          }
          @keyframes outerGlow {
            0% { 
              opacity: 0;
              transform: scale(1.2);
            }
            20% { 
              opacity: 0.6;
              transform: scale(1);
            }
            80% { 
              opacity: 0.6;
              transform: scale(1);
            }
            100% { 
              opacity: 0;
              transform: scale(0.95);
            }
          }
        </style>
      </head>
      <body>
        <div class="area-indicator"></div>
      </body>
      </html>
    `;

    indicatorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(indicatorHTML)}`);
    indicatorWindow.show();

    // Close indicator window after exactly 1 second
    setTimeout(() => {
      indicatorWindow.close();
    }, 1000);
  }

  showToastNotification(macroName) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Get macro color
    const macros = this.store.get('macros', []);
    const macro = macros.find(m => m.name === macroName);
    const macroColor = macro?.color || '#4CAF50'; // Default green if no color set

    // Convert hex to RGB for gradient calculations
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(macroColor);
    const darkerColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;

    const toastWindow = new BrowserWindow({
      x: width - 350,
      y: 20,
      width: 320,
      height: 100,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      resizable: false,
      movable: false,
      skipTaskbar: true,
      focusable: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const toastHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          }
          body {
            background: linear-gradient(135deg, 
              rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95) 0%, 
              rgba(${Math.max(0, rgb.r - 10)}, ${Math.max(0, rgb.g - 10)}, ${Math.max(0, rgb.b - 10)}, 0.95) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3);
            border-radius: 12px;
            box-shadow: 
              0 8px 32px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2),
              0 2px 8px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 16px 20px;
          }
          .icon-container {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, ${macroColor} 0%, ${darkerColor} 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 14px;
            box-shadow: 0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4);
            flex-shrink: 0;
          }
          .icon {
            font-size: 24px;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
          }
          .content {
            flex: 1;
            min-width: 0;
          }
          .title {
            font-size: 15px;
            font-weight: 600;
            color: white;
            margin-bottom: 2px;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          .subtitle {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }
          .check-mark {
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 12px;
            flex-shrink: 0;
            animation: checkPop 1.0s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0s both;
          }
          .check-mark::after {
            content: '✓';
            color: ${macroColor};
            font-size: 12px;
            font-weight: bold;
          }
          @keyframes checkPop {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            15% {
              transform: scale(1.1);
              opacity: 1;
            }
            25% {
              transform: scale(1);
              opacity: 1;
            }
            85% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(0.8);
              opacity: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="icon-container">
          <div class="icon">📸</div>
        </div>
        <div class="content">
          <div class="title">${macroName} Captured</div>
          <div class="subtitle">Screenshot area ready to paste</div>
        </div>
        <div class="check-mark"></div>
      </body>
      </html>
    `;

    toastWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(toastHTML)}`);
    toastWindow.show();

    // Auto-close toast after 1 seconds
    setTimeout(() => {
      toastWindow.close();
    }, 1000);
  }

  registerHotkeys() {
    // Clear existing hotkeys
    globalShortcut.unregisterAll();

    // Register macro hotkeys
    const macros = this.store.get('macros', []);
    macros.forEach(macro => {
      if (macro.area) { // Only register if area is assigned
        try {
          globalShortcut.register(macro.hotkey, () => {
            this.captureMacro(macro.id);
          });
          console.log(`Registered hotkey: ${macro.hotkey} for macro "${macro.name}"`);
        } catch (error) {
          console.error(`Failed to register hotkey ${macro.hotkey}:`, error);
        }
      }
    });

    console.log(`Total active macros: ${macros.filter(m => m.area).length}/${macros.length}`);
  }
}

// App lifecycle
let ftCapture;

app.whenReady().then(() => {
  ftCapture = new FTCapture();
  ftCapture.init();
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // Keep app running in background
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (ftCapture && ftCapture.settingsWindow === null) {
    ftCapture.openSettings();
  }
});
