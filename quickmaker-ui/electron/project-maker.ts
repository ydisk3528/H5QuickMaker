import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export interface CreateProjectPayload {
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
}

export interface CreateProjectProgress {
  percent: number;
  message: string;
}

export interface CreateProjectResult {
  destinationProjectPath: string;
  namespace: string;
  keystorePath: string;
  backupGamePackagePath: string;
  contentPassword?: string;
}

export interface ProjectRecord {
  createdAt: string;
  finishedAt: string;
  logs?: string[];
  payload: CreateProjectPayload;
  result: CreateProjectResult;
}

export type BuildKind = 'apk' | 'aab';

export interface BuildProgress {
  kind: BuildKind;
  message: string;
}

export interface BuildResult {
  kind: BuildKind;
  artifactPath: string;
}

export interface ValidationResult {
  ok: boolean;
  message: string;
}

export interface IconPreviewResult {
  ok: boolean;
  dataUrl?: string;
  message?: string;
}

export interface LoadTypeOption {
  label: string;
  value: string;
}

export interface HoutaiConfig {
  contentPassword: string;
  packageName: string;
  link: string;
  remark: string;
  updatedAt: string;
}

function namespaceToPath(namespaceValue: string): string {
  return namespaceValue.split('.').join(path.sep);
}

function escapeRegex(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getQuickmakerRoot(): string {
  return path.resolve(__dirname, '..');
}

function getRecordsFilePath(): string {
  return path.join(getQuickmakerRoot(), 'project-records.json');
}

function getHoutaiConfigPath(): string {
  return path.resolve(getQuickmakerRoot(), '..', 'houtai.json');
}

function getLoadtypePath(): string {
  return path.join(getQuickmakerRoot(), 'loadtype.txt');
}

function defaultHoutaiConfig(): HoutaiConfig {
  return {
    contentPassword: '',
    packageName: '',
    link: 'https://www.earnphp1o.vip/m/index.html?affiliateCode=vip339',
    remark: '',
    updatedAt: new Date().toISOString()
  };
}

async function ensureRecordsFile(): Promise<string> {
  const filePath = getRecordsFilePath();
  if (!(await exists(filePath))) {
    await fs.writeFile(filePath, '[]', 'utf8');
  }
  return filePath;
}

async function ensureHoutaiConfigFile(): Promise<string> {
  const filePath = getHoutaiConfigPath();
  if (!(await exists(filePath))) {
    await fs.writeFile(filePath, JSON.stringify(defaultHoutaiConfig(), null, 2), 'utf8');
  }
  return filePath;
}

function validateApplicationId(applicationId: string): void {
  const isValid = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(applicationId);
  if (!isValid) {
    throw new Error('Invalid applicationId. Use lowercase package format like com.example.game');
  }
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function runKeytool(keystorePath: string, applicationId: string): Promise<void> {
  const dname = 'CN=H5QuickMaker, OU=Dev, O=H5QuickMaker, L=Shenzhen, ST=Guangdong, C=CN';
  const args = [
    '-genkeypair',
    '-v',
    '-keystore',
    keystorePath,
    '-alias',
    applicationId,
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-storepass',
    applicationId,
    '-keypass',
    applicationId,
    '-dname',
    dname,
    '-noprompt'
  ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn('keytool', args, { stdio: 'pipe' });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to run keytool. Ensure JDK is installed and keytool is in PATH. ${err.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`keytool failed with exit code ${code}. ${stderr.trim()}`));
    });
  });
}

function replaceOrThrow(content: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(content)) {
    throw new Error(`Cannot find replace target: ${label}. Check template format.`);
  }
  return content.replace(pattern, replacement);
}

async function moveDirectoryContents(sourceDir: string, targetDir: string): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await moveDirectoryContents(sourcePath, targetPath);
      await fs.rm(sourcePath, { recursive: true, force: true });
    } else {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.rename(sourcePath, targetPath);
    }
  }
}

