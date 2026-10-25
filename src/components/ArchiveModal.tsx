import React, { useState, useMemo } from 'react';
import { Bookmark, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import {
  ARCHIVED_CATEGORY_ID,
  ARCHIVED_CATEGORY,
  SIX_MONTHS_MS,
  getInactiveBookmarks,
} from '../utils/storage';
import {
  Archive,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  X,
  Sparkles,
  Check,
  FolderInput,
} from 'lucide-react';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: Category[];
  onArchiveBookmarks: (bookmarkIds: string[]) => void;
  onRestoreBookmarks?: (bookmarkIds: string[], targetCategoryId: string) => void;
  autoArchiveEnabled: boolean;
  onToggleAutoArchive: (enabled: boolean) => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  categories,
  onArchiveBookmarks,
  onRestoreBookmarks,
  autoArchiveEnabled,
  onToggleAutoArchive,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'archived'>('pending');

  // Detect bookmarks with no clicks in last 6 months (and not already archived)
  const inactiveBookmarks = useMemo(() => {
    return getInactiveBookmarks(bookmarks);
  }, [bookmarks]);

  // Bookmarks already in the Archived category
  const archivedBookmarks = useMemo(() => {
    return bookmarks.filter((b) => b.categoryId === ARCHIVED_CATEGORY_ID);
  }, [bookmarks]);

  // Selected for archiving
  const [selectedToArchive, setSelectedToArchive] = useState<string[]>([]);
  // Selected for restoring
  const [selectedToRestore, setSelectedToRestore] = useState<string[]>([]);

  // Update selected default whenever inactiveBookmarks change
  React.useEffect(() => {
    setSelectedToArchive(inactiveBookmarks.map((b) => b.id));
  }, [inactiveBookmarks]);

  const toggleSelectArchive = (id: string) => {
    setSelectedToArchive((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectRestore = (id: string) => {
    setSelectedToRestore((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllArchive = () => {
    if (selectedToArchive.length === inactiveBookmarks.length) {
      setSelectedToArchive([]);
    } else {
      setSelectedToArchive(inactiveBookmarks.map((b) => b.id));
    }
  };

  const handleConfirmArchive = () => {
    if (selectedToArchive.length === 0) return;
    onArchiveBookmarks(selectedToArchive);
    onClose();
  };

  const handleConfirmRestore = () => {
    if (selectedToRestore.length === 0 || !onRestoreBookmarks) return;
    // Default restore target is first regular category
    const defaultCat = categories.find((c) => c.id !== ARCHIVED_CATEGORY_ID) || categories[0];
    onRestoreBookmarks(selectedToRestore, defaultCat?.id || 'cat-dev');
  };

  const formatDaysAgo = (timestamp: number | null) => {
    if (!timestamp) return '从未访问';
    const days = Math.floor((Date.now() - timestamp) / (24 * 3600 * 1000));
    return `${days} 天前访问`;
  };

  const formatCreatedDays = (timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (24 * 3600 * 1000));
    return `${days} 天前创建`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                闲置书签智能归档
              </h2>
              <p className="text-xs text-neutral-500">
                超过 6 个月未访问的网址可自动移至「已归档」分类，保持主界面清爽
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Auto-archive Toggle & Sub-tabs */}
        <div className="px-6 py-3 bg-neutral-50/80 dark:bg-neutral-850/50 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              待归档网址 ({inactiveBookmarks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'archived'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              已归档网址 ({archivedBookmarks.length})
            </button>
          </div>

          {/* Auto-archive setting switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={autoArchiveEnabled}
              onChange={(e) => onToggleAutoArchive(e.target.checked)}
              className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800"
            />
            <span>启动时自动归档超 6 个月未访问书签</span>
          </label>
        </div>

        {/* Tab 1: Pending Inactive Bookmarks to Archive */}
        {activeTab === 'pending' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {inactiveBookmarks.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs text-neutral-500 pb-1">
                  <span>
                    系统根据「访问时间」及「创建时间」筛查出{' '}
                    <strong className="text-neutral-900 dark:text-neutral-100">
                      {inactiveBookmarks.length}
                    </strong>{' '}
                    个超 180 天未活跃的网址：
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllArchive}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {selectedToArchive.length === inactiveBookmarks.length
                      ? '取消全选'
                      : '全选'}
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {inactiveBookmarks.map((bm) => {
                    const isSelected = selectedToArchive.includes(bm.id);
                    const cat = categories.find((c) => c.id === bm.categoryId);

                    return (
                      <div
                        key={bm.id}
                        onClick={() => toggleSelectArchive(bm.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/80'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-850'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 rounded text-neutral-900 focus:ring-neutral-900 dark:bg-neutral-800 dark:border-neutral-700"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {bm.title}
                            </span>
                            {cat && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                                style={{
                                  backgroundColor: `${cat.color || '#6366f1'}15`,
                                  color: cat.color || '#6366f1',
                                }}
                              >
                                {cat.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                            <span className="truncate max-w-xs">{bm.url}</span>
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>
                                {bm.lastClickedAt
                                  ? formatDaysAgo(bm.lastClickedAt)
                                  : `从未访问 (${formatCreatedDays(bm.createdAt)})`}
                              </span>
                            </span>
                          </div>
                        </div>

                        <a
                          href={bm.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                          title="在新标签页测试访问"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  太棒了！暂无超 6 个月未访问的闲置书签
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm">
                  您的收藏库保持着良好的活跃度。如未来有书签闲置超过 180 天，将在此处提供一键归档。
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Already Archived Bookmarks */}
        {activeTab === 'archived' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {archivedBookmarks.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs text-neutral-500 pb-1">
                  <span>
                    当前归档库中共有{' '}
                    <strong className="text-neutral-900 dark:text-neutral-100">
                      {archivedBookmarks.length}
                    </strong>{' '}
                    个网址：
                  </span>
                  {onRestoreBookmarks && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedToRestore.length === archivedBookmarks.length) {
                          setSelectedToRestore([]);
                        } else {
                          setSelectedToRestore(archivedBookmarks.map((b) => b.id));
                        }
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      {selectedToRestore.length === archivedBookmarks.length
                        ? '取消全选'
                        : '全选'}
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {archivedBookmarks.map((bm) => {
                    const isSelected = selectedToRestore.includes(bm.id);

                    return (
                      <div
                        key={bm.id}
                        onClick={() => toggleSelectRestore(bm.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/80'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-850'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 rounded text-neutral-900 focus:ring-neutral-900 dark:bg-neutral-800 dark:border-neutral-700"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {bm.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                              已归档
                            </span>
                          </div>

                          <div className="text-xs text-neutral-400 font-mono truncate">
                            {bm.url}
                          </div>
                        </div>

                        <a
                          href={bm.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                          title="访问网址"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mb-3">
                  <Archive className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  归档分类目前为空
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm">
                  当您执行闲置书签归档后，对应的网址将被移至「已归档」分类。
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            关闭
          </button>

          {activeTab === 'pending' && (
            <button
              type="button"
              disabled={selectedToArchive.length === 0}
              onClick={handleConfirmArchive}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedToArchive.length > 0
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-xs'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>移入「已归档」分类 ({selectedToArchive.length})</span>
            </button>
          )}

          {activeTab === 'archived' && onRestoreBookmarks && (
            <button
              type="button"
              disabled={selectedToRestore.length === 0}
              onClick={handleConfirmRestore}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedToRestore.length > 0
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-xs'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>恢复所选至常规分类 ({selectedToRestore.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
