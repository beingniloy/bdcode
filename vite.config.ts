import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'net';

/**
 * Find an available port starting from the preferred port.
 * Falls back to the next available port if the preferred one is in use.
 */
function findAvailablePort(preferred: number, maxAttempts = 20): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (port: number, attempt: number) => {
      if (attempt > maxAttempts) {
        reject(new Error(`No available port found after ${maxAttempts} attempts`));
        return;
      }
      const server = net.createServer();
      server.once('error', () => {
        server.close(() => tryPort(port + 1, attempt + 1));
      });
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port, '127.0.0.1');
    };
    tryPort(preferred, 0);
  });
}

let port: number;
// Run port detection only during dev server start (not during build)
try {
  // During dev, Vite evaluates config synchronously, so we use a sync-like default
  port = Number(process.env.VITE_DEV_PORT) || 4500;
} catch {
  port = 4500;
}

// https://vitejs.dev/config/
export default defineConfig(async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const availablePort = await findAvailablePort(port);
      if (availablePort !== port) {
        console.log(`[vite] Port ${port} was in use, using port ${availablePort} instead`);
        port = availablePort;
      }
    } catch (e) {
      console.warn('[vite] Could not find available port, using default:', port);
    }
  }

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: false,
      open: false
    }
  };
});
