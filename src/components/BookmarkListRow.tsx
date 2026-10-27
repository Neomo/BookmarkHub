import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, Category } from '../types';
import { extractDomain, getFaviconUrl } from '../utils/url';
import { hexToRgba } from '../utils/color';
import { Pin, Star, Globe, Copy, Edit2, Trash2, ExternalLink, QrCode, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';
import { getLastVisitedDisplay } from './BookmarkCard';

interface BookmarkListRowProps {
  bookmark: Bookmark;
  category?: Category;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  onRecordClick: (bookmark: Bookmark) => void;
  onSelectTag?: (tag: string) => void;
  onShowQrCode?: (bookmark: Bookmark) => void;
}

export const BookmarkListRow: React.FC<BookmarkListRowProps> = ({
  bookmark,
  category,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleStar,
  onRecordClick,
  onSelectTag,
  onShowQrCode,
}) => {
  const [faviconError, setFaviconError] = useState(false);
  const { showToast } = useToast();

  const domain = extractDomain(bookmark.url);
  const faviconUrl = getFaviconUrl(bookmark.url);
  const lastVisit = getLastVisitedDisplay(bookmark.lastClickedAt);

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    onRecordClick(bookmark);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    showToast('链接已复制到剪贴板', 'info');
  };

  const rowStyle: React.CSSProperties = bookmark.color
    ? {
        borderLeftColor: bookmark.color,
        backgroundColor: hexToRgba(bookmark.color, 0.04),
      }
    : {};

  return (
    <motion.div
      whileTap={{ scale: 0.995 }}
      onClick={handleRowClick}
      style={rowStyle}
      className={`group relative overflow-hidden flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer ${
        bookmark.color
          ? bookmark.isPinned
            ? 'border-neutral-300 dark:border-neutral-700 ring-1 ring-neutral-400/20'
            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          : bookmark.isPinned
          ? 'bg-neutral-50/70 dark:bg-neutral-900/80 border-neutral-300 dark:border-neutral-750'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      {/* Left decorative accent bar if bookmark has color */}
      {bookmark.color && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: bookmark.color }}
          aria-hidden="true"
        />
      )}

      {/* Left: Favicon + Title + Notes/Domain */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
        <div
          className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 flex items-center justify-center shrink-0 overflow-hidden"
          style={bookmark.color ? { borderColor: hexToRgba(bookmark.color, 0.3) } : undefined}
        >
          {!faviconError && faviconUrl ? (
            <img
              src={faviconUrl}
              alt={bookmark.title}
              className="w-3.5 h-3.5 object-contain"
              referrerPolicy="no-referrer"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {bookmark.color && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: bookmark.color }}
              />
            )}
            <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
              {bookmark.title}
            </span>
            <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono truncate hidden sm:inline">
              {domain}
            </span>

            {/* Health status badge */}
            {bookmark.healthStatus && bookmark.healthStatus !== 'unknown' && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  bookmark.healthStatus === 'healthy'
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50'
                    : bookmark.healthStatus === 'warning'
                    ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50 dark:border-amber-800/50'
                    : bookmark.healthStatus === 'error'
                    ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/50 dark:border-rose-800/50'
                    : 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800'
                }`}
                title={
                  bookmark.healthStatus === 'healthy'
                    ? '链接健康 (可正常连通)'
                    : bookmark.healthStatus === 'warning'
                    ? '可能受限或重定向'
                    : bookmark.healthStatus === 'error'
                    ? '链接访问失败，请检查'
                    : '正在检测连通性...'
                }
              >
                {bookmark.healthStatus === 'healthy' && <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />}
                {bookmark.healthStatus === 'warning' && <AlertCircle className="w-2.5 h-2.5 text-amber-500" />}
                {bookmark.healthStatus === 'error' && <AlertCircle className="w-2.5 h-2.5 text-rose-500" />}
                {bookmark.healthStatus === 'checking' && <RefreshCw className="w-2.5 h-2.5 animate-spin text-neutral-400" />}
                <span>
                  {bookmark.healthStatus === 'healthy'
                    ? '健康'
                    : bookmark.healthStatus === 'warning'
                    ? '异常'
                    : bookmark.healthStatus === 'error'
                    ? '失效'
                    : '检测中'}
                </span>
              </span>
            )}
          </div>

          {bookmark.notes && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xl">
              {bookmark.notes}
            </p>
          )}
        </div>
      </div>

      {/* Middle: Tags (clean unboxed inline text) & Category */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
        <span className="text-neutral-600 dark:text-neutral-300 font-medium w-20 truncate">
          {category?.name || '默认分类'}
        </span>

        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex items-center gap-1.5 w-44 truncate">
            {bookmark.tags.slice(0, 3).map((tag, idx) => (
              <React.Fragment key={tag}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(tag);
                  }}
                  className="hover:text-neutral-900 dark:hover:text-neutral-200"
                >
                  #{tag}
                </button>
                {idx < Math.min(bookmark.tags.length, 3) - 1 && <span className="opacity-40">·</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Right: Clicks, Visited Time & Action buttons */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex flex-col items-end text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
          <span className="font-mono text-neutral-700 dark:text-neutral-300 font-medium">
            {bookmark.clickCount} 次
          </span>
          <span className={`text-[11px] inline-flex items-center gap-1 ${lastVisit.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${lastVisit.dotColor}`} />
            {lastVisit.label}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowQrCode?.(bookmark);
            }}
            title="生成手机扫码二维码"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(bookmark.id);
            }}
            title={bookmark.isPinned ? '取消置顶' : '置顶'}
            className={`p-1.5 rounded-md transition-colors ${
              bookmark.isPinned
                ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${bookmark.isPinned ? 'rotate-45 fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(bookmark.id);
            }}
            title={bookmark.isStarred ? '取消星标' : '标记星标'}
            className={`p-1.5 rounded-md transition-colors ${
              bookmark.isStarred
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${bookmark.isStarred ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            title="复制链接"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors hidden sm:block"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(bookmark);
            }}
            title="编辑"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bookmark.id);
            }}
            title="删除"
            className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
