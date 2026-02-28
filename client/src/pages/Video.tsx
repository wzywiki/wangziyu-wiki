/**
 * Video — 王梓钰视频页
 * 布局：左侧筛选面板 + 右侧视频网格
 * 加载逻辑：首屏3行立即显示，后续卡片按顺序逐个渐入
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { API, apiFetch, Video, formatDate, formatDuration } from "@/lib/api";
import { videoStore, VideoFilter } from "@/lib/pageStore";

interface VideoAttr {
  duration: string[];
  video_type: string[];
  year: string[];
  month: string[];
}

const DURATION_LABEL: Record<string, string> = {
  s: "短片 (<3min)",
  m: "中等 (3-10min)",
  l: "长片 (>10min)",
};

function FilterGroup({
  label,
  items,
  selected,
  onToggle,
  labelMap,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
  labelMap?: Record<string, string>;
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
              padding: "2px 7px",
              borderRadius: 3,
              fontSize: "0.7rem",
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
            {labelMap?.[item] || item}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 封面图组件：OSS 图片直接加载，B 站域名兜底走代理 */
function CoverImage({ src, alt }: { src: string | null; alt: string }) {
  const proxySrc = src && (src.includes('hdslb.com') || src.includes('bilibili.com'))
    ? `/api/imgproxy?url=${encodeURIComponent(src)}`
    : src;

  if (!proxySrc) {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          background: "rgba(180,210,230,0.4)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16/9",
        position: "relative",
        overflow: "hidden",
        background: "rgba(180,210,230,0.4)",
      }}
    >
      <img
        src={proxySrc}
        alt={alt}
        decoding="async"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

