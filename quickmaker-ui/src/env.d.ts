/// <reference types="vite/client" />

type CreateProjectPayload = {
  templatePath: string;
  outputRoot: string;
  namespaceFilePath: string;
  applicationId: string;
  projectName: string;
  gamePackagePath: string;
  iconResPath: string;
  contentPassword?: string;
  backendConfig?: Record<string, string>;
  backendAdjParams?: Record<string, string>;
};

type CreateProjectResult = {
  destinationProjectPath: string;
  namespace: string;
  keystorePath: string;
  backupGamePackagePath: string;
  contentPassword?: string;
};

type CreateProjectProgress = {
  percent: number;
  message: string;
};

type BuildKind = 'apk' | 'aab';

type BuildProgress = {
  kind: BuildKind;
  message: string;
};

type BuildResult = {
  kind: BuildKind;
  artifactPath: string;
};

type ValidationResult = {
  ok: boolean;
  message: string;
};
type IconPreviewResult = {
  ok: boolean;
  dataUrl?: string;
  message?: string;
};

type HoutaiConfig = {
  contentPassword: string;
  packageName: string;
  link: string;
  remark: string;
  updatedAt: string;
};
type LoadTypeOption = {
  label: string;
  value: string;
};
type SyncPasswordResult = {
  stringFogPath: string;
};

declare global {
  interface Window {
    quickMaker: {
      pickDirectory: () => Promise<string | null>;
      createProject: (payload: CreateProjectPayload) => Promise<CreateProjectResult>;
      checkProjectName: (outputRoot: string, projectName: string) => Promise<boolean>;
      loadProjectRecords: () => Promise<string>;
      saveProjectRecords: (raw: string) => Promise<boolean>;
      loadHoutaiConfig: () => Promise<HoutaiConfig>;
      loadHoutaiConfigRaw: () => Promise<string>;
      loadLoadTypeOptions: () => Promise<LoadTypeOption[]>;
      saveHoutaiConfig: (config: HoutaiConfig) => Promise<boolean>;
      syncContentPassword: (contentPassword: string) => Promise<SyncPasswordResult>;
      validateIconResDir: (dirPath: string) => Promise<ValidationResult>;
      loadPlaystoreIconPreview: (dirPath: string) => Promise<IconPreviewResult>;
      validateGamePackageDir: (dirPath: string) => Promise<ValidationResult>;
      buildArtifact: (projectPath: string, kind: BuildKind) => Promise<BuildResult>;
      installApk: (
        apkPath: string,
        options?: { autoLaunch?: boolean; packageName?: string }
      ) => Promise<boolean>;
      startLogcat: (options?: { clear?: boolean }) => Promise<boolean>;
      stopLogcat: () => Promise<boolean>;
      onProjectProgress: (listener: (progress: CreateProjectProgress) => void) => () => void;
      onBuildProgress: (listener: (progress: BuildProgress) => void) => () => void;
      onAdbProgress: (listener: (line: string) => void) => () => void;
      onLogcatLine: (listener: (line: string) => void) => () => void;
    };
  }
}

export {};