async function rewriteNamespaceReferences(rootPath: string, oldNamespace: string, newNamespace: string): Promise<void> {
  const queue: string[] = [rootPath];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (!/\.(java|kt|xml|gradle)$/i.test(entry.name)) {
        continue;
      }

      const content = await fs.readFile(fullPath, 'utf8');
      const updated = content.replaceAll(oldNamespace, newNamespace);
      if (updated !== content) {
        await fs.writeFile(fullPath, updated, 'utf8');
      }
    }
  }
}

async function updateProjectNames(destinationProjectPath: string, projectName: string): Promise<void> {
  const stringsXmlPath = path.join(destinationProjectPath, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  if (await exists(stringsXmlPath)) {
    const xml = await fs.readFile(stringsXmlPath, 'utf8');
    const updatedXml = xml.replace(/(<string\s+name="app_name">)([\s\S]*?)(<\/string>)/, `$1${projectName}$3`);
    await fs.writeFile(stringsXmlPath, updatedXml, 'utf8');
  }

  const settingsGradlePath = path.join(destinationProjectPath, 'settings.gradle');
  if (await exists(settingsGradlePath)) {
    const settings = await fs.readFile(settingsGradlePath, 'utf8');
    const updatedSettings = settings.replace(/rootProject\.name\s*=\s*['"][^'"]*['"]/, `rootProject.name = '${projectName}'`);
    await fs.writeFile(settingsGradlePath, updatedSettings, 'utf8');
  }
}

async function copyDirectoryContents(sourceDir: string, targetDir: string): Promise<void> {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const sourceItems = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const item of sourceItems) {
    await fs.cp(path.join(sourceDir, item.name), path.join(targetDir, item.name), { recursive: true });
  }
}

async function mergeDirectoryContents(sourceDir: string, targetDir: string): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });
  const sourceItems = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const item of sourceItems) {
    await fs.cp(path.join(sourceDir, item.name), path.join(targetDir, item.name), { recursive: true, force: true });
  }
}

async function resolveSourceResDir(iconResPath: string): Promise<string> {
  const candidates = [
    iconResPath,
    path.join(iconResPath, 'src', 'main', 'res'),
    path.join(iconResPath, 'app', 'src', 'main', 'res')
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      const stat = await fs.stat(candidate);
      if (!stat.isDirectory()) continue;
      const entries = await fs.readdir(candidate);
      if (entries.length > 0) {
        return candidate;
      }
    }
  }
  throw new Error(`Cannot find a valid res directory from icon path: ${iconResPath}`);
}

