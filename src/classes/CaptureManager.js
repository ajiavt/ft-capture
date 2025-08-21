const { screen, clipboard, nativeImage, BrowserWindow, Notification } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

class CaptureManager {
    constructor(ftCapture) {
        this.ftCapture = ftCapture;
    }

    async captureMacro(macroId) {
        const macro = this.ftCapture.macroManager.getMacroById(macroId);

        if (!macro) {
            this.showNotification('Macro not found!');
            return;
        }

        if (!macro.area) {
            this.showNotification(`Macro "${macro.name}" has no area assigned!`);
            return;
        }

        try {
            const { desktopCapturer } = require('electron');

            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: screen.getPrimaryDisplay().size
            });

            if (sources.length === 0) {
                throw new Error('No screen sources available');
            }

            const source = sources[0];
            const fullImage = source.thumbnail;
            const croppedImage = await this.cropImageAsync(fullImage, macro.area);

            clipboard.writeImage(croppedImage);

            const autoSave = this.ftCapture.store.get('autoSave', false);
            if (autoSave) {
                this.saveImage(croppedImage, macro);
            }

            this.showSuccessNotification(macro.name);

        } catch (error) {
            console.error('Capture failed:', error);
            this.showNotification('Capture failed: ' + error.message);
        }
    }

    async cropImageAsync(image, area) {
        const originalSize = image.getSize();
        const primaryDisplay = screen.getPrimaryDisplay();
        const scale = originalSize.width / primaryDisplay.size.width;

        const scaledArea = {
            x: Math.round(area.x * scale),
            y: Math.round(area.y * scale),
            width: Math.round(area.width * scale),
            height: Math.round(area.height * scale)
        };

        scaledArea.x = Math.max(0, Math.min(scaledArea.x, originalSize.width - 1));
        scaledArea.y = Math.max(0, Math.min(scaledArea.y, originalSize.height - 1));
        scaledArea.width = Math.min(scaledArea.width, originalSize.width - scaledArea.x);
        scaledArea.height = Math.min(scaledArea.height, originalSize.height - scaledArea.y);

        return image.crop({
            x: scaledArea.x,
            y: scaledArea.y,
            width: scaledArea.width,
            height: scaledArea.height
        });
    }

    saveImage(image, macro) {
        const defaultPath = path.join(os.homedir(), 'Desktop');
        const savePath = this.ftCapture.store.get('savePath', defaultPath);

        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath, { recursive: true });
        }

        const timestamp = Date.now();
        const safeName = macro.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `ft-capture-${safeName}-${timestamp}.png`;
        const filepath = path.join(savePath, filename);

        try {
            fs.writeFileSync(filepath, image.toPNG());
        } catch (error) {
            console.error('Save failed:', error);
        }
    }

    showNotification(message) {
        if (Notification.isSupported()) {
            new Notification({
                title: 'FT Capture',
                body: message,
                icon: path.join(__dirname, '../../assets/icon.png'),
                silent: false
            }).show();
        }
    }

    showSuccessNotification(macroName) {
        this.showScreenshotAreaIndicator(macroName);
        this.showToastNotification(macroName);
        this.showNotification(`"${macroName}" captured! 📋 Ready to paste`);
    }

    showScreenshotAreaIndicator(macroName) {
        const macro = this.ftCapture.macroManager.getMacros().find(m => m.name === macroName);

        if (!macro || !macro.area) return;

        const { x, y, width, height } = macro.area;

        const indicatorWindow = new BrowserWindow({
            x: x - 2,
            y: y - 2,
            width: width + 4,
            height: height + 4,
            frame: false,
            alwaysOnTop: true,
            transparent: true,
            resizable: false,
            movable: false,
            skipTaskbar: true,
            focusable: false,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        const macroColor = macro?.color || '#4CAF50';
        const rgb = this.hexToRgb(macroColor);

        const indicatorHTML = this.generateIndicatorHTML(macroColor, rgb);
        indicatorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(indicatorHTML)}`);
        indicatorWindow.show();

        setTimeout(() => {
            indicatorWindow.close();
        }, 1000);
    }

    showToastNotification(macroName) {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width } = primaryDisplay.workAreaSize;

        const macro = this.ftCapture.macroManager.getMacros().find(m => m.name === macroName);
        const macroColor = macro?.color || '#4CAF50';
        const rgb = this.hexToRgb(macroColor);

        const toastWindow = new BrowserWindow({
            x: width - 350,
            y: 20,
            width: 320,
            height: 100,
            frame: false,
            alwaysOnTop: true,
            transparent: true,
            resizable: false,
            movable: false,
            skipTaskbar: true,
            focusable: false,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        const toastHTML = this.generateToastHTML(macroName, macroColor, rgb);
        toastWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(toastHTML)}`);
        toastWindow.show();

        setTimeout(() => {
            toastWindow.close();
        }, 1000);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 76, g: 175, b: 80 };
    }

    generateIndicatorHTML(macroColor, rgb) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
                    .area-indicator {
                        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                        border: 3px dashed ${macroColor}; border-radius: 4px;
                        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8), 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6);
                        animation: areaHighlight 1.0s ease-out; pointer-events: none;
                    }
                    @keyframes areaHighlight {
                        0% { opacity: 0; transform: scale(1.1); }
                        20% { opacity: 1; transform: scale(1); }
                        80% { opacity: 1; transform: scale(1); }
                        100% { opacity: 0; transform: scale(0.98); }
                    }
                </style>
            </head>
            <body><div class="area-indicator"></div></body>
            </html>
        `;
    }

    generateToastHTML(macroName, macroColor, rgb) {
        const darkerColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body { width: 100%; height: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                    body {
                        background: linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95) 0%, rgba(${Math.max(0, rgb.r - 10)}, ${Math.max(0, rgb.g - 10)}, ${Math.max(0, rgb.b - 10)}, 0.95) 100%);
                        backdrop-filter: blur(20px); border: 1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3); border-radius: 12px;
                        box-shadow: 0 8px 32px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2); display: flex; align-items: center; padding: 16px 20px;
                    }
                    .icon-container {
                        width: 48px; height: 48px; background: linear-gradient(135deg, ${macroColor} 0%, ${darkerColor} 100%);
                        border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 14px;
                        box-shadow: 0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4); flex-shrink: 0;
                    }
                    .icon { font-size: 24px; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1)); }
                    .content { flex: 1; min-width: 0; }
                    .title { font-size: 15px; font-weight: 600; color: white; margin-bottom: 2px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); }
                    .subtitle { font-size: 13px; color: rgba(255, 255, 255, 0.9); font-weight: 500; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); }
                    .check-mark {
                        width: 20px; height: 20px; background: rgba(255, 255, 255, 0.9); border-radius: 50%;
                        display: flex; align-items: center; justify-content: center; margin-left: 12px;
                        animation: checkPop 1.0s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0s both;
                    }
                    .check-mark::after { content: '✓'; color: ${macroColor}; font-size: 12px; font-weight: bold; }
                    @keyframes checkPop {
                        0% { transform: scale(0); opacity: 0; }
                        15% { transform: scale(1.1); opacity: 1; }
                        100% { transform: scale(0.8); opacity: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="icon-container"><div class="icon">📸</div></div>
                <div class="content">
                    <div class="title">${macroName} Captured</div>
                    <div class="subtitle">Screenshot area ready to paste</div>
                </div>
                <div class="check-mark"></div>
            </body>
            </html>
        `;
    }
}

module.exports = CaptureManager;
