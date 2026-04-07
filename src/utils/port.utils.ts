import net from 'net';

/**
 * Find an available port starting from the given port
 * @param port - Port number to start checking
 * @param maxPort - Maximum port to check (default 65535)
 */
export function getAvailablePort(port: number, maxPort: number = 65535): Promise<number> {
  if (port > maxPort) {
    return Promise.reject(new Error(`No available port found between ${port} and ${maxPort}`));
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err: { code: string }) => {
      if (err?.code === 'EADDRINUSE') {
        resolve(getAvailablePort(port + 1, maxPort)); // Try next port
      } else {
        reject(err);
      }
    });

    server.once('listening', () => server.close(() => resolve(port)));

    server.listen(port);
  });
}
