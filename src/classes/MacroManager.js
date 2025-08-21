const { globalShortcut } = require('electron');

class MacroManager {
    constructor(ftCapture) {
        this.ftCapture = ftCapture;
    }

    getMacros() {
        return this.ftCapture.store.get('macros', []);
    }

    saveMacro(macro) {
        let macros = this.getMacros();
        const existingIndex = macros.findIndex(m => m.id === macro.id);

        if (existingIndex !== -1) {
            macros[existingIndex] = macro;
        } else {
            macros.push(macro);
        }

        this.ftCapture.store.set('macros', macros);
        this.refreshHotkeys();
        this.ftCapture.trayManager.updateMenu();
    }

    deleteMacro(macroId) {
        let macros = this.getMacros();
        macros = macros.filter(m => m.id !== macroId);
        this.ftCapture.store.set('macros', macros);
        this.refreshHotkeys();
        this.ftCapture.trayManager.updateMenu();
    }

    getMacroById(macroId) {
        const macros = this.getMacros();
        return macros.find(m => m.id === macroId);
    }

    updateMacroArea(macroId, area) {
        let macros = this.getMacros();
        const macroIndex = macros.findIndex(m => m.id === macroId);

        if (macroIndex !== -1) {
            macros[macroIndex].area = area;
            this.ftCapture.store.set('macros', macros);
            this.refreshHotkeys();
            this.ftCapture.trayManager.updateMenu();
            return true;
        }
        return false;
    }

    validateHotkey(hotkey, excludeId = null) {
        const macros = this.getMacros();
        return !macros.some(m => m.hotkey === hotkey && m.id !== excludeId);
    }

    refreshHotkeys() {
        globalShortcut.unregisterAll();

        const macros = this.getMacros();
        macros.forEach(macro => {
            if (macro.area) {
                try {
                    globalShortcut.register(macro.hotkey, () => {
                        this.ftCapture.captureManager.captureMacro(macro.id);
                    });
                } catch (error) {
                    console.error(`Failed to register hotkey ${macro.hotkey}:`, error);
                }
            }
        });
    }

    getStatistics() {
        const macros = this.getMacros();
        return {
            total: macros.length,
            ready: macros.filter(m => m.area).length,
            pending: macros.filter(m => !m.area).length
        };
    }
}

module.exports = MacroManager;
