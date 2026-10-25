import React, { useState } from 'react';
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
} from 'lucide-react';
import { useToast } from './Toast';

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
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
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
  dragHandleProps,
  isDragging,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const { showToast } = useToast();

  const domain = extractDomain(bookmark.url);
  const faviconUrl = getFaviconUrl(bookmark.url);

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

  return (
    <div
      onClick={handleCardClick}
      style={cardCustomStyle}
      className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm ${
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
            <div className="min-w-0">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate block font-mono">
                {domain}
              </span>
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
            <span>{formatRelativeTime(bookmark.lastClickedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
