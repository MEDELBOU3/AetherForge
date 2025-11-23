const { Menu } = require('electron');

const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New' },
        { label: 'Open' },
        { label: 'Save' },
        { label: 'Save As' },
        { type: 'separator' },
        { label: 'Export' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
};

module.exports = createMenu;