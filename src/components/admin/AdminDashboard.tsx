import React, { useState } from 'react';
import { Bookmark, Category, SystemSettings, ThemeMode } from '../../types';
import { CategoryManager } from './CategoryManager';
import { TagManager } from './TagManager';
import { BookmarkManagerTable } from './BookmarkManagerTable';
import { PageSettings } from './PageSettings';
import { BackupRestoreManager } from './BackupRestoreManager';
import {
  ArrowLeft,
  FolderTree,
  Tag,
  TableProperties,
  SlidersHorizontal,
  Database,
  Sun,
  Moon,
  Bookmark as BookmarkIcon,
  Layers,
} from 'lucide-react';

export type AdminTab = 'categories' | 'tags' | 'bookmarks' | 'settings' | 'backup';

interface AdminDashboardProps {
  bookmarks: Bookmark[];
  categories: Category[];
  settings: SystemSettings;
  currentTheme: ThemeMode;
  onClose: () => void;
  onUpdateBookmarks: (bookmarks: Bookmark[]) => void;
  onUpdateCategories: (categories: Category[], updatedBookmarks?: Bookmark[]) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
  onApplyTheme: (theme: ThemeMode) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onShowQrCode?: (bookmark: Bookmark) => void;
  initialTab?: AdminTab;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookmarks,
  categories,
  settings,
  currentTheme,
  onClose,
  onUpdateBookmarks,
  onUpdateCategories,
  onUpdateSettings,
  onApplyTheme,
  onEditBookmark,
  onShowQrCode,
  initialTab = 'categories',
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Count unique tags
  const uniqueTagsCount = React.useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => (b.tags || []).forEach((t) => set.add(t)));
    return set.size;
  }, [bookmarks]);

  const tabs = [
    {
      id: 'categories' as const,
      label: '分类体系与 Cover',
      shortLabel: '分类管理',
      icon: FolderTree,
      count: categories.length,
      badgeColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
    },
    {
      id: 'tags' as const,
      label: '标签管理与合并',
      shortLabel: '标签管理',
      icon: Tag,
      count: uniqueTagsCount,
      badgeColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      id: 'bookmarks' as const,
      label: '网址数据表与批量操作',
      shortLabel: '网址数据表',
      icon: TableProperties,
      count: bookmarks.length,
      badgeColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      id: 'settings' as const,
      label: '页面偏好与系统设置',
      shortLabel: '页面设置',
      icon: SlidersHorizontal,
    },
    {
      id: 'backup' as const,
      label: '数据备份与容灾还原',
      shortLabel: '备份与还原',
      icon: Database,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-2xs"
            title="返回书签主页"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回书签前台</span>
          </button>

          <div className="h-4 w-px bg-neutral-200 dark:border-neutral-800 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
              系统全方位管理后台
            </span>
            <span className="hidden md:inline-flex text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
              Admin Console
            </span>
          </div>
        </div>

        {/* Right Stats & Theme Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden lg:flex items-center gap-3 font-mono text-neutral-400 mr-2 text-[11px]">
            <span>{bookmarks.length} 书签</span>
            <span>·</span>
            <span>{categories.length} 分类</span>
            <span>·</span>
            <span>{uniqueTagsCount} 标签</span>
          </div>

          <button
            type="button"
            onClick={() => onApplyTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="快速切换浅色/暗黑模式"
          >
            {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar Tabs or Top Tabs */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Left Side Tabs Navigation (Desktop) / Top Tabs (Mobile) */}
        <aside className="w-full md:w-60 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 sticky top-20">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComp = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 md:shrink ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{tab.shortLabel}</span>
                  </div>

                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ml-2 ${
                        isActive
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Panel */}
        <main className="flex-1 min-w-0">
          {activeTab === 'categories' && (
            <CategoryManager
              categories={categories}
              bookmarks={bookmarks}
              onSaveCategories={onUpdateCategories}
              globalDefaultSubView={settings.defaultSubCategoriesView}
            />
          )}

          {activeTab === 'tags' && (
            <TagManager
              bookmarks={bookmarks}
              onUpdateBookmarks={onUpdateBookmarks}
              onOpenEditBookmark={onEditBookmark}
            />
          )}

          {activeTab === 'bookmarks' && (
            <BookmarkManagerTable
              bookmarks={bookmarks}
              categories={categories}
              onUpdateBookmarks={onUpdateBookmarks}
              onEditBookmark={onEditBookmark}
              onShowQrCode={onShowQrCode}
            />
          )}

          {activeTab === 'settings' && (
            <PageSettings
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              currentTheme={currentTheme}
              onApplyTheme={onApplyTheme}
            />
          )}

          {activeTab === 'backup' && (
            <BackupRestoreManager
              bookmarks={bookmarks}
              categories={categories}
              settings={settings}
              onRestoreAll={(newBms, newCats, newSettings) => {
                onUpdateBookmarks(newBms);
                onUpdateCategories(newCats);
                if (newSettings) {
                  onUpdateSettings(newSettings);
                }
              }}
              onUpdateBookmarks={onUpdateBookmarks}
              onUpdateCategories={onUpdateCategories}
              onUpdateSettings={onUpdateSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
};
