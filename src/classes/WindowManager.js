const { BrowserWindow } = require('electron');

class WindowManager {
    constructor(ftCapture) {
        this.ftCapture = ftCapture;
        this.settingsWindow = null;
        this.overlayWindows = [];
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
        return overlay;
    }

    closeOverlays() {
        this.overlayWindows.forEach(overlay => {
            if (!overlay.isDestroyed()) {
                overlay.close();
            }
        });
        this.overlayWindows = [];

        if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
            this.settingsWindow.show();
        }
    }

    hideSettings() {
        if (this.settingsWindow) {
            this.settingsWindow.hide();
        }
    }

    showSettings() {
        if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
            this.settingsWindow.show();
        }
    }

    notifySettingsWindow(event, data = null) {
        if (this.settingsWindow) {
            this.settingsWindow.webContents.send(event, data);
        }
    }

    closeAll() {
        this.closeOverlays();
        if (this.settingsWindow) {
            this.settingsWindow.close();
            this.settingsWindow = null;
        }
    }
}

module.exports = WindowManager;
