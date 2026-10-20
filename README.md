# 个人网站 Personal Site

一个可部署到 Vercel / Cloudflare Pages 的**纯静态个人主页**，自带网页后台：后台通过 GitHub Contents API 修改 `data/profile.json`，提交后平台自动重新部署。

## 功能

- 单页个人主页：Hero / 关于 / 技能 / 项目 / 经历 / 联系
- 明暗主题切换（记忆偏好）、移动端折叠菜单、滚动高亮
- 后台 `/admin/`：连接仓库、编辑资料、增删项目与经历、保存、导出 JSON
- 内容与代码分离：所有文案来自 `data/profile.json`
- 无框架、无构建、无外部 CDN

## 本地预览

```bash
cd personal-site
python -m http.server 8080
# 打开 http://localhost:8080
```

> 直接双击 `index.html` 也能看到页面，但会使用内置兜底数据（`file://` 下浏览器禁止 fetch 本地 JSON）。

## 部署到 Vercel

1. 把本目录推送到 GitHub 仓库（例如 `personal-site`）；
2. Vercel → Add New Project → 选择该仓库；
3. Framework Preset：**Other**；Build Command：留空；Output Directory：`.`；
4. Deploy。

## 部署到 Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git；
2. 选择仓库；
3. Framework preset：**None**；Build command：留空；Build output directory：`/`；
4. Save and Deploy。

## 后台使用（重要）

1. 生成一个 **Fine-grained personal access token**：
   - GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token；
   - Repository access：Only select repositories → 选择本仓库；
   - Permissions：**Contents = Read and write**；
   - 生成后复制 token（只显示一次）。
2. 打开线上站点 `/admin/`；
3. 填入 Token、仓库（`用户名/仓库名`）、分支（默认 `main`），点「连接并加载」；
4. 修改内容 → 点「保存到 GitHub」；
5. 等待 30～60 秒，刷新首页即可看到更新。

> Token 只保存在本机浏览器的 localStorage 中；请勿在公共电脑上使用，建议定期轮换。

## 目录结构

```
personal-site/
├─ index.html
├─ css/style.css
├─ js/main.js
├─ data/profile.json
├─ assets/{avatar.svg, favicon.svg}
├─ admin/{index.html, admin.css, admin.js}
├─ PRD.md
├─ TECH_DESIGN.md
├─ AGENTS.md
└─ README.md
```

## 常见问题

**Q：保存后页面没变化？**
平台部署需要 30～60 秒；可在 Vercel / Cloudflare 的 Deployments 里看进度，或手动 Redeploy。

**Q：后台报 404？**
检查仓库名格式（`用户名/仓库名`）、分支名，以及 Token 是否有该仓库 Contents 权限。

**Q：Token 丢了怎么办？**
重新生成一个，在后台重新填写即可；内容数据不受影响。

**Q：能换成别的存储吗？**
可以。参考 `TECH_DESIGN.md` 第 10 节，替换 `js/main.js` 的数据源与 `admin/admin.js` 的保存实现即可。
