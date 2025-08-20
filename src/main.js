const { app, BrowserWindow, globalShortcut, Tray, Menu, screen, clipboard, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

class FTCapture {
  constructor() {
    this.store = new Store();
    this.tray = null;
    this.settingsWindow = null;
    this.overlayWindows = [];
    this.areas = this.store.get('areas', []);
    this.hotkeys = this.store.get('hotkeys', {});
    this.isSelecting = false;

    this.setupIPC();
  }

  setupIPC() {
    ipcMain.on('start-area-selection', () => {
      this.startAreaSelection();
    });

    ipcMain.on('area-created', (event, area) => {
      this.areas = this.store.get('areas', []);
      this.closeOverlays();
      this.isSelecting = false;

      // Notify settings window if open
      if (this.settingsWindow) {
        this.settingsWindow.webContents.send('area-selected', area);
      }
    });

    ipcMain.on('area-selection-cancelled', () => {
      this.closeOverlays();
      this.isSelecting = false;
    });

    ipcMain.on('refresh-hotkeys', () => {
      this.hotkeys = this.store.get('hotkeys', {});
      this.registerHotkeys();
    });

    ipcMain.on('test-capture', (event, areaId) => {
      this.captureArea(areaId);
    });
  }

  init() {
    this.createTray();
    this.registerHotkeys();

    // Register global hotkey for area selection
    globalShortcut.register('CommandOrControl+Shift+A', () => {
      this.startAreaSelection();
    });
  }

  createTray() {
    // Create simple tray icon using text
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    this.tray = new Tray(icon);
    this.tray.setTitle('📷');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Settings',
        click: () => this.openSettings()
      },
      {
        label: 'Add New Area (Cmd+Shift+A)',
        click: () => this.startAreaSelection()
      },
      {
        type: 'separator'
      },
      {
        label: `Areas: ${this.areas.length}`,
        enabled: false
      },
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

  async captureArea(areaId) {
    const area = this.areas.find(a => a.id === areaId);
    if (!area) {
      this.showNotification('Area not found!');
      return;
    }

    try {
      // Use desktopCapturer for reliable cross-platform capture
      const { desktopCapturer } = require('electron');

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 } // High resolution
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      // Get the appropriate screen source
      const source = sources[0]; // For now, use primary display
      const fullImage = source.thumbnail;

      // Crop the image to the specified area
      const croppedImage = await this.cropImageAsync(fullImage, area);

      // Copy to clipboard (main feature as requested)
      clipboard.writeImage(croppedImage);

      // Optional: Save to file
      if (area.saveToFile || this.store.get('autoSave', false)) {
        this.saveImage(croppedImage, area);
      }

      // Show notification
      this.showNotification(`"${area.name}" captured to clipboard! 📋`);

    } catch (error) {
      console.error('Capture failed:', error);
      this.showNotification('Capture failed: ' + error.message);
    }
  }

  async cropImageAsync(image, area) {
    // Create a cropped version using nativeImage methods
    const originalSize = image.getSize();
    const scale = originalSize.width / screen.getPrimaryDisplay().size.width;

    // Scale coordinates based on image resolution
    const scaledArea = {
      x: Math.round(area.x * scale),
      y: Math.round(area.y * scale),
      width: Math.round(area.width * scale),
      height: Math.round(area.height * scale)
    };

    // Use nativeImage crop method
    return image.crop({
      x: scaledArea.x,
      y: scaledArea.y,
      width: scaledArea.width,
      height: scaledArea.height
    });
  }

  saveImage(image, area) {
    const fs = require('fs');
    const os = require('os');

    const defaultPath = path.join(os.homedir(), 'Desktop');
    const savePath = this.store.get('savePath', defaultPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `ft-capture-${area.name.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.png`;
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

    // Register area capture hotkeys
    Object.entries(this.hotkeys).forEach(([key, areaId]) => {
      try {
        globalShortcut.register(key, () => {
          this.captureArea(areaId);
        });
        console.log(`Registered hotkey: ${key} for area ${areaId}`);
      } catch (error) {
        console.error(`Failed to register hotkey ${key}:`, error);
      }
    });

    // Re-register area selection hotkey
    globalShortcut.register('CommandOrControl+Shift+A', () => {
      this.startAreaSelection();
    });

    console.log(`Total hotkeys registered: ${Object.keys(this.hotkeys).length + 1}`);
  }

  addArea(area) {
    area.id = Date.now().toString();
    this.areas.push(area);
    this.store.set('areas', this.areas);
  }

  removeArea(areaId) {
    this.areas = this.areas.filter(a => a.id !== areaId);
    this.store.set('areas', this.areas);
  }

  setHotkey(areaId, hotkey) {
    this.hotkeys[hotkey] = areaId;
    this.store.set('hotkeys', this.hotkeys);
    this.registerHotkeys();
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
