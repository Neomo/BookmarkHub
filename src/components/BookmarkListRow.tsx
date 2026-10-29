import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, Category } from '../types';
import { extractDomain, getFaviconUrl } from '../utils/url';
import { hexToRgba } from '../utils/color';
import {
  Pin,
  Star,
  Globe,
  Copy,
  Edit2,
  Trash2,
  ExternalLink,
  QrCode,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { useToast } from './Toast';
import { getLastVisitedDisplay } from './BookmarkCard';
import { CategoryIcon } from './CategoryIcon';

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
  onSelectCategory?: (categoryId: string) => void;
  isCompact?: boolean;
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
  onSelectCategory,
  isCompact = false,
}) => {
  const [faviconError, setFaviconError] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
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

  // Category soft color style matching reference stage pill
  const categoryColor = category?.color || bookmark.color || '#6366f1';

  if (isCompact) {
    return (
      <motion.div
        whileTap={{ scale: 0.995 }}
        onClick={handleRowClick}
        className={`group relative flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg border transition-all duration-150 cursor-pointer ${
          bookmark.isPinned
            ? 'bg-neutral-50/90 dark:bg-neutral-800/60 border-neutral-300 dark:border-neutral-700'
            : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
        } hover:shadow-2xs`}
      >
        {/* Left Accent border if colored */}
        {bookmark.color && (
          <span
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
            style={{ backgroundColor: bookmark.color }}
            aria-hidden="true"
          />
        )}

        {/* Title + domain kicker (no favicon or notes in compact mode) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-xs text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
              {bookmark.title}
            </span>
            {bookmark.isPinned && (
              <Pin className="w-2.5 h-2.5 text-neutral-400 rotate-45 fill-current shrink-0" />
            )}
            {bookmark.isStarred && (
              <Star className="w-2.5 h-2.5 text-amber-500 fill-current shrink-0" />
            )}
            <ExternalLink className="w-2.5 h-2.5 text-neutral-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
          </div>
          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono truncate">
            {domain}
          </div>
        </div>

        {/* Right side: Category + clicks + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const targetId = category?.id || bookmark.categoryId;
              if (targetId && onSelectCategory) {
                onSelectCategory(targetId);
              }
            }}
            title={`点击切换到「${category?.name || '常规分类'}」分类`}
            className="group/cat inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border transition-all shrink-0 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            style={{
              backgroundColor: hexToRgba(categoryColor, 0.12),
              borderColor: hexToRgba(categoryColor, 0.35),
              color: categoryColor,
            }}
          >
            <CategoryIcon
              name={category?.icon}
              className="w-2.5 h-2.5 shrink-0"
            />
            <span className="truncate max-w-[60px] sm:max-w-[75px]">{category?.name || '常规分类'}</span>
          </button>

          <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 tabular-nums shrink-0 hidden sm:inline">
            {bookmark.clickCount}次
          </span>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(bookmark.id);
              }}
              title={bookmark.isPinned ? '取消置顶' : '置顶'}
              className={`p-1 rounded-md transition-colors ${
                bookmark.isPinned
                  ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Pin className={`w-3 h-3 ${bookmark.isPinned ? 'rotate-45 fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(bookmark.id);
              }}
              title={bookmark.isStarred ? '取消星标' : '标记星标'}
              className={`p-1 rounded-md transition-colors ${
                bookmark.isStarred
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Star className={`w-3 h-3 ${bookmark.isStarred ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(bookmark);
              }}
              title="编辑网址"
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(bookmark.id);
              }}
              title="删除"
              className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.997 }}
      onClick={handleRowClick}
      className={`group relative flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800/80 transition-all duration-150 cursor-pointer ${
        bookmark.isPinned
          ? 'bg-neutral-50/80 dark:bg-neutral-800/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
          : 'bg-white dark:bg-[#14171d] hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40'
      }`}
    >
      {/* Left Accent border if colored */}
      {bookmark.color && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: bookmark.color }}
          aria-hidden="true"
        />
      )}

      {/* Column 1: Favicon + Title + URL domain kicker */}
      <div className="flex items-center gap-3 min-w-0 flex-1 sm:max-w-xs md:max-w-sm lg:max-w-md">
        {/* Favicon Squircle (matches reference company logo squircle) */}
        <div
          className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-750 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs"
          style={bookmark.color ? { borderColor: hexToRgba(bookmark.color, 0.4) } : undefined}
        >
          {!faviconError && faviconUrl ? (
            <img
              src={faviconUrl}
              alt={bookmark.title}
              className="w-4 h-4 object-contain"
              referrerPolicy="no-referrer"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe className="w-4 h-4 text-neutral-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
              {bookmark.title}
            </span>
            {bookmark.isPinned && (
              <Pin className="w-3 h-3 text-neutral-400 rotate-45 fill-current shrink-0" />
            )}
            {bookmark.isStarred && (
              <Star className="w-3 h-3 text-amber-500 fill-current shrink-0" />
            )}
            <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
            <span className="font-mono truncate">{domain}</span>
            {bookmark.notes && (
              <>
                <span>·</span>
                <span className="truncate max-w-[160px] text-neutral-500 dark:text-neutral-400">
                  {bookmark.notes}
                </span>
              </>
            )}
          </div>

          {/* Mobile Category Tag */}
          <div className="sm:hidden mt-1 flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const targetId = category?.id || bookmark.categoryId;
                if (targetId && onSelectCategory) {
                  onSelectCategory(targetId);
                }
              }}
              title={`点击切换到「${category?.name || '常规分类'}」分类`}
              className="group/cat inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 hover:ring-1 hover:ring-current/30"
              style={{
                backgroundColor: hexToRgba(categoryColor, 0.12),
                borderColor: hexToRgba(categoryColor, 0.35),
                color: categoryColor,
              }}
            >
              <CategoryIcon
                name={category?.icon}
                className="w-2.5 h-2.5 shrink-0"
              />
              <span className="truncate max-w-[90px]">{category?.name || '常规分类'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Column 2: Stage / Category Pill */}
      <div className="hidden sm:flex items-center shrink-0 w-32">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const targetId = category?.id || bookmark.categoryId;
            if (targetId && onSelectCategory) {
              onSelectCategory(targetId);
            }
          }}
          title={`点击切换到「${category?.name || '常规分类'}」分类`}
          className="group/cat inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs hover:scale-105 hover:ring-1 hover:ring-current/30 active:scale-95"
          style={{
            backgroundColor: hexToRgba(categoryColor, 0.12),
            borderColor: hexToRgba(categoryColor, 0.35),
            color: categoryColor,
          }}
        >
          <CategoryIcon
            name={category?.icon}
            className="w-3.5 h-3.5 shrink-0 group-hover/cat:scale-110 transition-transform"
          />
          <span className="truncate max-w-[85px]">{category?.name || '常规分类'}</span>
        </button>
      </div>

      {/* Column 3: Tags */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0 w-36 truncate text-xs text-neutral-500 dark:text-neutral-400">
        {bookmark.tags && bookmark.tags.length > 0 ? (
          bookmark.tags.slice(0, 2).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTag?.(tag);
              }}
              className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors text-[11px]"
            >
              #{tag}
            </button>
          ))
        ) : (
          <span className="text-neutral-300 dark:text-neutral-600 text-xs">—</span>
        )}
      </div>

      {/* Column 4: Click count / Value (matches reference `Value $186,000`) */}
      <div className="hidden md:flex flex-col items-end shrink-0 w-24 tabular-nums">
        <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 font-mono">
          {bookmark.clickCount} 次
        </span>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80" />
          <span>访问频次</span>
        </div>
      </div>

      {/* Column 5: Health status (matches reference `Activity / Next step`) */}
      <div className="hidden xl:flex items-center shrink-0 w-28">
        {bookmark.healthStatus && bookmark.healthStatus !== 'unknown' ? (
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md font-medium ${
              bookmark.healthStatus === 'healthy'
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50'
                : bookmark.healthStatus === 'warning'
                ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50'
                : bookmark.healthStatus === 'error'
                ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50'
                : 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            {bookmark.healthStatus === 'healthy' && <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />}
            {bookmark.healthStatus === 'warning' && <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />}
            {bookmark.healthStatus === 'error' && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
            {bookmark.healthStatus === 'checking' && <RefreshCw className="w-3 h-3 animate-spin text-neutral-400 shrink-0" />}
            <span>
              {bookmark.healthStatus === 'healthy'
                ? '正常连通'
                : bookmark.healthStatus === 'warning'
                ? '可能受限'
                : bookmark.healthStatus === 'error'
                ? '链接失效'
                : '检测中'}
            </span>
          </span>
        ) : (
          <span className="text-xs text-neutral-400">未检测</span>
        )}
      </div>

      {/* Column 6: Last visit (matches reference `Last touch: Today`, `2d ago`) */}
      <div className="hidden sm:flex items-center justify-end shrink-0 w-24 text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
        <span className={`inline-flex items-center gap-1.5 ${lastVisit.textColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${lastVisit.dotColor}`} />
          {lastVisit.label}
        </span>
      </div>

      {/* Column 7: Action buttons (matches reference trailing action `...` or buttons) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShowQrCode?.(bookmark);
          }}
          title="生成票据二维码"
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
          title="复制网址"
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
          title="编辑网址"
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
    </motion.div>
  );
};
