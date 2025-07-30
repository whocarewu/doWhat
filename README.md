
# 🚀 DoWhat - 智能日报生成器（Electron 版）

> 一款基于 Vue 3 + Element Plus 构建的智能日报生成器，结合 Git 提交记录快速生成个人或团队日报，  
> 通过 Electron 打包为跨平台桌面应用，提升工作效率与使用体验。

![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js)
![Element Plus](https://img.shields.io/badge/Element--Plus-2.x-blue?logo=element)
![Electron](https://img.shields.io/badge/Electron-23.x-blueviolet?logo=electron)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 项目目录

- [✨ 项目特点](#-项目特点)
- [📦 技术栈](#-技术栈)
- [📂 项目结构](#-项目结构)
- [🚀 快速开始](#-快速开始)
- [🧩 后端 API 示例](#-后端-api-示例)
- [📸 截图预览](#-截图预览)
- [📌 TODO](#-todo)
- [📄 License](#-license)
- [🙋‍♂️ 联系作者](#-联系作者)

---

## ✨ 项目特点

- 🔍 **自动生成日报**：根据 Git 提交日志智能提取每日完成项  
- 📅 **灵活选择时间范围**：支持日报、周报、月报  
- 🖥️ **Electron 桌面应用**：跨平台运行，支持 Windows/macOS/Linux  
- 🔐 **安全 IPC 通信**：主进程负责读取 Git 数据，渲染进程安全调用  
- 🎨 **现代化 UI**：Element Plus + CSS 动画 + 响应式设计  
- 🧠 **交互友好**：复制、下载、编辑等实用操作  
- 🛠️ **轻量依赖**：整洁高效的技术栈，易于维护与扩展  

---

## 📦 技术栈

- **前端框架**：Vue 3 + `<script setup>` + TypeScript  
- **组件库**：Element Plus  
- **桌面框架**：Electron  
- **Git 交互**：simple-git（Node.js 库，读取本地 Git 日志）  
- **状态管理**：Pinia  
- **数据请求**：Axios  
- **日期处理**：Moment.js  
- **构建工具**：Vite  

---

## 📂 项目结构

```
doWhat/
├── electron/             # Electron 主进程代码及 preload 脚本
│   ├── main.cjs          # 主进程入口文件，负责创建窗口及处理 Git 请求
│   └── preload.js        # 预加载脚本，暴露安全的 IPC 接口给渲染进程
├── public/               # 静态资源
├── src/
│   ├── assets/           # 项目资源
│   ├── components/       # 公共组件
│   ├── views/            # 页面视图
│   ├── store/            # Pinia 状态管理
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── server.js             # （可选）独立 Node.js 服务端（不使用 Electron 时）
├── index.html
├── package.json
└── README.md
```

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/doWhat.git
cd doWhat
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发环境

- **启动前端开发服务器：**

```bash
npm run dev
```

- **启动 Electron 应用（开发模式）：**

```bash
npm run electron:dev
```

> 该命令会并行启动前端开发服务器和 Electron，方便调试。

### 4. 生成生产包（可选）

```bash
npm run build
# 然后根据你的打包配置启动 Electron
```

---

## 🧩 后端 API 示例（Electron IPC）

- 主进程通过 Electron IPC 监听渲染进程请求，安全调用 `simple-git` 获取多仓库日志  
- 渲染进程调用示例：

```ts
const logs = await window.electronAPI.getGitLogs({
  author: 'your-name',
  since: '2025-07-01',
  until: '2025-07-30'
});
```

---

## 📸 截图预览

*此处插入项目界面截图，突出日报生成和 Electron 桌面窗口效果*

---

## 📌 TODO

- [x] 基础日报生成功能  
- [x] 多仓库 Git 日志支持  
- [x] Electron 主进程安全桥接 IPC  
- [ ] 多部门切换与管理  
- [ ] PDF 导出功能  
- [ ] 图表可视化工作量分布  
- [ ] AI 自动总结增强  

---

## 📄 License

[MIT](./LICENSE) © 2025 wu junsen

---

## 🙋‍♂️ 联系作者

如果你觉得这个项目有帮助，欢迎点 Star ⭐ 或联系我：

- 博客：[https://blog.whocarewu.cn/](https://blog.whocarewu.cn/)  
- 邮箱：1324940338@qq.com  
- GitHub: [https://github.com/whocarewu](https://github.com/whocarewu)

---
