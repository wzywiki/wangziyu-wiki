/**
 * MobileHome — 手机端首页（渐进式加载版）
 * 每个模块独立请求，数据到达立即渲染，轮播图优先加载
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { API, apiFetch, Activity, Music, Video, PicSet, formatDate, formatDuration } from "@/lib/api";
import MobileLayout from "@/components/MobileLayout";

export default function MobileHome() {
  const [latestPics, setLatestPics] = useState<PicSet[]>([]);
  const [loadingPic, setLoadingPic] = useState(true);

  const [latestMusic, setLatestMusic] = useState<Music[]>([]);
  const [loadingMusic, setLoadingMusic] = useState(true);

  const [latestVideos, setLatestVideos] = useState<Video[]>([]);
  const [loadingVideo, setLoadingVideo] = useState(true);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [picIdx, setPicIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // 各模块独立请求，互不等待
  useEffect(() => {
    // 图库（首屏轮播，最优先）
    apiFetch<PicSet[]>(API.picLatest()).catch(() => []).then(pics => {
      setLatestPics(pics.slice(0, 8));
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

    // 动态（在页面底部，最后加载）
    apiFetch<Activity[]>(API.activityPast()).catch(() => []).then(past => {
      setActivities(past.slice(0, 8));
      setLoadingActivity(false);
    });
  }, []);

  // 图库轮播自动切换
  useEffect(() => {
    if (latestPics.length === 0) return;
    const timer = setInterval(() => setPicIdx(i => (i + 1) % Math.min(latestPics.length, 5)), 3000);
    return () => clearInterval(timer);
  }, [latestPics.length]);

  return (
    <MobileLayout>
      {/* 图库轮播 — 骨架屏占位，数据到立即替换 */}
      {loadingPic ? (
        <div style={{ width: "100%", aspectRatio: "16/9", background: "rgba(200,225,240,0.5)" }} />
      ) : latestPics.length > 0 && (
        <div
          style={{ position: "relative", overflow: "hidden" }}
          onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={e => {
            if (touchStartX === null) return;
            const diff = touchStartX - e.changedTouches[0].clientX;
            const total = Math.min(latestPics.length, 5);
            if (diff > 40) setPicIdx(i => (i + 1) % total);
            else if (diff < -40) setPicIdx(i => (i - 1 + total) % total);
            setTouchStartX(null);
          }}
        >
          <Link href={`/picDetail?id=${latestPics[picIdx]?.id}`}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
              <img
                src={latestPics[picIdx]?.cover_url}
                alt={latestPics[picIdx]?.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                padding: "20px 14px 12px",
              }}>
                <div style={{ color: "white", fontSize: "0.9rem", fontWeight: 700, marginBottom: 2 }}>
                  {latestPics[picIdx]?.name}
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.7rem" }}>
                  {formatDate(latestPics[picIdx]?.date)} &nbsp;·&nbsp; {latestPics[picIdx]?.type}
                </div>
              </div>
            </div>
          </Link>
          {/* 轮播指示点 */}
          <div style={{ position: "absolute", bottom: 8, right: 12, display: "flex", gap: 4 }}>
            {latestPics.slice(0, 5).map((_, i) => (
              <div key={i} onClick={() => setPicIdx(i)} style={{
                width: i === picIdx ? 16 : 5, height: 5, borderRadius: 3,
                background: i === picIdx ? "white" : "rgba(255,255,255,0.5)",
                cursor: "pointer", transition: "all 0.3s",
              }} />
            ))}
          </div>
        </div>
      )}

      {/* 图库卡片区 */}
      <div style={{ margin: "12px 10px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgb(58,42,90)", display: "flex", alignItems: "center", gap: 5 }}>
            <span>🖼</span> 最新图库
          </div>
          <Link href="/pic" style={{ fontSize: "0.72rem", color: "rgb(124,92,191)", textDecoration: "none" }}>查看全部 &gt;</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {loadingPic
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 8, aspectRatio: "3/4", background: "rgba(200,225,240,0.4)" }} />
              ))
            : latestPics.slice(0, 6).map(p => (
                <Link key={p.id} href={`/picDetail?id=${p.id}`}>
                  <div style={{ borderRadius: 8, overflow: "hidden", cursor: "pointer" }}>
                    <img src={p.cover_url} alt={p.name}
                      style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <div style={{ padding: "4px 5px 5px", background: "rgba(255,255,255,0.9)" }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgb(58,42,90)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "rgb(140,165,195)" }}>{formatDate(p.date)}</div>
                    </div>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>

      {/* 音乐列表 */}
      <div style={{ margin: "14px 10px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgb(58,42,90)", display: "flex", alignItems: "center", gap: 5 }}>
            <span>🎵</span> 最新音乐
          </div>
          <Link href="/music" style={{ fontSize: "0.72rem", color: "rgb(124,92,191)", textDecoration: "none" }}>查看全部 &gt;</Link>
        </div>
        <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(80,140,200,0.1)" }}>
          {loadingMusic
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(180,160,220,0.2)", display: "flex", gap: 8 }}>
                  <div style={{ width: 20, height: 14, background: "rgba(200,225,240,0.5)", borderRadius: 2 }} />
                  <div style={{ flex: 1, height: 14, background: "rgba(200,225,240,0.5)", borderRadius: 2 }} />
                </div>
              ))
            : latestMusic.map((m, i) => (
                <Link key={m.id} href={`/musicDetail?id=${m.id}`}>
                  <div style={{
                    display: "flex", alignItems: "center", padding: "10px 12px",
                    borderBottom: i < latestMusic.length - 1 ? "1px solid rgba(180,160,220,0.2)" : "none",
                    cursor: "pointer",
                  }}>
                    <span style={{ fontSize: "0.72rem", color: "rgb(160,185,215)", width: 20, flexShrink: 0, textAlign: "center" }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgb(58,42,90)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "rgb(120,150,185)" }}>
                        {m.album || "—"} &nbsp;·&nbsp; {formatDate(m.publish_time)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: "0.62rem", padding: "1px 6px", borderRadius: 3, flexShrink: 0, marginLeft: 8,
                      border: "1px solid rgba(80,140,200,0.3)", background: "rgba(80,140,220,0.08)", color: "rgb(90,61,154)",
                    }}>
                      {m.solo}
                    </span>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>

      {/* 视频列表 */}
      <div style={{ margin: "14px 10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgb(58,42,90)", display: "flex", alignItems: "center", gap: 5 }}>
            <span>▶</span> 最新视频
          </div>
          <Link href="/video" style={{ fontSize: "0.72rem", color: "rgb(124,92,191)", textDecoration: "none" }}>查看全部 &gt;</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {loadingVideo
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 8, overflow: "hidden", background: "rgba(200,225,240,0.4)" }}>
                  <div style={{ aspectRatio: "16/9", background: "rgba(180,215,235,0.4)" }} />
                  <div style={{ padding: "6px 8px 8px" }}>
                    <div style={{ height: 12, background: "rgba(200,225,240,0.5)", borderRadius: 2, marginBottom: 4 }} />
                    <div style={{ height: 10, width: "60%", background: "rgba(200,225,240,0.4)", borderRadius: 2 }} />
                  </div>
                </div>
              ))
            : latestVideos.slice(0, 4).map(v => (
                <Link key={v.id} href={`/videoDetail?id=${v.id}`}>
                  <div style={{ borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.9)", boxShadow: "0 1px 5px rgba(80,140,200,0.1)", cursor: "pointer" }}>
                    <div style={{ position: "relative" }}>
                      <img src={v.cover_url} alt={v.name}
                        style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                      {v.duration && (
                        <span style={{
                          position: "absolute", bottom: 4, right: 6,
                          background: "rgba(0,0,0,0.65)", color: "white",
                          fontSize: "0.62rem", padding: "1px 5px", borderRadius: 3,
                        }}>{formatDuration(v.duration)}</span>
                      )}
                    </div>
                    <div style={{ padding: "6px 8px 8px" }}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "rgb(58,42,90)", lineHeight: 1.3, marginBottom: 3,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {v.name}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "rgb(140,165,195)" }}>{formatDate(v.publish_time)}</div>
                    </div>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>

      {/* 近期动态 */}
      <div style={{ margin: "0 10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgb(58,42,90)", display: "flex", alignItems: "center", gap: 5 }}>
            <span>⏰</span> 近期动态
          </div>
          <Link href="/activity" style={{ fontSize: "0.72rem", color: "rgb(124,92,191)", textDecoration: "none" }}>查看全部 &gt;</Link>
        </div>
        <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(80,140,200,0.1)" }}>
          {loadingActivity
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(180,160,220,0.2)" }}>
                  <div style={{ height: 14, width: "75%", background: "rgba(200,225,240,0.5)", borderRadius: 2, marginBottom: 5 }} />
                  <div style={{ height: 10, width: "45%", background: "rgba(200,225,240,0.4)", borderRadius: 2 }} />
                </div>
              ))
            : activities.map((a, i) => (
                <Link key={a.id} href={`/activityDetail?id=${a.id}`}>
                  <div style={{
                    padding: "10px 12px",
                    borderBottom: i < activities.length - 1 ? "1px solid rgba(180,160,220,0.2)" : "none",
                    cursor: "pointer",
                  }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgb(58,42,90)", marginBottom: 3 }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "rgb(120,150,185)", display: "flex", gap: 8 }}>
                      {a.note && <span>{a.note}</span>}
                      <span>{formatDate(a.time)}</span>
                    </div>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>
    </MobileLayout>
  );
}
