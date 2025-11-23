class HistoryManager {
    constructor(canvas, layerManager) {
        this.canvas = canvas;
        this.layerManager = layerManager;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 50;
    }

    saveState(description = 'Action') {
        // Remove any states after current index
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Save current state
        const state = {
            description,
            imageData: this.canvas.getContext('2d').getImageData(
                0, 0, this.canvas.width, this.canvas.height
            ),
            timestamp: Date.now()
        };

        this.history.push(state);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }

        this.updateHistoryList();
        this.updateButtons();
    }

    undo() {
        if (!this.canUndo()) return;

        this.currentIndex--;
        this.restoreState(this.currentIndex);
        this.updateHistoryList();
        this.updateButtons();
    }

    redo() {
        if (!this.canRedo()) return;

        this.currentIndex++;
        this.restoreState(this.currentIndex);
        this.updateHistoryList();
        this.updateButtons();
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    restoreState(index) {
        if (index < 0 || index >= this.history.length) return;

        const state = this.history[index];
        const ctx = this.canvas.getContext('2d');
        ctx.putImageData(state.imageData, 0, 0);
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateHistoryList();
        this.updateButtons();
    }

    updateHistoryList() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        historyList.innerHTML = '';

        this.history.forEach((state, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            if (index === this.currentIndex) {
                item.classList.add('current');
            }

            const time = new Date(state.timestamp).toLocaleTimeString();
            item.textContent = `${state.description} (${time})`;

            item.addEventListener('click', () => {
                this.currentIndex = index;
                this.restoreState(index);
                this.updateHistoryList();
                this.updateButtons();
            });

            historyList.appendChild(item);
        });
    }

    updateButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
        }
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
        }
    }
}