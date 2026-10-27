import {
  Bookmark,
  Category,
  ExportData,
  ImportDiff,
  ImportMode,
  SystemSettings,
  CustomShortcuts,
  SystemConfigBackup,
  FullBackupData,
} from '../types';

const STORAGE_KEYS = {
  BOOKMARKS: 'bookmarkhub_bookmarks_v1',
  CATEGORIES: 'bookmarkhub_categories_v2',
  VIEW_MODE: 'bookmarkhub_view_mode',
  THEME_MODE: 'bookmarkhub_theme_mode',
  SYSTEM_SETTINGS: 'bookmarkhub_system_settings_v1',
};

export const DEFAULT_CATEGORIES: Category[] = [
  // 1. 人工智能
  {
    id: 'cat-ai',
    name: '人工智能',
    icon: 'Sparkles',
    order: 1,
    color: '#6366f1',
    parentId: null,
    cover: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 50%, #06b6d4 100%)',
      textColor: 'light',
    },
    subViewOverride: 'expanded',
  },
  { id: 'cat-ai-chat', name: '大模型与交互', icon: 'Sparkles', order: 2, color: '#6366f1', parentId: 'cat-ai' },
  { id: 'cat-ai-models', name: '开源模型社区', icon: 'Cpu', order: 3, color: '#6366f1', parentId: 'cat-ai' },

  // 2. 开发工具
  {
    id: 'cat-dev',
    name: '开发工具',
    icon: 'Code',
    order: 4,
    color: '#0ea5e9',
    parentId: null,
    cover: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0ea5e9 100%)',
      textColor: 'light',
    },
    subViewOverride: 'expanded',
  },
  { id: 'cat-dev-repo', name: '代码托管协作', icon: 'Code', order: 5, color: '#0ea5e9', parentId: 'cat-dev' },
  { id: 'cat-dev-frontend', name: '前端与框架', icon: 'Layers', order: 6, color: '#0ea5e9', parentId: 'cat-dev' },
  { id: 'cat-dev-docs', name: '技术离线文档', icon: 'Terminal', order: 7, color: '#0ea5e9', parentId: 'cat-dev' },

  // 3. 设计资源
  {
    id: 'cat-design',
    name: '设计资源',
    icon: 'Palette',
    order: 8,
    color: '#ec4899',
    parentId: null,
    cover: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #ea580c 0%, #db2777 50%, #7c3aed 100%)',
      textColor: 'light',
    },
    subViewOverride: 'expanded',
  },
  { id: 'cat-design-ui', name: '界面与原型协同', icon: 'Palette', order: 9, color: '#ec4899', parentId: 'cat-design' },
  { id: 'cat-design-inspire', name: '创意灵感社区', icon: 'Compass', order: 10, color: '#ec4899', parentId: 'cat-design' },

  // 4. 资讯阅读
  {
    id: 'cat-read',
    name: '资讯阅读',
    icon: 'BookOpen',
    order: 11,
    color: '#f59e0b',
    parentId: null,
    cover: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
      textColor: 'light',
    },
    subViewOverride: 'expanded',
  },
  { id: 'cat-read-tech', name: '开发者技术社区', icon: 'Globe', order: 12, color: '#f59e0b', parentId: 'cat-read' },
  { id: 'cat-read-news', name: '极客与数字生活', icon: 'BookOpen', order: 13, color: '#f59e0b', parentId: 'cat-read' },

  // 5. 高效办公
  {
    id: 'cat-work',
    name: '高效办公',
    icon: 'Zap',
    order: 14,
    color: '#10b981',
    parentId: null,
    cover: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)',
      textColor: 'light',
    },
    subViewOverride: 'expanded',
  },
  { id: 'cat-work-collab', name: '协同项目管理', icon: 'Zap', order: 15, color: '#10b981', parentId: 'cat-work' },
  { id: 'cat-work-whiteboard', name: '白板与思维工具', icon: 'Coffee', order: 16, color: '#10b981', parentId: 'cat-work' },
];

