const { screen } = require('electron');

class AreaSelector {
    constructor(ftCapture) {
        this.ftCapture = ftCapture;
        this.isSelecting = false;
    }

    start() {
        if (this.isSelecting) return;

        this.isSelecting = true;
        const displays = screen.getAllDisplays();

        this.ftCapture.windowManager.hideSettings();

        displays.forEach(display => {
            this.ftCapture.windowManager.createOverlay(display);
        });
    }

    cancel() {
        this.ftCapture.windowManager.closeOverlays();
        this.isSelecting = false;
    }

    complete() {
        this.ftCapture.windowManager.closeOverlays();
        this.isSelecting = false;
    }
}

module.exports = AreaSelector;
