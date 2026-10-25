import { Bookmark, Category, ExportData, ImportDiff, ImportMode } from '../types';

const STORAGE_KEYS = {
  BOOKMARKS: 'bookmarkhub_bookmarks_v1',
  CATEGORIES: 'bookmarkhub_categories_v1',
  VIEW_MODE: 'bookmarkhub_view_mode',
  THEME_MODE: 'bookmarkhub_theme_mode',
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-ai', name: '人工智能', icon: 'Sparkles', order: 1, color: '#6366f1' },
  { id: 'cat-dev', name: '开发工具', icon: 'Code', order: 2, color: '#0ea5e9' },
  { id: 'cat-design', name: '设计资源', icon: 'Palette', order: 3, color: '#ec4899' },
  { id: 'cat-read', name: '资讯阅读', icon: 'BookOpen', order: 4, color: '#f59e0b' },
  { id: 'cat-work', name: '高效办公', icon: 'Zap', order: 5, color: '#10b981' },
];

const now = Date.now();
const hour = 3600 * 1000;
const day = 24 * hour;

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'bm-1',
    title: 'Google AI Studio',
    url: 'https://aistudio.google.com',
    categoryId: 'cat-ai',
    tags: ['AI', 'Gemini', 'API', '开发'],
    notes: 'Google 最新模型体验与原型开发平台，支持 Gemini 2.5/3.0 系列 API',
    isPinned: true,
    isStarred: true,
    clickCount: 42,
    lastClickedAt: now - 15 * 60 * 1000,
    createdAt: now - 30 * day,
    updatedAt: now - 30 * day,
    order: 1,
  },
  {
    id: 'bm-2',
    title: 'GitHub',
    url: 'https://github.com',
    categoryId: 'cat-dev',
    tags: ['代码托管', '开源', 'Git'],
    notes: '全球领先的软件开发与开源协作社区',
    isPinned: true,
    isStarred: true,
    clickCount: 88,
    lastClickedAt: now - 45 * 60 * 1000,
    createdAt: now - 40 * day,
    updatedAt: now - 40 * day,
    order: 2,
  },
  {
    id: 'bm-3',
    title: 'Hugging Face',
    url: 'https://huggingface.co',
    categoryId: 'cat-ai',
    tags: ['AI', '模型', '开源', '机器学习'],
    notes: '开源机器学习平台与模型社区',
    isPinned: false,
    isStarred: true,
    clickCount: 26,
    lastClickedAt: now - 2 * day,
    createdAt: now - 25 * day,
    updatedAt: now - 25 * day,
    order: 3,
  },
  {
    id: 'bm-4',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    categoryId: 'cat-dev',
    tags: ['CSS', '前端', '样式库'],
    notes: '高度可定制、效能优先的现代 CSS 框架',
    isPinned: false,
    isStarred: true,
    clickCount: 35,
    lastClickedAt: now - 1 * day,
    createdAt: now - 28 * day,
    updatedAt: now - 28 * day,
    order: 4,
  },
  {
    id: 'bm-5',
    title: 'Figma',
    url: 'https://www.figma.com',
    categoryId: 'cat-design',
    tags: ['UI设计', '协作', '原型'],
    notes: '基于浏览器的现代协同界面设计工具',
    isPinned: true,
    isStarred: true,
    clickCount: 64,
    lastClickedAt: now - 3 * hour,
    createdAt: now - 35 * day,
    updatedAt: now - 35 * day,
    order: 5,
  },
  {
    id: 'bm-6',
    title: 'Dribbble',
    url: 'https://dribbble.com',
    categoryId: 'cat-design',
    tags: ['灵感', '设计', '插画'],
    notes: '全球顶尖设计师与创意工作者的作品展示社区',
    isPinned: false,
    isStarred: false,
    clickCount: 19,
    lastClickedAt: now - 4 * day,
    createdAt: now - 20 * day,
    updatedAt: now - 20 * day,
    order: 6,
  },
  {
    id: 'bm-7',
    title: 'V2EX',
    url: 'https://v2ex.com',
    categoryId: 'cat-read',
    tags: ['社区', '技术', '讨论'],
    notes: '创意工作者讨论技术、数码与生活的社区',
    isPinned: false,
    isStarred: true,
    clickCount: 51,
    lastClickedAt: now - 5 * hour,
    createdAt: now - 32 * day,
    updatedAt: now - 32 * day,
    order: 7,
  },
  {
    id: 'bm-8',
    title: 'Hacker News',
    url: 'https://news.ycombinator.com',
    categoryId: 'cat-read',
    tags: ['资讯', '极客', '硅谷', '创业'],
    notes: 'Y Combinator 旗下的高质量科技热点讨论榜单',
    isPinned: false,
    isStarred: false,
    clickCount: 38,
    lastClickedAt: now - 12 * hour,
    createdAt: now - 30 * day,
    updatedAt: now - 30 * day,
    order: 8,
  },
  {
    id: 'bm-9',
    title: '少数派 sspai',
    url: 'https://sspai.com',
    categoryId: 'cat-read',
    tags: ['效率', '数码', '测评', '生活'],
    notes: '高质量数字生活指南与效率工具探讨平台',
    isPinned: false,
    isStarred: true,
    clickCount: 29,
    lastClickedAt: now - 1 * day,
    createdAt: now - 18 * day,
    updatedAt: now - 18 * day,
    order: 9,
  },
  {
    id: 'bm-10',
    title: 'Notion',
    url: 'https://notion.so',
    categoryId: 'cat-work',
    tags: ['笔记', '知识库', '项目管理'],
    notes: '一体化工作空间，融合笔记、任务看板与数据库',
    isPinned: true,
    isStarred: true,
    clickCount: 73,
    lastClickedAt: now - 2 * hour,
    createdAt: now - 45 * day,
    updatedAt: now - 45 * day,
    order: 10,
  },
  {
    id: 'bm-11',
    title: 'Linear',
    url: 'https://linear.app',
    categoryId: 'cat-work',
    tags: ['项目管理', 'Issue', '敏捷'],
    notes: '专为高性能技术团队打造的极速项目跟踪系统',
    isPinned: false,
    isStarred: false,
    clickCount: 22,
    lastClickedAt: now - 3 * day,
    createdAt: now - 14 * day,
    updatedAt: now - 14 * day,
    order: 11,
  },
  {
    id: 'bm-12',
    title: 'DevDocs',
    url: 'https://devdocs.io',
    categoryId: 'cat-dev',
    tags: ['文档', '查阅', '前端', '后端'],
    notes: '集合所有主流编程语言和框架的快速离线文档库',
    isPinned: false,
    isStarred: true,
    clickCount: 31,
    lastClickedAt: now - 18 * hour,
    createdAt: now - 22 * day,
    updatedAt: now - 22 * day,
    order: 12,
  },
  {
    id: 'bm-13',
    title: 'Excalidraw',
    url: 'https://excalidraw.com',
    categoryId: 'cat-work',
    tags: ['白板', '手绘', '架构图', '工具'],
    notes: '虚拟手绘风格白板，极简轻便且支持多人实时协同',
    isPinned: false,
    isStarred: false,
    clickCount: 15,
    lastClickedAt: now - 5 * day,
    createdAt: now - 12 * day,
    updatedAt: now - 12 * day,
    order: 13,
  },
  {
    id: 'bm-14',
    title: 'Iconify',
    url: 'https://iconify.design',
    categoryId: 'cat-design',
    tags: ['图标', 'SVG', '资源'],
    notes: '统一图标框架，收录超过 200,000 个开源矢量图标',
    isPinned: false,
    isStarred: false,
    clickCount: 18,
    lastClickedAt: now - 6 * day,
    createdAt: now - 10 * day,
    updatedAt: now - 10 * day,
    order: 14,
  },
];

