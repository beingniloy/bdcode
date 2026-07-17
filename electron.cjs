const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execFile } = require('child_process');
const { autoUpdater } = require('electron-updater');

// Set app name for system tray, taskbar, task manager, installed apps
app.setName('Bangladesh Code');

// Try to load node-pty for real PTY support; fall back to spawn
let pty = null;
try {
  pty = require('node-pty');
} catch (e) {
  // node-pty is optional — spawn fallback works fine
}

// Prevent EPIPE/broken pipe errors and other uncaught exceptions from showing popups or crashing
process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception in Main Process:', err);
});

if (process.stdout) {
  process.stdout.on('error', (err) => {
    if (err.code === 'EPIPE') {
      // Ignore broken pipe errors
    }
  });
}

if (process.stderr) {
  process.stderr.on('error', (err) => {
    if (err.code === 'EPIPE') {
      // Ignore broken pipe errors
    }
  });
}


let mainWindow;
let workspaceRoot = process.cwd();
let shellProcess = null;
let terminalHistory = '';
let usingPty = false;

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const iconPath = isDev 
    ? path.join(__dirname, 'public', 'images', 'logo.png')
    : path.join(__dirname, 'dist', 'images', 'logo.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless window!
    titleBarStyle: 'hidden', // Hidden OS titlebar
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: iconPath,
    title: 'Bangladesh Code'
  });

  mainWindow.setMenuBarVisibility(false);

  // Open target="_blank" links in default browser instead of Electron frame
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      const { shell } = require('electron');
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Log renderer process errors to main console for debugging
  mainWindow.webContents.on('crashed', (event, code) => {
    console.error(`[Renderer] Process crashed with code ${code}`);
  });
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error(`[Renderer] Process gone: ${details.reason}`, details);
  });
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) { // Warning and above
      console.log(`[Renderer ${level === 2 ? 'WARN' : 'ERROR'}]: ${message} (${sourceId}:${line})`);
    }
  });

  // Set CSP headers via session — skip CSP for dev server to avoid blocking Vite HMR/modules
  if (!isDev) {
    const CSP = "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; worker-src 'self' blob: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;";
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [CSP]
        }
      });
    });
  }

  if (isDev) {
    const devPort = process.env.VITE_DEV_PORT || '4500';
    mainWindow.loadURL(`http://127.0.0.1:${devPort}/`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (shellProcess) {
      shellProcess.kill();
    }
  });

  // Spawn initial powershell shell session
  startNewShell();
}

app.on('ready', () => {
  createWindow();
  // Check for updates 3 seconds after window is ready
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 3000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// ==========================================
// PERSISTENT SHELL CONNECTION
// Uses node-pty if available (real PTY, same as VS Code)
// Falls back to child_process.spawn otherwise
// ==========================================
function getShellPath() {
  const platform = os.platform();
  if (platform === 'win32') {
    return 'powershell.exe';
  } else if (platform === 'darwin') {
    return process.env.SHELL || '/bin/zsh';
  } else {
    return process.env.SHELL || '/bin/bash';
  }
}

function startNewShellWith(shellOverride) {
  if (shellProcess) {
    try {
      shellProcess.kill();
    } catch (e) {
      console.error('Failed to kill previous shell:', e);
    }
  }

  terminalHistory = '';
  const shell = shellOverride || getShellPath();

  if (pty) {
    try {
      usingPty = true;
      shellProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: workspaceRoot,
        env: process.env,
      });

      shellProcess.onData((data) => {
        terminalHistory += data;
        if (mainWindow) {
          mainWindow.webContents.send('terminal-data', data);
        }
      });

      shellProcess.onExit(({ exitCode }) => {
        console.log(`PTY exited with code ${exitCode}`);
        if (mainWindow) {
          mainWindow.webContents.send('terminal-data', `\r\n[Shell exited with code ${exitCode}]\r\n`);
        }
      });

      console.log('Shell started with node-pty (full PTY):', shell);
      return;
    } catch (e) {
      console.error('node-pty spawn failed, falling back to spawn:', e);
      usingPty = false;
    }
  }

  usingPty = false;
  const isPowerShell = shell.includes('powershell');
  const args = os.platform() === 'win32'
    ? (isPowerShell ? ['-NoLogo', '-NoExit'] : ['/C'])
    : ['-i'];
  shellProcess = spawn(shell, args, {
    cwd: workspaceRoot,
    env: process.env,
  });

  shellProcess.stdout.on('data', (data) => {
    const str = data.toString();
    terminalHistory += str;
    if (mainWindow) {
      mainWindow.webContents.send('terminal-data', str);
    }
  });

  shellProcess.stderr.on('data', (data) => {
    const str = data.toString();
    terminalHistory += str;
    if (mainWindow) {
      mainWindow.webContents.send('terminal-data', str);
    }
  });

  shellProcess.on('close', (code) => {
    console.log(`Shell process closed with code ${code}`);
    if (mainWindow) {
      mainWindow.webContents.send('terminal-data', `\r\n[Shell exited with code ${code}]\r\n`);
    }
  });

  console.log('Shell started with spawn (fallback mode):', shell);
}