const now = Date.now();
const hour = 3600 * 1000;
const day = 24 * hour;

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'bm-1',
    title: 'Google AI Studio',
    url: 'https://aistudio.google.com',
    categoryId: 'cat-ai-chat',
    tags: ['AI', 'Gemini', 'API', '开发'],
    notes: 'Google 最新模型体验与原型开发平台，支持 Gemini 2.5/3.0 系列 API',
    isPinned: true,
    isStarred: true,
    clickCount: 42,
    lastClickedAt: now - 15 * 60 * 1000,
    createdAt: now - 30 * day,
    updatedAt: now - 30 * day,
    order: 1,
    color: '#3b82f6',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bm-2',
    title: 'GitHub',
    url: 'https://github.com',
    categoryId: 'cat-dev-repo',
    tags: ['代码托管', '开源', 'Git'],
    notes: '全球领先的软件开发与开源协作社区',
    isPinned: true,
    isStarred: true,
    clickCount: 88,
    lastClickedAt: now - 45 * 60 * 1000,
    createdAt: now - 40 * day,
    updatedAt: now - 40 * day,
    order: 2,
    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bm-3',
    title: 'Hugging Face',
    url: 'https://huggingface.co',
    categoryId: 'cat-ai-models',
    tags: ['AI', '模型', '开源', '机器学习'],
    notes: '开源机器学习平台与模型社区',
    isPinned: false,
    isStarred: true,
    clickCount: 26,
    lastClickedAt: now - 2 * day,
    createdAt: now - 25 * day,
    updatedAt: now - 25 * day,
    order: 3,
    color: '#f59e0b',
  },
  {
    id: 'bm-4',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    categoryId: 'cat-dev-frontend',
    tags: ['CSS', '前端', '样式库'],
    notes: '高度可定制、效能优先的现代 CSS 框架',
    isPinned: false,
    isStarred: true,
    clickCount: 35,
    lastClickedAt: now - 1 * day,
    createdAt: now - 28 * day,
    updatedAt: now - 28 * day,
    order: 4,
    color: '#06b6d4',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bm-5',
    title: 'Figma',
    url: 'https://www.figma.com',
    categoryId: 'cat-design-ui',
    tags: ['UI设计', '协作', '原型'],
    notes: '基于浏览器的现代协同界面设计工具',
    isPinned: true,
    isStarred: true,
    clickCount: 64,
    lastClickedAt: now - 3 * hour,
    createdAt: now - 35 * day,
    updatedAt: now - 35 * day,
    order: 5,
    color: '#ec4899',
    coverImage: 'https://images.unsplash.com/photo-1581291518655-9523c932ecae?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bm-6',
    title: 'Dribbble',
    url: 'https://dribbble.com',
    categoryId: 'cat-design-inspire',
    tags: ['灵感', '设计', '插画'],
    notes: '全球顶尖设计师与创意工作者的作品展示社区',
    isPinned: false,
    isStarred: false,
    clickCount: 19,
    lastClickedAt: now - 4 * day,
    createdAt: now - 20 * day,
    updatedAt: now - 20 * day,
    order: 6,
    color: '#8b5cf6',
    coverImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bm-7',
    title: 'V2EX',
    url: 'https://v2ex.com',
    categoryId: 'cat-read-tech',
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
    categoryId: 'cat-read-news',
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
    categoryId: 'cat-read-news',
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
    categoryId: 'cat-work-collab',
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
    categoryId: 'cat-work-collab',
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
    categoryId: 'cat-dev-docs',
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
    categoryId: 'cat-work-whiteboard',
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
    categoryId: 'cat-design-ui',
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
  {
    id: 'bm-15',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    categoryId: 'cat-dev-docs',
    tags: ['Web', 'JavaScript', 'HTML', '学习'],
    notes: '面向 Web 开发者的权威开放技术文档，包含 HTML5、CSS 与现代 JS 参考',
    isPinned: false,
    isStarred: true,
    clickCount: 0,
    lastClickedAt: null,
    createdAt: now - 15 * day,
    updatedAt: now - 15 * day,
    order: 15,
  },
  {
    id: 'bm-16',
    title: 'Can I use',
    url: 'https://caniuse.com',
    categoryId: 'cat-dev-frontend',
    tags: ['前端', '浏览器兼容性', 'HTML5', 'CSS3'],
    notes: '现代浏览器对前端技术标准支持度速查表，开发必备',
    isPinned: false,
    isStarred: false,
    clickCount: 0,
    lastClickedAt: null,
    createdAt: now - 8 * day,
    updatedAt: now - 8 * day,
    order: 16,
  },
  {
    id: 'bm-17',
    title: 'CSS Tricks (经典技术归档)',
    url: 'https://css-tricks.com',
    categoryId: 'cat-dev-frontend',
    tags: ['CSS', '前端', '技巧'],
    notes: '早期经典前端 CSS 教程，超过 6 个月（200 天）未曾翻阅',
    isPinned: false,
    isStarred: false,
    clickCount: 2,
    lastClickedAt: now - 200 * day,
    createdAt: now - 220 * day,
    updatedAt: now - 200 * day,
    order: 17,
  },
  {
    id: 'bm-18',
    title: 'Sublime Text 官网',
    url: 'https://www.sublimetext.com',
    categoryId: 'cat-dev-repo',
    tags: ['编辑器', '轻量', '代码'],
    notes: '历史收藏的极速代码文本编辑器，长达 230 天未曾点击',
    isPinned: false,
    isStarred: false,
    clickCount: 0,
    lastClickedAt: null,
    createdAt: now - 230 * day,
    updatedAt: now - 230 * day,
    order: 18,
  },
];

