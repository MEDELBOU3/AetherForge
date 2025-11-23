export default class BrushTool {
    constructor(app) {
        this.app = app;
        this.cursor = 'crosshair';
        this.color = '#000000';
        this.size = 5;
        this.lastX = 0;
        this.lastY = 0;
    }

    start(x, y) {
        const layer = this.app.layerManager.getActiveLayer();
        if (!layer || !layer.visible || layer.locked) return;

        this.lastX = x;
        this.lastY = y;
        
        layer.ctx.beginPath();
        layer.ctx.moveTo(x, y);
        
        // Draw a dot if they just click
        layer.ctx.fillStyle = this.color;
        layer.ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
        layer.ctx.fill();
        
        this.app.layerManager.renderAll();
    }

    move(x, y) {
        const layer = this.app.layerManager.getActiveLayer();
        if (!layer || !layer.visible || layer.locked) return;

        layer.ctx.beginPath();
        layer.ctx.strokeStyle = this.color;
        layer.ctx.lineWidth = this.size;
        layer.ctx.lineCap = 'round';
        layer.ctx.lineJoin = 'round';
        
        layer.ctx.moveTo(this.lastX, this.lastY);
        layer.ctx.lineTo(x, y);
        layer.ctx.stroke();

        this.lastX = x;
        this.lastY = y;

        // Request composite (draw layers to screen)
        this.app.layerManager.renderAll();
    }

    end() {
        // In the future, this is where we push to History (Undo/Redo)
        console.log("Stroke finished");
    }
}