# fudoki.chrome.extension

这是一个为网页添加日文假名（Furigana）的 Chrome 扩展程序。它能够识别汉字并根据读音自动标注假名。

## 🚀 安装指南

1.  **打开扩展程序页面**:
    - 在浏览器地址栏输入 `chrome://extensions/`。
    - 确保右上角的 **开发者模式 (Developer mode)** 已开启。

2.  **加载扩展程序**:
    - 点击 **加载已解压的扩展程序 (Load unpacked)**。
    - 选择项目文件夹中的 `chrome-extension` 目录：
      `/Users/tetsuya/Dev/fudoki.chrome.extension/chrome-extension`

3.  **开始使用**:
    - 访问任何包含日文汉字的网站（例如 [Yahoo! Japan](https://www.yahoo.co.jp)）。
    - 选中文本后点击浮动的悬浮按钮，或点击工具栏图标，点击 **APPLY TO PAGE**。

---

## 📂 项目结构说明

除了 `chrome-extension` 文件夹（这是插件的最终本体，即浏览器加载的内容），根目录下的其他文件和文件夹是开发环境的核心部分。以下是详细解释：

### 🏗️ 核心目录
- **`src/` (Source Code)**:
  - **重要处**: 这里是所有**源代码**存放的地方。
  - 里面包含了原始的 JavaScript (`content.js`, `popup.js`, `background.js`)、HTML 和 CSS。你在开发时修改的代码都在这里。
- **`node_modules/`**:
  - 这是通过命令 `npm install` 自动生成的。
  - 它包含了插件依赖的所有第三方库（例如分词引擎 `kuromoji` 和转换库 `kuroshiro`）。
  - **注意**: 这个文件夹非常大，通常不需要手动修改，也不必包含在发布的版本中。

### ⚙️ 配置文件
- **`webpack.config.js`**:
  - **打包机**: Webpack 的配置文件。
  - 由于现代插件开发会使用很多模块和库，Webpack 的作用是将 `src/` 下分散的源码和 `node_modules/` 里的依赖库“打包”并“优化”成浏览器能理解的单个文件，并输出到 `chrome-extension/` 目录。
- **`package.json`**:
  - **项目清单**: 定义了项目的元数据、版本号以及各种开发指令（脚本）。
  - 它还列出了项目开发所需的所有库（dependencies）。
- **`package-lock.json`**:
  - **版本锁**: 记录了安装依赖库时的精确版本。确保在不同电脑上安装时，环境完全一致。

---

## 🛠️ 开发常用指令

如果你修改了 `src/` 目录下的代码，需要运行以下指令来更新 `chrome-extension` 文件夹的内容：

```bash
# 执行一次打包
npx webpack

# 如果你安装了依赖，可以使用：
npm run build
```

---

## ✨ 主要功能
- **全屏标注**: 点击 "APPLY TO PAGE" 为全网页添加假名。
- **划词标注**: 选中文本后通过浮动按钮或右键菜单获取局部标注。
- **高度自定义**: 
  - 支持 **日式黑白简约主题** 和 **动态渐变暗色主题**。
  - 可自由调整假名大小。
  - 窗口可自由**拖动**和**缩放**。
- **站点管理**: 支持设置特定网站自动启用或永久禁用。
