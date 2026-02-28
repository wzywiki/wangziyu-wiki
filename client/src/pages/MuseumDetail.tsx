/**
 * MuseumDetail — 王梓钰博物馆藏品详情页
 * 包含：藏品信息、子项目、图片灯箱
 */
import { useEffect, useState } from 'react';
import { API, apiFetch, MuseumItem, formatDate } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Package } from 'lucide-react';

export default function MuseumDetail() {
  const isMobile = useIsMobile();
  const id = new URLSearchParams(window.location.search).get('id') || '';
  const [item, setItem] = useState<MuseumItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch<MuseumItem>(API.museumDetail(id))
      .then(setItem)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const openLightbox = (images: string[], idx: number) => {
    setLightboxImages(images);
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowLeft') setLightboxIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setLightboxIdx(i => Math.min(lightboxImages.length - 1, i + 1));
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxImages.length]);

  const handleBack = () => window.history.back();

  // 灯箱组件
  const Lightbox = () => lightboxOpen && lightboxImages.length > 0 ? (
    <div
      onClick={() => setLightboxOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
        style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={20} />
      </button>
      {lightboxIdx > 0 && (
        <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => i - 1); }}
          style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={24} />
        </button>
      )}
      <img src={lightboxImages[lightboxIdx]} alt={`藏品图片 ${lightboxIdx + 1}`}
        style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 6 }}
        onClick={e => e.stopPropagation()} />
      {lightboxIdx < lightboxImages.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => i + 1); }}
          style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={24} />
        </button>
      )}
      <div style={{ position: 'absolute', bottom: 16, color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 20 }}>
        {lightboxIdx + 1} / {lightboxImages.length}
      </div>
    </div>
  ) : null;

  if (loading) {
    const content = <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>加载中...</div>;
    if (isMobile) return <MobileLayout showBack>{content}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>加载中...</div>
      </div>
    );
  }

  if (!item) {
    const content = <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该藏品</div>;
    if (isMobile) return <MobileLayout showBack>{content}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该藏品</div>
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
            padding: 14, marginBottom: 12,
            boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
          }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              {/* 封面 */}
              <div style={{
                width: 80, height: 80, flexShrink: 0, borderRadius: 8,
                overflow: 'hidden', border: '1px solid rgba(160,200,225,0.4)',
                background: 'rgba(180,215,235,0.3)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {item.cover_url ? (
                  <img src={item.cover_url} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <Package size={28} style={{ color: 'rgba(100,160,200,0.4)' }} />
                )}
              </div>
              {/* 标题 + 信息 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'rgb(30,60,110)', fontSize: '0.95rem', fontFamily: "'Noto Serif SC', serif", marginBottom: 6, lineHeight: 1.3 }}>
                  {item.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.78rem' }}>
                  {[
                    { label: '类型', value: item.type },
                    { label: '发行', value: formatDate(item.publish_date) },
                    { label: '方式', value: item.publish_method },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label}>
                      <span style={{ color: 'rgb(120,150,180)' }}>{f.label}：</span>
                      <span style={{ color: 'rgb(50,80,130)' }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {item.note && (
              <div style={{ fontSize: '0.8rem', color: 'rgb(100,130,170)', lineHeight: 1.6, whiteSpace: 'pre-wrap', paddingTop: 10, borderTop: '1px solid rgba(160,200,225,0.25)' }}>
                {item.note}
              </div>
            )}
          </div>

          {/* 子项目 */}
          {item.items && item.items.length > 0 ? (
            item.items.map((subItem, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.9)', borderRadius: 12,
                marginBottom: 12, overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
              }}>
                <div style={{
                  padding: '10px 12px', borderBottom: '1px solid rgba(160,200,225,0.25)',
                  background: 'rgba(220,235,248,0.18)',
                }}>
                  <div style={{ fontWeight: 600, color: 'rgb(30,60,110)', fontSize: '0.88rem', fontFamily: "'Noto Serif SC', serif" }}>
                    {subItem.type || subItem.filename || '周边'}
                  </div>
                </div>

                {subItem.image_url && (
                  <div style={{ padding: '10px 12px' }}>
                    <div
                      onClick={() => openLightbox(item.items.map((it: any) => it.image_url), item.items.indexOf(subItem))}
                      style={{
                        cursor: 'pointer', borderRadius: 6, overflow: 'hidden',
                        border: '1px solid rgba(160,200,225,0.35)',
                        background: 'rgba(180,215,235,0.2)',
                        display: 'inline-block', maxWidth: '100%',
                      }}
                    >
                      <img
                        src={subItem.image_url}
                        alt={subItem.type}
                        style={{ width: '100%', maxWidth: 300, display: 'block', borderRadius: 6 }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 12,
              padding: '30px', textAlign: 'center',
              color: 'rgb(130,160,190)', fontSize: '0.9rem',
            }}>
              暂无详细内容
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
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '72px 16px 60px' }}>

        <button onClick={handleBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
          fontSize: '0.82rem', color: 'rgb(80,120,170)', background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(160,200,225,0.45)', borderRadius: 6, padding: '5px 12px',
          cursor: 'pointer', backdropFilter: 'blur(6px)',
        }}>
          <ArrowLeft size={14} /> 返回
        </button>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{
            width: 210, flexShrink: 0, position: 'sticky', top: 62,
            background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(160,200,225,0.5)',
            borderRadius: 10, boxShadow: '0 2px 12px rgba(100,160,200,0.12)',
            backdropFilter: 'blur(8px)', padding: '16px 14px',
          }}>
            {item.cover_url ? (
              <div style={{ marginBottom: 14, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(160,200,225,0.35)' }}>
                <img src={item.cover_url} alt={item.name}
                  style={{ width: '100%', display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            ) : (
              <div style={{
                marginBottom: 14, height: 120, borderRadius: 8,
                background: 'rgba(180,215,235,0.3)', border: '1px solid rgba(160,200,225,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={36} style={{ color: 'rgba(100,160,200,0.4)' }} />
              </div>
            )}

            <div style={{ fontWeight: 700, color: 'rgb(30,60,110)', marginBottom: 12, fontFamily: "'Noto Serif SC', serif", fontSize: '0.9rem', lineHeight: 1.4 }}>
              {item.name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
              {[
                { label: '类型', value: item.type },
                { label: '发行方式', value: item.publish_method },
                { label: '发行日期', value: formatDate(item.publish_date) },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <span style={{ color: 'rgb(120,150,180)' }}>{f.label}：</span>
                  <span style={{ color: 'rgb(50,80,130)' }}>{f.value}</span>
                </div>
              ))}
              {item.dimension && (item.dimension.w > 0 || item.dimension.h > 0) && (
                <div>
                  <span style={{ color: 'rgb(120,150,180)' }}>尺寸：</span>
                  <span style={{ color: 'rgb(50,80,130)' }}>{item.dimension.w}×{item.dimension.d}×{item.dimension.h} cm</span>
                </div>
              )}
            </div>

            {item.note && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(160,200,225,0.3)', fontSize: '0.78rem', color: 'rgb(100,130,170)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {item.note}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {item.items && item.items.length > 0 ? (
              item.items.map((subItem, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(160,200,225,0.45)',
                  borderRadius: 10, boxShadow: '0 2px 12px rgba(100,160,200,0.10)',
                  backdropFilter: 'blur(8px)', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid rgba(160,200,225,0.25)',
                    background: 'rgba(220,235,248,0.18)',
                  }}>
                    <div style={{ fontWeight: 600, color: 'rgb(30,60,110)', fontSize: '0.92rem', fontFamily: "'Noto Serif SC', serif" }}>
                      {subItem.type || subItem.filename || '周边'}
                    </div>
                  </div>

                  {subItem.image_url && (
                    <div style={{ padding: '12px 14px' }}>
                      <div
                        onClick={() => openLightbox(item.items.map((it: any) => it.image_url), item.items.indexOf(subItem))}
                        style={{
                          cursor: 'pointer', borderRadius: 7, overflow: 'hidden',
                          border: '1px solid rgba(160,200,225,0.35)',
                          background: 'rgba(180,215,235,0.2)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          display: 'inline-block', maxWidth: 280,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(100,160,200,0.25)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        }}
                      >
                        <img
                          src={subItem.image_url}
                          alt={subItem.type}
                          style={{ width: '100%', display: 'block', borderRadius: 7 }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        {subItem.type && (
                          <div style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'rgb(100,130,170)', textAlign: 'center', background: 'rgba(220,235,248,0.5)' }}>
                            {subItem.type}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(160,200,225,0.45)',
                borderRadius: 10, padding: '40px', textAlign: 'center',
                color: 'rgb(130,160,190)', fontSize: '0.9rem',
              }}>
                暂无详细内容
              </div>
            )}
          </div>
        </div>
      </div>

      <Lightbox />
    </div>
  );
}
