import { app, BrowserWindow, ipcMain, BrowserView } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow;
let view: BrowserView;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.webContents.openDevTools({ mode: 'detach' });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('onboarding-complete', () => {
  console.log('onboarding complete. creating browser view...');
  if (!mainWindow) return;

  view = new BrowserView({
    webPreferences: {
      partition: 'persist:rizzly-session',
    },
  });
  mainWindow.setBrowserView(view);

  const resizeView = () => {
    const [width, height] = mainWindow.getSize();
    const controlPanelHeight = 180;
    if (view) {
      view.setBounds({ x: 0, y: controlPanelHeight, width, height: height - controlPanelHeight });
    }
  };

  resizeView();
  mainWindow.on('resize', resizeView);

  view.webContents.loadURL('https://google.com');
  view.webContents.openDevTools({ mode: 'detach' });
});

ipcMain.on('navigate-to', (event, url) => {
  if (view && url) {
    console.log(`navigating view to: ${url}`);
    view.webContents.loadURL(url);
  }
});

ipcMain.on('find-and-highlight', (event, selector) => {
  if (view && selector) {
    console.log(`executing highlight script for selector: ${selector}`);
    const script = `
      (() => {
        // test highlight script for now
        const prevHighlight = document.querySelector('.rizzly-highlight');
        if (prevHighlight) {
          prevHighlight.style.outline = '';
          prevHighlight.classList.remove('rizzly-highlight');
        }
        const element = document.querySelector('${selector}');
        if (element) {
          element.classList.add('rizzly-highlight');
          element.style.outline = '3px solid #f25a44';
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return 'success: element highlighted';
        } else {
          return 'error: element not found';
        }
      })();
    `;
    view.webContents.executeJavaScript(script)
      .then(result => console.log('script result:', result))
      .catch(err => console.error('script execution failed:', err));
  }
});