export async function loadPlaystoreIconPreview(iconResPath: string): Promise<IconPreviewResult> {
  const trimmed = iconResPath.trim();
  if (!trimmed) {
    return { ok: false, message: 'Icon path is empty.' };
  }
  try {
    const sourceResDir = await resolveSourceResDir(trimmed);
    const playstoreIcon = path.join(sourceResDir, 'playstore-icon.png');
    if (!(await exists(playstoreIcon))) {
      return { ok: false, message: 'playstore-icon.png not found.' };
    }
    const content = await fs.readFile(playstoreIcon);
    return { ok: true, dataUrl: `data:image/png;base64,${content.toString('base64')}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

function hasMipmapDirectory(names: string[]): boolean {
  return names.some((name) => /^mipmap/i.test(name));
}

export async function validateIconResourceDirectory(iconResPath: string): Promise<ValidationResult> {
  const trimmed = iconResPath.trim();
  if (!trimmed) {
    return { ok: false, message: 'Please select an icon resource directory.' };
  }
  if (!(await exists(trimmed))) {
    return { ok: false, message: `Icon resource directory not found: ${trimmed}` };
  }

  let resDir = '';
  try {
    resDir = await resolveSourceResDir(trimmed);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Icon resource directory is not valid.' };
  }

  const entries = await fs.readdir(resDir, { withFileTypes: true });
  const names = entries.map((x) => x.name);
  const hasPlaystoreIcon = await exists(path.join(resDir, 'playstore-icon.png'));
  if (!hasPlaystoreIcon) {
    return { ok: false, message: 'Selected icon directory is missing playstore-icon.png.' };
  }
  if (!hasMipmapDirectory(names)) {
    return { ok: false, message: 'Selected icon directory is missing mipmap resources.' };
  }
  return { ok: true, message: 'Icon directory validation passed.' };
}

export async function validateGamePackageDirectory(gamePackagePath: string): Promise<ValidationResult> {
  const trimmed = gamePackagePath.trim();
  if (!trimmed) {
    return { ok: false, message: 'Please select a game package directory.' };
  }
  if (!(await exists(trimmed))) {
    return { ok: false, message: `Game package directory not found: ${trimmed}` };
  }
  const indexHtmlPath = path.join(trimmed, 'index.html');
  if (!(await exists(indexHtmlPath))) {
    return { ok: false, message: 'Selected game package directory is missing index.html.' };
  }
  return { ok: true, message: 'Game package directory validation passed.' };
}

async function replaceProjectIcons(iconResPath: string, destinationProjectPath: string): Promise<{ usedResDir: string; logoSource: string }> {
  const sourceResDir = await resolveSourceResDir(iconResPath);
  const destinationResDir = path.join(destinationProjectPath, 'app', 'src', 'main', 'res');
  await mergeDirectoryContents(sourceResDir, destinationResDir);

  const playstoreCandidates = [
    path.join(sourceResDir, 'playstore-icon.png'),
    path.join(iconResPath, 'playstore-icon.png'),
    path.join(iconResPath, 'src', 'main', 'res', 'playstore-icon.png'),
    path.join(iconResPath, 'app', 'src', 'main', 'res', 'playstore-icon.png')
  ];

  let logoSource = '';
  for (const item of playstoreCandidates) {
    if (await exists(item)) {
      logoSource = item;
      break;
    }
  }
  if (!logoSource) {
    throw new Error('playstore-icon.png not found in selected icon resource folder.');
  }

  const logoTarget = path.join(destinationResDir, 'drawable', 'logo.png');
  await fs.mkdir(path.dirname(logoTarget), { recursive: true });
  await fs.copyFile(logoSource, logoTarget);
  return { usedResDir: sourceResDir, logoSource };
}

export async function projectNameExists(outputRoot: string, projectName: string): Promise<boolean> {
  if (!outputRoot.trim() || !projectName.trim()) {
    return false;
  }
  return exists(path.join(outputRoot.trim(), projectName.trim()));
}

export async function loadProjectRecordsRaw(): Promise<string> {
  const filePath = await ensureRecordsFile();
  return fs.readFile(filePath, 'utf8');
}

export async function loadHoutaiConfig(): Promise<HoutaiConfig> {
  const filePath = await ensureHoutaiConfigFile();
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    const parsed = JSON.parse(raw) as Partial<HoutaiConfig>;
    const defaults = defaultHoutaiConfig();
    return {
      contentPassword: typeof parsed.contentPassword === 'string' ? parsed.contentPassword : defaults.contentPassword,
      packageName: typeof parsed.packageName === 'string' ? parsed.packageName : defaults.packageName,
      link: typeof parsed.link === 'string' ? parsed.link : defaults.link,
      remark: typeof parsed.remark === 'string' ? parsed.remark : defaults.remark,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : defaults.updatedAt
    };
  } catch {
    const defaults = defaultHoutaiConfig();
    await fs.writeFile(filePath, JSON.stringify(defaults, null, 2), 'utf8');
    return defaults;
  }
}

export async function loadHoutaiConfigRaw(): Promise<string> {
  const filePath = await ensureHoutaiConfigFile();
  return fs.readFile(filePath, 'utf8');
}

export async function loadLoadTypeOptions(): Promise<LoadTypeOption[]> {
  const filePath = getLoadtypePath();
  if (!(await exists(filePath))) {
    return [{ label: 'ADJ_DU', value: '0' }];
  }
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const options: LoadTypeOption[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^\s*([A-Za-z0-9_]+)\s*=\s*["']?([^"';\s]+)["']?\s*;?\s*$/);
    if (!match) continue;
    const label = match[1];
    const value = match[2];
    const key = `${label}::${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ label, value });
  }
  if (options.length === 0) {
    return [{ label: 'ADJ_DU', value: '0' }];
  }
  options.sort((a, b) => Number(a.value) - Number(b.value));
  return options;
}

