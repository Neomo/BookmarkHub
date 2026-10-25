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
  healthStatus?: 'unknown' | 'healthy' | 'error' | 'checking';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  description?: string;
  color?: string;
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
