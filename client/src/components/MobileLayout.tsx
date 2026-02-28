/**
 * MobileLayout — 手机端 App 风格布局
 * 顶部标题栏 + 内容区
 * 底部 Tab 栏由 App.tsx 中的 MobileTabBar 组件渲染（Suspense 外部，常驻不重载）
 */
import { Link } from "wouter";

interface MobileLayoutProps {
  title?: string;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  noPadding?: boolean;
}

export default function MobileLayout({ title, children, showBack, onBack, noPadding }: MobileLayoutProps) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #e8dff5 0%, #f0ebff 100%)",
      display: "flex",
      flexDirection: "column",
      paddingBottom: 60,
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 50,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(180,160,220,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}>
        {showBack && (
          <button
            onClick={onBack || (() => window.history.back())}
            style={{
              position: "absolute",
              left: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              color: "rgb(124,92,191)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        {title ? (
          <div style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "1rem",
            fontWeight: 700,
            color: "rgb(58,42,90)",
            letterSpacing: "0.04em",
          }}>
            {title}
          </div>
        ) : (
          <Link href="/">
            <img src="/logo.webp" alt="梓钰Wiki" style={{ height: 36, objectFit: "contain" }} />
          </Link>
        )}
      </div>
      {/* 内容区 */}
      <div style={{ flex: 1, paddingTop: 50, overflowX: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
