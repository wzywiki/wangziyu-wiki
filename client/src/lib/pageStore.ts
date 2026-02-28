/**
 * pageStore.ts — 全局页面状态缓存
 *
 * 解决问题：React 组件每次挂载时 state 重置，导致切换页面时重新加载数据。
 * 方案：用 module-level 变量（进程内存）存储各页面的完整状态快照，
 *       组件挂载时恢复，卸载时保存，实现无感知的页面切换。
 */

// ─── 通用页面状态接口 ───────────────────────────────────────────
export interface PageState<TItem, TAttr, TFilter> {
  items: TItem[];
  attr: TAttr | null;
  filter: TFilter;
  page: number;
  finished: boolean;
  scrollY: number;
}

// ─── 各页面的筛选状态类型 ───────────────────────────────────────
export interface MusicFilter {
  search: string;
  album: string[];
  solo: string[];
}

export interface VideoFilter {
  search: string;
  type: string[];
  duration: string[];
  year: string[];
}

export interface PicFilter {
  search: string;
  type: string[];
  year: string[];
}

export interface MuseumFilter {
  search: string;
  type: string[];
  year: string[];
  method: string[];
}

// ─── 默认筛选状态 ───────────────────────────────────────────────
const defaultMusicFilter: MusicFilter = { search: "", album: [], solo: [] };
const defaultVideoFilter: VideoFilter = { search: "", type: [], duration: [], year: [] };
const defaultPicFilter: PicFilter = { search: "", type: [], year: [] };
const defaultMuseumFilter: MuseumFilter = { search: "", type: [], year: [], method: [] };

// ─── 全局状态存储（module-level，页面刷新才清空）────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store: Record<string, PageState<any, any, any>> = {};

function getStore<TItem, TAttr, TFilter>(
  key: string,
  defaultFilter: TFilter
): PageState<TItem, TAttr, TFilter> {
  if (!store[key]) {
    store[key] = {
      items: [],
      attr: null,
      filter: { ...defaultFilter } as TFilter,
      page: 1,
      finished: false,
      scrollY: 0,
    };
  }
  return store[key] as PageState<TItem, TAttr, TFilter>;
}

function setStore<TItem, TAttr, TFilter>(
  key: string,
  state: Partial<PageState<TItem, TAttr, TFilter>>
): void {
  if (!store[key]) return;
  Object.assign(store[key], state);
}

// ─── 各页面的 store 访问器 ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const musicStore = {
  get: <TItem, TAttr>() => getStore<TItem, TAttr, MusicFilter>("music", defaultMusicFilter),
  set: <TItem, TAttr>(s: Partial<PageState<TItem, TAttr, MusicFilter>>) => setStore("music", s),
  hasData: () => store["music"]?.items?.length > 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const videoStore = {
  get: <TItem, TAttr>() => getStore<TItem, TAttr, VideoFilter>("video", defaultVideoFilter),
  set: <TItem, TAttr>(s: Partial<PageState<TItem, TAttr, VideoFilter>>) => setStore("video", s),
  hasData: () => store["video"]?.items?.length > 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const picStore = {
  get: <TItem, TAttr>() => getStore<TItem, TAttr, PicFilter>("pic", defaultPicFilter),
  set: <TItem, TAttr>(s: Partial<PageState<TItem, TAttr, PicFilter>>) => setStore("pic", s),
  hasData: () => store["pic"]?.items?.length > 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const museumStore = {
  get: <TItem, TAttr>() => getStore<TItem, TAttr, MuseumFilter>("museum", defaultMuseumFilter),
  set: <TItem, TAttr>(s: Partial<PageState<TItem, TAttr, MuseumFilter>>) => setStore("museum", s),
  hasData: () => store["museum"]?.items?.length > 0,
};
