const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const unpackedDir = path.join(root, 'release', 'win-unpacked');
if (!fs.existsSync(unpackedDir)) {
  console.error('win-unpacked not found:', unpackedDir);
  process.exit(1);
}

const cmdPath = path.join(unpackedDir, 'H5 Quick Maker Debug.cmd');
const cmd = [
  '@echo off',
  'setlocal',
  'cd /d "%~dp0"',
  'set ELECTRON_ENABLE_LOGGING=1',
  'set ELECTRON_ENABLE_STACK_DUMPING=1',
  'set ELECTRON_LOG_FILE=%CD%\\\\debug-electron.log',
  'echo [H5 Quick Maker Debug] starting...',
  'echo debug log file: %ELECTRON_LOG_FILE%',
  '"%~dp0H5 Quick Maker.exe" --debug --enable-logging --v=1',
  'echo.',
  'echo Process exited with code: %errorlevel%',
  'pause'
].join('\r\n');

fs.writeFileSync(cmdPath, cmd, 'utf8');
console.log('Debug launcher generated:', cmdPath);
