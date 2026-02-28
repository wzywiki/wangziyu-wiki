/**
 * MobileActivity — 手机端动态页
 * 时间轴列表（单列，简洁卡片风格）
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { API, apiFetch } from "@/lib/api";
import MobileLayout from "@/components/MobileLayout";

interface RelatedTime { tag: string; time: string; }
interface Activity {
  id: string;
  name: string;
  note: string;
  time: string;
  type: string;
  pics: string[];
  pics_url: string[];
  url: string[];
  link: string[];
  music: string[];
  related_time: RelatedTime[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isFuture(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

const TYPE_COLOR: Record<string, string> = {
  "个人专场": "#e8a87c",
  "个人直播": "#7ec8e3",
  "普通现场": "#a8d8a8",
  "颁奖典礼": "#c9b1e8",
  "综艺节目": "#f5c6a0",
  "其他": "#b8c8d8",
};

export default function MobileActivity() {
  const [futureActivities, setFutureActivities] = useState<Activity[]>([]);
  const [pastActivities, setPastActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"future" | "past">("future");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<Activity[]>(API.activityFuture()).catch(() => []),
      apiFetch<Activity[]>(API.activityPast()).catch(() => []),
    ]).then(([future, past]) => {
      setFutureActivities(future);
      setPastActivities(past);
      setLoading(false);
    });
  }, []);

  const displayList = tab === "future" ? futureActivities : pastActivities;

  return (
    <MobileLayout title="王梓钰动态">
      {/* Tab 切换 */}
      <div style={{
        display: "flex", gap: 8, padding: "10px 12px 8px",
        background: "rgba(255,255,255,0.9)",
        borderBottom: "1px solid rgba(160,200,230,0.3)",
      }}>
        <button
          onClick={() => setTab("future")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 20, fontSize: "0.82rem",
            fontWeight: tab === "future" ? 700 : 400, border: "none",
            background: tab === "future" ? "rgba(58,111,168,0.15)" : "rgba(240,248,255,0.8)",
            color: tab === "future" ? "rgb(30,70,140)" : "rgb(100,140,180)",
            cursor: "pointer",
          }}
        >
          即将到来
          {futureActivities.length > 0 && (
            <span style={{
              marginLeft: 5, fontSize: "0.65rem", background: "rgba(124,92,191,0.2)",
              color: "rgb(30,70,140)", padding: "0 5px", borderRadius: 8,
            }}>{futureActivities.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab("past")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 20, fontSize: "0.82rem",
            fontWeight: tab === "past" ? 700 : 400, border: "none",
            background: tab === "past" ? "rgba(58,111,168,0.15)" : "rgba(240,248,255,0.8)",
            color: tab === "past" ? "rgb(30,70,140)" : "rgb(100,140,180)",
            cursor: "pointer",
          }}
        >
          历史动态
        </button>
      </div>

      {/* 动态列表 */}
      <div style={{ padding: "10px 12px" }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.8)", borderRadius: 10, padding: "12px",
              marginBottom: 8, height: 80,
            }} />
          ))
        ) : displayList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgb(140,170,200)", fontSize: "0.85rem" }}>
            {tab === "future" ? "暂无即将到来的动态" : "暂无历史动态"}
          </div>
        ) : (
          displayList.map((a, i) => (
            <Link key={a.id} href={`/activityDetail?id=${a.id}`}>
              <div style={{
                background: "rgba(255,255,255,0.88)", borderRadius: 10, padding: "12px 14px",
                marginBottom: 8, boxShadow: "0 1px 6px rgba(80,140,200,0.1)", cursor: "pointer",
                borderLeft: `3px solid ${TYPE_COLOR[a.type] || "#b8c8d8"}`,
              }}>
                {/* 封面图（如有） */}
                {a.pics_url && a.pics_url.length > 0 && (
                  <img src={a.pics_url[0]} alt={a.name}
                    style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8, display: "block" }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgb(58,42,90)", marginBottom: 4, lineHeight: 1.3 }}>
                      {a.name}
                    </div>
                    {a.note && (
                      <div style={{ fontSize: "0.72rem", color: "rgb(100,130,170)", marginBottom: 4 }}>
                        {a.note}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "0.65rem", padding: "1px 7px", borderRadius: 10,
                        background: `${TYPE_COLOR[a.type] || "#b8c8d8"}33`,
                        color: "rgb(50,80,130)",
                        border: `1px solid ${TYPE_COLOR[a.type] || "#b8c8d8"}66`,
                      }}>{a.type}</span>
                      <span style={{ fontSize: "0.7rem", color: "rgb(120,150,185)" }}>
                        {formatDate(a.time)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
