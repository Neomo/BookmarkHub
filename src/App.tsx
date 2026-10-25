import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bookmark, Category, ViewMode, SortOption } from './types';
import {
  loadBookmarks,
  saveBookmarks,
  loadCategories,
  saveCategories,
} from './utils/storage';
import { matchBookmark } from './utils/pinyin';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BookmarkCard } from './components/BookmarkCard';
import { BookmarkListRow } from './components/BookmarkListRow';
import { BookmarkGroupView } from './components/BookmarkGroupView';
import { AddEditModal } from './components/AddEditModal';
import { BatchAddModal } from './components/BatchAddModal';
import { CategoryModal } from './components/CategoryModal';
import { StatsModal } from './components/StatsModal';
import { ImportExportModal } from './components/ImportExportModal';
import { CommandPalette } from './components/CommandPalette';
import { MobileNav } from './components/MobileNav';
import { ToastProvider, useToast } from './components/Toast';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Star,
  Pin,
  X,
  ListPlus,
  Sparkles,
  Inbox,
} from 'lucide-react';

function BookmarkHubApp() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // View & Filter states
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('custom');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<Bookmark | null>(null);
  const [isBatchAddOpen, setIsBatchAddOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookmarkhub_theme_mode');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const { showToast } = useToast();

  // Load from local storage on mount
  useEffect(() => {
    const loadedCats = loadCategories();
    const loadedBms = loadBookmarks();
    setCategories(loadedCats);
    setBookmarks(loadedBms);

    const savedView = localStorage.getItem('bookmarkhub_view_mode') as ViewMode | null;
    if (savedView && ['card', 'list', 'group'].includes(savedView)) {
      setViewMode(savedView);
    }
    setIsLoaded(true);
  }, []);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bookmarkhub_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bookmarkhub_theme_mode', 'light');
    }
  }, [isDark]);

  // Global keyboard shortcuts (Ctrl+K, Cmd+K, Ctrl+N, Cmd+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setBookmarkToEdit(null);
        setIsAddEditOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save changes to localStorage
  const updateBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    saveBookmarks(newBookmarks);
  };

  const updateCategories = (newCategories: Category[], updatedBookmarks?: Bookmark[]) => {
    setCategories(newCategories);
    saveCategories(newCategories);
    if (updatedBookmarks) {
      setBookmarks(updatedBookmarks);
      saveBookmarks(updatedBookmarks);
    }
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleChangeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('bookmarkhub_view_mode', mode);
  };

  // Collect all distinct tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookmarks) {
      if (b.tags) {
        for (const t of b.tags) set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [bookmarks]);

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  // Handle click on bookmark: increment clickCount & update lastClickedAt
  const handleRecordClick = (bookmark: Bookmark) => {
    const updated = bookmarks.map((b) => {
      if (b.id === bookmark.id) {
        return {
          ...b,
          clickCount: (b.clickCount || 0) + 1,
          lastClickedAt: Date.now(),
        };
      }
      return b;
    });
    updateBookmarks(updated);
  };

  // Pin toggle
  const handleTogglePin = (id: string) => {
    const target = bookmarks.find((b) => b.id === id);
    const updated = bookmarks.map((b) => (b.id === id ? { ...b, isPinned: !b.isPinned } : b));
    updateBookmarks(updated);
    if (target) {
      showToast(target.isPinned ? '已取消置顶' : '已成功置顶', 'info');
    }
  };

  // Star toggle
  const handleToggleStar = (id: string) => {
    const target = bookmarks.find((b) => b.id === id);
    const updated = bookmarks.map((b) => (b.id === id ? { ...b, isStarred: !b.isStarred } : b));
    updateBookmarks(updated);
    if (target) {
      showToast(target.isStarred ? '已取消星标' : '已添加至星标', 'info');
    }
  };

  // Delete bookmark
  const handleDeleteBookmark = (id: string) => {
    const deleted = bookmarks.find((b) => b.id === id);
    const updated = bookmarks.filter((b) => b.id !== id);
    updateBookmarks(updated);
    showToast(`已删除书签「${deleted?.title || ''}」`, 'info');
  };

  // Save (add or edit) single bookmark
  const handleSaveBookmark = (bookmarkData: Partial<Bookmark>) => {
    if (bookmarkToEdit) {
      const updated = bookmarks.map((b) =>
        b.id === bookmarkToEdit.id
          ? {
              ...b,
              ...bookmarkData,
              updatedAt: Date.now(),
            }
          : b
      );
      updateBookmarks(updated);
      showToast('书签已更新', 'success');
    } else {
      const newBookmark: Bookmark = {
        id: `bm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: bookmarkData.title || '',
        url: bookmarkData.url || '',
        categoryId: bookmarkData.categoryId || categories[0]?.id || 'cat-dev',
        tags: bookmarkData.tags || [],
        notes: bookmarkData.notes || '',
        isPinned: !!bookmarkData.isPinned,
        isStarred: !!bookmarkData.isStarred,
        clickCount: 0,
        lastClickedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: bookmarks.length + 1,
      };
      updateBookmarks([newBookmark, ...bookmarks]);
      showToast('书签已添加', 'success');
    }
    setBookmarkToEdit(null);
  };

  // Batch add bookmarks
  const handleBatchAdd = (items: Array<{ title: string; url: string; notes?: string }>, catId: string, commonTags: string[]) => {
    const newItems: Bookmark[] = items.map((item, idx) => ({
      id: `bm-batch-${Date.now()}-${idx}`,
      title: item.title,
      url: item.url,
      categoryId: catId,
      tags: commonTags,
      notes: item.notes || '',
      isPinned: false,
      isStarred: false,
      clickCount: 0,
      lastClickedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: bookmarks.length + idx + 1,
    }));
    updateBookmarks([...newItems, ...bookmarks]);
  };

  // Filtered & Sorted Bookmarks
  const filteredAndSortedBookmarks = useMemo(() => {
    // 1. Filtering
    let list = bookmarks.filter((b) => {
      // Category filter
      if (activeCategoryId && b.categoryId !== activeCategoryId) {
        return false;
      }
      // Starred filter
      if (showOnlyStarred && !b.isStarred) {
        return false;
      }
      // Pinned filter
      if (showOnlyPinned && !b.isPinned) {
        return false;
      }
      // Tag filter
      if (selectedTag && (!b.tags || !b.tags.includes(selectedTag))) {
        return false;
      }
      // Search query (pinyin & fuzzy)
      if (searchQuery.trim()) {
        const catName = categoryMap.get(b.categoryId)?.name;
        if (
          !matchBookmark(searchQuery, {
            title: b.title,
            url: b.url,
            tags: b.tags,
            notes: b.notes,
            categoryName: catName,
          })
        ) {
          return false;
        }
      }
      return true;
    });

    // 2. Sorting
    // Rule: Pinned bookmarks always sort to the top unless specifically sorting otherwise
    list.sort((a, b) => {
      // Pinned priority (top)
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      switch (sortOption) {
        case 'clicks_desc':
          return (b.clickCount || 0) - (a.clickCount || 0);
        case 'recent_click':
          return (b.lastClickedAt || 0) - (a.lastClickedAt || 0);
        case 'created_desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'title_asc':
          return a.title.localeCompare(b.title, 'zh-Hans-CN');
        case 'custom':
        default:
          return (a.order || 0) - (b.order || 0);
      }
    });

    return list;
  }, [
    bookmarks,
    activeCategoryId,
    showOnlyStarred,
    showOnlyPinned,
    selectedTag,
    searchQuery,
    sortOption,
    categoryMap,
  ]);

  // Active Category Name display
  const currentCategoryName = activeCategoryId
    ? categoryMap.get(activeCategoryId)?.name || '分类'
    : showOnlyStarred
    ? '星标精选'
    : showOnlyPinned
    ? '置顶网址'
    : selectedTag
    ? `标签: #${selectedTag}`
    : '全部网址';

  // Mobile swipe handler between view modes
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    // Swipe left: next view mode
    if (diff > 80) {
      if (viewMode === 'card') handleChangeViewMode('list');
      else if (viewMode === 'list') handleChangeViewMode('group');
    }
    // Swipe right: prev view mode
    else if (diff < -80) {
      if (viewMode === 'group') handleChangeViewMode('list');
      else if (viewMode === 'list') handleChangeViewMode('card');
    }
    touchStartX.current = null;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-400 text-xs">
        加载书签数据中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        viewMode={viewMode}
        onChangeViewMode={handleChangeViewMode}
        onOpenAddModal={() => {
          setBookmarkToEdit(null);
          setIsAddEditOpen(true);
        }}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenImportExportModal={() => setIsImportExportOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace Split */}
      <div className="flex-1 flex max-w-400 w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          categories={categories}
          bookmarks={bookmarks}
          activeCategoryId={activeCategoryId}
          onSelectCategory={(id) => {
            setActiveCategoryId(id);
            if (id !== null) {
              setShowOnlyStarred(false);
              setShowOnlyPinned(false);
            }
          }}
          showOnlyStarred={showOnlyStarred}
          onToggleShowStarred={() => {
            setShowOnlyStarred(!showOnlyStarred);
            if (!showOnlyStarred) {
              setActiveCategoryId(null);
              setShowOnlyPinned(false);
            }
          }}
          showOnlyPinned={showOnlyPinned}
          onToggleShowPinned={() => {
            setShowOnlyPinned(!showOnlyPinned);
            if (!showOnlyPinned) {
              setActiveCategoryId(null);
              setShowOnlyStarred(false);
            }
          }}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          allTags={allTags}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          isOpenMobile={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
        />

        {/* Content Viewport */}
        <main
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Breadcrumb / Section Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {currentCategoryName}
                </h1>
                <span className="text-xs font-mono tabular-nums text-neutral-400 dark:text-neutral-500 pt-0.5">
                  ({filteredAndSortedBookmarks.length})
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {activeCategoryId
                  ? `${categoryMap.get(activeCategoryId)?.description || '分类收藏目录'} · 支持置顶与星标`
                  : '集中管理、分类检索、点击统计'}
              </p>
            </div>

            {/* Controls Bar: Search Box + Sort Selector + Batch CTA */}
            <div className="flex flex-wrap items-center gap-2">
              {/* In-page Real-time Search Input */}
              <div className="relative flex-1 sm:w-64 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索网址、拼音首字母..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-transparent focus:outline-hidden cursor-pointer text-xs"
                >
                  <option value="custom" className="dark:bg-neutral-900">默认排序 (置顶优先)</option>
                  <option value="clicks_desc" className="dark:bg-neutral-900">访问最多 (Top)</option>
                  <option value="recent_click" className="dark:bg-neutral-900">最近访问</option>
                  <option value="created_desc" className="dark:bg-neutral-900">最新添加</option>
                  <option value="title_asc" className="dark:bg-neutral-900">标题字母 (A-Z)</option>
                </select>
              </div>

              {/* Batch Add Button */}
              <button
                type="button"
                onClick={() => setIsBatchAddOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                title="批量导入多条网址"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>批量添加</span>
              </button>
            </div>
          </div>

          {/* Active Filter Badges (if any active) */}
          {(searchQuery || selectedTag || showOnlyStarred || showOnlyPinned || activeCategoryId) && (
            <div className="flex items-center flex-wrap gap-2 mb-4 text-xs">
              <span className="text-neutral-400 text-[11px]">当前过滤:</span>

              {activeCategoryId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                  分类: {categoryMap.get(activeCategoryId)?.name}
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId(null)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                  #{selectedTag}
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {showOnlyStarred && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                  ⭐ 星标
                  <button
                    type="button"
                    onClick={() => setShowOnlyStarred(false)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {showOnlyPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                  📌 置顶
                  <button
                    type="button"
                    onClick={() => setShowOnlyPinned(false)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                  关键词: &ldquo;{searchQuery}&rdquo;
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveCategoryId(null);
                  setSelectedTag(null);
                  setShowOnlyStarred(false);
                  setShowOnlyPinned(false);
                  setSearchQuery('');
                }}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-dotted ml-1"
              >
                重置全部
              </button>
            </div>
          )}

          {/* Bookmarks Render Area */}
          <div className="flex-1">
            {filteredAndSortedBookmarks.length > 0 ? (
              <>
                {/* 1. Card View */}
                {viewMode === 'card' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {filteredAndSortedBookmarks.map((bm) => (
                      <BookmarkCard
                        key={bm.id}
                        bookmark={bm}
                        category={categoryMap.get(bm.categoryId)}
                        onEdit={(bookmark) => {
                          setBookmarkToEdit(bookmark);
                          setIsAddEditOpen(true);
                        }}
                        onDelete={handleDeleteBookmark}
                        onTogglePin={handleTogglePin}
                        onToggleStar={handleToggleStar}
                        onRecordClick={handleRecordClick}
                        onSelectTag={(tag) => setSelectedTag(tag)}
                      />
                    ))}
                  </div>
                )}

                {/* 2. List View */}
                {viewMode === 'list' && (
                  <div className="space-y-1.5">
                    {filteredAndSortedBookmarks.map((bm) => (
                      <BookmarkListRow
                        key={bm.id}
                        bookmark={bm}
                        category={categoryMap.get(bm.categoryId)}
                        onEdit={(bookmark) => {
                          setBookmarkToEdit(bookmark);
                          setIsAddEditOpen(true);
                        }}
                        onDelete={handleDeleteBookmark}
                        onTogglePin={handleTogglePin}
                        onToggleStar={handleToggleStar}
                        onRecordClick={handleRecordClick}
                        onSelectTag={(tag) => setSelectedTag(tag)}
                      />
                    ))}
                  </div>
                )}

                {/* 3. Grouped by Category View */}
                {viewMode === 'group' && (
                  <BookmarkGroupView
                    categories={activeCategoryId ? categories.filter((c) => c.id === activeCategoryId) : categories}
                    bookmarks={filteredAndSortedBookmarks}
                    onEdit={(bookmark) => {
                      setBookmarkToEdit(bookmark);
                      setIsAddEditOpen(true);
                    }}
                    onDelete={handleDeleteBookmark}
                    onTogglePin={handleTogglePin}
                    onToggleStar={handleToggleStar}
                    onRecordClick={handleRecordClick}
                    onSelectTag={(tag) => setSelectedTag(tag)}
                  />
                )}
              </>
            ) : (
              /* Empty State */
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  未找到匹配的书签
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mb-4">
                  当前筛选条件或搜索关键词下暂无内容，您可以重置筛选条件，或直接添加新书签。
                </p>
                <div className="flex items-center gap-2">
                  {(searchQuery || selectedTag || showOnlyStarred || showOnlyPinned || activeCategoryId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategoryId(null);
                        setSelectedTag(null);
                        setShowOnlyStarred(false);
                        setShowOnlyPinned(false);
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      清空筛选
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setBookmarkToEdit(null);
                      setIsAddEditOpen(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    添加网址
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        onSelectAll={() => {
          setActiveCategoryId(null);
          setShowOnlyStarred(false);
          setShowOnlyPinned(false);
          setSelectedTag(null);
          setSearchQuery('');
        }}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
        showOnlyStarred={showOnlyStarred}
        onToggleShowStarred={() => setShowOnlyStarred(!showOnlyStarred)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenAddModal={() => {
          setBookmarkToEdit(null);
          setIsAddEditOpen(true);
        }}
        isHomeActive={
          activeCategoryId === null &&
          !showOnlyStarred &&
          !showOnlyPinned &&
          !selectedTag &&
          !searchQuery
        }
      />

      {/* Modals & Overlays */}
      <AddEditModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setBookmarkToEdit(null);
        }}
        onSave={handleSaveBookmark}
        bookmarkToEdit={bookmarkToEdit}
        categories={categories}
        availableTags={allTags}
        initialCategoryId={activeCategoryId || undefined}
      />

      <BatchAddModal
        isOpen={isBatchAddOpen}
        onClose={() => setIsBatchAddOpen(false)}
        categories={categories}
        onBatchAdd={handleBatchAdd}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        bookmarks={bookmarks}
        onSaveCategories={updateCategories}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        bookmarks={bookmarks}
        categories={categories}
        onRecordClick={handleRecordClick}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        bookmarks={bookmarks}
        categories={categories}
        onImportComplete={(newBookmarks, newCategories) => {
          updateCategories(newCategories);
          updateBookmarks(newBookmarks);
        }}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        bookmarks={bookmarks}
        categories={categories}
        onSelectBookmark={(bm) => {
          handleRecordClick(bm);
          window.open(bm.url, '_blank', 'noopener,noreferrer');
        }}
        onOpenAddModal={() => {
          setBookmarkToEdit(null);
          setIsAddEditOpen(true);
        }}
        onOpenBatchAddModal={() => setIsBatchAddOpen(true)}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenImportExportModal={() => setIsImportExportOpen(true)}
        onToggleTheme={handleToggleTheme}
        isDark={isDark}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BookmarkHubApp />
    </ToastProvider>
  );
}
