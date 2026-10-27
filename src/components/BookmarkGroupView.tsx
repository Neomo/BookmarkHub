import React, { useState, useEffect } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Bookmark, Category } from '../types';
import { SortableBookmarkCard } from './SortableBookmarkCard';
import { CategoryIcon } from './CategoryIcon';
import { buildCategoryTree, CategoryTreeItem } from '../utils/storage';
import { getCoverStyle } from '../utils/coverPresets';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  CornerDownRight,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BookmarkGroupViewProps {
  categories: Category[];
  bookmarks: Bookmark[];
  activeCategoryId: string | null;
  getDisplayCategory?: (catId: string) => Category | undefined;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  onRecordClick: (bookmark: Bookmark) => void;
  onSelectTag?: (tag: string) => void;
  onShowQrCode?: (bookmark: Bookmark) => void;
  globalDefaultSubView?: 'expanded' | 'collapsed';
  showOgImage?: boolean;
}

// Droppable subcategory tab for horizontal filter row
const DroppableSubcategoryTab: React.FC<{
  sub: Category;
  count: number;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ sub, count, isSelected, onToggle }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-category-${sub.id}`,
    data: {
      type: 'category',
      categoryId: sub.id,
      categoryName: sub.name,
    },
  });

  return (
    <div ref={setNodeRef} className="shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
          isOver
            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 ring-2 ring-neutral-900 dark:ring-neutral-100 scale-105 shadow-md z-10'
            : isSelected
            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs ring-1 ring-neutral-900 dark:ring-neutral-100'
            : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-750 hover:text-neutral-900 dark:hover:text-neutral-200'
        }`}
      >
        <CategoryIcon name={sub.icon} className="w-3.5 h-3.5" />
        <span>{sub.name}</span>
        {isOver ? (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-300 animate-pulse">
            <CornerDownRight className="w-3 h-3" />
            <span>移入</span>
          </span>
        ) : (
          <span className="font-mono tabular-nums text-[11px] opacity-75">
            ({count})
          </span>
        )}
      </button>
    </div>
  );
};

// Droppable header for 1st level category (supports Cover background)
const DroppableRootHeader: React.FC<{
  rootCat: CategoryTreeItem;
  totalCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ rootCat, totalCount, isCollapsed, onToggleCollapse }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-category-${rootCat.id}`,
    data: {
      type: 'category',
      categoryId: rootCat.id,
      categoryName: rootCat.name,
    },
  });

  const hasCover = Boolean(rootCat.cover?.value);
  const coverStyle = getCoverStyle(rootCat.cover);

  if (hasCover) {
    return (
      <div
        ref={setNodeRef}
        onClick={onToggleCollapse}
        style={coverStyle}
        className={`relative overflow-hidden flex items-center justify-between p-3 sm:p-4 rounded-xl cursor-pointer select-none group transition-all duration-200 shadow-sm ${
          isOver
            ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 scale-[1.01]'
            : 'hover:brightness-98 dark:hover:brightness-105'
        }`}
      >
        {/* Backdrop tint for perfect text contrast */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            type="button"
            className="p-1 -ml-1 text-white/80 group-hover:text-white rounded transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
            <CategoryIcon name={rootCat.icon} className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-white drop-shadow-xs tracking-wide">
            {rootCat.name}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs text-white/90 tabular-nums font-mono">
            {totalCount} 个网址
          </span>

          {isOver && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 animate-pulse ml-2">
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>松开移入此一级分类</span>
            </span>
          )}
        </div>

        <span className="relative z-10 text-xs text-white/80 group-hover:text-white transition-colors bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-md">
          {isCollapsed ? '展开目录' : '折叠目录'}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onClick={onToggleCollapse}
      className={`flex items-center justify-between pb-2 border-b cursor-pointer select-none group transition-all duration-150 rounded-lg px-2 -mx-2 ${
        isOver
          ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-900 dark:border-neutral-100 ring-2 ring-neutral-900 dark:ring-neutral-100'
          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="p-1 -ml-1 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 rounded transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-xs"
          style={{ backgroundColor: rootCat.color || '#6366f1' }}
        >
          <CategoryIcon name={rootCat.icon} className="w-3.5 h-3.5" />
        </div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          {rootCat.name}
        </h2>
        <span className="text-xs text-neutral-400 tabular-nums font-mono">
          ({totalCount})
        </span>

        {isOver && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse ml-2">
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>松开移入一级分类</span>
          </span>
        )}
      </div>

      <span className="text-xs text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
        {isCollapsed ? '展开' : '折叠'}
      </span>
    </div>
  );
};

