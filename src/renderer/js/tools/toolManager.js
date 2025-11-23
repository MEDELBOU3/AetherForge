import PropertiesPanel from '../ui/propertiesPanel.js';

export default class ToolManager {
    constructor(app) {
        this.app = app;
        this.canvas = app.canvas;
        this.layerManager = app.layerManager;
        
        // 1. Initialize Properties Panel
        this.propertiesPanel = new PropertiesPanel(this);

        // State
        this.activeTool = 'select';
        this.clipboard = null; 

        // Default Settings
        this.currentBrushType = 'Pencil';
        this.defaultColor = '#000000';
        this.shapeProps = {
            fill: '#0078d4',
            stroke: '#000000',
            strokeWidth: 2
        };

        this.initToolbar();
        this.initGlobalHotkeys();
        this.initMediaLoaders(); // Combined loaders
        this.initCanvasListeners(); // Needed for Text click placement

        // Start
        this.setTool('select');
    }

    // =========================================================
    // MAIN LOGIC: setTool(tool)
    // =========================================================
    setTool(tool) {
        this.activeTool = tool;

        // 1. Update UI (Visual Feedback)
        document.querySelectorAll('.tool-btn, .tool').forEach(btn => btn.classList.remove('active'));
        
        // Try to find button by data-tool OR title (to support your HTML)
        const activeBtn = document.querySelector(`[data-tool="${tool}"]`) 
                       || document.querySelector(`[title*="${tool}" i]`);
        if (activeBtn) activeBtn.classList.add('active');

        // 2. Reset Fabric State
        this.canvas.isDrawingMode = false;
        this.canvas.selection = true;
        this.canvas.defaultCursor = 'default';

        // 3. Deselect Objects (Photoshop Style)
        // We must deselect so the Properties Panel shows "Tool Options" instead of "Image Options"
        if (tool !== 'select' && tool !== 'eraser') {
            this.canvas.discardActiveObject();
            this.canvas.requestRenderAll();
        }

        // 4. Handle Tool Logic
        if (tool === 'select') {
            // Default fabric behavior
        } 
        else if (tool === 'brush') {
            this.canvas.isDrawingMode = true;
            this.setBrushType(this.currentBrushType);
        }
        else if (tool === 'media') {
            // Just context switch for Properties Panel
        }
        else if (tool === 'shape') {
            // Enter Shape Mode (Cursor changes)
            this.canvas.selection = false; // Disable drag selection
            this.canvas.defaultCursor = 'crosshair';
            // Note: Shapes are added via Properties Panel buttons, not drawing on canvas yet
        }
        else if (tool === 'text') {
            // Set cursor to Text (I-Beam)
            this.canvas.selection = false;
            this.canvas.defaultCursor = 'text';
            // We wait for user to CLICK canvas to add text (see initCanvasListeners)
        }
        else if (tool === 'eraser') {
            this.deleteSelection();
            this.setTool('select'); // Switch back immediately
            return; 
        }

        // 5. Update the Right Sidebar
        if (this.propertiesPanel) {
            this.propertiesPanel.render();
        }
    }

    // =========================================================
    // INITIALIZATION METHODS
    // =========================================================

    initToolbar() {
        document.querySelectorAll('.tool-btn, .tool').forEach(btn => {
            // Skip utility buttons
            if (btn.id === 'btn-undo' || btn.id === 'btn-download') return;

            btn.addEventListener('click', () => {
                const tool = btn.getAttribute('data-tool');
                if (tool) this.setTool(tool);
            });
        });

        const dlBtn = document.getElementById('btn-download');
        if (dlBtn) dlBtn.onclick = () => this.download();
    }

    initCanvasListeners() {
        // Handle "Click to Add Text"
        this.canvas.on('mouse:down', (opt) => {
            if (this.activeTool === 'text') {
                const pointer = this.canvas.getPointer(opt.e);
                this.addText(pointer.x, pointer.y);
                this.setTool('select'); // Auto-switch back to select
            }
        });
    }

