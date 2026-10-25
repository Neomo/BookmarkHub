import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Category, Bookmark } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { buildCategoryTree, CategoryTreeItem } from '../utils/storage';
import { getCoverStyle } from '../utils/coverPresets';
import {
  Bookmark as BookmarkIcon,
  Star,
  Pin,
  Settings2,
  FolderPlus,
  X,
  CornerDownRight,
  ChevronDown,
  ChevronRight,
  Archive,
  SlidersHorizontal,
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
  onOpenArchiveModal?: () => void;
  onOpenAdmin?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isDraggingBookmark?: boolean;
  inactiveCount?: number;
}

interface DroppableCategoryButtonProps {
  category: Category;
  droppableId: string;
  isSelected: boolean;
  count: number;
  onSelect: () => void;
  isDraggingBookmark?: boolean;
  isSubcategory?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (e: React.MouseEvent) => void;
}

const DroppableCategoryButton: React.FC<DroppableCategoryButtonProps> = ({
  category,
  droppableId,
  isSelected,
  count,
  onSelect,
  isDraggingBookmark,
  isSubcategory = false,
  hasChildren = false,
  isExpanded = true,
  onToggleExpand,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: 'category',
      categoryId: category.id,
      categoryName: category.name,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center justify-between rounded-lg transition-all duration-150 ${
          isSubcategory
            ? 'pl-6 pr-2.5 py-1 text-[11px]'
            : 'px-2.5 py-1.5 text-xs'
        } ${
          isOver
            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 ring-2 ring-neutral-900 dark:ring-neutral-100 scale-[1.01] shadow-md z-10'
            : isSelected
            ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
        } ${
          isDraggingBookmark && !isOver
            ? 'border border-dashed border-neutral-300 dark:border-neutral-700/80'
            : ''
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Chevron expand/collapse for parent category */}
          {hasChildren && onToggleExpand && (
            <span
              onClick={onToggleExpand}
              className="p-0.5 -ml-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          )}

          {/* Subcategory branch line indicator */}
          {isSubcategory && (
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 shrink-0 mr-0.5" />
          )}

          {!isSubcategory && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: category.color || '#6366f1' }}
            />
          )}

          <CategoryIcon
            name={category.icon}
            className={`${isSubcategory ? 'w-3 h-3 text-neutral-400' : 'w-3.5 h-3.5'} shrink-0`}
          />

          <span className="truncate">{category.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {isOver ? (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold tracking-wide animate-pulse">
              <CornerDownRight className="w-3 h-3" />
              <span>移入</span>
            </span>
          ) : (
            <span className="font-mono tabular-nums text-[11px] opacity-70">
              {count}
            </span>
          )}
        </div>
      </button>

      {/* Floating Category Cover Preview Card on Hover */}
      {isHovered && category.cover?.value && !isSubcategory && !isDraggingBookmark && (
        <div
          className="hidden md:block absolute left-full top-0 ml-2.5 z-50 w-64 rounded-xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 pointer-events-none"
          style={getCoverStyle(category.cover)}
        >
          <div className="p-3 bg-black/40 backdrop-blur-[2px] text-white space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <CategoryIcon name={category.icon} className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs tracking-wide block truncate text-white drop-shadow-xs">
                  {category.name}
                </span>
                <span className="text-[10px] text-white/80">{count} 个网址</span>
              </div>
            </div>
            {category.description && (
              <p className="text-[10px] text-white/90 line-clamp-2 leading-tight">
                {category.description}
              </p>
            )}
            <div className="text-[9px] text-white/60 tracking-wider">
              {category.cover.type === 'gradient'
                ? '渐变色 Cover'
                : category.cover.type === 'solid'
                ? '纯色 Cover'
                : '高清图片 Cover'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  onOpenArchiveModal,
  onOpenAdmin,
  isOpenMobile,
  onCloseMobile,
  isDraggingBookmark = false,
  inactiveCount = 0,
}) => {
  // Collapsed state for parent categories
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});

  const toggleParentCollapse = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  // Counts
  const totalCount = bookmarks.length;
  const starredCount = bookmarks.filter((b) => b.isStarred).length;
  const pinnedCount = bookmarks.filter((b) => b.isPinned).length;

  // Direct count per category
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

  // Build tree
  const categoryTree = buildCategoryTree(categories);

  // Helper to compute cumulative count for parent including children
  const getCumulativeCount = (item: CategoryTreeItem): number => {
    let sum = countByCat.get(item.id) || 0;
    for (const child of item.children) {
      sum += countByCat.get(child.id) || 0;
    }
    return sum;
  };

  const renderSidebarContent = (isMobileView = false) => (
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

      {/* 2-Level Categories Hierarchy section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-neutral-400 dark:text-neutral-500 font-medium text-[11px]">
            <span className="flex items-center gap-1">
              <span>二级分类专区</span>
              {isDraggingBookmark && (
                <span className="text-[10px] text-indigo-500 font-normal">
                  (拖拽归类)
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {onOpenArchiveModal && (
                <button
                  type="button"
                  onClick={onOpenArchiveModal}
                  className="relative hover:text-neutral-800 dark:hover:text-neutral-200 p-0.5 rounded transition-colors text-neutral-400"
                  title="6 个月未访问闲置书签智能归档"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {inactiveCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={onOpenCategoryModal}
                className="hover:text-neutral-800 dark:hover:text-neutral-200 p-0.5 rounded transition-colors"
                title="管理分类与二级结构"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {categoryTree.map((parentCat) => {
              const isSelected = activeCategoryId === parentCat.id;
              const hasChildren = parentCat.children.length > 0;
              const isExpanded = !collapsedParents[parentCat.id];
              const cumulativeCount = getCumulativeCount(parentCat);

              const droppableId = isMobileView
                ? `droppable-category-mobile-${parentCat.id}`
                : `droppable-category-${parentCat.id}`;

              return (
                <div key={parentCat.id} className="space-y-0.5">
                  {/* 1st Level Category */}
                  <DroppableCategoryButton
                    category={parentCat}
                    droppableId={droppableId}
                    isSelected={isSelected}
                    count={cumulativeCount}
                    hasChildren={hasChildren}
                    isExpanded={isExpanded}
                    onToggleExpand={(e) => toggleParentCollapse(parentCat.id, e)}
                    isDraggingBookmark={isDraggingBookmark}
                    onSelect={() => {
                      onSelectCategory(isSelected ? null : parentCat.id);
                      onCloseMobile();
                    }}
                  />

                  {/* 2nd Level Subcategories */}
                  {hasChildren && isExpanded && (
                    <div className="space-y-0.5 relative pl-2 ml-2 border-l border-neutral-200/80 dark:border-neutral-800">
                      {parentCat.children.map((subCat) => {
                        const isSubSelected = activeCategoryId === subCat.id;
                        const subCount = countByCat.get(subCat.id) || 0;
                        const subDroppableId = isMobileView
                          ? `droppable-category-mobile-${subCat.id}`
                          : `droppable-category-${subCat.id}`;

                        return (
                          <DroppableCategoryButton
                            key={subCat.id}
                            category={subCat}
                            droppableId={subDroppableId}
                            isSelected={isSubSelected}
                            count={subCount}
                            isSubcategory={true}
                            isDraggingBookmark={isDraggingBookmark}
                            onSelect={() => {
                              onSelectCategory(isSubSelected ? null : subCat.id);
                              onCloseMobile();
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
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

      {/* Footer links to admin and category management */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
        {onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full py-2 px-3 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>系统管理中心</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenCategoryModal}
          className="w-full py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>快速调整分类</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 min-h-[calc(100vh-3.5rem)] sticky top-14 self-start">
        {renderSidebarContent(false)}
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
            <div className="flex-1 overflow-hidden">{renderSidebarContent(true)}</div>
          </div>
        </div>
      )}
    </>
  );
};
