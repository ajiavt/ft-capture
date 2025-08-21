const { Tray, Menu, nativeImage } = require('electron');

class TrayManager {
    constructor(ftCapture) {
        this.ftCapture = ftCapture;
        this.tray = null;
    }

    create() {
        const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
        this.tray = new Tray(icon);
        this.tray.setTitle('📷');
        this.updateMenu();
    }

    updateMenu() {
        const macros = this.ftCapture.store.get('macros', []);
        const macroMenuItems = macros.length > 0 ? [
            { type: 'separator' },
            { label: 'Quick Capture:', enabled: false },
            ...macros.filter(m => m.area).map(macro => ({
                label: `${macro.name} (${macro.hotkey})`,
                click: () => this.ftCapture.captureMacro(macro.id)
            }))
        ] : [];

        const contextMenu = Menu.buildFromTemplate([
            { label: 'Settings', click: () => this.ftCapture.openSettings() },
            { type: 'separator' },
            { label: `Macros: ${macros.length}`, enabled: false },
            { label: `Ready: ${macros.filter(m => m.area).length}`, enabled: false },
            ...macroMenuItems,
            { type: 'separator' },
            { label: 'Quit', click: () => require('electron').app.quit() }
        ]);

        this.tray.setContextMenu(contextMenu);
    }

    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
    }
}

module.exports = TrayManager;
