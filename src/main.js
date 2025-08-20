const { app, BrowserWindow, globalShortcut, Tray, Menu, screen, clipboard, nativeImage, ipcMain, Notification } = require('electron');
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
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'FT Capture Settings'
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
      this.showNotification(`"${macro.name}" captured! 📋 Ready to paste`);

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
    if (Notification.isSupported()) {
      new Notification({
        title: 'FT Capture',
        body: message,
        silent: false
      }).show();
    }
    console.log(message);
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