/** 单个视频卡片，支持渐入动画 */
function VideoCard({ v, visible }: { v: Video; visible: boolean }) {
  return (
    <Link href={`/videoDetail?id=${v.id}`}>
      <div
        style={{
          background: "rgba(255,255,255,0.78)",
          border: "1px solid rgba(160,200,225,0.45)",
          borderRadius: 8,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.2s ease, opacity 0.35s ease, transform 0.35s ease",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "0 4px 18px rgba(100,160,200,0.28)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "none";
          el.style.transform = "translateY(0)";
        }}
      >
        <div style={{ position: "relative" }}>
          <CoverImage src={v.cover_url} alt={v.name} />

          {v.duration && (
            <div
              style={{
                position: "absolute",
                bottom: 5,
                right: 5,
                background: "rgba(0,0,0,0.6)",
                color: "white",
                fontSize: "0.68rem",
                padding: "2px 6px",
                borderRadius: 3,
              }}
            >
              {formatDuration(v.duration)}
            </div>
          )}
          <div
            style={{
              position: "absolute",
              top: 5,
              left: 5,
              background: "rgba(60,120,200,0.8)",
              color: "white",
              fontSize: "0.68rem",
              padding: "2px 6px",
              borderRadius: 3,
            }}
          >
            {v.type}
          </div>
        </div>
        <div style={{ padding: "8px 10px 10px" }}>
          <div
            style={{
              fontSize: "0.8rem",
              color: "rgb(40,70,110)",
              lineHeight: 1.45,
              marginBottom: 4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontWeight: 500,
            }}
          >
            {v.name}
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "rgb(110,140,170)",
            }}
          >
            {formatDate(v.publish_time)}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function VideoPage() {
  // 从 pageStore 恢复状态
  const saved = videoStore.get<Video, VideoAttr>();

  const [attr, setAttr] = useState<VideoAttr | null>(saved.attr);
  const [items, setItems] = useState<Video[]>(saved.items);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(saved.finished);
  const [search, setSearch] = useState(saved.filter.search);
  const [typeFilter, setTypeFilter] = useState<string[]>(saved.filter.type);
  const [durFilter, setDurFilter] = useState<string[]>(saved.filter.duration);
  const [yearFilter, setYearFilter] = useState<string[]>(saved.filter.year);

  // 记录每张卡片是否已渐入显示
  const [visibleSet, setVisibleSet] = useState<Set<string>>(() => {
    // 从缓存恢复时，所有已有卡片直接显示（不重复动画）
    return new Set(saved.items.map((v) => v.id));
  });

  const loaderRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(saved.page);
  const finishedRef = useRef(saved.finished);
  const loadingRef = useRef(false);
  const isRestoredRef = useRef(videoStore.hasData());
  // 首屏列数（根据容器宽度动态计算）
  const colsRef = useRef(5);

  // 计算当前网格列数
  const calcCols = useCallback(() => {
    if (gridRef.current) {
      const w = gridRef.current.offsetWidth;
      const cols = Math.max(1, Math.floor(w / 200));
      colsRef.current = cols;
      return cols;
    }
    return 5;
  }, []);

  // 监听容器宽度变化，更新列数
  useEffect(() => {
    calcCols();
    const ro = new ResizeObserver(() => calcCols());
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [calcCols]);

  // 恢复滚动位置
  useEffect(() => {
    if (isRestoredRef.current && saved.scrollY > 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, saved.scrollY);
      });
    }
  }, []);

  // 离开页面时保存状态
  useEffect(() => {
    return () => {
      videoStore.set({
        items,
        attr,
        filter: { search, type: typeFilter, duration: durFilter, year: yearFilter } as VideoFilter,
        page: pageRef.current,
        finished: finishedRef.current,
        scrollY: window.scrollY,
      });
    };
  }, [items, attr, search, typeFilter, durFilter, yearFilter]);

  // 加载 attr（有缓存则跳过）
  useEffect(() => {
    if (!attr) {
      apiFetch<VideoAttr>(API.videoAttr()).then((data) => {
        setAttr(data);
        videoStore.set({ attr: data });
      }).catch(console.error);
    }
  }, []);

  /**
   * 将新卡片逐个渐入显示
   * @param ids 新卡片 id 列表
   * @param isFirstScreen 是否首屏（首屏立即全部显示，后续逐个渐入）
   */
  const revealCards = useCallback((ids: string[], isFirstScreen: boolean) => {
    if (isFirstScreen) {
      // 首屏：立即全部显示
      setVisibleSet((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    } else {
      // 后续：按顺序逐个渐入，每个间隔 60ms
      ids.forEach((id, idx) => {
        setTimeout(() => {
          setVisibleSet((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
        }, idx * 60);
      });
    }
  }, []);

  const loadData = useCallback(
    async (reset = false) => {
      if (loadingRef.current || finishedRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      const currentPage = reset ? 1 : pageRef.current;
      // 首屏加载数量 = 列数 × 3 行
      const isFirstLoad = reset || currentPage === 1;
      const firstScreenSize = colsRef.current * 3;
      const size = isFirstLoad ? firstScreenSize : colsRef.current * 2; // 后续每次加载2行
      try {
        const params: Record<string, string | number | string[]> = {
          page: currentPage,
          size,
          q: search,
        };
        if (typeFilter.length) params.type = typeFilter;
        if (durFilter.length) params.duration = durFilter;
        if (yearFilter.length) params.year = yearFilter;
        const data = await apiFetch<Video[]>(API.videoFilter(params));
        if (reset) {
          setItems(data);
          // 首屏：立即全部显示
          revealCards(data.map((v) => v.id), true);
        } else {
          setItems((prev) => [...prev, ...data]);
          // 后续：逐个渐入
          revealCards(data.map((v) => v.id), false);
        }
        if (data.length < size) {
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
    [search, typeFilter, durFilter, yearFilter, revealCards]
  );

  // 筛选变化时重新加载（首次进入且有缓存时跳过）
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
    setVisibleSet(new Set());
    loadData(true);
  }, [search, typeFilter, durFilter, yearFilter]);

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

  return (
    <div style={{ minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "62px 16px 40px",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        {/* 左侧筛选面板 */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            position: "sticky",
            top: 62,
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
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
            王梓钰视频
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
            }}
          />

          {attr && (
            <>
              <FilterGroup
                label="视频类型"
                items={attr.video_type}
                selected={typeFilter}
                onToggle={(v) => toggleFilter(v, typeFilter, setTypeFilter)}
              />
              <FilterGroup
                label="时长"
                items={attr.duration}
                selected={durFilter}
                onToggle={(v) => toggleFilter(v, durFilter, setDurFilter)}
                labelMap={DURATION_LABEL}
              />
              <FilterGroup
                label="发布年份"
                items={attr.year.slice(0, 8)}
                selected={yearFilter}
                onToggle={(v) => toggleFilter(v, yearFilter, setYearFilter)}
              />
            </>
          )}
        </div>

        {/* 右侧视频网格 */}
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
              暂无视频内容
            </div>
          ) : (
            <div
              ref={gridRef}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              {items.map((v) => (
                <VideoCard
                  key={v.id}
                  v={v}
                  visible={visibleSet.has(v.id)}
                />
              ))}
            </div>
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
                — 视频就到这里啦 —
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
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          Copyright 2025 © 王梓钰Wiki项目组 联系我们：contact@wangziyu.wiki
        </div>
      </footer>
    </div>
  );
}
