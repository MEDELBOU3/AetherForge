export default class Layer {
    constructor(width, height, name = 'New Layer') {
        this.name = name;
        this.visible = true;
        this.locked = false;
        this.opacity = 1.0;
        this.blendMode = 'source-over';

        // Each layer has its own off-screen canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw this layer onto a target context (usually the main display canvas)
    render(targetCtx) {
        if (!this.visible) return;
        
        targetCtx.globalAlpha = this.opacity;
        targetCtx.globalCompositeOperation = this.blendMode;
        targetCtx.drawImage(this.canvas, 0, 0);
        
        // Reset context to default
        targetCtx.globalAlpha = 1.0;
        targetCtx.globalCompositeOperation = 'source-over';
    }
}