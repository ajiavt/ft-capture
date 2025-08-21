class SettingsManager {
    constructor() {
        this.ipcRenderer = require('electron').ipcRenderer;
        this.Store = require('electron-store');
        this.store = new this.Store();
        this.currentEditingMacro = null;
        this.detectingHotkey = false;

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadMacros();
            this.loadSettings();
            this.setupColorPresets();
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Modal event handlers
        window.onclick = (event) => {
            const modal = document.getElementById('macroModal');
            if (event.target == modal) {
                this.hideMacroModal();
            }
        };

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.detectingHotkey) {
                this.hideMacroModal();
            }
        });

        // Hotkey detection
        document.getElementById('macro-hotkey').addEventListener('click', () => {
            this.startHotkeyDetection();
        });

        document.addEventListener('keydown', (event) => {
            if (this.detectingHotkey) {
                this.handleHotkeyInput(event);
            }
        });

        document.addEventListener('click', (event) => {
            if (this.detectingHotkey && event.target.id !== 'macro-hotkey') {
                this.cancelHotkeyDetection();
            }
        });

        // Listen for area selection completion
        this.ipcRenderer.on('area-assigned', () => {
            this.loadMacros();
        });
    }

    loadMacros() {
        const macros = this.store.get('macros', []);
        const macrosList = document.getElementById('macros-list');

        this.updateStatistics(macros);

        if (macros.length === 0) {
            macrosList.innerHTML = this.getEmptyStateHTML();
            return;
        }

        macrosList.innerHTML = macros.map(macro => this.getMacroItemHTML(macro)).join('');
    }

    getMacroItemHTML(macro) {
        return `
            <div class="macro-item">
                <div class="macro-info">
                    <div class="macro-color-indicator" style="background: ${macro.color || '#00b894'};"></div>
                    <div class="macro-details">
                        <div class="macro-name">${macro.name}</div>
                        <div class="macro-hotkey">${macro.hotkey}</div>
                        <div class="macro-area ${macro.area ? 'area-assigned' : 'area-pending'}">
                            ${macro.area ?
                                `Area: ${macro.area.x}, ${macro.area.y} (${macro.area.width} × ${macro.area.height})` :
                                'No area assigned'
                            }
                        </div>
                    </div>
                </div>
                <div class="macro-actions">
                    <button class="btn btn-ghost" onclick="settingsManager.editMacro('${macro.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${macro.area ?
                        `<button class="btn btn-warning" onclick="settingsManager.setMacroArea('${macro.id}')">
                            <i class="fas fa-sync-alt"></i> Change
                        </button>` :
                        `<button class="btn btn-primary" onclick="settingsManager.setMacroArea('${macro.id}')">
                            <i class="fas fa-crosshairs"></i> Set Area
                        </button>`
                    }
                    <button class="btn btn-secondary" onclick="settingsManager.testMacro('${macro.id}')">
                        <i class="fas fa-play"></i> Test
                    </button>
                    <button class="btn btn-danger" onclick="settingsManager.removeMacro('${macro.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📷</div>
                <p>No macros created yet.<br>Click "Add New Macro" to get started.</p>
            </div>
        `;
    }

    updateStatistics(macros) {
        const totalMacros = macros.length;
        const readyMacros = macros.filter(m => m.area).length;

        document.getElementById('total-macros').textContent = totalMacros;
        document.getElementById('ready-macros').textContent = readyMacros;
    }

    loadSettings() {
        const savePath = this.store.get('savePath', '');
        const autoSave = this.store.get('autoSave', true);
        document.getElementById('save-path').value = savePath;
        document.getElementById('auto-save').checked = autoSave;
    }

    setupColorPresets() {
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                document.getElementById('macro-color').value = color;
                document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
                preset.classList.add('selected');
            });
        });
    }

    showAddMacroModal() {
        this.currentEditingMacro = null;
        document.getElementById('modal-title').textContent = 'Add New Macro';
        document.getElementById('macro-name').value = '';
        document.getElementById('macro-hotkey').value = '';
        document.getElementById('macro-color').value = '#4CAF50';
        document.getElementById('save-macro-btn').textContent = 'Save Macro';
        document.getElementById('save-macro-btn').disabled = true;
        document.getElementById('macroModal').style.display = 'block';

        document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
        document.querySelector('.color-preset[data-color="#4CAF50"]').classList.add('selected');
    }

    editMacro(macroId) {
        const macros = this.store.get('macros', []);
        const macro = macros.find(m => m.id === macroId);

        if (!macro) return;

        this.currentEditingMacro = macro;
        document.getElementById('modal-title').textContent = 'Edit Macro';
        document.getElementById('macro-name').value = macro.name;
        document.getElementById('macro-hotkey').value = macro.hotkey;
        document.getElementById('macro-color').value = macro.color || '#4CAF50';
        document.getElementById('save-macro-btn').textContent = 'Update Macro';
        document.getElementById('save-macro-btn').disabled = false;
        document.getElementById('macroModal').style.display = 'block';

        document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
        const selectedPreset = document.querySelector(`[data-color="${macro.color || '#4CAF50'}"]`);
        if (selectedPreset) selectedPreset.classList.add('selected');
    }

    hideMacroModal() {
        document.getElementById('macroModal').style.display = 'none';
        this.currentEditingMacro = null;
        this.detectingHotkey = false;
        document.getElementById('macro-hotkey').classList.remove('listening');
    }

    saveMacro() {
        const name = document.getElementById('macro-name').value.trim();
        const hotkey = document.getElementById('macro-hotkey').value.trim();
        const color = document.getElementById('macro-color').value;

        if (!name || !hotkey) {
            alert('Please fill in both name and hotkey');
            return;
        }

        let macros = this.store.get('macros', []);

        if (this.currentEditingMacro) {
            const index = macros.findIndex(m => m.id === this.currentEditingMacro.id);
            if (index !== -1) {
                const conflictingMacro = macros.find(m => m.hotkey === hotkey && m.id !== this.currentEditingMacro.id);
                if (conflictingMacro) {
                    alert('Hotkey already exists! Please choose a different one.');
                    return;
                }

                macros[index] = {
                    ...macros[index],
                    name: name,
                    hotkey: hotkey,
                    color: color
                };
            }
        } else {
            if (macros.some(m => m.hotkey === hotkey)) {
                alert('Hotkey already exists! Please choose a different one.');
                return;
            }

            const macro = {
                id: Date.now().toString(),
                name: name,
                hotkey: hotkey,
                color: color,
                area: null
            };
            macros.push(macro);
        }

        this.store.set('macros', macros);
        this.hideMacroModal();
        this.loadMacros();
        this.ipcRenderer.send('refresh-hotkeys');
    }

    setMacroArea(macroId) {
        this.store.set('currentMacroId', macroId);
        this.ipcRenderer.send('start-area-selection');
        window.close();
    }

    testMacro(macroId) {
        const macros = this.store.get('macros', []);
        const macro = macros.find(m => m.id === macroId);
        if (!macro || !macro.area) {
            alert('Please set an area for this macro first');
            return;
        }
        this.ipcRenderer.send('test-capture', macroId);
    }

    removeMacro(macroId) {
        if (confirm('Are you sure you want to delete this macro?')) {
            let macros = this.store.get('macros', []);
            macros = macros.filter(m => m.id !== macroId);
            this.store.set('macros', macros);
            this.loadMacros();
            this.ipcRenderer.send('refresh-hotkeys');
        }
    }

    browseSavePath() {
        this.ipcRenderer.invoke('dialog:openDirectory').then(result => {
            if (result && result[0]) {
                document.getElementById('save-path').value = result[0];
                this.store.set('savePath', result[0]);
            }
        }).catch(error => {
            console.error('Failed to open directory dialog:', error);
            alert('Unable to open folder dialog. Please try again.');
        });
    }

    toggleAutoSave() {
        const autoSave = document.getElementById('auto-save').checked;
        this.store.set('autoSave', autoSave);
    }

    startHotkeyDetection() {
        this.detectingHotkey = true;
        const input = document.getElementById('macro-hotkey');
        input.value = 'Listening... Press your key combination';
        input.classList.add('listening');
        document.getElementById('save-macro-btn').disabled = true;
    }

    handleHotkeyInput(event) {
        event.preventDefault();
        event.stopPropagation();

        if (['Control', 'Shift', 'Alt', 'Meta', 'Cmd', 'Command'].includes(event.key)) {
            return;
        }

        const modifierKeys = [];
        if (event.ctrlKey) modifierKeys.push('CommandOrControl');
        if (event.shiftKey) modifierKeys.push('Shift');
        if (event.altKey) modifierKeys.push('Alt');
        if (event.metaKey && !event.ctrlKey) modifierKeys.push('CommandOrControl');

        let actualKey = event.key;
        if (event.code.startsWith('Digit')) {
            actualKey = event.code.replace('Digit', '');
        } else if (event.code.startsWith('Key')) {
            actualKey = event.code.replace('Key', '');
        } else if (event.code.startsWith('F') && event.code.length <= 3) {
            actualKey = event.code;
        }

        const hotkeyParts = [...modifierKeys, actualKey];
        const fullHotkey = hotkeyParts.join('+');

        if (modifierKeys.length > 0 && actualKey && actualKey !== 'Unidentified') {
            const input = document.getElementById('macro-hotkey');
            input.value = fullHotkey;
            input.classList.remove('listening');
            document.getElementById('save-macro-btn').disabled = false;
            this.detectingHotkey = false;
        } else {
            document.getElementById('macro-hotkey').value = 'Invalid combination. Try again...';
            setTimeout(() => {
                document.getElementById('macro-hotkey').value = 'Listening... Press your key combination';
            }, 1000);
        }
    }

    cancelHotkeyDetection() {
        this.detectingHotkey = false;
        document.getElementById('macro-hotkey').value = '';
        document.getElementById('macro-hotkey').classList.remove('listening');
        document.getElementById('save-macro-btn').disabled = true;
    }
}

// Global functions for onclick handlers
function showAddMacroModal() {
    settingsManager.showAddMacroModal();
}

function saveMacro() {
    settingsManager.saveMacro();
}

function hideMacroModal() {
    settingsManager.hideMacroModal();
}

function browseSavePath() {
    settingsManager.browseSavePath();
}

function toggleAutoSave() {
    settingsManager.toggleAutoSave();
}

// Initialize settings manager
const settingsManager = new SettingsManager();
