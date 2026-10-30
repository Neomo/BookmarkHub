import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDroppable } from '@dnd-kit/core';
import { Category, Bookmark } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { buildCategoryTree, CategoryTreeItem } from '../utils/storage';
import { getCoverStyle } from '../utils/coverPresets';
import { hexToRgba } from '../utils/color';
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
  Layers,
  Inbox,
  Sparkles,
  Tag,
  Hash,
  ChevronsUpDown,
  ChevronsDownUp,
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

  const catColor = category.color || '#6366f1';

  return (
    <div
      ref={setNodeRef}
      className="relative w-full"
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
            ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-2xs'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
        } ${
          isDraggingBookmark && !isOver
            ? 'border border-dashed border-neutral-300 dark:border-neutral-700/80'
            : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
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

          {/* Subcategory: bullet dot + own CategoryIcon + name */}
          {isSubcategory ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-neutral-400 dark:text-neutral-500 font-bold select-none text-[10px] leading-none ml-0.5">•</span>
              <div
                className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0 shadow-2xs"
                style={{
                  backgroundColor: hexToRgba(catColor, 0.15),
                  color: catColor,
                }}
              >
                <CategoryIcon name={category.icon} className="w-2.5 h-2.5" />
              </div>
            </div>
          ) : (
            /* Root category: CategoryIcon badge with theme color */
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs"
              style={{
                backgroundColor: hexToRgba(catColor, 0.15),
                color: catColor,
              }}
            >
              <CategoryIcon name={category.icon} className="w-3.5 h-3.5" />
            </div>
          )}

          <span className="truncate">{category.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {isOver ? (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold tracking-wide animate-pulse">
              <CornerDownRight className="w-3 h-3" />
              <span>移入</span>
            </span>
          ) : (
            <span className="font-mono tabular-nums text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
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
              <span className="font-semibold text-xs drop-shadow-sm truncate">
                {category.name}
              </span>
            </div>
            {category.description && (
              <p className="text-[11px] text-white/90 line-clamp-2 drop-shadow-xs">
                {category.description}
              </p>
            )}
            <div className="text-[10px] text-white/75 font-mono">
              包含 {count} 条收藏网址
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to calculate heatmap tier and styling for tags based on frequency
const getTagHeatmapStyle = (count: number, min: number, max: number, isSelected: boolean) => {
  if (isSelected) {
    return {
      container:
        'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-700 dark:border-indigo-400 font-semibold shadow-xs ring-2 ring-indigo-400/30 scale-105',
      badge: 'bg-white/20 text-white font-bold',
    };
  }

  // Calculate ratio 0..1
  const ratio = max > min ? (count - min) / (max - min) : 0.5;

  if (ratio >= 0.75) {
    // Level 4 (Highest density) - Deepest indigo tint & prominent border
    return {
      container:
        'bg-indigo-100 dark:bg-indigo-950/85 border-indigo-300 dark:border-indigo-600/70 text-indigo-950 dark:text-indigo-200 font-semibold shadow-2xs hover:bg-indigo-200/70 dark:hover:bg-indigo-900/80 hover:scale-105',
      badge: 'bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-950 dark:text-indigo-200 font-bold',
    };
  } else if (ratio >= 0.5) {
    // Level 3 (High density) - Medium indigo tint
    return {
      container:
        'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-700/50 text-indigo-900 dark:text-indigo-300 font-medium hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 hover:scale-103',
      badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-semibold',
    };
  } else if (ratio >= 0.25) {
    // Level 2 (Medium density) - Soft subtle tint
    return {
      container:
        'bg-indigo-50/30 dark:bg-neutral-850/80 border-indigo-100 dark:border-neutral-750 text-neutral-700 dark:text-neutral-300 hover:bg-indigo-50/60 dark:hover:bg-neutral-800 hover:scale-102',
      badge: 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    };
  } else {
    // Level 1 (Lowest density) - Lightest tint
    return {
      container:
        'bg-white/80 dark:bg-neutral-850/40 border-neutral-200/60 dark:border-neutral-800/80 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 hover:scale-102',
      badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500',
    };
  }
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
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const toggleParentCollapse = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  const totalCount = bookmarks.length;
  const starredCount = bookmarks.filter((b) => b.isStarred).length;
  const pinnedCount = bookmarks.filter((b) => b.isPinned).length;

  const countByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookmarks) {
      map.set(b.categoryId, (map.get(b.categoryId) || 0) + 1);
    }
    return map;
  }, [bookmarks]);

  const countByTag = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookmarks) {
      if (b.tags) {
        for (const t of b.tags) {
          map.set(t, (map.get(t) || 0) + 1);
        }
      }
    }
    return map;
  }, [bookmarks]);

  // Sort tags by frequency (most used first), then alphabetically
  const sortedTags = useMemo(() => {
    return [...allTags].sort((a, b) => {
      const countA = countByTag.get(a) || 0;
      const countB = countByTag.get(b) || 0;
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });
  }, [allTags, countByTag]);

  const maxTagCount = useMemo(() => {
    const values = Array.from(countByTag.values());
    return values.length > 0 ? Math.max(...values) : 1;
  }, [countByTag]);

  const minTagCount = useMemo(() => {
    const values = Array.from(countByTag.values());
    return values.length > 0 ? Math.min(...values) : 1;
  }, [countByTag]);

  const categoryTree = buildCategoryTree(categories);

  const getCumulativeCount = (item: CategoryTreeItem): number => {
    let sum = countByCat.get(item.id) || 0;
    for (const child of item.children) {
      sum += countByCat.get(child.id) || 0;
    }
    return sum;
  };

  // Find all parent categories that have children
  const parentCategoriesWithChildren = useMemo(() => {
    return categoryTree.filter((cat) => cat.children.length > 0);
  }, [categoryTree]);

  // Check if all parent categories with children are collapsed
  const areAllCollapsed = useMemo(() => {
    if (parentCategoriesWithChildren.length === 0) return false;
    return parentCategoriesWithChildren.every((cat) => collapsedParents[cat.id] === true);
  }, [parentCategoriesWithChildren, collapsedParents]);

  // Toggle expand/collapse all subcategories
  const handleToggleCollapseAll = () => {
    if (areAllCollapsed) {
      // Expand all
      const next: Record<string, boolean> = {};
      for (const cat of parentCategoriesWithChildren) {
        next[cat.id] = false;
      }
      setCollapsedParents(next);
    } else {
      // Collapse all
      const next: Record<string, boolean> = {};
      for (const cat of parentCategoriesWithChildren) {
        next[cat.id] = true;
      }
      setCollapsedParents(next);
    }
  };

  const TAGS_INITIAL_LIMIT = 20;
  const displayedTags = isTagsExpanded ? sortedTags : sortedTags.slice(0, TAGS_INITIAL_LIMIT);

  const renderSidebarContent = (isMobileView = false) => (
    <div className="flex flex-col h-full text-xs">
      {/* Quick Navigation Rows */}
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
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeCategoryId === null && !showOnlyStarred && !showOnlyPinned && !selectedTag
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4" />
            <span>全部网址</span>
          </div>
          <span className="font-mono tabular-nums text-neutral-400 dark:text-neutral-500 font-medium">
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleShowStarred();
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            showOnlyStarred
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-300 dark:ring-amber-800 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star className={`w-4 h-4 ${showOnlyStarred ? 'fill-current text-amber-500' : 'text-amber-500'}`} />
            <span>常用星标</span>
          </div>
          <span className="font-mono tabular-nums text-neutral-400 dark:text-neutral-500 font-medium">
            {starredCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleShowPinned();
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            showOnlyPinned
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Pin className={`w-4 h-4 ${showOnlyPinned ? 'rotate-45 fill-current' : ''}`} />
            <span>置顶核心</span>
          </div>
          <span className="font-mono tabular-nums text-neutral-400 dark:text-neutral-500 font-medium">
            {pinnedCount}
          </span>
        </button>

        {onOpenArchiveModal && (
          <button
            type="button"
            onClick={() => {
              onOpenArchiveModal();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Archive className="w-4 h-4" />
              <span>闲置归档</span>
            </div>
            {inactiveCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                {inactiveCount}
              </span>
            ) : (
              <span className="font-mono tabular-nums text-neutral-400 dark:text-neutral-500 font-medium">0</span>
            )}
          </button>
        )}
      </div>

      <div className="h-px bg-neutral-200/70 dark:bg-neutral-800 my-1 mx-3" />

      {/* Main Scrollable Content: Categories & Tag Cloud */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {/* Categories Section */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2 text-neutral-400 dark:text-neutral-500 font-semibold text-[11px] tracking-wider uppercase">
            <span className="flex items-center gap-1.5">
              <span>分类专区</span>
              <span className="font-mono text-[10px] font-normal opacity-75">
                ({categories.length})
              </span>
              {isDraggingBookmark && (
                <span className="text-[10px] text-indigo-500 font-normal lowercase">
                  (拖拽归类)
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {/* Quick Expand / Collapse all subcategories toggle */}
              {parentCategoriesWithChildren.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleCollapseAll}
                  className="hover:text-neutral-800 dark:hover:text-neutral-200 p-0.5 rounded transition-colors text-neutral-400 dark:text-neutral-500"
                  title={areAllCollapsed ? '快速展开所有二级目录' : '快速折叠所有二级目录'}
                >
                  {areAllCollapsed ? (
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronsDownUp className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Category Management Button */}
              <button
                type="button"
                onClick={onOpenCategoryModal}
                className="hover:text-neutral-800 dark:hover:text-neutral-200 p-0.5 rounded transition-colors text-neutral-400 dark:text-neutral-500"
                title="管理分类与二级目录"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {categoryTree.map((parentCat) => {
              const isSelected = activeCategoryId === parentCat.id;
              const hasChildren = parentCat.children.length > 0;
              const isCollapsed = collapsedParents[parentCat.id] ?? false;
              const cumulativeCount = getCumulativeCount(parentCat);

              return (
                <div key={parentCat.id} className="space-y-0.5">
                  <DroppableCategoryButton
                    category={parentCat}
                    droppableId={isMobileView ? `droppable-category-mobile-${parentCat.id}` : `droppable-category-sidebar-${parentCat.id}`}
                    isSelected={isSelected}
                    count={cumulativeCount}
                    onSelect={() => {
                      onSelectCategory(parentCat.id);
                      onCloseMobile();
                    }}
                    isDraggingBookmark={isDraggingBookmark}
                    hasChildren={hasChildren}
                    isExpanded={!isCollapsed}
                    onToggleExpand={(e) => toggleParentCollapse(parentCat.id, e)}
                  />

                  {/* 2nd level children */}
                  {hasChildren && !isCollapsed && (
                    <div className="space-y-0.5 relative before:absolute before:left-3 before:top-1 before:bottom-1 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800">
                      {parentCat.children.map((subCat) => {
                        const isSubSelected = activeCategoryId === subCat.id;
                        const subCount = countByCat.get(subCat.id) || 0;

                        return (
                          <DroppableCategoryButton
                            key={subCat.id}
                            category={subCat}
                            droppableId={isMobileView ? `droppable-category-mobile-${subCat.id}` : `droppable-category-sidebar-${subCat.id}`}
                            isSelected={isSubSelected}
                            count={subCount}
                            onSelect={() => {
                              onSelectCategory(subCat.id);
                              onCloseMobile();
                            }}
                            isDraggingBookmark={isDraggingBookmark}
                            isSubcategory={true}
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

        {/* Tag Cloud Section */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-1 mb-2 text-neutral-400 dark:text-neutral-500 font-semibold text-[11px] tracking-wider uppercase">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-indigo-500" />
                <span>标签云</span>
                <span className="font-mono text-[10px] font-normal opacity-75">
                  ({allTags.length})
                </span>
              </span>
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => onSelectTag(null)}
                  className="flex items-center gap-0.5 text-[10px] text-rose-500 hover:text-rose-600 font-normal transition-colors"
                  title="清除标签筛选"
                >
                  <X className="w-3 h-3" />
                  <span>清除</span>
                </button>
              )}
            </div>

            {/* Tag Cloud Visual Component with Heatmap Gradation */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-neutral-100/60 dark:bg-neutral-850/40 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
              {displayedTags.map((tag) => {
                const isSelected = selectedTag === tag;
                const count = countByTag.get(tag) || 0;
                const style = getTagHeatmapStyle(count, minTagCount, maxTagCount, isSelected);

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      onSelectTag(isSelected ? null : tag);
                      onCloseMobile();
                    }}
                    title={`${tag} (共 ${count} 条网址)`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-all duration-150 cursor-pointer active:scale-95 border ${style.container}`}
                  >
                    <span className="truncate max-w-[120px]">{tag}</span>
                    <span
                      className={`font-mono text-[9px] px-1 py-0.2 rounded-full tabular-nums ${style.badge}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Expand / Collapse Button if tags exceed initial limit */}
            {sortedTags.length > TAGS_INITIAL_LIMIT && (
              <div className="pt-1.5 px-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsTagsExpanded((prev) => !prev)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
                >
                  <span>{isTagsExpanded ? '收起标签云' : `展开全部 (${sortedTags.length})`}</span>
                  {isTagsExpanded ? (
                    <ChevronDown className="w-3 h-3 rotate-180 transition-transform" />
                  ) : (
                    <ChevronDown className="w-3 h-3 transition-transform" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clean Bottom Management Footer */}
      <div className="p-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
        <button
          type="button"
          onClick={onOpenCategoryModal}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          title="分类与目录设置"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>分类管理</span>
        </button>
        {onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            title="系统全方位配置后台"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>系统后台</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-60 lg:w-64 shrink-0 border-r border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xs min-h-[calc(100vh-3.5rem)] sticky top-14 self-start">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-over Drawer */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 bg-neutral-950/60 dark:bg-black/75 backdrop-blur-md"
              onClick={onCloseMobile}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col z-50"
            >
              <div className="p-3.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  导航台与分类
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
