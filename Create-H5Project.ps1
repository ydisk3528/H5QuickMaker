param(
    [string]$TemplatePath = 'E:\wg\cocos\H5QuickMaker\Lucky 777 Winner Go',
    [string]$NamespaceFilePath = 'E:\wg\cocos\H5QuickMaker\namespace.txt',
    [string]$OutputRoot = 'E:\wg\cocos\duZong',
    [string]$ApplicationId,
    [string]$ProjectName,
    [string]$GamePackagePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-RequiredInput {
    param(
        [string]$Prompt,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        $Value = Read-Host $Prompt
    }

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "$Prompt 不能为空。"
    }

    return $Value.Trim()
}

function Convert-NamespaceToPath {
    param([string]$Namespace)
    return ($Namespace -split '\\.') -join '\\'
}

function Select-Folder {
    param([string]$Description)

    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = $Description
    $dialog.ShowNewFolderButton = $false

    $result = $dialog.ShowDialog()
    if ($result -ne [System.Windows.Forms.DialogResult]::OK -or [string]::IsNullOrWhiteSpace($dialog.SelectedPath)) {
        throw '未选择游戏包目录，流程已终止。'
    }

    return $dialog.SelectedPath
}

function Replace-OrFail {
    param(
        [string]$SourceText,
        [string]$Pattern,
        [string]$Replacement,
        [string]$Label
    )

    if (-not [regex]::IsMatch($SourceText, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)) {
        throw "未找到 $Label 的可替换内容，请检查模板格式。"
    }
    $output = [regex]::Replace($SourceText, $Pattern, $Replacement, [System.Text.RegularExpressions.RegexOptions]::Multiline)

    return $output
}

$ApplicationId = Read-RequiredInput -Prompt '请输入 applicationId (如 com.xxx.xxx.game)' -Value $ApplicationId
$ProjectName = Read-RequiredInput -Prompt '请输入新工程名 (文件夹名)' -Value $ProjectName

if (-not (Test-Path -LiteralPath $TemplatePath -PathType Container)) {
    throw "模板路径不存在: $TemplatePath"
}
if (-not (Test-Path -LiteralPath $NamespaceFilePath -PathType Leaf)) {
    throw "namespace.txt 不存在: $NamespaceFilePath"
}
if (-not (Test-Path -LiteralPath $OutputRoot -PathType Container)) {
    New-Item -Path $OutputRoot -ItemType Directory | Out-Null
}

$Namespace = (Get-Content -LiteralPath $NamespaceFilePath -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($Namespace)) {
    throw "namespace.txt 为空: $NamespaceFilePath"
}

$DestinationProjectPath = Join-Path $OutputRoot $ProjectName
if (Test-Path -LiteralPath $DestinationProjectPath) {
    throw "目标工程目录已存在: $DestinationProjectPath"
}

Copy-Item -LiteralPath $TemplatePath -Destination $DestinationProjectPath -Recurse

$buildGradlePath = Join-Path $DestinationProjectPath 'app\\build.gradle'
if (-not (Test-Path -LiteralPath $buildGradlePath -PathType Leaf)) {
    throw "未找到 build.gradle: $buildGradlePath"
}

$buildGradleText = Get-Content -LiteralPath $buildGradlePath -Raw
$oldNamespaceMatch = [regex]::Match($buildGradleText, 'namespace\s+[''"]([^''"]+)[''"]')
if (-not $oldNamespaceMatch.Success) {
    throw '模板 build.gradle 中未找到 namespace。'
}
$oldNamespace = $oldNamespaceMatch.Groups[1].Value

$keystorePath = Join-Path $DestinationProjectPath "$ApplicationId.jks"
$keystorePathForGradle = $keystorePath.Replace('\', '/')

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    throw '未找到 keytool，请先安装 JDK 并确保 keytool 在 PATH 中。'
}

$fixedDName = 'CN=H5QuickMaker, OU=Dev, O=H5QuickMaker, L=Shenzhen, ST=Guangdong, C=CN'
& $keytool.Source -genkeypair -v `
    -keystore $keystorePath `
    -alias $ApplicationId `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $ApplicationId `
    -keypass $ApplicationId `
    -dname $fixedDName `
    -noprompt | Out-Null

