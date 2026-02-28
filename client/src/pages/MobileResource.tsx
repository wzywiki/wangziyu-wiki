/**
 * MobileResource — 手机端资源页
 * 顶部 Tab 切换（图库 / 音乐 / 视频）+ 筛选条 + 内容列表
 * 参考 yinlin.wiki 手机端资源页设计
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { API, apiFetch, PicSet, Music, Video, formatDate, formatDuration } from "@/lib/api";
import MobileLayout from "@/components/MobileLayout";

type TabType = "pic" | "music" | "video";

// ===== 图库 Tab =====
interface PicAttr { pic_type: string[]; year: string[]; month: string[]; tag: string[]; }

function PicTab() {
  const [attr, setAttr] = useState<PicAttr | null>(null);
  const [items, setItems] = useState<PicSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const finishedRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    apiFetch<PicAttr>(API.picAttr()).then(setAttr).catch(console.error);
  }, []);

  const loadData = useCallback(async (reset = false) => {
    if (loadingRef.current || finishedRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const currentPage = reset ? 1 : pageRef.current;
    try {
      const params: Record<string, string | number | string[]> = { page: currentPage, size: 20, q: search };
      if (typeFilter.length) params.pic_type = typeFilter;
      if (yearFilter.length) params.year = yearFilter;
      const data = await apiFetch<PicSet[]>(API.picFilter(params));
      if (reset) setItems(data);
      else setItems(prev => [...prev, ...data]);
      if (data.length < 20) { finishedRef.current = true; setFinished(true); }
      else pageRef.current = currentPage + 1;
    } catch (e) { console.error(e); }
    finally { loadingRef.current = false; setLoading(false); }
  }, [search, typeFilter, yearFilter]);

  useEffect(() => {
    pageRef.current = 1; finishedRef.current = false; setFinished(false); setItems([]);
    loadData(true);
  }, [search, typeFilter, yearFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !finishedRef.current && !loadingRef.current) loadData(false);
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadData]);

  const toggle = (v: string, cur: string[], set: (x: string[]) => void) =>
    set(cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);

  return (
    <div>
      {/* 筛选条 */}
      <div style={{ padding: "10px 12px 0", background: "rgba(255,255,255,0.9)" }}>
        {attr && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            <span style={{ fontSize: "0.7rem", color: "rgb(100,140,180)", whiteSpace: "nowrap", alignSelf: "center" }}>类型</span>
            {attr.pic_type.map(t => (
              <button key={t} onClick={() => toggle(t, typeFilter, setTypeFilter)}
                style={{
                  padding: "3px 10px", borderRadius: 14, fontSize: "0.7rem", whiteSpace: "nowrap",
                  border: typeFilter.includes(t) ? "1px solid rgb(124,92,191)" : "1px solid rgba(180,160,220,0.5)",
                  background: typeFilter.includes(t) ? "rgba(124,92,191,0.12)" : "rgba(255,255,255,0.8)",
                  color: typeFilter.includes(t) ? "rgb(30,70,140)" : "rgb(80,120,170)",
                  cursor: "pointer", flexShrink: 0,
                }}>
                {t}
              </button>
            ))}
          </div>
        )}
        {attr && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            <span style={{ fontSize: "0.7rem", color: "rgb(100,140,180)", whiteSpace: "nowrap", alignSelf: "center" }}>年份</span>
            {attr.year.map(y => (
              <button key={y} onClick={() => toggle(y, yearFilter, setYearFilter)}
                style={{
                  padding: "3px 10px", borderRadius: 14, fontSize: "0.7rem", whiteSpace: "nowrap",
                  border: yearFilter.includes(y) ? "1px solid rgb(124,92,191)" : "1px solid rgba(180,160,220,0.5)",
                  background: yearFilter.includes(y) ? "rgba(124,92,191,0.12)" : "rgba(255,255,255,0.8)",
                  color: yearFilter.includes(y) ? "rgb(30,70,140)" : "rgb(80,120,170)",
                  cursor: "pointer", flexShrink: 0,
                }}>
                {y}
              </button>
            ))}
          </div>
        )}
        {/* 搜索框 */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(140,170,200)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索图库名称/关键词等信息"
            style={{
              width: "100%", height: 36, paddingLeft: 30, paddingRight: 12,
              borderRadius: 8, border: "1px solid rgba(180,160,220,0.5)",
              background: "rgba(245,250,255,0.9)", fontSize: "0.78rem",
              color: "rgb(50,80,120)", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* 2列瀑布流 */}
      <div style={{ display: "flex", gap: 8, padding: "8px 10px" }}>
        {[0, 1].map(col => (
          <div key={col} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {items.filter((_, i) => i % 2 === col).map(p => (
              <Link key={p.id} href={`/picDetail?id=${p.id}`}>
                <div style={{
                  borderRadius: 10, overflow: "hidden", background: "white",
                  boxShadow: "0 1px 6px rgba(80,140,200,0.1)", cursor: "pointer",
                }}>
                  <img src={p.cover_url} alt={p.name}
                    style={{ width: "100%", display: "block", objectFit: "cover" }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div style={{ padding: "6px 8px 8px" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgb(58,42,90)", marginBottom: 3, lineHeight: 1.3 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "rgb(120,150,185)" }}>
                      {formatDate(p.publish_time)}
                    </div>
                    {p.pic_type && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{
                          fontSize: "0.62rem", padding: "1px 6px", borderRadius: 3,
                          background: "rgba(124,92,191,0.1)", color: "rgb(90,61,154)",
                          border: "1px solid rgba(124,92,191,0.2)",
                        }}>{p.pic_type}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div ref={loaderRef} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading && <span style={{ fontSize: "0.75rem", color: "rgb(140,170,200)" }}>加载中...</span>}
        {finished && items.length > 0 && <span style={{ fontSize: "0.72rem", color: "rgb(160,185,210)" }}>— 共 {items.length} 套图库 —</span>}
      </div>
    </div>
  );
}

// ===== 音乐 Tab =====
interface MusicAttr { album: string[]; solo: string[]; }

function MusicTab() {
  const [attr, setAttr] = useState<MusicAttr | null>(null);
  const [items, setItems] = useState<Music[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [search, setSearch] = useState("");
  const [albumFilter, setAlbumFilter] = useState<string[]>([]);
  const [soloFilter, setSoloFilter] = useState<string[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const finishedRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    apiFetch<MusicAttr>(API.musicAttr()).then(setAttr).catch(console.error);
  }, []);

  const loadData = useCallback(async (reset = false) => {
    if (loadingRef.current || finishedRef.current) return;
    loadingRef.current = true; setLoading(true);
    const currentPage = reset ? 1 : pageRef.current;
    try {
      const params: Record<string, string | number | string[]> = { page: currentPage, size: 50, q: search };
      if (albumFilter.length) params.album = albumFilter;
      if (soloFilter.length) params.solo = soloFilter;
      const data = await apiFetch<Music[]>(API.musicFilter(params));
      if (reset) setItems(data); else setItems(prev => [...prev, ...data]);
      if (data.length < 50) { finishedRef.current = true; setFinished(true); }
      else pageRef.current = currentPage + 1;
    } catch (e) { console.error(e); }
    finally { loadingRef.current = false; setLoading(false); }
  }, [search, albumFilter, soloFilter]);

  useEffect(() => {
    pageRef.current = 1; finishedRef.current = false; setFinished(false); setItems([]);
    loadData(true);
  }, [search, albumFilter, soloFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !finishedRef.current && !loadingRef.current) loadData(false);
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadData]);

  const toggle = (v: string, cur: string[], set: (x: string[]) => void) =>
    set(cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);

  return (
    <div>
      {/* 筛选条 */}
      <div style={{ padding: "10px 12px 0", background: "rgba(255,255,255,0.9)" }}>
        {attr && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            <span style={{ fontSize: "0.7rem", color: "rgb(100,140,180)", whiteSpace: "nowrap", alignSelf: "center" }}>专辑</span>
            {attr.album.map(a => (
              <button key={a} onClick={() => toggle(a, albumFilter, setAlbumFilter)}
                style={{
                  padding: "3px 10px", borderRadius: 14, fontSize: "0.7rem", whiteSpace: "nowrap",
                  border: albumFilter.includes(a) ? "1px solid rgb(124,92,191)" : "1px solid rgba(180,160,220,0.5)",
                  background: albumFilter.includes(a) ? "rgba(124,92,191,0.12)" : "rgba(255,255,255,0.8)",
                  color: albumFilter.includes(a) ? "rgb(30,70,140)" : "rgb(80,120,170)",
                  cursor: "pointer", flexShrink: 0,
                }}>
                {a}
              </button>
            ))}
          </div>
        )}
        {attr && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            <span style={{ fontSize: "0.7rem", color: "rgb(100,140,180)", whiteSpace: "nowrap", alignSelf: "center" }}>类型</span>
            {attr.solo.map(s => (
              <button key={s} onClick={() => toggle(s, soloFilter, setSoloFilter)}
                style={{
                  padding: "3px 10px", borderRadius: 14, fontSize: "0.7rem", whiteSpace: "nowrap",
                  border: soloFilter.includes(s) ? "1px solid rgb(124,92,191)" : "1px solid rgba(180,160,220,0.5)",
                  background: soloFilter.includes(s) ? "rgba(124,92,191,0.12)" : "rgba(255,255,255,0.8)",
                  color: soloFilter.includes(s) ? "rgb(30,70,140)" : "rgb(80,120,170)",
                  cursor: "pointer", flexShrink: 0,
                }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(140,170,200)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索歌曲名称"
            style={{
              width: "100%", height: 36, paddingLeft: 30, paddingRight: 12,
              borderRadius: 8, border: "1px solid rgba(180,160,220,0.5)",
              background: "rgba(245,250,255,0.9)", fontSize: "0.78rem",
              color: "rgb(50,80,120)", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* 音乐列表 */}
      <div style={{ padding: "0 10px" }}>
        {items.map((m, i) => (
          <Link key={m.id} href={`/musicDetail?id=${m.id}`}>
            <div style={{
              display: "flex", alignItems: "center", padding: "10px 12px",
              background: "rgba(255,255,255,0.85)", borderRadius: 8, marginBottom: 6,
              boxShadow: "0 1px 4px rgba(80,140,200,0.08)", cursor: "pointer",
            }}>
              <span style={{ fontSize: "0.72rem", color: "rgb(160,185,215)", width: 22, flexShrink: 0, textAlign: "center" }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgb(58,42,90)", marginBottom: 2 }}>
                  {m.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgb(120,150,185)" }}>
                  {m.album && <span style={{ marginRight: 8 }}>{m.album}</span>}
                  <span>{formatDate(m.publish_time)}</span>
                </div>
              </div>
              <span style={{
                fontSize: "0.65rem", padding: "2px 7px", borderRadius: 3,
                border: "1px solid rgba(80,140,200,0.3)",
                background: "rgba(80,140,220,0.08)", color: "rgb(90,61,154)",
                flexShrink: 0, marginLeft: 8,
              }}>
                {m.solo}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div ref={loaderRef} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading && <span style={{ fontSize: "0.75rem", color: "rgb(140,170,200)" }}>加载中...</span>}
        {finished && items.length > 0 && <span style={{ fontSize: "0.72rem", color: "rgb(160,185,210)" }}>— 共 {items.length} 首 —</span>}
      </div>
    </div>
  );
}

// ===== 视频 Tab =====
function VideoTab() {
  const [items, setItems] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const finishedRef = useRef(false);
  const loadingRef = useRef(false);

  const loadData = useCallback(async (reset = false) => {
    if (loadingRef.current || finishedRef.current) return;
    loadingRef.current = true; setLoading(true);
    const currentPage = reset ? 1 : pageRef.current;
    try {
      const data = await apiFetch<Video[]>(API.videoFilter({ page: currentPage, size: 20 }));
      if (reset) setItems(data); else setItems(prev => [...prev, ...data]);
      if (data.length < 20) { finishedRef.current = true; setFinished(true); }
      else pageRef.current = currentPage + 1;
    } catch (e) { console.error(e); }
    finally { loadingRef.current = false; setLoading(false); }
  }, []);

  useEffect(() => {
    pageRef.current = 1; finishedRef.current = false; setFinished(false); setItems([]);
    loadData(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !finishedRef.current && !loadingRef.current) loadData(false);
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadData]);

  return (
    <div style={{ padding: "8px 10px" }}>
      {items.map(v => (
        <Link key={v.id} href={`/videoDetail?id=${v.id}`}>
          <div style={{
            background: "rgba(255,255,255,0.9)", borderRadius: 10, marginBottom: 10,
            overflow: "hidden", boxShadow: "0 1px 6px rgba(80,140,200,0.1)", cursor: "pointer",
          }}>
            <div style={{ position: "relative" }}>
              <img src={v.cover_url} alt={v.name}
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                onError={e => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.background = "rgba(180,215,235,0.4)";
                  el.style.display = "none";
                }}
              />
              {v.duration && (
                <span style={{
                  position: "absolute", bottom: 6, right: 8,
                  background: "rgba(0,0,0,0.65)", color: "white",
                  fontSize: "0.68rem", padding: "1px 6px", borderRadius: 3,
                }}>
                  {formatDuration(v.duration)}
                </span>
              )}
              <span style={{
                position: "absolute", top: 6, left: 8,
                background: "rgba(58,111,168,0.85)", color: "white",
                fontSize: "0.65rem", padding: "1px 6px", borderRadius: 3,
              }}>
                {v.type}
              </span>
            </div>
            <div style={{ padding: "8px 10px 10px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgb(58,42,90)", marginBottom: 4, lineHeight: 1.4 }}>
                {v.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgb(120,150,185)" }}>
                {formatDate(v.publish_time)}
              </div>
            </div>
          </div>
        </Link>
      ))}
      <div ref={loaderRef} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading && <span style={{ fontSize: "0.75rem", color: "rgb(140,170,200)" }}>加载中...</span>}
        {finished && items.length > 0 && <span style={{ fontSize: "0.72rem", color: "rgb(160,185,210)" }}>— 共 {items.length} 个视频 —</span>}
      </div>
    </div>
  );
}

// ===== 主页面 =====
const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: "pic", label: "图库", icon: "🖼" },
  { key: "music", label: "音乐", icon: "🎵" },
  { key: "video", label: "视频", icon: "▶" },
];

export default function MobileResource() {
  const [location] = useLocation();
  const defaultTab: TabType = location.startsWith("/music") ? "music" : location.startsWith("/video") ? "video" : "pic";
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  return (
    <MobileLayout title="资源">
      {/* Tab 切换 */}
      <div style={{
        display: "flex", gap: 8, padding: "10px 12px 8px",
        background: "rgba(255,255,255,0.9)",
        borderBottom: "1px solid rgba(160,200,230,0.3)",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 20, fontSize: "0.82rem",
              fontWeight: activeTab === tab.key ? 700 : 400,
              border: "none",
              background: activeTab === tab.key ? "rgba(58,111,168,0.15)" : "rgba(240,248,255,0.8)",
              color: activeTab === tab.key ? "rgb(30,70,140)" : "rgb(100,140,180)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {activeTab === "pic" && <PicTab />}
      {activeTab === "music" && <MusicTab />}
      {activeTab === "video" && <VideoTab />}
    </MobileLayout>
  );
}
