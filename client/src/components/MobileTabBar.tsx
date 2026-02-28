/**
 * MobileTabBar — 手机端底部固定 Tab 导航栏
 * 提取到 App.tsx 顶层，在 Suspense 外部渲染，切换页面时不重新挂载
 */
import { Link, useLocation } from "wouter";

const TAB_ITEMS = [
  {
    label: "首页",
    path: "/",
    matchPaths: ["/"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "rgb(124,92,191)" : "rgb(138,112,176)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: "资源",
    path: "/resource",
    matchPaths: ["/resource", "/pic", "/music", "/video"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "rgb(124,92,191)" : "rgb(138,112,176)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: "博物馆",
    path: "/museum",
    matchPaths: ["/museum"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "rgb(124,92,191)" : "rgb(138,112,176)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22V9l9-7 9 7v13"/><path d="M9 22V12h6v10"/>
      </svg>
    ),
  },
  {
    label: "动态",
    path: "/activity",
    matchPaths: ["/activity"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "rgb(124,92,191)" : "rgb(138,112,176)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    label: "AI对话",
    path: "/chat",
    matchPaths: ["/chat"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "rgb(124,92,191)" : "rgb(138,112,176)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: "搜索",
    path: "/search",
    matchPaths: ["/search"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "rgb(124,92,191)" : "rgb(138,112,176)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
];

export default function MobileTabBar() {
  const [location] = useLocation();
  const isTabActive = (item: typeof TAB_ITEMS[0]) => {
    if (item.path === "/") return location === "/";
    return item.matchPaths.some(p => location.startsWith(p));
  };
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      height: 60,
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(180,160,220,0.4)",
      display: "flex",
      alignItems: "stretch",
    }}>
      {TAB_ITEMS.map((tab) => {
        const active = isTabActive(tab);
        return (
          <Link key={tab.path} href={tab.path} style={{ flex: 1, textDecoration: "none" }}>
            <div style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              cursor: "pointer",
            }}>
              {tab.icon(active)}
              <span style={{
                fontSize: "0.62rem",
                fontWeight: active ? 700 : 400,
                color: active ? "rgb(124,92,191)" : "rgb(138,112,176)",
                letterSpacing: "0.02em",
              }}>
                {tab.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