export interface CategoryTreeItem extends Category {
  children: Category[];
}

/**
 * Build 2-level category hierarchy:
 * Root categories (parentId === null or undefined), with their nested subcategories
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeItem[] {
  const rootCategories: CategoryTreeItem[] = [];
  const childrenMap = new Map<string, Category[]>();

  // Sort by order first
  const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const cat of sorted) {
    if (cat.parentId) {
      if (!childrenMap.has(cat.parentId)) {
        childrenMap.set(cat.parentId, []);
      }
      childrenMap.get(cat.parentId)!.push(cat);
    } else {
      rootCategories.push({
        ...cat,
        children: [],
      });
    }
  }

  // Attach children
  for (const root of rootCategories) {
    root.children = childrenMap.get(root.id) || [];
  }

  // Handle any orphaned categories whose parentId doesn't exist
  const rootIds = new Set(rootCategories.map((r) => r.id));
  for (const [parentId, orphans] of childrenMap.entries()) {
    if (!rootIds.has(parentId)) {
      for (const orphan of orphans) {
        rootCategories.push({
          ...orphan,
          parentId: null,
          children: [],
        });
      }
    }
  }

  return rootCategories;
}

/**
 * Get all category IDs including target and its subcategory children
 */
export function getCategoryWithChildrenIds(categoryId: string, categories: Category[]): string[] {
  const ids = [categoryId];
  for (const cat of categories) {
    if (cat.parentId === categoryId) {
      ids.push(cat.id);
    }
  }
  return ids;
}

/**
 * Get category breadcrumb path: parent -> current, or just current
 */
export function getCategoryBreadcrumb(
  categoryId: string | null,
  categories: Category[]
): { parent?: Category; current?: Category } {
  if (!categoryId) return {};
  const current = categories.find((c) => c.id === categoryId);
  if (!current) return {};

  if (current.parentId) {
    const parent = categories.find((c) => c.id === current.parentId);
    return { parent, current };
  }

  return { current };
}

export function loadCategories(): Category[] {
  try {
    // Try V2 first, fallback to V1 with migration
    const rawV2 = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c) => ({
          ...c,
          parentId: c.parentId || null,
        }));
      }
    }

    const rawV1 = localStorage.getItem('bookmarkhub_categories_v1');
    if (rawV1) {
      const parsed = JSON.parse(rawV1);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade with 2-level defaults if user had the 5 basic ones
        if (parsed.length === 5 && !parsed.some((c) => c.parentId)) {
          saveCategories(DEFAULT_CATEGORIES);
          return DEFAULT_CATEGORIES;
        }
        const upgraded = parsed.map((c) => ({
          ...c,
          parentId: c.parentId || null,
        }));
        saveCategories(upgraded);
        return upgraded;
      }
    }

    saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  } catch (e) {
    console.error('Failed to load categories from localStorage:', e);
    return DEFAULT_CATEGORIES;
  }
}