export async function saveProjectRecordsRaw(raw: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON format.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Records must be a JSON array.');
  }

  const filePath = await ensureRecordsFile();
  await fs.writeFile(filePath, JSON.stringify(parsed, null, 2), 'utf8');
}

export async function saveHoutaiConfig(input: HoutaiConfig): Promise<void> {
  const filePath = await ensureHoutaiConfigFile();
  const next: HoutaiConfig = {
    contentPassword: String(input.contentPassword ?? ''),
    packageName: String(input.packageName ?? ''),
    link: String(input.link ?? ''),
    remark: String(input.remark ?? ''),
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(filePath, JSON.stringify(next, null, 2), 'utf8');
}

async function appendProjectRecord(record: ProjectRecord): Promise<void> {
  const raw = await loadProjectRecordsRaw();
  let list: unknown = [];
  try {
    list = JSON.parse(raw);
  } catch {
    list = [];
  }
  const records = Array.isArray(list) ? (list as ProjectRecord[]) : [];
  const nextRecords = records.filter((item) => {
    const sameOutputRoot =
      (item.payload?.outputRoot || '').trim().toLowerCase() === (record.payload.outputRoot || '').trim().toLowerCase();
    const sameProjectName =
      (item.payload?.projectName || '').trim().toLowerCase() === (record.payload.projectName || '').trim().toLowerCase();
    return !(sameOutputRoot && sameProjectName);
  });
  nextRecords.unshift(record);
  const filePath = await ensureRecordsFile();
  await fs.writeFile(filePath, JSON.stringify(nextRecords, null, 2), 'utf8');
}

async function runProcess(command: string, args: string[], cwd: string, onLine?: (line: string) => void): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false });
    let errText = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      text
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter(Boolean)
        .forEach((line: string) => onLine?.(line));
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      errText += text;
      text
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter(Boolean)
        .forEach((line: string) => onLine?.(line));
    });

    child.on('error', (err) => reject(new Error(`${command} failed to start: ${err.message}`)));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}. ${errText}`));
      }
    });
  });
}

function randomAlphaNum16(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 16; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function isValidContentPassword(value: string): boolean {
  return /^[A-Za-z0-9]{16}$/.test(value);
}

function getWinnerStringFogPath(): string {
  return path.join('E:\\wg\\apkLoad\\WinnerApkLoad', 'app', 'src', 'main', 'cpp', 'StringFogManager.cpp');
}

function getLocalStringFogTemplatePath(): string {
  return path.join(getQuickmakerRoot(), 'StringFogManager.cpp');
}

export async function syncWinnerStringFogKey(contentPassword: string): Promise<{ stringFogPath: string }> {
  if (!isValidContentPassword(contentPassword)) {
    throw new Error('content_password must be 16 chars of letters and digits.');
  }
  const stringFogPath = getWinnerStringFogPath();
  if (!(await exists(stringFogPath))) {
    throw new Error(`StringFogManager.cpp not found: ${stringFogPath}`);
  }

  const templatePath = getLocalStringFogTemplatePath();
  const hasTemplate = await exists(templatePath);
  const cpp = hasTemplate ? await fs.readFile(templatePath, 'utf8') : await fs.readFile(stringFogPath, 'utf8');
  const functionBlockPattern =
    /(std::string\s+StringFogManager::getAesDefaultKey\s*\(\s*\)\s*(?:const\s*)?\{)([\s\S]*?)(\})/m;
  let updated = cpp;
  if (hasTemplate) {
    updated = cpp.replace(/KstRLQxMogjM2yWl/g, contentPassword);
  }
  const blockMatch = cpp.match(functionBlockPattern);
  if (updated === cpp && blockMatch) {
    const [fullBlock, fnHead, fnBody, fnTail] = blockMatch;
    if (/return\s+"[^"]*"\s*;/m.test(fnBody)) {
      const nextBody = fnBody.replace(/return\s+"[^"]*"\s*;/m, `return "${contentPassword}";`);
      updated = cpp.replace(fullBlock, `${fnHead}${nextBody}${fnTail}`);
    }
  }

  if (updated === cpp) {
    // Fallback: direct return replacement in case function signature has minor variations.
    updated = cpp.replace(
      /(StringFogManager::getAesDefaultKey[\s\S]*?return\s+")([^"]*)(";\s*[\s\S]*?\})/m,
      `$1${contentPassword}$3`
    );
  }

  if (updated === cpp) {
    const alreadySet = new RegExp(
      `StringFogManager::getAesDefaultKey[\\s\\S]*?return\\s+"${escapeRegex(contentPassword)}"\\s*;`,
      'm'
    ).test(cpp);
    if (alreadySet) {
      await fs.writeFile(stringFogPath, updated, 'utf8');
      return { stringFogPath };
    }
    throw new Error(
      'Failed to replace getAesDefaultKey() in StringFogManager.cpp. ' +
        '请确认文件中存在 StringFogManager::getAesDefaultKey() 且函数体里有 return "..." 语句。'
    );
  }
  await fs.writeFile(stringFogPath, updated, 'utf8');
  return { stringFogPath };
}

function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function extractZipByPowerShell(archivePath: string, destinationPath: string, onLine?: (line: string) => void): Promise<void> {
  const script = [
    '$ErrorActionPreference = "Stop"',
    `$archive=${psQuote(archivePath)}`,
    `$dest=${psQuote(destinationPath)}`,
    '$zipArchive = [System.IO.Path]::ChangeExtension($archive, ".zip")',
    'Copy-Item -LiteralPath $archive -Destination $zipArchive -Force',
    'if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }',
    'New-Item -ItemType Directory -Path $dest -Force | Out-Null',
    'Expand-Archive -LiteralPath $zipArchive -DestinationPath $dest -Force',
    'Remove-Item -LiteralPath $zipArchive -Force'
  ].join('; ');
  try {
    await runProcess('powershell', ['-NoProfile', '-Command', script], path.dirname(archivePath), onLine);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`解压 APK 失败，请检查临时目录权限或重试。详情: ${msg}`);
  }
}

async function copyWinnerApkLibsToProject(
  destinationProjectPath: string,
  report: (percent: number, message: string) => void,
  contentPasswordInput?: string
): Promise<{ contentPassword: string }> {
  const winnerProjectPath = 'E:\\wg\\apkLoad\\WinnerApkLoad';
  const contentPassword =
    typeof contentPasswordInput === 'string' && isValidContentPassword(contentPasswordInput)
      ? contentPasswordInput
      : randomAlphaNum16();
  report(20, `Using content_password=${contentPassword}`);
  const { stringFogPath } = await syncWinnerStringFogKey(contentPassword);
  report(22, `Updated AES key in ${stringFogPath}`);

  report(24, 'Building WinnerApkLoad release APK');
  const winnerBuild = await buildProjectArtifact(winnerProjectPath, 'apk', (p) => {
    report(26, `WinnerApkLoad: ${p.message}`);
  });
  report(28, `WinnerApkLoad APK built: ${winnerBuild.artifactPath}`);

  const tempExtractRoot = path.join(
    getQuickmakerRoot(),
    'tempproject',
    `_winner_apk_extract_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  );
  report(30, `Extracting APK to: ${tempExtractRoot}`);
  await extractZipByPowerShell(winnerBuild.artifactPath, tempExtractRoot, (line) => {
    report(31, `Extract: ${line}`);
  });

  const libSourceDir = path.join(tempExtractRoot, 'lib');
  if (!(await exists(libSourceDir))) {
    throw new Error(`No lib directory found in APK: ${winnerBuild.artifactPath}`);
  }
  const projectLibTargetDir = path.join(destinationProjectPath, 'app', 'src', 'libs');
  await fs.rm(projectLibTargetDir, { recursive: true, force: true });
  await fs.mkdir(projectLibTargetDir, { recursive: true });
  const libItems = await fs.readdir(libSourceDir, { withFileTypes: true });
  for (const item of libItems) {
    await fs.cp(path.join(libSourceDir, item.name), path.join(projectLibTargetDir, item.name), { recursive: true, force: true });
  }
  report(34, `Copied APK lib contents to: ${projectLibTargetDir}`);

  async function keepOnlyLibMyappSo(currentDir: string): Promise<void> {
    const items = await fs.readdir(currentDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      if (item.isDirectory()) {
        await keepOnlyLibMyappSo(fullPath);
        const remain = await fs.readdir(fullPath);
        if (remain.length === 0) {
          await fs.rmdir(fullPath);
        }
      } else if (item.isFile() && item.name !== 'libmyapp.so') {
        await fs.rm(fullPath, { force: true });
      }
    }
  }

  await keepOnlyLibMyappSo(projectLibTargetDir);
  report(35, `Filtered libs: kept only libmyapp.so under ${projectLibTargetDir}`);
  return { contentPassword };
}

