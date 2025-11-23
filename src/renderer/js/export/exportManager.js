class ExportManager {
    constructor(canvas, layerManager) {
        this.canvas = canvas;
        this.layerManager = layerManager;
    }

    async exportImage(format) {
        const finalCanvas = this.layerManager.getAllLayersAsImage();
        let dataURL;

        switch (format.toLowerCase()) {
            case 'png':
                dataURL = finalCanvas.toDataURL('image/png');
                break;
            case 'jpg':
            case 'jpeg':
                dataURL = finalCanvas.toDataURL('image/jpeg', 0.95);
                break;
            case 'svg':
                // Simple SVG export - creates an SVG with embedded image
                dataURL = this.exportAsSVG(finalCanvas);
                break;
            default:
                dataURL = finalCanvas.toDataURL('image/png');
        }

        if (window.electronAPI) {
            // Electron environment - use native file dialog
            const result = await window.electronAPI.saveFile(dataURL);
            if (result.success) {
                alert(`File saved successfully to: ${result.path}`);
            } else if (!result.canceled) {
                alert(`Error saving file: ${result.error}`);
            }
        } else {
            // Browser environment - download directly
            this.downloadDataURL(dataURL, `image.${format}`);
        }
    }

    exportAsSVG(canvas) {
        const dataURL = canvas.toDataURL('image/png');
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
    <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataURL}"/>
</svg>`;
        
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    downloadDataURL(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async openImage() {
        if (window.electronAPI) {
            const result = await window.electronAPI.openFile();
            if (result.success) {
                return result.data;
            }
            return null;
        } else {
            // Browser environment
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            resolve(event.target.result);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        resolve(null);
                    }
                };
                
                input.click();
            });
        }
    }

    loadImageToCanvas(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const activeLayer = this.layerManager.getActiveLayer();
                if (activeLayer) {
                    activeLayer.ctx.drawImage(img, 0, 0);
                    this.layerManager.render();
                    if (window.historyManager) {
                        window.historyManager.saveState('Load Image');
                    }
                    resolve();
                } else {
                    reject(new Error('No active layer'));
                }
            };
            img.onerror = reject;
            img.src = dataURL;
        });
    }
}