function startNewShell() {
  startNewShellWith(null);
}

// ==========================================
// WINDOW CONTROL IPC HANDLERS
// ==========================================
ipcMain.handle('window-control', (event, action) => {
  if (!mainWindow) return;
  if (action === 'minimize') {
    mainWindow.minimize();
  } else if (action === 'maximize') {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  } else if (action === 'close') {
    mainWindow.close();
  }
});

ipcMain.on('set-title', (_event, title) => {
  if (mainWindow) {
    mainWindow.setTitle(title || 'Bangladesh Code');
  }
});

// ==========================================
// AUTO-UPDATE
// ==========================================
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let updateAvailable = false;
let updateInfo = null;

autoUpdater.on('update-available', (info) => {
  updateAvailable = true;
  updateInfo = { version: info.version, releaseDate: info.releaseDate };
  if (mainWindow) {
    mainWindow.webContents.send('update-available', updateInfo);
  }
});

autoUpdater.on('update-not-available', () => {
  updateAvailable = false;
  updateInfo = null;
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available');
  }
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    });
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  }
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
});

ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      updateAvailable: !!result?.updateInfo,
      version: result?.updateInfo?.version || null,
      releaseDate: result?.updateInfo?.releaseDate || null
    };
  } catch (err) {
    console.error('Check for updates failed:', err);
    return { updateAvailable: false, version: null, releaseDate: null, error: err.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return true;
  } catch (err) {
    console.error('Download update failed:', err);
    return false;
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ==========================================
// FILESYSTEM IPC OPERATIONS HANDLERS
// ==========================================
function isIgnored(name) {
  const ignored = ['node_modules', '.git', 'dist', 'package-lock.json', '.agent'];
  return ignored.includes(name);
}

function safePath(relPath) {
  const fullPath = path.isAbsolute(relPath) ? relPath : path.join(workspaceRoot, relPath);
  const resolved = path.resolve(fullPath);
  const rootResolved = path.resolve(workspaceRoot);
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

function buildFileTree(dirPath, relativePath = '') {
  const items = fs.readdirSync(dirPath);
  const result = [];

  for (const name of items) {
    if (isIgnored(name)) continue;

    const fullPath = path.join(dirPath, name);
    const relPath = relativePath ? `${relativePath}/${name}` : name;
    let isFolder = false;
    try {
      const stat = fs.statSync(fullPath);
      isFolder = stat.isDirectory();
    } catch (e) {
      // Handle broken symlinks
      continue;
    }

    const node = {
      name,
      path: relPath,
      isFolder
    };

    if (isFolder) {
      node.children = buildFileTree(fullPath, relPath);
    }

    result.push(node);
  }

  return result.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });
}

// IPC Handlers
ipcMain.handle('get-platform', () => {
  return os.platform();
});

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  workspaceRoot = result.filePaths[0];
  
  // Respawn shell terminal in the new Cwd
  startNewShell();

  return {
    path: workspaceRoot,
    tree: buildFileTree(workspaceRoot)
  };
});

ipcMain.handle('read-workspace', () => {
  try {
    return {
      path: workspaceRoot,
      tree: buildFileTree(workspaceRoot)
    };
  } catch (error) {
    console.error('Error reading workspace:', error);
    return { path: workspaceRoot, tree: [] };
  }
});

ipcMain.handle('read-file', (event, relPath) => {
  try {
    const fullPath = safePath(relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relPath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${relPath}:`, error);
    throw error;
  }
});

ipcMain.handle('write-file', (event, relPath, content) => {
  try {
    const fullPath = safePath(relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${relPath}:`, error);
    throw error;
  }
});

