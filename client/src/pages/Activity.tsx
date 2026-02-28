/**
 * Activity — 王梓钰动态页
 * 完全复刻原站 yinlin.wiki/activity 的时间轴布局
 *
 * 布局特征：
 * - 中央竖线 + trunk树干图片作为时间轴中轴
 * - blade 元素左右交替排列（偶数索引右侧，奇数索引左侧）
 * - 每个 blade 包含缩略图 + 标题信息卡片
 * - 右下角固定"历史上的今天"面板
 * - API: /activity/filter?time_type=future|past
 * - API: /activity/history
 */
import { useEffect, useState } from 'react';
import { API, apiFetch } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface RelatedTime {
  tag: string;
  time: string;
}

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

interface HistoryData {
  activity: Activity[];
  music: unknown[];
  video: unknown[];
  pic: unknown[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isFuture(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

const TYPE_COLOR: Record<string, string> = {
  '个人专场': '#e8a87c',
  '个人直播': '#7ec8e3',
  '普通现场': '#a8d8a8',
  '广电节目': '#c9a0dc',
  '网络节目': '#f9c74f',
  '漫展': '#f4a261',
  '里程碑': '#e76f51',
  '其他': '#adb5bd',
};

// ─── ActivityDetailModal ──────────────────────────────────────────────────────
function ActivityDetailModal({ item, onClose }: { item: Activity; onClose: () => void }) {
  const [currentPic, setCurrentPic] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.98)', borderRadius: 12,
          maxWidth: 680, width: '100%', maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 14, background: 'none',
            border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#666', zIndex: 10,
          }}
        >×</button>

