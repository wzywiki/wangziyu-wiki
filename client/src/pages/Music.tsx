/**
 * Music — 王梓钰音乐页
 * 布局：左侧筛选面板 + 右侧表格（对标 yinlin.wiki/music）
 * 手机端：同样保持左侧面板 + 右侧横向可滚动表格
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { API, apiFetch, Music, formatDate } from "@/lib/api";
import { musicStore, MusicFilter } from "@/lib/pageStore";

interface MusicAttr {
  album: string[];
  solo: string[];
  platform: string[];
  language: string[];
  music_type: string[];
}

// ---- 筛选按钮组 ----
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
      <div className="yl-filter-label">{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={"yl-tag" + (selected.includes(item) ? " active" : "")}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- 平台链接 ----
function PlatformLinks({ platform }: { platform: Music["platform"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    netease: { label: "网易云", cls: "yl-platform-netease" },
    qq_music: { label: "QQ音乐", cls: "yl-platform-qq" },
    bilibili: { label: "B站", cls: "yl-platform-bili" },
    sing: { label: "唱鸭", cls: "yl-platform-bili" },
  };
  const links = Object.entries(platform)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ ...map[k], url: v as string }));
  if (!links.length)
    return <span style={{ color: "rgb(180,200,220)", fontSize: "0.72rem" }}>—</span>;
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {links.map(({ label, cls, url }) => (
        <a key={label} href={url} target="_blank" rel="noopener noreferrer" className={cls}>
          {label}
        </a>
      ))}
    </span>
  );
}

// ---- 演唱类型标签 ----
function SoloTag({ solo }: { solo: string }) {
  const isMain = solo === "SOLO";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 3,
        fontSize: "0.7rem",
        fontWeight: 600,
        background: isMain ? "rgba(80,140,220,0.15)" : "rgba(140,180,100,0.15)",
        color: isMain ? "rgb(40,90,180)" : "rgb(60,130,60)",
        border: isMain ? "1px solid rgba(80,140,220,0.3)" : "1px solid rgba(140,180,100,0.3)",
      }}
    >
      {solo}
    </span>
  );
}

// ---- 音乐行 ----
function MusicRow({ music: m }: { music: Music }) {
  return (
    <tr>
      <td style={{ padding: "9px 12px", minWidth: 120 }}>
        <Link href={`/musicDetail?id=${m.id}`}>
          <span
            style={{
              color: "rgb(30,70,150)",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 500,
            }}
          >
            {m.name}
          </span>
        </Link>
      </td>
      <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontSize: "0.76rem", color: "rgb(100,130,170)", minWidth: 90 }}>
        {formatDate(m.publish_time)}
      </td>
      <td style={{ padding: "9px 12px", fontSize: "0.76rem", color: "rgb(80,115,165)", minWidth: 80 }}>
        {m.album || <span style={{ color: "rgb(190,210,225)" }}>—</span>}
      </td>
      <td style={{ padding: "9px 12px", minWidth: 70 }}>
        <SoloTag solo={m.solo} />
      </td>
      <td style={{ padding: "9px 12px", minWidth: 100 }}>
        <PlatformLinks platform={m.platform} />
      </td>
      <td style={{ padding: "9px 12px", minWidth: 70 }}>
        {m.pv_mv ? (
          <a
            href={m.pv_mv}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgb(50,100,180)",
              textDecoration: "none",
              fontSize: "0.74rem",
              background: "rgba(80,140,220,0.1)",
              border: "1px solid rgba(80,140,220,0.3)",
              borderRadius: 3,
              padding: "2px 7px",
              whiteSpace: "nowrap",
            }}
          >
            观看MV
          </a>
        ) : (
          <span style={{ color: "rgb(190,210,225)", fontSize: "0.72rem" }}>—</span>
        )}
      </td>
      <td style={{ padding: "9px 12px" }}>
        <Link href={`/musicDetail?id=${m.id}`}>
          <span style={{ color: "rgb(50,110,190)", fontSize: "0.76rem", cursor: "pointer", fontWeight: 500 }}>
            查看
          </span>
        </Link>
      </td>
    </tr>
  );
}

export default function MusicPage() {
  // 从 pageStore 恢复状态（首次进入时为默认值）
  const saved = musicStore.get<Music, MusicAttr>();

  const [attr, setAttr] = useState<MusicAttr | null>(saved.attr);
  const [items, setItems] = useState<Music[]>(saved.items);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(saved.finished);
  const [search, setSearch] = useState(saved.filter.search);
  const [albumFilter, setAlbumFilter] = useState<string[]>(saved.filter.album);
  const [soloFilter, setSoloFilter] = useState<string[]>(saved.filter.solo);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(saved.page);
  const finishedRef = useRef(saved.finished);
  const loadingRef = useRef(false);
  const isRestoredRef = useRef(musicStore.hasData()); // 是否是从缓存恢复的

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
      musicStore.set({
        items,
        attr,
        filter: { search, album: albumFilter, solo: soloFilter } as MusicFilter,
        page: pageRef.current,
        finished: finishedRef.current,
        scrollY: window.scrollY,
      });
    };
  }, [items, attr, search, albumFilter, soloFilter]);

  // 加载 attr（有缓存则跳过）
  useEffect(() => {
    if (!attr) {
      apiFetch<MusicAttr>(API.musicAttr()).then((data) => {
        setAttr(data);
        musicStore.set({ attr: data });
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
          size: 50,
          q: search,
        };
        if (albumFilter.length) params.album = albumFilter;
        if (soloFilter.length) params.solo = soloFilter;
        const data = await apiFetch<Music[]>(API.musicFilter(params));
        if (reset) {
          setItems(data);
        } else {
          setItems((prev) => [...prev, ...data]);
        }
        if (data.length < 50) {
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
    [search, albumFilter, soloFilter]
  );

  // 筛选变化时重新加载（首次进入且有缓存数据时跳过）
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      if (isRestoredRef.current) return; // 有缓存，跳过初始加载
    }
    pageRef.current = 1;
    finishedRef.current = false;
    setFinished(false);
    setItems([]);
    loadData(true);
  }, [search, albumFilter, soloFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !finishedRef.current && !loadingRef.current) {
          loadData(false);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadData]);

  const toggle = (v: string, cur: string[], set: (x: string[]) => void) =>
    set(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);

  return (
    <div style={{ minHeight: "100vh" }}>

      <div className="yl-music-layout">
        {/* 左侧筛选面板 */}
        <div className="yl-music-sidebar">
          <div className="yl-sidebar">
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
              王梓钰音乐
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
                fontSize: "0.76rem",
                color: "rgb(50,80,110)",
                outline: "none",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            {attr && (
              <>
                <FilterGroup
                  label="专辑"
                  items={attr.album}
                  selected={albumFilter}
                  onToggle={(v) => toggle(v, albumFilter, setAlbumFilter)}
                />
                <FilterGroup
                  label="演唱类型"
                  items={attr.solo}
                  selected={soloFilter}
                  onToggle={(v) => toggle(v, soloFilter, setSoloFilter)}
                />
              </>
            )}
          </div>
        </div>

        {/* 右侧表格区域（可横向滚动） */}
        <div className="yl-music-content">
          <div className="yl-panel" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table className="yl-table" style={{ minWidth: 580 }}>
                <thead>
                  <tr>
                    {["歌曲名", "发布时间", "所属专辑", "演唱类型", "音乐平台", "PV/MV", "详情"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <MusicRow key={m.id} music={m} />
                  ))}
                </tbody>
              </table>
              {items.length === 0 && !loading && (
                <div className="yl-empty">暂无音乐内容</div>
              )}
            </div>
          </div>

          {/* 加载触发器 */}
          <div
            ref={loaderRef}
            style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}
          >
            {loading && <span className="yl-loading" style={{ padding: 0 }}>加载中...</span>}
            {finished && items.length > 0 && (
              <span className="yl-end">— 共 {items.length} 首歌曲 —</span>
            )}
          </div>
        </div>
      </div>

      <footer className="yl-footer">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          Copyright 2025 © 王梓钰Wiki项目组 联系我们：contact@wangziyu.wiki
        </div>
      </footer>
    </div>
  );
}
