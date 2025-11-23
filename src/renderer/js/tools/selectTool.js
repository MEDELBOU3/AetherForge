export default class SelectTool {
    constructor(app) {
        this.app = app;
        this.cursor = 'crosshair';

        this.transformBox = null;
        this.state = 'idle'; 
        this.activeHandle = null; 
        
        this.selectionRect = null;
        this.dragStart = { x: 0, y: 0 };
        this.startRect = null; 
        this.floatingContent = null; 
    }

    onActivate() {
        this.createTransformBox();
        this.app.setCursor('crosshair');
    }

    onDeactivate() {
        this.finalizeTransform();
        this.removeTransformBox();
    }

    createTransformBox() {
        this.removeTransformBox();
        this.transformBox = document.createElement('div');
        this.transformBox.className = 'transform-box';
        Object.assign(this.transformBox.style, {
            display: 'none',
            position: 'absolute',
            border: '1px solid #0078d4',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.4)',
            zIndex: '1000',
            pointerEvents: 'none'
        });

        // Add 4 Vertices (Handles)
        ['tl', 'tr', 'bl', 'br'].forEach(pos => {
            const h = document.createElement('div');
            h.className = `transform-handle handle-${pos}`;
            Object.assign(h.style, {
                width: '10px', height: '10px', background: 'white',
                border: '1px solid #0078d4', position: 'absolute',
                pointerEvents: 'auto', zIndex: '1001'
            });

            if(pos.includes('t')) h.style.top = '-6px'; else h.style.bottom = '-6px';
            if(pos.includes('l')) h.style.left = '-6px'; else h.style.right = '-6px';
            h.style.cursor = (pos === 'tl' || pos === 'br') ? 'nwse-resize' : 'nesw-resize';

            // Add listener to the DOM element directly
            h.addEventListener('mousedown', (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                this.startResize(e, pos);
            });

            this.transformBox.appendChild(h);
        });

        this.app.viewport.appendChild(this.transformBox);
    }

    removeTransformBox() {
        if (this.transformBox) {
            this.transformBox.remove();
            this.transformBox = null;
        }
    }

    updateBoxVisuals() {
        if (!this.selectionRect || !this.transformBox) return;
        const screenX = (this.selectionRect.x * this.app.scale) + this.app.panX;
        const screenY = (this.selectionRect.y * this.app.scale) + this.app.panY;
        const screenW = this.selectionRect.w * this.app.scale;
        const screenH = this.selectionRect.h * this.app.scale;

        this.transformBox.style.transform = `translate(${screenX}px, ${screenY}px)`;
        this.transformBox.style.width = `${screenW}px`;
        this.transformBox.style.height = `${screenH}px`;
        this.transformBox.style.display = 'block';
    }

    start(x, y, e) {
        // If user clicked a handle, ToolManager is blocked, so this function WON'T fire.
        // This function ONLY fires when clicking the canvas.

        const layer = this.app.layerManager.getActiveLayer();
        if (!layer) return;

        // 1. If clicking inside existing selection -> MOVE
        if (this.state === 'selected' && this.isPointInSelection(x, y)) {
            this.state = 'moving';
            this.dragStart = { x, y };
            this.startRect = { ...this.selectionRect };
            this.app.setCursor('move');
            if (!this.floatingContent) this.cutPixelsFromLayer(layer);
            return;
        }

        // 2. Start New Selection
        this.finalizeTransform(); // Paste down old selection
        
        this.state = 'selecting';
        this.selectionRect = { x, y, w: 0, h: 0 };
        this.dragStart = { x, y };
        this.updateBoxVisuals();
        this.toggleHandles(false);
    }

    startResize(e, handlePos) {
        // This is called directly from the handle's 'mousedown' listener
        const pos = this.app.toolManager.getMousePos(e);
        
        this.state = 'resizing';
        this.activeHandle = handlePos;
        this.dragStart = { x: pos.x, y: pos.y };
        this.startRect = { ...this.selectionRect };
        
        // Ensure content is "Lifted" before we start stretching it
        const layer = this.app.layerManager.getActiveLayer();
        if (!this.floatingContent && layer) this.cutPixelsFromLayer(layer);
    }

    move(x, y) {
        if (this.state === 'selecting') {
            this.selectionRect.w = x - this.dragStart.x;
            this.selectionRect.h = y - this.dragStart.y;
            this.updateBoxVisuals();
        } 
        else if (this.state === 'moving') {
            const dx = x - this.dragStart.x;
            const dy = y - this.dragStart.y;
            this.selectionRect.x = this.startRect.x + dx;
            this.selectionRect.y = this.startRect.y + dy;
            this.updateBoxVisuals();
            this.renderPreview();
        }
        else if (this.state === 'resizing') {
            const dx = x - this.dragStart.x;
            const dy = y - this.dragStart.y;
            const r = { ...this.startRect };

            if (this.activeHandle.includes('r')) r.w = Math.max(1, r.w + dx);
            if (this.activeHandle.includes('b')) r.h = Math.max(1, r.h + dy);
            if (this.activeHandle.includes('l')) {
                const newW = Math.max(1, r.w - dx);
                r.x = r.x + (r.w - newW);
                r.w = newW;
            }
            if (this.activeHandle.includes('t')) {
                const newH = Math.max(1, r.h - dy);
                r.y = r.y + (r.h - newH);
                r.h = newH;
            }
            this.selectionRect = r;
            this.updateBoxVisuals();
            this.renderPreview();
        }
    }

    end() {
        if (this.state === 'selecting') {
            // Fix negative width/height
            if (this.selectionRect.w < 0) { this.selectionRect.x += this.selectionRect.w; this.selectionRect.w *= -1; }
            if (this.selectionRect.h < 0) { this.selectionRect.y += this.selectionRect.h; this.selectionRect.h *= -1; }

            // CHECK: Is the selection empty/transparent?
            const layer = this.app.layerManager.getActiveLayer();
            if (this.isSelectionEmpty(layer)) {
                // Cancel Selection if it's just air
                this.finalizeTransform();
                return;
            }

            if (this.selectionRect.w < 5 || this.selectionRect.h < 5) {
                this.finalizeTransform();
            } else {
                this.state = 'selected';
                this.toggleHandles(true);
                this.app.setCursor('grab');
            }
        } 
        else {
            this.state = 'selected';
            this.app.setCursor('grab');
        }
        this.activeHandle = null;
    }

    // --- LOGIC HELPERS ---

    // NEW: Checks if the selected area is purely transparent
    isSelectionEmpty(layer) {
        if (!layer || !this.selectionRect) return true;
        
        // Get pixel data of the selection area
        const r = this.selectionRect;
        // Safety check for bounds
        if (r.w <= 0 || r.h <= 0) return true;

        const imgData = layer.ctx.getImageData(r.x, r.y, r.w, r.h);
        const data = imgData.data;

        // Loop through pixels. data[i+3] is Alpha.
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                // Found a non-transparent pixel! Selection is valid.
                return false; 
            }
        }
        
        return true; // All pixels were transparent
    }

    isPointInSelection(x, y) {
        if (!this.selectionRect) return false;
        return (x >= this.selectionRect.x && x <= this.selectionRect.x + this.selectionRect.w && y >= this.selectionRect.y && y <= this.selectionRect.y + this.selectionRect.h);
    }

    cutPixelsFromLayer(layer) {
        const r = this.selectionRect;
        this.floatingContent = document.createElement('canvas');
        this.floatingContent.width = r.w;
        this.floatingContent.height = r.h;
        this.floatingContent.getContext('2d').drawImage(layer.canvas, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
        
        // Clear from original
        layer.ctx.clearRect(r.x, r.y, r.w, r.h);
        
        this.app.layerManager.renderAll();
        this.renderPreview();
    }

    renderPreview() {
        if (!this.floatingContent) return;
        this.app.layerManager.renderAll(); // Clear old frames
        const r = this.selectionRect;
        this.app.ctx.drawImage(this.floatingContent, 0, 0, this.floatingContent.width, this.floatingContent.height, r.x, r.y, r.w, r.h);
    }

    finalizeTransform() {
        if (this.floatingContent && this.selectionRect) {
            const layer = this.app.layerManager.getActiveLayer();
            if (layer) {
                layer.ctx.drawImage(this.floatingContent, 0, 0, this.floatingContent.width, this.floatingContent.height, this.selectionRect.x, this.selectionRect.y, this.selectionRect.w, this.selectionRect.h);
                this.app.layerManager.renderAll();
            }
        }
        this.floatingContent = null;
        this.selectionRect = null;
        if(this.transformBox) this.transformBox.style.display = 'none';
        this.state = 'idle';
        this.app.setCursor('crosshair');
    }

    toggleHandles(show) {
        if (!this.transformBox) return;
        this.transformBox.querySelectorAll('.transform-handle').forEach(h => h.style.display = show ? 'block' : 'none');
    }
}