export function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_CATEGORIES;
  } catch (e) {
    console.error('Failed to load categories from localStorage:', e);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories to localStorage:', e);
  }
}

export function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!raw) {
      saveBookmarks(DEFAULT_BOOKMARKS);
      return DEFAULT_BOOKMARKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_BOOKMARKS;
  } catch (e) {
    console.error('Failed to load bookmarks from localStorage:', e);
    return DEFAULT_BOOKMARKS;
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Failed to save bookmarks to localStorage:', e);
  }
}

export function exportDataAsJSON(bookmarks: Bookmark[], categories: Category[]): void {
  const exportPayload: ExportData = {
    version: '1.0',
    exportedAt: Date.now(),
    source: '轻藏 BookmarkHub',
    categories,
    bookmarks,
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `bookmarkhub_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Standardize URL for deduplication comparison (ignore trailing slash and protocol differences where reasonable)
 */
export function normalizeUrl(url: string): string {
  try {
    const trimmed = url.trim().toLowerCase();
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    let host = parsed.hostname.replace(/^www\./, '');
    let path = parsed.pathname.replace(/\/+$/, '');
    let search = parsed.search;
    return `${host}${path}${search}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Compare imported data with current bookmarks to generate diff preview
 */
export function calculateImportDiff(
  rawJson: string,
  currentBookmarks: Bookmark[],
  currentCategories: Category[]
): ImportDiff {
  try {
    const parsed = JSON.parse(rawJson);
    let incomingBookmarks: Bookmark[] = [];
    let incomingCategories: Category[] = [];

    // Support both full export schema and raw array of bookmarks
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.bookmarks)) {
        incomingBookmarks = parsed.bookmarks;
        if (Array.isArray(parsed.categories)) {
          incomingCategories = parsed.categories;
        }
      } else if (Array.isArray(parsed)) {
        incomingBookmarks = parsed;
      }
    }

    if (!Array.isArray(incomingBookmarks) || incomingBookmarks.length === 0) {
      return {
        newBookmarks: [],
        conflicts: [],
        unchangedBookmarks: [],
        totalIncoming: 0,
        incomingCategories: [],
        isFormatValid: false,
        errorMessage: '文件格式不正确或未包含任何有效书签数据',
      };
    }

    const currentMapByUrl = new Map<string, Bookmark>();
    for (const bm of currentBookmarks) {
      currentMapByUrl.set(normalizeUrl(bm.url), bm);
    }

    const newBookmarks: Bookmark[] = [];
    const conflicts: { existing: Bookmark; incoming: Bookmark }[] = [];
    const unchangedBookmarks: Bookmark[] = [];

    for (const item of incomingBookmarks) {
      if (!item.url || typeof item.url !== 'string') continue;
      const normalized = normalizeUrl(item.url);
      const existing = currentMapByUrl.get(normalized);

      if (!existing) {
        newBookmarks.push(item);
      } else {
        // Check if there are differences
        const hasDiff =
          existing.title !== item.title ||
          existing.notes !== item.notes ||
          existing.categoryId !== item.categoryId ||
          existing.isPinned !== item.isPinned ||
          existing.isStarred !== item.isStarred ||
          JSON.stringify(existing.tags || []) !== JSON.stringify(item.tags || []);

        if (hasDiff) {
          conflicts.push({ existing, incoming: item });
        } else {
          unchangedBookmarks.push(item);
        }
      }
    }

    return {
      newBookmarks,
      conflicts,
      unchangedBookmarks,
      totalIncoming: incomingBookmarks.length,
      incomingCategories,
      isFormatValid: true,
    };
  } catch (err: any) {
    return {
      newBookmarks: [],
      conflicts: [],
      unchangedBookmarks: [],
      totalIncoming: 0,
      incomingCategories: [],
      isFormatValid: false,
      errorMessage: err?.message || 'JSON 解析失败',
    };
  }
}

