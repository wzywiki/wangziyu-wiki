/**
 * Pic — 王梓钰图库页
 * 布局：左侧筛选面板 + 右侧瀑布流（小红书风格）
 * 图片宽度固定，高度按原始比例自适应，下方文案
 * 使用 JS 分列法确保绝对等宽瀑布流
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { API, apiFetch, PicSet, formatDate } from "@/lib/api";
import { picStore, PicFilter } from "@/lib/pageStore";

interface PicAttr {
  pic_type: string[];
  year: string[];
  month: string[];
  tag: string[];
}

function FilterGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: "0.72rem",
          color: "rgb(80,120,170)",
          marginBottom: 5,
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            style={{
              padding: "2px 8px",
              borderRadius: 3,
              fontSize: "0.72rem",
              cursor: "pointer",
              border: selected.includes(item)
                ? "1px solid rgba(80,150,200,0.6)"
                : "1px solid rgba(160,200,225,0.4)",
              background: selected.includes(item)
                ? "rgba(100,170,210,0.28)"
                : "rgba(255,255,255,0.5)",
              color: selected.includes(item)
                ? "rgb(30,70,130)"
                : "rgb(70,110,160)",
              fontWeight: selected.includes(item) ? 700 : 400,
              transition: "all 0.15s",
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function PicCard({ pic: p }: { pic: PicSet }) {
  return (
    <Link href={`/picDetail?id=${p.id}`} style={{ display: "block" }}>
      <div
        style={{
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(160,200,225,0.3)",
          borderRadius: 12,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 6px rgba(100,150,200,0.08)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "0 6px 20px rgba(80,130,180,0.22)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "0 1px 6px rgba(100,150,200,0.08)";
          el.style.transform = "translateY(0)";
        }}
      >
        {/* 图片区域：宽度100%，高度按原始比例自适应 */}
        <div style={{ width: "100%", overflow: "hidden", background: "rgba(210,228,242,0.3)" }}>
          <img
            src={p.cover_url}
            alt={p.name}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              transition: "transform 0.35s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
            }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
            }}
          />
        </div>
        {/* 卡片底部文案 */}
        <div style={{ padding: "8px 10px 10px" }}>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "rgb(30,55,95)",
              lineHeight: 1.4,
              marginBottom: 5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {p.name}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                padding: "1px 6px",
                borderRadius: 4,
                background: "rgba(130,185,220,0.18)",
                color: "rgb(50,95,150)",
                border: "1px solid rgba(110,165,210,0.28)",
                fontWeight: 500,
              }}
            >
              {p.type}
            </span>
            <span style={{ fontSize: "0.65rem", color: "rgb(140,165,190)" }}>
              {formatDate(p.date)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * 瀑布流容器：使用 JS 分列法
 * 将 items 按列索引分配到 cols 个列数组，每列独立渲染
 * 这样每列宽度完全由 flex 布局保证，绝对等宽
 */
function MasonryGrid({ items, cols }: { items: PicSet[]; cols: number }) {
  // 将 items 分配到 cols 列（按顺序轮流分配）
  const columns: PicSet[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => {
    columns[i % cols].push(item);
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        width: "100%",
      }}
    >
      {columns.map((col, colIdx) => (
        <div
          key={colIdx}
          style={{
            flex: "1 1 0",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {col.map((p) => (
            <PicCard key={p.id} pic={p} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function PicPage() {
  // 从 pageStore 恢复状态
  const saved = picStore.get<PicSet, PicAttr>();

  const [attr, setAttr] = useState<PicAttr | null>(saved.attr);
  const [items, setItems] = useState<PicSet[]>(saved.items);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(saved.finished);
  const [search, setSearch] = useState(saved.filter.search);
  const [typeFilter, setTypeFilter] = useState<string[]>(saved.filter.type);
  const [yearFilter, setYearFilter] = useState<string[]>(saved.filter.year);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(saved.page);
  const finishedRef = useRef(saved.finished);
  const loadingRef = useRef(false);
  const isRestoredRef = useRef(picStore.hasData());

  // 恢复滚动位置
  useEffect(() => {
    if (isRestoredRef.current && saved.scrollY > 0) {
      requestAnimationFrame(() => { window.scrollTo(0, saved.scrollY); });
    }
  }, []);

  // 离开页面时保存状态
  useEffect(() => {
    return () => {
      picStore.set({
        items, attr,
        filter: { search, type: typeFilter, year: yearFilter } as PicFilter,
        page: pageRef.current,
        finished: finishedRef.current,
        scrollY: window.scrollY,
      });
    };
  }, [items, attr, search, typeFilter, yearFilter]);

  useEffect(() => {
    if (!attr) {
      apiFetch<PicAttr>(API.picAttr()).then((data) => {
        setAttr(data);
        picStore.set({ attr: data });
      }).catch(console.error);
    }
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadData = useCallback(
    async (reset = false) => {
      if (loadingRef.current || finishedRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      const currentPage = reset ? 1 : pageRef.current;
      try {
        const params: Record<string, string | number | string[]> = {
          page: currentPage,
          size: 24,
          q: search,
        };
        if (typeFilter.length) params.type = typeFilter;
        if (yearFilter.length) params.year = yearFilter;
        if (tagFilter.length) params.tag = tagFilter;
        const data = await apiFetch<PicSet[]>(API.picFilter(params));
        if (reset) {
          setItems(data);
        } else {
          setItems((prev) => [...prev, ...data]);
        }
        if (data.length < 24) {
          finishedRef.current = true;
          setFinished(true);
        } else {
          pageRef.current = currentPage + 1;
        }
      } catch (e) {
        console.error(e);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [search, typeFilter, yearFilter, tagFilter]
  );

  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      if (isRestoredRef.current) return;
    }
    pageRef.current = 1;
    finishedRef.current = false;
    setFinished(false);
    setItems([]);
    loadData(true);
  }, [search, typeFilter, yearFilter, tagFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !finishedRef.current &&
          !loadingRef.current
        ) {
          loadData(false);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadData]);

  const toggleFilter = (
    value: string,
    current: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  const filterPanel = (
    <div
      style={{
        background: "rgba(255,255,255,0.88)",
        border: "1px solid rgba(160,200,225,0.5)",
        borderRadius: 10,
        boxShadow: "0 2px 12px rgba(100,160,200,0.12)",
        backdropFilter: "blur(8px)",
        padding: "14px 14px",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          color: "rgb(40,80,130)",
          marginBottom: 12,
          fontFamily: "'Noto Serif SC', serif",
          fontSize: "0.9rem",
          letterSpacing: "0.05em",
        }}
      >
        王梓钰图库
      </div>

      <input
        type="text"
        placeholder="关键词"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          height: 28,
          padding: "0 8px",
          borderRadius: 4,
          border: "1px solid rgba(140,190,220,0.55)",
          background: "rgba(255,255,255,0.85)",
          fontSize: "0.78rem",
          color: "rgb(50,80,110)",
          outline: "none",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      {attr && (
        <>
          <FilterGroup
            label="分类"
            items={attr.pic_type}
            selected={typeFilter}
            onToggle={(v) => toggleFilter(v, typeFilter, setTypeFilter)}
          />
          <FilterGroup
            label="发布年份"
            items={attr.year}
            selected={yearFilter}
            onToggle={(v) => toggleFilter(v, yearFilter, setYearFilter)}
          />
          {attr.tag && attr.tag.length > 0 && (
            <FilterGroup
              label="Tag"
              items={attr.tag}
              selected={tagFilter}
              onToggle={(v) => toggleFilter(v, tagFilter, setTagFilter)}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>

      {/* 移动端筛选按钮 */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 16,
            zIndex: 200,
          }}
        >
          <button
            onClick={() => setShowFilter(!showFilter)}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(58,111,168,0.92)",
              border: "none",
              color: "white",
              fontSize: "1.2rem",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(58,111,168,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ☰
          </button>
        </div>
      )}

      {/* 移动端筛选抽屉 */}
      {isMobile && showFilter && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(0,0,0,0.4)",
          }}
          onClick={() => setShowFilter(false)}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "80%",
              maxWidth: 280,
              background: "white",
              padding: "60px 16px 20px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {filterPanel}
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: isMobile ? "62px 10px 40px" : "62px 16px 40px",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        {/* 左侧筛选面板（桌面端）：固定宽度，不参与图片区域宽度计算 */}
        {!isMobile && (
          <div
            style={{
              width: 200,
              flexShrink: 0,
              position: "sticky",
              top: 62,
              maxHeight: "calc(100vh - 80px)",
              overflowY: "auto",
            }}
          >
            {filterPanel}
          </div>
        )}

        {/* 右侧瀑布流：flex:1 撑满剩余空间 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {items.length === 0 && !loading ? (
            <div
              style={{
                padding: "60px 30px",
                textAlign: "center",
                color: "rgb(130,160,190)",
                fontSize: "0.85rem",
                background: "rgba(255,255,255,0.7)",
                borderRadius: 10,
                border: "1px solid rgba(160,200,225,0.4)",
              }}
            >
              暂无图库内容
            </div>
          ) : (
            <MasonryGrid items={items} cols={isMobile ? 2 : 4} />
          )}

          <div
            ref={loaderRef}
            style={{
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            {loading && (
              <span style={{ color: "rgb(100,140,180)", fontSize: "0.82rem" }}>
                加载中...
              </span>
            )}
            {finished && items.length > 0 && (
              <span style={{ color: "rgb(130,160,190)", fontSize: "0.8rem" }}>
                — 美图就到这里啦 —
              </span>
            )}
          </div>
        </div>
      </div>

      <footer
        style={{
          background: "rgba(30,50,80,0.88)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(100,150,200,0.3)",
          padding: "20px 16px",
          textAlign: "center",
          color: "rgba(200,220,240,0.8)",
          fontSize: "0.78rem",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          Copyright 2025 © 王梓钰Wiki项目组 联系我们：contact@wangziyu.wiki
        </div>
      </footer>
    </div>
  );
}
