import React, { useState, useEffect, useMemo } from 'react';
import { Bookmark, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import {
  Sparkles,
  ExternalLink,
  Shuffle,
  Copy,
  Check,
  QrCode,
  Compass,
  ChevronUp,
  ChevronDown,
  Clock,
  Tag,
} from 'lucide-react';

interface DailyPicksBannerProps {
  bookmarks: Bookmark[];
  categories: Category[];
  onRecordClick: (bookmark: Bookmark) => void;
  onShowQrCode?: (bookmark: Bookmark) => void;
  onSelectCategory?: (catId: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const DailyPicksBanner: React.FC<DailyPicksBannerProps> = ({
  bookmarks,
  categories,
  onRecordClick,
  onShowQrCode,
  onSelectCategory,
  onSelectTag,
}) => {
  const [copied, setCopied] = useState(false);
  const [currentPickId, setCurrentPickId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter for unvisited bookmarks (0 clicks or never clicked)
  const unvisitedBookmarks = useMemo(() => {
    return bookmarks.filter((b) => b.clickCount === 0 || !b.lastClickedAt);
  }, [bookmarks]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Initialize or restore today's pick
  useEffect(() => {
    if (bookmarks.length === 0) return;

    const storedDate = localStorage.getItem('bookmarkhub_daily_pick_date');
    const storedId = localStorage.getItem('bookmarkhub_daily_pick_id');

    // Check if stored pick is still valid
    const targetPool = unvisitedBookmarks.length > 0 ? unvisitedBookmarks : bookmarks;

    if (storedDate === todayStr && storedId && targetPool.some((b) => b.id === storedId)) {
      setCurrentPickId(storedId);
    } else {
      // Pick a new one
      const randomIndex = Math.floor(Math.random() * targetPool.length);
      const chosen = targetPool[randomIndex];
      if (chosen) {
        setCurrentPickId(chosen.id);
        localStorage.setItem('bookmarkhub_daily_pick_date', todayStr);
        localStorage.setItem('bookmarkhub_daily_pick_id', chosen.id);
      }
    }
  }, [bookmarks, unvisitedBookmarks, todayStr]);

  // Get active picked bookmark object
  const currentPick = useMemo(() => {
    if (!currentPickId) return null;
    return bookmarks.find((b) => b.id === currentPickId) || null;
  }, [bookmarks, currentPickId]);

  // Find category for current pick
  const category = useMemo(() => {
    if (!currentPick) return undefined;
    return categories.find((c) => c.id === currentPick.categoryId);
  }, [categories, currentPick]);

  // Shuffle handler to pick another
  const handleShuffle = () => {
    const pool = unvisitedBookmarks.length > 0 ? unvisitedBookmarks : bookmarks;
    if (pool.length <= 1) return;

    const candidates = pool.filter((b) => b.id !== currentPickId);
    const nextPick = candidates[Math.floor(Math.random() * candidates.length)];
    if (nextPick) {
      setCurrentPickId(nextPick.id);
      localStorage.setItem('bookmarkhub_daily_pick_date', todayStr);
      localStorage.setItem('bookmarkhub_daily_pick_id', nextPick.id);
    }
  };

  // Copy URL
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPick) return;
    try {
      await navigator.clipboard.writeText(currentPick.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  // Visit link
  const handleVisit = () => {
    if (!currentPick) return;
    onRecordClick(currentPick);
    window.open(currentPick.url, '_blank', 'noopener,noreferrer');
  };

  // Extract domain
  const domain = useMemo(() => {
    if (!currentPick) return '';
    try {
      return new URL(currentPick.url).hostname.replace(/^www\./, '');
    } catch {
      return currentPick.url;
    }
  }, [currentPick]);

  if (!currentPick) return null;

  const isAllVisitedFallback = unvisitedBookmarks.length === 0;

  return (
    <div className="mb-6 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-linear-to-r from-amber-500/5 via-neutral-50 to-indigo-500/5 dark:from-amber-500/10 dark:via-neutral-900 dark:to-indigo-500/10 backdrop-blur-xs shadow-xs transition-all duration-200 overflow-hidden">
      {/* Banner Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-100/40 dark:bg-neutral-850/40">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
            <Sparkles className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>今日发现 · DAILY PICK</span>
          </span>

          <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:inline-block" />

          <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline-block">
            {isAllVisitedFallback
              ? '已阅完全部书签，今日温故知新'
              : `藏库中尚有 ${unvisitedBookmarks.length} 个未探索的网址`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShuffle}
            className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-md transition-colors"
            title="换一个推荐网址"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">换一个</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md transition-colors"
            title={isCollapsed ? '展开推荐详情' : '收起推荐横幅'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Banner Body Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            {/* Favicon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 p-2 shrink-0 flex items-center justify-center shadow-xs">
              <img
                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                  domain
                )}&sz=64`}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Title, tags, notes */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3
                  onClick={handleVisit}
                  className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 hover:underline cursor-pointer truncate"
                  title={currentPick.title}
                >
                  {currentPick.title}
                </h3>

                {category && (
                  <button
                    type="button"
                    onClick={() => onSelectCategory?.(category.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: `${category.color || '#6366f1'}18`,
                      color: category.color || '#6366f1',
                    }}
                  >
                    <CategoryIcon name={category.icon} className="w-3 h-3" />
                    <span>{category.name}</span>
                  </button>
                )}

                <span className="text-xs text-neutral-400 font-mono">
                  {domain}
                </span>
              </div>

              {currentPick.notes && (
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2 max-w-3xl">
                  {currentPick.notes}
                </p>
              )}

              {/* Tags */}
              {currentPick.tags && currentPick.tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5">
                  {currentPick.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onSelectTag?.(tag)}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      <Tag className="w-2.5 h-2.5 opacity-60" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-800"
              title="复制网址链接"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            {onShowQrCode && (
              <button
                type="button"
                onClick={() => onShowQrCode(currentPick)}
                className="p-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-800"
                title="手机扫码访问 (二维码)"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleVisit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-xs hover:shadow-md active:scale-98"
            >
              <span>立即探索</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