// Disk-based search: searches all text files in the workspace
ipcMain.handle('search-files', (event, { query, caseSensitive, wholeWord, useRegex }) => {
  const results = [];
  if (!query) return results;

  let pattern;
  try {
    let p = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) p = `\\b${p}\\b`;
    pattern = new RegExp(p, caseSensitive ? 'g' : 'gi');
  } catch (e) {
    return results;
  }

  function searchDir(dirPath, relPrefix) {
    let entries;
    try { entries = fs.readdirSync(dirPath); } catch (e) { return; }
    for (const name of entries) {
      if (isIgnored(name)) continue;
      const fullPath = path.join(dirPath, name);
      const relPath = relPrefix ? `${relPrefix}/${name}` : name;
      let stat;
      try { stat = fs.statSync(fullPath); } catch (e) { continue; }
      if (stat.isDirectory()) {
        searchDir(fullPath, relPath);
      } else {
        // Only search text files by extension
        const ext = path.extname(name).toLowerCase();
        if (!['.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.php', '.py', '.java', '.c', '.cpp', '.h', '.xml', '.yaml', '.yml', '.svg', '.txt', '.env', '.sh', '.sql', '.rb', '.go', '.rs'].includes(ext)) continue;
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            pattern.lastIndex = 0;
            const match = pattern.exec(lines[i]);
            if (match) {
              results.push({ path: relPath, line: i + 1, text: lines[i].trim(), colStart: match.index, colEnd: match.index + match[0].length });
            }
          }
        } catch (e) { /* skip binary/inaccessible files */ }
      }
    }
  }

  searchDir(workspaceRoot, '');
  return results;
});

// Disk-based replace: replaces all matches in all text files
ipcMain.handle('replace-in-files', (event, { query, replacement, caseSensitive, wholeWord, useRegex }) => {
  if (!query) return { totalReplacements: 0 };
  let totalReplacements = 0;

  let pattern;
  try {
    let p = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) p = `\\b${p}\\b`;
    pattern = new RegExp(p, caseSensitive ? 'g' : 'gi');
  } catch (e) {
    return { totalReplacements: 0 };
  }

  function replaceInDir(dirPath, relPrefix) {
    let entries;
    try { entries = fs.readdirSync(dirPath); } catch (e) { return; }
    for (const name of entries) {
      if (isIgnored(name)) continue;
      const fullPath = path.join(dirPath, name);
      const relPath = relPrefix ? `${relPrefix}/${name}` : name;
      let stat;
      try { stat = fs.statSync(fullPath); } catch (e) { continue; }
      if (stat.isDirectory()) {
        replaceInDir(fullPath, relPath);
      } else {
        const ext = path.extname(name).toLowerCase();
        if (!['.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.php', '.py', '.java', '.c', '.cpp', '.h', '.xml', '.yaml', '.yml', '.svg', '.txt', '.env', '.sh', '.sql', '.rb', '.go', '.rs'].includes(ext)) continue;
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          pattern.lastIndex = 0;
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            totalReplacements += matches.length;
            pattern.lastIndex = 0;
            const newContent = content.replace(pattern, replacement);
            fs.writeFileSync(fullPath, newContent, 'utf-8');
          }
        } catch (e) { /* skip binary/inaccessible files */ }
      }
    }
  }

  replaceInDir(workspaceRoot, '');
  return { totalReplacements };
});

ipcMain.handle('create-file', (event, relPath) => {
  try {
    const fullPath = safePath(relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, '', 'utf-8');
    }
    return true;
  } catch (error) {
    console.error(`Error creating file ${relPath}:`, error);
    throw error;
  }
});

