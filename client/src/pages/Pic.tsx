/**
 * Pic — 王梓钰图库页
 * 布局：左侧筛选面板 + 右侧瀑布流（小红书风格）
 * 使用 CSS columns 实现响应式瀑布流，无需 JS 计算列宽
 * 响应式：桌面4列 → 中等3列 → 小屏2列 → 移动端2列
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
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: "0.78rem",
          color: "rgb(104,96,123)",
          marginBottom: 8,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: "0.82rem",
              cursor: "pointer",
              border: "none",
              background: selected.includes(item)
                ? "rgb(104,96,123)"
                : "rgba(104,96,123,0.1)",
              color: selected.includes(item)
                ? "#fff"
                : "rgb(104,96,123)",
              fontWeight: selected.includes(item) ? 700 : 400,
              transition: "all 0.18s",
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
          cursor: "pointer",
          // 防止卡片被分列截断
          breakInside: "avoid",
          pageBreakInside: "avoid",
          WebkitColumnBreakInside: "avoid",
          marginBottom: 20,
        }}
      >
        {/* 图片：大圆角，宽度100%自适应，参考yinlin.wiki的 border-radius:1rem */}
        <img
          src={p.cover_url}
          alt={p.name}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "1rem",
            objectFit: "contain",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.88";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "1";
          }}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
          }}
        />
        {/* 卡片底部文案：参考yinlin.wiki padding:0.5rem 1rem，颜色rgb(104,96,123) */}
        <div style={{ padding: "0.5rem 0.5rem 0" }}>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "rgb(104,96,123)",
              lineHeight: 1.4,
              marginBottom: 2,
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
              fontSize: "0.8rem",
              color: "rgb(104,96,123)",
            }}
          >
            <span>{p.type}</span>
            <span>{formatDate(p.date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * 瀑布流容器：使用 CSS columns 多列布局
 * 优点：纯CSS实现，无需JS计算，列宽绝对均等，响应式自动适配
 * 通过 column-count 控制列数，column-gap 控制间距
 */
function MasonryGrid({ items, cols }: { items: PicSet[]; cols: number }) {
  return (
    <div
      style={{
        columnCount: cols,
        columnGap: 20,
        width: "100%",
      }}
    >
      {items.map((p) => (
        <PicCard key={p.id} pic={p} />
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
  const [cols, setCols] = useState(4);
  const loaderRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(saved.page);
  const finishedRef = useRef(saved.finished);
  const loadingRef = useRef(false);
  const isRestoredRef = useRef(picStore.hasData());

  // 根据容器宽度动态计算列数：每列350px+20px间距=370px，与yinlin.wiki一致
  // 100%缩放下约2列，缩小时容器变宽列数自动增加
  const calcCols = useCallback(() => {
    if (gridRef.current) {
      const w = gridRef.current.offsetWidth;
      const c = Math.max(2, Math.floor(w / 310));
      setCols(c);
    }
  }, []);

  useEffect(() => {
    calcCols();
    const ro = new ResizeObserver(() => calcCols());
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [calcCols]);

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
        background: "rgba(255,255,255,0.92)",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(104,96,123,0.10)",
        backdropFilter: "blur(12px)",
        padding: "22px 20px",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          color: "rgb(104,96,123)",
          marginBottom: 18,
          fontFamily: "'Noto Serif SC', serif",
          fontSize: "1.1rem",
          letterSpacing: "0.08em",
        }}
      >
        王梓钰图库
      </div>

      <input
        type="text"
        placeholder="搜索关键词..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          height: 36,
          padding: "0 12px",
          borderRadius: 20,
          border: "1.5px solid rgba(104,96,123,0.2)",
          background: "rgba(104,96,123,0.05)",
          fontSize: "0.85rem",
          color: "rgb(104,96,123)",
          outline: "none",
          marginBottom: 20,
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
              width: 260,
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
        <div ref={gridRef} style={{ flex: 1, minWidth: 0 }}>
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
            <MasonryGrid items={items} cols={cols} />
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
