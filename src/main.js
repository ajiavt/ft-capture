const { app, globalShortcut } = require('electron');
const Store = require('electron-store');

const TrayManager = require('./classes/TrayManager');
const WindowManager = require('./classes/WindowManager');
const IPCManager = require('./classes/IPCManager');
const MacroManager = require('./classes/MacroManager');
const AreaSelector = require('./classes/AreaSelector');
const CaptureManager = require('./classes/CaptureManager');

class FTCapture {
  constructor() {
    this.store = new Store();

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

  openSettings() {
    this.windowManager.openSettings();
  }

  captureMacro(macroId) {
    this.captureManager.captureMacro(macroId);
  }

  handleAreaAssigned(macroId, area) {
    const success = this.macroManager.updateMacroArea(macroId, area);

    if (success) {
      this.areaSelector.complete();
      this.trayManager.updateMenu();
      this.windowManager.notifySettingsWindow('area-assigned');
    }
  }

  cleanup() {
    globalShortcut.unregisterAll();
    this.ipcManager.removeAllHandlers();
    this.windowManager.closeAll();
    this.trayManager.destroy();
  }
}

let ftCapture;

app.whenReady().then(() => {
  ftCapture = new FTCapture();
  ftCapture.init();
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
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
