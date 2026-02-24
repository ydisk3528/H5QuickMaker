import { contextBridge, ipcRenderer } from 'electron';
import type { BuildKind, BuildProgress, BuildResult, CreateProjectPayload, CreateProjectResult, CreateProjectProgress } from './project-maker.js';

type ValidationResult = { ok: boolean; message: string };
type IconPreviewResult = { ok: boolean; dataUrl?: string; message?: string };
type HoutaiConfig = {
  contentPassword: string;
  packageName: string;
  link: string;
  remark: string;
  updatedAt: string;
};
type LoadTypeOption = { label: string; value: string };
type SyncPasswordResult = { stringFogPath: string };

const api = {
  pickDirectory: () => ipcRenderer.invoke('pick-directory') as Promise<string | null>,
  createProject: (payload: CreateProjectPayload) => ipcRenderer.invoke('create-project-with-progress', payload) as Promise<CreateProjectResult>,
  checkProjectName: (outputRoot: string, projectName: string) =>
    ipcRenderer.invoke('check-project-name', outputRoot, projectName) as Promise<boolean>,
  loadProjectRecords: () => ipcRenderer.invoke('load-project-records') as Promise<string>,
  saveProjectRecords: (raw: string) => ipcRenderer.invoke('save-project-records', raw) as Promise<boolean>,
  loadHoutaiConfig: () => ipcRenderer.invoke('load-houtai-config') as Promise<HoutaiConfig>,
  loadHoutaiConfigRaw: () => ipcRenderer.invoke('load-houtai-config-raw') as Promise<string>,
  loadLoadTypeOptions: () => ipcRenderer.invoke('load-loadtype-options') as Promise<LoadTypeOption[]>,
  saveHoutaiConfig: (config: HoutaiConfig) => ipcRenderer.invoke('save-houtai-config', config) as Promise<boolean>,
  syncContentPassword: (contentPassword: string) =>
    ipcRenderer.invoke('sync-content-password', contentPassword) as Promise<SyncPasswordResult>,
  validateIconResDir: (dirPath: string) => ipcRenderer.invoke('validate-icon-res-dir', dirPath) as Promise<ValidationResult>,
  loadPlaystoreIconPreview: (dirPath: string) =>
    ipcRenderer.invoke('load-playstore-icon-preview', dirPath) as Promise<IconPreviewResult>,
  validateGamePackageDir: (dirPath: string) => ipcRenderer.invoke('validate-game-package-dir', dirPath) as Promise<ValidationResult>,
  buildArtifact: (projectPath: string, kind: BuildKind) =>
    ipcRenderer.invoke('build-artifact', projectPath, kind) as Promise<BuildResult>,
  installApk: (apkPath: string, options?: { autoLaunch?: boolean; packageName?: string }) =>
    ipcRenderer.invoke('adb-install-apk', apkPath, options) as Promise<boolean>,
  startLogcat: (options?: { clear?: boolean }) => ipcRenderer.invoke('start-logcat', options) as Promise<boolean>,
  stopLogcat: () => ipcRenderer.invoke('stop-logcat') as Promise<boolean>,
  onProjectProgress: (listener: (progress: CreateProjectProgress) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, progress: CreateProjectProgress) => listener(progress);
    ipcRenderer.on('project-progress', wrapped);
    return () => ipcRenderer.removeListener('project-progress', wrapped);
  },
  onBuildProgress: (listener: (progress: BuildProgress) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, progress: BuildProgress) => listener(progress);
    ipcRenderer.on('build-progress', wrapped);
    return () => ipcRenderer.removeListener('build-progress', wrapped);
  },
  onAdbProgress: (listener: (line: string) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, line: string) => listener(line);
    ipcRenderer.on('adb-progress', wrapped);
    return () => ipcRenderer.removeListener('adb-progress', wrapped);
  },
  onLogcatLine: (listener: (line: string) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, line: string) => listener(line);
    ipcRenderer.on('logcat-line', wrapped);
    return () => ipcRenderer.removeListener('logcat-line', wrapped);
  }
};

contextBridge.exposeInMainWorld('quickMaker', api);
