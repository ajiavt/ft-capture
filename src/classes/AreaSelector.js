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

        // Close settings window during selection
        this.ftCapture.windowManager.hideSettings();

        // Create overlay window for each display
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
