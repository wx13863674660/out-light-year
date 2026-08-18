# 「我们的光年」部署与 PWA 指南（Phase 5）

本指南说明如何把应用发布上线（Vercel / Netlify 二选一），并让手机支持
「添加到主屏幕」以独立 App 形态使用。

## 一、本地验证

```bash
npm install
npm run dev      # 本地开发（http://localhost:5173）
npm run build    # 生产构建（输出到 dist/）
npm run preview  # 本地预览生产产物（默认 http://localhost:5173）
```

> 构建产物 `dist/` 即部署内容。`npm run preview` 下 Service Worker 与
> PWA 能力即可生效，可在浏览器 DevTools → Application → Manifest /
> Service Workers 中检查。

## 二、部署到 Vercel（推荐，5 分钟）

1. 把项目推送到 GitHub 仓库（见第五节）。
2. 打开 https://vercel.com → New Project → Import 该仓库。
3. 框架预设自动识别为 **Vite**（配置见 `vercel.json`，一般无需改动）。
4. 点击 **Deploy**，等待 1-2 分钟即可获得 `https://xxx.vercel.app` 链接。
5. 以后每次 push 到仓库，Vercel 会自动重新部署。

## 三、部署到 Netlify

1. 打开 https://app.netlify.com → Add new site → Import an existing project。
2. 选择仓库，Build command 填 `npm run build`，Publish directory 填 `dist`。
3. 点击 Deploy。SPA 回退规则已内置在 `public/_redirects`，无需额外配置。

## 四、手机安装（PWA）

### iOS（iPhone / iPad）
1. Safari 打开部署后的链接。
2. 点底部「分享」按钮 →「添加到主屏幕」。
3. 确认名称（我们的光年）与图标，点击「添加」。
4. 主屏幕出现独立图标，点击即以全屏 App 形态打开，无浏览器地址栏。

### Android（Chrome）
1. Chrome 打开部署后的链接。
2. 地址栏或菜单出现「安装应用」/「添加到主屏幕」提示，点击确认。
3. 或通过菜单 →「安装应用」完成安装。

> 首次在线打开后（或已安装的 App 离线打开过），应用资源会被 Service
> Worker 缓存，之后**断网也能打开**。你写下的日记、照片等数据目前存储在
> 浏览器 localStorage 中，请勿清除站点数据，否则会丢失（云端迁移见第六节）。

## 五、推送到 GitHub 仓库

项目当前未初始化 git，执行：

```bash
git init
git add .
git commit -m "我们的光年 Phase 5：部署上线 + PWA"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

## 六、云端数据迁移（后续可选）

当前数据全部使用 localStorage 模拟（`src/services/` 层统一封装）。PRD 规划的
下一步是接入 Supabase / Firebase：

- 安装官方 SDK 并配置环境变量（`.env` + `src/config/appConfig.js` 读取）。
- 只替换 `src/services/` 各文件的内部实现，调用方与页面无需改动。
- 建议先接入认证（情侣双账号）再迁移相册存储（私有桶 + 签名 URL）。

## 七、发布检查清单

- [ ] `npm run build` 构建通过
- [ ] 浏览器 DevTools → Application 中 Manifest 无报错、图标正常
- [ ] Service Worker 注册成功（`sw.js` 已激活）
- [ ] 手机 Safari「添加到主屏幕」图标与名称正确
- [ ] 离线打开应用仍可浏览已缓存页面
