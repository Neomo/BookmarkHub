import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { hexToRgba } from '../utils/color';
import { getCategoryWithChildrenIds, ARCHIVED_CATEGORY_ID } from '../utils/storage';
import {
  Compass,
  X,
  RefreshCw,
  Star,
  Sparkles,
  Layers,
  ExternalLink,
} from 'lucide-react';

interface ExplorationModeProps {
  bookmarks: Bookmark[];
  categories: Category[];
  onClose: () => void;
  onRecordClick: (bookmark: Bookmark) => void;
  openInNewTab?: boolean;
}

// Fisher-Yates array shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const ExplorationMode: React.FC<ExplorationModeProps> = ({
  bookmarks,
  categories,
  onClose,
  onRecordClick,
  openInNewTab = true,
}) => {
  // 1. Full-screen focus animation state (displayed on every entry)
  const [showIntroAnimation, setShowIntroAnimation] = useState<boolean>(true);

  // 2. Focused Category filter state (null = all categories, or string = category ID)
  const [focusedCategoryId, setFocusedCategoryId] = useState<string | null>(null);

  // 3. Random seed to trigger re-shuffling on demand ("换一批")
  const [randomSeed, setRandomSeed] = useState<number>(1);

  // 4. Viewport capacity calculation: compute enough items to fill the current viewport
  const calculateCapacity = useCallback((): number => {
    if (typeof window === 'undefined') return 24;
    const w = window.innerWidth;
    const h = window.innerHeight;

    let cols = 1;
    if (w >= 1280) cols = 4;
    else if (w >= 1024) cols = 3;
    else if (w >= 640) cols = 2;
    else cols = 1;

    // Top bar is ~56px, container vertical padding is ~48px
    // Each bookmark row is approx 48px height + 14px gap = 62px
    const availableHeight = h - 110;
    const rows = Math.max(3, Math.floor(availableHeight / 62));
    return cols * rows;
  }, []);

  const [capacity, setCapacity] = useState<number>(calculateCapacity);

  // Auto-dismiss full-screen focus animation after 1.25s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntroAnimation(false);
    }, 1250);
    return () => clearTimeout(timer);
  }, []);

  // Update capacity on window resize
  useEffect(() => {
    const handleResize = () => {
      setCapacity(calculateCapacity());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateCapacity]);

  // Keyboard shortcut listener: Escape to exit, R or Space to shuffle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Dismiss intro animation on any key press
      if (showIntroAnimation) {
        setShowIntroAnimation(false);
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setRandomSeed((prev) => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showIntroAnimation]);

  // Fast Category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Active Category details (if focused)
  const activeCategory = useMemo(() => {
    if (!focusedCategoryId) return null;
    return categoryMap.get(focusedCategoryId) || null;
  }, [focusedCategoryId, categoryMap]);

  // Candidate bookmarks based on focused category
  const candidateBookmarks = useMemo(() => {
    if (!focusedCategoryId) {
      // Return all active bookmarks (filter out archived if present)
      return bookmarks.filter((b) => b.categoryId !== ARCHIVED_CATEGORY_ID);
    }

    // Include bookmarks belonging to this category or its child subcategories
    const allowedIds = new Set(getCategoryWithChildrenIds(focusedCategoryId, categories));
    return bookmarks.filter((b) => allowedIds.has(b.categoryId) || b.categoryId === focusedCategoryId);
  }, [bookmarks, focusedCategoryId, categories]);

  // Shuffled and sliced bookmarks to fill the viewport
  const displayedBookmarks = useMemo(() => {
    if (candidateBookmarks.length === 0) return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const _seed = randomSeed; // dependency trigger
    const shuffled = shuffleArray(candidateBookmarks);
    return shuffled.slice(0, Math.min(candidateBookmarks.length, capacity));
  }, [candidateBookmarks, capacity, randomSeed]);

  // Action: Select or switch focused category
  const handleSelectCategory = (categoryId: string) => {
    setFocusedCategoryId(categoryId);
    setRandomSeed((prev) => prev + 1);
  };

  // Action: Clear focused category filter
  const handleClearCategoryFilter = () => {
    setFocusedCategoryId(null);
    setRandomSeed((prev) => prev + 1);
  };

  // Action: Open bookmark link
  const handleOpenBookmark = (bm: Bookmark) => {
    onRecordClick(bm);
    window.open(bm.url, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none canvas-ambient-light">
      {/* ========================================================
          1. Full-screen Focus Entrance Animation (全屏聚焦动效)
      ======================================================== */}
      <AnimatePresence>
        {showIntroAnimation && (
          <motion.div
            key="exploration-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            onClick={() => setShowIntroAnimation(false)}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer select-none"
          >
            {/* Concentric expanding radar sonar wave pulses */}
            <div
              className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-indigo-500/35 animate-ping pointer-events-none"
              style={{ animationDuration: '2.4s' }}
            />
            <div className="absolute w-56 h-56 sm:w-80 sm:h-80 rounded-full border border-indigo-400/25 pointer-events-none animate-pulse" />
            <div className="absolute w-40 h-40 sm:w-60 sm:h-60 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

            {/* Centered Focus Announcement Card */}
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.08, opacity: 0, y: -12 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="relative px-8 py-7 rounded-2xl bg-neutral-900/95 border border-indigo-500/50 text-center shadow-2xl shadow-indigo-500/20 max-w-sm mx-4 flex flex-col items-center gap-3.5 backdrop-blur-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '9s' }} />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                  <span>探索模式已开启</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-xs text-neutral-300">
                  全屏沉浸聚焦 · 随机漫游网址
                </p>
              </div>

              <div className="text-[11px] text-neutral-400 bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/60 font-mono">
                点击分类图标聚焦目录 · 按 <kbd className="px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-200">Esc</kbd> 退出
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          2. Minimalist Header: Only Exit Button & Category Indicator
      ======================================================== */}
      <header className="h-14 shrink-0 px-4 sm:px-8 border-b border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md flex items-center justify-between gap-3">
        {/* Left: Exploration Mode Title & Focused Category Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-indigo-400 shrink-0">
            <Compass className="w-5 h-5 animate-spin-slow" />
            <span className="font-bold text-sm tracking-tight text-white">探索模式</span>
          </div>

          {activeCategory ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-xs text-indigo-200 truncate">
              <span className="text-neutral-400 text-[11px]">聚焦目录:</span>
              <div
                className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: hexToRgba(activeCategory.color || '#6366f1', 0.25),
                  color: activeCategory.color || '#6366f1',
                }}
              >
                <CategoryIcon name={activeCategory.icon} className="w-2.5 h-2.5" />
              </div>
              <span className="font-semibold truncate max-w-32 sm:max-w-48">{activeCategory.name}</span>
              <button
                type="button"
                onClick={handleClearCategoryFilter}
                className="ml-1 p-0.5 hover:bg-indigo-800/60 rounded text-indigo-300 hover:text-white transition-colors cursor-pointer"
                title="返回全部目录随机漫游"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="hidden sm:inline-flex text-[11px] text-neutral-500 font-mono">
              全库随机漫游 · 占满视窗
            </span>
          )}
        </div>

        {/* Right: Refresh/Shuffle & Exit Exploration Mode */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Shuffle / 换一批 */}
          <button
            type="button"
            onClick={() => setRandomSeed((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-750 transition-colors text-xs font-medium cursor-pointer"
            title="重新打乱，换一批随机网址 (快捷键 R)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">换一批</span>
          </button>

          {/* Exit Exploration Mode Button (退出探索模式) */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            title="退出探索模式 (快捷键 Esc)"
          >
            <span>退出探索模式</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono bg-neutral-200 text-neutral-700 rounded font-normal">
              Esc
            </kbd>
          </button>
        </div>
      </header>

      {/* ========================================================
          3. Bookmark List Area (仅显示网址列表，每条列表宽度一致)
      ======================================================== */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full">
          {displayedBookmarks.length > 0 ? (
            /* Equal-width responsive CSS Grid: guarantees exact identical pixel width for every item */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 w-full">
              {displayedBookmarks.map((bm) => {
                const cat = categoryMap.get(bm.categoryId);
                const catColor = cat?.color || '#6366f1';

                return (
                  <div
                    key={bm.id}
                    onClick={() => handleOpenBookmark(bm)}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800/90 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-150 group cursor-pointer"
                  >
                    {/* Element 1: Category Icon (Clickable to filter exploration by this category) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCategory(bm.categoryId);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 active:scale-95 shadow-2xs hover:ring-2 hover:ring-indigo-400"
                      style={{
                        backgroundColor: hexToRgba(catColor, 0.18),
                        color: catColor,
                      }}
                      title={`分类：${cat?.name || '未分类'} · 点击仅看此分类下的随机网址`}
                    >
                      <CategoryIcon name={cat?.icon} className="w-4 h-4" />
                    </button>

                    {/* Element 2: Website Title (Center, uniform truncation) */}
                    <span
                      className="truncate flex-1 text-sm font-medium text-neutral-200 group-hover:text-indigo-300 transition-colors"
                      title={bm.title}
                    >
                      {bm.title}
                    </span>

                    {/* Element 3: Star Status (Right) */}
                    <div className="shrink-0 flex items-center justify-center w-5 h-5">
                      {bm.isStarred ? (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-2xs" />
                      ) : (
                        <Star className="w-4 h-4 text-neutral-700 group-hover:text-neutral-600 transition-colors" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State if category or bookmarks list has no matching items */
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-200 mb-1">
                {activeCategory ? `「${activeCategory.name}」暂无可用网址` : '暂无书签网址数据'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mb-4">
                {activeCategory
                  ? '该分类目录尚未包含任何网址，您可以返回全部分类继续漫游。'
                  : '您可以退出探索模式，在主界面中添加您的第一个书签。'}
              </p>
              {activeCategory && (
                <button
                  type="button"
                  onClick={handleClearCategoryFilter}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  返回全部网址漫游
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
