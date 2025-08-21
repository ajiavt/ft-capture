const { app, globalShortcut } = require('electron');
const Store = require('electron-store');

// Import our modular classes
const TrayManager = require('./classes/TrayManager');
const WindowManager = require('./classes/WindowManager');
const IPCManager = require('./classes/IPCManager');
const MacroManager = require('./classes/MacroManager');
const AreaSelector = require('./classes/AreaSelector');
const CaptureManager = require('./classes/CaptureManager');

class FTCapture {
  constructor() {
    this.store = new Store();

    // Initialize all managers
    this.trayManager = new TrayManager(this);
    this.windowManager = new WindowManager(this);
    this.ipcManager = new IPCManager(this);
    this.macroManager = new MacroManager(this);
    this.areaSelector = new AreaSelector(this);
    this.captureManager = new CaptureManager(this);
  }

  init() {
    this.trayManager.create();
    this.macroManager.refreshHotkeys();
  }

  // Simplified public interface methods
  openSettings() {
    this.windowManager.openSettings();
  }

  captureMacro(macroId) {
    this.captureManager.captureMacro(macroId);
  }

  handleAreaAssigned(macroId, area) {
    console.log('=== Handling area assignment ===');
    console.log('Macro ID:', macroId);
    console.log('Area data:', area);

    // Update macro with new area
    const success = this.macroManager.updateMacroArea(macroId, area);

    if (success) {
      console.log('Area successfully assigned to macro');

      // Complete area selection
      this.areaSelector.complete();

      // Update UI
      this.trayManager.updateMenu();
      this.windowManager.notifySettingsWindow('area-assigned');

      console.log('=== Area assignment completed ===');
    } else {
      console.error('Failed to assign area to macro');
    }
  }

  cleanup() {
    globalShortcut.unregisterAll();
    this.ipcManager.removeAllHandlers();
    this.windowManager.closeAll();
    this.trayManager.destroy();
  }
}

// App lifecycle management
let ftCapture;

app.whenReady().then(() => {
  ftCapture = new FTCapture();
  ftCapture.init();
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // Keep app running in background
});

app.on('will-quit', () => {
  if (ftCapture) {
    ftCapture.cleanup();
  }
});

app.on('activate', () => {
  if (ftCapture && ftCapture.windowManager.settingsWindow === null) {
    ftCapture.openSettings();
  }
});
