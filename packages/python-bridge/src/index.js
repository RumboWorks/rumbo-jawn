import { spawn } from 'child_process';
import path from 'path';

// Python binary — defaults to python3 on PATH.
const PYTHON = process.env.PYTHON_BIN ?? 'python3';

// Python analysis module root.
const PYTHON_ROOT = process.env.PYTHON_ROOT
  ?? path.join(process.cwd(), 'python');

// ---- Call a Python script ----
// Spawns the script, sends `input` as JSON on stdin, returns parsed JSON from stdout.
// stderr is forwarded to console.error for visibility.

export async function callPython(scriptRelPath, input = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(PYTHON_ROOT, scriptRelPath);
    const proc = spawn(PYTHON, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (stderr) console.error(`[python-bridge] ${scriptRelPath} stderr:\n${stderr}`);
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}: ${stderr}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`Python script returned non-JSON stdout: ${stdout}`));
      }
    });

    proc.on('error', reject);
  });
}

// ---- Ping — verify Python is available ----
// Runs a tiny inline script to confirm python3 is accessible.

export async function pingPython() {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, ['-c', 'import json,sys; print(json.dumps({"ok":True}))'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    proc.stdout.on('data', d => { out += d; });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error('Python not available'));
      try { resolve(JSON.parse(out)); } catch { reject(new Error('Python ping failed')); }
    });
    proc.on('error', reject);
  });
}
