class Toolbar {
    constructor(toolManager) {
        this.toolManager = toolManager;
        this.init();
    }

    init() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.toolManager.setTool(tool);
            });
        });

        // Color picker
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                this.toolManager.setColor(e.target.value);
            });
        }

        // Brush size
        const brushSize = document.getElementById('brush-size');
        const brushSizeValue = document.getElementById('brush-size-value');
        if (brushSize && brushSizeValue) {
            brushSize.addEventListener('input', (e) => {
                const size = e.target.value;
                brushSizeValue.textContent = size;
                this.toolManager.setSize(parseInt(size));
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'v':
                    this.toolManager.setTool('select');
                    break;
                case 'b':
                    this.toolManager.setTool('brush');
                    break;
                case 'e':
                    this.toolManager.setTool('eraser');
                    break;
                case 's':
                    if (!e.ctrlKey && !e.metaKey) {
                        this.toolManager.setTool('shape');
                    }
                    break;
                case 't':
                    if (!e.ctrlKey && !e.metaKey) {
                        this.toolManager.setTool('text');
                    }
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            if (window.historyManager) {
                                window.historyManager.redo();
                            }
                        } else {
                            if (window.historyManager) {
                                window.historyManager.undo();
                            }
                        }
                    }
                    break;
            }
        });
    }
}