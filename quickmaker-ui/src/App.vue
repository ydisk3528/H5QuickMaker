<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";

type ProjectRecord = {
  createdAt: string;
  payload: {
    templatePath: string;
    outputRoot: string;
    namespaceFilePath: string;
    applicationId: string;
    projectName: string;
    gamePackagePath: string;
    iconResPath?: string;
    contentPassword?: string;
    backendConfig?: Record<string, string>;
    backendAdjParams?: Record<string, string>;
  };
  result?: {
    destinationProjectPath?: string;
    namespace?: string;
    keystorePath?: string;
    backupGamePackagePath?: string;
    contentPassword?: string;
  };
};

function randomApplicationId(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = letters[Math.floor(Math.random() * letters.length)];
  for (let i = 1; i < 12; i += 1)
    s += chars[Math.floor(Math.random() * chars.length)];
  return `com.${s}.game`;
}

const words = [
  "Winner",
  "Fortune",
  "Glory",
  "Treasure",
  "Journey",
  "Bonus",
  "Master",
  "Dream",
  "Golden",
  "Royal",
  "Happy",
  "King",
  "Legend",
  "Spark",
  "Star",
  "Hero",
  "Magic",
  "Joy",
  "Prime",
  "Puzzle",
  "Crazy",
];

function randomProjectName(existing: Set<string>): string {
  for (let i = 0; i < 120; i += 1) {
    const a = words[Math.floor(Math.random() * words.length)];
    let b = words[Math.floor(Math.random() * words.length)];
    while (b === a) b = words[Math.floor(Math.random() * words.length)];
    const name = `Lucky 777 ${a} ${b}`;
    if (!existing.has(name)) return name;
  }
  return `Lucky 777 ${Date.now()}`;
}

const form = reactive({
  templatePath: "E:\\wg\\cocos\\H5QuickMaker\\Lucky 777 Winner Go",
  outputRoot: "E:\\wg\\cocos\\duZong",
  namespaceFilePath: "E:\\wg\\cocos\\H5QuickMaker\\namespace.txt",
  applicationId: randomApplicationId(),
  projectName: "",
  gamePackagePath: "E:\\wg\\cocos\\H5QuickMaker\\quickmaker-ui\\game",
  iconResPath: "E:\\wg\\cocos\\H5QuickMaker\\quickmaker-ui\\res",
});

const busy = ref(false);
const buildBusy = ref(false);
const installBusy = ref(false);
const autoLaunchAfterInstall = ref(true);
const autoStartLogcatAfterLaunch = ref(true);
const logcatRunning = ref(false);
const logcatKeyword = ref("");
const showLogError = ref(true);
const showLogWarn = ref(true);
const showLogInfo = ref(true);
const showLogDebug = ref(true);
const showLogVerbose = ref(true);
const showLogOther = ref(true);
const progress = ref(0);
const logs = ref<string[]>([]);
const logcatLines = ref<string[]>([]);
const majorLogs = ref<string[]>([]);
const message = ref("");
const error = ref("");
const activeTab = ref("project");
const nameExists = ref(false);
const recordsRaw = ref("[]");
const recordsStatus = ref("");
const backendStatus = ref("");
type BackendField = { key: string; value: string };
const backendFields = ref<BackendField[]>([]);
const adjParamsFields = ref<BackendField[]>([]);
const adjParamsRaw = ref("{}");
const loadTypeOptions = ref<LoadTypeOption[]>([
  { label: "ADJ_DU", value: "0" },
]);
const selectedRecordIndex = ref("");
const currentProjectPath = ref("");
const lastBuiltApkPath = ref("");
const lastBuiltAabPath = ref("");
const iconPreviewDataUrl = ref("");
const iconPreviewError = ref("");
const gameDirCheck = ref<{ ok: boolean; message: string }>({
  ok: true,
  message: "",
});
const iconDirCheck = ref<{ ok: boolean; message: string }>({
  ok: true,
  message: "",
});
const showRecordPanel = ref(false);

let unsubProject: (() => void) | null = null;
let unsubBuild: (() => void) | null = null;
let unsubAdb: (() => void) | null = null;
let unsubLogcat: (() => void) | null = null;
let duplicateTimer: number | null = null;

