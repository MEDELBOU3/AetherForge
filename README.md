Here is the fixed Markdown file, translated into English and updated with the project name **AetherForge**.

```markdown
# AetherForge

An advanced graphic design editor built with Electron, HTML, CSS, and JavaScript.

## Features

### Drawing Tools
- **Select Tool (V)** - Select and move objects
- **Brush Tool (B)** - Freehand drawing with adjustable size and color
- **Eraser Tool (E)** - Eraser for deleting elements
- **Shape Tool (S)** - Draw shapes (Rectangles, Circles, Lines, Triangles)
- **Text Tool (T)** - Add text

### Layer Management
- Create, delete, and duplicate multiple layers
- Toggle layer visibility
- Merge layers
- Change layer order

### Filters & Effects
- Grayscale
- Blur
- Brightness
- Contrast
- Invert
- Sepia

### Additional Features
- Undo/Redo functionality
- Zoom In/Out
- Export to PNG, JPG, SVG
- Keyboard shortcuts
- Context menu
- Color picker
- Adjustable brush size

## Design & Styling

The editor features a **modern, professional Dark Theme** including:

- 🎨 **11 Alternative Color Schemes** (Dark, Light, Midnight, Cyber, Ocean, Forest, Sunset, Mono, Dracula, Nord, Tokyo Night)
- ✨ **60+ Animations** for a fluid user experience
- 📱 **Fully Responsive** for Desktop, Tablet, and Mobile
- ♿ **Accessibility** with High Contrast Mode and Reduced Motion Support
- 🎯 **Touch-optimized** for tablets and touch displays

### CSS Architecture

```css
css/
├── main.css        # Base styles and variables
├── toolbar.css     # Toolbar & tool buttons
├── panels.css      # Layer, history, filter panels
├── canvas.css      # Canvas & drawing area
├── animations.css  # 60+ animations & effects
├── responsive.css  # Mobile & tablet optimizations
└── themes.css      # 11 color schemes
```

## Installation

### Prerequisites
- Node.js (Version 16 or higher)
- npm or yarn

### Step 1: Install Dependencies
Open PowerShell or Command Prompt in the project folder and run:

```bash
npm install
```

### Step 2: Start Application

```bash
npm start
```

### Step 3: Build Desktop Application

#### For Windows:
```bash
npm run build:win
```

#### For macOS:
```bash
npm run build:mac
```

#### For Linux:
```bash
npm run build:linux
```
You can find the compiled application in the `dist` folder.

## Keyboard Shortcuts

### Tools
- **V** - Select Tool
- **B** - Brush Tool
- **E** - Eraser Tool
- **S** - Shape Tool
- **T** - Text Tool

### Editing
- **Ctrl + Z** - Undo
- **Ctrl + Shift + Z** - Redo
- **Ctrl + N** - New Document
- **Ctrl + O** - Open
- **Ctrl + S** - Save
- **Ctrl + Shift + S** - Save As

### Layers
- **Ctrl + Shift + N** - New Layer
- **Delete** - Delete Layer
- **Ctrl + E** - Merge Layers

## Project Structure

```text
AetherForge/
├── src/
│   ├── main/           # Electron Main Process
│   │   ├── main.js     # Main window logic
│   │   ├── menu.js     # Menu configuration
│   │   └── preload.js  # Preload script
│   └── renderer/       # Renderer Process (UI)
│       ├── index.html  # Main HTML
│       ├── css/        # Stylesheets
│       ├── js/         # JavaScript Modules
│       │   ├── tools/    # Drawing tools
│       │   ├── layers/   # Layer management
│       │   ├── history/  # Undo/Redo
│       │   ├── filters/  # Image filters
│       │   ├── export/   # Export functions
│       │   └── ui/       # UI Components
│       └── assets/     # Images & Icons
├── package.json
└── README.md
```

## Development

### Code Structure
The application follows a modular architecture:
- **Tools**: Each drawing tool is its own class.
- **Layer Manager**: Manages all layers and their rendering.
- **History Manager**: Implements Undo/Redo.
- **Filter Manager**: Applies image filters.
- **Export Manager**: Handles file exports.

### Adding Custom Tools
1. Create a new class in `src/renderer/js/tools/`.
2. Implement the methods: `activate()`, `deactivate()`, `onMouseDown()`, `onMouseMove()`, `onMouseUp()`.
3. Register the tool in the `ToolManager`.
4. Add a button in `index.html`.

## License
MIT License

## Author
MOHAMED EL-BOUANANI



