import React from 'react';
import { Bookmark, FolderTree, Star, BarChart3, Plus } from 'lucide-react';

interface MobileNavProps {
  onSelectAll: () => void;
  onToggleSidebarMobile: () => void;
  showOnlyStarred: boolean;
  onToggleShowStarred: () => void;
  onOpenStatsModal: () => void;
  onOpenAddModal: () => void;
  isHomeActive: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onSelectAll,
  onToggleSidebarMobile,
  showOnlyStarred,
  onToggleShowStarred,
  onOpenStatsModal,
  onOpenAddModal,
  isHomeActive,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-around px-2 pb-safe">
      {/* 1. All Bookmarks */}
      <button
        type="button"
        onClick={onSelectAll}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
          isHomeActive
            ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
            : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
        }`}
      >
        <Bookmark className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">全部</span>
      </button>

      {/* 2. Categories Drawer */}
      <button
        type="button"
        onClick={onToggleSidebarMobile}
        className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
      >
        <FolderTree className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">分类</span>
      </button>

      {/* 3. Quick Add Button (Prominent Center) */}
      <button
        type="button"
        onClick={onOpenAddModal}
        className="flex items-center justify-center w-10 h-10 -mt-2 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-md hover:scale-105 active:scale-95 transition-transform"
        title="添加网址"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* 4. Starred Toggle */}
      <button
        type="button"
        onClick={onToggleShowStarred}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
          showOnlyStarred
            ? 'text-amber-500 font-semibold'
            : 'text-neutral-400 hover:text-amber-500'
        }`}
      >
        <Star className={`w-4 h-4 mb-0.5 ${showOnlyStarred ? 'fill-current' : ''}`} />
        <span className="text-[10px]">星标</span>
      </button>

      {/* 5. Stats & Top 10 */}
      <button
        type="button"
        onClick={onOpenStatsModal}
        className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
      >
        <BarChart3 className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">统计</span>
      </button>
    </div>
  );
};
