import { Notification, app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { promises as fs } from 'node:fs';
import {
  buildProjectArtifact,
  createProject,
  installApkByAdbWithOptions,
  loadHoutaiConfig,
  loadHoutaiConfigRaw,
  loadLoadTypeOptions,
  loadPlaystoreIconPreview,
  loadProjectRecordsRaw,
  projectNameExists,
  saveHoutaiConfig,
  saveProjectRecordsRaw,
  syncWinnerStringFogKey,
  validateGamePackageDirectory,
  validateIconResourceDirectory,
  type BuildKind,
  type BuildProgress,
  type CreateProjectPayload,
  type CreateProjectProgress,
  type HoutaiConfig
} from './project-maker.js';

let logcatProcess: ChildProcessWithoutNullStreams | null = null;
const gotTheLock = app.requestSingleInstanceLock();
const isDebugMode = process.argv.includes('--debug');

if (isDebugMode) {
  app.commandLine.appendSwitch('enable-logging');
  app.commandLine.appendSwitch('v', '1');
}

async function runAdbOnce(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('adb', args, { shell: false });
    let err = '';
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', (e) => reject(new Error(`adb failed to start: ${e.message}`)));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`adb ${args.join(' ')} failed (${code}): ${err}`));
    });
  });
}

function createMainWindow(): void {
  const win = new BrowserWindow({
    width: 980,
    height: 760,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const isDev = process.argv.includes('--dev');
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  if (isDebugMode) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[did-fail-load]', errorCode, errorDescription, validatedURL);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[render-process-gone]', details.reason, details.exitCode);
  });
  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (!isDebugMode) return;
    console.log(`[renderer:${level}] ${sourceId}:${line} ${message}`);
  });
}

ipcMain.handle('pick-directory', async () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  const result = focusedWindow
    ? await dialog.showOpenDialog(focusedWindow, { properties: ['openDirectory'] })
    : await dialog.showOpenDialog({ properties: ['openDirectory'] });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('path-exists', async (_event, targetPath: string) => {
  if (!targetPath || !targetPath.trim()) return false;
  try {
    await fs.access(targetPath.trim());
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('create-project', async (_event, payload: CreateProjectPayload) => {
  return createProject(payload);
});

ipcMain.handle('create-project-with-progress', async (event, payload: CreateProjectPayload) => {
  return createProject(payload, (progress: CreateProjectProgress) => {
    event.sender.send('project-progress', progress);
  });
});

ipcMain.handle('check-project-name', async (_event, outputRoot: string, projectName: string) => {
  return projectNameExists(outputRoot, projectName);
});

ipcMain.handle('load-project-records', async () => {
  return loadProjectRecordsRaw();
});

ipcMain.handle('save-project-records', async (_event, raw: string) => {
  await saveProjectRecordsRaw(raw);
  return true;
});

ipcMain.handle('load-houtai-config', async () => {
  return loadHoutaiConfig();
});

ipcMain.handle('load-houtai-config-raw', async () => {
  return loadHoutaiConfigRaw();
});

ipcMain.handle('load-loadtype-options', async () => {
  return loadLoadTypeOptions();
});

ipcMain.handle('save-houtai-config', async (_event, config: HoutaiConfig) => {
  await saveHoutaiConfig(config);
  return true;
});

ipcMain.handle('sync-content-password', async (_event, contentPassword: string) => {
  return syncWinnerStringFogKey(contentPassword);
});

ipcMain.handle('validate-icon-res-dir', async (_event, dirPath: string) => {
  return validateIconResourceDirectory(dirPath);
});

ipcMain.handle('load-playstore-icon-preview', async (_event, dirPath: string) => {
  return loadPlaystoreIconPreview(dirPath);
});

ipcMain.handle('validate-game-package-dir', async (_event, dirPath: string) => {
  return validateGamePackageDirectory(dirPath);
});

ipcMain.handle('build-artifact', async (event, projectPath: string, kind: BuildKind) => {
  const result = await buildProjectArtifact(projectPath, kind, (progress: BuildProgress) => {
    event.sender.send('build-progress', progress);
  });
  const projectName = path.basename(projectPath);
  let finalArtifactPath = result.artifactPath;
  if (kind === 'apk') {
    shell.showItemInFolder(result.artifactPath);
  }
  if (kind === 'aab') {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    let defaultDir = path.join('E:\\pic', projectName);
    try {
      await fs.mkdir(defaultDir, { recursive: true });
    } catch {
      defaultDir = 'E:\\pic';
    }

    const picked = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, {
          title: '请选择aab的存放目录',
          defaultPath: defaultDir,
          properties: ['openDirectory', 'createDirectory', 'promptToCreate']
        })
      : await dialog.showOpenDialog({
          title: '请选择aab的存放目录',
          defaultPath: defaultDir,
          properties: ['openDirectory', 'createDirectory', 'promptToCreate']
        });

    if (!picked.canceled && picked.filePaths.length > 0) {
      const targetDir = picked.filePaths[0];
      const copiedPath = path.join(targetDir, path.basename(result.artifactPath));
      await fs.copyFile(result.artifactPath, copiedPath);
      finalArtifactPath = copiedPath;
      shell.showItemInFolder(copiedPath);
    } else {
      shell.showItemInFolder(result.artifactPath);
    }
  }
  if (Notification.isSupported()) {
    new Notification({
      title: 'H5 Quick Maker',
      body: `${projectName}\n${finalArtifactPath}`
    }).show();
  }
  return { ...result, artifactPath: finalArtifactPath };
});

ipcMain.handle(
  'adb-install-apk',
  async (event, apkPath: string, options?: { autoLaunch?: boolean; packageName?: string }) => {
    await installApkByAdbWithOptions(
      apkPath,
      options,
      (line) => {
        event.sender.send('adb-progress', line);
      }
    );
    return true;
  }
);

ipcMain.handle('start-logcat', async (event, options?: { clear?: boolean }) => {
  if (logcatProcess) {
    return true;
  }
  if (options?.clear) {
    try {
      await runAdbOnce(['logcat', '-c']);
    } catch {
      // ignore clear failure
    }
  }
  const sender = event.sender;
  logcatProcess = spawn('adb', ['logcat', '-v', 'time'], { shell: false });
  const forward = (chunk: Buffer, prefix = '') => {
    const text = chunk.toString();
    text
      .split(/\r?\n/)
      .map((x) => x.trimEnd())
      .filter(Boolean)
      .forEach((line) => sender.send('logcat-line', `${prefix}${line}`));
  };
  logcatProcess.stdout.on('data', (d) => forward(d));
  logcatProcess.stderr.on('data', (d) => forward(d, '[ERR] '));
  logcatProcess.on('close', (code) => {
    sender.send('logcat-line', `[LOGCAT] stopped (code=${code ?? 0})`);
    logcatProcess = null;
  });
  logcatProcess.on('error', (err) => {
    sender.send('logcat-line', `[LOGCAT] error: ${err.message}`);
  });
  return true;
});

ipcMain.handle('stop-logcat', async () => {
  if (logcatProcess) {
    logcatProcess.kill();
    logcatProcess = null;
  }
  return true;
});

app.whenReady().then(() => {
  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.setAppUserModelId('com.h5quickmaker.app');
  Menu.setApplicationMenu(null);
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('second-instance', () => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length === 0) {
    createMainWindow();
    return;
  }
  const win = windows[0];
  if (win.isMinimized()) {
    win.restore();
  }
  win.focus();
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

app.on('window-all-closed', () => {
  if (logcatProcess) {
    logcatProcess.kill();
    logcatProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

