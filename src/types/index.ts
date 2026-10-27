export interface Bookmark {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  tags: string[];
  notes: string;
  isPinned: boolean;
  isStarred: boolean;
  clickCount: number;
  lastClickedAt: number | null;
  createdAt: number;
  updatedAt: number;
  order: number;
  healthStatus?: 'unknown' | 'healthy' | 'warning' | 'error' | 'checking';
  lastHealthCheckedAt?: number;
  color?: string;
  coverImage?: string;
  ogImage?: string;
}

export type CategoryCoverType = 'solid' | 'gradient' | 'image';

export interface CategoryCover {
  type: CategoryCoverType;
  value: string; // Hex color for solid, CSS gradient string, or image URL
  textColor?: 'light' | 'dark'; // for text readability
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  description?: string;
  color?: string;
  parentId?: string | null; // null or undefined indicates top-level (level 1), string indicates level 2 subcategory
  cover?: CategoryCover;
  subViewOverride?: 'default' | 'expanded' | 'collapsed';
}

export type ViewMode = 'card' | 'list' | 'group';

export type SortOption =
  | 'custom'
  | 'clicks_desc'
  | 'recent_click'
  | 'created_desc'
  | 'title_asc';

export type ImportMode = 'append' | 'merge' | 'overwrite';

export interface ImportDiff {
  newBookmarks: Bookmark[];
  conflicts: { existing: Bookmark; incoming: Bookmark }[];
  unchangedBookmarks: Bookmark[];
  totalIncoming: number;
  incomingCategories: Category[];
  isFormatValid: boolean;
  errorMessage?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ExportData {
  version: string;
  exportedAt: number;
  source: string;
  categories: Category[];
  bookmarks: Bookmark[];
}

export interface CustomShortcuts {
  search: string;      // default: 'k'
  newBookmark: string; // default: 'n'
  toggleTheme: string; // default: 't'
  openAdmin: string;   // default: 'm'
  toggleView: string;  // default: 'v'
}

export interface SystemSettings {
  defaultTheme: ThemeMode;
  defaultViewMode: ViewMode;
  enableDailyPicks: boolean;
  defaultSortOption: SortOption;
  defaultSubCategoriesView: 'expanded' | 'collapsed';
  openInNewTab: boolean;
  autoArchiveMonths: number;
  customShortcuts?: CustomShortcuts;
  showCardOgImage?: boolean;
}

export interface SystemConfigBackup {
  version: string;
  exportedAt: number;
  source: string;
  type: 'config';
  categories: Category[];
  settings: SystemSettings;
}

export interface FullBackupData {
  version: string;
  exportedAt: number;
  source: string;
  type: 'full';
  settings: SystemSettings;
  categories: Category[];
  bookmarks: Bookmark[];
}
