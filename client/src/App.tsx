import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import MobileTabBar from "./components/MobileTabBar";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useIsMobile } from "./hooks/useIsMobile";
import { API, apiFetch } from "./lib/api";
// 懒加载所有页面组件 — 用户访问哪个页面才下载对应代码
const Home = lazy(() => import("./pages/Home"));
const MobileHome = lazy(() => import("./pages/MobileHome"));
const ActivityPage = lazy(() => import("./pages/Activity"));
const ActivityDetail = lazy(() => import("./pages/ActivityDetail"));
const MusicPage = lazy(() => import("./pages/Music"));
const MusicDetail = lazy(() => import("./pages/MusicDetail"));
const VideoPage = lazy(() => import("./pages/Video"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const PicPage = lazy(() => import("./pages/Pic"));
const PicDetail = lazy(() => import("./pages/PicDetail"));
const MuseumPage = lazy(() => import("./pages/Museum"));
const MuseumDetail = lazy(() => import("./pages/MuseumDetail"));
const SearchPage = lazy(() => import("./pages/Search"));
const MobileResource = lazy(() => import("./pages/MobileResource"));
const MobileMuseum = lazy(() => import("./pages/MobileMuseum"));
const MobileActivity = lazy(() => import("./pages/MobileActivity"));
const MobileSearch = lazy(() => import("./pages/MobileSearch"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ChatPage = lazy(() => import("./pages/Chat"));

// OSS 背景图 URL
const BG_URL = "https://wzywiki1.oss-cn-guangzhou.aliyuncs.com/assets/bg_purple.jpg";
const GRADIENT = "linear-gradient(160deg, rgb(225,210,245) 0%, rgb(235,220,250) 40%, rgb(245,235,255) 100%)";

// 设置 body 背景：先显示紫色渐变，OSS 图加载完后平滑覆盖
// 直接操作 body，确保所有页面始终有背景
function useBgImage() {
  useEffect(() => {
    // 立即设置纯色渐变背景（本地渲染，0ms）
    document.body.style.background = GRADIENT;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundPosition = "center";

    // 异步加载 OSS 背景图，加载完后平滑覆盖
    const img = new Image();
    img.onload = () => {
      document.body.style.backgroundImage = `url('${BG_URL}')`;
    };
    img.src = BG_URL;
  }, []);
}

// 页面切换时的骨架占位（极简，仅保持背景不闪白）
function PageFallback() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "transparent",
    }} />
  );
}

/**
 * 后台预加载所有主要页面的数据。
 * 在首页加载完成后 1.5 秒开始，利用空闲时间依次预热缓存，
 * 用户点击菜单时数据已就绪，无需等待。
 */
function useBackgroundPreload() {
  useEffect(() => {
    // 延迟 1.5 秒，确保首页自身的请求已完成，不抢占带宽
    const timer = setTimeout(() => {
      const tasks = [
        // 音乐列表页
        () => apiFetch(API.musicAttr()),
        () => apiFetch(API.musicFilter({ page: 1, size: 50, q: "" })),
        // 视频列表页
        () => apiFetch(API.videoAttr()),
        () => apiFetch(API.videoFilter({ page: 1, size: 50, q: "" })),
        // 图库列表页
        () => apiFetch(API.picAttr()),
        () => apiFetch(API.picFilter({ page: 1, size: 50, q: "" })),
        // 博物馆列表页
        () => apiFetch(API.museumAttr()),
        () => apiFetch(API.museumFilter({ page: 1, size: 50, q: "" })),
        // 动态页
        () => apiFetch(`${API.BASE}/activity/filter?time_type=future&page=1&size=100`),
        () => apiFetch(`${API.BASE}/activity/filter?time_type=past&page=1&size=200`),
        () => apiFetch(`${API.BASE}/activity/history`),
      ];
      // 每隔 300ms 发一个请求，避免同时并发太多
      tasks.forEach((task, i) => {
        setTimeout(() => {
          task().catch(() => {/* 预加载失败静默忽略 */});
        }, i * 300);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
}

function Router() {
  const isMobile = useIsMobile();
  // 设置背景图（先纯色渐变，再平滑过渡到 OSS 图片）
  useBgImage();
  // 启动后台预加载
  useBackgroundPreload();
  return (
    <>
      {!isMobile && <Navbar />}
      {isMobile && <MobileTabBar />}
      <Suspense fallback={<PageFallback />}>
      <Switch>
        {/* 首页 */}
        <Route path="/" component={isMobile ? MobileHome : Home} />
        {/* 资源页：手机端专属 */}
        <Route path="/resource" component={isMobile ? MobileResource : Home} />
        {/* 图库、音乐、视频 */}
        <Route path="/pic" component={isMobile ? MobileResource : PicPage} />
        <Route path="/music" component={isMobile ? MobileResource : MusicPage} />
        <Route path="/video" component={isMobile ? MobileResource : VideoPage} />
        {/* 博物馆 */}
        <Route path="/museum" component={isMobile ? MobileMuseum : MuseumPage} />
        {/* 动态 */}
        <Route path="/activity" component={isMobile ? MobileActivity : ActivityPage} />
        {/* 搜索 */}
        <Route path="/search" component={isMobile ? MobileSearch : SearchPage} />
        {/* 详情页 */}
        <Route path="/picDetail" component={PicDetail} />
        <Route path="/musicDetail" component={MusicDetail} />
        <Route path="/videoDetail" component={VideoDetail} />
        <Route path="/activityDetail" component={ActivityDetail} />
        <Route path="/museumDetail" component={MuseumDetail} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