export function hasLocalSavedBookmarks(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
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

export interface InitialDataResult {
  bookmarks: Bookmark[];
  categories: Category[];
  settings?: SystemSettings;
  source: 'local' | 'linksconfig' | 'builtin';
}

/**
 * Loads system bookmarks and categories on startup:
 * 1. If local storage already has bookmarks saved and updated, use local saved data.
 * 2. If first time opening and no local data found:
 *    - Try loading from linksconfig.json in the system directory.
 *    - If linksconfig.json is missing or format is invalid, fall back to built-in demo data.
 * 3. Save the loaded data to localStorage for future sessions.
 */
export async function loadInitialSystemData(): Promise<InitialDataResult> {
  // If local storage already has bookmarks saved, respect the user's updated local data
  if (hasLocalSavedBookmarks()) {
    return {
      bookmarks: loadBookmarks(),
      categories: loadCategories(),
      source: 'local',
    };
  }

  // First time open & no local data detected!
  // 1. Try loading from linksconfig.json in the system directory
  try {
    const response = await fetch('/linksconfig.json', { cache: 'no-cache' });
    if (response.ok) {
      const rawText = await response.text();
      const validation = validateAndParseBackupFile(rawText);
      if (validation.isValid && validation.parsedData) {
        let loadedBookmarks: Bookmark[] = [];
        let loadedCategories: Category[] = DEFAULT_CATEGORIES;
        let loadedSettings: SystemSettings | undefined = undefined;

        if (validation.type === 'full') {
          loadedBookmarks = Array.isArray(validation.parsedData.bookmarks)
            ? validation.parsedData.bookmarks
            : [];
          if (
            Array.isArray(validation.parsedData.categories) &&
            validation.parsedData.categories.length > 0
          ) {
            loadedCategories = validation.parsedData.categories;
          }
          loadedSettings = validation.parsedData.settings;
        } else if (validation.type === 'bookmarks') {
          loadedBookmarks = Array.isArray(validation.parsedData.bookmarks)
            ? validation.parsedData.bookmarks
            : [];
          if (
            Array.isArray(validation.parsedData.categories) &&
            validation.parsedData.categories.length > 0
          ) {
            loadedCategories = validation.parsedData.categories;
          }
        }

        if (loadedBookmarks.length > 0) {
          // Synchronize to localStorage
          saveBookmarks(loadedBookmarks);
          saveCategories(loadedCategories);
          if (loadedSettings) {
            saveSystemSettings(loadedSettings);
          }
          return {
            bookmarks: loadedBookmarks,
            categories: loadedCategories,
            settings: loadedSettings,
            source: 'linksconfig',
          };
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load linksconfig.json, falling back to built-in demo data:', err);
  }

  // 2. If linksconfig.json not found or format invalid, fall back to built-in demo data
  saveBookmarks(DEFAULT_BOOKMARKS);
  saveCategories(DEFAULT_CATEGORIES);
  return {
    bookmarks: DEFAULT_BOOKMARKS,
    categories: DEFAULT_CATEGORIES,
    source: 'builtin',
  };
}

export function exportDataAsJSON(bookmarks: Bookmark[], categories: Category[]): void {
  const exportPayload: ExportData = {
    version: '2.0',
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
          existing.color !== item.color ||
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
    updatedCategories = diff.incomingCategories.map((c) => ({
      ...c,
      parentId: c.parentId || null,
    }));
  } else if (diff.incomingCategories.length > 0) {
    const existingCatNames = new Set(currentCategories.map((c) => c.name.toLowerCase()));
    const existingCatIds = new Set(currentCategories.map((c) => c.id));
    for (const inCat of diff.incomingCategories) {
      if (!existingCatNames.has(inCat.name.toLowerCase()) && !existingCatIds.has(inCat.id)) {
        updatedCategories.push({
          ...inCat,
          id: inCat.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          parentId: inCat.parentId || null,
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
        color: incomingMatch.color !== undefined ? incomingMatch.color : b.color,
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

// ==========================================
// 6-Month Inactive Bookmarks Archiving Helpers
// ==========================================

export const ARCHIVED_CATEGORY_ID = 'cat-archived';

export const ARCHIVED_CATEGORY: Category = {
  id: ARCHIVED_CATEGORY_ID,
  name: '已归档',
  icon: 'Archive',
  order: 999,
  color: '#71717a',
  parentId: null,
  description: '超过 6 个月未访问的归档书签',
};

// 6 months in milliseconds (180 days)
export const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * Check if a bookmark has had no clicks in the last 6 months
 */
export function isBookmarkInactiveSixMonths(
  bookmark: Bookmark,
  nowTimestamp: number = Date.now()
): boolean {
  // If already in archived category, skip
  if (bookmark.categoryId === ARCHIVED_CATEGORY_ID) {
    return false;
  }
  // If clicked before, check lastClickedAt
  if (bookmark.lastClickedAt) {
    return nowTimestamp - bookmark.lastClickedAt >= SIX_MONTHS_MS;
  }
  // If never clicked, check if created at least 6 months ago
  return nowTimestamp - (bookmark.createdAt || 0) >= SIX_MONTHS_MS;
}

/**
 * Get all bookmarks that have had no clicks in the last 6 months
 */
export function getInactiveBookmarks(
  bookmarks: Bookmark[],
  nowTimestamp: number = Date.now()
): Bookmark[] {
  return bookmarks.filter((b) => isBookmarkInactiveSixMonths(b, nowTimestamp));
}

/**
 * Automatically move bookmarks with no clicks in the last 6 months into the 'Archived' category
 */
export function archiveInactiveBookmarks(
  bookmarks: Bookmark[],
  categories: Category[],
  nowTimestamp: number = Date.now()
): {
  updatedBookmarks: Bookmark[];
  updatedCategories: Category[];
  archivedBookmarks: Bookmark[];
  archivedCount: number;
} {
  const inactiveBookmarks = getInactiveBookmarks(bookmarks, nowTimestamp);
  if (inactiveBookmarks.length === 0) {
    return {
      updatedBookmarks: bookmarks,
      updatedCategories: categories,
      archivedBookmarks: [],
      archivedCount: 0,
    };
  }

  // Ensure '已归档' category exists in categories
  let updatedCategories = [...categories];
  const existingArchivedCat = updatedCategories.find(
    (c) => c.id === ARCHIVED_CATEGORY_ID || c.name === '已归档'
  );
  let targetCatId = ARCHIVED_CATEGORY_ID;

  if (!existingArchivedCat) {
    updatedCategories.push(ARCHIVED_CATEGORY);
  } else {
    targetCatId = existingArchivedCat.id;
  }

  const inactiveIdSet = new Set(inactiveBookmarks.map((b) => b.id));

  const updatedBookmarks = bookmarks.map((b) => {
    if (inactiveIdSet.has(b.id)) {
      return {
        ...b,
        categoryId: targetCatId,
        updatedAt: nowTimestamp,
      };
    }
    return b;
  });

  return {
    updatedBookmarks,
    updatedCategories,
    archivedBookmarks: inactiveBookmarks,
    archivedCount: inactiveBookmarks.length,
  };
}

// ==========================================
// System Settings Persistence
// ==========================================

export const DEFAULT_CUSTOM_SHORTCUTS: CustomShortcuts = {
  search: 'k',
  newBookmark: 'n',
  toggleTheme: 't',
  openAdmin: 'm',
  toggleView: 'v',
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  defaultTheme: 'system',
  defaultViewMode: 'card',
  enableDailyPicks: true,
  defaultSortOption: 'custom',
  defaultSubCategoriesView: 'expanded',
  openInNewTab: true,
  autoArchiveMonths: 6,
  customShortcuts: DEFAULT_CUSTOM_SHORTCUTS,
  showCardOgImage: true,
};

export function loadSystemSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...parsed,
        showCardOgImage:
          parsed.showCardOgImage !== undefined
            ? Boolean(parsed.showCardOgImage)
            : DEFAULT_SYSTEM_SETTINGS.showCardOgImage,
        customShortcuts: {
          ...DEFAULT_CUSTOM_SHORTCUTS,
          ...(parsed.customShortcuts || {}),
        },
      };
    }
  } catch (e) {
    console.error('Failed to load system settings', e);
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

export function saveSystemSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save system settings', e);
  }
}

// ==========================================
// Tag Management Helpers
// ==========================================

export interface TagStat {
  name: string;
  count: number;
  lastUsedAt?: number;
}

export function getTagStatistics(bookmarks: Bookmark[]): TagStat[] {
  const map = new Map<string, { count: number; lastUsedAt?: number }>();
  for (const b of bookmarks) {
    if (Array.isArray(b.tags)) {
      for (const t of b.tags) {
        const clean = t.trim();
        if (!clean) continue;
        const existing = map.get(clean) || { count: 0, lastUsedAt: b.updatedAt || b.createdAt };
        existing.count += 1;
        const bookmarkTime = b.updatedAt || b.createdAt;
        if (bookmarkTime && (!existing.lastUsedAt || bookmarkTime > existing.lastUsedAt)) {
          existing.lastUsedAt = bookmarkTime;
        }
        map.set(clean, existing);
      }
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({ name, count: data.count, lastUsedAt: data.lastUsedAt }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function renameTagInBookmarks(oldTag: string, newTag: string, bookmarks: Bookmark[]): Bookmark[] {
  const cleanOld = oldTag.trim();
  const cleanNew = newTag.trim().replace(/^#/, '');
  if (!cleanOld || !cleanNew) return bookmarks;
  const now = Date.now();
  return bookmarks.map((b) => {
    if (b.tags && b.tags.includes(cleanOld)) {
      const updatedTags = Array.from(new Set(b.tags.map((t) => (t === cleanOld ? cleanNew : t))));
      return {
        ...b,
        tags: updatedTags,
        updatedAt: now,
      };
    }
    return b;
  });
}

export function deleteTagFromBookmarks(tagToDelete: string, bookmarks: Bookmark[]): Bookmark[] {
  const clean = tagToDelete.trim();
  if (!clean) return bookmarks;
  const now = Date.now();
  return bookmarks.map((b) => {
    if (b.tags && b.tags.includes(clean)) {
      return {
        ...b,
        tags: b.tags.filter((t) => t !== clean),
        updatedAt: now,
      };
    }
    return b;
  });
}

export function mergeTagsInBookmarks(sourceTag: string, targetTag: string, bookmarks: Bookmark[]): Bookmark[] {
  return renameTagInBookmarks(sourceTag, targetTag, bookmarks);
}

// ==========================================
// Batch Bookmark Operations
// ==========================================

export function batchUpdateCategory(
  bookmarkIds: string[],
  targetCategoryId: string,
  bookmarks: Bookmark[]
): Bookmark[] {
  const idSet = new Set(bookmarkIds);
  const now = Date.now();
  return bookmarks.map((b) => {
    if (idSet.has(b.id)) {
      return { ...b, categoryId: targetCategoryId, updatedAt: now };
    }
    return b;
  });
}

export function batchAddTags(
  bookmarkIds: string[],
  tagsToAdd: string[],
  bookmarks: Bookmark[]
): Bookmark[] {
  const idSet = new Set(bookmarkIds);
  const cleanTags = tagsToAdd.map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
  if (cleanTags.length === 0) return bookmarks;
  const now = Date.now();
  return bookmarks.map((b) => {
    if (idSet.has(b.id)) {
      const merged = Array.from(new Set([...(b.tags || []), ...cleanTags]));
      return { ...b, tags: merged, updatedAt: now };
    }
    return b;
  });
}

export function batchRemoveTags(
  bookmarkIds: string[],
  tagsToRemove: string[],
  bookmarks: Bookmark[]
): Bookmark[] {
  const idSet = new Set(bookmarkIds);
  const removeSet = new Set(tagsToRemove.map((t) => t.trim().replace(/^#/, '')));
  if (removeSet.size === 0) return bookmarks;
  const now = Date.now();
  return bookmarks.map((b) => {
    if (idSet.has(b.id)) {
      const filtered = (b.tags || []).filter((t) => !removeSet.has(t));
      return { ...b, tags: filtered, updatedAt: now };
    }
    return b;
  });
}

export function batchUpdateColor(
  bookmarkIds: string[],
  color: string | undefined,
  bookmarks: Bookmark[]
): Bookmark[] {
  const idSet = new Set(bookmarkIds);
  const now = Date.now();
  return bookmarks.map((b) => {
    if (idSet.has(b.id)) {
      return { ...b, color: color || undefined, updatedAt: now };
    }
    return b;
  });
}

export function batchTogglePin(
  bookmarkIds: string[],
  isPinned: boolean,
  bookmarks: Bookmark[]
): Bookmark[] {
  const idSet = new Set(bookmarkIds);
  const now = Date.now();
  return bookmarks.map((b) => {
    if (idSet.has(b.id)) {
      return { ...b, isPinned, updatedAt: now };
    }
    return b;
  });
}

export function batchToggleStar(
  bookmarkIds: string[],
  isStarred: boolean,
  bookmarks: Bookmark[]
): Bookmark[] {
  const idSet = new Set(bookmarkIds);
  const now = Date.now();
  return bookmarks.map((b) => {
    if (idSet.has(b.id)) {
      return { ...b, isStarred, updatedAt: now };
    }
    return b;
  });
}

export function batchDeleteBookmarks(
  bookmarkIds: string[],
  bookmarks: Bookmark[]
): Bookmark[] {
  const idSet = new Set(bookmarkIds);
  return bookmarks.filter((b) => !idSet.has(b.id));
}

// ==========================================
// Modular Backup & Export Utilities
// ==========================================

export function exportBookmarksOnlyJson(bookmarks: Bookmark[], categories: Category[]): string {
  const data: ExportData = {
    version: '1.0',
    exportedAt: Date.now(),
    source: 'BookmarkHub',
    categories,
    bookmarks,
  };
  return JSON.stringify(data, null, 2);
}

export function exportSystemConfigJson(categories: Category[], settings: SystemSettings): string {
  const data: SystemConfigBackup = {
    version: '1.0',
    exportedAt: Date.now(),
    source: 'BookmarkHub',
    type: 'config',
    categories,
    settings,
  };
  return JSON.stringify(data, null, 2);
}

export function exportFullBackupJson(
  bookmarks: Bookmark[],
  categories: Category[],
  settings: SystemSettings
): string {
  const data: FullBackupData = {
    version: '1.0',
    exportedAt: Date.now(),
    source: 'BookmarkHub',
    type: 'full',
    settings,
    categories,
    bookmarks,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadJsonFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface BackupValidationResult {
  isValid: boolean;
  type: 'bookmarks' | 'config' | 'full' | 'unknown';
  parsedData: any;
  error?: string;
  stats?: {
    bookmarkCount: number;
    categoryCount: number;
    hasSettings: boolean;
  };
}

export function validateAndParseBackupFile(rawJson: string): BackupValidationResult {
  try {
    const data = JSON.parse(rawJson);
    if (!data || typeof data !== 'object') {
      return { isValid: false, type: 'unknown', parsedData: null, error: '文件内容非合法 JSON 对象' };
    }

    if (data.type === 'full' && Array.isArray(data.bookmarks) && Array.isArray(data.categories)) {
      return {
        isValid: true,
        type: 'full',
        parsedData: data,
        stats: {
          bookmarkCount: data.bookmarks.length,
          categoryCount: data.categories.length,
          hasSettings: Boolean(data.settings),
        },
      };
    }

    if (data.type === 'config' && Array.isArray(data.categories)) {
      return {
        isValid: true,
        type: 'config',
        parsedData: data,
        stats: {
          bookmarkCount: 0,
          categoryCount: data.categories.length,
          hasSettings: Boolean(data.settings),
        },
      };
    }

    if (Array.isArray(data.bookmarks)) {
      return {
        isValid: true,
        type: 'bookmarks',
        parsedData: data,
        stats: {
          bookmarkCount: data.bookmarks.length,
          categoryCount: Array.isArray(data.categories) ? data.categories.length : 0,
          hasSettings: false,
        },
      };
    }

    // Fallback: array of bookmarks
    if (Array.isArray(data)) {
      return {
        isValid: true,
        type: 'bookmarks',
        parsedData: { bookmarks: data, categories: [] },
        stats: {
          bookmarkCount: data.length,
          categoryCount: 0,
          hasSettings: false,
        },
      };
    }

    return {
      isValid: false,
      type: 'unknown',
      parsedData: null,
      error: '无法识别此备份文件格式，请确保是由 BookmarkHub 导出的备份',
    };
  } catch (err: any) {
    return {
      isValid: false,
      type: 'unknown',
      parsedData: null,
      error: err?.message || 'JSON 解析失败',
    };
  }
}

