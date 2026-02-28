/**
 * PicDetail — 王梓钰图库详情页
 * 包含：图集信息、图片网格、灯箱查看
 */
import { useEffect, useState } from 'react';
import { API, apiFetch, PicSet, formatDate } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Images } from 'lucide-react';

export default function PicDetail() {
  const isMobile = useIsMobile();
  const id = new URLSearchParams(window.location.search).get('id') || '';
  const [pic, setPic] = useState<PicSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<PicSet>(API.picDetail(id))
      .then(setPic)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const picUrls = pic?.pics_url || pic?.pics?.map(p =>
    `https://rwikipic.21hz.top/pic_service/pic?path=${encodeURIComponent(p)}`
  ) || [];

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

  if (loading) {
    const loadingContent = (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>加载中...</div>
    );
    if (isMobile) return <MobileLayout showBack>{loadingContent}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>加载中...</div>
      </div>
    );
  }

  if (!pic) {
    const notFoundContent = (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该图集</div>
    );
    if (isMobile) return <MobileLayout showBack>{notFoundContent}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该图集</div>
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
            padding: 14, marginBottom: 12,
            boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
          }}>
            {pic.cover_url && (
              <img src={pic.cover_url} alt={pic.name}
                style={{ width: '100%', borderRadius: 8, marginBottom: 10, display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div style={{ fontWeight: 700, color: 'rgb(30,60,110)', fontSize: '1rem', marginBottom: 8, fontFamily: "'Noto Serif SC', serif" }}>
              {pic.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '0.8rem' }}>
              {[
                { label: '类型', value: pic.type },
                { label: '日期', value: formatDate(pic.date) },
                { label: '作者', value: pic.author },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <span style={{ color: 'rgb(120,150,180)' }}>{f.label}：</span>
                  <span style={{ color: 'rgb(50,80,130)' }}>{f.value}</span>
                </div>
              ))}
            </div>
            {pic.tag && pic.tag.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {pic.tag.map(t => (
                  <span key={t} style={{
                    fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(100,170,210,0.15)', color: 'rgb(50,100,170)',
                    border: '1px solid rgba(100,160,210,0.25)',
                  }}>{t}</span>
                ))}
              </div>
            )}
            {pic.note && (
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'rgb(100,130,170)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {pic.note}
              </div>
            )}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'rgb(100,140,180)' }}>
              <Images size={13} /> 共 {picUrls.length} 张图片
            </div>
          </div>

          {/* 图片网格 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
          }}>
            {picUrls.map((url, i) => (
              <div
                key={i}
                onClick={() => setLightboxIdx(i)}
                style={{
                  cursor: 'pointer', borderRadius: 6, overflow: 'hidden',
                  aspectRatio: '1', background: 'rgba(180,215,235,0.25)',
                  border: '1px solid rgba(160,200,225,0.35)',
                }}
              >
                <img
                  src={url + '&thumbnail=1'}
                  alt={`${pic.name} ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.background = 'linear-gradient(135deg, rgba(180,215,235,0.6) 0%, rgba(160,200,225,0.4) 100%)';
                    el.removeAttribute('src');
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 灯箱 */}
        {lightboxIdx !== null && picUrls.length > 0 && (
          <div
            onClick={() => setLightboxIdx(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <button onClick={e => { e.stopPropagation(); setLightboxIdx(null); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
            {lightboxIdx > 0 && (
              <button onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                style={{ position: 'absolute', left: 12, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={22} />
              </button>
            )}
            <img src={picUrls[lightboxIdx]} alt={`图片 ${lightboxIdx + 1}`}
              style={{ maxWidth: '96vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 6 }}
              onClick={e => e.stopPropagation()} />
            {lightboxIdx < picUrls.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                style={{ position: 'absolute', right: 12, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={22} />
              </button>
            )}
            <div style={{ position: 'absolute', bottom: 16, color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 20 }}>
              {lightboxIdx + 1} / {picUrls.length}
            </div>
          </div>
        )}
      </MobileLayout>
    );
  }

  // 桌面端布局
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 16px 60px' }}>

        <button onClick={handleBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
          fontSize: '0.82rem', color: 'rgb(80,120,170)', background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(160,200,225,0.45)', borderRadius: 6, padding: '5px 12px',
          cursor: 'pointer', backdropFilter: 'blur(6px)',
        }}>
          <ArrowLeft size={14} /> 返回
        </button>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* 左侧信息面板 */}
          <div style={{
            width: 200, flexShrink: 0, position: 'sticky', top: 62,
            background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(160,200,225,0.5)',
            borderRadius: 10, boxShadow: '0 2px 12px rgba(100,160,200,0.12)',
            backdropFilter: 'blur(8px)', padding: '16px 14px',
          }}>
            {pic.cover_url && (
              <div style={{ marginBottom: 14, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(160,200,225,0.35)' }}>
                <img src={pic.cover_url} alt={pic.name}
                  style={{ width: '100%', display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}

            <div style={{ fontWeight: 700, color: 'rgb(30,60,110)', marginBottom: 12, fontFamily: "'Noto Serif SC', serif", fontSize: '0.9rem', lineHeight: 1.4 }}>
              {pic.name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
              {[
                { label: '类型', value: pic.type },
                { label: '日期', value: formatDate(pic.date) },
                { label: '作者', value: pic.author },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <span style={{ color: 'rgb(120,150,180)' }}>{f.label}：</span>
                  <span style={{ color: 'rgb(50,80,130)' }}>{f.value}</span>
                </div>
              ))}
            </div>

            {pic.tag && pic.tag.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '0.75rem', color: 'rgb(120,150,180)', marginBottom: 5 }}>Tag</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {pic.tag.map(t => (
                    <span key={t} style={{
                      fontSize: '0.72rem', padding: '1px 6px', borderRadius: 3,
                      background: 'rgba(100,170,210,0.15)', color: 'rgb(50,100,170)',
                      border: '1px solid rgba(100,160,210,0.25)',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {pic.note && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(160,200,225,0.3)', fontSize: '0.78rem', color: 'rgb(100,130,170)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {pic.note}
              </div>
            )}

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(160,200,225,0.3)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'rgb(100,140,180)' }}>
              <Images size={13} />
              共 {picUrls.length} 张图片
            </div>
          </div>

          {/* 右侧图片网格 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
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
                    alt={`${pic.name} ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.background = 'linear-gradient(135deg, rgba(180,215,235,0.6) 0%, rgba(160,200,225,0.4) 100%)';
                      el.removeAttribute('src');
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 灯箱 */}
      {lightboxIdx !== null && picUrls.length > 0 && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setLightboxIdx(null); }}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.12)', border: 'none',
              color: 'white', cursor: 'pointer', padding: 8, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
          {lightboxIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              style={{
                position: 'absolute', left: 16,
                background: 'rgba(255,255,255,0.12)', border: 'none',
                color: 'white', cursor: 'pointer', padding: 12, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <img
            src={picUrls[lightboxIdx]}
            alt={`图片 ${lightboxIdx + 1}`}
            style={{ maxWidth: '88vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 6 }}
            onClick={e => e.stopPropagation()}
          />
          {lightboxIdx < picUrls.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              style={{
                position: 'absolute', right: 16,
                background: 'rgba(255,255,255,0.12)', border: 'none',
                color: 'white', cursor: 'pointer', padding: 12, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight size={24} />
            </button>
          )}
          <div style={{
            position: 'absolute', bottom: 16,
            color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem',
            background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 20,
          }}>
            {lightboxIdx + 1} / {picUrls.length}
          </div>
        </div>
      )}
    </div>
  );
}
