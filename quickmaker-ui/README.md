# QuickMaker UI

## 安装

```bash
cd e:\wg\cocos\H5QuickMaker\quickmaker-ui
npm install
```

## 开发运行

```bash
npm run dev
```

## 打包构建

```bash
npm run build
```

## 功能

- 输入 `applicationId` 和新工程名
- 读取 `namespace.txt`（默认 `E:\wg\cocos\H5QuickMaker\namespace.txt`）
- 自动生成 `.jks`
- 更新 `app/build.gradle` 的 `applicationId`、`namespace`、`signingConfigs`
- 按 namespace 调整 `app/src/main/java/...` 目录与源码包名
- 将你选择的游戏包目录复制到 `app/src/main/assets/mygame`
