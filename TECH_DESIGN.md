# 个人网站 TECH_DESIGN（技术设计）

| 项目 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 编写日期 | 2026-10-20 |
| 关联文档 | PRD.md、AGENTS.md |

## 1. 设计目标

- **零后端服务器**：不维护数据库与 API 服务；
- **可编辑**：所有者在网页后台修改内容，无需改代码；
- **可部署**：同时适配 Vercel 与 Cloudflare Pages；
- **低成本**：全部使用免费额度；
- **可迁移**：内容为纯 JSON，后续可平滑迁移到 CMS 或数据库。

## 2. 技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 页面 | 原生 HTML + CSS + JavaScript | 无构建、加载快、部署零配置 |
| 数据 | `data/profile.json` | 结构清晰，前后端通用 |
| 持久化 | GitHub Contents API | 免费、自带版本历史、提交即触发部署 |
| 认证 | GitHub Fine-grained PAT | 仅授权单仓库，权限最小化 |
| 部署 | Vercel / Cloudflare Pages | 免费、HTTPS、自动部署、全球 CDN |
| 图标 | 内联 SVG | 不依赖外部图片与 CDN |

## 3. 总体架构

```
┌──────────────┐      HTTPS       ┌────────────────────┐
│   访客浏览器  │ ───────────────▶ │ Vercel / Cloudflare │
└──────────────┘                  │  静态托管 + CDN      │
                                  └─────────┬──────────┘
                                            │ 读取
                                  ┌─────────▼──────────┐
                                  │ data/profile.json   │
                                  └─────────▲──────────┘
                                            │ 提交（PAT）
┌──────────────┐   GitHub Contents API      │
│ 所有者浏览器  │ ───────────────────────────┘
│  /admin/     │        （写入仓库 → 触发自动部署）
└──────────────┘
```

**关键点**：后台不是传统服务端，而是"浏览器 + GitHub API"；GitHub 仓库既是代码仓库，也是内容数据库。

## 4. 目录结构

```
personal-site/
├─ index.html            # 首页
├─ css/style.css         # 全站样式（明暗主题、响应式）
├─ js/main.js            # 拉取 profile.json 并渲染
├─ data/profile.json     # 个人信息（唯一数据源）
├─ assets/               # 头像、favicon（SVG）
├─ admin/
│  ├─ index.html         # 后台编辑页
│  ├─ admin.css
│  └─ admin.js           # GitHub API 读写
├─ PRD.md
├─ TECH_DESIGN.md
├─ AGENTS.md
└─ README.md
```

## 5. 数据模型

`data/profile.json`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| name | string | 是 | 姓名 |
| title | string | 否 | 头衔 / 身份 |
| tagline | string | 否 | 一句话介绍 |
| bio | string | 否 | 个人简介 |
| avatar | string | 否 | 头像地址（相对路径或 URL） |
| location | string | 否 | 所在地 |
| email | string | 否 | 联系邮箱 |
| skills | string[] | 否 | 技能标签 |
| socials | object[] | 否 | `{ label, url }` |
| projects | object[] | 否 | `{ name, desc, tags[], link }` |
| experience | object[] | 否 | `{ period, org, role, desc }` |
| updatedAt | string | 否 | 最后更新时间（YYYY-MM-DD） |

示例：

```json
{
  "name": "李欣言",
  "title": "软件工程 · 本科生",
  "skills": ["Java", "Android", "SQLite"],
  "socials": [{ "label": "GitHub", "url": "https://github.com/lixinyan-git" }],
  "projects": [{ "name": "墨禾书城 App", "desc": "多端图书商城", "tags": ["Android"], "link": "" }]
}
```

## 6. 关键流程

### 6.1 首页加载

1. 浏览器请求 `index.html` / `style.css` / `main.js`；
2. `main.js` 执行 `fetch('data/profile.json')`；
3. 成功 → `render(profile)`；失败（如 `file://`）→ 使用内置兜底数据；
4. 渲染各区块并初始化主题、菜单、滚动高亮。

### 6.2 后台保存

1. 读取 Token / 仓库 / 分支（localStorage）；
2. `GET /repos/{owner}/{repo}/contents/data/profile.json` 获取 `content` 与 `sha`；
3. 编辑后 `PUT` 同一路径，提交 `base64(UTF-8 JSON)` 与 `sha`；
4. GitHub 生成新 commit → 平台监听到 push → 重新构建部署；
5. 页面提示 30～60 秒后刷新可见。

### 6.3 编码处理

浏览器 `btoa` 只支持 Latin-1，中文会报错。因此：

```js
// 编码：字符串 → UTF-8 字节 → 二进制字符串 → base64
const bytes = new TextEncoder().encode(str);
let bin = '';
bytes.forEach(b => bin += String.fromCharCode(b));
const b64 = btoa(bin);

// 解码：base64 → 二进制 → UTF-8
const bin = atob(b64.replace(/\s/g, ''));
const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
const str = new TextDecoder().decode(bytes);
```

## 7. 安全设计

| 项 | 措施 |
|---|---|
| 凭证 | 使用 Fine-grained PAT，仅勾选目标仓库 `Contents: Read and write` |
| 存储 | Token 存于本机 localStorage，不上传到第三方 |
| 页面 | `/admin/` 设置 `<meta name="robots" content="noindex,nofollow">` |
| 传输 | 全部 HTTPS；GitHub API 强制 TLS |
| 输入 | 渲染时对文本做 HTML 转义，避免 XSS |
| 失败 | 401/404/409/422 分类提示，不泄露额外信息 |

> 说明：纯前端后台无法做到"只有所有者能打开页面"，但**没有 PAT 就无法读写仓库**，因此安全性由 GitHub 权限保证。

## 8. 部署方案

### 8.1 Vercel

1. 推送代码到 GitHub；
2. Vercel → Add New Project → 选择仓库；
3. Framework Preset 选 **Other**（纯静态）；
4. Build Command 留空，Output Directory 填 `.`；
5. Deploy，得到 `https://<项目>.vercel.app`。

### 8.2 Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git；
2. 选择仓库；
3. Framework preset 选 **None**，Build command 留空，Build output directory 填 `/`；
4. Save and Deploy，得到 `https://<项目>.pages.dev`。

两个平台都支持"push 自动部署"。

## 9. 测试计划

| 编号 | 用例 | 预期 |
|---|---|---|
| T-01 | 首页加载 | 各区块数据与 profile.json 一致 |
| T-02 | 移动端 320px | 无横向滚动 |
| T-03 | 主题切换 | 刷新后保持 |
| T-04 | 后台加载 | 正确填充所有字段与列表 |
| T-05 | 后台保存 | GitHub 出现新提交 |
| T-06 | 保存后刷新 | 平台部署完成后内容更新 |
| T-07 | 错误 Token | 提示 401 |
| T-08 | 错误仓库 | 提示 404 |
| T-09 | 导出 JSON | 下载内容与表单一致 |
| T-10 | 断网 | 页面不白屏，有兜底内容 |

## 10. 可扩展性

- 换数据库：只需替换 `js/main.js` 的数据源与 `admin/admin.js` 的保存实现，页面结构不变；
- 加区块：在 `index.html` 增加 section、在 `render()` 中填充、在 profile.json 增加字段；
- 多语言：为 profile.json 增加 `locales` 字段，渲染时按语言取；
- 访问统计：接入 Umami / Plausible 等无 Cookie 方案。
