// API service for yinlin.wiki
// All data fetched from https://api.yinlin.wiki

const BASE_URL = '/api';
const PIC_CDN = 'https://rwikipic.21hz.top/pic_service/pic';

export const API = {
  BASE: BASE_URL,
  // Activity (new endpoints)
  activityFilter: (params: Record<string, string | number>) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => p.append(k, String(v)));
    return `${BASE_URL}/activity/filter?${p.toString()}`;
  },
  activityHistory: () => `${BASE_URL}/activity/history`,

  // Activity
  activityFuture: () => `${BASE_URL}/activity/filter?time_type=future&page=1&size=100`,
  activityPast: () => `${BASE_URL}/activity/filter?time_type=past&page=1&size=200`,
  activityFutureOld: () => `${BASE_URL}/activity/future`,
  activityPastOld: () => `${BASE_URL}/activity/past`,
  activityDetail: (id: string) => `${BASE_URL}/activity/detail?id=${id}`,

  // Music
  musicLatest: () => `${BASE_URL}/music/latest`,
  musicFilter: (params: Record<string, string | number | string[]>) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach(item => p.append(k, item));
      } else {
        p.append(k, String(v));
      }
    });
    return `${BASE_URL}/music/filter?${p.toString()}`;
  },
  musicDetail: (id: string) => `${BASE_URL}/music/detail?id=${id}`,
  musicAttr: () => `${BASE_URL}/music/attr`,

  // Video
  videoLatest: () => `${BASE_URL}/video/latest`,
  videoFilter: (params: Record<string, string | number | string[]>) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach(item => p.append(k, item));
      } else {
        p.append(k, String(v));
      }
    });
    return `${BASE_URL}/video/filter?${p.toString()}`;
  },
  videoDetail: (id: string) => `${BASE_URL}/video/detail?id=${id}`,
  videoAttr: () => `${BASE_URL}/video/attr`,

  // Pic
  picLatest: () => `${BASE_URL}/pic/latest`,
  picFilter: (params: Record<string, string | number | string[]>) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach(item => p.append(k, item));
      } else {
        p.append(k, String(v));
      }
    });
    return `${BASE_URL}/pic/filter?${p.toString()}`;
  },
  picDetail: (id: string) => `${BASE_URL}/pic/detail?id=${id}`,
  picAttr: () => `${BASE_URL}/pic/attr`,
  picAiSearch: (type: string, q: string, page: number, size: number) => {
    const p = new URLSearchParams({ type, q, page: String(page), size: String(size) });
    return `${BASE_URL}/pic/ai_search?${p.toString()}`;
  },

  // Museum
  museumLatest: () => `${BASE_URL}/museum/latest`,
  museumFilter: (params: Record<string, string | number | string[]>) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach(item => p.append(k, item));
      } else {
        p.append(k, String(v));
      }
    });
    return `${BASE_URL}/museum/filter?${p.toString()}`;
  },
  museumDetail: (id: string) => `${BASE_URL}/museum/detail?id=${id}`,
  museumAttr: () => `${BASE_URL}/museum/attr`,

  // Lyric search
  lyricSearch: (q: string) => {
    const p = new URLSearchParams({ q });
    return `${BASE_URL}/lyric/search?${p.toString()}`;
  },
};

// ─── 全局内存缓存 ───────────────────────────────────────────────
// 缓存 API 响应，避免切换菜单时重复请求。
// 规则：detail 页（含 id= 参数）缓存 5 分钟，列表/latest 接口缓存 10 分钟。
// 用户刷新页面后缓存自动清空。
interface CacheEntry { data: unknown; expireAt: number; }
const _cache = new Map<string, CacheEntry>();

function getCacheTTL(url: string): number {
  // detail 接口数据量小，缓存时间短一些
  if (url.includes('id=')) return 5 * 60 * 1000;
  // 列表、latest、attr 等接口缓存 10 分钟
  return 10 * 60 * 1000;
}

// Generic fetch helper
export async function apiFetch<T>(url: string): Promise<T> {
  const now = Date.now();
  const cached = _cache.get(url);
  if (cached && cached.expireAt > now) {
    return cached.data as T;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  if (data.status !== 0) throw new Error(data.msg || 'API error');
  _cache.set(url, { data: data.data, expireAt: now + getCacheTTL(url) });
  return data.data as T;
}

// 手动清除指定 URL 的缓存（用于需要强制刷新的场景）
export function clearApiCache(url?: string): void {
  if (url) {
    _cache.delete(url);
  } else {
    _cache.clear();
  }
}

// Types
export interface Activity {
  id: string;
  name: string;
  note: string;
  time: string;
  pics: string[];
  url: string[];
  link: string[];
  music: string[];
}

export interface Music {
  id: string;
  name: string;
  music_type: string;
  language: string;
  solo: string;
  publish_time: string;
  album: string;
  pv_mv: string | null;
  platform: {
    netease: string | null;
    qq_music: string | null;
    bilibili: string | null;
    sing: string | null;
  };
  staff: Array<{ type: string; name: string }>;
  note: string;
  cover_url?: string;
  play_url?: string;
  lyric?: string;
}

export interface Video {
  id: string;
  name: string;
  publish_time: string;
  type: string;
  duration: number;
  cover: string;
  cover_url: string;
  sources: Array<{
    platform: string;
    aid?: string;
    bvid?: string;
    mid?: string;
  }>;
}

export interface PicSet {
  id: string;
  name: string;
  date: string;
  type: string;
  pics: string[];
  author?: string;
  tag?: string[];
  note?: string;
  cover_url?: string;
  pics_url?: string[];
}

export interface MuseumItem {
  id: string;
  name: string;
  note: string;
  publish_date: string;
  year: string;
  type: string;
  publish_method: string;
  cover: string;
  cover_url: string;
  item_count: number;
  item_types: string[];
  dimension?: { w: number; d: number; h: number };
  items?: Array<{
    id: string;
    type: string;
    image_url: string;
    filename: string;
  }>;
}

// Format duration
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Format date
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Get bilibili embed URL
export function getBilibiliEmbed(bvid: string): string {
  return `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0`;
}

// Get bilibili URL
export function getBilibiliUrl(bvid: string): string {
  return `https://www.bilibili.com/video/${bvid}`;
}

// Get weibo URL
export function getWeiboUrl(mid: string): string {
  return `https://weibo.com/${mid}`;
}

// Get activity pic URL
export function getActivityPicUrl(path: string): string {
  return `https://rwikipic.21hz.top/pic_service/pic?path=${encodeURIComponent(path)}&thumbnail=1`;
}
