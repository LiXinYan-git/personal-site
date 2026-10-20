# AGENTS.md

面向在本仓库工作的 AI 编码代理（以及人类维护者）的说明。

## 1. 项目概述

这是一个**纯静态个人网站**：

- 前端：原生 HTML / CSS / JavaScript，**无框架、无构建步骤**；
- 数据：`data/profile.json` 是唯一内容来源；
- 后台：`admin/` 通过 GitHub Contents API 修改该 JSON 并提交；
- 部署：Vercel 或 Cloudflare Pages，push 后自动部署。

## 2. 目录与职责

| 路径 | 职责 | 修改注意 |
|---|---|---|
| `index.html` | 首页结构 | 保持语义化标签与现有 id 不变 |
| `css/style.css` | 样式、主题、响应式 | 颜色/圆角/间距优先用 `:root` 变量 |
| `js/main.js` | 拉取数据、渲染、交互 | 必须保留 `DEFAULT` 兜底数据 |
| `data/profile.json` | 内容数据 | 字段结构需与 `js/main.js` 一致 |
| `admin/` | 后台编辑页 | 不要在此硬编码真实 Token |
| `assets/` | SVG 图标与头像 | 不引入外部图片依赖 |

## 3. 开发约定

1. **不引入构建工具**（不要加 webpack / vite / next）——项目要能直接部署到任意静态托管；
2. **不引入第三方 JS/CSS CDN**——保持离线可用、加载快；
3. 新增文案一律走 `profile.json`，不要在 HTML 里写死个人信息；
4. 所有用户可见文本使用中文；代码注释可中文；
5. 渲染用户内容前必须做 HTML 转义（参考 `main.js` 的 `esc()`）；
6. 响应式断点保持：`900px`（Hero 单列）、`720px`（移动导航）；
7. 修改样式时优先复用现有 CSS 变量（`--primary`、`--radius`、`--shadow` 等）。

## 4. 常见任务

### 修改个人信息

优先通过 `/admin/` 页面保存；若直接改代码，编辑 `data/profile.json` 并保持 JSON 合法。

### 新增一个页面区块

1. 在 `index.html` 增加 `<section id="...">`；
2. 在 `css/style.css` 增加样式；
3. 在 `js/main.js` 的 `render()` 中填充数据；
4. 如需要新字段，同步更新 `data/profile.json` 与 `admin/admin.js` 的表单。

### 修改后台保存逻辑

只改 `admin/admin.js`，保持：
- `GET/PUT https://api.github.com/repos/{owner}/{repo}/contents/data/profile.json`
- UTF-8 与 base64 的转换方式；
- 401/404/409/422 的错误提示。

## 5. 禁止事项

- ❌ 不要把 GitHub Token、密码等敏感信息写进任何文件或提交记录；
- ❌ 不要删除 `DEFAULT` 兜底数据（否则 `file://` 预览会空白）；
- ❌ 不要改变 `profile.json` 的字段名而不更新渲染逻辑；
- ❌ 不要引入依赖 require 构建的代码（如 import 语法、npm 包）；
- ❌ 不要使用外部图片链接作为核心视觉元素。

## 6. 本地验证

```bash
# 任选其一，在项目根目录启动静态服务器
python -m http.server 8080
npx serve .
```

检查清单：

- [ ] 首页无控制台报错，各区块有内容；
- [ ] 320px 宽度无横向滚动；
- [ ] 主题切换后刷新保持；
- [ ] `/admin/` 能正常加载表单；
- [ ] 修改并保存后 GitHub 出现新 commit；
- [ ] 部署平台重新构建成功，线上内容更新。

## 7. 部署前检查

- [ ] `data/profile.json` 为合法 JSON；
- [ ] 没有把本机 Token 写进代码；
- [ ] `index.html` 的 `title` / `description` 正确；
- [ ] 后台页面带 `noindex`；
- [ ] 构建命令留空、输出目录为根目录。
