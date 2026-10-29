import React, { useState, useMemo } from 'react';
import { Bookmark, Category } from '../../types';
import { extractDomain, getFaviconUrl, formatRelativeTime } from '../../utils/url';
import { hexToRgba, BOOKMARK_PALETTE } from '../../utils/color';
import {
  batchUpdateCategory,
  batchAddTags,
  batchRemoveTags,
  batchUpdateColor,
  batchTogglePin,
  batchToggleStar,
  batchDeleteBookmarks,
  buildCategoryTree,
  isBookmarkInactiveSixMonths,
} from '../../utils/storage';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  QrCode,
  Pin,
  Star,
  FolderInput,
  Tag,
  Palette,
  ChevronLeft,
  ChevronRight,
  Globe,
  SlidersHorizontal,
  X,
  Check,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useToast } from '../Toast';
import { ModalWrapper } from '../ModalWrapper';

interface BookmarkManagerTableProps {
  bookmarks: Bookmark[];
  categories: Category[];
  onUpdateBookmarks: (bookmarks: Bookmark[]) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onShowQrCode?: (bookmark: Bookmark) => void;
}

export const BookmarkManagerTable: React.FC<BookmarkManagerTableProps> = ({
  bookmarks,
  categories,
  onUpdateBookmarks,
  onEditBookmark,
  onShowQrCode,
}) => {
  const { showToast } = useToast();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'all' | 'pinned' | 'starred' | 'inactive' | 'colored'
  >('all');
  const [sortBy, setSortBy] = useState<
    'clicks_desc' | 'created_desc' | 'recent_click' | 'title_asc'
  >('clicks_desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch Operation Modals
  const [batchActionType, setBatchActionType] = useState<
    'category' | 'add_tags' | 'remove_tags' | 'color' | null
  >(null);
  const [batchTargetCategoryId, setBatchTargetCategoryId] = useState(categories[0]?.id || '');
  const [batchTagsInput, setBatchTagsInput] = useState('');
  const [batchSelectedColor, setBatchSelectedColor] = useState<string | undefined>(undefined);

  // Category Tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Unique tags list for filter dropdown
  const allTags = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => (b.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [bookmarks]);

  // Filter & sort
  const filteredBookmarks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return bookmarks
      .filter((b) => {
        // Keyword search
        if (q) {
          const inTitle = b.title.toLowerCase().includes(q);
          const inUrl = b.url.toLowerCase().includes(q);
          const inNotes = (b.notes || '').toLowerCase().includes(q);
          const inTags = (b.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!inTitle && !inUrl && !inNotes && !inTags) return false;
        }

        // Category filter
        if (selectedCategoryFilter) {
          if (b.categoryId !== selectedCategoryFilter) {
            // Also check if selected is a parent of this bookmark's category
            const bCat = categoryMap.get(b.categoryId);
            if (bCat?.parentId !== selectedCategoryFilter) return false;
          }
        }

        // Tag filter
        if (selectedTagFilter) {
          if (!b.tags || !b.tags.includes(selectedTagFilter)) return false;
        }

        // Status filter
        if (selectedStatusFilter === 'pinned' && !b.isPinned) return false;
        if (selectedStatusFilter === 'starred' && !b.isStarred) return false;
        if (selectedStatusFilter === 'inactive' && !isBookmarkInactiveSixMonths(b, now)) return false;
        if (selectedStatusFilter === 'colored' && !b.color) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'clicks_desc') return b.clickCount - a.clickCount;
        if (sortBy === 'recent_click') return (b.lastClickedAt || 0) - (a.lastClickedAt || 0);
        if (sortBy === 'created_desc') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [
    bookmarks,
    searchQuery,
    selectedCategoryFilter,
    selectedTagFilter,
    selectedStatusFilter,
    sortBy,
    categoryMap,
  ]);

  // Paginated data
  const totalPages = Math.ceil(filteredBookmarks.length / pageSize) || 1;
  const paginatedBookmarks = useMemo(() => {
    if (pageSize >= 9999) return filteredBookmarks;
    const start = (currentPage - 1) * pageSize;
    return filteredBookmarks.slice(start, start + pageSize);
  }, [filteredBookmarks, currentPage, pageSize]);

  // Select all for current page
  const isAllCurrentSelected =
    paginatedBookmarks.length > 0 &&
    paginatedBookmarks.every((b) => selectedIds.has(b.id));

  const handleToggleSelectAllCurrent = () => {
    const next = new Set(selectedIds);
    if (isAllCurrentSelected) {
      paginatedBookmarks.forEach((b) => next.delete(b.id));
    } else {
      paginatedBookmarks.forEach((b) => next.add(b.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('网址已复制到剪贴板', 'info');
  };

  // Single delete
  const handleDeleteSingle = (id: string, title: string) => {
    if (window.confirm(`确定删除书签「${title}」吗？`)) {
      const updated = bookmarks.filter((b) => b.id !== id);
      onUpdateBookmarks(updated);
      const next = new Set(selectedIds);
      next.delete(id);
      setSelectedIds(next);
      showToast('书签已删除', 'success');
    }
  };

  // ==========================================
  // Batch Execution Handlers
  // ==========================================

  const selectedArray = Array.from(selectedIds);

  const handleExecuteBatchCategory = () => {
    if (selectedArray.length === 0 || !batchTargetCategoryId) return;
    const targetCat = categoryMap.get(batchTargetCategoryId);
    const updated = batchUpdateCategory(selectedArray, batchTargetCategoryId, bookmarks);
    onUpdateBookmarks(updated);
    showToast(`已将 ${selectedArray.length} 个书签移动至「${targetCat?.name}」`, 'success');
    setBatchActionType(null);
    setSelectedIds(new Set());
  };

  const handleExecuteBatchAddTags = () => {
    const tags = batchTagsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (tags.length === 0) {
      showToast('请输入要添加的标签名称', 'error');
      return;
    }

    const updated = batchAddTags(selectedArray, tags, bookmarks);
    onUpdateBookmarks(updated);
    showToast(`已为 ${selectedArray.length} 个书签追加标签`, 'success');
    setBatchActionType(null);
    setBatchTagsInput('');
    setSelectedIds(new Set());
  };

  const handleExecuteBatchRemoveTags = () => {
    const tags = batchTagsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (tags.length === 0) {
      showToast('请输入要移除的标签名称', 'error');
      return;
    }

    const updated = batchRemoveTags(selectedArray, tags, bookmarks);
    onUpdateBookmarks(updated);
    showToast(`已从 ${selectedArray.length} 个书签中移除指定标签`, 'success');
    setBatchActionType(null);
    setBatchTagsInput('');
    setSelectedIds(new Set());
  };

  const handleExecuteBatchColor = () => {
    const updated = batchUpdateColor(selectedArray, batchSelectedColor, bookmarks);
    onUpdateBookmarks(updated);
    showToast(
      batchSelectedColor
        ? `已为 ${selectedArray.length} 个书签应用指定强调色`
        : `已清除 ${selectedArray.length} 个书签的标记色`,
      'success'
    );
    setBatchActionType(null);
    setSelectedIds(new Set());
  };

  const handleBatchTogglePin = (isPinned: boolean) => {
    const updated = batchTogglePin(selectedArray, isPinned, bookmarks);
    onUpdateBookmarks(updated);
    showToast(
      isPinned
        ? `已将选中的 ${selectedArray.length} 个书签置顶`
        : `已取消选中的 ${selectedArray.length} 个书签置顶`,
      'success'
    );
  };

  const handleBatchToggleStar = (isStarred: boolean) => {
    const updated = batchToggleStar(selectedArray, isStarred, bookmarks);
    onUpdateBookmarks(updated);
    showToast(
      isStarred
        ? `已将选中的 ${selectedArray.length} 个书签设为星标`
        : `已取消选中的 ${selectedArray.length} 个书签星标`,
      'success'
    );
  };

  const handleBatchDelete = () => {
    if (
      window.confirm(
        `警告：确定永久删除选中的 ${selectedArray.length} 个书签网址吗？此操作无法撤销。`
      )
    ) {
      const updated = batchDeleteBookmarks(selectedArray, bookmarks);
      onUpdateBookmarks(updated);
      showToast(`已批量删除 ${selectedArray.length} 个书签`, 'success');
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Header */}
      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="多字段检索 (标题、URL域名、备注、标签)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
            >
              <option value="">全部所属分类</option>
              {categoryTree.map((root) => (
                <React.Fragment key={root.id}>
                  <option value={root.id}>📂 {root.name}</option>
                  {root.children.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      &nbsp;&nbsp;↳ {sub.name}
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTagFilter}
              onChange={(e) => {
                setSelectedTagFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 max-w-[130px] truncate"
            >
              <option value="">全部标签</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
            >
              <option value="all">全部状态</option>
              <option value="pinned">仅看置顶</option>
              <option value="starred">仅看星标</option>
              <option value="inactive">闲置 6 个月以上</option>
              <option value="colored">仅看有强调色</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
            >
              <option value="clicks_desc">点击量从高到低</option>
              <option value="recent_click">最近访问优先</option>
              <option value="created_desc">创建时间倒序</option>
              <option value="title_asc">标题名称字母</option>
            </select>

            {/* Clear filters if any */}
            {(searchQuery || selectedCategoryFilter || selectedTagFilter || selectedStatusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('');
                  setSelectedTagFilter('');
                  setSelectedStatusFilter('all');
                }}
                className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-dotted ml-1"
              >
                重置筛选
              </button>
            )}
          </div>
        </div>

        {/* Selected Batch Operations Action Bar */}
        {selectedArray.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 animate-in fade-in shadow-md">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-wide">
                已选中 {selectedArray.length} 个网址
              </span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-[11px] opacity-75 hover:opacity-100 underline ml-2"
              >
                取消选择
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {/* Batch Move Category */}
              <button
                type="button"
                onClick={() => {
                  setBatchActionType('category');
                  setBatchTargetCategoryId(categories[0]?.id || '');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center gap-1 transition-colors"
              >
                <FolderInput className="w-3.5 h-3.5" />
                <span>批量修改分类</span>
              </button>

              {/* Batch Add Tags */}
              <button
                type="button"
                onClick={() => {
                  setBatchActionType('add_tags');
                  setBatchTagsInput('');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center gap-1 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>追加标签</span>
              </button>

              {/* Batch Remove Tags */}
              <button
                type="button"
                onClick={() => {
                  setBatchActionType('remove_tags');
                  setBatchTagsInput('');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>移除标签</span>
              </button>

              {/* Batch Set Color */}
              <button
                type="button"
                onClick={() => {
                  setBatchActionType('color');
                  setBatchSelectedColor(BOOKMARK_PALETTE[0].value);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center gap-1 transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>设置标记色</span>
              </button>

              {/* Batch Pin / Unpin */}
              <button
                type="button"
                onClick={() => handleBatchTogglePin(true)}
                className="p-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20"
                title="批量置顶"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>

              {/* Batch Star / Unstar */}
              <button
                type="button"
                onClick={() => handleBatchToggleStar(true)}
                className="p-1.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20"
                title="批量星标"
              >
                <Star className="w-3.5 h-3.5" />
              </button>

              {/* Batch Delete */}
              <button
                type="button"
                onClick={handleBatchDelete}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 transition-colors ml-1"
                title="批量删除所选网址"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>删除</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Data Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-950/50 text-neutral-500 dark:text-neutral-400">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllCurrent}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title={isAllCurrentSelected ? '取消全选本页' : '全选本页'}
                  >
                    {isAllCurrentSelected ? (
                      <CheckSquare className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 min-w-[200px]">
                  网址与标题
                </th>
                <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 min-w-[130px]">
                  所属分类目录
                </th>
                <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 min-w-[140px]">
                  关联标签
                </th>
                <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 w-24 tabular-nums">
                  点击统计
                </th>
                <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 w-28 tabular-nums">
                  最近访问
                </th>
                <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 w-20 text-center">
                  状态
                </th>
                <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 w-24 text-right">
                  操作
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800/80">
              {paginatedBookmarks.length > 0 ? (
                paginatedBookmarks.map((bm) => {
                  const isSelected = selectedIds.has(bm.id);
                  const domain = extractDomain(bm.url);
                  const faviconUrl = getFaviconUrl(bm.url);
                  const cat = categoryMap.get(bm.categoryId);
                  const parentCat = cat?.parentId ? categoryMap.get(cat.parentId) : undefined;
                  const isInactive = isBookmarkInactiveSixMonths(bm);

                  return (
                    <tr
                      key={bm.id}
                      className={`transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-850/60 ${
                        isSelected
                          ? 'bg-neutral-100/70 dark:bg-neutral-800/50'
                          : bm.isPinned
                          ? 'bg-neutral-50/40 dark:bg-neutral-900/40'
                          : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(bm.id)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Title, Favicon, Notes */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 flex items-center justify-center shrink-0 overflow-hidden"
                            style={
                              bm.color
                                ? {
                                    borderColor: hexToRgba(bm.color, 0.4),
                                    backgroundColor: hexToRgba(bm.color, 0.12),
                                  }
                                : undefined
                            }
                          >
                            {faviconUrl ? (
                              <img
                                src={faviconUrl}
                                alt=""
                                className="w-3.5 h-3.5 object-contain"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Globe className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {bm.color && (
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: bm.color }}
                                  title="标记颜色"
                                />
                              )}
                              <a
                                href={bm.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-neutral-900 dark:text-neutral-100 hover:underline truncate max-w-sm inline-block"
                              >
                                {bm.title}
                              </a>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-neutral-400 font-mono truncate">
                                {domain}
                              </span>
                              {bm.notes && (
                                <span
                                  className="text-[10px] text-neutral-400 truncate max-w-[200px]"
                                  title={bm.notes}
                                >
                                  · {bm.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category path */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col text-[11px] leading-tight">
                          {parentCat && (
                            <span className="text-neutral-400 truncate">
                              {parentCat.name} /
                            </span>
                          )}
                          <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                            {cat?.name || '默认分类'}
                          </span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {bm.tags && bm.tags.length > 0 ? (
                            bm.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                              >
                                #{t}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-300 dark:text-neutral-700 text-[11px]">
                              -
                            </span>
                          )}
                          {bm.tags && bm.tags.length > 3 && (
                            <span className="text-[10px] text-neutral-400">
                              +{bm.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Click Count */}
                      <td className="py-2.5 px-3 font-mono text-neutral-700 dark:text-neutral-300">
                        {bm.clickCount} 次
                      </td>

                      {/* Last Clicked Relative */}
                      <td className="py-2.5 px-3 text-neutral-500 dark:text-neutral-400 text-[11px]">
                        <span className={isInactive ? 'text-amber-500 dark:text-amber-400' : ''}>
                          {formatRelativeTime(bm.lastClickedAt)}
                        </span>
                      </td>

                      {/* Status Badges */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {bm.isPinned && (
                            <span title="已置顶" className="text-neutral-900 dark:text-neutral-100">
                              <Pin className="w-3.5 h-3.5 rotate-45 fill-current" />
                            </span>
                          )}
                          {bm.isStarred && (
                            <span title="已星标" className="text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </span>
                          )}
                          {isInactive && (
                            <span
                              title="超过 6 个月未访问"
                              className="text-[10px] px-1 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
                            >
                              闲置
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Operations */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(bm.url)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="复制链接"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {onShowQrCode && (
                            <button
                              type="button"
                              onClick={() => onShowQrCode(bm)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              title="生成二维码"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditBookmark(bm)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="编辑书签属性"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(bm.id, bm.title)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="删除书签"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-neutral-400">
                    未找到符合条件的网址书签
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span>
              显示 {paginatedBookmarks.length} 条，共 {filteredBookmarks.length} 条网址
            </span>
            <div className="flex items-center gap-1.5">
              <span>每页:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
              >
                <option value={10}>10 条</option>
                <option value={25}>25 条</option>
                <option value={50}>50 条</option>
                <option value={9999}>全部展示</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* Batch Dialog: Modify Category                            */}
      {/* ======================================================== */}
      <ModalWrapper
        isOpen={batchActionType === 'category'}
        onClose={() => setBatchActionType(null)}
        maxWidth="max-w-md"
        className="p-6 space-y-4"
      >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FolderInput className="w-4 h-4 text-neutral-500" />
              <span>批量修改分类目录（选定 {selectedArray.length} 项）</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                选择要迁入的目标分类:
              </label>
              <select
                value={batchTargetCategoryId}
                onChange={(e) => setBatchTargetCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
              >
                {categoryTree.map((root) => (
                  <React.Fragment key={root.id}>
                    <option value={root.id}>📂 {root.name}</option>
                    {root.children.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        &nbsp;&nbsp;↳ {sub.name}
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchActionType(null)}
                className="px-4 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchCategory}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
              >
                确认迁入
              </button>
            </div>
      </ModalWrapper>

      {/* ======================================================== */}
      {/* Batch Dialog: Add or Remove Tags                         */}
      {/* ======================================================== */}
      <ModalWrapper
        isOpen={batchActionType === 'add_tags' || batchActionType === 'remove_tags'}
        onClose={() => setBatchActionType(null)}
        maxWidth="max-w-md"
        className="p-6 space-y-4"
      >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-neutral-500" />
              <span>
                {batchActionType === 'add_tags'
                  ? `批量追加标签（选定 ${selectedArray.length} 项）`
                  : `批量移除标签（选定 ${selectedArray.length} 项）`}
              </span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                输入标签名称（多个标签用逗号或空格隔开）:
              </label>
              <input
                type="text"
                autoFocus
                value={batchTagsInput}
                onChange={(e) => setBatchTagsInput(e.target.value)}
                placeholder="如: 工具, 前端, AI..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchActionType(null)}
                className="px-4 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
              >
                取消
              </button>
              <button
                type="button"
                onClick={
                  batchActionType === 'add_tags'
                    ? handleExecuteBatchAddTags
                    : handleExecuteBatchRemoveTags
                }
                className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
              >
                {batchActionType === 'add_tags' ? '确认追加' : '确认移除'}
              </button>
            </div>
      </ModalWrapper>

      {/* ======================================================== */}
      {/* Batch Dialog: Set Bookmark Color                         */}
      {/* ======================================================== */}
      <ModalWrapper
        isOpen={batchActionType === 'color'}
        onClose={() => setBatchActionType(null)}
        maxWidth="max-w-md"
        className="p-6 space-y-4"
      >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-neutral-500" />
              <span>批量设置标记颜色（选定 ${selectedArray.length} 项）</span>
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-neutral-500">
                选择统一强调色或清除颜色:
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                {/* No Color option */}
                <button
                  type="button"
                  onClick={() => setBatchSelectedColor(undefined)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs transition-all ${
                    !batchSelectedColor
                      ? 'border-neutral-900 dark:border-neutral-100 ring-2 ring-neutral-900/20'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  无
                </button>

                {BOOKMARK_PALETTE.map((p) => {
                  const isSelected = batchSelectedColor === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setBatchSelectedColor(p.value)}
                      title={p.label}
                      style={{ backgroundColor: p.value }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 scale-110 shadow-xs'
                          : 'opacity-85 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setBatchActionType(null)}
                className="px-4 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchColor}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
              >
                确认应用
              </button>
            </div>
      </ModalWrapper>
    </div>
  );
};
