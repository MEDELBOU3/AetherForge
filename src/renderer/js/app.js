import ToolManager from './tools/toolManager.js';
import LayerManager from './layers/layerManager.js';
import ContextMenu from './ui/contextMenu.js';

class App {
    constructor() {
        // Initialize Fabric Canvas
        // 'c' is the id from HTML
        this.canvas = new fabric.Canvas('c', {
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            selection: true,
            fireRightClick: true,  // <--- REQUIRED
            stopContextMenu: true  // <--- REQUIRED
        });

        // Setup Dimensions
        this.resizeDocument(1280, 720);

        // Managers
        this.layerManager = new LayerManager(this);
        this.toolManager = new ToolManager(this);
        this.contextMenu = new ContextMenu(this);

        this.initEvents();
    }

    resizeDocument(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.setDimensions({ width: width, height: height });
        const viewport = document.querySelector('.canvas-viewport');
        viewport.style.width = `${width}px`;
        viewport.style.height = `${height}px`;
    }


    initEvents() {
        // Update Layer Panel when objects are modified
        this.canvas.on('object:added', () => this.layerManager.updateLayerList());
        this.canvas.on('object:removed', () => this.layerManager.updateLayerList());
        this.canvas.on('selection:created', (e) => this.layerManager.highlightLayer());
        this.canvas.on('selection:updated', (e) => this.layerManager.highlightLayer());
        this.canvas.on('selection:cleared', () => this.layerManager.highlightLayer());
        this.canvas.on('object:modified', () => {
            // Optional: If we want real-time X/Y values in panel
        });
    }
}

window.app = new App();