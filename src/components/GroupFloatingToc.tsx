import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category, Bookmark } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { buildCategoryTree } from '../utils/storage';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  Layers,
  Folder,
  X,
  Menu,
  Check,
} from 'lucide-react';

interface GroupFloatingTocProps {
  categories: Category[];
  bookmarks: Bookmark[];
  activeCategoryId: string | null;
  onJumpToCategory: (categoryId: string) => void;
  onScrollToTop?: () => void;
}

export const GroupFloatingToc: React.FC<GroupFloatingTocProps> = ({
  categories,
  bookmarks,
  activeCategoryId,
  onJumpToCategory,
  onScrollToTop,
}) => {
  // Collapse state: can be collapsed to an ultra-compact icon rail
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bookmarkhub_group_toc_collapsed') === 'true';
    }
    return false;
  });

  // Mobile drawer / popover state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Active section ID tracked by ScrollSpy
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Build root categories tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Compute bookmark counts per root category
  const rootCategoryStats = useMemo(() => {
    return categoryTree.map((root) => {
      const childIds = new Set(root.children.map((c) => c.id));
      const count = bookmarks.filter(
        (b) => b.categoryId === root.id || childIds.has(b.categoryId)
      ).length;
      return {
        ...root,
        count,
      };
    });
  }, [categoryTree, bookmarks]);

  // Check if there are uncategorized bookmarks
  const uncategorizedCount = useMemo(() => {
    const allCatIds = new Set(categories.map((c) => c.id));
    return bookmarks.filter((b) => !allCatIds.has(b.categoryId)).length;
  }, [categories, bookmarks]);

  // Toggle collapse and persist preference
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('bookmarkhub_group_toc_collapsed', next ? 'true' : 'false');
      return next;
    });
  };

  // ScrollSpy: observe which group section is in the viewport
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections: { id: string; top: number; bottom: number }[] = [];

          rootCategoryStats.forEach((cat) => {
            const el = document.getElementById(`group-root-${cat.id}`);
            if (el) {
              const rect = el.getBoundingClientRect();
              sections.push({ id: cat.id, top: rect.top, bottom: rect.bottom });
            }
          });

          if (uncategorizedCount > 0) {
            const el = document.getElementById('group-root-uncategorized');
            if (el) {
              const rect = el.getBoundingClientRect();
              sections.push({ id: 'uncategorized', top: rect.top, bottom: rect.bottom });
            }
          }

          // Header offset is around 80px
          const threshold = 140;
          let currentActive: string | null = null;

          for (let i = 0; i < sections.length; i++) {
            const s = sections[i];
            if (s.top <= threshold && s.bottom > threshold) {
              currentActive = s.id;
              break;
            }
          }

          // If scrolled past the first section or near top
          if (!currentActive && sections.length > 0) {
            if (sections[0].top > threshold) {
              currentActive = sections[0].id;
            } else {
              const passed = sections.filter((s) => s.top <= threshold);
              if (passed.length > 0) {
                currentActive = passed[passed.length - 1].id;
              }
            }
          }

          setActiveSectionId(currentActive);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [rootCategoryStats, uncategorizedCount]);

  const handleItemClick = (categoryId: string) => {
    onJumpToCategory(categoryId);
    setIsMobileOpen(false);
  };

  const handleScrollToTopAction = () => {
    if (onScrollToTop) {
      onScrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileOpen(false);
  };

  if (rootCategoryStats.length === 0) return null;

  return (
    <>
      {/* ======================================================== */}
      {/* Mobile Floating Trigger Button (< md)                    */}
      {/* ======================================================== */}
      <div className="md:hidden fixed right-3 bottom-24 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-neutral-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-neutral-900 shadow-xl border border-neutral-700/50 dark:border-neutral-200/50 text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
          title="目录快速跳转"
        >
          <Compass className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
          <span>目录</span>
        </button>

        {/* Mobile Slide-up / Drawer */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in">
            <div
              className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 max-h-[75vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    目录快速跳转
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {activeCategoryId ? '(点击恢复全部并直达)' : '(点击直达视窗)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-1 flex-1 py-1 pr-1">
                {rootCategoryStats.map((root) => {
                  const isActive = activeSectionId === root.id;
                  return (
                    <button
                      key={root.id}
                      type="button"
                      onClick={() => handleItemClick(root.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CategoryIcon name={root.icon} className="w-4 h-4 shrink-0" />
                        <span className="truncate">{root.name}</span>
                      </div>
                      <span className="font-mono text-[11px] tabular-nums opacity-75 shrink-0 ml-2">
                        {root.count} 个
                      </span>
                    </button>
                  );
                })}

                {uncategorizedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('uncategorized')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all ${
                      activeSectionId === 'uncategorized'
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="truncate">未分类</span>
                    </div>
                    <span className="font-mono text-[11px] tabular-nums opacity-75 shrink-0 ml-2">
                      {uncategorizedCount} 个
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleScrollToTopAction}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>回到顶部</span>
                </button>
                <span className="text-[11px] text-neutral-400 font-mono">
                  共 {rootCategoryStats.length} 个一级分类
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* Desktop Persistent Floating Rail (>= md)                  */}
      {/* ======================================================== */}
      <nav
        aria-label="目录快捷跳转"
        className={`hidden md:flex fixed right-3 xl:right-5 top-1/2 -translate-y-1/2 z-30 select-none transition-all duration-200 ${
          isCollapsed ? 'w-11' : 'w-44 xl:w-48'
        }`}
      >
        <div className="w-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl shadow-xl shadow-neutral-950/5 dark:shadow-neutral-950/40 p-2 flex flex-col max-h-[82vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            {!isCollapsed ? (
              <div className="flex items-center gap-1.5 min-w-0 pl-1">
                <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                  目录导航
                </span>
              </div>
            ) : (
              <div className="w-full flex justify-center py-0.5" title="分组目录快捷跳转">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}

            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
              title={isCollapsed ? '展开目录名称' : '收起为紧凑图标栏'}
            >
              {isCollapsed ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Directory Item List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 py-0.5 scrollbar-thin">
            {rootCategoryStats.map((root) => {
              const isActive = activeSectionId === root.id;

              return (
                <button
                  key={root.id}
                  type="button"
                  onClick={() => handleItemClick(root.id)}
                  className={`w-full group flex items-center ${
                    isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                  } rounded-xl text-xs transition-all duration-150 relative cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                  title={`${root.name} (${root.count}个书签) · 点击直达`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0 transition-transform group-hover:scale-110"
                      style={root.color ? { color: isActive ? 'inherit' : root.color } : undefined}
                    >
                      <CategoryIcon name={root.icon} className="w-3.5 h-3.5" />
                    </span>
                    {!isCollapsed && (
                      <span className="truncate text-[11px] tracking-tight">{root.name}</span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <span
                      className={`text-[10px] font-mono tabular-nums shrink-0 ml-1.5 transition-opacity ${
                        isActive
                          ? 'opacity-90 font-medium'
                          : 'text-neutral-400 dark:text-neutral-500 opacity-75 group-hover:opacity-100'
                      }`}
                    >
                      {root.count}
                    </span>
                  )}

                  {/* Active dot indicator in collapsed mode */}
                  {isCollapsed && isActive && (
                    <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}

            {/* Uncategorized section if present */}
            {uncategorizedCount > 0 && (
              <button
                type="button"
                onClick={() => handleItemClick('uncategorized')}
                className={`w-full group flex items-center ${
                  isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-xs transition-all duration-150 relative cursor-pointer ${
                  activeSectionId === 'uncategorized'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
                title={`未分类 (${uncategorizedCount}个书签) · 点击直达`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform group-hover:scale-110" />
                  {!isCollapsed && (
                    <span className="truncate text-[11px] tracking-tight">未分类</span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="text-[10px] font-mono tabular-nums text-neutral-400 opacity-75 shrink-0 ml-1.5">
                    {uncategorizedCount}
                  </span>
                )}
                {isCollapsed && activeSectionId === 'uncategorized' && (
                  <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </button>
            )}
          </div>

          {/* Footer: Quick Scroll to Top button */}
          <div className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={handleScrollToTopAction}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center py-1.5' : 'justify-center gap-1.5 py-1.5 px-2'
              } rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium transition-colors cursor-pointer`}
              title="平滑滚动回到页面顶部"
            >
              <ArrowUp className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span>回到顶部</span>}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