async function listFilesRecursively(root: string, ext: '.apk' | '.aab'): Promise<string[]> {
  if (!(await exists(root))) return [];
  const result: string[] = [];
  const queue = [root];
  while (queue.length) {
    const current = queue.shift()!;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(full);
      } else if (entry.isFile() && full.toLowerCase().endsWith(ext)) {
        result.push(full);
      }
    }
  }
  return result;
}

async function findLatestFile(files: string[]): Promise<string> {
  if (files.length === 0) throw new Error('No artifact file found.');
  const stats = await Promise.all(files.map(async (file) => ({ file, stat: await fs.stat(file) })));
  stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  return stats[0].file;
}

function resolveGradleWrapper(projectPath: string): { command: string; argsPrefix: string[] } {
  if (process.platform === 'win32') {
    const bat = path.join(projectPath, 'gradlew.bat');
    if (bat) {
      return { command: 'cmd', argsPrefix: ['/c', 'gradlew.bat'] };
    }
  }
  return { command: './gradlew', argsPrefix: [] };
}

export async function buildProjectArtifact(
  projectPath: string,
  kind: BuildKind,
  onProgress?: (progress: BuildProgress) => void
): Promise<BuildResult> {
  const trimmedProjectPath = projectPath.trim();
  if (!trimmedProjectPath) {
    throw new Error('projectPath is required.');
  }
  if (!(await exists(trimmedProjectPath))) {
    throw new Error(`Project path does not exist: ${trimmedProjectPath}`);
  }

  const task = kind === 'apk' ? 'assembleRelease' : 'bundleRelease';
  const outExt = kind === 'apk' ? '.apk' : '.aab';
  const outRoot = kind === 'apk'
    ? path.join(trimmedProjectPath, 'app', 'build', 'outputs', 'apk')
    : path.join(trimmedProjectPath, 'app', 'build', 'outputs', 'bundle');

  onProgress?.({ kind, message: `[${new Date().toISOString()}] Gradle task start: ${task}` });
  const wrapper = resolveGradleWrapper(trimmedProjectPath);
  await runProcess(wrapper.command, [...wrapper.argsPrefix, task], trimmedProjectPath, (line) => {
    onProgress?.({ kind, message: `[${new Date().toISOString()}] ${line}` });
  });

  const files = await listFilesRecursively(outRoot, outExt);
  const artifactPath = await findLatestFile(files);
  onProgress?.({ kind, message: `[${new Date().toISOString()}] Build completed: ${artifactPath}` });
  return { kind, artifactPath };
}

