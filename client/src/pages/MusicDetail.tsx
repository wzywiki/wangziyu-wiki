/**
 * MusicDetail — 王梓钰音乐详情页
 * 包含：封面、歌词（支持 LRC URL 自动 fetch 解析）、平台链接、制作人员
 */
import { useEffect, useState } from 'react';
import { API, apiFetch, Music, formatDate } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ExternalLink, ArrowLeft, Music2 } from 'lucide-react';

/** 判断字符串是否是 http/https URL */
function isUrl(str: string): boolean {
  return /^https?:\/\//i.test(str.trim());
}



/** 歌词展示组件：自动判断是 URL 还是纯文本 */
function LyricContent({ lyric, musicId }: { lyric: string; musicId?: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!lyric) return;
    if (isUrl(lyric)) {
      setLoading(true);
      setError(false);
      // 通过后端代理接口获取 LRC，绕过 OSS CORS 限制
      const proxyUrl = musicId
        ? `/api/lyric?id=${encodeURIComponent(musicId)}`
        : `/api/lyric?url=${encodeURIComponent(lyric)}`;
      fetch(proxyUrl)
        .then(res => {
          if (!res.ok) throw new Error('fetch failed');
          return res.text();
        })
        .then(raw => {
          setText(raw);
        })
        .catch(() => {
          setError(true);
          setText(null);
        })
        .finally(() => setLoading(false));
    } else {
      // 直接是歌词文本
      setText(lyric);
    }
  }, [lyric]);

  if (loading) {
    return (
      <div style={{ fontSize: '0.85rem', color: 'rgb(150,170,200)', padding: '8px 0' }}>
        歌词加载中...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ fontSize: '0.85rem', color: 'rgb(180,100,100)', padding: '8px 0' }}>
        歌词加载失败，请稍后重试
      </div>
    );
  }
  if (!text) return null;

  return (
    <pre style={{
      fontSize: '0.88rem', lineHeight: 2, color: 'rgb(50,80,120)',
      fontFamily: "'Noto Sans SC', sans-serif", whiteSpace: 'pre-wrap', margin: 0,
    }}>
      {text}
    </pre>
  );
}