        {item.pics_url && item.pics_url.length > 0 && (
          <div style={{ position: 'relative' }}>
            <img
              src={item.pics_url[currentPic]}
              alt={item.name}
              style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: '12px 12px 0 0', display: 'block' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            {item.pics_url.length > 1 && (
              <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {item.pics_url.map((_, i) => (
                  <button key={i} onClick={() => setCurrentPic(i)}
                    style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: i === currentPic ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '20px 24px 24px' }}>
          {item.type && (
            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: TYPE_COLOR[item.type] || '#adb5bd', color: '#fff', marginBottom: 10 }}>
              {item.type}
            </span>
          )}
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'rgb(30,50,90)', margin: '0 0 8px', fontFamily: "'Noto Serif SC', serif", lineHeight: 1.4 }}>
            {item.name}
          </h2>
          {item.note && <p style={{ color: '#666', fontSize: '0.85rem', margin: '0 0 6px' }}>📍 {item.note}</p>}
          <p style={{ color: '#888', fontSize: '0.82rem', margin: '0 0 12px' }}>🗓 {formatDate(item.time)}</p>

          {item.related_time && item.related_time.length > 0 && (
            <div style={{ background: 'rgba(100,160,210,0.08)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              {item.related_time.map((rt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555', padding: '2px 0' }}>
                  <span style={{ color: 'rgb(60,120,180)', fontWeight: 600 }}>{rt.tag}</span>
                  <span>{formatDate(rt.time)}</span>
                </div>
              ))}
            </div>
          )}

          {item.music && item.music.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', color: 'rgb(80,120,170)', fontWeight: 600, marginBottom: 6 }}>相关音乐</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {item.music.map((m, i) => (
                  <span key={i} style={{ padding: '3px 10px', background: 'rgba(100,160,210,0.12)', borderRadius: 20, fontSize: '0.78rem', color: 'rgb(50,100,160)', border: '1px solid rgba(100,160,210,0.3)' }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.url && item.url.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {item.url.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '5px 14px', background: 'rgb(60,120,200)', color: '#fff', borderRadius: 6, fontSize: '0.78rem', textDecoration: 'none', fontWeight: 500 }}>
                  {u.includes('weibo') ? '微博' : u.includes('bilibili') ? 'B站' : `链接${i + 1}`}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActivityPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Activity | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [futureItems, pastItems] = await Promise.all([
          apiFetch<Activity[]>(`${API.BASE}/activity/filter?time_type=future&page=1&size=100`),
          apiFetch<Activity[]>(`${API.BASE}/activity/filter?time_type=past&page=1&size=200`),
        ]);
        // 合并并按时间降序排列，用 Map 确保 ID 唯一
        const mergedMap = new Map<string, Activity>();
        [...futureItems, ...pastItems].forEach(item => {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });
        const merged = Array.from(mergedMap.values());
        merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setItems(merged);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();

    apiFetch<HistoryData>(`${API.BASE}/activity/history`)
      .then(setHistory)
      .catch(console.error);
  }, []);

  const ITEM_SPACING_REM = 7;
  const HEADER_OFFSET_REM = 5;
  const totalHeightRem = items.length * ITEM_SPACING_REM + HEADER_OFFSET_REM + 6;

  return (
    <div style={{ minHeight: '100vh' }}>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '62px 20px 80px', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 20 }}>
            <div style={{ width: 120, height: 32, background: 'rgba(100,160,210,0.2)', borderRadius: 6 }} />
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ width: '44%', marginLeft: i % 2 === 0 ? '6%' : '-6%', height: 80, background: 'rgba(255,255,255,0.5)', borderRadius: 8 }} />
            ))}
          </div>
        ) : (
          <div style={{ position: 'relative', minHeight: `${totalHeightRem}rem` }}>

            {/* TIME LINE 标题 */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, background: 'rgba(255,255,255,0.93)',
              border: '1px solid rgba(140,190,220,0.6)', borderRadius: 20,
              padding: '5px 22px', fontSize: '0.82rem', fontWeight: 700,
              letterSpacing: '0.18em', color: 'rgb(60,100,160)',
              fontFamily: "'Noto Serif SC', serif",
              boxShadow: '0 2px 10px rgba(100,160,200,0.15)',
            }}>
              TIME LINE
            </div>

            {/* 中央竖线 */}
            <div style={{
              position: 'absolute', top: '2.8rem', left: '50%', transform: 'translateX(-50%)',
              width: 2, height: `${totalHeightRem - 3.5}rem`,
              background: 'linear-gradient(to bottom, rgba(140,190,220,0.9), rgba(140,190,220,0.2))',
              zIndex: 2,
            }} />

            {/* trunk 树干装饰 */}
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663370567362/pOsZlhdHrrbOUXKr.png"
              alt=""
              style={{
                position: 'absolute', top: '2.8rem', left: '50%', transform: 'translateX(-50%)',
                width: 'auto', height: `${totalHeightRem - 3.5}rem`,
                opacity: 0.55, pointerEvents: 'none', zIndex: 1,
              }}
            />

            {/* ── 动态条目 ── */}
            {items.map((item, index) => {
              const isRight = index % 2 === 0;
              const topRem = HEADER_OFFSET_REM + index * ITEM_SPACING_REM;
              const future = isFuture(item.time);
              const coverUrl = item.pics_url?.[0];
              const hasImg = coverUrl && !imgErrors[item.id];

              return (
                <div
                  key={`${item.id}-${index}`}
                  style={{
                    position: 'absolute',
                    top: `${topRem}rem`,
                    ...(isRight
                      ? { left: 'calc(50% + 16px)', right: '2%' }
                      : { right: 'calc(50% + 16px)', left: '2%' }),
                    display: 'flex',
                    flexDirection: isRight ? 'row' : 'row-reverse',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    zIndex: 5,
                  }}
                  onClick={() => setSelectedItem(item)}
                >
                  {/* 中轴连接点 */}
                  <div style={{
                    position: 'absolute',
                    [isRight ? 'left' : 'right']: -20,
                    top: '50%', transform: 'translateY(-50%)',
                    width: 12, height: 12, borderRadius: '50%',
                    background: future ? 'rgb(100,180,120)' : 'rgb(140,190,220)',
                    border: '2px solid white',
                    boxShadow: '0 0 6px rgba(100,160,200,0.5)',
                    zIndex: 10,
                  }} />

                  {/* 封面图 */}
                  {hasImg ? (
                    <div style={{
                      width: 88, height: 88, flexShrink: 0, borderRadius: 8,
                      overflow: 'hidden', boxShadow: '2px 3px 10px rgba(0,0,0,0.18)',
                      border: '2px solid rgba(255,255,255,0.9)',
                    }}>
                      <img
                        src={coverUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: 88, height: 88, flexShrink: 0, borderRadius: 8,
                      background: 'rgba(160,200,225,0.25)',
                      border: '2px solid rgba(255,255,255,0.9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                    }}>🎵</div>
                  )}

                  {/* 信息卡片 */}
                  <div
                    style={{
                      flex: 1,
                      background: future ? 'rgba(215,238,255,0.93)' : 'rgba(255,255,255,0.93)',
                      border: future ? '1px solid rgba(100,180,220,0.5)' : '1px dashed rgba(160,200,225,0.6)',
                      borderRadius: 8, padding: '10px 14px',
                      boxShadow: '0 2px 12px rgba(100,160,200,0.12)',
                      backdropFilter: 'blur(6px)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(100,160,200,0.28)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(100,160,200,0.12)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }}
                  >
                    {item.type && (
                      <span style={{
                        display: 'inline-block', padding: '1px 8px', borderRadius: 20,
                        fontSize: '0.65rem', fontWeight: 600,
                        background: TYPE_COLOR[item.type] || '#adb5bd', color: '#fff', marginBottom: 5,
                      }}>
                        {item.type}
                      </span>
                    )}
                    <div style={{
                      fontSize: '0.88rem', fontWeight: 700, color: 'rgb(30,50,90)',
                      lineHeight: 1.4, marginBottom: 4,
                      fontFamily: "'Noto Serif SC', serif",
                    }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(100,140,180)' }}>
                      {formatDate(item.time)}
                    </div>
                    {item.note && (
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📍 {item.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ── 历史上的今天面板 ── */}
            <div style={{
              position: 'fixed', bottom: 30, right: 30, width: 260,
              background: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(140,190,220,0.5)', borderRadius: 10,
              boxShadow: '0 4px 20px rgba(100,160,200,0.2)',
              backdropFilter: 'blur(8px)', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{
                background: 'rgba(100,160,210,0.15)', padding: '8px 14px',
                fontSize: '0.8rem', fontWeight: 700, color: 'rgb(40,80,140)',
                fontFamily: "'Noto Serif SC', serif", letterSpacing: '0.05em',
                borderBottom: '1px solid rgba(140,190,220,0.3)',
              }}>
                历史上的今天
              </div>
              <div style={{ padding: '10px 14px', maxHeight: 200, overflowY: 'auto' }}>
                {history?.activity && history.activity.length > 0 ? (
                  history.activity.map(a => (
                    <div key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(160,200,225,0.2)', cursor: 'pointer' }}
                      onClick={() => setSelectedItem(a)}>
                      <div style={{ fontSize: '0.78rem', color: 'rgb(40,70,120)', fontWeight: 500, lineHeight: 1.4 }}>{a.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#999', marginTop: 2 }}>{formatDate(a.time)}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#aaa', textAlign: 'center', padding: '10px 0' }}>
                    今天也是无事发生的一天（
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedItem && <ActivityDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