export async function installApkByAdb(apkPath: string, onLine?: (line: string) => void): Promise<void> {
  const trimmedApkPath = apkPath.trim();
  if (!trimmedApkPath) {
    throw new Error('apkPath is required.');
  }
  if (!(await exists(trimmedApkPath))) {
    throw new Error(`APK file does not exist: ${trimmedApkPath}`);
  }
  await runProcess('adb', ['install', '-r', trimmedApkPath], path.dirname(trimmedApkPath), onLine);
}

export async function installApkByAdbWithOptions(
  apkPath: string,
  options?: { autoLaunch?: boolean; packageName?: string },
  onLine?: (line: string) => void
): Promise<void> {
  const trimmedApkPath = apkPath.trim();
  if (!trimmedApkPath) {
    throw new Error('apkPath is required.');
  }
  if (!(await exists(trimmedApkPath))) {
    throw new Error(`APK file does not exist: ${trimmedApkPath}`);
  }
  await runProcess('adb', ['install', '-r', trimmedApkPath], path.dirname(trimmedApkPath), onLine);
  const shouldLaunch = !!options?.autoLaunch;
  const packageName = (options?.packageName || '').trim();
  if (shouldLaunch && packageName) {
    onLine?.(`[LAUNCH] Opening app: ${packageName}`);
    await runProcess(
      'adb',
      ['shell', 'monkey', '-p', packageName, '-c', 'android.intent.category.LAUNCHER', '1'],
      path.dirname(trimmedApkPath),
      onLine
    );
  }
}

