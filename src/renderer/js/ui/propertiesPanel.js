export default class PropertiesPanel {
    constructor(toolManager) {
        this.container = document.getElementById('properties-panel');
        this.toolManager = toolManager;
        this.canvas = toolManager.canvas;

        // 1. Re-Render HTML when Selection Changes (Switching objects)
        this.canvas.on('selection:created', () => this.render());
        this.canvas.on('selection:updated', () => this.render());
        this.canvas.on('selection:cleared', () => this.render());
        
        // 2. LIVE UPDATES: Update values while dragging (Performance)
        // Added 'moving', 'scaling', 'rotating' for direct updates
        this.canvas.on('object:modified', () => this.updateTransformInputs());
        this.canvas.on('object:moving', () => this.updateTransformInputs());
        this.canvas.on('object:scaling', () => this.updateTransformInputs());
        this.canvas.on('object:rotating', () => this.updateTransformInputs());
    }

    /**
     * MAIN RENDER CONTROLLER
     */
    render() {
        this.container.innerHTML = '';
        const activeObj = this.canvas.getActiveObject();

        // --- SCENARIO A: OBJECT SELECTED (EDIT MODE) ---
        if (activeObj) {
            // 1. Transform (X, Y, W, H)
            this.renderTransformPanel(activeObj);
            
            // 2. Appearance (Opacity, Blend, Shadow)
            this.renderAppearancePanel(activeObj);

            // 3. Type Specific
            if (activeObj.type === 'image') {
                if (activeObj.getElement() && activeObj.getElement().tagName === 'VIDEO') {
                    this.renderVideoPanel(activeObj);
                } else {
                    this.renderImageEditor(activeObj);
                }
            } 
            else if (activeObj.type === 'i-text' || activeObj.type === 'textbox') {
                this.renderTypographyPanel(activeObj);
            }
            else if (['rect', 'circle', 'triangle', 'line', 'path', 'polygon'].includes(activeObj.type)) {
                this.renderVectorPanel(activeObj);
            }
            else if (activeObj.type === 'group') {
                this.renderGroupActions(activeObj);
            }
            return;
        }

        // --- SCENARIO B: NO SELECTION (TOOL OPTIONS) ---
        const activeTool = this.toolManager.activeTool;

        if (activeTool === 'brush') {
            this.renderBrushSettings();
        } 
        else if (activeTool === 'shape') {
            this.renderShapeCreationTool();
        } 
        else if (activeTool === 'media') {
            this.renderMediaUploads();
        } 
        else if (activeTool === 'text') {
            this.renderTextToolDefaults();
        }
        else {
            this.renderEmptyState();
        }
    }

    // =================================================================
    // 1. TOOL SETTINGS
    // =================================================================

    renderBrushSettings() {
        this.addSectionHeader('Brush Settings');
        const brush = this.canvas.freeDrawingBrush;

        // Brush Type Selector
        this.addLabel('Brush Type');
        const options = ['Pencil', 'Spray', 'Circle']; 
        const select = document.createElement('select');
        select.className = 'blend-select'; // Ensure you have CSS for this
        select.style.marginBottom = '10px';
        select.style.width = '100%';
        
        options.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt; el.innerText = opt;
            if(this.toolManager.currentBrushType === opt) el.selected = true;
            select.appendChild(el);
        });
        
        select.onchange = (e) => {
            this.toolManager.setBrushType(e.target.value);
            this.render();
        };
        this.container.appendChild(select);

        // Common Brush Props
        // Fix: Use 'input' event inside addColorControl for live preview
        this.addColorControl(this.container, 'Color', brush.color, (val) => {
            brush.color = val;
            this.canvas.freeDrawingBrush.color = val;
        });

        this.addSliderControl(this.container, 'Width', 1, 100, brush.width, (val) => {
            brush.width = parseInt(val, 10);
            this.canvas.freeDrawingBrush.width = parseInt(val, 10);
        });
    }

    renderShapeCreationTool() {
        this.addSectionHeader('Insert Shape');
        
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.gap = '8px';
        grid.style.marginBottom = '15px';

        const shapes = [
            { type: 'rect', label: 'Square', icon: 'fa-square' },
            { type: 'circle', label: 'Circle', icon: 'fa-circle' },
            { type: 'triangle', label: 'Triangle', icon: 'fa-play', rotate: '-90deg' },
            { type: 'line', label: 'Line', icon: 'fa-slash' }
        ];

        shapes.forEach(shape => {
            const btn = document.createElement('button');
            btn.className = 'prop-btn';
            btn.style.height = '40px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.gap = '8px';
            const iconStyle = shape.rotate ? `transform:rotate(${shape.rotate})` : '';
            btn.innerHTML = `<i class="fa-solid ${shape.icon}" style="${iconStyle}"></i> <span style="font-size:11px">${shape.label}</span>`;
            
            btn.onclick = () => this.toolManager.addShape(shape.type);
            grid.appendChild(btn);
        });
        this.container.appendChild(grid);

        this.addSectionHeader('Default Styles');
        this.addColorControl(this.container, 'Fill Color', this.toolManager.shapeProps.fill, (val) => {
            this.toolManager.updateSettings({ fill: val });
        });
        this.addColorControl(this.container, 'Stroke Color', this.toolManager.shapeProps.stroke, (val) => {
            this.toolManager.updateSettings({ stroke: val });
        });
        this.addSliderControl(this.container, 'Stroke Width', 0, 20, this.toolManager.shapeProps.strokeWidth, (val) => {
            this.toolManager.updateSettings({ strokeWidth: parseInt(val) });
        });
    }

    renderMediaUploads() {
        this.addSectionHeader('Import Media');
        const btnStyle = 'width:100%; margin-bottom:10px; display:flex; align-items:center; padding:10px; background:var(--bg-input); border:1px solid var(--border); color:var(--text-main); cursor:pointer;';

        const createBtn = (icon, text, id) => {
            const btn = document.createElement('button');
            btn.style.cssText = btnStyle;
            btn.innerHTML = `<i class="fa-solid ${icon}" style="margin-right:10px; color:var(--accent)"></i> ${text}`;
            btn.onclick = () => {
                const input = document.getElementById(id);
                if(input) input.click();
            };
            this.container.appendChild(btn);
        };

        createBtn('fa-image', 'Upload Image', 'img-upload');
        createBtn('fa-video', 'Upload Video', 'video-upload');
        
        const note = document.createElement('div');
        note.style.fontSize = '10px'; note.style.color='#666'; note.style.marginTop='10px';
        note.innerText = 'Supported: JPG, PNG, SVG, MP4, WEBM';
        this.container.appendChild(note);
    }

    renderTextToolDefaults() {
        this.addSectionHeader('Text Tool');
        this.container.innerHTML += `<div style="padding:10px; font-size:12px; color:#aaa;">Click on the canvas to add a new text layer.</div>`;
    }

    renderEmptyState() {
         this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; color:#858585; opacity:0.6;">
                <i class="fa-solid fa-arrow-pointer" style="font-size:24px; margin-bottom:10px;"></i>
                <span style="font-size:11px">Select a tool or an object</span>
            </div>
         `;
    }

    // =================================================================
    // 2. OBJECT EDITORS
    // =================================================================

    renderTransformPanel(obj) {
        this.addSectionHeader('Transform');
        const grid = document.createElement('div');
        grid.className = 'transform-grid'; // Ensure css grid is defined
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.gap = '8px';

        // Helper to create X, Y, W, H inputs
        const createInput = (label, prop, key) => {
            const div = document.createElement('div');
            div.className = 'input-group-mini';
            div.style.display = 'flex'; 
            div.style.alignItems = 'center';
            div.style.background = '#3c3c3c';
            div.style.padding = '2px 5px';
            
            div.innerHTML = `<span style="font-size:10px; color:#aaa; margin-right:5px; width:10px;">${label}</span>`;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.style.width = '100%';
            input.style.background = 'transparent';
            input.style.border = 'none';
            input.style.color = '#fff';
            input.style.textAlign = 'right';
            input.style.fontSize = '11px';

            // ID is critical for updateTransformInputs
            input.id = `prop-${key}`;
            
            let val = obj[key];
            if(key === 'width') val = obj.width * obj.scaleX;
            if(key === 'height') val = obj.height * obj.scaleY;
            input.value = Math.round(val);
            
            input.oninput = (e) => {
                const v = parseFloat(e.target.value);
                if (key === 'left' || key === 'top' || key === 'angle') obj.set(key, v);
                else if (key === 'width') obj.scaleToWidth(v);
                else if (key === 'height') obj.scaleToHeight(v);
                obj.setCoords();
                this.canvas.requestRenderAll();
            };
            div.appendChild(input);
            return div;
        };

        grid.appendChild(createInput('X', 'left', 'left'));
        grid.appendChild(createInput('Y', 'top', 'top'));
        grid.appendChild(createInput('W', 'width', 'width'));
        grid.appendChild(createInput('H', 'height', 'height'));
        grid.appendChild(createInput('R', 'angle', 'angle'));
        this.container.appendChild(grid);
    }
    
    updateTransformInputs() {
        const obj = this.canvas.getActiveObject();
        if(!obj) return;
        
        const update = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.value = Math.round(val);
        };
        update('prop-left', obj.left);
        update('prop-top', obj.top);
        update('prop-width', obj.width * obj.scaleX);
        update('prop-height', obj.height * obj.scaleY);
        update('prop-angle', obj.angle);
    }

    renderAppearancePanel(obj) {
        this.addSectionHeader('Appearance');
        this.addSliderControl(this.container, 'Opacity', 0, 100, obj.opacity * 100, (val) => {
            obj.set('opacity', val / 100);
            this.canvas.requestRenderAll();
        });
        
        this.addLabel('Blend Mode');
        const blendModes = ['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference', 'exclusion'];
        const select = document.createElement('select');
        select.className = 'blend-select';
        select.style.width = '100%';
        select.style.marginBottom = '10px';
        
        blendModes.forEach(mode => {
            const opt = document.createElement('option');
            opt.value = mode; opt.innerText = mode;
            if (obj.globalCompositeOperation === mode) opt.selected = true;
            select.appendChild(opt);
        });
        select.onchange = (e) => { obj.set('globalCompositeOperation', e.target.value); this.canvas.requestRenderAll(); };
        this.container.appendChild(select);
    }

    renderVectorPanel(obj) {
        this.addSectionHeader('Shape Properties');
        this.addColorControl(this.container, 'Fill', obj.fill, (val) => { obj.set('fill', val); this.canvas.requestRenderAll(); });
        this.addColorControl(this.container, 'Stroke', obj.stroke, (val) => { obj.set('stroke', val); this.canvas.requestRenderAll(); });
        this.addSliderControl(this.container, 'Stroke Width', 0, 50, obj.strokeWidth, (val) => { obj.set('strokeWidth', parseInt(val)); this.canvas.requestRenderAll(); });
        if(obj.type === 'rect') {
             this.addSliderControl(this.container, 'Corner Radius', 0, 100, obj.rx, (val) => { obj.set({ rx: parseInt(val), ry: parseInt(val) }); this.canvas.requestRenderAll(); });
        }
    }

    renderTypographyPanel(obj) {
        this.addSectionHeader('Character');
        
        const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Roboto'];
        const select = document.createElement('select');
        select.className = 'blend-select';
        select.style.width = '100%';
        select.style.marginBottom = '8px';
        fonts.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f; opt.innerText = f;
            if(obj.fontFamily === f) opt.selected = true;
            select.appendChild(opt);
        });
        select.onchange = (e) => { obj.set('fontFamily', e.target.value); this.canvas.requestRenderAll(); };
        this.container.appendChild(select);
        
        const styleRow = document.createElement('div');
        styleRow.className = 'btn-group'; // ensure css exists
        styleRow.style.display = 'flex';
        styleRow.style.gap = '5px';
        styleRow.style.marginBottom = '10px';

        const addBtn = (icon, active, cb) => {
            const b = document.createElement('button');
            b.className = `prop-btn ${active ? 'active' : ''}`;
            b.innerHTML = `<i class="fa-solid ${icon}"></i>`;
            b.style.flex = '1';
            b.onclick = cb;
            styleRow.appendChild(b);
        };
        addBtn('fa-bold', obj.fontWeight === 'bold', () => { obj.set('fontWeight', obj.fontWeight==='bold'?'normal':'bold'); this.render(); this.canvas.requestRenderAll(); });
        addBtn('fa-italic', obj.fontStyle === 'italic', () => { obj.set('fontStyle', obj.fontStyle==='italic'?'normal':'italic'); this.render(); this.canvas.requestRenderAll(); });
        addBtn('fa-underline', obj.underline, () => { obj.set('underline', !obj.underline); this.render(); this.canvas.requestRenderAll(); });
        this.container.appendChild(styleRow);

        this.addSliderControl(this.container, 'Size', 6, 200, obj.fontSize, (val) => { obj.set('fontSize', parseInt(val)); this.canvas.requestRenderAll(); });
        this.addColorControl(this.container, 'Color', obj.fill, (val) => { obj.set('fill', val); this.canvas.requestRenderAll(); });
    }

    renderImageEditor(obj) {
        this.addSectionHeader('Image Adjustments');
        this.createAccordion('Light & Color', true, (panel) => {
            this.addFilterSlider(panel, obj, 'Brightness', 'Brightness', -1, 1, 'brightness');
            this.addFilterSlider(panel, obj, 'Contrast', 'Contrast', -1, 1, 'contrast');
            this.addFilterSlider(panel, obj, 'Saturation', 'Saturation', -1, 1, 'saturation');
        });
        this.createAccordion('Effects', false, (panel) => {
             this.addFilterSlider(panel, obj, 'Blur', 'Blur', 0, 1, 'blur');
             this.addFilterSlider(panel, obj, 'Noise', 'Noise', 0, 1000, 'noise');
             this.addFilterCheckbox(panel, obj, 'Grayscale', 'Grayscale');
             this.addFilterCheckbox(panel, obj, 'Sepia', 'Sepia');
             this.addFilterCheckbox(panel, obj, 'Invert', 'Invert');
        });
    }

    renderVideoPanel(obj) {
        this.addSectionHeader('Video Playback');
        const vid = obj.getElement();
        const controls = document.createElement('div');
        controls.className = 'btn-group';
        controls.style.display = 'flex';
        controls.style.gap = '5px';
        controls.innerHTML = `
            <button class="prop-btn" id="vid-play" style="flex:1"><i class="fa-solid fa-play"></i></button>
            <button class="prop-btn" id="vid-pause" style="flex:1"><i class="fa-solid fa-pause"></i></button>
            <button class="prop-btn" id="vid-mute" style="flex:1"><i class="fa-solid fa-volume-${vid.muted ? 'xmark' : 'high'}"></i></button>
        `;
        this.container.appendChild(controls);
        controls.querySelector('#vid-play').onclick = () => {
            vid.play();
            const loop = () => { if(!vid.paused && !vid.ended) { obj.dirty = true; this.canvas.requestRenderAll(); requestAnimationFrame(loop); } };
            loop();
        };
        controls.querySelector('#vid-pause').onclick = () => vid.pause();
        controls.querySelector('#vid-mute').onclick = (e) => {
            vid.muted = !vid.muted;
            e.currentTarget.innerHTML = `<i class="fa-solid fa-volume-${vid.muted ? 'xmark' : 'high'}"></i>`;
        };
    }

    renderGroupActions(obj) {
        this.addSectionHeader('Group Selection');
        const btn = document.createElement('button');
        btn.className = 'prop-btn';
        btn.style.width = '100%';
        btn.innerText = 'Ungroup Items';
        btn.onclick = () => this.toolManager.ungroupSelection();
        this.container.appendChild(btn);
    }

    // =================================================================
    // UI HELPERS (FIXED FOR DISPLAY & UPDATES)
    // =================================================================

    addSectionHeader(text) {
        const div = document.createElement('div');
        div.className = 'prop-section-header'; // Ensure CSS exists
        div.style.fontSize = '11px';
        div.style.fontWeight = 'bold';
        div.style.color = '#888';
        div.style.textTransform = 'uppercase';
        div.style.margin = '15px 0 5px 0';
        div.style.borderBottom = '1px solid #333';
        div.style.paddingBottom = '3px';
        div.innerText = text;
        this.container.appendChild(div);
    }

    addLabel(text) {
        const div = document.createElement('div');
        div.style.fontSize='11px'; div.style.marginBottom='4px'; div.innerText = text;
        this.container.appendChild(div);
    }

    addSliderControl(parent, label, min, max, value, onChange, step=1) {
        const div = document.createElement('div');
        div.className = 'slider-row';
        div.style.marginBottom = '8px';
        div.innerHTML = `
            <div class="slider-header" style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span style="font-size:11px;">${label}</span>
                <span class="slider-val" style="font-size:11px; color:#0078d4">${Math.round(value*100)/100}</span>
            </div>`;
        
        const input = document.createElement('input');
        input.type = 'range'; 
        input.min = min; input.max = max; input.step = step; input.value = value;
        input.style.width = '100%';
        
        // Use 'input' event for direct updates while dragging
        input.addEventListener('input', (e) => { 
            div.querySelector('.slider-val').innerText = e.target.value; 
            onChange(e.target.value); 
        });
        
        div.appendChild(input);
        parent.appendChild(div);
    }

    // FIXED: Forces display of color picker with styles
    addColorControl(parent, label, value, onChange) {
        const div = document.createElement('div');
        div.style.display = 'flex'; 
        div.style.alignItems = 'center'; 
        div.style.justifyContent = 'space-between'; 
        div.style.marginBottom = '8px';
        div.innerHTML = `<span style="font-size:11px;">${label}</span>`;
        
        const input = document.createElement('input');
        input.type = 'color'; 
        // HTML color inputs handle hex only, fallback if complex
        input.value = typeof value === 'string' && value.startsWith('#') ? value : '#000000';
        
        // FORCE STYLE TO MAKE IT VISIBLE
        input.style.width = '30px'; 
        input.style.height = '24px'; 
        input.style.border = '1px solid #555'; 
        input.style.padding = '0'; 
        input.style.cursor = 'pointer';
        input.style.background = 'none';

        // Use 'input' event for live color changing
        input.addEventListener('input', (e) => onChange(e.target.value));
        
        div.appendChild(input);
        parent.appendChild(div);
    }

    createAccordion(title, isOpenDefault, contentBuilder) {
        const details = document.createElement('details');
        details.style.marginBottom = '10px'; details.style.border = '1px solid #333'; details.style.borderRadius = '4px';
        if(isOpenDefault) details.open = true;
        const summary = document.createElement('summary');
        summary.style.fontSize = '11px'; summary.style.padding = '6px'; summary.style.cursor = 'pointer'; summary.style.backgroundColor = '#3c3c3c';
        summary.innerText = title;
        const content = document.createElement('div'); content.style.padding = '10px';
        contentBuilder(content);
        details.appendChild(summary); details.appendChild(content);
        this.container.appendChild(details);
    }

    /*addFilterSlider(parent, obj, label, filterName, min, max, propName) {
        const FilterClass = fabric.Image.filters[filterName];
        let currentVal = 0;
        if(filterName === 'Brightness') currentVal = 0;
        const existing = obj.filters.find(f => f instanceof FilterClass);
        if(existing && existing[propName] !== undefined) currentVal = existing[propName];

        this.addSliderControl(parent, label, min, max, currentVal, (val) => {
            if(!existing) {
                 const opts = {}; opts[propName] = parseFloat(val);
                 obj.filters.push(new FilterClass(opts));
            } else {
                 existing[propName] = parseFloat(val);
            }
            obj.applyFilters();
            this.canvas.requestRenderAll();
        }, 0.01);
    }*/ 

    addFilterSlider(parent, obj, label, filterName, min, max, propName) {
        const FilterClass = fabric.Image.filters[filterName];
        
        // 1. Get Initial Value correctly
        let currentVal = 0; // Default for Brightness/Contrast/Saturation
        
        // Check if filter exists currently
        const existing = obj.filters.find(f => f instanceof FilterClass);
        if (existing && existing[propName] !== undefined) {
            currentVal = existing[propName];
        }

        // 2. Add Slider
        this.addSliderControl(parent, label, min, max, currentVal, (val) => {
            const value = parseFloat(val);
            
            // CRITICAL FIX: Look up the filter index FRESH every time the slider moves
            const activeIdx = obj.filters.findIndex(f => f instanceof FilterClass);

            // 3. Logic: Remove, Update, or Add
            
            // If value is 0 (neutral), REMOVE the filter completely to restore original state
            if (Math.abs(value) < 0.001) { 
                if (activeIdx > -1) {
                    obj.filters.splice(activeIdx, 1);
                }
            } 
            else {
                // If filter exists, UPDATE it
                if (activeIdx > -1) {
                    obj.filters[activeIdx][propName] = value;
                } 
                // If filter does not exist, CREATE it (Single instance)
                else {
                    const options = {};
                    options[propName] = value;
                    obj.filters.push(new FilterClass(options));
                }
            }

            // 4. Apply changes
            obj.applyFilters();
            this.canvas.requestRenderAll();
        }, 0.01);
    }

    addFilterCheckbox(parent, obj, label, filterName) {
        const FilterClass = fabric.Image.filters[filterName];
        const isApplied = !!obj.filters.find(f => f instanceof FilterClass);
        const div = document.createElement('div'); div.style.marginBottom = '5px';
        div.innerHTML = `<label style="font-size:11px"><input type="checkbox" ${isApplied ? 'checked' : ''}> ${label}</label>`;
        div.querySelector('input').onchange = (e) => {
            if(e.target.checked) { obj.filters.push(new FilterClass()); } 
            else { const idx = obj.filters.findIndex(f => f instanceof FilterClass); if(idx>-1) obj.filters.splice(idx,1); }
            obj.applyFilters(); this.canvas.requestRenderAll();
        };
        parent.appendChild(div);
    }
}