export default function MusicDetail() {
  const isMobile = useIsMobile();
  const id = new URLSearchParams(window.location.search).get('id') || '';
  const [music, setMusic] = useState<Music | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiFetch<Music>(API.musicDetail(id))
      .then(setMusic)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleBack = () => window.history.back();

  if (loading) {
    const content = <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)', fontSize: '0.9rem' }}>加载中...</div>;
    if (isMobile) return <MobileLayout showBack>{content}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)', fontSize: '0.9rem' }}>加载中...</div>
      </div>
    );
  }

  if (!music) {
    const content = <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该音乐</div>;
    if (isMobile) return <MobileLayout showBack>{content}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该音乐</div>
      </div>
    );
  }

  // 手机端布局
  if (isMobile) {
    return (
      <MobileLayout showBack>
        <div style={{ padding: '12px 12px 80px' }}>
          {/* 封面 + 基本信息 */}
          <div style={{
            background: 'rgba(255,255,255,0.9)', borderRadius: 12,
            padding: 16, marginBottom: 12,
            boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
          }}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              {/* 封面 */}
              <div style={{
                width: 90, height: 90, flexShrink: 0, borderRadius: 8,
                overflow: 'hidden', border: '1px solid rgba(160,200,225,0.4)',
                background: 'rgba(180,215,235,0.3)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {music.cover_url ? (
                  <img src={music.cover_url} alt={music.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <Music2 size={32} style={{ color: 'rgba(100,160,200,0.5)' }} />
                )}
              </div>
              {/* 标题 + 基本信息 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'rgb(25,55,100)', fontSize: '1rem', fontFamily: "'Noto Serif SC', serif", marginBottom: 8, lineHeight: 1.3 }}>
                  {music.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.78rem' }}>
                  {[
                    { label: '专辑', value: music.album },
                    { label: '发布', value: formatDate(music.publish_time) },
                    { label: '类型', value: music.solo },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label}>
                      <span style={{ color: 'rgb(120,150,180)' }}>{f.label}：</span>
                      <span style={{ color: 'rgb(50,80,130)' }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 平台链接 */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {music.platform?.netease && (
                <a href={`https://music.163.com/song?id=${music.platform.netease}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, background: 'rgba(220,50,50,0.08)', color: 'rgb(180,40,40)', border: '1px solid rgba(220,50,50,0.22)', textDecoration: 'none' }}>
                  <ExternalLink size={11} /> 网易云
                </a>
              )}
              {music.platform?.qq_music && (
                <a href={`https://y.qq.com/n/ryqq/songDetail/${music.platform.qq_music}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, background: 'rgba(30,120,220,0.08)', color: 'rgb(30,100,200)', border: '1px solid rgba(30,120,220,0.22)', textDecoration: 'none' }}>
                  <ExternalLink size={11} /> QQ音乐
                </a>
              )}
              {music.platform?.bilibili && (
                <a href={`https://www.bilibili.com/video/${music.platform.bilibili}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, background: 'rgba(0,160,220,0.08)', color: 'rgb(0,130,200)', border: '1px solid rgba(0,160,220,0.22)', textDecoration: 'none' }}>
                  <ExternalLink size={11} /> B站
                </a>
              )}
              {music.pv_mv && (
                <a href={music.pv_mv} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, background: 'rgba(100,60,200,0.08)', color: 'rgb(80,50,180)', border: '1px solid rgba(100,60,200,0.22)', textDecoration: 'none' }}>
                  <ExternalLink size={11} /> PV/MV
                </a>
              )}
            </div>
          </div>

          {/* 歌词 */}
          {music.lyric && (
            <div style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 12,
              padding: 16, marginBottom: 12,
              boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 12, letterSpacing: '0.05em' }}>歌词</div>
              <LyricContent lyric={music.lyric} musicId={String(music.id)} />
            </div>
          )}

          {/* 制作人员 */}
          {music.staff && music.staff.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 12,
              padding: 16, marginBottom: 12,
              boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 12, letterSpacing: '0.05em' }}>制作人员</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {music.staff.map((s, i) => (
                  <div key={i} style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'rgb(120,150,180)', marginRight: 6 }}>{s.type}：</span>
                    <span style={{ color: 'rgb(50,80,130)' }}>{s.name}</span>
                  </div>
                ))}
              </div>
              {music.note && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(160,200,225,0.3)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 6 }}>备注</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgb(100,130,170)', lineHeight: 1.6 }}>{music.note}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </MobileLayout>
    );
  }

  // 桌面端布局
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 16px 60px' }}>

        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
            fontSize: '0.82rem', color: 'rgb(80,120,170)',
            background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(160,200,225,0.45)',
            borderRadius: 6, padding: '5px 12px', cursor: 'pointer', backdropFilter: 'blur(6px)',
          }}
        >
          <ArrowLeft size={14} /> 返回
        </button>

        <div style={{
          background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(160,200,225,0.45)',
          borderRadius: 14, boxShadow: '0 4px 24px rgba(100,160,200,0.14)',
          backdropFilter: 'blur(10px)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', gap: 24, padding: '28px 28px 24px',
            borderBottom: '1px solid rgba(160,200,225,0.3)',
            background: 'rgba(220,235,248,0.18)',
          }}>
            <div style={{
              width: 120, height: 120, flexShrink: 0, borderRadius: 10,
              overflow: 'hidden', border: '1px solid rgba(160,200,225,0.4)',
              background: 'rgba(180,215,235,0.3)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {music.cover_url ? (
                <img src={music.cover_url} alt={music.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <Music2 size={40} style={{ color: 'rgba(100,160,200,0.5)' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: '1.5rem', fontWeight: 700, color: 'rgb(25,55,100)',
                fontFamily: "'Noto Serif SC', serif", marginBottom: 10, lineHeight: 1.3,
              }}>
                {music.name}
              </h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginBottom: 14 }}>
                {[
                  { label: '专辑', value: music.album },
                  { label: '发布时间', value: formatDate(music.publish_time) },
                  { label: '演唱类型', value: music.solo },
                  { label: '语言', value: music.language },
                  { label: '类型', value: music.music_type },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} style={{ fontSize: '0.82rem' }}>
                    <span style={{ color: 'rgb(120,150,180)' }}>{f.label}：</span>
                    <span style={{ color: 'rgb(50,80,130)', fontWeight: 500 }}>{f.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {music.platform?.netease && (
                  <a href={`https://music.163.com/song?id=${music.platform.netease}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '4px 12px', borderRadius: 5, background: 'rgba(220,50,50,0.08)', color: 'rgb(180,40,40)', border: '1px solid rgba(220,50,50,0.22)', textDecoration: 'none' }}>
                    <ExternalLink size={11} /> 网易云音乐
                  </a>
                )}
                {music.platform?.qq_music && (
                  <a href={`https://y.qq.com/n/ryqq/songDetail/${music.platform.qq_music}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '4px 12px', borderRadius: 5, background: 'rgba(30,120,220,0.08)', color: 'rgb(30,100,200)', border: '1px solid rgba(30,120,220,0.22)', textDecoration: 'none' }}>
                    <ExternalLink size={11} /> QQ音乐
                  </a>
                )}
                {music.platform?.bilibili && (
                  <a href={`https://www.bilibili.com/video/${music.platform.bilibili}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '4px 12px', borderRadius: 5, background: 'rgba(0,160,220,0.08)', color: 'rgb(0,130,200)', border: '1px solid rgba(0,160,220,0.22)', textDecoration: 'none' }}>
                    <ExternalLink size={11} /> 哔哩哔哩
                  </a>
                )}
                {music.pv_mv && (
                  <a href={music.pv_mv} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '4px 12px', borderRadius: 5, background: 'rgba(100,60,200,0.08)', color: 'rgb(80,50,180)', border: '1px solid rgba(100,60,200,0.22)', textDecoration: 'none' }}>
                    <ExternalLink size={11} /> PV/MV
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex' }}>
            {music.lyric && (
              <div style={{
                flex: 1, padding: '24px 28px',
                borderRight: music.staff && music.staff.length > 0 ? '1px solid rgba(160,200,225,0.25)' : 'none',
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 14, letterSpacing: '0.05em' }}>
                  歌词
                </div>
                <LyricContent lyric={music.lyric} musicId={String(music.id)} />
              </div>
            )}

            {music.staff && music.staff.length > 0 && (
              <div style={{ width: 200, flexShrink: 0, padding: '24px 20px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 14, letterSpacing: '0.05em' }}>
                  制作人员
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {music.staff.map((s, i) => (
                    <div key={i} style={{ fontSize: '0.82rem' }}>
                      <span style={{ color: 'rgb(120,150,180)', marginRight: 6 }}>{s.type}：</span>
                      <span style={{ color: 'rgb(50,80,130)' }}>{s.name}</span>
                    </div>
                  ))}
                </div>
                {music.note && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 8 }}>备注</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgb(100,130,170)', lineHeight: 1.6 }}>{music.note}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
