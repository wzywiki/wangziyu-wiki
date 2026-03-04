/**
 * Museum — 王梓钰博物馆页
 * 布局：左侧筛选面板（年份/活动主题）+ 右侧藏品网格
 * 数据来源：安安周边.xlsx 提取的67张图片，按活动分组
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { API, apiFetch, MuseumItem, formatDate } from "@/lib/api";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileLayout from "@/components/MobileLayout";
import { museumStore, MuseumFilter } from "@/lib/pageStore";

interface MuseumAttr {
  year: string[];
  activity: string[];
  type: string[];
  publish_method: string[];
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

export default function MuseumPage() {
  const isMobile = useIsMobile();
  // 从 pageStore 恢复状态
  const saved = museumStore.get<MuseumItem, MuseumAttr>();

  const [attr, setAttr] = useState<MuseumAttr | null>(saved.attr);
  const [items, setItems] = useState<MuseumItem[]>(saved.items);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(saved.finished);
  const [search, setSearch] = useState(saved.filter.search);
  const [yearFilter, setYearFilter] = useState<string[]>(saved.filter.year);
  const [activityFilter, setActivityFilter] = useState<string[]>(saved.filter.activity ?? []);
  const loaderRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(saved.page);
  const finishedRef = useRef(saved.finished);
  const loadingRef = useRef(false);
  const isRestoredRef = useRef(museumStore.hasData());
  // 初始列数：用 window.innerWidth 提前估算（减去左侧面板220px + gap14px），避免初始渲染闪变2列
  const estimateCols = () => Math.max(2, Math.floor((window.innerWidth - 234 - 32) / 310));
  const [cols, setCols] = useState(estimateCols);
  const colsRef = useRef(estimateCols());

  // 计算列数：每列350px+20px间距=370px，与yinlin.wiki一致
  const calcCols = useCallback(() => {
    if (gridRef.current) {
      const w = gridRef.current.offsetWidth;
      const c = Math.max(2, Math.floor(w / 310));
      colsRef.current = c;
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
      museumStore.set({
        items, attr,
        filter: { search, type: [], year: yearFilter, activity: activityFilter } as unknown as MuseumFilter,
        page: pageRef.current,
        finished: finishedRef.current,
        scrollY: window.scrollY,
      });
    };
  }, [items, attr, search, yearFilter, activityFilter]);

  useEffect(() => {
    if (!attr) {
      apiFetch<MuseumAttr>(API.museumAttr()).then((data) => {
        setAttr(data);
        museumStore.set({ attr: data });
      }).catch(console.error);
    }
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
          size: 20,
          q: search,
        };
        if (yearFilter.length) params.year = yearFilter;
        if (activityFilter.length) params.activity = activityFilter;
        const data = await apiFetch<MuseumItem[]>(API.museumFilter(params));
        if (reset) {
          setItems(data);
        } else {
          setItems((prev) => [...prev, ...data]);
        }
        if (data.length < 20) {
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
    [search, yearFilter, activityFilter]
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
  }, [search, yearFilter, activityFilter]);

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

  const content = (
    <div style={{ minHeight: "100vh" }}>
      
      <div
        style={{
          margin: "0 auto",
          padding: isMobile ? "12px 10px 80px" : "62px 16px 40px",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        {/* 左侧筛选面板 */}
        <div
          style={{
            width: isMobile ? 90 : 220,
            flexShrink: 0,
            position: "sticky",
            top: isMobile ? 8 : 62,
            maxHeight: isMobile ? "calc(100vh - 120px)" : "calc(100vh - 80px)",
            overflowY: "auto",
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(160,200,225,0.5)",
            borderRadius: 10,
            boxShadow: "0 2px 12px rgba(100,160,200,0.12)",
            backdropFilter: "blur(8px)",
            padding: isMobile ? "10px 8px" : "14px 14px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "rgb(40,80,130)",
              marginBottom: 10,
              fontFamily: "'Noto Serif SC', serif",
              fontSize: isMobile ? "0.78rem" : "0.9rem",
              letterSpacing: "0.05em",
            }}
          >
            王梓钰博物馆
          </div>
          {!isMobile && (
            <input
              type="text"
              placeholder="搜索活动名称"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 28,
                padding: "0 8px",
                borderRadius: 4,
                border: "1px solid rgba(140,190,220,0.55)",
                background: "rgba(255,255,255,0.85)",
                fontSize: "0.75rem",
                color: "rgb(50,80,110)",
                outline: "none",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
          )}
          {attr && (
            <>
              <FilterGroup
                label="年份"
                items={attr.year}
                selected={yearFilter}
                onToggle={(v) => toggleFilter(v, yearFilter, setYearFilter)}
              />
              {!isMobile && (
                <FilterGroup
                  label="活动主题"
                  items={attr.activity}
                  selected={activityFilter}
                  onToggle={(v) => toggleFilter(v, activityFilter, setActivityFilter)}
                />
              )}
            </>
          )}
        </div>

        {/* 右侧藏品网格 */}
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
              暂无藏品
            </div>
          ) : (
            <div
              ref={gridRef}
              style={{
                columnCount: isMobile ? 2 : cols,
                columnGap: 20,
                width: "100%",
              }}
            >
              {items.map((m) => (
                <Link key={m.id} href={`/museumDetail?id=${m.id}`}>
                  <div
                    style={{
                      breakInside: "avoid",
                      marginBottom: 20,
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.opacity = "0.85";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.opacity = "1";
                    }}
                  >
                    {/* 封面图：原始比例，大圆角，参考yinlin.wiki */}
                    <div
                      style={{
                        width: "100%",
                        borderRadius: "1rem",
                        overflow: "hidden",
                      }}
                    >
                      {m.cover_url ? (
                        <img
                          src={m.cover_url}
                          alt={m.name}
                          style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "1rem",
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "4/3",
                            borderRadius: "1rem",
                            background: "rgba(180,215,235,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "rgba(100,150,200,0.5)",
                            fontSize: "2rem",
                          }}
                        >
                          🎁
                        </div>
                      )}
                    </div>
                    {/* 卡片信息：参考yinlin.wiki极简风格 */}
                    <div style={{ padding: "6px 4px 0" }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "rgb(104,96,123)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: 2,
                        }}
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "rgb(104,96,123)" }}>
                        {m.year}年 · {m.item_types?.[0] ?? ""}
                      </div>
                    </div>
                  </div>
                </Link>
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
                — 藏品就到这里啦 —
              </span>
            )}
          </div>
        </div>
      </div>
      {!isMobile && (
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
      )}
    </div>
  );

  if (isMobile) {
    return <MobileLayout title="博物馆">{content}</MobileLayout>;
  }
  return content;
}
