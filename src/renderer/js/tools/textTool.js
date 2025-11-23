export default class TextTool {
    constructor(app) {
        this.app = app;
        this.cursor = 'text';
        this.activeInput = null;
        
        this.fontSize = 40;
        this.fontFamily = 'Arial';
        this.color = '#000000';
    }

    updateSettings(settings) {
        if(settings.fontSize) this.fontSize = settings.fontSize;
        if(settings.fontFamily) this.fontFamily = settings.fontFamily;
        if(settings.color) this.color = settings.color;
        
        if (this.activeInput) {
            this.activeInput.style.fontSize = `${this.fontSize * this.app.scale}px`;
            this.activeInput.style.fontFamily = this.fontFamily;
            this.activeInput.style.color = this.color;
        }
    }

    start(x, y) {
        // If we already have an active input, finalize it first
        if (this.activeInput) {
            this.confirmText();
            return; // Don't start a new one immediately
        }
        this.createInput(x, y);
    }

    createInput(x, y) {
        const input = document.createElement('textarea');
        
        // Calculate Screen Position
        const screenX = (x * this.app.scale) + this.app.panX;
        const screenY = (y * this.app.scale) + this.app.panY;

        // STYLES
        input.style.position = 'absolute';
        input.style.left = `${screenX}px`;
        input.style.top = `${screenY}px`;
        input.style.fontSize = `${this.fontSize * this.app.scale}px`;
        input.style.fontFamily = this.fontFamily;
        input.style.color = this.color;
        input.style.background = 'rgba(255, 255, 255, 0.8)'; // Light bg to see it
        input.style.border = '1px dashed #0078d4';
        input.style.padding = '2px';
        input.style.zIndex = '9999';
        input.style.overflow = 'hidden';
        input.style.minWidth = '100px';
        input.style.minHeight = '1.5em';
        
        // CRITICAL: Allow interaction
        input.style.userSelect = 'text'; 
        input.style.pointerEvents = 'auto';

        input.dataset.canvasX = x;
        input.dataset.canvasY = y;

        this.app.viewport.appendChild(input);
        
        // FOCUS AND EVENT BLOCKING
        setTimeout(() => input.focus(), 10); // Small delay ensures focus
        
        // STOP PROPGATION: This prevents "Space" from panning and keys from triggering shortcuts
        const stopEvents = (e) => {
            e.stopPropagation();
            // e.stopImmediatePropagation(); // Use this if still having issues
        };
        
        input.addEventListener('mousedown', stopEvents);
        input.addEventListener('keydown', stopEvents);
        input.addEventListener('keyup', stopEvents);
        input.addEventListener('keypress', stopEvents);
        
        // Confirm on Ctrl+Enter or Click away (handled by tool start check)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.confirmText();
            }
            e.stopPropagation();
        });

        this.activeInput = input;
    }

    confirmText() {
        if (!this.activeInput) return;
        
        const text = this.activeInput.value;
        const x = parseFloat(this.activeInput.dataset.canvasX);
        const y = parseFloat(this.activeInput.dataset.canvasY);
        
        this.activeInput.remove();
        this.activeInput = null;
        
        if (!text || text.trim() === '') return;

        const layer = this.app.layerManager.getActiveLayer();
        if (layer) {
            const ctx = layer.ctx;
            ctx.save();
            ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            ctx.fillStyle = this.color;
            ctx.textBaseline = 'top';
            
            const lines = text.split('\n');
            const lineHeight = this.fontSize * 1.2;
            
            lines.forEach((line, i) => {
                ctx.fillText(line, x, y + (i * lineHeight));
            });
            
            ctx.restore();
            this.app.layerManager.renderAll();
        }
    }
}