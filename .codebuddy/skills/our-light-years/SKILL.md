---
name: our-light-years
description: 开发与维护「我们的光年」情侣专属私密空间 Web 应用。当用户要求按照该产品的需求文档（PRD）开发、继续分阶段开发（相册/日记/评论/互动等模块）、或修改其界面与功能时使用本技能。包含完整产品需求、技术规范与分阶段交付流程。
---

# 「我们的光年」开发技能

## 用途

「我们的光年」是一个面向异地恋情侣的轻量级 Web 应用，集私密相册、恋爱日记、互动评论于一体，移动端优先。本技能沉淀了该项目的完整产品需求、技术选型、设计规范与分阶段交付流程，确保每次开发保持一致。

## 何时使用

- 用户要求开发 / 继续开发「我们的光年」的任意阶段或功能
- 用户要求修改该应用的界面、功能或数据结构
- 用户提及该应用名或其任意模块（密码锁、恋爱计时器、相册、日记、评论、互动、设置）

## 使用流程

1. 先读取 `references/prd.md` 获取完整产品需求（功能点、优先级、数据模型、接口、权限）。
2. 按 PRD「九、开发与交付」的 Phase 顺序分阶段开发；**每完成一个 Phase 必须停下等待用户确认**，再进入下一阶段。
3. 严格遵循以下技术规范：
   - 前端：React 18 + Vite 5 + Tailwind CSS 3 + framer-motion + react-router-dom（HashRouter）。
   - 移动端优先（375-428px），兼顾桌面至 1200px；图片一律 `max-width:100%`；触控目标 ≥44x44pt。
   - 色调：#FF6B81 主色 / #FFF5F7 背景 / #F5A0B0 点缀；圆润柔和字体（站酷快乐体 + Nunito，回退系统字体）。
   - 敏感信息一律走环境变量（`.env` + `src/config/appConfig.js` 统一读取），禁止硬编码。
   - 关键逻辑添加中文注释。
4. 后端优先采用 BaaS（Supabase / Firebase），避免自建服务器。Phase 1 用 localStorage 模拟，`src/services/` 层统一封装并预留云端替换接口，后续阶段只替换实现、不动调用方。
5. 数据操作遵循 PRD「六、API/数据操作接口」的命名约定（uploadPhoto / getPhotos / createDiary / createComment 等）。

## 项目结构约定

- `src/config/` 环境变量读取与全局配置
- `src/services/` 数据服务层（localStorage 模拟，可替换为云端）
- `src/contexts/` 全局状态（解锁状态等）
- `src/components/` 通用组件（密码锁、导航、空状态、图标）
- `src/pages/` 页面（相册 / 日记 / 互动 / 我的）

## 参考

- 完整产品需求文档（PRD）：`references/prd.md`
