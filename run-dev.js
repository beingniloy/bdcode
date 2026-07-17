import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import net from 'net';

const __dirname = dirname(fileURLToPath(import.meta.url));

const VITE_PORT = Number(process.env.VITE_DEV_PORT) || 4500;

// Resolve local binaries (avoid npx for reliability)
const viteBin = resolve(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const electronBin = resolve(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');

// Clean up any orphaned process occupying the port
try {
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${VITE_PORT} -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"`);
  }
} catch (e) {
  // Ignore errors if no process is holding the port
}

function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const socket = new net.Socket();
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error('Vite server did not start in time'));
        } else {
          setTimeout(check, 300);
        }
      });
      socket.connect(port, '127.0.0.1');
    }
    check();
  });
}

console.log('[Runner]: Starting Vite dev server...');
const vite = spawn(viteBin, ['--host', '127.0.0.1', '--port', String(VITE_PORT)], {
  shell: true,
  stdio: 'inherit'
});

waitForPort(VITE_PORT)
  .then(() => {
    console.log('[Runner]: Vite ready. Starting Electron...');
    const electron = spawn(electronBin, ['.'], {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development'
      }
    });

    electron.on('close', (code) => {
      console.log(`[Runner]: Electron closed with code ${code}. Cleaning up Vite...`);
      vite.kill('SIGINT');
      process.exit(code || 0);
    });
  })
  .catch((err) => {
    console.error('[Runner]:', err.message);
    vite.kill('SIGINT');
    process.exit(1);
  });

process.on('SIGINT', () => {
  vite.kill('SIGINT');
  process.exit(0);
});
