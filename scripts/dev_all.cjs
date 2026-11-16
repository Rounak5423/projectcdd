#!/usr/bin/env node
/**
 * Unified Localhost Launcher (npm run dev:all)
 * Checks port availability (5173, 8000), prints service routing map,
 * and launches Vite Frontend and FastAPI Backend concurrently.
 */

const net = require('net');
const path = require('path');
const concurrently = require('concurrently');

function checkPort(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '0.0.0.0');
  });
}

async function main() {
  console.log('\n==================================================');
  console.log('  GENESIS CIVILISATION ENGINE — LOCAL STACK LAUNCHER');
  console.log('==================================================');
  
  const port8000Free = await checkPort(8000);
  const port5173Free = await checkPort(5173);

  console.log(`[PORT STATUS] Backend (FastAPI / ML) Port 8000: ${port8000Free ? 'AVAILABLE' : 'IN USE (Port Busy)'}`);
  console.log(`[PORT STATUS] Frontend (React 19 / Vite) Port 5173: ${port5173Free ? 'AVAILABLE' : 'IN USE (Port Busy)'}`);

  if (!port8000Free || !port5173Free) {
    console.error('\n[ERROR] One or more ports are already busy!');
    if (!port8000Free) console.error('  -> Port 8000 is occupied. Terminate the existing backend process or run lsof -ti :8000 | xargs kill -9');
    if (!port5173Free) console.error('  -> Port 5173 is occupied. Terminate the existing frontend process or run lsof -ti :5173 | xargs kill -9');
    console.error('Stack launch aborted to prevent port conflicts.\n');
    process.exit(1);
  }

  console.log('\n[SERVICES]');
  console.log('  • Frontend: http://localhost:5173 (React 19, Three.js 3D Viewport)');
  console.log('  • Backend:  http://localhost:8000 (FastAPI, SQLite WAL, Telemetry API)');
  console.log('  • Health:   http://localhost:8000/health');
  console.log('  • API Docs: http://localhost:8000/docs');
  console.log('==================================================\n');

  const { result } = concurrently(
    [
      {
        command: 'cd genesis-engine/backend && ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000',
        name: 'backend',
        prefixColor: 'cyan',
      },
      {
        command: 'npm run dev -- --host 0.0.0.0 --port 5173',
        name: 'frontend',
        prefixColor: 'green',
      },
    ],
    {
      killOthers: ['failure', 'success'],
      restartTries: 0,
    }
  );

  result.catch((err) => {
    // Process terminated
  });
}

main();
