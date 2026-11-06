import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const apiPort = process.env.DIVIDI_API_PORT || '3001';
const children = [
  spawn(process.execPath, ['server/index.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DIVIDI_API_PORT: apiPort, NODE_ENV: 'development' },
  }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DIVIDI_API_PORT: apiPort },
  }),
];
let stopped = false;
function stop(code = 0) {
  if (stopped) return;
  stopped = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const child of children) {
  child.on('error', (e) => {
    console.error(e.message);
    stop(1);
  });
  child.on('exit', (code) => stop(code || 0));
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
