/**
 * MobileMuseum — 手机端博物馆页
 * 筛选条 + 藏品卡片列表
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { API, apiFetch, MuseumItem, formatDate } from "@/lib/api";
import MobileLayout from "@/components/MobileLayout";

interface MuseumAttr {
  type: string[];
  publish_method: string[];
}

export default function MobileMuseum() {
  const [attr, setAttr] = useState<MuseumAttr | null>(null);
  const [items, setItems] = useState<MuseumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const finishedRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    apiFetch<MuseumAttr>(API.museumAttr()).then(setAttr).catch(console.error);
  }, []);

  const loadData = useCallback(async (reset = false) => {
    if (loadingRef.current || finishedRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const currentPage = reset ? 1 : pageRef.current;
    try {
      const params: Record<string, string | number | string[]> = { page: currentPage, size: 20, q: search };
      if (typeFilter.length) params.type = typeFilter;
      if (methodFilter.length) params.publish_method = methodFilter;
      const data = await apiFetch<MuseumItem[]>(API.museumFilter(params));
      if (reset) setItems(data); else setItems(prev => [...prev, ...data]);
      if (data.length < 20) { finishedRef.current = true; setFinished(true); }
      else pageRef.current = currentPage + 1;
    } catch (e) { console.error(e); }
    finally { loadingRef.current = false; setLoading(false); }
  }, [search, typeFilter, methodFilter]);

  useEffect(() => {
    pageRef.current = 1; finishedRef.current = false; setFinished(false); setItems([]);
    loadData(true);
  }, [search, typeFilter, methodFilter]);

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
    <MobileLayout title="王梓钰博物馆">
      {/* 筛选条 */}
      <div style={{ padding: "10px 12px 0", background: "rgba(255,255,255,0.9)" }}>
        {attr && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            <span style={{ fontSize: "0.7rem", color: "rgb(100,140,180)", whiteSpace: "nowrap", alignSelf: "center" }}>类型</span>
            {attr.type.map(t => (
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
        {attr && attr.publish_method.length > 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            <span style={{ fontSize: "0.7rem", color: "rgb(100,140,180)", whiteSpace: "nowrap", alignSelf: "center" }}>发行</span>
            {attr.publish_method.map(m => (
              <button key={m} onClick={() => toggle(m, methodFilter, setMethodFilter)}
                style={{
                  padding: "3px 10px", borderRadius: 14, fontSize: "0.7rem", whiteSpace: "nowrap",
                  border: methodFilter.includes(m) ? "1px solid rgb(124,92,191)" : "1px solid rgba(180,160,220,0.5)",
                  background: methodFilter.includes(m) ? "rgba(124,92,191,0.12)" : "rgba(255,255,255,0.8)",
                  color: methodFilter.includes(m) ? "rgb(30,70,140)" : "rgb(80,120,170)",
                  cursor: "pointer", flexShrink: 0,
                }}>
                {m}
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
            placeholder="搜索藏品名称"
            style={{
              width: "100%", height: 36, paddingLeft: 30, paddingRight: 12,
              borderRadius: 8, border: "1px solid rgba(180,160,220,0.5)",
              background: "rgba(245,250,255,0.9)", fontSize: "0.78rem",
              color: "rgb(50,80,120)", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* 藏品列表 */}
      <div style={{ padding: "8px 10px" }}>
        {items.map(m => (
          <Link key={m.id} href={`/museumDetail?id=${m.id}`}>
            <div style={{
              display: "flex", gap: 10, padding: "10px",
              background: "rgba(255,255,255,0.88)", borderRadius: 10, marginBottom: 8,
              boxShadow: "0 1px 6px rgba(80,140,200,0.1)", cursor: "pointer",
            }}>
              {m.cover_url && (
                <img src={m.cover_url} alt={m.name}
                  style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgb(58,42,90)", marginBottom: 3, lineHeight: 1.3 }}>
                  {m.name}
                </div>
                {m.note && (
                  <div style={{ fontSize: "0.72rem", color: "rgb(100,130,170)", marginBottom: 4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.note}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.65rem", padding: "1px 6px", borderRadius: 3,
                    background: "rgba(140,190,220,0.25)", color: "rgb(60,100,150)",
                    border: "1px solid rgba(120,170,210,0.35)",
                  }}>{m.type}</span>
                  <span style={{ fontSize: "0.68rem", color: "rgb(130,155,185)" }}>
                    {formatDate(m.publish_date)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div ref={loaderRef} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading && <span style={{ fontSize: "0.75rem", color: "rgb(140,170,200)" }}>加载中...</span>}
        {finished && items.length > 0 && <span style={{ fontSize: "0.72rem", color: "rgb(160,185,210)" }}>— 藏品就到这里啦 —</span>}
      </div>
    </MobileLayout>
  );
}
