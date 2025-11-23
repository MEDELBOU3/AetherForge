export default class LayerManager {
    constructor(app) {
        this.app = app;
        this.panel = document.getElementById('layers-panel');
    }

    updateLayerList() {
        this.panel.innerHTML = '';
        // Reverse array to show top layers at top of list
        const objects = this.app.canvas.getObjects().slice().reverse();

        objects.forEach((obj) => {
            const div = document.createElement('div');
            div.className = 'layer-item';
            
            // Icons
            let icon = 'fa-square';
            if (obj.type === 'i-text') icon = 'fa-font';
            if (obj.type === 'circle') icon = 'fa-circle';
            if (obj.type === 'image') icon = 'fa-image';
            if (obj.type === 'group') icon = 'fa-object-group';
            if (obj.type === 'path') icon = 'fa-paintbrush';

            // Active Class
            const activeObj = this.app.canvas.getActiveObject();
            if (activeObj === obj) div.classList.add('active');
            // Handle active selection (multiple objects)
            if (activeObj && activeObj._objects && activeObj._objects.includes(obj)) div.classList.add('active');

            // Locked Status
            const lockIcon = obj.lockMovementX ? '<i class="fa-solid fa-lock" style="font-size:10px; margin-left:auto; color:#666;"></i>' : '';

            div.innerHTML = `
                <i class="fa-solid fa-eye visibility-icon" style="cursor:pointer"></i>
                <i class="fa-solid ${icon}" style="margin: 0 10px; width: 20px; text-align: center;"></i>
                <span class="layer-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px;">
                    ${obj.type === 'image' ? 'Image Layer' : (obj.text ? obj.text.substring(0,10) : obj.type)}
                </span>
                ${lockIcon}
            `;

            // Click to Select
            div.addEventListener('click', (e) => {
                // Ignore eye click
                if(e.target.classList.contains('visibility-icon')) return;
                
                this.app.canvas.discardActiveObject();
                this.app.canvas.setActiveObject(obj);
                this.app.canvas.requestRenderAll();
            });

            // Toggle Visibility
            const eye = div.querySelector('.visibility-icon');
            eye.style.opacity = obj.visible ? 1 : 0.3;
            eye.onclick = () => {
                obj.visible = !obj.visible;
                this.app.canvas.discardActiveObject(); // Deselect to hide controls
                this.app.canvas.requestRenderAll();
                this.updateLayerList();
            };

            this.panel.appendChild(div);
        });
    }

    highlightLayer() {
        this.updateLayerList();
    }
}