export const BookmarkGroupView: React.FC<BookmarkGroupViewProps> = ({
  categories,
  bookmarks,
  activeCategoryId,
  getDisplayCategory,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleStar,
  onRecordClick,
  onSelectTag,
  onShowQrCode,
  globalDefaultSubView = 'expanded',
  showOgImage = true,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [collapsedSubcategoryBars, setCollapsedSubcategoryBars] = useState<Record<string, boolean>>({});
  // Selected subcategories per root category: key = rootCat.id, value = subcategory IDs
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<string, string[]>>({});

  const toggleCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const isSubcategoryBarCollapsed = (rootCat: CategoryTreeItem) => {
    if (collapsedSubcategoryBars[rootCat.id] !== undefined) {
      return collapsedSubcategoryBars[rootCat.id];
    }
    if (rootCat.subViewOverride === 'collapsed') return true;
    if (rootCat.subViewOverride === 'expanded') return false;
    return globalDefaultSubView === 'collapsed';
  };

  const toggleSubcategoryBar = (rootCatId: string) => {
    setCollapsedSubcategoryBars((prev) => {
      const rootCat = categories.find((c) => c.id === rootCatId);
      const defaultState =
        rootCat?.subViewOverride === 'collapsed'
          ? true
          : rootCat?.subViewOverride === 'expanded'
          ? false
          : globalDefaultSubView === 'collapsed';
      const current = prev[rootCatId] !== undefined ? prev[rootCatId] : defaultState;
      return {
        ...prev,
        [rootCatId]: !current,
      };
    });
  };

  // Build complete 2-level category hierarchy
  const fullCategoryTree = buildCategoryTree(categories);

  // If activeCategoryId is a subcategory, auto-select it in its parent
  useEffect(() => {
    if (!activeCategoryId) return;
    const activeCat = categories.find((c) => c.id === activeCategoryId);
    if (activeCat && activeCat.parentId) {
      setSelectedSubcategories((prev) => ({
        ...prev,
        [activeCat.parentId!]: [activeCategoryId],
      }));
    }
  }, [activeCategoryId, categories]);

  // Determine which root categories to display
  const displayRoots = fullCategoryTree.filter((root) => {
    if (!activeCategoryId) return true;
    if (root.id === activeCategoryId) return true;
    if (root.children.some((child) => child.id === activeCategoryId)) return true;
    return false;
  });

  // Calculate uncategorized bookmarks
  const allCategoryIds = new Set(categories.map((c) => c.id));
  const uncategorizedBookmarks = bookmarks.filter((b) => !allCategoryIds.has(b.categoryId));

  // Toggle subcategory in multi-select
  const handleToggleSubcategory = (rootId: string, subId: string) => {
    setSelectedSubcategories((prev) => {
      const current = prev[rootId] || [];
      if (current.includes(subId)) {
        const next = current.filter((id) => id !== subId);
        return { ...prev, [rootId]: next };
      } else {
        return { ...prev, [rootId]: [...current, subId] };
      }
    });
  };

  // Clear subcategory filter for a root category
  const handleClearSubFilter = (rootId: string) => {
    setSelectedSubcategories((prev) => ({
      ...prev,
      [rootId]: [],
    }));
  };

  return (
    <div className="space-y-10">
      {displayRoots.map((rootCat) => {
        // Collect all bookmarks belonging to this root category or any of its subcategories
        const childCatIds = new Set(rootCat.children.map((c) => c.id));
        const allRootBookmarks = bookmarks.filter(
          (b) => b.categoryId === rootCat.id || childCatIds.has(b.categoryId)
        );

        const isCollapsed = collapsedCategories[rootCat.id];
        const selectedSubs = selectedSubcategories[rootCat.id] || [];

        // Filter bookmarks by selected subcategories if any are selected
        const displayedBookmarks =
          selectedSubs.length === 0
            ? allRootBookmarks
            : allRootBookmarks.filter((b) => selectedSubs.includes(b.categoryId));

        const subBarCollapsed = isSubcategoryBarCollapsed(rootCat);

        return (
          <section key={rootCat.id} className="space-y-4">
            {/* 1st Level Category Header (Droppable) */}
            <DroppableRootHeader
              rootCat={rootCat}
              totalCount={allRootBookmarks.length}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => toggleCollapse(rootCat.id)}
            />

            {!isCollapsed && (
              <div className="space-y-3">
                {/* Horizontal Subcategory Filter Bar */}
                {rootCat.children.length > 0 && (
                  <div className="space-y-1.5 py-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <span className="text-[11px] font-medium">二级专区 ({rootCat.children.length}):</span>
                        {subBarCollapsed && selectedSubs.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono">
                            已选 {selectedSubs.length} 个
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSubcategoryBar(rootCat.id)}
                        className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-0.5 transition-colors"
                      >
                        <span>{subBarCollapsed ? '展开二级' : '折叠二级'}</span>
                        {subBarCollapsed ? (
                          <ChevronRight className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {!subBarCollapsed && (
                      <div className="flex items-center flex-wrap gap-2 pt-0.5 animate-in fade-in">
                        {/* "全部" Button */}
                        <button
                          type="button"
                          onClick={() => handleClearSubFilter(rootCat.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                            selectedSubs.length === 0
                              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                          }`}
                        >
                          全部 ({allRootBookmarks.length})
                        </button>

                        {/* Horizontal Subcategory Tabs */}
                        {rootCat.children.map((sub) => {
                          const subCount = allRootBookmarks.filter(
                            (b) => b.categoryId === sub.id
                          ).length;
                          const isSelected = selectedSubs.includes(sub.id);

                          return (
                            <DroppableSubcategoryTab
                              key={sub.id}
                              sub={sub}
                              count={subCount}
                              isSelected={isSelected}
                              onToggle={() => handleToggleSubcategory(rootCat.id, sub.id)}
                            />
                          );
                        })}

                        {/* Quick Clear Filter Button */}
                        {selectedSubs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearSubFilter(rootCat.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-1"
                            title="清空当前多选的二级分类"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>清除选择 ({selectedSubs.length})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sortable Bookmarks Grid */}
                {displayedBookmarks.length > 0 ? (
                  <SortableContext
                    items={displayedBookmarks.map((b) => b.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
                      {displayedBookmarks.map((bm) => (
                        <SortableBookmarkCard
                          key={bm.id}
                          bookmark={bm}
                          category={getDisplayCategory ? getDisplayCategory(bm.categoryId) : undefined}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onTogglePin={onTogglePin}
                          onToggleStar={onToggleStar}
                          onRecordClick={onRecordClick}
                          onSelectTag={onSelectTag}
                          onShowQrCode={onShowQrCode}
                          showOgImage={showOgImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2">
                    <p>当前选中的二级分类下暂无书签</p>
                    {selectedSubs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearSubFilter(rootCat.id)}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        查看「{rootCat.name}」全部网址
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {/* Uncategorized section (only real uncategorized bookmarks without any valid category) */}
      {uncategorizedBookmarks.length > 0 && !activeCategoryId && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <Folder className="w-4 h-4 text-neutral-400" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              未分类
            </h2>
            <span className="text-xs text-neutral-400 tabular-nums font-mono">
              ({uncategorizedBookmarks.length})
            </span>
          </div>

          <SortableContext
            items={uncategorizedBookmarks.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
              {uncategorizedBookmarks.map((bm) => (
                <SortableBookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                  onToggleStar={onToggleStar}
                  onRecordClick={onRecordClick}
                  onSelectTag={onSelectTag}
                  onShowQrCode={onShowQrCode}
                  showOgImage={showOgImage}
                />
              ))}
            </div>
          </SortableContext>
        </section>
      )}
    </div>
  );
};
