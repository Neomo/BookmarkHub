import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, Category } from '../types';
import { extractDomain, getFaviconUrl, formatRelativeTime } from '../utils/url';
import { hexToRgba } from '../utils/color';
import {
  Pin,
  Star,
  ExternalLink,
  MoreVertical,
  Copy,
  Edit2,
  Trash2,
  Globe,
  QrCode,
  GripVertical,
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useToast } from './Toast';

/**
 * Calculates dynamic color and relative time text based on days elapsed since last visit
 */
export function getLastVisitedDisplay(timestamp: number | null) {
  if (!timestamp) {
    return {
      label: '从未访问',
      dotColor: 'bg-neutral-300 dark:bg-neutral-700',
      textColor: 'text-neutral-400 dark:text-neutral-500',
      badgeClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500',
      days: Infinity,
    };
  }
  const diffDays = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return {
      label: diffDays === 0 ? '今天访问' : `${diffDays}天前`,
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400 font-medium',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40',
      days: diffDays,
    };
  }
  if (diffDays <= 30) {
    return {
      label: `${diffDays}天前`,
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400 font-medium',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40',
      days: diffDays,
    };
  }
  return {
    label: diffDays > 180 ? '超半年未访' : `${Math.floor(diffDays / 30)}个月前`,
    dotColor: 'bg-neutral-400 dark:bg-neutral-600',
    textColor: 'text-neutral-400 dark:text-neutral-500',
    badgeClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500',
    days: diffDays,
  };
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  category?: Category;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  onRecordClick: (bookmark: Bookmark) => void;
  onSelectTag?: (tag: string) => void;
  onShowQrCode?: (bookmark: Bookmark) => void;
  onCheckHealth?: (id: string) => void;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
  showOgImage?: boolean;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  category,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleStar,
  onRecordClick,
  onSelectTag,
  onShowQrCode,
  onCheckHealth,
  dragHandleProps,
  isDragging,
  showOgImage = true,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const { showToast } = useToast();

  const domain = extractDomain(bookmark.url);
  const faviconUrl = getFaviconUrl(bookmark.url);
  const coverImageUrl = bookmark.coverImage || bookmark.ogImage;

  const handleCardClick = (e: React.MouseEvent) => {
    // Avoid triggering card click if clicking on buttons or menu or drag handle
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[data-prevent-card-click="true"]') ||
      target.closest('[data-drag-handle="true"]')
    ) {
      return;
    }
    onRecordClick(bookmark);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    showToast('链接已复制到剪贴板', 'info');
    setMenuOpen(false);
  };

  const handleQrClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onShowQrCode?.(bookmark);
  };

  const hasColor = Boolean(bookmark.color);
  const cardCustomStyle: React.CSSProperties = hasColor
    ? {
        backgroundColor: hexToRgba(bookmark.color!, 0.08),
        borderColor: hexToRgba(bookmark.color!, 0.35),
        boxShadow: `0 1px 4px ${hexToRgba(bookmark.color!, 0.12)}`,
      }
    : {};

  const lastVisit = getLastVisitedDisplay(bookmark.lastClickedAt);

  return (
    <motion.div
      whileTap={{ scale: isDragging ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      onClick={handleCardClick}
      style={cardCustomStyle}
      className={`group relative flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-neutral-950/60 ${
        !hasColor
          ? bookmark.isPinned
            ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/80 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700'
          : bookmark.isPinned
          ? 'ring-1 ring-neutral-400/40 hover:brightness-98 dark:hover:brightness-105'
          : 'hover:brightness-98 dark:hover:brightness-105'
      } ${
        isDragging ? 'opacity-40 scale-[0.98] shadow-lg ring-2 ring-neutral-400 dark:ring-neutral-600 z-30' : ''
      }`}
    >
      {/* Top accent line if bookmark has color */}
      {bookmark.color && (
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-xl"
          style={{ backgroundColor: bookmark.color }}
          aria-hidden="true"
        />
      )}
      <div>
        {/* Top bar of card: Drag Handle, Favicon, Domain, Actions */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {/* Drag Handle (if provided) */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                data-drag-handle="true"
                data-prevent-card-click="true"
                title="按住拖拽排序"
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-neutral-300 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 flex items-center justify-center shrink-0 overflow-hidden"
              style={
                bookmark.color
                  ? {
                      borderColor: hexToRgba(bookmark.color, 0.35),
                      backgroundColor: hexToRgba(bookmark.color, 0.14),
                    }
                  : undefined
              }
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
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate block font-mono">
                {domain}
              </span>
              {/* Health status badge */}
              {bookmark.healthStatus && bookmark.healthStatus !== 'unknown' && (
                <span
                  title={
                    bookmark.healthStatus === 'healthy'
                      ? '链接健康正常，服务可访问'
                      : bookmark.healthStatus === 'warning'
                      ? '响应较慢或可能重定向'
                      : bookmark.healthStatus === 'checking'
                      ? '健康检测中...'
                      : '链接异常或无法连接'
                  }
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors shrink-0 ${
                    bookmark.healthStatus === 'healthy'
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50'
                      : bookmark.healthStatus === 'warning'
                      ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/50'
                      : bookmark.healthStatus === 'checking'
                      ? 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                      : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      bookmark.healthStatus === 'healthy'
                        ? 'bg-emerald-500'
                        : bookmark.healthStatus === 'warning'
                        ? 'bg-amber-500'
                        : bookmark.healthStatus === 'checking'
                        ? 'bg-neutral-400 animate-pulse'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {bookmark.healthStatus === 'healthy'
                      ? '正常'
                      : bookmark.healthStatus === 'warning'
                      ? '待定'
                      : bookmark.healthStatus === 'checking'
                      ? '检测中'
                      : '异常'}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-0.5 shrink-0" data-prevent-card-click="true">
            {/* QR Code trigger */}
            <button
              type="button"
              onClick={handleQrClick}
              title="生成手机扫码二维码"
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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

            {/* Menu trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                title="更多操作"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 z-30 text-xs">
                    <button
                      type="button"
                      onClick={handleQrClick}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>手机扫码</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制链接</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(bookmark);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>编辑</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(bookmark.id);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>删除</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* OpenGraph / Cover Preview Banner */}
        {showOgImage && coverImageUrl && !coverError && (
          <div className="relative w-full h-32 mb-2.5 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-750 shrink-0">
            <img
              src={coverImageUrl}
              alt={bookmark.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              onError={() => setCoverError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-1.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors flex items-center gap-1.5">
          <span className="truncate">{bookmark.title}</span>
          <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
        </h3>

        {/* Notes preview */}
        {bookmark.notes ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-3">
            {bookmark.notes}
          </p>
        ) : (
          <div className="h-4 mb-2" />
        )}
      </div>

      {/* Footer metadata: Zero-pill discipline (clean text with typographic separators) */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col gap-1.5">
        {/* Tags row */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div
            className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400"
            data-prevent-card-click="true"
          >
            {bookmark.tags.map((tag, idx) => (
              <React.Fragment key={tag}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(tag);
                  }}
                  className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                >
                  #{tag}
                </button>
                {idx < bookmark.tags.length - 1 && <span className="opacity-40">·</span>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Stats metadata */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
          <span className="truncate">
            {category?.name || '默认分类'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
            <span>{bookmark.clickCount} 次访问</span>
            <span aria-hidden="true">·</span>
            <span className={`inline-flex items-center gap-1 font-medium ${lastVisit.textColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${lastVisit.dotColor}`} />
              {lastVisit.label}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
