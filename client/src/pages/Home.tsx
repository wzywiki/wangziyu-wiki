/**
 * Home.tsx — 王梓钰Wiki 主页
 * 深度参考 yinlin.wiki 设计：
 *   顶部：近期动态横幅轮播（大图+信息）
 *   中部：图库横向卡片滚动
 *   下部：音乐列表 + 视频网格 并排
 *   底部：博物馆横向卡片 + 历史上的今天
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { API, apiFetch } from "../lib/api";

// ============================================================
// 类型定义
// ============================================================
interface Activity {
  id: string;
  name: string;
  time: string;
  type: string;
  note?: string;
  cover_url?: string;
}
interface PicSet {
  id: string;
  name: string;
  date: string;
  type: string;
  cover_url?: string;
  pics_url?: string[];
  note?: string;
}
interface Music {
  id: string;
  name: string;
  music_type: string;
  language: string;
  solo: string;
  publish_time: string;
  album?: string;
  cover_url?: string;
}
interface Video {
  id: string;
  name: string;
  publish_time: string;
  type: string;
  duration: number;
  cover_url?: string;
  sources?: { platform: string; bvid?: string }[];
}
interface MuseumItem {
  id: string;
  name: string;
  publish_date: string;
  type: string;
  cover_url?: string;
  note?: string;
}
interface HistoryToday {
  music: { id: string; name: string; publish_time: string }[];
  video: { id: string; name: string; publish_time: string }[];
  pic: { id: string; name: string; date: string }[];
  activity: { id: string; name: string; time: string }[];
}

// ============================================================
// 工具函数
// ============================================================
function formatDate(dt: string) {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatDateCN(dt: string) {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ============================================================
// 子组件：Section 标题栏（对齐 yinlin.wiki 风格）
// ============================================================
function SectionHeader({ title, href, icon }: { title: string; href: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingBottom: 10,
      borderBottom: "1.5px solid rgba(180,160,220,0.3)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "'Noto Serif SC', serif",
        fontSize: "1.05rem",
        fontWeight: 700,
        color: "var(--yl-text)",
        letterSpacing: "0.04em",
      }}>
        {icon}
        {title}
      </div>
      <Link href={href}>
        <span style={{
          fontSize: "0.8rem",
          color: "var(--yl-blue)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 2,
          opacity: 0.85,
        }}>
          更多 ›
        </span>
      </Link>
    </div>
  );
}

// ============================================================
// 子组件：近期动态横幅轮播
// ============================================================
function ActivityBanner({ activities }: { activities: Activity[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activities.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % activities.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activities.length]);

  if (activities.length === 0) {
    return (
      <div style={{
        width: "100%",
        aspectRatio: "21/7",
        background: "rgba(200,185,230,0.25)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--yl-muted)",
        fontSize: "0.9rem",
      }}>
        暂无近期动态
      </div>
    );
  }

  const cur = activities[idx];
  const imgUrl = cur.cover_url || "";

  return (
    <Link href={`/activityDetail?id=${cur.id}`}>
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "21/7",
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        background: "rgba(180,160,220,0.2)",
        boxShadow: "0 4px 24px rgba(120,80,200,0.15)",
      }}>
        {/* 背景图 */}
        {imgUrl && (
          <img
            src={imgUrl}
            alt={cur.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "opacity 0.6s",
            }}
          />
        )}
        {/* 渐变遮罩 */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(30,15,60,0.75) 0%, rgba(30,15,60,0.4) 50%, transparent 100%)",
        }} />
        {/* 文字信息 */}
        <div style={{
          position: "absolute",
          left: 32,
          top: "50%",
          transform: "translateY(-50%)",
          color: "white",
          maxWidth: "55%",
        }}>
          <div style={{
            fontSize: "0.75rem",
            opacity: 0.85,
            marginBottom: 6,
            background: "rgba(255,255,255,0.15)",
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 20,
            backdropFilter: "blur(4px)",
          }}>
            {cur.type}
          </div>
          <div style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "1.4rem",
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: 8,
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}>
            {cur.name}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.9, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {cur.time && <span>📅 {formatDateCN(cur.time)}</span>}
            {cur.note && <span>📍 {cur.note}</span>}
          </div>
        </div>
        {/* 指示点 */}
        {activities.length > 1 && (
          <div style={{
            position: "absolute",
            bottom: 12,
            right: 16,
            display: "flex",
            gap: 6,
          }}>
            {activities.map((_, i) => (
              <div
                key={i}
                onClick={e => { e.preventDefault(); setIdx(i); }}
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === idx ? "white" : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================================
// 子组件：图库横向滚动卡片
// ============================================================
function PicRow({ pics }: { pics: PicSet[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 10,
    }}>
      {pics.map(p => (
        <Link key={p.id} href={`/picDetail?id=${p.id}`}>
          <div style={{
            borderRadius: 8,
            overflow: "hidden",
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(180,160,220,0.25)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 2px 8px rgba(120,80,200,0.08)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(120,80,200,0.18)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(120,80,200,0.08)";
          }}
          >
            <div style={{ width: "100%", aspectRatio: "3/4", background: "rgba(200,185,230,0.2)", overflow: "hidden" }}>
              {p.cover_url ? (
                <img src={p.cover_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", opacity: 0.3 }}>🖼</div>
              )}
            </div>
            <div style={{ padding: "7px 8px 8px" }}>
              <div style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--yl-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 3,
              }}>
                {p.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--yl-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>{formatDate(p.date)}</span>
                <span style={{
                  background: "rgba(120,80,200,0.1)",
                  color: "var(--yl-blue)",
                  borderRadius: 4,
                  padding: "0 5px",
                  fontSize: "0.65rem",
                }}>
                  {p.type}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============================================================
// 子组件：音乐列表
// ============================================================
function MusicList({ music }: { music: Music[] }) {
  return (
    <div>
      {music.map((m, i) => (
        <Link key={m.id} href={`/musicDetail?id=${m.id}`}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 8px",
            borderRadius: 6,
            cursor: "pointer",
            transition: "background 0.15s",
            borderBottom: i < music.length - 1 ? "1px solid rgba(180,160,220,0.15)" : "none",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(120,80,200,0.06)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            {/* 序号 */}
            <div style={{
              width: 20,
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--yl-muted)",
              flexShrink: 0,
              fontVariantNumeric: "tabular-nums",
            }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            {/* 封面 */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              overflow: "hidden",
              background: "rgba(200,185,230,0.3)",
              flexShrink: 0,
            }}>
              {m.cover_url ? (
                <img src={m.cover_url} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", opacity: 0.4 }}>♪</div>
              )}
            </div>
            {/* 名称 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--yl-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {m.name}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--yl-muted)", marginTop: 2 }}>
                {formatDate(m.publish_time)}
              </div>
            </div>
            {/* 标签 */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <span style={{
                fontSize: "0.65rem",
                background: "rgba(120,80,200,0.1)",
                color: "var(--yl-blue)",
                borderRadius: 10,
                padding: "1px 7px",
                whiteSpace: "nowrap",
              }}>
                {m.solo}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============================================================
// 子组件：视频网格
// ============================================================
function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 10,
    }}>
      {videos.map(v => (
        <Link key={v.id} href={`/videoDetail?id=${v.id}`}>
          <div style={{
            borderRadius: 8,
            overflow: "hidden",
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(180,160,220,0.25)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 2px 8px rgba(120,80,200,0.08)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(120,80,200,0.18)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(120,80,200,0.08)";
          }}
          >
            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "rgba(200,185,230,0.2)", overflow: "hidden" }}>
              {v.cover_url ? (
                <img src={v.cover_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", opacity: 0.3 }}>▶</div>
              )}
              {/* 时长标签 */}
              <div style={{
                position: "absolute",
                bottom: 5,
                right: 6,
                background: "rgba(0,0,0,0.65)",
                color: "white",
                fontSize: "0.68rem",
                padding: "1px 5px",
                borderRadius: 3,
              }}>
                {formatDuration(v.duration)}
              </div>
              {/* 类型标签 */}
              <div style={{
                position: "absolute",
                top: 5,
                left: 6,
                background: "rgba(120,80,200,0.8)",
                color: "white",
                fontSize: "0.62rem",
                padding: "1px 6px",
                borderRadius: 3,
              }}>
                {v.type}
              </div>
            </div>
            <div style={{ padding: "7px 8px 9px" }}>
              <div style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--yl-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.4,
                marginBottom: 4,
                minHeight: "2.2em",
              }}>
                {v.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--yl-muted)" }}>
                {formatDate(v.publish_time)}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============================================================
// 子组件：博物馆横向卡片
// ============================================================
function MuseumRow({ items }: { items: MuseumItem[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12,
    }}>
      {items.map(item => (
        <Link key={item.id} href={`/museumDetail?id=${item.id}`}>
          <div style={{
            borderRadius: 8,
            overflow: "hidden",
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(180,160,220,0.25)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 2px 8px rgba(120,80,200,0.08)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(120,80,200,0.18)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(120,80,200,0.08)";
          }}
          >
            <div style={{ width: "100%", aspectRatio: "1/1", background: "rgba(200,185,230,0.2)", overflow: "hidden" }}>
              {item.cover_url ? (
                <img src={item.cover_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", opacity: 0.3 }}>🏛</div>
              )}
            </div>
            <div style={{ padding: "8px 10px 10px" }}>
              <div style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--yl-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 4,
              }}>
                {item.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--yl-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>{formatDate(item.publish_date)}</span>
                <span style={{
                  background: "rgba(120,80,200,0.1)",
                  color: "var(--yl-blue)",
                  borderRadius: 4,
                  padding: "0 5px",
                  fontSize: "0.65rem",
                }}>
                  {item.type}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============================================================
// 子组件：历史上的今天
// ============================================================
function HistoryTodayPanel({ data }: { data: HistoryToday | null }) {
  const today = new Date();
  const mmdd = `${today.getMonth() + 1}月${today.getDate()}日`;
  const allItems = data
    ? [
        ...data.music.map(m => ({ ...m, kind: "音乐", href: `/musicDetail?id=${m.id}`, date: m.publish_time })),
        ...data.video.map(v => ({ ...v, kind: "视频", href: `/videoDetail?id=${v.id}`, date: v.publish_time })),
        ...data.pic.map(p => ({ ...p, kind: "图库", href: `/picDetail?id=${p.id}`, date: p.date })),
        ...data.activity.map(a => ({ ...a, kind: "动态", href: `/activityDetail?id=${a.id}`, date: a.time })),
      ]
    : [];

  return (
    <div style={{
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(8px)",
      borderRadius: 12,
      border: "1px solid rgba(180,160,220,0.3)",
      padding: "16px 18px",
      boxShadow: "0 2px 12px rgba(120,80,200,0.08)",
    }}>
      <div style={{
        fontFamily: "'Noto Serif SC', serif",
        fontSize: "0.95rem",
        fontWeight: 700,
        color: "var(--yl-text)",
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span>📅</span>
        历史上的今天 · {mmdd}
      </div>
      {allItems.length === 0 ? (
        <div style={{ fontSize: "0.82rem", color: "var(--yl-muted)", padding: "8px 0" }}>
          今天也是无事发生的一天（
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {allItems.map((item, i) => (
            <Link key={i} href={item.href}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 6px",
                borderRadius: 6,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(120,80,200,0.06)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <span style={{
                  fontSize: "0.65rem",
                  background: "rgba(120,80,200,0.12)",
                  color: "var(--yl-blue)",
                  borderRadius: 4,
                  padding: "1px 6px",
                  flexShrink: 0,
                }}>
                  {item.kind}
                </span>
                <span style={{
                  fontSize: "0.82rem",
                  color: "var(--yl-text)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {item.name}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--yl-muted)", flexShrink: 0 }}>
                  {new Date(item.date).getFullYear()}年
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 骨架屏
// ============================================================
function BannerSkeleton() {
  return (
    <div style={{
      width: "100%",
      aspectRatio: "21/7",
      borderRadius: 12,
      background: "rgba(200,185,230,0.2)",
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}
function GridSkeleton({ cols, ratio }: { cols: number; ratio: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ borderRadius: 8, overflow: "hidden", background: "rgba(200,185,230,0.2)" }}>
          <div style={{ width: "100%", aspectRatio: ratio, background: "rgba(200,185,230,0.3)" }} />
          <div style={{ padding: "8px 10px" }}>
            <div style={{ height: 12, background: "rgba(200,185,230,0.4)", borderRadius: 3, marginBottom: 5 }} />
            <div style={{ height: 10, width: "60%", background: "rgba(200,185,230,0.3)", borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function MusicSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderBottom: "1px solid rgba(180,160,220,0.12)" }}>
          <div style={{ width: 20, height: 12, background: "rgba(200,185,230,0.3)", borderRadius: 2 }} />
          <div style={{ width: 36, height: 36, borderRadius: 4, background: "rgba(200,185,230,0.3)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 13, background: "rgba(200,185,230,0.4)", borderRadius: 3, marginBottom: 5 }} />
            <div style={{ height: 10, width: "50%", background: "rgba(200,185,230,0.3)", borderRadius: 3 }} />
          </div>
          <div style={{ width: 40, height: 18, background: "rgba(200,185,230,0.3)", borderRadius: 10 }} />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function Home() {
  const [futureActivities, setFutureActivities] = useState<Activity[]>([]);
  const [pastActivities, setPastActivities] = useState<Activity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [latestPics, setLatestPics] = useState<PicSet[]>([]);
  const [loadingPic, setLoadingPic] = useState(true);

  const [latestMusic, setLatestMusic] = useState<Music[]>([]);
  const [loadingMusic, setLoadingMusic] = useState(true);

  const [latestVideos, setLatestVideos] = useState<Video[]>([]);
  const [loadingVideo, setLoadingVideo] = useState(true);

  const [museumItems, setMuseumItems] = useState<MuseumItem[]>([]);
  const [loadingMuseum, setLoadingMuseum] = useState(true);

  const [historyToday, setHistoryToday] = useState<HistoryToday | null>(null);

  useEffect(() => {
    // 动态
    Promise.all([
      apiFetch<Activity[]>(API.activityFuture()).catch(() => []),
      apiFetch<Activity[]>(API.activityPast()).catch(() => []),
    ]).then(([future, past]) => {
      const combined = [...future.slice(0, 4), ...past.slice(0, 4)];
      setFutureActivities(future.slice(0, 4));
      setPastActivities(past.slice(0, 4));
      setLoadingActivity(false);
    });

    // 图库
    apiFetch<PicSet[]>(API.picLatest()).catch(() => []).then(pics => {
      setLatestPics(pics.slice(0, 6));
      setLoadingPic(false);
    });

    // 音乐
    apiFetch<Music[]>(API.musicLatest()).catch(() => []).then(music => {
      setLatestMusic(music.slice(0, 8));
      setLoadingMusic(false);
    });

    // 视频
    apiFetch<Video[]>(API.videoLatest()).catch(() => []).then(videos => {
      setLatestVideos(videos.slice(0, 6));
      setLoadingVideo(false);
    });

    // 博物馆
    apiFetch<MuseumItem[]>(API.museumLatest()).catch(() => []).then(items => {
      setMuseumItems(Array.isArray(items) ? items.slice(0, 4) : []);
      setLoadingMuseum(false);
    });

    // 历史上的今天
    apiFetch<HistoryToday>(API.activityHistory()).catch(() => null).then(data => {
      setHistoryToday(data);
    });
  }, []);

  const bannerActivities = [...futureActivities, ...pastActivities].slice(0, 6);

  return (
    <div style={{ minHeight: "100vh", paddingTop: 64 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px 24px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 36,
      }}>

        {/* ── 1. 图库 ── */}
        <section>
          <SectionHeader title="图库" href="/pic" icon={<span style={{ fontSize: "1rem" }}>🖼</span>} />
          {loadingPic ? <GridSkeleton cols={6} ratio="3/4" /> : <PicRow pics={latestPics} />}
        </section>

        {/* ── 2. 近期动态横幅 ── */}
        <section>
          <SectionHeader title="近期动态" href="/activity" icon={<span style={{ fontSize: "1rem" }}>📅</span>} />
          {loadingActivity ? <BannerSkeleton /> : <ActivityBanner activities={bannerActivities} />}
        </section>

        {/* ── 3. 音乐 + 视频 并排 ── */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 28 }}>
            {/* 音乐 */}
            <div>
              <SectionHeader title="音乐" href="/music" icon={<span style={{ fontSize: "1rem" }}>🎵</span>} />
              <div style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(8px)",
                borderRadius: 10,
                border: "1px solid rgba(180,160,220,0.25)",
                padding: "4px 6px",
                boxShadow: "0 2px 10px rgba(120,80,200,0.07)",
              }}>
                {loadingMusic ? <MusicSkeleton /> : <MusicList music={latestMusic} />}
              </div>
            </div>
            {/* 视频 */}
            <div>
              <SectionHeader title="视频" href="/video" icon={<span style={{ fontSize: "1rem" }}>🎬</span>} />
              {loadingVideo ? <GridSkeleton cols={3} ratio="16/9" /> : <VideoGrid videos={latestVideos} />}
            </div>
          </div>
        </section>

        {/* ── 4. 博物馆 + 历史上的今天 并排 ── */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 28, alignItems: "start" }}>
            <div>
              <SectionHeader title="博物馆" href="/museum" icon={<span style={{ fontSize: "1rem" }}>🏛</span>} />
              {loadingMuseum ? <GridSkeleton cols={4} ratio="1/1" /> : <MuseumRow items={museumItems} />}
            </div>
            <div style={{ width: 260, paddingTop: 40 }}>
              <HistoryTodayPanel data={historyToday} />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
