const { ipcMain, dialog } = require('electron');

class IPCManager {
    constructor(ftCapture) {
        this.ftCapture = ftCapture;
        this.setupHandlers();
    }

    setupHandlers() {
        ipcMain.on('debug-log', (event, message) => {
            console.log('[OVERLAY]', message);
        });

        ipcMain.on('start-area-selection', () => {
            this.ftCapture.areaSelector.start();
        });

        ipcMain.on('macro-area-assigned', (event, macroId, area) => {
            this.ftCapture.handleAreaAssigned(macroId, area);
        });

        ipcMain.on('area-selection-cancelled', () => {
            this.ftCapture.areaSelector.cancel();
        });

        ipcMain.on('refresh-hotkeys', () => {
            this.ftCapture.macroManager.refreshHotkeys();
            this.ftCapture.trayManager.updateMenu();
        });

        ipcMain.on('test-capture', (event, macroId) => {
            this.ftCapture.captureManager.captureMacro(macroId);
        });

        ipcMain.handle('dialog:openFile', async (event, options) => {
            const result = await dialog.showOpenDialog(this.ftCapture.windowManager.settingsWindow, {
                properties: ['openFile', 'multiSelections'],
                ...options
            });
            return result.filePaths;
        });

        ipcMain.handle('dialog:openDirectory', async (event, options) => {
            const result = await dialog.showOpenDialog(this.ftCapture.windowManager.settingsWindow, {
                properties: ['openDirectory'],
                ...options
            });
            return result.filePaths;
        });
    }

    removeAllHandlers() {
        ipcMain.removeAllListeners('debug-log');
        ipcMain.removeAllListeners('start-area-selection');
        ipcMain.removeAllListeners('macro-area-assigned');
        ipcMain.removeAllListeners('area-selection-cancelled');
        ipcMain.removeAllListeners('refresh-hotkeys');
        ipcMain.removeAllListeners('test-capture');
        ipcMain.removeHandler('dialog:openFile');
        ipcMain.removeHandler('dialog:openDirectory');
    }
}

module.exports = IPCManager;
