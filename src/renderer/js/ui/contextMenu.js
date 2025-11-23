export default class ContextMenu {
    constructor(app) {
        this.app = app;
        this.canvas = app.canvas;
        this.tm = app.toolManager; 
        
        // Create DOM Element
        this.menu = document.createElement('div');
        this.menu.id = 'context-menu';
        document.body.appendChild(this.menu);

        this.initEvents();
    }

    initEvents() {
        // 1. FABRIC CANVAS LISTENER (Crucial Fix)
        // Fabric intercepts right clicks, so we must ask Fabric for them.
        this.canvas.on('mouse:down', (opt) => {
            if (opt.button === 3) { // 3 = Right Click in Fabric
                // Determine screen coordinates from the raw event
                const e = opt.e; 
                e.preventDefault();
                
                // Select the object under the cursor if one exists (Photoshop behavior)
                if (opt.target) {
                    this.canvas.setActiveObject(opt.target);
                    this.canvas.requestRenderAll();
                }

                this.show(e.clientX, e.clientY);
            }
        });

        // 2. GRAY BACKGROUND LISTENER (The Wrapper)
        // This catches clicks outside the white canvas area
        const wrapper = document.getElementById('canvas-wrapper');
        wrapper.addEventListener('contextmenu', (e) => {
            // Only fire if we didn't click the canvas element (to avoid double menus)
            if (e.target.tagName !== 'CANVAS') {
                e.preventDefault();
                this.canvas.discardActiveObject(); // Deselect everything
                this.canvas.requestRenderAll();
                this.show(e.clientX, e.clientY);
            }
        });

        // 3. Hide menu on left click anywhere
        document.addEventListener('click', () => this.hide());
        
        // 4. Hide menu on window resize/blur
        window.addEventListener('resize', () => this.hide());
        
        // 5. Hide if scrolling/zooming
        this.canvas.on('mouse:wheel', () => this.hide());
    }

    show(x, y) {
        const activeObj = this.canvas.getActiveObject();
        const clipboard = this.tm.clipboard;

        let menuItems = [];

        if (!activeObj) {
            // --- SCENARIO A: EMPTY SPACE ---
            menuItems = [
                { label: 'Paste', icon: 'fa-paste', shortcut: 'Ctrl+V', action: 'paste', disabled: !clipboard },
                { type: 'divider' },
                { label: 'Import Image...', icon: 'fa-image', action: 'import' },
                { label: 'Export PNG', icon: 'fa-download', action: 'export' },
                { type: 'divider' },
                { label: 'Reset Zoom', icon: 'fa-magnifying-glass', action: 'reset-zoom' }
            ];
        } 
        else if (activeObj.type === 'activeSelection') {
            // --- SCENARIO B: MULTI-SELECTION ---
            menuItems = [
                { label: 'Copy', icon: 'fa-copy', shortcut: 'Ctrl+C', action: 'copy' },
                { label: 'Delete', icon: 'fa-trash', shortcut: 'Del', action: 'delete' },
                { type: 'divider' },
                { label: 'Group', icon: 'fa-object-group', shortcut: 'Ctrl+G', action: 'group' },
                { label: 'Align Left', icon: 'fa-align-left', action: 'align-left' },
                { label: 'Align Center', icon: 'fa-align-center', action: 'align-center' }
            ];
        } 
        else if (activeObj.type === 'group') {
             // --- SCENARIO C: GROUP ---
             menuItems = [
                { label: 'Copy', icon: 'fa-copy', shortcut: 'Ctrl+C', action: 'copy' },
                { label: 'Ungroup', icon: 'fa-object-ungroup', shortcut: 'Ctrl+U', action: 'ungroup' },
                { type: 'divider' },
                { label: 'Send to Back', icon: 'fa-angles-down', action: 'back' },
                { label: 'Bring to Front', icon: 'fa-angles-up', action: 'front' }
            ];
        }
        else {
            // --- SCENARIO D: SINGLE OBJECT ---
            menuItems = [
                { label: 'Copy', icon: 'fa-copy', shortcut: 'Ctrl+C', action: 'copy' },
                { label: 'Delete', icon: 'fa-trash', shortcut: 'Del', action: 'delete' },
                { type: 'divider' },
                { label: 'Bring to Front', icon: 'fa-angles-up', action: 'front' },
                { label: 'Send to Back', icon: 'fa-angles-down', action: 'back' }
            ];

            if (activeObj.type === 'i-text') {
                menuItems.push({ type: 'divider' });
                menuItems.push({ label: 'Edit Text', icon: 'fa-i-cursor', action: 'edit-text' });
            }
            
            // Lock toggle
            if (activeObj.lockMovementX) {
                menuItems.push({ label: 'Unlock', icon: 'fa-lock-open', action: 'unlock' });
            } else {
                menuItems.push({ label: 'Lock', icon: 'fa-lock', action: 'lock' });
            }
        }

        this.renderMenu(menuItems);
        this.positionMenu(x, y);
    }

    renderMenu(items) {
        this.menu.innerHTML = '';
        
        items.forEach(item => {
            if (item.type === 'divider') {
                const div = document.createElement('div');
                div.className = 'ctx-divider';
                this.menu.appendChild(div);
            } else {
                const li = document.createElement('div');
                li.className = `ctx-item ${item.disabled ? 'disabled' : ''}`;
                li.innerHTML = `
                    <div style="display:flex; align-items:center;">
                        <i class="fa-solid ${item.icon} ctx-icon"></i>
                        <span>${item.label}</span>
                    </div>
                    ${item.shortcut ? `<span class="ctx-shortcut">${item.shortcut}</span>` : ''}
                `;
                
                li.onclick = (e) => {
                    e.stopPropagation(); // Prevent clicking item from triggering 'close menu' immediately
                    this.execute(item.action);
                    this.hide();
                };
                this.menu.appendChild(li);
            }
        });

        this.menu.style.display = 'block';
    }

    positionMenu(x, y) {
        const rect = this.menu.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        let menuX = x;
        let menuY = y;

        // Keep inside screen
        if (x + rect.width > winW) menuX -= rect.width;
        if (y + rect.height > winH) menuY -= rect.height;

        this.menu.style.left = `${menuX}px`;
        this.menu.style.top = `${menuY}px`;
    }

    hide() {
        this.menu.style.display = 'none';
    }

    execute(action) {
        const active = this.canvas.getActiveObject();
        
        switch(action) {
            case 'copy': this.tm.copy(); break;
            case 'paste': this.tm.paste(); break;
            case 'delete': this.tm.deleteSelection(); break;
            case 'group': this.tm.groupSelection(); break;
            case 'ungroup': this.tm.ungroupSelection(); break;
            
            case 'front': 
                if(active) { active.bringToFront(); this.app.layerManager.updateLayerList(); }
                break;
            case 'back': 
                if(active) { active.sendToBack(); this.app.layerManager.updateLayerList(); }
                break;
            
            case 'lock':
                if(active) { 
                    active.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true });
                    this.app.layerManager.updateLayerList();
                }
                break;
            case 'unlock':
                 if(active) { 
                    active.set({ lockMovementX: false, lockMovementY: false, lockRotation: false, lockScalingX: false, lockScalingY: false });
                    this.app.layerManager.updateLayerList();
                }
                break;
            
            case 'edit-text':
                if(active && active.enterEditing) active.enterEditing();
                break;

            case 'import':
                document.getElementById('img-upload').click();
                break;
            case 'export':
                this.tm.download();
                break;
            
            case 'align-left':
                if(active && active.type === 'activeSelection') {
                    const left = active.left;
                    active._objects.forEach(obj => {
                        obj.set('left', -(active.width / 2) + (obj.width * obj.scaleX / 2)); // Relative to group center
                    });
                    this.canvas.requestRenderAll();
                }
                break;
            
            case 'reset-zoom':
                // Reset Viewport transform
                this.canvas.setViewportTransform([1,0,0,1,0,0]);
                break;
        }
    }
}