if (-not (Test-Path -LiteralPath $keystorePath -PathType Leaf)) {
    throw "keystore 生成失败: $keystorePath"
}

$namespaceReplacePattern = 'namespace\s+[''"]' + [regex]::Escape($oldNamespace) + '[''"]'
$buildGradleText = Replace-OrFail -SourceText $buildGradleText -Pattern $namespaceReplacePattern -Replacement "namespace '$Namespace'" -Label 'namespace'
$buildGradleText = Replace-OrFail -SourceText $buildGradleText -Pattern 'applicationId\s+"[^"]+"' -Replacement "applicationId `"$ApplicationId`"" -Label 'applicationId'
$buildGradleText = Replace-OrFail -SourceText $buildGradleText -Pattern "storeFile\s+file\('[^']*'\)" -Replacement "storeFile file('$keystorePathForGradle')" -Label 'storeFile'
$buildGradleText = Replace-OrFail -SourceText $buildGradleText -Pattern "storePassword\s+'[^']*'" -Replacement "storePassword '$ApplicationId'" -Label 'storePassword'
$buildGradleText = Replace-OrFail -SourceText $buildGradleText -Pattern "keyAlias\s+'[^']*'" -Replacement "keyAlias '$ApplicationId'" -Label 'keyAlias'
$buildGradleText = Replace-OrFail -SourceText $buildGradleText -Pattern "keyPassword\s+'[^']*'" -Replacement "keyPassword '$ApplicationId'" -Label 'keyPassword'

Set-Content -LiteralPath $buildGradlePath -Value $buildGradleText -Encoding UTF8

$oldJavaDir = Join-Path $DestinationProjectPath ('app\\src\\main\\java\\' + (Convert-NamespaceToPath -Namespace $oldNamespace))
$newJavaDir = Join-Path $DestinationProjectPath ('app\\src\\main\\java\\' + (Convert-NamespaceToPath -Namespace $Namespace))

if (Test-Path -LiteralPath $oldJavaDir -PathType Container) {
    New-Item -Path $newJavaDir -ItemType Directory -Force | Out-Null
    Get-ChildItem -LiteralPath $oldJavaDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($oldJavaDir.Length).TrimStart('\\')
        $targetFile = Join-Path $newJavaDir $relativePath
        $targetDir = Split-Path -Path $targetFile -Parent
        if (-not (Test-Path -LiteralPath $targetDir)) {
            New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
        }
        Move-Item -LiteralPath $_.FullName -Destination $targetFile -Force
    }
    Remove-Item -LiteralPath $oldJavaDir -Recurse -Force
}

Get-ChildItem -LiteralPath $DestinationProjectPath -Recurse -File -Include *.java,*.kt,*.xml,*.gradle | ForEach-Object {
    $filePath = $_.FullName
    [string]$content = Get-Content -LiteralPath $filePath -Raw
    $updated = $content.Replace($oldNamespace, $Namespace)
    if ($updated -ne $content) {
        Set-Content -LiteralPath $filePath -Value $updated -Encoding UTF8
    }
}

if ([string]::IsNullOrWhiteSpace($GamePackagePath)) {
    $GamePackagePath = Select-Folder -Description '请选择本次打包要使用的游戏包目录（会复制目录内全部文件到 assets/mygame）'
}
if (-not (Test-Path -LiteralPath $GamePackagePath -PathType Container)) {
    throw "游戏包目录不存在: $GamePackagePath"
}

$targetMygameDir = Join-Path $DestinationProjectPath 'app\\src\\main\\assets\\mygame'
if (-not (Test-Path -LiteralPath $targetMygameDir -PathType Container)) {
    New-Item -Path $targetMygameDir -ItemType Directory -Force | Out-Null
}

Get-ChildItem -LiteralPath $targetMygameDir -Force | Remove-Item -Recurse -Force
Get-ChildItem -LiteralPath $GamePackagePath -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $targetMygameDir -Recurse -Force
}

Write-Host "创建完成: $DestinationProjectPath"
Write-Host "applicationId: $ApplicationId"
Write-Host "namespace: $Namespace"
Write-Host "keystore: $keystorePath"
Write-Host "mygame 来源: $GamePackagePath"