    initGlobalHotkeys() {
        document.addEventListener('keydown', (e) => {
            const active = this.canvas.getActiveObject();
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            
            if (isInput) return; // Don't trigger shortcuts when typing in inputs

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (active && active.isEditing) return; // Don't delete while typing text
                this.deleteSelection();
            }
            if (e.ctrlKey && e.key === 'c') this.copy();
            if (e.ctrlKey && e.key === 'v') this.paste();
            if (e.ctrlKey && e.key === 'g') { e.preventDefault(); this.groupSelection(); }
            if (e.ctrlKey && e.key === 'u') { e.preventDefault(); this.ungroupSelection(); }
        });
    }

    initMediaLoaders() {
        // Image Loader
        const imgInput = document.getElementById('img-upload');
        if (imgInput) {
            imgInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (f) => {
                    fabric.Image.fromURL(f.target.result, (img) => {
                        if (img.width > 800) img.scaleToWidth(800);
                        this.canvas.add(img);
                        this.canvas.setActiveObject(img);
                        this.layerManager.updateLayerList();
                        this.setTool('select');
                        imgInput.value = '';
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        // Video Loader
        const vidInput = document.getElementById('video-upload');
        if (vidInput) {
            vidInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                const videoEl = document.createElement('video');
                videoEl.src = url;
                videoEl.muted = true; videoEl.loop = true; videoEl.play();

                const vidInstance = new fabric.Image(videoEl, { left: 100, top: 100, objectCaching: false });
                this.canvas.add(vidInstance);
                this.canvas.setActiveObject(vidInstance);
                
                // Video Render Loop
                const renderLoop = () => {
                    this.canvas.requestRenderAll();
                    requestAnimationFrame(renderLoop);
                };
                renderLoop();

                this.layerManager.updateLayerList();
                this.setTool('select');
                vidInput.value = '';
            });
        }
    }

    // =========================================================
    // CREATORS & HELPERS
    // =========================================================

    addText(x = 100, y = 100) {
        const text = new fabric.IText('Type here', {
            left: x,
            top: y,
            fontFamily: 'Arial',
            fill: '#cccccc',
            fontSize: 40
        });

        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        this.layerManager.updateLayerList();
    }

    addShape(type) {
        let shape;
        const center = this.canvas.getCenter();
        const offset = Math.random() * 20;
        const common = {
            left: center.left + offset,
            top: center.top + offset,
            fill: this.shapeProps.fill,
            stroke: this.shapeProps.stroke,
            strokeWidth: this.shapeProps.strokeWidth
        };

        if (type === 'rect') shape = new fabric.Rect({ ...common, width: 100, height: 100 });
        else if (type === 'circle') shape = new fabric.Circle({ ...common, radius: 50 });
        else if (type === 'triangle') shape = new fabric.Triangle({ ...common, width: 100, height: 100 });
        else if (type === 'line') shape = new fabric.Line([0, 0, 100, 100], { ...common, fill: 'transparent' });

        this.canvas.add(shape);
        this.canvas.setActiveObject(shape);
        this.layerManager.updateLayerList();
        this.setTool('select');
    }

    setBrushType(type) {
        this.currentBrushType = type;
        const color = this.canvas.freeDrawingBrush ? this.canvas.freeDrawingBrush.color : this.defaultColor;
        const width = this.canvas.freeDrawingBrush ? this.canvas.freeDrawingBrush.width : 5;

        if (type === 'Pencil') this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        else if (type === 'Spray') this.canvas.freeDrawingBrush = new fabric.SprayBrush(this.canvas);
        else if (type === 'Circle') this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);

        this.canvas.freeDrawingBrush.color = color;
        this.canvas.freeDrawingBrush.width = width;
    }

    updateSettings(settings) {
        if (settings.fill) this.shapeProps.fill = settings.fill;
        if (settings.stroke) this.shapeProps.stroke = settings.stroke;
        if (settings.strokeWidth) this.shapeProps.strokeWidth = parseInt(settings.strokeWidth);
    }

    // =========================================================
    // ACTIONS (Copy/Paste/Delete)
    // =========================================================

    copy() {
        const active = this.canvas.getActiveObject();
        if (active) active.clone(cloned => this.clipboard = cloned);
    }

    paste() {
        if (!this.clipboard) return;
        this.clipboard.clone(clonedObj => {
            this.canvas.discardActiveObject();
            clonedObj.set({ left: clonedObj.left + 20, top: clonedObj.top + 20, evented: true });
            if (clonedObj.type === 'activeSelection') {
                clonedObj.canvas = this.canvas;
                clonedObj.forEachObject(obj => this.canvas.add(obj));
                clonedObj.setCoords();
            } else {
                this.canvas.add(clonedObj);
            }
            this.canvas.setActiveObject(clonedObj);
            this.layerManager.updateLayerList();
            this.canvas.requestRenderAll();
        });
    }

    groupSelection() {
        const active = this.canvas.getActiveObject();
        if (active && active.type === 'activeSelection') {
            active.toGroup();
            this.canvas.requestRenderAll();
            this.layerManager.updateLayerList();
        }
    }

    ungroupSelection() {
        const active = this.canvas.getActiveObject();
        if (active && active.type === 'group') {
            active.toActiveSelection();
            this.canvas.requestRenderAll();
            this.layerManager.updateLayerList();
        }
    }

    deleteSelection() {
        const active = this.canvas.getActiveObjects();
        if (active.length) {
            this.canvas.remove(...active);
            this.canvas.discardActiveObject();
            this.layerManager.updateLayerList();
        }
    }

    download() {
        const dataURL = this.canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        const link = document.createElement('a');
        link.download = 'design.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}