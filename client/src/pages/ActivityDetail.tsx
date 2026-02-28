/**
 * ActivityDetail — 王梓钰动态详情页
 * 包含：动态信息、图片、曲目、相关链接
 */
import { useEffect, useState } from 'react';
import { API, apiFetch, Activity, formatDate } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ArrowLeft, ExternalLink, Calendar, Music2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ActivityDetail() {
  const isMobile = useIsMobile();
  const id = new URLSearchParams(window.location.search).get('id') || '';
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [picUrls, setPicUrls] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<Activity>(API.activityDetail(id))
      .then(act => {
        setActivity(act);
        const urls = (act.pics || []).map(p =>
          `https://rwikipic.21hz.top/pic_service/pic?path=${encodeURIComponent(p)}`
        );
        setPicUrls(urls);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'ArrowLeft') setLightboxIdx(i => i !== null ? Math.max(0, i - 1) : null);
      if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? Math.min(picUrls.length - 1, i + 1) : null);
      if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIdx, picUrls.length]);

  const handleBack = () => window.history.back();

  // 灯箱组件（手机端和桌面端共用）
  const Lightbox = () => lightboxIdx !== null && picUrls.length > 0 ? (
    <div
      onClick={() => setLightboxIdx(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button onClick={e => { e.stopPropagation(); setLightboxIdx(null); }}
        style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={20} />
      </button>
      {lightboxIdx > 0 && (
        <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? i - 1 : null); }}
          style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={24} />
        </button>
      )}
      <img src={picUrls[lightboxIdx]} alt={`图片 ${lightboxIdx + 1}`}
        style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 6 }}
        onClick={e => e.stopPropagation()} />
      {lightboxIdx < picUrls.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? i + 1 : null); }}
          style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={24} />
        </button>
      )}
      <div style={{ position: 'absolute', bottom: 16, color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 20 }}>
        {lightboxIdx + 1} / {picUrls.length}
      </div>
    </div>
  ) : null;

  if (loading) {
    const content = <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>加载中...</div>;
    if (isMobile) return <MobileLayout showBack>{content}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>加载中...</div>
      </div>
    );
  }

  if (!activity) {
    const content = <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该动态</div>;
    if (isMobile) return <MobileLayout showBack>{content}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该动态</div>
      </div>
    );
  }

  // 手机端布局
  if (isMobile) {
    return (
      <MobileLayout showBack>
        <div style={{ padding: '12px 12px 80px' }}>
          {/* 基本信息 */}
          <div style={{
            background: 'rgba(255,255,255,0.9)', borderRadius: 12,
            padding: 16, marginBottom: 12,
            boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
          }}>
            <h1 style={{
              fontSize: '1rem', fontWeight: 700, color: 'rgb(25,55,100)',
              fontFamily: "'Noto Serif SC', serif", marginBottom: 10, lineHeight: 1.4,
            }}>
              {activity.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'rgb(80,120,170)' }}>
              <Calendar size={13} />
              {formatDate(activity.time)}
            </div>
            {activity.note && (
              <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'rgb(100,130,170)', lineHeight: 1.6 }}>
                {activity.note}
              </div>
            )}
          </div>

          {/* 图片 */}
          {picUrls.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 12,
              padding: 14, marginBottom: 12,
              boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 10 }}>现场图片</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {picUrls.map((url, i) => (
                  <div key={i} onClick={() => setLightboxIdx(i)}
                    style={{ cursor: 'pointer', borderRadius: 6, overflow: 'hidden', aspectRatio: '1', background: 'rgba(180,215,235,0.25)', border: '1px solid rgba(160,200,225,0.35)' }}>
                    <img src={url + '&thumbnail=1'} alt={`${activity.name} ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 曲目 */}
          {activity.music && activity.music.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 12,
              padding: 14, marginBottom: 12,
              boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 10 }}>
                <Music2 size={13} /> 曲目
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {activity.music.map((m, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 5, fontSize: '0.8rem',
                    background: 'rgba(80,140,210,0.1)', color: 'rgb(50,100,180)',
                    border: '1px solid rgba(80,140,210,0.22)',
                  }}>{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* 相关链接 */}
          {activity.url && activity.url.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 12,
              padding: 14, marginBottom: 12,
              boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 10 }}>相关链接</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {activity.url.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: '0.82rem', padding: '6px 14px', borderRadius: 6,
                      background: 'rgba(80,140,210,0.08)', color: 'rgb(50,100,180)',
                      border: '1px solid rgba(80,140,210,0.25)', textDecoration: 'none',
                    }}>
                    <ExternalLink size={13} />
                    {activity.link && activity.link[i] ? activity.link[i] : `链接 ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <Lightbox />
      </MobileLayout>
    );
  }

  // 桌面端布局
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 16px 60px' }}>

        <button onClick={handleBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
          fontSize: '0.82rem', color: 'rgb(80,120,170)', background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(160,200,225,0.45)', borderRadius: 6, padding: '5px 12px',
          cursor: 'pointer', backdropFilter: 'blur(6px)',
        }}>
          <ArrowLeft size={14} /> 返回
        </button>

        <div style={{
          background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(160,200,225,0.45)',
          borderRadius: 14, boxShadow: '0 4px 24px rgba(100,160,200,0.14)',
          backdropFilter: 'blur(10px)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '24px 28px', borderBottom: '1px solid rgba(160,200,225,0.3)',
            background: 'rgba(220,235,248,0.18)',
          }}>
            <h1 style={{
              fontSize: '1.4rem', fontWeight: 700, color: 'rgb(25,55,100)',
              fontFamily: "'Noto Serif SC', serif", marginBottom: 10, lineHeight: 1.4,
            }}>
              {activity.name}
            </h1>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'rgb(80,120,170)' }}>
                <Calendar size={13} />
                {formatDate(activity.time)}
              </div>
              {activity.note && (
                <div style={{ fontSize: '0.82rem', color: 'rgb(100,130,170)' }}>
                  {activity.note}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {picUrls.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 12, letterSpacing: '0.05em' }}>
                  现场图片
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 8,
                }}>
                  {picUrls.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxIdx(i)}
                      style={{
                        cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                        aspectRatio: '1', background: 'rgba(180,215,235,0.25)',
                        border: '1px solid rgba(160,200,225,0.35)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(100,160,200,0.25)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      }}
                    >
                      <img
                        src={url + '&thumbnail=1'}
                        alt={`${activity.name} ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activity.music && activity.music.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 12, letterSpacing: '0.05em' }}>
                  <Music2 size={13} /> 曲目
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activity.music.map((m, i) => (
                    <span key={i} style={{
                      padding: '4px 12px', borderRadius: 5, fontSize: '0.82rem',
                      background: 'rgba(80,140,210,0.1)', color: 'rgb(50,100,180)',
                      border: '1px solid rgba(80,140,210,0.22)',
                    }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activity.url && activity.url.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(100,140,180)', marginBottom: 12, letterSpacing: '0.05em' }}>
                  相关链接
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activity.url.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: '0.85rem', padding: '7px 16px', borderRadius: 6,
                        background: 'rgba(80,140,210,0.08)', color: 'rgb(50,100,180)',
                        border: '1px solid rgba(80,140,210,0.25)', textDecoration: 'none',
                      }}>
                      <ExternalLink size={14} />
                      {activity.link && activity.link[i] ? activity.link[i] : `链接 ${i + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Lightbox />
    </div>
  );
}
