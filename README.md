# 王梓钰 Wiki 项目文档

**版本**: 1.0
**最后更新**: 2026-02-28

## 1. 项目概述

本项目是为艺人**王梓钰**创建的个人粉丝 Wiki 网站，旨在收录其音乐、视频、图库、动态等信息。网站前端采用 React 单页应用（SPA）架构，后端使用 Python FastAPI 提供数据接口，部署在腾讯云服务器上。

- **线上地址**: [http://www.lianwzy.wiki](http://www.lianwzy.wiki)
- **服务器 IP**: `170.106.143.188`

### 1.1. 核心需求

- **设计对齐**: 网站的视觉和交互设计严格参考 [yinlin.wiki](https://yinlin.wiki)，包括布局、配色、字体和动效。
- **性能优化**: 追求流畅的用户体验，包括懒加载、数据预加载、图片压缩和组件常驻。
- **数据驱动**: 所有内容（音乐、视频、图库等）均通过后端 API 获取，方便维护和扩展。
- **移动端适配**: 提供与桌面端体验一致的移动端专属界面。

## 2. 技术架构

### 2.1. 前端 (Client)

- **框架**: React 18 + TypeScript + Vite
- **路由**: `wouter` (一个轻量级的 React 路由库)
- **UI**: 自定义 CSS + `shadcn/ui` (部分基础组件)
- **状态管理**: 自定义 `pageStore` 实现跨页面数据缓存
- **部署**: 通过 `pnpm build` 构建静态文件，部署于 `/var/www/wangziyu-wiki`

#### 关键文件 (`/root/wangziyu-wiki/client/src`)

| 文件/目录 | 描述 |
|---|---|
| `App.tsx` | **应用主入口**。负责路由分发、全局布局（PC/Mobile）、`Suspense` 懒加载和常驻组件渲染。 |
| `components/` | **可复用组件**。包括 PC 端导航栏 (`Navbar`)、手机端布局 (`MobileLayout`) 和底部 Tab 栏 (`MobileTabBar`)。 |
| `pages/` | **页面组件**。每个页面对应一个文件，通过 `React.lazy` 实现懒加载。 |
| `lib/api.ts` | **API 请求封装**。定义所有与后端交互的函数。 |
| `lib/pageStore.ts` | **全局页面缓存**。防止页面切换时重复请求已获取的数据。 |
| `hooks/` | **自定义 Hooks**。例如 `useIsMobile` 用于判断设备类型。 |
| `index.css` | **全局样式表**。定义了网站的主题色（紫色系）、字体、布局和响应式媒体查询。 |

### 2.2. 后端 (API)

- **框架**: Python 3.11 + FastAPI + Uvicorn
- **数据源**: 所有数据存储在 `/root/wangziyu-api/data/` 目录下的 JSON 文件中。
- **运行方式**: 通过 `uvicorn` 在 `8000` 端口上运行，由 Nginx 反向代理。

#### 关键文件 (`/root/wangziyu-api`)

| 文件/目录 | 描述 |
|---|---|
| `main.py` | **API 主文件**。定义所有 FastAPI 路由，如 `/video/filter`, `/music/latest` 等。 |
| `data/` | **数据目录**。存放 `video.json`, `music.json` 等核心数据文件。 |

### 2.3. 服务器与部署

- **操作系统**: OpenCloudOS 9 (Tencent Cloud)
- **Web 服务器**: Nginx
- **部署脚本**: `/root/update-wiki.sh`，一个自动化脚本，用于拉取最新代码、安装依赖、构建前端和重启服务。
- **Nginx 配置**: `/etc/nginx/conf.d/wangziyu-wiki.conf`，配置了静态文件服务和对后端 API 的反向代理 (`/api/` -> `http://127.0.0.1:8000/`)。

## 3. 核心功能与实现

### 3.1. 导航栏常驻 (PC & Mobile)

**需求**: 页面切换时，顶部导航栏（PC）和底部 Tab 栏（Mobile）保持不变，不重新加载。

**解决方案**: 这是通过在 `App.tsx` 中将常驻组件置于 `React.Suspense` 边界之外实现的。`Suspense` 用于包裹懒加载的页面组件，当页面切换时，只有 `Suspense` 内部的组件会被替换，外部的组件（如 `Navbar` 和 `MobileTabBar`）保持挂载状态。

```tsx
// App.tsx -> Router()
return (
  <>
    {/* PC端导航栏，Suspense 外部 */}
    {!isMobile && <Navbar />}
    {/* 手机端底部Tab栏，Suspense 外部 */}
    {isMobile && <MobileTabBar />}

    <Suspense fallback={<PageFallback />}>
      {/* 页面路由，懒加载 */}
      <Switch>
        {/* ... routes ... */}
      </Switch>
    </Suspense>
  </>
);
```

### 3.2. 跨页面数据缓存

**需求**: 用户在不同页面间导航时，已经获取过的数据（如视频列表）无需重新请求。

**解决方案**: `lib/pageStore.ts` 实现了一个简单的内存缓存。当页面组件（如 `Video.tsx`）获取数据后，会将结果存入 `pageStore`。下次再进入该页面时，会先检查 `pageStore` 中是否存在缓存数据，如果存在则直接使用，避免了不必要的 API 请求。

### 3.3. 统一的视觉主题

**需求**: 网站整体采用紫色系主题，PC 端和手机端配色保持一致。

**解决方案**:
- **PC 端**: 主要颜色定义在 `index.css` 的 CSS 变量中（例如 `--yl-blue: #7c5cbf`）。
- **手机端**: 由于手机端组件（如 `MobileLayout.tsx`）大量使用内联样式（`style={{...}}`），因此直接在组件内部硬编码了与 PC 端匹配的紫色系 RGB 值。

## 4. 历史问题与解决方案

本文档记录了在开发过程中遇到的关键问题及其解决方法，为后续维护提供参考。

| 问题描述 | 根因分析 | 解决方案 |
|---|---|---|
| **应用崩溃，显示 "An unexpected error occurred"** | 在 `App.tsx` 中使用了 `<Navbar />` 组件，但**忘记 `import`**。导致渲染时 `Navbar` 为 `undefined` 而崩溃。 | 在 `App.tsx` 顶部添加 `import Navbar from "./components/Navbar";`。 |
| **新 Logo 替换后页面加载变慢** | 用户提供的 `logo.png` 文件体积过大 (416KB)，而原 `logo.webp` 仅 3.7KB，导致下载时间显著增加。 | 在服务器上使用 `Pillow` 库将 PNG 转换为高质量的 WebP 格式 (压缩至 37KB)，体积减少 90% 以上，恢复加载速度。 |
| **手机端配色与 PC 端不一致** | 手机端组件 (`MobileLayout` 等) 中硬编码了**蓝色系**颜色，而 PC 端 `index.css` 中定义的是**紫色系**。 | 批量修改所有手机端组件的内联样式，将蓝色系 RGB 值替换为与 PC 端 CSS 变量匹配的紫色系 RGB 值，实现视觉统一。 |
| **手机端底部 Tab 栏在页面切换时重载** | `MobileTabBar` 最初在 `MobileLayout` 组件内部，而 `MobileLayout` 在每个页面都会重新渲染，导致 Tab 栏无法常驻。 | 将 Tab 栏逻辑提取到独立的 `MobileTabBar.tsx` 组件中，并在 `App.tsx` 的 `Suspense` 外部渲染，使其独立于页面切换，实现常驻。 |

---
*文档由 Manus AI 自动生成*
