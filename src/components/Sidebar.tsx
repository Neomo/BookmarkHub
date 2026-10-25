import React from 'react';
import { Category, Bookmark } from '../types';
import { CategoryIcon } from './CategoryIcon';
import {
  Bookmark as BookmarkIcon,
  Star,
  Pin,
  Settings2,
  FolderPlus,
  Hash,
  X,
} from 'lucide-react';

interface SidebarProps {
  categories: Category[];
  bookmarks: Bookmark[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  showOnlyStarred: boolean;
  onToggleShowStarred: () => void;
  showOnlyPinned: boolean;
  onToggleShowPinned: () => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  allTags: string[];
  onOpenCategoryModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  bookmarks,
  activeCategoryId,
  onSelectCategory,
  showOnlyStarred,
  onToggleShowStarred,
  showOnlyPinned,
  onToggleShowPinned,
  selectedTag,
  onSelectTag,
  allTags,
  onOpenCategoryModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Counts
  const totalCount = bookmarks.length;
  const starredCount = bookmarks.filter((b) => b.isStarred).length;
  const pinnedCount = bookmarks.filter((b) => b.isPinned).length;

  const countByCat = new Map<string, number>();
  for (const b of bookmarks) {
    countByCat.set(b.categoryId, (countByCat.get(b.categoryId) || 0) + 1);
  }

  // Count by tag
  const countByTag = new Map<string, number>();
  for (const b of bookmarks) {
    if (b.tags) {
      for (const t of b.tags) {
        countByTag.set(t, (countByTag.get(t) || 0) + 1);
      }
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full text-xs">
      {/* Top quick filters */}
      <div className="p-3 space-y-1">
        <button
          type="button"
          onClick={() => {
            onSelectCategory(null);
            if (showOnlyStarred) onToggleShowStarred();
            if (showOnlyPinned) onToggleShowPinned();
            if (selectedTag) onSelectTag(null);
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
            activeCategoryId === null && !showOnlyStarred && !showOnlyPinned && !selectedTag
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookmarkIcon className="w-4 h-4" />
            <span>全部书签</span>
          </div>
          <span className="font-mono tabular-nums opacity-80">{totalCount}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleShowStarred();
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
            showOnlyStarred
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-1 ring-amber-300 dark:ring-amber-800'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star className={`w-4 h-4 ${showOnlyStarred ? 'fill-current text-amber-500' : 'text-amber-500'}`} />
            <span>星标精选</span>
          </div>
          <span className="font-mono tabular-nums opacity-80">{starredCount}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleShowPinned();
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
            showOnlyPinned
              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Pin className={`w-4 h-4 ${showOnlyPinned ? 'rotate-45 fill-current' : ''}`} />
            <span>置顶网址</span>
          </div>
          <span className="font-mono tabular-nums opacity-80">{pinnedCount}</span>
        </button>
      </div>

      <div className="h-px bg-neutral-200 dark:border-neutral-800 my-1 mx-3" />

      {/* Categories section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-neutral-400 dark:text-neutral-500 font-medium text-[11px]">
            <span>分类专区</span>
            <button
              type="button"
              onClick={onOpenCategoryModal}
              className="hover:text-neutral-800 dark:hover:text-neutral-200 p-0.5 rounded transition-colors"
              title="管理分类与排序"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {categories.map((cat) => {
              const isSelected = activeCategoryId === cat.id;
              const count = countByCat.get(cat.id) || 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(isSelected ? null : cat.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || '#6366f1' }}
                    />
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="font-mono tabular-nums text-[11px] opacity-70 ml-2 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags cloud */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-neutral-400 dark:text-neutral-500 font-medium text-[11px]">
              <span>标签聚合</span>
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => onSelectTag(null)}
                  className="hover:text-neutral-800 dark:hover:text-neutral-200 underline decoration-dotted"
                >
                  清除筛选
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1 px-1">
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag;
                const count = countByTag.get(tag) || 0;

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      onSelectTag(isSelected ? null : tag);
                      onCloseMobile();
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-750'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="opacity-60 tabular-nums font-mono text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer link to manage categories */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={onOpenCategoryModal}
          className="w-full py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>自定义管理分类</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-60 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 min-h-[calc(100vh-3.5rem)] sticky top-14 self-start">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="p-3.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                分类与标签
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
