import React from 'react';
import { ViewMode } from '../types';
import {
  Bookmark,
  LayoutGrid,
  List,
  Layers,
  Search,
  Plus,
  BarChart3,
  Moon,
  Sun,
  Download,
  Menu,
  Archive,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Shrink,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onOpenStatsModal: () => void;
  onOpenImportExportModal: () => void;
  onOpenArchiveModal?: () => void;
  onOpenAdmin?: () => void;
  onOpenCommandPalette: () => void;
  onToggleSidebarMobile: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  inactiveCount?: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isCompactMode?: boolean;
  onToggleCompactMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onChangeViewMode,
  onOpenAddModal,
  onOpenStatsModal,
  onOpenImportExportModal,
  onOpenArchiveModal,
  onOpenAdmin,
  onOpenCommandPalette,
  onToggleSidebarMobile,
  isDark,
  onToggleTheme,
  inactiveCount = 0,
  isFullscreen = false,
  onToggleFullscreen,
  isCompactMode = false,
  onToggleCompactMode,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 md:gap-8">
      {/* Zone 1: Single element brand wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        {!isFullscreen && (
          <button
            type="button"
            onClick={onToggleSidebarMobile}
            className="md:hidden p-1.5 -ml-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="切换侧边栏"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap shrink-0 hover:opacity-90"
        >
          <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4 fill-current" />
          </div>
          <span>轻藏 BookmarkHub</span>
        </a>

        {isFullscreen && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            全屏专注模式
          </span>
        )}
      </div>

      {/* Zone 2: Navigation Links / View Switchers (Single line, quiet typography) */}
      <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 shrink-0">
        <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <button
            type="button"
            onClick={() => onChangeViewMode('card')}
            title="卡片视图"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'card'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>卡片</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('list')}
            title="列表视图"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'list'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>列表</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('group')}
            title="分类分组视图"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'group'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>分组</span>
          </button>
        </div>

        {onToggleCompactMode && (
          <button
            type="button"
            onClick={onToggleCompactMode}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
              isCompactMode
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs font-semibold'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={isCompactMode ? '紧凑模式已开启（卡片缩小宽高/列表双列展示），点击还原' : '开启紧凑模式（缩小宽高/一行双列列表/更多卡片）'}
          >
            <Shrink className="w-3.5 h-3.5" />
            <span>紧凑</span>
          </button>
        )}

        {!isFullscreen && (
          <>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-2" />

            <button
              type="button"
              onClick={onOpenStatsModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>统计排行</span>
            </button>

            <button
              type="button"
              onClick={onOpenImportExportModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导入导出</span>
            </button>

            {onOpenArchiveModal && (
              <button
                type="button"
                onClick={onOpenArchiveModal}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
                title="6 个月未访问闲置书签智能归档"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>闲置归档</span>
                {inactiveCount > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </button>
            )}

            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-900 dark:text-neutral-100 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
                title="系统全方位管理后台"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>管理后台</span>
              </button>
            )}
          </>
        )}
      </nav>

      {/* Zone 3: Search trigger & Controls (Fullscreen button, Theme, Add) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs"
          title="搜索网址与操作 (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">搜索...</span>
          <kbd className="hidden sm:inline-block px-1 text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
            ⌘K
          </kbd>
        </button>

        {!isFullscreen && onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="md:hidden p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="系统全方位管理后台"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        {/* Fullscreen Focus Toggle Button */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`p-1.5 rounded-lg transition-colors ${
              isFullscreen
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500/40'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={isFullscreen ? '退出全屏专注模式 (Esc)' : '切换全屏专注模式'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}

        {/* Compact Mode Toggle for Mobile */}
        {onToggleCompactMode && (
          <button
            type="button"
            onClick={onToggleCompactMode}
            className={`md:hidden p-1.5 rounded-lg transition-colors ${
              isCompactMode
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500/40'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={isCompactMode ? '退出紧凑模式' : '切换紧凑模式'}
          >
            <Shrink className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title={isDark ? '切换明亮模式' : '切换暗黑模式'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加网址</span>
        </button>
      </div>
    </header>
  );
};
