import React, { useState, useMemo } from 'react';
import { Bookmark, Category } from '../types';
import { extractDomain, getFaviconUrl, formatRelativeTime } from '../utils/url';
import { buildCategoryTree } from '../utils/storage';
import { batchCheckBookmarksHealth } from '../utils/healthCheck';
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
  Activity,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Calendar,
} from 'lucide-react';
import { useToast } from './Toast';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: Category[];
  onRecordClick: (bookmark: Bookmark) => void;
  onUpdateBookmarks?: (bookmarks: Bookmark[]) => void;
  onEditBookmark?: (bookmark: Bookmark) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  categories,
  onRecordClick,
  onUpdateBookmarks,
  onEditBookmark,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'health'>('overview');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthProgress, setHealthProgress] = useState({ completed: 0, total: 0 });
  const [hoveredDay, setHoveredDay] = useState<{ dateStr: string; count: number } | null>(null);

  // Generate 3-Month Activity Heatmap Data (approx 14 weeks = 98 days)
  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const WEEKS_COUNT = 14;

    // Build day map: date string (YYYY-MM-DD) -> activity count
    const activityMap = new Map<string, number>();

    bookmarks.forEach((bm) => {
      if (bm.lastClickedAt) {
        const d = new Date(bm.lastClickedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        // Base visit + click weight
        activityMap.set(key, (activityMap.get(key) || 0) + 1 + Math.min(bm.clickCount || 0, 3));
      }
      if (bm.createdAt) {
        const d = new Date(bm.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        activityMap.set(key, (activityMap.get(key) || 0) + 1);
      }
    });

    // Determine starting Sunday
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const endDate = new Date(today);
    // align to Saturday if needed
    endDate.setDate(today.getDate() + (6 - dayOfWeek));

    const weeks: Array<Array<{ date: Date; dateStr: string; count: number; level: number }>> = [];

    for (let w = WEEKS_COUNT - 1; w >= 0; w--) {
      const currentWeek: Array<{ date: Date; dateStr: string; count: number; level: number }> = [];
      for (let d = 0; d < 7; d++) {
        const dayOffset = w * 7 + (6 - d);
        const dateObj = new Date(endDate);
        dateObj.setDate(endDate.getDate() - dayOffset);

        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(dateObj.getDate()).padStart(2, '0')}`;
        const count = activityMap.get(dateStr) || 0;

        let level = 0;
        if (count >= 7) level = 4;
        else if (count >= 4) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;

        currentWeek.push({ date: dateObj, dateStr, count, level });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [bookmarks]);

  if (!isOpen) return null;

  const totalBookmarks = bookmarks.length;
  const starredCount = bookmarks.filter((b) => b.isStarred).length;
  const totalClicks = bookmarks.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);

  // Category counts
  const catCountMap = new Map<string, number>();
  for (const b of bookmarks) {
    catCountMap.set(b.categoryId, (catCountMap.get(b.categoryId) || 0) + 1);
  }

  const categoryTree = buildCategoryTree(categories);

  // Find top category
  let topCategoryName = '暂无';
  let maxCatCount = 0;
  for (const root of categoryTree) {
    let sum = catCountMap.get(root.id) || 0;
    for (const child of root.children) {
      sum += catCountMap.get(child.id) || 0;
    }
    if (sum > maxCatCount) {
      maxCatCount = sum;
      topCategoryName = root.name;
    }
  }

  // Top 10 Click Leaderboard
  const top10ByClicks = [...bookmarks]
    .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
    .slice(0, 10);

  // Health stats
  const healthyCount = bookmarks.filter((b) => b.healthStatus === 'healthy').length;
  const warningCount = bookmarks.filter((b) => b.healthStatus === 'warning').length;
  const errorCount = bookmarks.filter((b) => b.healthStatus === 'error').length;
  const unknownCount = bookmarks.filter((b) => !b.healthStatus || b.healthStatus === 'unknown').length;
  const problematicBookmarks = bookmarks.filter(
    (b) => b.healthStatus === 'error' || b.healthStatus === 'warning'
  );

  const handleOpenLink = (bm: Bookmark) => {
    onRecordClick(bm);
    window.open(bm.url, '_blank', 'noopener,noreferrer');
  };

  // Run batch health check
  const handleRunHealthCheck = async () => {
    if (bookmarks.length === 0) {
      showToast('暂无书签可检测', 'info');
      return;
    }
    setIsCheckingHealth(true);
    setHealthProgress({ completed: 0, total: bookmarks.length });

    try {
      const updatedBookmarks = await batchCheckBookmarksHealth(bookmarks, (completed, total) => {
        setHealthProgress({ completed, total });
      });

      if (onUpdateBookmarks) {
        onUpdateBookmarks(updatedBookmarks);
      }

      const errors = updatedBookmarks.filter((b) => b.healthStatus === 'error').length;
      const warnings = updatedBookmarks.filter((b) => b.healthStatus === 'warning').length;
      const healthy = updatedBookmarks.filter((b) => b.healthStatus === 'healthy').length;

      showToast(
        `健康检查完成：${healthy} 个正常，${warnings} 个警告，${errors} 个异常`,
        errors > 0 ? 'error' : 'info'
      );
    } catch {
      showToast('健康检查过程中出现异常', 'error');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const levelColorClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-emerald-200 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800';
      case 2:
        return 'bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600';
      case 3:
        return 'bg-emerald-500 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-400';
      case 4:
        return 'bg-emerald-600 dark:bg-emerald-400 border-emerald-700 dark:border-emerald-300';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-750';
    }
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
              数据统计与综合洞察
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            数据概览与排行榜
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('heatmap')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'heatmap'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            近三月活跃热力图
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'health'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
            网址健康诊断
            {(errorCount > 0 || warningCount > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
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

              {/* 2-Level Category Distribution Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  各级分类收藏占比
                </h3>
                <div className="space-y-4">
                  {categoryTree.map((parent) => {
                    let cumulativeCount = catCountMap.get(parent.id) || 0;
                    for (const child of parent.children) {
                      cumulativeCount += catCountMap.get(child.id) || 0;
                    }

                    const percentage =
                      totalBookmarks > 0 ? Math.round((cumulativeCount / totalBookmarks) * 100) : 0;

                    return (
                      <div
                        key={parent.id}
                        className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 space-y-2"
                      >
                        <div className="flex justify-between text-xs text-neutral-700 dark:text-neutral-300 tabular-nums">
                          <span className="font-semibold">{parent.name}</span>
                          <span>
                            {cumulativeCount} 项 ({percentage}%)
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: parent.color || '#6366f1',
                            }}
                          />
                        </div>

                        {/* Subcategories list */}
                        {parent.children.length > 0 && (
                          <div className="pt-1.5 pl-3 border-l border-neutral-200 dark:border-neutral-800 space-y-1.5 text-[11px] text-neutral-500">
                            {parent.children.map((child) => {
                              const childCount = catCountMap.get(child.id) || 0;
                              return (
                                <div key={child.id} className="flex justify-between items-center">
                                  <span>↳ {child.name}</span>
                                  <span className="font-mono tabular-nums">{childCount} 项</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ACTIVITY HEATMAP */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      近 3 个月书签访问习惯热力分布
                    </h3>
                  </div>
                  <span className="text-xs text-neutral-400">基于 lastClickedAt 与访问频次</span>
                </div>

                {/* Grid Container */}
                <div className="overflow-x-auto pb-2">
                  <div className="inline-flex gap-1.5">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-1.5 text-[10px] text-neutral-400 select-none pt-0.5 pr-1 font-mono">
                      <span className="h-3 leading-3">日</span>
                      <span className="h-3 leading-3 opacity-0">一</span>
                      <span className="h-3 leading-3">二</span>
                      <span className="h-3 leading-3 opacity-0">三</span>
                      <span className="h-3 leading-3">四</span>
                      <span className="h-3 leading-3 opacity-0">五</span>
                      <span className="h-3 leading-3">六</span>
                    </div>

                    {/* Columns (Weeks) */}
                    {heatmapData.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1.5">
                        {week.map((day) => (
                          <div
                            key={day.dateStr}
                            onMouseEnter={() =>
                              setHoveredDay({ dateStr: day.dateStr, count: day.count })
                            }
                            onMouseLeave={() => setHoveredDay(null)}
                            className={`w-3.5 h-3.5 rounded-xs border transition-colors cursor-pointer ${levelColorClass(
                              day.level
                            )} hover:ring-2 hover:ring-neutral-400 dark:hover:ring-neutral-500`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heatmap Legend and Tooltip Preview */}
                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <div className="text-neutral-500 text-[11px]">
                    {hoveredDay ? (
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {hoveredDay.dateStr}: {hoveredDay.count} 次书签活动记录
                      </span>
                    ) : (
                      <span>鼠标悬浮在方块上查看具体日期活跃度</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <span>较少</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 dark:bg-emerald-950 border border-emerald-300" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 dark:bg-emerald-700 border border-emerald-500" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-500 border border-emerald-600" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400 border border-emerald-700" />
                    <span>高频</span>
                  </div>
                </div>
              </div>

              {/* Habit Insights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                  <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    活跃书签率
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {totalBookmarks > 0
                      ? Math.round(
                          (bookmarks.filter(
                            (b) =>
                              b.lastClickedAt &&
                              Date.now() - b.lastClickedAt < 30 * 24 * 60 * 60 * 1000
                          ).length /
                            totalBookmarks) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">近30天内有访问记录的书签</div>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                  <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    沉睡书签
                  </div>
                  <div className="text-xl font-bold font-mono text-neutral-700 dark:text-neutral-300">
                    {
                      bookmarks.filter(
                        (b) =>
                          !b.lastClickedAt ||
                          Date.now() - b.lastClickedAt > 180 * 24 * 60 * 60 * 1000
                      ).length
                    }
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">超过半年未访问或从未点击</div>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                  <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    平均访问密度
                  </div>
                  <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {totalBookmarks > 0 ? (totalClicks / totalBookmarks).toFixed(1) : 0}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">每项收藏平均访问频次</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH CHECK */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              {/* Health Overview Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mb-0.5 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    正常连通
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    {healthyCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 mb-0.5 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    响应缓慢/受限
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
                    {warningCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-rose-200/60 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20">
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 mb-0.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    可能失效
                  </div>
                  <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300">
                    {errorCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                  <div className="text-[11px] text-neutral-500 mb-0.5 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    待检测
                  </div>
                  <div className="text-2xl font-bold font-mono text-neutral-700 dark:text-neutral-300">
                    {unknownCount}
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    一键全面网址健康巡检
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                    通过浏览器并行探测各书签域名的可访问性，自动标注正常、警告与失效状态。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunHealthCheck}
                  disabled={isCheckingHealth}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                  <span>
                    {isCheckingHealth
                      ? `检测中 (${healthProgress.completed}/${healthProgress.total})`
                      : '立即检测全部书签'}
                  </span>
                </button>
              </div>

              {/* Progress bar during run */}
              {isCheckingHealth && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-neutral-500 font-mono">
                    <span>检测进度</span>
                    <span>
                      {Math.round((healthProgress.completed / Math.max(healthProgress.total, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-150"
                      style={{
                        width: `${(healthProgress.completed / Math.max(healthProgress.total, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Problematic links list */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">
                  异常与警告书签清单 ({problematicBookmarks.length})
                </h4>

                {problematicBookmarks.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400 text-xs">
                    {healthyCount > 0
                      ? '所有已检测的书签均连接通畅，未发现异常链接！'
                      : '尚未进行检测，请点击上方按钮开始网址巡检'}
                  </div>
                ) : (
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                    {problematicBookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 text-xs"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span
                            className={`p-1 rounded-md shrink-0 ${
                              bm.healthStatus === 'error'
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}
                          >
                            {bm.healthStatus === 'error' ? (
                              <AlertCircle className="w-3.5 h-3.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            )}
                          </span>

                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {bm.title}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-400 truncate">
                              {bm.url}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onEditBookmark && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEditBookmark(bm);
                              }}
                              title="编辑书签信息"
                              className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenLink(bm)}
                            title="打开网址验证"
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
