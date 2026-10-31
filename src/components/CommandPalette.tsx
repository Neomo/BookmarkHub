import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Category } from '../types';
import { matchBookmark } from '../utils/pinyin';
import { extractDomain, getFaviconUrl } from '../utils/url';
import {
  Search,
  ExternalLink,
  Plus,
  ListPlus,
  FolderCog,
  BarChart3,
  Download,
  Moon,
  Sun,
  Globe,
  CornerDownLeft,
  Archive,
  Compass,
} from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: Category[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onOpenAddModal: () => void;
  onOpenBatchAddModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenStatsModal: () => void;
  onOpenImportExportModal: () => void;
  onOpenArchiveModal?: () => void;
  onOpenAdmin?: (tab?: string) => void;
  onOpenExplorationMode?: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  bookmarks,
  categories,
  onSelectBookmark,
  onOpenAddModal,
  onOpenBatchAddModal,
  onOpenCategoryModal,
  onOpenStatsModal,
  onOpenImportExportModal,
  onOpenArchiveModal,
  onOpenAdmin,
  onOpenExplorationMode,
  onToggleTheme,
  isDark,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const catObjMap = new Map<string, Category>();
  for (const cat of categories) {
    catObjMap.set(cat.id, cat);
  }

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    if (cat.parentId && catObjMap.has(cat.parentId)) {
      categoryMap.set(cat.id, `${catObjMap.get(cat.parentId)!.name} / ${cat.name}`);
    } else {
      categoryMap.set(cat.id, cat.name);
    }
  }

  // Filter bookmarks with pinyin & fuzzy search
  const filteredBookmarks = bookmarks.filter((bm) =>
    matchBookmark(query, {
      title: bm.title,
      url: bm.url,
      tags: bm.tags,
      notes: bm.notes,
      categoryName: categoryMap.get(bm.categoryId),
    })
  );

  // Command actions
  const systemActions = [
    {
      id: 'act-add',
      title: '添加新网址收藏',
      category: '快捷操作',
      icon: Plus,
      action: onOpenAddModal,
    },
    {
      id: 'act-batch',
      title: '批量导入网址',
      category: '快捷操作',
      icon: ListPlus,
      action: onOpenBatchAddModal,
    },
    {
      id: 'act-exploration',
      title: '进入探索模式（全屏聚焦·随机漫游网址）',
      category: '沉浸探索',
      icon: Compass,
      action: onOpenExplorationMode || (() => {}),
    },
    {
      id: 'act-cats',
      title: '分类管理与排序',
      category: '快捷操作',
      icon: FolderCog,
      action: onOpenCategoryModal,
    },
    {
      id: 'act-archive',
      title: '闲置书签智能归档（超过 6 个月未访问）',
      category: '维护清理',
      icon: Archive,
      action: onOpenArchiveModal || (() => {}),
    },
    {
      id: 'act-stats',
      title: '查看点击排行榜与统计面板',
      category: '统计',
      icon: BarChart3,
      action: onOpenStatsModal,
    },
    {
      id: 'act-export',
      title: '导出备份 / 导入 JSON',
      category: '数据',
      icon: Download,
      action: onOpenImportExportModal,
    },
    {
      id: 'act-admin',
      title: '打开系统全方位管理后台',
      category: '管理',
      icon: FolderCog,
      action: () => onOpenAdmin?.('categories'),
    },
    {
      id: 'act-admin-table',
      title: '网址数据表格与批量管理',
      category: '管理',
      icon: ListPlus,
      action: () => onOpenAdmin?.('bookmarks'),
    },
    {
      id: 'act-admin-tags',
      title: '全局标签管理与清洗',
      category: '管理',
      icon: FolderCog,
      action: () => onOpenAdmin?.('tags'),
    },
    {
      id: 'act-admin-settings',
      title: '页面显示与系统偏好设置',
      category: '设置',
      icon: FolderCog,
      action: () => onOpenAdmin?.('settings'),
    },
    {
      id: 'act-admin-backup',
      title: '数据全量备份与容灾恢复',
      category: '数据',
      icon: Download,
      action: () => onOpenAdmin?.('backup'),
    },
    {
      id: 'act-theme',
      title: isDark ? '切换至明亮模式' : '切换至暗黑模式',
      category: '外观',
      icon: isDark ? Sun : Moon,
      action: onToggleTheme,
    },
  ];

  const filteredActions = systemActions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  type ListItem =
    | { type: 'bookmark'; data: Bookmark }
    | { type: 'action'; data: (typeof systemActions)[0] };

  const allItems: ListItem[] = [
    ...filteredBookmarks.slice(0, 8).map((b) => ({ type: 'bookmark' as const, data: b })),
    ...filteredActions.slice(0, 4).map((a) => ({ type: 'action' as const, data: a })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(allItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(allItems.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'bookmark') {
          onSelectBookmark(current.data);
          onClose();
        } else {
          current.data.action();
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      position="top"
      maxWidth="max-w-xl"
    >
      <div onKeyDown={handleKeyDown} className="flex flex-col">
        {/* Search Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="输入标题、网址、分类、标签或拼音首字母搜索 (如 'gh' 搜 GitHub)..."
            className="w-full text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {allItems.length > 0 ? (
            <div className="space-y-1">
              {allItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;

                if (item.type === 'bookmark') {
                  const bm = item.data;
                  const domain = extractDomain(bm.url);
                  const faviconUrl = getFaviconUrl(bm.url);

                  return (
                    <div
                      key={bm.id}
                      onClick={() => {
                        onSelectBookmark(bm);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
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
                          <div className="font-medium truncate flex items-center gap-1.5">
                            {bm.color && (
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: bm.color }}
                              />
                            )}
                            <span className="truncate">{bm.title}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono truncate">
                            {domain}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-400 shrink-0">
                        <span className="text-[11px] hidden sm:inline truncate max-w-28">
                          {categoryMap.get(bm.categoryId) || '默认'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                }

                // Command action item
                const act = item.data;
                const IconComponent = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      act.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0 text-neutral-600 dark:text-neutral-300">
                        <IconComponent className="w-3 h-3" />
                      </div>
                      <div className="font-medium truncate">{act.title}</div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 shrink-0">
                      <span>{act.category}</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-neutral-400">
              未找到匹配的书签或指令
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span>↑↓ 切换选择</span>
            <span>↵ 打开网址</span>
            <span>ESC 关闭</span>
          </div>
          <span>BookmarkHub 全局检索</span>
        </div>
      </div>
    </ModalWrapper>
  );
};