const parsedRecords = computed<ProjectRecord[]>(() => {
  try {
    const data = JSON.parse(recordsRaw.value);
    if (!Array.isArray(data)) return [];
    const source = data as ProjectRecord[];
    const seen = new Set<string>();
    const deduped: ProjectRecord[] = [];
    for (const rec of source) {
      const outputRoot = (rec.payload?.outputRoot || "").trim().toLowerCase();
      const projectName = (rec.payload?.projectName || "").trim().toLowerCase();
      const key = `${outputRoot}::${projectName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(rec);
    }
    return deduped;
  } catch {
    return [];
  }
});

const existingNameSet = computed(
  () =>
    new Set(
      parsedRecords.value.map((x) => x.payload?.projectName).filter(Boolean)
    )
);
const orderedBackendFields = computed(() => {
  const list = [...backendFields.value];
  const priority = (key: string): number => {
    if (/^(content_password|contentPassword)$/i.test(key)) return 0;
    if (/^(link|url)$/i.test(key)) return 1;
    return 2;
  };
  return list.sort((a, b) => priority(a.key) - priority(b.key));
});

const canSubmit = computed(() => {
  return (
    form.templatePath.trim() &&
    form.outputRoot.trim() &&
    form.namespaceFilePath.trim() &&
    form.applicationId.trim() &&
    form.projectName.trim() &&
    form.gamePackagePath.trim() &&
    form.iconResPath.trim() &&
    gameDirCheck.value.ok &&
    iconDirCheck.value.ok &&
    !busy.value
  );
});

const canBuild = computed(
  () => !!currentProjectPath.value && !busy.value && !buildBusy.value
);
const canInstall = computed(
  () =>
    !!lastBuiltApkPath.value &&
    !busy.value &&
    !buildBusy.value &&
    !installBusy.value
);
const filteredLogcatLines = computed(() => {
  const keyword = logcatKeyword.value.trim().toLowerCase();
  return logcatLines.value.filter((line) => {
    const level = logcatLevel(line);
    if (level === "error" && !showLogError.value) return false;
    if (level === "warn" && !showLogWarn.value) return false;
    if (level === "info" && !showLogInfo.value) return false;
    if (level === "debug" && !showLogDebug.value) return false;
    if (level === "verbose" && !showLogVerbose.value) return false;
    if (level === "other" && !showLogOther.value) return false;
    if (!keyword) return true;
    return line.toLowerCase().includes(keyword);
  });
});

function ensureApi(): boolean {
  if (!window.quickMaker) {
    error.value =
      "quickMaker API 未注入。请重启 npm run dev 并使用 Electron 窗口。";
    return false;
  }
  return true;
}

function addLog(line: string): void {
  logs.value = [...logs.value, line];
}

function addMajorLog(line: string): void {
  majorLogs.value = [...majorLogs.value, line];
  addLog(line);
}

function logcatLineClass(line: string): string {
  const level = logcatLevel(line);
  if (level === "error") return "log-error";
  if (level === "warn") return "log-warn";
  if (level === "info") return "log-info";
  if (level === "debug") return "log-debug";
  if (level === "verbose") return "log-verbose";
  return "";
}

function logcatLevel(
  line: string
): "error" | "warn" | "info" | "debug" | "verbose" | "other" {
  const text = line.toLowerCase();
  if (
    /(fatal|exception|crash|anr|androidruntime|\berror\b|\se\/)/i.test(text)
  ) {
    return "error";
  }
  if (/(warning|\bwarn\b|\sw\/)/i.test(text)) return "warn";
  if (/(^|\s)i\/|\binfo\b/.test(text)) return "info";
  if (/(^|\s)d\/|\bdebug\b/.test(text)) return "debug";
  if (/(^|\s)v\/|\bverbose\b/.test(text)) return "verbose";
  return "other";
}

function randomContentPassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 16; i += 1)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function isValidContentPassword(value: string): boolean {
  return /^[A-Za-z0-9]{16}$/.test(value);
}

function fieldIndexByKey(targetKey: string): number {
  const lower = targetKey.toLowerCase();
  return backendFields.value.findIndex((x) => x.key.toLowerCase() === lower);
}

function ensureBackendField(key: string, defaultValue = ""): void {
  if (fieldIndexByKey(key) >= 0) return;
  backendFields.value.push({ key, value: defaultValue });
}

function setBackendValue(key: string, value: string): void {
  const idx = fieldIndexByKey(key);
  if (idx >= 0) {
    backendFields.value[idx].value = value;
    return;
  }
  backendFields.value.push({ key, value });
}

function getBackendValue(key: string): string {
  const idx = fieldIndexByKey(key);
  return idx >= 0 ? backendFields.value[idx].value : "";
}

function findFirstFieldKey(candidates: string[]): string {
  for (const key of candidates) {
    const idx = fieldIndexByKey(key);
    if (idx >= 0) return backendFields.value[idx].key;
  }
  return candidates[0];
}

function contentPasswordKey(): string {
  const key = findFirstFieldKey(["content_password", "contentPassword"]);
  ensureBackendField(key, "");
  return key;
}

function packageNameKey(): string {
  const key = findFirstFieldKey([
    "applicationId",
    "packageName",
    "package_name",
  ]);
  ensureBackendField(key, "");
  return key;
}

function isContentPasswordField(key: string): boolean {
  return /^(content_password|contentPassword)$/i.test(key);
}

function isPackageField(key: string): boolean {
  return /^(applicationId|packageName|package_name)$/i.test(key);
}

function isTypeField(key: string): boolean {
  return /^type$/i.test(key);
}

function isEventKeyField(key: string): boolean {
  return /^event_key$/i.test(key);
}

function initBackendDefaults(): void {
  ensureBackendField("content_password", "");
  ensureBackendField("applicationId", form.applicationId || "");
  ensureBackendField("type", "0");
  ensureBackendField(
    "link",
    "https://www.earnphp1o.vip/m/index.html?affiliateCode=vip339"
  );
  const passKey = contentPasswordKey();
  if (!getBackendValue(passKey).trim()) {
    setBackendValue(passKey, randomContentPassword());
  }
}

async function loadTypeSelectOptions(): Promise<void> {
  if (!ensureApi()) return;
  try {
    const options = await window.quickMaker.loadLoadTypeOptions();
    loadTypeOptions.value =
      options.length > 0 ? options : [{ label: "ADJ_DU", value: "0" }];
    backendStatus.value = `type 选项已加载: ${loadTypeOptions.value.length} 个`;
  } catch {
    loadTypeOptions.value = [{ label: "ADJ_DU", value: "0" }];
    backendStatus.value = "type 选项加载失败，已使用默认值 0";
  }
}

function loadAdjParamsFromUnknown(input: unknown): void {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    adjParamsFields.value = Object.entries(
      input as Record<string, unknown>
    ).map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    }));
    adjParamsRaw.value = JSON.stringify(input, null, 2);
    return;
  }
  if (typeof input === "string") {
    adjParamsRaw.value = input;
    try {
      const parsed = JSON.parse(input) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        adjParamsFields.value = Object.entries(
          parsed as Record<string, unknown>
        ).map(([key, value]) => ({
          key,
          value: typeof value === "string" ? value : JSON.stringify(value),
        }));
        return;
      }
    } catch {
      // ignore parse error, keep empty
    }
  }
  adjParamsFields.value = [];
  if (!adjParamsRaw.value.trim()) {
    adjParamsRaw.value = "{}";
  }
}

function buildAdjParamsObject(): Record<string, string> {
  return Object.fromEntries(
    adjParamsFields.value
      .map((x) => ({ key: x.key.trim(), value: x.value }))
      .filter((x) => x.key.length > 0)
      .map((x) => [x.key, x.value])
  );
}

function readAdjParamsConfig(): void {
  const raw = adjParamsRaw.value.trim();
  if (!raw) {
    adjParamsFields.value = [];
    backendStatus.value = "adjParams 为空";
    return;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("adjParams 必须是 JSON 对象");
    }
    adjParamsFields.value = Object.entries(
      parsed as Record<string, unknown>
    ).map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    }));
    backendStatus.value = "已读取adjParams配置";
  } catch (e) {
    backendStatus.value = e instanceof Error ? e.message : String(e);
  }
}

function syncAdjParamsConfig(): void {
  const obj = buildAdjParamsObject();
  adjParamsRaw.value = JSON.stringify(obj, null, 2);
  backendStatus.value = "已同步adjParams";
}

function parseCopyJsonValue(text: string): unknown {
  const raw = text.trim();
  if (raw === "") return "";
  if (/^(true|false)$/i.test(raw)) return raw.toLowerCase() === "true";
  if (/^null$/i.test(raw)) return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(raw)) return Number(raw);
  if (
    (raw.startsWith("{") && raw.endsWith("}")) ||
    (raw.startsWith("[") && raw.endsWith("]"))
  ) {
    try {
      return JSON.parse(raw);
    } catch {
      return text;
    }
  }
  return text;
}

function buildBackendConfigObject(): Record<string, string> {
  return Object.fromEntries(
    backendFields.value
      .map((x) => ({ key: x.key.trim(), value: x.value }))
      .filter(
        (x) =>
          x.key.length > 0 &&
          !/^remark$/i.test(x.key) &&
          !/^updatedAt$/i.test(x.key)
      )
      .map((x) => [x.key, x.value])
  );
}

function appendSyncRemark(): void {
  return;
}

async function refreshApplicationId(): Promise<void> {
  form.applicationId = randomApplicationId();
  setBackendValue(packageNameKey(), form.applicationId);
  setBackendValue(contentPasswordKey(), randomContentPassword());
  appendSyncRemark();
  addMajorLog(
    `[${new Date().toISOString()}] applicationId 与 content_password 已刷新（未同步C++）`
  );
}

function randomizeBackendContentPassword(): void {
  setBackendValue(contentPasswordKey(), randomContentPassword());
  backendStatus.value = "content_password 已随机生成";
}

function refreshProjectName(): void {
  form.projectName = randomProjectName(existingNameSet.value);
}

async function checkGamePackageDir(): Promise<void> {
  if (!ensureApi()) return;
  gameDirCheck.value = await window.quickMaker.validateGamePackageDir(
    form.gamePackagePath
  );
}

async function checkIconResDir(): Promise<void> {
  if (!ensureApi()) return;
  iconDirCheck.value = await window.quickMaker.validateIconResDir(
    form.iconResPath
  );
  if (iconDirCheck.value.ok) {
    await loadIconPreview();
  } else {
    iconPreviewDataUrl.value = "";
    iconPreviewError.value = "";
  }
}

async function loadIconPreview(): Promise<void> {
  if (!ensureApi()) return;
  const result = await window.quickMaker.loadPlaystoreIconPreview(
    form.iconResPath
  );
  if (result.ok && result.dataUrl) {
    iconPreviewDataUrl.value = result.dataUrl;
    iconPreviewError.value = "";
  } else {
    iconPreviewDataUrl.value = "";
    iconPreviewError.value = result.message || "未读取到 playstore-icon.png";
  }
}

async function pickPath(
  target: "templatePath" | "outputRoot" | "gamePackagePath" | "iconResPath"
): Promise<void> {
  error.value = "";
  if (!ensureApi()) return;
  try {
    const picked = await window.quickMaker.pickDirectory();
    if (!picked) return;
    form[target] = picked;
    if (target === "gamePackagePath") await checkGamePackageDir();
    if (target === "iconResPath") await checkIconResDir();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function checkDuplicateName(): Promise<void> {
  if (!ensureApi()) return;
  if (!form.outputRoot.trim() || !form.projectName.trim()) {
    nameExists.value = false;
    return;
  }
  nameExists.value = await window.quickMaker.checkProjectName(
    form.outputRoot,
    form.projectName
  );
}

async function loadRecords(): Promise<void> {
  if (!ensureApi()) return;
  try {
    recordsRaw.value = await window.quickMaker.loadProjectRecords();
    recordsStatus.value = "记录已加载。";
  } catch (e) {
    recordsStatus.value = e instanceof Error ? e.message : String(e);
  }
}

function applyRecordByIndex(index: number): void {
  const rec = parsedRecords.value[index];
  if (!rec?.payload) return;
  form.templatePath = rec.payload.templatePath || form.templatePath;
  form.outputRoot = rec.payload.outputRoot || form.outputRoot;
  form.namespaceFilePath =
    rec.payload.namespaceFilePath || form.namespaceFilePath;
  form.applicationId = rec.payload.applicationId || form.applicationId;
  form.projectName = rec.payload.projectName || form.projectName;
  form.gamePackagePath = rec.payload.gamePackagePath || form.gamePackagePath;
  form.iconResPath = rec.payload.iconResPath || form.iconResPath;
  backendFields.value =
    rec.payload.backendConfig && typeof rec.payload.backendConfig === "object"
      ? Object.entries(rec.payload.backendConfig).map(([key, value]) => ({
          key,
          value: typeof value === "string" ? value : String(value),
        }))
      : [];
  adjParamsFields.value =
    rec.payload.backendAdjParams &&
    typeof rec.payload.backendAdjParams === "object"
      ? Object.entries(rec.payload.backendAdjParams).map(([key, value]) => ({
          key,
          value: typeof value === "string" ? value : String(value),
        }))
      : [];
  syncAdjParamsConfig();
  initBackendDefaults();
  if (form.applicationId.trim())
    setBackendValue(packageNameKey(), form.applicationId.trim());
  currentProjectPath.value =
    rec.result?.destinationProjectPath || currentProjectPath.value;
  recordsStatus.value = `已读取记录: ${rec.payload.projectName}`;
  checkGamePackageDir().catch(() => null);
  checkIconResDir().catch(() => null);
}

function onSelectRecord(): void {
  if (selectedRecordIndex.value === "") return;
  const idx = Number(selectedRecordIndex.value);
  if (!Number.isNaN(idx)) applyRecordByIndex(idx);
}

async function saveRecords(): Promise<void> {
  if (!ensureApi()) return;
  try {
    await window.quickMaker.saveProjectRecords(recordsRaw.value);
    recordsStatus.value = "记录已保存。";
    await loadRecords();
  } catch (e) {
    recordsStatus.value = e instanceof Error ? e.message : String(e);
  }
}

async function loadBackendConfig(): Promise<void> {
  if (!ensureApi()) return;
  try {
    const raw = await window.quickMaker.loadHoutaiConfigRaw();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("houtai.json 必须是对象格式");
    }
    backendFields.value = Object.entries(parsed)
      .filter(([key]) => key !== "adjParams")
      .map(([key, value]) => ({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      }));
    loadAdjParamsFromUnknown(parsed.adjParams);
    initBackendDefaults();
    if (form.applicationId.trim())
      setBackendValue(packageNameKey(), form.applicationId.trim());
    backendStatus.value = `已读取: ${new Date().toISOString()}`;
  } catch (e) {
    backendStatus.value = e instanceof Error ? e.message : String(e);
  }
}

function applyBackendPackageToMain(): void {
  const pkg = getBackendValue(packageNameKey()).trim();
  if (!pkg) return;
  form.applicationId = pkg;
  addMajorLog(
    `[${new Date().toISOString()}] 已从后台配置同步包名到主配置: ${
      form.applicationId
    }`
  );
}

function copyContentPassword(): void {
  const pass = getBackendValue(contentPasswordKey());
  if (!pass) return;
  navigator.clipboard
    .writeText(pass)
    .then(() => {
      backendStatus.value = "content_password 已复制";
    })
    .catch(() => {
      backendStatus.value = "复制失败，请手动复制";
    });
}

function copyBackendConfig(): void {
  syncAdjParamsConfig();
  const obj: Record<string, unknown> = Object.fromEntries(
    backendFields.value
      .map((x) => [x.key, parseCopyJsonValue(x.value)] as const)
      .filter(
        ([k]) =>
          !/^remark$/i.test(k) &&
          !/^updatedAt$/i.test(k) &&
          !/^(content_password|contentPassword)$/i.test(k) &&
          !/^(applicationId|packageName|package_name)$/i.test(k) &&
          !/^(link|url)$/i.test(k)
      )
  );
  const adj = Object.fromEntries(
    adjParamsFields.value
      .map((x) => ({ key: x.key.trim(), value: x.value }))
      .filter((x) => x.key.length > 0)
      .map((x) => [x.key, parseCopyJsonValue(x.value)])
  );
  if (Object.keys(adj).length > 0) {
    obj.adjParams = adj;
  }
  const raw = JSON.stringify(obj, null, 2);
  navigator.clipboard
    .writeText(raw)
    .then(() => {
      backendStatus.value = "后台 JSON 已复制";
    })
    .catch(() => {
      backendStatus.value = "复制失败，请手动复制";
    });
}

function copyBackendConfigMinified(): void {
  syncAdjParamsConfig();
  const obj: Record<string, unknown> = Object.fromEntries(
    backendFields.value
      .map((x) => [x.key, parseCopyJsonValue(x.value)] as const)
      .filter(
        ([k]) =>
          !/^remark$/i.test(k) &&
          !/^updatedAt$/i.test(k) &&
          !/^(content_password|contentPassword)$/i.test(k) &&
          !/^(applicationId|packageName|package_name)$/i.test(k) &&
          !/^(link|url)$/i.test(k)
      )
  );
  const adj = Object.fromEntries(
    adjParamsFields.value
      .map((x) => ({ key: x.key.trim(), value: x.value }))
      .filter((x) => x.key.length > 0)
      .map((x) => [x.key, parseCopyJsonValue(x.value)])
  );
  if (Object.keys(adj).length > 0) {
    obj.adjParams = adj;
  }
  const raw = JSON.stringify(obj);
  navigator.clipboard
    .writeText(raw)
    .then(() => {
      backendStatus.value = "后台压缩JSON已复制";
    })
    .catch(() => {
      backendStatus.value = "复制失败，请手动复制";
    });
}

async function submit(): Promise<void> {
  error.value = "";
  message.value = "";
  progress.value = 0;
  logs.value = [];
  majorLogs.value = [];
  if (!ensureApi()) return;

  await checkDuplicateName();
  await checkGamePackageDir();
  await checkIconResDir();

  if (!gameDirCheck.value.ok || !iconDirCheck.value.ok) {
    error.value = "目录校验失败，请修正后再创建。";
    addMajorLog(`[${new Date().toISOString()}] 目录校验失败`);
    return;
  }

  busy.value = true;
  addMajorLog(`[${new Date().toISOString()}] 开始创建工程`);
  addMajorLog(`applicationId=${form.applicationId}`);
  addMajorLog(`projectName=${form.projectName}`);

  try {
    initBackendDefaults();
    const passKey = contentPasswordKey();
    if (!isValidContentPassword(getBackendValue(passKey))) {
      setBackendValue(passKey, randomContentPassword());
      appendSyncRemark();
      addMajorLog(
        `[${new Date().toISOString()}] content_password 为空，已自动生成（未同步C++）`
      );
    }

    const result = await window.quickMaker.createProject({
      templatePath: form.templatePath,
      outputRoot: form.outputRoot,
      namespaceFilePath: form.namespaceFilePath,
      applicationId: form.applicationId,
      projectName: form.projectName,
      gamePackagePath: form.gamePackagePath,
      iconResPath: form.iconResPath,
      contentPassword: getBackendValue(passKey),
      backendConfig: buildBackendConfigObject(),
      backendAdjParams: buildAdjParamsObject(),
    });

    currentProjectPath.value = result.destinationProjectPath;
    lastBuiltApkPath.value = "";
    lastBuiltAabPath.value = "";
    progress.value = 100;

    addMajorLog(`[${new Date().toISOString()}] 创建工程完成`);
    message.value = [
      `工程目录: ${result.destinationProjectPath}`,
      `命名空间: ${result.namespace}`,
      `签名文件: ${result.keystorePath}`,
      `游戏包备份: ${result.backupGamePackagePath}`,
      `content_password: ${result.contentPassword ?? ""}`,
    ].join("\n");

    setBackendValue(passKey, result.contentPassword ?? "");
    setBackendValue(packageNameKey(), form.applicationId);
    appendSyncRemark();

    await loadRecords();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    addMajorLog(`[${new Date().toISOString()}] 创建工程失败: ${error.value}`);
  } finally {
    busy.value = false;
  }
}

async function buildArtifact(kind: "apk" | "aab"): Promise<void> {
  error.value = "";
  if (!ensureApi() || !currentProjectPath.value) return;

  buildBusy.value = true;
  addMajorLog(
    `[${new Date().toISOString()}] 编译 ${kind.toUpperCase()} 开始 (release)`
  );

  try {
    const result = await window.quickMaker.buildArtifact(
      currentProjectPath.value,
      kind
    );
    if (kind === "apk") lastBuiltApkPath.value = result.artifactPath;
    if (kind === "aab") lastBuiltAabPath.value = result.artifactPath;

    addMajorLog(
      `[${new Date().toISOString()}] 编译 ${kind.toUpperCase()} 完成`
    );
    message.value = `${kind.toUpperCase()} 编译完成:\n${result.artifactPath}`;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    addMajorLog(
      `[${new Date().toISOString()}] 编译 ${kind.toUpperCase()} 失败: ${
        error.value
      }`
    );
  } finally {
    buildBusy.value = false;
  }
}

async function installCurrentApk(): Promise<void> {
  error.value = "";
  if (!ensureApi() || !lastBuiltApkPath.value) return;

  installBusy.value = true;
  addMajorLog(`[${new Date().toISOString()}] 开始 ADB 安装`);

  try {
    await window.quickMaker.installApk(lastBuiltApkPath.value, {
      autoLaunch: autoLaunchAfterInstall.value,
      packageName: form.applicationId,
    });
    if (autoLaunchAfterInstall.value && autoStartLogcatAfterLaunch.value) {
      await startLogcat(true);
    }
    addMajorLog(`[${new Date().toISOString()}] ADB 安装完成`);
    message.value = `ADB 安装完成:\n${lastBuiltApkPath.value}`;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    addMajorLog(`[${new Date().toISOString()}] ADB 安装失败: ${error.value}`);
  } finally {
    installBusy.value = false;
  }
}

async function startLogcat(clear = false): Promise<void> {
  error.value = "";
  if (!ensureApi()) return;
  try {
    await window.quickMaker.startLogcat({ clear });
    logcatRunning.value = true;
    addMajorLog(`[${new Date().toISOString()}] LOG监控已启动`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function stopLogcat(): Promise<void> {
  if (!ensureApi()) return;
  try {
    await window.quickMaker.stopLogcat();
  } finally {
    logcatRunning.value = false;
    addMajorLog(`[${new Date().toISOString()}] LOG监控已停止`);
  }
}

watch(
  () => [form.outputRoot, form.projectName],
  () => {
    if (duplicateTimer) window.clearTimeout(duplicateTimer);
    duplicateTimer = window.setTimeout(
      () => checkDuplicateName().catch(() => null),
      280
    );
  }
);

watch(
  () => form.gamePackagePath,
  () => checkGamePackageDir().catch(() => null)
);
watch(
  () => form.iconResPath,
  () => checkIconResDir().catch(() => null)
);
watch(
  () => form.applicationId,
  (next) => {
    if (next.trim()) {
      setBackendValue(packageNameKey(), next.trim());
    }
  }
);

onMounted(() => {
  initBackendDefaults();
  if (form.applicationId.trim())
    setBackendValue(packageNameKey(), form.applicationId.trim());
  if (window.quickMaker) {
    unsubProject = window.quickMaker.onProjectProgress((evt) => {
      progress.value = evt.percent;
      addLog(`[${evt.percent}%] ${evt.message}`);
      if (
        /Completed|Generated content_password|Create|Writing creation record|创建工程完成/i.test(
          evt.message
        )
      ) {
        addMajorLog(evt.message);
      }
    });

    unsubBuild = window.quickMaker.onBuildProgress((evt) =>
      addLog(`[BUILD ${evt.kind.toUpperCase()}] ${evt.message}`)
    );
    unsubAdb = window.quickMaker.onAdbProgress((line) =>
      addLog(`[ADB] ${line}`)
    );
    unsubLogcat = window.quickMaker.onLogcatLine((line) => {
      logcatLines.value = [...logcatLines.value, line];
    });
    loadTypeSelectOptions().catch(() => null);
    checkGamePackageDir().catch(() => null);
    checkIconResDir().catch(() => null);
    loadRecords().catch(() => null);
    loadBackendConfig().catch(() => null);
  }

  if (!form.projectName) refreshProjectName();
});

onBeforeUnmount(() => {
  unsubProject?.();
  unsubBuild?.();
  unsubAdb?.();
  unsubLogcat?.();
  if (duplicateTimer) window.clearTimeout(duplicateTimer);
});
</script>

<template>
  <main class="page">
    <section class="panel">
      <h1>H5 Quick Maker</h1>
      <p>Node.js + TypeScript + Vue + Electron + Element Plus</p>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="工程配置" name="project">
          <div class="form-item">
            <label>历史记录读取（默认不选）</label>
            <el-select
              v-model="selectedRecordIndex"
              placeholder="不读取历史记录"
              clearable
              @change="onSelectRecord"
            >
              <el-option
                v-for="(rec, idx) in parsedRecords"
                :key="`${rec.createdAt}-${idx}`"
                :value="String(idx)"
                :label="rec.payload?.projectName || `记录 ${idx + 1}`"
              />
            </el-select>
          </div>

          <div class="form-item">
            <label>applicationId</label>
            <div class="row">
              <el-input
                v-model="form.applicationId"
                placeholder="com.xxxxxxxxxxxx.game"
              />
              <el-button @click="refreshApplicationId">随机</el-button>
            </div>
          </div>

          <div class="form-item">
            <label>新工程名</label>
            <div class="row">
              <el-input
                v-model="form.projectName"
                placeholder="Lucky 777 Winner Go"
              />
              <el-button @click="refreshProjectName">随机</el-button>
            </div>
          </div>

          <el-alert
            v-if="nameExists"
            type="warning"
            :closable="false"
            show-icon
            title="工程名已存在于输出目录，创建时会先删除再覆盖。"
          />

          <div class="form-item">
            <label>模板目录</label>
            <div class="row">
              <el-input v-model="form.templatePath" />
              <el-button @click="pickPath('templatePath')">选择</el-button>
            </div>
          </div>

          <div class="form-item">
            <label>输出根目录</label>
            <div class="row">
              <el-input v-model="form.outputRoot" />
              <el-button @click="pickPath('outputRoot')">选择</el-button>
            </div>
          </div>

          <div class="form-item">
            <label>namespace.txt</label>
            <el-input v-model="form.namespaceFilePath" />
          </div>

          <div class="form-item">
            <label>游戏包目录（复制到 assets/mygame）</label>
            <div class="row">
              <el-input v-model="form.gamePackagePath" />
              <el-button @click="pickPath('gamePackagePath')">选择</el-button>
            </div>
            <div class="hot-tip">记得每个包更换A面游戏</div>
            <div v-if="!gameDirCheck.ok && gameDirCheck.message" class="warn">
              {{ gameDirCheck.message }}
            </div>
          </div>

          <div class="form-item">
            <label>图标资源目录（可选 res 或其上级目录）</label>
            <div class="row">
              <el-input v-model="form.iconResPath" />
              <el-button @click="pickPath('iconResPath')">选择</el-button>
            </div>
            <div class="hot-tip">记得每个包换图标和LOGO啊</div>
            <div v-if="!iconDirCheck.ok && iconDirCheck.message" class="warn">
              {{ iconDirCheck.message }}
            </div>
            <div v-if="iconPreviewDataUrl" class="icon-preview-wrap">
              <img
                :src="iconPreviewDataUrl"
                class="icon-preview"
                alt="playstore-icon preview"
              />
            </div>
            <div v-else-if="iconPreviewError" class="warn">
              {{ iconPreviewError }}
            </div>
          </div>

          <el-button
            class="submit"
            type="primary"
            :disabled="!canSubmit"
            @click="submit"
            >{{ busy ? "创建中..." : "创建工程" }}</el-button
          >

          <div class="record-actions">
            <el-button
              type="success"
              :disabled="!canBuild"
              @click="buildArtifact('apk')"
              >{{ buildBusy ? "构建中..." : "编译 APK (release)" }}</el-button
            >
            <el-button
              type="success"
              :disabled="!canBuild"
              @click="buildArtifact('aab')"
              >{{ buildBusy ? "构建中..." : "编译 AAB (release)" }}</el-button
            >
            <el-button
              type="warning"
              :disabled="!canInstall"
              @click="installCurrentApk"
              >{{ installBusy ? "安装中..." : "ADB 安装 APK" }}</el-button
            >
            <el-checkbox v-model="autoLaunchAfterInstall"
              >安装后自动打开</el-checkbox
            >
            <el-checkbox v-model="autoStartLogcatAfterLaunch"
              >运行后监控日志</el-checkbox
            >
            <el-button
              :type="logcatRunning ? 'danger' : 'primary'"
              @click="logcatRunning ? stopLogcat() : startLogcat(true)"
              >{{ logcatRunning ? "停止LOG" : "开始LOG" }}</el-button
            >
          </div>

          <div class="record-status" v-if="currentProjectPath">
            当前工程: {{ currentProjectPath }}
          </div>
          <div class="record-status" v-if="lastBuiltApkPath">
            最近 APK: {{ lastBuiltApkPath }}
          </div>
          <div class="record-status" v-if="lastBuiltAabPath">
            最近 AAB: {{ lastBuiltAabPath }}
          </div>

          <div class="progress-wrap">
            <div class="progress-label">进度: {{ progress }}%</div>
            <el-progress :percentage="progress" />
          </div>

          <div class="log-panel major-panel">
            <div class="log-title">主要日志</div>
            <div class="log-body">
              <div v-for="(line, idx) in majorLogs" :key="`m-${idx}-${line}`">
                {{ line }}
              </div>
            </div>
          </div>

          <div class="log-panel">
            <div class="log-title">详细日志（编译/ADB/全流程）</div>
            <div class="log-body">
              <div v-for="(line, idx) in logs" :key="`d-${idx}-${line}`">
                {{ line }}
              </div>
            </div>
          </div>

          <div class="log-panel">
            <div class="log-title">运行日志（adb logcat）</div>
            <div class="logcat-filter">
              <el-input
                v-model="logcatKeyword"
                clearable
                placeholder="搜索日志关键字"
              />
              <div class="logcat-flags">
                <el-checkbox v-model="showLogError">显示Error</el-checkbox>
                <el-checkbox v-model="showLogWarn">显示Warn</el-checkbox>
                <el-checkbox v-model="showLogInfo">显示Info</el-checkbox>
                <el-checkbox v-model="showLogDebug">显示Debug</el-checkbox>
                <el-checkbox v-model="showLogVerbose">显示Verbose</el-checkbox>
                <el-checkbox v-model="showLogOther">显示Other</el-checkbox>
              </div>
            </div>
            <div class="log-body">
              <div
                v-for="(line, idx) in filteredLogcatLines"
                :key="`lc-${idx}-${line}`"
                :class="logcatLineClass(line)"
              >
                {{ line }}
              </div>
            </div>
          </div>

          <div class="record-actions">
            <el-button @click="showRecordPanel = !showRecordPanel">{{
              showRecordPanel ? "隐藏记录编辑" : "显示记录编辑"
            }}</el-button>
          </div>

          <div v-if="showRecordPanel" class="record-panel">
            <div class="record-title">
              记录文件: quickmaker-ui/project-records.json
            </div>
            <div class="record-actions">
              <el-button @click="loadRecords">读取记录</el-button>
              <el-button type="primary" @click="saveRecords"
                >保存记录</el-button
              >
            </div>
            <el-input
              v-model="recordsRaw"
              class="record-text"
              type="textarea"
              :rows="10"
            />
            <div class="record-status">{{ recordsStatus }}</div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="后台配置" name="backend">
          <div
            v-for="(item, idx) in orderedBackendFields"
            :key="`backend-${item.key}-${idx}`"
            class="form-item"
          >
            <label>{{ item.key }}</label>
            <div class="row">
              <el-select
                v-if="isTypeField(item.key)"
                v-model="item.value"
                placeholder="请选择 type"
              >
                <el-option
                  v-for="opt in loadTypeOptions"
                  :key="`${opt.label}-${opt.value}`"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-input v-else v-model="item.value" />
              <div
                class="inline-actions"
                v-if="isContentPasswordField(item.key)"
              >
                <el-button @click="randomizeBackendContentPassword"
                  >随机</el-button
                >
                <el-button @click="copyContentPassword">复制</el-button>
              </div>
              <el-button
                v-else-if="isPackageField(item.key)"
                @click="applyBackendPackageToMain"
                >写回工程配置</el-button
              >
            </div>
            <div v-if="isEventKeyField(item.key)" class="hot-tip">
              记得更换adj的token或者AF 的KEY
            </div>
          </div>

          <div class="form-item">
            <label>adjParams</label>
            <el-input
              v-model="adjParamsRaw"
              type="textarea"
              :rows="6"
              placeholder='{"key":"value"}'
            />
            <div class="hot-tip">记得更换adj参数！！！！</div>
          </div>

          <div class="record-actions">
            <el-button @click="readAdjParamsConfig"
              >读取adjParams配置</el-button
            >
            <el-button @click="syncAdjParamsConfig">同步adjParams</el-button>
          </div>

          <div
            class="form-item"
            v-for="(item, idx) in adjParamsFields"
            :key="`adj-${item.key}-${idx}`"
          >
            <label>{{ `adjParams.${item.key}` }}</label>
            <div class="key-value-row">
              <el-input v-model="item.key" placeholder="key" />
              <el-input v-model="item.value" placeholder="value" />
            </div>
          </div>

          <div class="record-actions">
            <el-button @click="loadBackendConfig">读取 houtai.json</el-button>
            <el-button type="primary" @click="copyBackendConfig"
              >复制 JSON</el-button
            >
            <el-button type="primary" @click="copyBackendConfigMinified"
              >复制压缩JSON</el-button
            >
          </div>

          <div class="record-status">
            文件: E:\wg\cocos\H5QuickMaker\houtai.json
          </div>
          <div class="record-status" v-if="backendStatus">
            {{ backendStatus }}
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-alert
        v-if="message"
        type="success"
        :closable="false"
        show-icon
        :title="message"
      />
      <el-alert
        v-if="error"
        type="error"
        :closable="false"
        show-icon
        :title="error"
      />
    </section>
  </main>
</template>
