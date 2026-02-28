/**
 * Navbar — 王梓钰Wiki顶部导航栏
 * 参考 yinlin.wiki 布局：大正方形 Logo + 横排菜单 + 右侧搜索框
 */
import { Link, useLocation } from "wouter";
import { useState } from "react";
const NAV_ITEMS = [
  { label: "首页", path: "/" },
  { label: "动态", path: "/activity" },
  { label: "音乐", path: "/music" },
  { label: "视频", path: "/video" },
  { label: "图库", path: "/pic" },
  { label: "博物馆", path: "/museum" },
  { label: "AI对话", path: "/chat" },
];
export default function Navbar() {
  const [location, navigate] = useLocation();
  const [searchType, setSearchType] = useState<"pic" | "lyric">("pic");
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?type=${searchType}&q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  return (
    <nav className="yl-navbar">
      {/* Logo — 正方形大图标，参考 yinlin.wiki */}
      <Link href="/">
        <div className="yl-navbar-logo">
          <img
            src="/logo.png"
            alt="梓钰Wiki"
            style={{ height: 52, width: 52, objectFit: "contain", display: "block", borderRadius: 6 }}
          />
        </div>
      </Link>
      {/* Nav Items — 横排，手机端可左右滑动 */}
      <div className="yl-navbar-links">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/"
              ? location === "/"
              : location.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path}>
              <div className={"yl-navbar-item" + (isActive ? " active" : "")}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
      {/* Search */}
      <form onSubmit={handleSearch} className="yl-navbar-search">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as "pic" | "lyric")}
          className="yl-search-type-btn"
        >
          <option value="pic">AI搜图 ▾</option>
          <option value="lyric">歌词 ▾</option>
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchType === "pic" ? "海边" : "比心"}
          className="yl-search-input"
        />
        <button type="submit" className="yl-search-btn">
          搜索
        </button>
      </form>
    </nav>
  );
}
