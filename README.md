
# 🚀 DoWhat - 日报生成器

> 一款基于 Vue 3  + Element Plus 构建的智能日报生成器，结合 Git 提交记录快速生成个人或团队日报，提升工作效率。

![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js)
![Element Plus](https://img.shields.io/badge/Element--Plus-2.x-blue?logo=element)
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
- 📅 **灵活选择时间范围**：支持生成日报、周报、月报
- 🎨 **现代化 UI**：Element Plus + CSS 动画 + 响应式设计
- 🧠 **交互友好**：复制、下载、编辑一应俱全
- 🛠️ **轻量依赖**：整洁高效的技术栈，便于拓展

---

## 📦 技术栈

- **前端框架**：Vue 3 + `<script setup>` + TypeScript
- **组件库**：Element Plus
- **样式处理**：SCSS + 响应式布局
- **动画支持**：CSS 动画、Lottie
- **数据处理**：Axios、Moment.js
- **状态管理**：Pinia
- **后端接口**：simple-git + Node.js + Express

---

## 📂 项目结构

```
doWhat/
├── public/               # 静态资源
├── src/
│   ├── assets/           # 项目资源
│   ├── components/       # 公共组件
│   ├── views/            # 页面视图
│   ├── store/            # Pinia 状态管理
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── server.js             # Node 服务端（提供 Git 日志接口）
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

### 3. 启动前端项目

```bash
npm run dev
```

### 4. 启动后端服务（Node）

```bash
node server.js
```

确保你已经安装了 [Git](https://git-scm.com/) 并配置好了本地仓库路径。

---

## 🧩 后端 API 示例

**接口地址**：

```
GET http://localhost:3000/api/git/logs
```

**请求参数**：

| 参数     | 类型   | 说明               |
|----------|--------|--------------------|
| author   | string | Git 提交者         |
| since    | string | 起始日期 (YYYY-MM-DD) |
| until    | string | 截止日期           |

**示例请求**：

```
GET /api/git/logs?author=whocarewu&since=2025-07-29&until=2025-07-30
```

---

## 📸 截图预览


---

## 📌 TODO

- [x] 基础日报生成
- [x] Git 日志接口接入
- [ ] 支持多部门切换
- [ ] 支持导出 PDF
- [ ] 可视化图表（工作量分布）
- [ ] 接入 AI 自动总结

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
