import React from 'react';
import { Bookmark, Category } from '../types';
import { extractDomain, getFaviconUrl, formatRelativeTime } from '../utils/url';
import {
  X,
  BarChart3,
  Flame,
  Globe,
  ExternalLink,
  Star,
  Clock,
  Layers,
  Award,
} from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: Category[];
  onRecordClick: (bookmark: Bookmark) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  categories,
  onRecordClick,
}) => {
  if (!isOpen) return null;

  const totalBookmarks = bookmarks.length;
  const starredCount = bookmarks.filter((b) => b.isStarred).length;
  const pinnedCount = bookmarks.filter((b) => b.isPinned).length;
  const totalClicks = bookmarks.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);

  // Category counts
  const catCountMap = new Map<string, number>();
  for (const b of bookmarks) {
    catCountMap.set(b.categoryId, (catCountMap.get(b.categoryId) || 0) + 1);
  }

  // Find top category
  let topCategoryName = '暂无';
  let maxCatCount = 0;
  for (const cat of categories) {
    const c = catCountMap.get(cat.id) || 0;
    if (c > maxCatCount) {
      maxCatCount = c;
      topCategoryName = cat.name;
    }
  }

  // Top 10 Click Leaderboard (sorted by clickCount desc)
  const top10ByClicks = [...bookmarks]
    .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
    .slice(0, 10);

  // Recently added (sorted by createdAt desc)
  const recentlyAdded = [...bookmarks]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  const handleOpenLink = (bm: Bookmark) => {
    onRecordClick(bm);
    window.open(bm.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              数据统计与排行榜
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
              <div className="text-[11px] text-neutral-500 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>收藏总量</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {totalBookmarks}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
              <div className="text-[11px] text-neutral-500 mb-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>总点击访问</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {totalClicks}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
              <div className="text-[11px] text-neutral-500 mb-1 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>星标关注</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {starredCount}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
              <div className="text-[11px] text-neutral-500 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>最多书签分类</span>
              </div>
              <div className="text-lg font-bold truncate text-neutral-900 dark:text-neutral-100 pt-0.5">
                {topCategoryName}
              </div>
            </div>
          </div>

          {/* Top 10 Click Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  点击次数排行榜 (Top 10)
                </h3>
              </div>
              <span className="text-xs text-neutral-400">按历史点击频率排序</span>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {top10ByClicks.map((bm, index) => {
                const rank = index + 1;
                const domain = extractDomain(bm.url);
                const faviconUrl = getFaviconUrl(bm.url);

                return (
                  <div
                    key={bm.id}
                    className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors"
                  >
                    {/* Rank & Favicon & Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 text-center font-mono font-bold text-xs shrink-0 tabular-nums">
                        {rank === 1 && <span className="text-amber-500">🥇 1</span>}
                        {rank === 2 && <span className="text-slate-400">🥈 2</span>}
                        {rank === 3 && <span className="text-amber-700">🥉 3</span>}
                        {rank > 3 && <span className="text-neutral-400">{rank}</span>}
                      </div>

                      <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={faviconUrl}
                          alt=""
                          className="w-3.5 h-3.5 object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-1.5">
                          <span>{bm.title}</span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 truncate">
                          {domain}
                        </div>
                      </div>
                    </div>

                    {/* Clicks & Last Visited & Jump */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right text-xs tabular-nums">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {bm.clickCount} 次
                        </span>
                        <div className="text-[11px] text-neutral-400">
                          {formatRelativeTime(bm.lastClickedAt)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenLink(bm)}
                        title="打开网页"
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              各分类收藏占比
            </h3>
            <div className="space-y-2.5">
              {categories.map((cat) => {
                const count = catCountMap.get(cat.id) || 0;
                const percentage = totalBookmarks > 0 ? Math.round((count / totalBookmarks) * 100) : 0;
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">
                      <span className="font-medium">{cat.name}</span>
                      <span>
                        {count} 项 ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: cat.color || '#4f46e5',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recently Added */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                最近添加
              </h3>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              {recentlyAdded.map((bm) => (
                <div
                  key={bm.id}
                  className="p-2.5 px-3 flex items-center justify-between text-xs bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {bm.title}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 truncate hidden sm:inline">
                      {extractDomain(bm.url)}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 tabular-nums shrink-0">
                    {formatRelativeTime(bm.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
