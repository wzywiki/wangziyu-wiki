/**
 * Search — 王梓钰搜索页
 * 包含：AI搜图（语义搜索）、歌词搜索
 */
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { API } from '@/lib/api';
import { Search as SearchIcon, Image, Music2 } from 'lucide-react';

interface AiSearchResult {
  id: string;
  set_id: string;
  path: string;
  url: string;
  score: number;
}

interface LyricLine {
  time_mark: string;
  text: string;
}

interface LyricResult {
  music_id: string;
  name: string;
  lyrics: LyricLine[];
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(160,200,225,0.45)',
  borderRadius: 10,
  boxShadow: '0 2px 12px rgba(100,160,200,0.10)',
  backdropFilter: 'blur(8px)',
};

export default function SearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const [searchType, setSearchType] = useState(urlParams.get('type') || 'pic');
  const [query, setQuery] = useState(urlParams.get('q') || '');
  const [inputQ, setInputQ] = useState(urlParams.get('q') || '');
  const [picResults, setPicResults] = useState<AiSearchResult[]>([]);
  const [lyricResults, setLyricResults] = useState<LyricResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async (type: string, q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setPicResults([]);
    setLyricResults([]);
    try {
      if (type === 'pic') {
        const res = await fetch(API.picAiSearch('', q, 1, 30));
        const json = await res.json();
        if (json.status === 0) setPicResults(json.data || []);
      } else if (type === 'lyric') {
        const res = await fetch(API.lyricSearch(q));
        const json = await res.json();
        if (json.status === 0) setLyricResults(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) doSearch(searchType, query);
  }, [query, searchType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newQ = inputQ.trim();
    if (newQ) {
      setQuery(newQ);
      window.history.pushState({}, '', `/search?type=${searchType}&q=${encodeURIComponent(newQ)}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '72px 16px 60px' }}>

        {/* 搜索框 */}
        <div style={{ ...cardStyle, padding: '22px 24px', marginBottom: 24 }}>
          {/* 类型切换 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { value: 'pic', label: 'AI搜图', icon: <Image size={13} /> },
              { value: 'lyric', label: '歌词搜索', icon: <Music2 size={13} /> },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setSearchType(tab.value)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 16px', borderRadius: 6, fontSize: '0.82rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: searchType === tab.value
                    ? '1px solid rgba(80,140,210,0.6)'
                    : '1px solid rgba(160,200,225,0.4)',
                  background: searchType === tab.value
                    ? 'rgba(80,140,210,0.12)'
                    : 'rgba(255,255,255,0.5)',
                  color: searchType === tab.value
                    ? 'rgb(50,100,180)'
                    : 'rgb(100,130,170)',
                  fontWeight: searchType === tab.value ? 600 : 400,
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={inputQ}
              onChange={e => setInputQ(e.target.value)}
              placeholder={searchType === 'pic' ? '描述图片内容，如：海边、兔子、月亮...' : '输入歌词内容搜索...'}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 7, fontSize: '0.88rem',
                border: '1px solid rgba(160,200,225,0.5)', background: 'rgba(255,255,255,0.7)',
                color: 'rgb(40,70,120)', outline: 'none',
                boxShadow: 'inset 0 1px 3px rgba(100,160,200,0.1)',
              }}
            />
            <button
              type="submit"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 7, fontSize: '0.88rem',
                background: 'rgba(80,140,210,0.85)', color: '#fff',
                border: 'none', cursor: 'pointer', fontWeight: 600,
                boxShadow: '0 2px 8px rgba(80,140,210,0.3)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(60,120,200,0.9)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(80,140,210,0.85)'}
            >
              <SearchIcon size={14} /> 搜索
            </button>
          </form>

          {searchType === 'pic' && (
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'rgb(130,160,190)' }}>
              使用 AI 语义搜索，用自然语言描述图片内容即可找到相关图片
            </div>
          )}
        </div>

        {/* 加载中 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgb(100,140,180)', fontSize: '0.9rem' }}>
            AI 搜索中，请稍候...
          </div>
        )}

        {/* 搜索结果 */}
        {!loading && query && (
          <>
            {/* AI搜图结果 */}
            {searchType === 'pic' && (
              <div>
                <div style={{ fontSize: '0.82rem', color: 'rgb(100,130,170)', marginBottom: 14 }}>
                  共找到 <strong>{picResults.length}</strong> 张相关图片
                </div>
                {picResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgb(130,160,190)', fontSize: '0.9rem', ...cardStyle }}>
                    未找到相关图片，换个描述试试
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
                    {picResults.map((r, i) => (
                      <Link key={i} href={`/picDetail?id=${r.set_id}`}>
                        <div style={{
                          cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                          border: '1px solid rgba(160,200,225,0.35)',
                          background: 'rgba(180,215,235,0.2)',
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
                            src={r.url}
                            alt={`搜索结果 ${i + 1}`}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div style={{
                            padding: '5px 8px', fontSize: '0.72rem', color: 'rgb(100,130,170)',
                            background: 'rgba(220,235,248,0.6)', textAlign: 'center',
                          }}>
                            相似度 {(r.score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 歌词搜索结果 */}
            {searchType === 'lyric' && (
              <div>
                <div style={{ fontSize: '0.82rem', color: 'rgb(100,130,170)', marginBottom: 14 }}>
                  共找到 <strong>{lyricResults.length}</strong> 首相关歌曲
                </div>
                {lyricResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgb(130,160,190)', fontSize: '0.9rem', ...cardStyle }}>
                    未找到相关歌词
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {lyricResults.map((r, i) => (
                      <Link key={i} href={`/musicDetail?id=${r.music_id}`}>
                        <div style={{
                          ...cardStyle, padding: '16px 20px', cursor: 'pointer',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(100,160,200,0.2)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(100,160,200,0.10)';
                          }}
                        >
                          <div style={{
                            fontSize: '0.95rem', fontWeight: 700, color: 'rgb(30,60,110)',
                            marginBottom: 10, fontFamily: "'Noto Serif SC', serif",
                          }}>
                            {r.name}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {r.lyrics.map((l, j) => (
                              <div key={j} style={{ fontSize: '0.82rem', color: 'rgb(80,110,160)', lineHeight: 1.7 }}>
                                <span style={{ color: 'rgb(140,170,200)', marginRight: 8, fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums' }}>
                                  {l.time_mark}
                                </span>
                                {l.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 初始状态提示 */}
        {!loading && !query && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgb(130,160,190)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.4 }}>
              {searchType === 'pic' ? '🖼️' : '🎵'}
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {searchType === 'pic' ? '输入描述，用 AI 找到相关图片' : '输入歌词内容，搜索王梓钰的歌曲'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
