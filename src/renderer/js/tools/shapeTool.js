export default class ShapeTool {
    constructor(app) {
        this.app = app;
        this.cursor = 'crosshair';
        
        // Default State
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        
        // Properties
        this.shapeType = 'rect';
        this.fillColor = '#000000';
        this.fill = true;
    }

    updateSettings(settings) {
        if(settings.shapeType) this.shapeType = settings.shapeType;
        if(settings.color) this.fillColor = settings.color;
        if(settings.fill !== undefined) this.fill = settings.fill;
    }

    start(x, y) {
        this.startX = x;
        this.startY = y;
        this.currentX = x;
        this.currentY = y;
    }

    move(x, y) {
        this.currentX = x;
        this.currentY = y;
        this.drawPreview();
    }

    end() {
        // Clear Preview
        this.app.uiCtx.clearRect(0, 0, this.app.uiCanvas.width, this.app.uiCanvas.height);
        
        // Draw to Actual Layer
        const layer = this.app.layerManager.getActiveLayer();
        if (layer) {
            this.drawShape(layer.ctx, this.startX, this.startY, this.currentX, this.currentY);
            this.app.layerManager.renderAll();
        }
    }

    drawPreview() {
        const ctx = this.app.uiCtx;
        ctx.clearRect(0, 0, this.app.uiCanvas.width, this.app.uiCanvas.height);
        this.drawShape(ctx, this.startX, this.startY, this.currentX, this.currentY);
    }

    drawShape(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.fillColor; // Or separate stroke color
        ctx.lineWidth = 0;

        const w = x2 - x1;
        const h = y2 - y1;

        if (this.shapeType === 'rect') {
            ctx.rect(x1, y1, w, h);
        } else if (this.shapeType === 'ellipse') {
            // Ellipse requires center x, y, radiusX, radiusY
            const centerX = x1 + w / 2;
            const centerY = y1 + h / 2;
            const radiusX = Math.abs(w / 2);
            const radiusY = Math.abs(h / 2);
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        }

        if (this.fill) ctx.fill();
        // ctx.stroke(); // Optional stroke
    }
}