class CanvasController {
    constructor(canvasId, width = 800, height = 600) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Initialize white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, width, height);

        // Update status bar
        this.updateCanvasSize();
    }

    resize(width, height) {
        // Save current content
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Resize canvas
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Restore content
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.putImageData(imageData, 0, 0);
        
        this.updateCanvasSize();
    }

    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateCanvasSize() {
        const canvasSizeElement = document.getElementById('canvas-size');
        if (canvasSizeElement) {
            canvasSizeElement.textContent = `Canvas: ${this.canvas.width} x ${this.canvas.height}`;
        }
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }
}