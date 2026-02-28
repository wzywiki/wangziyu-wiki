/**
 * VideoDetail — 王梓钰视频详情页
 * 包含：B站嵌入播放器、视频信息、平台链接
 */
import { useEffect, useState } from 'react';
import { API, apiFetch, Video, formatDate, formatDuration, getBilibiliEmbed, getBilibiliUrl } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ExternalLink, ArrowLeft, Play } from 'lucide-react';

export default function VideoDetail() {
  const isMobile = useIsMobile();
  const id = new URLSearchParams(window.location.search).get('id') || '';
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiFetch<Video>(API.videoDetail(id))
      .then(setVideo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleBack = () => window.history.back();

  if (loading) {
    const content = <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>加载中...</div>;
    if (isMobile) return <MobileLayout showBack>{content}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>加载中...</div>
      </div>
    );
  }

  if (!video) {
    const content = <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该视频</div>;
    if (isMobile) return <MobileLayout showBack>{content}</MobileLayout>;
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'rgb(130,160,190)' }}>未找到该视频</div>
      </div>
    );
  }

  const bilibiliSource = video.sources?.find(s => s.platform === 'bilibili');
  const weiboSource = video.sources?.find(s => s.platform === 'weibo');

  // 手机端布局
  if (isMobile) {
    return (
      <MobileLayout showBack>
        <div style={{ paddingBottom: 80 }}>
          {/* 视频播放区 */}
          <div style={{ background: '#000', width: '100%' }}>
            {bilibiliSource?.bvid ? (
              <iframe
                src={getBilibiliEmbed(bilibiliSource.bvid)}
                style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
                allowFullScreen
                title={video.name}
              />
            ) : (
              <div style={{ position: 'relative' }}>
                {video.cover_url ? (
                  <img src={video.cover_url} alt={video.name}
                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{
                    aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(180,215,235,0.5) 0%, rgba(160,200,225,0.3) 100%)',
                  }}>
                    <Play size={50} style={{ color: 'rgba(100,160,200,0.4)' }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 信息区 */}
          <div style={{ padding: '14px 14px 0' }}>
            <div style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 12,
              padding: 14, boxShadow: '0 2px 8px rgba(100,160,200,0.1)',
            }}>
              {/* 标题 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <span style={{
                  flexShrink: 0, marginTop: 3,
                  background: 'rgba(80,140,210,0.15)', color: 'rgb(50,100,180)',
                  fontSize: '0.7rem', padding: '2px 7px', borderRadius: 4,
                  fontWeight: 600, border: '1px solid rgba(80,140,210,0.25)',
                }}>
                  {video.type}
                </span>
                <h1 style={{
                  fontSize: '1rem', fontWeight: 700, color: 'rgb(25,55,100)',
                  fontFamily: "'Noto Serif SC', serif", lineHeight: 1.4, margin: 0,
                }}>
                  {video.name}
                </h1>
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'rgb(120,150,180)', marginBottom: 14 }}>
                <span>发布：{formatDate(video.publish_time)}</span>
                <span>时长：{formatDuration(video.duration)}</span>
              </div>

              {/* 平台链接 */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {bilibiliSource?.bvid && (
                  <a href={getBilibiliUrl(bilibiliSource.bvid)} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: '0.82rem', padding: '6px 14px', borderRadius: 6,
                      background: 'rgba(0,160,220,0.08)', color: 'rgb(0,130,200)',
                      border: '1px solid rgba(0,160,220,0.25)', textDecoration: 'none',
                    }}>
                    <ExternalLink size={13} /> 在B站打开
                  </a>
                )}
                {weiboSource?.mid && (
                  <a href={`https://weibo.com/tv/show/${weiboSource.mid}`} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: '0.82rem', padding: '6px 14px', borderRadius: 6,
                      background: 'rgba(220,50,50,0.08)', color: 'rgb(180,40,40)',
                      border: '1px solid rgba(220,50,50,0.22)', textDecoration: 'none',
                    }}>
                    <ExternalLink size={13} /> 在微博打开
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
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
          <div style={{ background: 'rgba(10,20,50,0.04)' }}>
            {bilibiliSource?.bvid ? (
              <iframe
                src={getBilibiliEmbed(bilibiliSource.bvid)}
                style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
                allowFullScreen
                title={video.name}
              />
            ) : (
              <div style={{ position: 'relative' }}>
                {video.cover_url ? (
                  <img src={video.cover_url} alt={video.name}
                    style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{
                    height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(180,215,235,0.5) 0%, rgba(160,200,225,0.3) 100%)',
                  }}>
                    <Play size={60} style={{ color: 'rgba(100,160,200,0.4)' }} />
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 12, right: 12,
                  background: 'rgba(0,0,0,0.65)', color: '#fff',
                  fontSize: '0.8rem', padding: '3px 8px', borderRadius: 4,
                }}>
                  {formatDuration(video.duration)}
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '22px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <span style={{
                flexShrink: 0, marginTop: 4,
                background: 'rgba(80,140,210,0.15)', color: 'rgb(50,100,180)',
                fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4,
                fontWeight: 600, border: '1px solid rgba(80,140,210,0.25)',
              }}>
                {video.type}
              </span>
              <h1 style={{
                fontSize: '1.2rem', fontWeight: 700, color: 'rgb(25,55,100)',
                fontFamily: "'Noto Serif SC', serif", lineHeight: 1.4, margin: 0,
              }}>
                {video.name}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'rgb(120,150,180)', marginBottom: 18 }}>
              <span>发布时间：{formatDate(video.publish_time)}</span>
              <span>时长：{formatDuration(video.duration)}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {bilibiliSource?.bvid && (
                <a href={getBilibiliUrl(bilibiliSource.bvid)} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.85rem', padding: '7px 16px', borderRadius: 6,
                    background: 'rgba(0,160,220,0.08)', color: 'rgb(0,130,200)',
                    border: '1px solid rgba(0,160,220,0.25)', textDecoration: 'none',
                  }}>
                  <ExternalLink size={14} /> 在哔哩哔哩打开
                </a>
              )}
              {weiboSource?.mid && (
                <a href={`https://weibo.com/tv/show/${weiboSource.mid}`} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.85rem', padding: '7px 16px', borderRadius: 6,
                    background: 'rgba(220,50,50,0.08)', color: 'rgb(180,40,40)',
                    border: '1px solid rgba(220,50,50,0.22)', textDecoration: 'none',
                  }}>
                  <ExternalLink size={14} /> 在微博打开
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
