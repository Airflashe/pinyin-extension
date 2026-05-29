# Pinyin Extension 🀄

一个 Chrome 浏览器扩展，在页面**汉字上方自动标注拼音**，点击拼音即可**播放普通话发音**。

> 学习中文、阅读中文网页的得力助手。

## 功能

| 功能 | 说明 |
|------|------|
| ✍️ **全页标注** | 一键将页面上所有汉字标注拼音（带声调） |
| 🔊 **点击发音** | 点击任意拼音文字，浏览器朗读普通话发音 |
| 🖱️ **右键标注** | 选中文字 → 右键菜单 →「标注拼音」 |
| 📢 **右键朗读** | 选中文字 → 右键菜单 →「朗读发音」 |
| 🔄 **一键恢复** | 再次点击按钮，移除所有拼音标注，还原页面 |
| 📡 **动态支持** | 自动标注页面动态加载的新内容 |

## 安装

### 方式一：加载已解压的扩展（推荐）

1. 下载或克隆本项目
2. 打开 Chrome 浏览器，地址栏输入 `chrome://extensions`
3. 打开右上角「**开发者模式**」开关
4. 点击「**加载已解压的扩展程序**」
5. 选择项目中的 **`dist/`** 目录
6. 扩展图标出现在工具栏，安装完成

### 方式二：打包安装

1. 解压 `pinyin-extension.zip`
2. 打开 `chrome://extensions`，开启「开发者模式」
3. 点击「**打包扩展程序**」
4. 「扩展程序根目录」选择解压后的 `dist/` 文件夹
5. 点击「打包扩展程序」，生成 `.crx` 文件
6. 将 `.crx` 文件拖入 `chrome://extensions` 页面即可

### 方式三：命令行加载（Edge / 其他 Chromium 浏览器）

```bash
# Edge
start msedge --load-extension="./dist"

# Chrome
open -a "Google Chrome" --args --load-extension="$(pwd)/dist"
```

## 使用

### 全页标注

1. 打开任意包含中文的网页
2. 点击工具栏的 **拼音标注** 图标
3. 点击「**标注全页**」按钮
4. 页面汉字上方出现拼音标注

### 听取发音

- 直接点击拼音文字（橙色的拼音标注），浏览器会朗读该字的普通话发音
- 播放中的拼音会有闪烁动画提示

### 右键标注 / 朗读

- 在页面上选中要标注的汉字
- 右键菜单中出现「**标注拼音**」和「**朗读发音**」
- 选择需要的操作即可

### 移除标注

- 再次点击扩展图标，点击「**移除标注**」

## 技术栈

- **拼音转换**: [pinyin-pro](https://github.com/zh-lx/pinyin-pro) — 支持多音字识别、带声调符号
- **语音合成**: Web Speech API（浏览器原生 TTS，`zh-CN`）
- **DOM 标注**: HTML5 `<ruby>` / `<rb>` / `<rt>` 标签
- **构建工具**: Vite 6 + TypeScript 5
- **Chrome API**: Manifest V3

## 项目结构

```
Pinyin Extension/
├── dist/                     # 构建产物（直接加载到 Chrome）
│   ├── manifest.json
│   ├── background.js         # Service Worker
│   ├── content.js            # Content Script
│   ├── content.css           # 标注样式
│   ├── popup.html / popup.js # 弹窗控制面板
│   └── icons/
├── src/
│   ├── background/           # 右键菜单逻辑
│   ├── content/              # 核心标注 & 发音
│   ├── popup/                # 弹窗 UI
│   └── utils/                # 工具函数
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 类型检查
npm run typecheck
```

## 许可

MIT