/**
 * Execute import with selected mode:
 * 1. append: only add new non-duplicate bookmarks
 * 2. merge: update existing conflicting bookmarks with incoming, add new bookmarks
 * 3. overwrite: clear current bookmarks and categories, replace completely
 */
export function executeImport(
  diff: ImportDiff,
  mode: ImportMode,
  currentBookmarks: Bookmark[],
  currentCategories: Category[]
): {
  bookmarks: Bookmark[];
  categories: Category[];
  addedCount: number;
  updatedCount: number;
} {
  // Merge categories if incoming has new categories
  let updatedCategories = [...currentCategories];
  if (mode === 'overwrite' && diff.incomingCategories.length > 0) {
    updatedCategories = diff.incomingCategories;
  } else if (diff.incomingCategories.length > 0) {
    const existingCatNames = new Set(currentCategories.map((c) => c.name.toLowerCase()));
    const existingCatIds = new Set(currentCategories.map((c) => c.id));
    for (const inCat of diff.incomingCategories) {
      if (!existingCatNames.has(inCat.name.toLowerCase()) && !existingCatIds.has(inCat.id)) {
        updatedCategories.push({
          ...inCat,
          id: inCat.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        });
      }
    }
  }

  const defaultCatId = updatedCategories[0]?.id || 'cat-dev';

  if (mode === 'overwrite') {
    // Sanitize incoming bookmarks
    const sanitized = [
      ...diff.newBookmarks,
      ...diff.conflicts.map((c) => c.incoming),
      ...diff.unchangedBookmarks,
    ].map((b, idx) => ({
      ...b,
      id: b.id || `bm-import-${Date.now()}-${idx}`,
      categoryId: updatedCategories.some((c) => c.id === b.categoryId) ? b.categoryId : defaultCatId,
      clickCount: typeof b.clickCount === 'number' ? b.clickCount : 0,
      createdAt: b.createdAt || Date.now(),
      updatedAt: Date.now(),
      order: idx + 1,
    }));

    return {
      bookmarks: sanitized,
      categories: updatedCategories,
      addedCount: sanitized.length,
      updatedCount: 0,
    };
  }

  if (mode === 'append') {
    // Only add new bookmarks that do not match existing URLs
    const sanitizedNew = diff.newBookmarks.map((b, idx) => ({
      ...b,
      id: `bm-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      categoryId: updatedCategories.some((c) => c.id === b.categoryId) ? b.categoryId : defaultCatId,
      clickCount: typeof b.clickCount === 'number' ? b.clickCount : 0,
      createdAt: b.createdAt || Date.now(),
      updatedAt: Date.now(),
      order: currentBookmarks.length + idx + 1,
    }));

    return {
      bookmarks: [...currentBookmarks, ...sanitizedNew],
      categories: updatedCategories,
      addedCount: sanitizedNew.length,
      updatedCount: 0,
    };
  }

  // mode === 'merge'
  const updateMap = new Map<string, Bookmark>();
  for (const { incoming } of diff.conflicts) {
    updateMap.set(normalizeUrl(incoming.url), incoming);
  }

  let updatedCount = 0;
  const mergedBookmarks = currentBookmarks.map((b) => {
    const incomingMatch = updateMap.get(normalizeUrl(b.url));
    if (incomingMatch) {
      updatedCount++;
      return {
        ...b,
        title: incomingMatch.title || b.title,
        notes: incomingMatch.notes !== undefined ? incomingMatch.notes : b.notes,
        categoryId: updatedCategories.some((c) => c.id === incomingMatch.categoryId)
          ? incomingMatch.categoryId
          : b.categoryId,
        tags: Array.from(new Set([...(b.tags || []), ...(incomingMatch.tags || [])])),
        isPinned: incomingMatch.isPinned ?? b.isPinned,
        isStarred: incomingMatch.isStarred ?? b.isStarred,
        updatedAt: Date.now(),
      };
    }
    return b;
  });

  const sanitizedNew = diff.newBookmarks.map((b, idx) => ({
    ...b,
    id: `bm-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    categoryId: updatedCategories.some((c) => c.id === b.categoryId) ? b.categoryId : defaultCatId,
    clickCount: typeof b.clickCount === 'number' ? b.clickCount : 0,
    createdAt: b.createdAt || Date.now(),
    updatedAt: Date.now(),
    order: mergedBookmarks.length + idx + 1,
  }));

  return {
    bookmarks: [...mergedBookmarks, ...sanitizedNew],
    categories: updatedCategories,
    addedCount: sanitizedNew.length,
    updatedCount,
  };
}