export async function createProject(
  payload: CreateProjectPayload,
  onProgress?: (progress: CreateProjectProgress) => void
): Promise<CreateProjectResult> {
  const runtimeLogs: string[] = [];
  const now = () => new Date().toISOString();
  const report = (percent: number, message: string): void => {
    const line = `[${now()}] ${message}`;
    runtimeLogs.push(line);
    onProgress?.({ percent, message: line });
  };
  const startedAt = now();

  report(2, 'Validating inputs');
  const applicationId = payload.applicationId.trim();
  const projectName = payload.projectName.trim();
  const iconResPath = payload.iconResPath.trim();

  if (!applicationId || !projectName) {
    throw new Error('applicationId and projectName are required.');
  }
  validateApplicationId(applicationId);

  if (!(await exists(payload.templatePath))) {
    throw new Error(`Template directory does not exist: ${payload.templatePath}`);
  }
  if (!(await exists(payload.namespaceFilePath))) {
    throw new Error(`namespace file does not exist: ${payload.namespaceFilePath}`);
  }
  if (!(await exists(payload.gamePackagePath))) {
    throw new Error(`Game package directory does not exist: ${payload.gamePackagePath}`);
  }
  if (!(await exists(iconResPath))) {
    throw new Error(`Icon res directory does not exist: ${iconResPath}`);
  }
  const gamePackageValidation = await validateGamePackageDirectory(payload.gamePackagePath);
  if (!gamePackageValidation.ok) {
    throw new Error(gamePackageValidation.message);
  }
  const iconValidation = await validateIconResourceDirectory(iconResPath);
  if (!iconValidation.ok) {
    throw new Error(iconValidation.message);
  }

  report(4, `Parameters: applicationId=${applicationId}`);
  report(5, `Parameters: projectName=${projectName}`);
  report(6, `Parameters: gamePackagePath=${payload.gamePackagePath}`);
  report(7, `Parameters: iconResPath=${iconResPath}`);

  await fs.mkdir(payload.outputRoot, { recursive: true });

  report(8, 'Reading namespace');
  const namespace = (await fs.readFile(payload.namespaceFilePath, 'utf8')).trim();
  if (!namespace) {
    throw new Error('namespace file is empty.');
  }

  const destinationProjectPath = path.join(payload.outputRoot, projectName);
  if (await exists(destinationProjectPath)) {
    report(12, `Destination exists, deleting for overwrite: ${destinationProjectPath}`);
    await fs.rm(destinationProjectPath, { recursive: true, force: true });
  }

  report(18, 'Copying template project');
  await fs.cp(payload.templatePath, destinationProjectPath, { recursive: true });

  report(19, 'Preparing libs from WinnerApkLoad APK');
  const winnerResult = await copyWinnerApkLibsToProject(destinationProjectPath, report, payload.contentPassword);

  const buildGradlePath = path.join(destinationProjectPath, 'app', 'build.gradle');
  if (!(await exists(buildGradlePath))) {
    throw new Error(`build.gradle not found: ${buildGradlePath}`);
  }

  report(30, 'Generating keystore');
  const originalGradle = await fs.readFile(buildGradlePath, 'utf8');
  const namespaceMatch = originalGradle.match(/namespace\s+['"]([^'"]+)['"]/);
  if (!namespaceMatch) {
    throw new Error('namespace entry not found in build.gradle.');
  }
  const oldNamespace = namespaceMatch[1];

  const keystorePath = path.join(destinationProjectPath, `${applicationId}.jks`);
  await runKeytool(keystorePath, applicationId);

  report(45, 'Updating build.gradle');
  let updatedGradle = originalGradle;
  updatedGradle = replaceOrThrow(
    updatedGradle,
    new RegExp(`namespace\\s+['"]${escapeRegex(oldNamespace)}['"]`),
    `namespace '${namespace}'`,
    'namespace'
  );
  updatedGradle = replaceOrThrow(updatedGradle, /applicationId\s+"[^"]+"/, `applicationId "${applicationId}"`, 'applicationId');
  updatedGradle = replaceOrThrow(
    updatedGradle,
    /storeFile\s+file\('[^']*'\)/,
    `storeFile file('${keystorePath.replace(/\\/g, '/')}')`,
    'storeFile'
  );
  updatedGradle = replaceOrThrow(updatedGradle, /storePassword\s+'[^']*'/, `storePassword '${applicationId}'`, 'storePassword');
  updatedGradle = replaceOrThrow(updatedGradle, /keyAlias\s+'[^']*'/, `keyAlias '${applicationId}'`, 'keyAlias');
  updatedGradle = replaceOrThrow(updatedGradle, /keyPassword\s+'[^']*'/, `keyPassword '${applicationId}'`, 'keyPassword');
  await fs.writeFile(buildGradlePath, updatedGradle, 'utf8');

  report(58, 'Adjusting Java package path');
  const oldJavaDir = path.join(destinationProjectPath, 'app', 'src', 'main', 'java', namespaceToPath(oldNamespace));
  const newJavaDir = path.join(destinationProjectPath, 'app', 'src', 'main', 'java', namespaceToPath(namespace));
  if (oldJavaDir !== newJavaDir && (await exists(oldJavaDir))) {
    await moveDirectoryContents(oldJavaDir, newJavaDir);
    await fs.rm(oldJavaDir, { recursive: true, force: true });
  } else if (oldJavaDir === newJavaDir) {
    report(59, 'Java package path unchanged, skip move');
  }

  report(68, 'Rewriting namespace references');
  await rewriteNamespaceReferences(destinationProjectPath, oldNamespace, namespace);

  report(76, 'Updating project display names');
  await updateProjectNames(destinationProjectPath, projectName);

  report(84, 'Copying game package to project assets/mygame');
  const targetMygameDir = path.join(destinationProjectPath, 'app', 'src', 'main', 'assets', 'mygame');
  await copyDirectoryContents(payload.gamePackagePath, targetMygameDir);

  report(90, 'Replacing icon resources under app/src/main/res');
  const iconResult = await replaceProjectIcons(iconResPath, destinationProjectPath);
  report(91, `Icon resource merged from: ${iconResult.usedResDir}`);
  report(92, `logo.png overwritten from: ${iconResult.logoSource}`);

  report(94, 'Backing up game package under quickmaker-ui');
  const quickmakerRoot = getQuickmakerRoot();
  const tempProjectRoot = path.join(quickmakerRoot, 'tempproject');
  const backupProjectRoot = path.join(tempProjectRoot, projectName);
  const backupGamePackagePath = path.join(backupProjectRoot, 'mygame');
  await fs.mkdir(tempProjectRoot, { recursive: true });
  await fs.mkdir(backupProjectRoot, { recursive: true });
  await copyDirectoryContents(payload.gamePackagePath, backupGamePackagePath);

  report(97, 'Writing creation record');
  const result: CreateProjectResult = {
    destinationProjectPath,
    namespace,
    keystorePath,
    backupGamePackagePath,
    contentPassword: winnerResult.contentPassword
  };
  await appendProjectRecord({
    createdAt: startedAt,
    finishedAt: now(),
    payload: {
      templatePath: payload.templatePath,
      outputRoot: payload.outputRoot,
      namespaceFilePath: payload.namespaceFilePath,
      applicationId,
      projectName,
      gamePackagePath: payload.gamePackagePath,
      iconResPath,
      contentPassword: payload.contentPassword,
      backendConfig: payload.backendConfig,
      backendAdjParams: payload.backendAdjParams
    },
    result
  });

  report(100, 'Completed');
  return result;
}
