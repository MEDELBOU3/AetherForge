export default class FillTool {
    constructor(app) {
        this.app = app;
        this.cursor = 'cell'; // Bucket-ish cursor
        this.color = [255, 0, 0, 255]; // Red, RGBA
    }

    start(x, y) {
        const layer = this.app.layerManager.getActiveLayer();
        if (!layer) return;

        // Round coordinates to integers
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        
        if (startX < 0 || startX >= layer.canvas.width || startY < 0 || startY >= layer.canvas.height) return;

        const imgData = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
        const pixelData = imgData.data;

        // Get starting color
        const startPos = (startY * layer.canvas.width + startX) * 4;
        const startR = pixelData[startPos];
        const startG = pixelData[startPos + 1];
        const startB = pixelData[startPos + 2];
        const startA = pixelData[startPos + 3];

        // Don't fill if color is identical
        if (startR === this.color[0] && startG === this.color[1] && startB === this.color[2] && startA === this.color[3]) return;

        // Iterative Stack-based Flood Fill (Recursive is too dangerous for JS stack size)
        const stack = [[startX, startY]];
        const width = layer.canvas.width;
        const height = layer.canvas.height;
        
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            const pos = (cy * width + cx) * 4;

            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
            
            // Check if matches start color
            if (pixelData[pos] === startR && 
                pixelData[pos + 1] === startG && 
                pixelData[pos + 2] === startB && 
                pixelData[pos + 3] === startA) {
                
                // Color it
                pixelData[pos] = this.color[0];
                pixelData[pos + 1] = this.color[1];
                pixelData[pos + 2] = this.color[2];
                pixelData[pos + 3] = this.color[3];

                stack.push([cx + 1, cy]);
                stack.push([cx - 1, cy]);
                stack.push([cx, cy + 1]);
                stack.push([cx, cy - 1]);
            }
        }

        layer.ctx.putImageData(imgData, 0, 0);
        this.app.layerManager.renderAll();
    }
}