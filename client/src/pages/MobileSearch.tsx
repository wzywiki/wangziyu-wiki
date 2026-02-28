/**
 * MobileSearch — 手机端搜索页
 * AI搜图 + 歌词搜索，简洁移动端风格
 */
import { useState } from "react";
import { Link } from "wouter";
import { API } from "@/lib/api";
import MobileLayout from "@/components/MobileLayout";

interface AiSearchResult {
  id: string;
  set_id: string;
  path: string;
  url: string;
  score: number;
}
interface LyricLine { time_mark: string; text: string; }
interface LyricResult { music_id: string; name: string; lyrics: LyricLine[]; }

export default function MobileSearch() {
  const urlParams = new URLSearchParams(window.location.search);
  const [searchType, setSearchType] = useState(urlParams.get("type") || "pic");
  const [query, setQuery] = useState(urlParams.get("q") || "");
  const [inputQ, setInputQ] = useState(urlParams.get("q") || "");
  const [picResults, setPicResults] = useState<AiSearchResult[]>([]);
  const [lyricResults, setLyricResults] = useState<LyricResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async (type: string, q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setPicResults([]);
    setLyricResults([]);
    try {
      if (type === "pic") {
        const res = await fetch(API.picAiSearch("", q, 1, 30));
        const json = await res.json();
        if (json.status === 0) setPicResults(json.data || []);
      } else if (type === "lyric") {
        const res = await fetch(API.lyricSearch(q));
        const json = await res.json();
        if (json.status === 0) setLyricResults(json.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    setQuery(inputQ);
    doSearch(searchType, inputQ);
  };

  return (
    <MobileLayout title="搜索">
      <div style={{ padding: "12px" }}>
        {/* 搜索类型 Tab */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => { setSearchType("pic"); setPicResults([]); setLyricResults([]); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 20, fontSize: "0.82rem",
              fontWeight: searchType === "pic" ? 700 : 400, border: "none",
              background: searchType === "pic" ? "rgba(58,111,168,0.15)" : "rgba(240,248,255,0.8)",
              color: searchType === "pic" ? "rgb(30,70,140)" : "rgb(100,140,180)",
              cursor: "pointer",
            }}
          >
            🖼 AI搜图
          </button>
          <button
            onClick={() => { setSearchType("lyric"); setPicResults([]); setLyricResults([]); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 20, fontSize: "0.82rem",
              fontWeight: searchType === "lyric" ? 700 : 400, border: "none",
              background: searchType === "lyric" ? "rgba(58,111,168,0.15)" : "rgba(240,248,255,0.8)",
              color: searchType === "lyric" ? "rgb(30,70,140)" : "rgb(100,140,180)",
              cursor: "pointer",
            }}
          >
            🎵 歌词搜索
          </button>
        </div>

        {/* 搜索框 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={inputQ}
            onChange={e => setInputQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder={searchType === "pic" ? "描述图片内容，如：红色汉服" : "输入歌词关键词"}
            style={{
              flex: 1, height: 40, padding: "0 12px",
              borderRadius: 20, border: "1px solid rgba(160,200,230,0.6)",
              background: "rgba(255,255,255,0.9)", fontSize: "0.82rem",
              color: "rgb(50,80,120)", outline: "none",
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              height: 40, padding: "0 18px", borderRadius: 20,
              background: "rgba(58,111,168,0.85)", color: "white",
              border: "none", fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", flexShrink: 0,
            }}
          >
            搜索
          </button>
        </div>

        {/* 搜索说明 */}
        {!query && (
          <div style={{
            textAlign: "center", padding: "30px 20px",
            color: "rgb(140,170,200)", fontSize: "0.82rem", lineHeight: 1.8,
          }}>
            {searchType === "pic" ? (
              <>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🖼</div>
                <div>用自然语言描述图片内容</div>
                <div style={{ fontSize: "0.72rem", marginTop: 4, color: "rgb(160,185,210)" }}>
                  例如：红色汉服、春节写真、演唱会现场
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎵</div>
                <div>输入歌词片段进行搜索</div>
                <div style={{ fontSize: "0.72rem", marginTop: 4, color: "rgb(160,185,210)" }}>
                  例如：海边、星光、远山
                </div>
              </>
            )}
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "rgb(140,170,200)" }}>
            <div style={{ fontSize: "0.85rem" }}>搜索中...</div>
          </div>
        )}

        {/* AI搜图结果 */}
        {picResults.length > 0 && (
          <div>
            <div style={{ fontSize: "0.78rem", color: "rgb(100,140,180)", marginBottom: 8 }}>
              找到 {picResults.length} 张相关图片
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {picResults.map(r => (
                <Link key={r.id} href={`/picDetail?id=${r.set_id}`}>
                  <div style={{ borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "rgba(255,255,255,0.9)", boxShadow: "0 1px 5px rgba(80,140,200,0.1)" }}>
                    <img src={r.url} alt=""
                      style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <div style={{ padding: "4px 6px 6px", fontSize: "0.65rem", color: "rgb(120,150,185)" }}>
                      相似度 {Math.round(r.score * 100)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 歌词搜索结果 */}
        {lyricResults.length > 0 && (
          <div>
            <div style={{ fontSize: "0.78rem", color: "rgb(100,140,180)", marginBottom: 8 }}>
              找到 {lyricResults.length} 首相关歌曲
            </div>
            {lyricResults.map(r => (
              <Link key={r.music_id} href={`/musicDetail?id=${r.music_id}`}>
                <div style={{
                  background: "rgba(255,255,255,0.88)", borderRadius: 10, padding: "12px 14px",
                  marginBottom: 8, boxShadow: "0 1px 6px rgba(80,140,200,0.1)", cursor: "pointer",
                }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgb(58,42,90)", marginBottom: 6 }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgb(100,130,170)", lineHeight: 1.8 }}>
                    {r.lyrics.slice(0, 3).map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: "rgb(160,185,210)", flexShrink: 0 }}>{l.time_mark}</span>
                        <span>{l.text}</span>
                      </div>
                    ))}
                    {r.lyrics.length > 3 && (
                      <div style={{ color: "rgb(160,185,210)", marginTop: 2 }}>...共 {r.lyrics.length} 行匹配</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 无结果 */}
        {query && !loading && picResults.length === 0 && lyricResults.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "rgb(140,170,200)", fontSize: "0.82rem" }}>
            未找到相关结果，换个关键词试试
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