ipcMain.handle('create-folder', (event, relPath) => {
  try {
    const fullPath = safePath(relPath);
    fs.mkdirSync(fullPath, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Error creating folder ${relPath}:`, error);
    throw error;
  }
});

ipcMain.handle('delete-item', (event, relPath) => {
  try {
    const fullPath = safePath(relPath);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    return true;
  } catch (error) {
    console.error(`Error deleting item ${relPath}:`, error);
    throw error;
  }
});

ipcMain.handle('rename-item', (event, oldRelPath, newRelPath) => {
  try {
    const oldFullPath = safePath(oldRelPath);
    const newFullPath = safePath(newRelPath);
    fs.renameSync(oldFullPath, newFullPath);
    return true;
  } catch (error) {
    console.error(`Error renaming ${oldRelPath} to ${newRelPath}:`, error);
    throw error;
  }
});

// Terminal input: pass-through to shell (PTY or spawn)
ipcMain.on('terminal-input', (event, text) => {
  if (shellProcess) {
    try {
      if (usingPty) {
        shellProcess.write(text);
      } else {
        shellProcess.stdin.write(text);
      }
    } catch (e) {
      console.error('Failed to write to shell:', e);
    }
  }
});

// Terminal resize: only works with PTY
ipcMain.on('terminal-resize', (event, { cols, rows }) => {
  if (shellProcess && usingPty) {
    try {
      shellProcess.resize(cols, rows);
    } catch (e) {
      console.error('Failed to resize PTY:', e);
    }
  }
});

ipcMain.handle('get-terminal-history', () => {
  return terminalHistory;
});

ipcMain.handle('is-pty', () => {
  return usingPty;
});

ipcMain.handle('restart-shell', (event, shellPath) => {
  if (shellPath) {
    // Override the shell for this restart
    const savedShell = workspaceRoot;
    workspaceRoot = savedShell;
    startNewShellWith(shellPath);
  } else {
    startNewShell();
  }
  return true;
});

// ==========================================
// GIT INTEGRATION IPC HANDLERS
// ==========================================

// Dedicated commit handler: takes message directly as separate arg, no quoting issues
ipcMain.handle('git-commit', (event, message) => {
  return new Promise((resolve) => {
    execFile('git', ['add', '.'], { cwd: workspaceRoot }, (addErr) => {
      if (addErr) {
        resolve({ success: false, stdout: '', stderr: addErr.message });
        return;
      }
      execFile('git', ['commit', '-m', message], { cwd: workspaceRoot }, (err, stdout, stderr) => {
        resolve({
          success: !err,
          stdout: stdout ? stdout.toString() : '',
          stderr: stderr ? stderr.toString() : ''
        });
      });
    });
  });
});

ipcMain.handle('git-status', () => {
  return new Promise((resolve) => {
    execFile('git', ['status', '--porcelain'], { cwd: workspaceRoot }, (err, stdout) => {
      if (err) {
        resolve({ isRepo: false, branch: 'main', files: [] });
        return;
      }
      
      const lines = stdout.split('\n').filter(line => line.trim() !== '');
      const files = lines.map(line => {
        const status = line.slice(0, 2).trim();
        const file = line.slice(3).trim();
        return { status, file };
      });
      
      execFile('git', ['branch', '--show-current'], { cwd: workspaceRoot }, (bErr, bStdout) => {
        resolve({
          isRepo: true,
          branch: bStdout.trim() || 'main',
          files
        });
      });
    });
  });
});

// Whitelisted git subcommands to prevent command injection
const ALLOWED_GIT_CMDS = ['init', 'add', 'status', 'diff', 'log', 'branch', 'push', 'pull', 'fetch', 'stash', 'commit'];

ipcMain.handle('git-cmd', (event, cmdArgs) => {
  return new Promise((resolve) => {
    // Parse and validate: only allow whitelisted subcommands
    const parts = cmdArgs.trim().split(/\s+/);
    const subCmd = parts[0];
    
    if (!ALLOWED_GIT_CMDS.includes(subCmd)) {
      resolve({ success: false, stdout: '', stderr: `Blocked: '${subCmd}' is not allowed` });
      return;
    }
    
    // For commit, extract message without shell quoting artifacts
    if (subCmd === 'commit') {
      const commitIdx = parts.indexOf('-m');
      if (commitIdx === -1 || !parts[commitIdx + 1]) {
        resolve({ success: false, stdout: '', stderr: 'Invalid commit command: -m flag required' });
        return;
      }
      // Join everything after -m and strip any wrapper quotes from the frontend
      const rawMsg = parts.slice(commitIdx + 1).join(' ');
      const msg = rawMsg.replace(/^["']|["']$/g, '').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      execFile('git', ['commit', '-m', msg], { cwd: workspaceRoot }, (err, stdout, stderr) => {
        resolve({
          success: !err,
          stdout: stdout ? stdout.toString() : '',
          stderr: stderr ? stderr.toString() : ''
        });
      });
      return;
    }
    
    // For other allowed commands, pass args safely
    execFile('git', parts, { cwd: workspaceRoot }, (err, stdout, stderr) => {
      resolve({
        success: !err,
        stdout: stdout ? stdout.toString() : '',
        stderr: stderr ? stderr.toString() : ''
      });
    });
  });
});

