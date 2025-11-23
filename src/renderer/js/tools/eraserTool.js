export default class EraserTool {
    constructor(app) {
        this.app = app;
        this.size = 20; // Eraser is usually bigger by default
        this.lastX = 0;
        this.lastY = 0;
    }

    start(x, y) {
        const layer = this.app.layerManager.getActiveLayer();
        if (!layer || !layer.visible || layer.locked) return;

        this.lastX = x;
        this.lastY = y;
        this.erase(x, y);
    }

    move(x, y) {
        const layer = this.app.layerManager.getActiveLayer();
        if (!layer || !layer.visible || layer.locked) return;
        
        // Interpolate for smooth lines
        this.eraseLine(this.lastX, this.lastY, x, y);
        this.lastX = x;
        this.lastY = y;
    }

    end() {
        // Save history state here later
    }

    erase(x, y) {
        const layer = this.app.layerManager.getActiveLayer();
        
        // 'destination-out' removes pixels, making them transparent
        layer.ctx.globalCompositeOperation = 'destination-out';
        
        layer.ctx.beginPath();
        layer.ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
        layer.ctx.fill();
        
        // Reset to normal
        layer.ctx.globalCompositeOperation = 'source-over';
        
        this.app.layerManager.renderAll();
    }

    eraseLine(x1, y1, x2, y2) {
        const layer = this.app.layerManager.getActiveLayer();
        layer.ctx.globalCompositeOperation = 'destination-out';
        
        layer.ctx.beginPath();
        layer.ctx.lineWidth = this.size;
        layer.ctx.lineCap = 'round';
        layer.ctx.lineJoin = 'round';
        layer.ctx.moveTo(x1, y1);
        layer.ctx.lineTo(x2, y2);
        layer.ctx.stroke();
        
        layer.ctx.globalCompositeOperation = 'source-over';
        this.app.layerManager.renderAll();
    }
}