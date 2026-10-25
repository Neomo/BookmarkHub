import React, { useState, useMemo } from 'react';
import { Bookmark } from '../../types';
import {
  getTagStatistics,
  renameTagInBookmarks,
  deleteTagFromBookmarks,
  mergeTagsInBookmarks,
  TagStat,
} from '../../utils/storage';
import { extractDomain, getFaviconUrl } from '../../utils/url';
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  GitMerge,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '../Toast';

interface TagManagerProps {
  bookmarks: Bookmark[];
  onUpdateBookmarks: (updated: Bookmark[]) => void;
  onOpenEditBookmark?: (bookmark: Bookmark) => void;
}

export const TagManager: React.FC<TagManagerProps> = ({
  bookmarks,
  onUpdateBookmarks,
  onOpenEditBookmark,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'count_desc' | 'name_asc'>('count_desc');

  // Active expanded tag to view its bookmarks
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [mergeIntoTag, setMergeIntoTag] = useState('');

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Statistics
  const allTagStats = useMemo(() => getTagStatistics(bookmarks), [bookmarks]);

  const filteredTags = useMemo(() => {
    return allTagStats
      .filter((t) => t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'count_desc') {
          return b.count - a.count || a.name.localeCompare(b.name);
        }
        return a.name.localeCompare(b.name);
      });
  }, [allTagStats, searchQuery, sortBy]);

  // Bookmarks for selected tag
  const taggedBookmarks = useMemo(() => {
    if (!selectedTag) return [];
    return bookmarks.filter((b) => b.tags && b.tags.includes(selectedTag));
  }, [bookmarks, selectedTag]);

  // Handle Rename
  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;
    const cleanNew = renameInput.trim().replace(/^#/, '');
    if (!cleanNew) {
      showToast('标签名称不能为空', 'error');
      return;
    }
    if (cleanNew === renameTarget) {
      setRenameTarget(null);
      return;
    }

    const updated = renameTagInBookmarks(renameTarget, cleanNew, bookmarks);
    onUpdateBookmarks(updated);
    showToast(`标签 #${renameTarget} 已重命名为 #${cleanNew}`, 'success');
    if (selectedTag === renameTarget) {
      setSelectedTag(cleanNew);
    }
    setRenameTarget(null);
  };

  // Handle Delete
  const handleDeleteTag = (tagName: string, count: number) => {
    if (
      window.confirm(
        `确定删除标签「#${tagName}」吗？\n该标签将从关联的 ${count} 个书签中移除（不会删除书签本身）。`
      )
    ) {
      const updated = deleteTagFromBookmarks(tagName, bookmarks);
      onUpdateBookmarks(updated);
      showToast(`标签 #${tagName} 已从所有书签中移除`, 'success');
      if (selectedTag === tagName) {
        setSelectedTag(null);
      }
    }
  };

  // Handle Merge
  const handleConfirmMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeTarget || !mergeIntoTag) return;
    if (mergeTarget === mergeIntoTag) {
      showToast('不能合并为相同标签', 'error');
      return;
    }

    const updated = mergeTagsInBookmarks(mergeTarget, mergeIntoTag, bookmarks);
    onUpdateBookmarks(updated);
    showToast(`标签 #${mergeTarget} 已成功合并至 #${mergeIntoTag}`, 'success');
    if (selectedTag === mergeTarget) {
      setSelectedTag(mergeIntoTag);
    }
    setMergeTarget(null);
  };

  // Quick remove tag from a single bookmark in preview
  const handleRemoveTagFromSingleBookmark = (bookmarkId: string, tagToRemove: string) => {
    const updated = bookmarks.map((b) => {
      if (b.id === bookmarkId) {
        return {
          ...b,
          tags: (b.tags || []).filter((t) => t !== tagToRemove),
          updatedAt: Date.now(),
        };
      }
      return b;
    });
    onUpdateBookmarks(updated);
    showToast(`已从该书签中移除标签 #${tagToRemove}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Module Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <span>全局标签管理与批量清洗</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            共收录 {allTagStats.length} 个独立标签，支持跨书签批量重命名、智能合并与一键清理
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标签..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 w-44"
            />
          </div>

          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setSortBy('count_desc')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                sortBy === 'count_desc'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-medium'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              按书签数
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name_asc')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                sortBy === 'name_asc'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-medium'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              按名称字母
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Tags list (Left) + Selected Tag Bookmarks Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tags Badges Collection (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>找到 {filteredTags.length} 个标签</span>
            <span className="text-[11px] text-neutral-400">点击标签可在右侧查看包含的书签</span>
          </div>

          {filteredTags.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredTags.map((t) => {
                const isSelected = selectedTag === t.name;
                return (
                  <div
                    key={t.name}
                    onClick={() => setSelectedTag(t.name === selectedTag ? null : t.name)}
                    className={`group p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-850 ring-1 ring-neutral-900 dark:ring-neutral-100 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                        #{t.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {t.count}
                      </span>
                    </div>

                    {/* Tag quick actions (Rename, Merge, Delete) */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget(t.name);
                          setRenameInput(t.name);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                        title="重命名标签"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMergeTarget(t.name);
                          const other = allTagStats.find((item) => item.name !== t.name);
                          setMergeIntoTag(other ? other.name : '');
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                        title="将此标签合并到其他标签"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTag(t.name, t.count)}
                        className="p-1 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                        title="删除标签"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-400">
              未检索到匹配的标签
            </div>
          )}
        </div>

        {/* Right Column: Selected Tag Bookmarks Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 p-4 sticky top-20 shadow-xs">
            {selectedTag ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <span>#{selectedTag}</span>
                      <span className="text-xs font-normal text-neutral-400 font-mono">
                        ({taggedBookmarks.length} 个书签)
                      </span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* List of bookmarks */}
                <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                  {taggedBookmarks.map((bm) => {
                    const domain = extractDomain(bm.url);
                    const faviconUrl = getFaviconUrl(bm.url);

                    return (
                      <div
                        key={bm.id}
                        className="p-2.5 rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-750 flex items-center justify-center shrink-0 overflow-hidden">
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
                              <Globe className="w-3 h-3 text-neutral-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <a
                              href={bm.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-neutral-900 dark:text-neutral-100 hover:underline truncate block"
                            >
                              {bm.title}
                            </a>
                            <span className="text-[10px] text-neutral-400 font-mono truncate block">
                              {domain}
                            </span>
                          </div>
                        </div>

                        {/* Actions for this bookmark */}
                        <div className="flex items-center gap-1 shrink-0">
                          {onOpenEditBookmark && (
                            <button
                              type="button"
                              onClick={() => onOpenEditBookmark(bm)}
                              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                              title="编辑书签"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveTagFromSingleBookmark(bm.id, selectedTag)}
                            className="p-1 text-neutral-400 hover:text-rose-500 rounded"
                            title={`从该网址中移除 #${selectedTag} 标签`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-neutral-400 space-y-2">
                <Tag className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto stroke-[1.5]" />
                <p>点击左侧任意标签</p>
                <p className="text-[11px] text-neutral-500">查看并管理其关联的全部书签网址</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Rename Tag Modal                                         */}
      {/* ======================================================== */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-neutral-500" />
              <span>重命名标签: #{renameTarget}</span>
            </h3>

            <form onSubmit={handleConfirmRename} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                  输入新标签名称:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  该操作将自动更新所有使用旧标签的书签。
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                >
                  确认重命名
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Merge Tag Modal                                          */}
      {/* ======================================================== */}
      {mergeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-neutral-500" />
              <span>合并标签: #{mergeTarget}</span>
            </h3>

            <form onSubmit={handleConfirmMerge} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                  将 #{mergeTarget} 合并到以下目标标签:
                </label>
                <select
                  value={mergeIntoTag}
                  onChange={(e) => setMergeIntoTag(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                >
                  {allTagStats
                    .filter((t) => t.name !== mergeTarget)
                    .map((t) => (
                      <option key={t.name} value={t.name}>
                        #{t.name} ({t.count} 个书签)
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  合并后，所有带有 #{mergeTarget} 的书签将变更为 #{mergeIntoTag} 并自动去重。
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMergeTarget(null)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!mergeIntoTag}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-40"
                >
                  确认合并
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
