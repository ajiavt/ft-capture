const { ipcMain, dialog } = require('electron');

class IPCManager {
    constructor(ftCapture) {
        this.ftCapture = ftCapture;
        this.setupHandlers();
    }

    setupHandlers() {
        // Debug log handler
        ipcMain.on('debug-log', (event, message) => {
            console.log('[OVERLAY]', message);
        });

        // Area selection handlers
        ipcMain.on('start-area-selection', () => {
            console.log('IPC: start-area-selection received');
            this.ftCapture.areaSelector.start();
        });

        ipcMain.on('macro-area-assigned', (event, macroId, area) => {
            console.log('=== IPC: macro-area-assigned received ===');
            console.log('Macro ID:', macroId);
            console.log('Area data:', area);

            this.ftCapture.handleAreaAssigned(macroId, area);
        });

        ipcMain.on('area-selection-cancelled', () => {
            this.ftCapture.areaSelector.cancel();
        });

        // Macro management handlers
        ipcMain.on('refresh-hotkeys', () => {
            this.ftCapture.macroManager.refreshHotkeys();
            this.ftCapture.trayManager.updateMenu();
        });

        ipcMain.on('test-capture', (event, macroId) => {
            this.ftCapture.captureManager.captureMacro(macroId);
        });

        // Dialog handlers
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
