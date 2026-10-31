import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Bookmark, Category, ViewMode, SortOption, SystemSettings } from './types';
import {
  loadBookmarks,
  saveBookmarks,
  loadCategories,
  saveCategories,
  getCategoryWithChildrenIds,
  getCategoryBreadcrumb,
  getInactiveBookmarks,
  archiveInactiveBookmarks,
  ARCHIVED_CATEGORY_ID,
  ARCHIVED_CATEGORY,
  loadSystemSettings,
  saveSystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
  loadInitialSystemData,
} from './utils/storage';
import { matchBookmark } from './utils/pinyin';
import { extractDomain, getFaviconUrl } from './utils/url';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SortableBookmarkCard } from './components/SortableBookmarkCard';
import { BookmarkListRow } from './components/BookmarkListRow';
import { BookmarkGroupView } from './components/BookmarkGroupView';
import { GroupFloatingToc } from './components/GroupFloatingToc';
import { DailyPicksBanner } from './components/DailyPicksBanner';
import { ArchiveModal } from './components/ArchiveModal';
import { AddEditModal } from './components/AddEditModal';
import { BatchAddModal } from './components/BatchAddModal';
import { CategoryModal } from './components/CategoryModal';
import { StatsModal } from './components/StatsModal';
import { ImportExportModal } from './components/ImportExportModal';
import { CommandPalette } from './components/CommandPalette';
import { QrCodeModal } from './components/QrCodeModal';
import { MobileNav } from './components/MobileNav';
import { AdminDashboard, AdminTab } from './components/admin/AdminDashboard';
import { ExplorationMode } from './components/ExplorationMode';
import { FloatingKeyboardShortcuts } from './components/FloatingKeyboardShortcuts';
import { ToastProvider, useToast } from './components/Toast';
import {
  Search,
  ArrowUpDown,
  X,
  ListPlus,
  Inbox,
  GripVertical,
  Globe,
  Shrink,
} from 'lucide-react';

function BookmarkHubApp() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { showToast } = useToast();

  // System Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    return loadSystemSettings();
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('categories');
  const [isExplorationMode, setIsExplorationMode] = useState(false);

  // View & Filter states
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookmarkhub_view_mode') as ViewMode | null;
      if (saved && ['card', 'list', 'group'].includes(saved)) return saved;
    }
    return 'card';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('custom');
  // Compact mode state (reduces card footprint, list 2 per row, high density group)
  const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bookmarkhub_compact_mode') === 'true';
    }
    return false;
  });

  // Targeted category ID when navigating in group view
  const [targetedGroupCategoryId, setTargetedGroupCategoryId] = useState<string | null>(null);
  const pendingScrollCategoryIdRef = useRef<string | null>(null);

  const handleToggleCompactMode = () => {
    const next = !isCompactMode;
    setIsCompactMode(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bookmarkhub_compact_mode', next ? 'true' : 'false');
      } catch {
        // ignore
      }
    }
    showToast(next ? '已开启紧凑模式（高密度展示）' : '已恢复标准视图模式', 'info');
  };

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<Bookmark | null>(null);
  const [isBatchAddOpen, setIsBatchAddOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bookmarkhub_auto_archive_enabled') !== 'false';
    }
    return true;
  });

  // QR Code Modal State
  const [qrBookmark, setQrBookmark] = useState<Bookmark | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Active dragged item for DragOverlay & cross-component category drop
  const [activeDragBookmark, setActiveDragBookmark] = useState<Bookmark | null>(null);

  // Dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = loadSystemSettings();
      if (savedSettings.defaultTheme === 'dark') return true;
      if (savedSettings.defaultTheme === 'light') return false;
      const saved = localStorage.getItem('bookmarkhub_theme_mode');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Fullscreen focus mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Sync fullscreen state with document fullscreenchange
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection:
  // Prioritize pointer collisions so dropping onto sidebar categories (both 1st and 2nd level)
  // or horizontal subcategory tabs always triggers accurately.
  // Fall back to closestCenter for smooth card sorting in grid.
  const customCollisionDetection: CollisionDetection = (args) => {
    // 1. Pointer within collision: prioritize category targets (sidebar buttons, group headers/tabs)
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const categoryCollision = pointerCollisions.find((c) =>
        String(c.id).startsWith('droppable-category-')
      );
      if (categoryCollision) {
        return [categoryCollision];
      }
      return pointerCollisions;
    }

    // 2. Rect intersection: prioritize category targets
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      const categoryCollision = rectCollisions.find((c) =>
        String(c.id).startsWith('droppable-category-')
      );
      if (categoryCollision) {
        return [categoryCollision];
      }
      return rectCollisions;
    }

    // 3. Fall back to closestCenter for card reordering
    return closestCenter(args);
  };

  // Apply theme mode ('light' | 'dark' | 'system')
  const applyThemeMode = (mode: 'light' | 'dark' | 'system') => {
    let shouldBeDark = false;
    if (mode === 'dark') {
      shouldBeDark = true;
    } else if (mode === 'light') {
      shouldBeDark = false;
    } else {
      shouldBeDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(shouldBeDark);
    if (typeof document !== 'undefined') {
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('bookmarkhub_theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('bookmarkhub_theme_mode', 'light');
      }
    }
  };

  // Load initial data on mount:
  // 1. If local storage already has saved data, uses local updated data.
  // 2. If first time open (no local data), loads from linksconfig.json in system directory.
  // 3. If linksconfig.json is missing or invalid, loads built-in demo data.
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const initialData = await loadInitialSystemData();
      if (!isMounted) return;

      let currentCats = initialData.categories;
      let currentBms = initialData.bookmarks;

      // Settings: check if linksconfig provided custom settings
      let loadedSettings = loadSystemSettings();
      if (initialData.settings) {
        loadedSettings = {
          ...loadedSettings,
          ...initialData.settings,
        };
        setSystemSettings(loadedSettings);
        saveSystemSettings(loadedSettings);
      } else {
        setSystemSettings(loadedSettings);
      }

      // Check auto-archive for bookmarks with no clicks in last 6 months
      const autoArchive = localStorage.getItem('bookmarkhub_auto_archive_enabled') !== 'false';
      if (autoArchive) {
        const archiveResult = archiveInactiveBookmarks(currentBms, currentCats);
        if (archiveResult.archivedCount > 0) {
          setCategories(archiveResult.updatedCategories);
          setBookmarks(archiveResult.updatedBookmarks);
          saveCategories(archiveResult.updatedCategories);
          saveBookmarks(archiveResult.updatedBookmarks);
          setTimeout(() => {
            showToast(
              `智能整理：已自动将 ${archiveResult.archivedCount} 个超 6 个月未访问的书签移入「已归档」分类`,
              'info'
            );
          }, 600);
        } else {
          setCategories(currentCats);
          setBookmarks(currentBms);
        }
      } else {
        setCategories(currentCats);
        setBookmarks(currentBms);
      }

      const savedView = localStorage.getItem('bookmarkhub_view_mode') as ViewMode | null;
      if (savedView && ['card', 'list', 'group'].includes(savedView)) {
        setViewMode(savedView);
      } else if (loadedSettings.defaultViewMode) {
        setViewMode(loadedSettings.defaultViewMode);
      }

      applyThemeMode(loadedSettings.defaultTheme);
      setIsLoaded(true);

      if (initialData.source === 'linksconfig') {
        setTimeout(() => {
          showToast(`已从 linksconfig.json 成功初始化 ${currentBms.length} 条网址数据`, 'success');
        }, 400);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to system dark mode preference changes if mode is 'system'
  useEffect(() => {
    if (systemSettings.defaultTheme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [systemSettings.defaultTheme]);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Global keyboard shortcuts (customizable with fallback defaults)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs or textareas unless it is Escape or modified with Ctrl/Cmd
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') {
        if (isExplorationMode) setIsExplorationMode(false);
        else if (isAddEditOpen) setIsAddEditOpen(false);
        else if (isBatchAddOpen) setIsBatchAddOpen(false);
        else if (isCategoryModalOpen) setIsCategoryModalOpen(false);
        else if (isStatsModalOpen) setIsStatsModalOpen(false);
        else if (isImportExportOpen) setIsImportExportOpen(false);
        else if (isArchiveModalOpen) setIsArchiveModalOpen(false);
        else if (isAdminOpen) setIsAdminOpen(false);
        else if (isQrModalOpen) setIsQrModalOpen(false);
        else if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (searchQuery) setSearchQuery('');
        else if (isFullscreen) {
          setIsFullscreen(false);
          if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
        return;
      }

      if (isInput && !e.ctrlKey && !e.metaKey) return;

      const sc = systemSettings.customShortcuts || {
        search: 'k',
        newBookmark: 'n',
        toggleTheme: 't',
        openAdmin: 'm',
        toggleView: 'v',
      };

      const hasModifier = e.metaKey || e.ctrlKey;
      const pressedKey = e.key.toLowerCase();

      if (hasModifier && pressedKey === (sc.search || 'k').toLowerCase()) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (hasModifier && pressedKey === (sc.newBookmark || 'n').toLowerCase()) {
        e.preventDefault();
        setBookmarkToEdit(null);
        setIsAddEditOpen(true);
      } else if (hasModifier && pressedKey === (sc.toggleTheme || 't').toLowerCase()) {
        e.preventDefault();
        handleToggleTheme();
      } else if (hasModifier && pressedKey === (sc.openAdmin || 'm').toLowerCase()) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      } else if (hasModifier && pressedKey === (sc.toggleView || 'v').toLowerCase()) {
        e.preventDefault();
        setViewMode((current) => {
          const nextMode: ViewMode =
            current === 'card' ? 'list' : current === 'list' ? 'group' : 'card';
          localStorage.setItem('bookmarkhub_view_mode', nextMode);
          return nextMode;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    systemSettings.customShortcuts,
    isAddEditOpen,
    isBatchAddOpen,
    isCategoryModalOpen,
    isStatsModalOpen,
    isImportExportOpen,
    isArchiveModalOpen,
    isAdminOpen,
    isQrModalOpen,
    isCommandPaletteOpen,
    searchQuery,
    isDark,
    isFullscreen,
  ]);

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
    const nextDark = !isDark;
    setIsDark(nextDark);
    const newMode = nextDark ? 'dark' : 'light';
    const updatedSettings: SystemSettings = { ...systemSettings, defaultTheme: newMode };
    setSystemSettings(updatedSettings);
    saveSystemSettings(updatedSettings);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bookmarkhub_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bookmarkhub_theme_mode', 'light');
    }
  };

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    saveSystemSettings(newSettings);
    applyThemeMode(newSettings.defaultTheme);
    setViewMode(newSettings.defaultViewMode);
    localStorage.setItem('bookmarkhub_view_mode', newSettings.defaultViewMode);
  };

  const handleOpenAdmin = (tab: AdminTab = 'categories') => {
    setAdminInitialTab(tab);
    setIsAdminOpen(true);
  };

  const handleChangeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('bookmarkhub_view_mode', mode);
  };

  // Open QR code modal
  const handleShowQrCode = (bookmark: Bookmark) => {
    setQrBookmark(bookmark);
    setIsQrModalOpen(true);
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

  // Helper to format 2-level category name for cards and list rows
  const getDisplayCategory = (catId: string): Category | undefined => {
    const cat = categoryMap.get(catId);
    if (!cat) return undefined;
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        return { ...cat, name: `${parent.name} / ${cat.name}` };
      }
    }
    return cat;
  };

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

  // Select category and reset conflicting filters
  const handleSelectCategory = (id: string | null) => {
    setActiveCategoryId(id);
    if (id !== null) {
      setShowOnlyStarred(false);
      setShowOnlyPinned(false);
      setSelectedTag(null);
    }
  };

  // Smooth scroll helper for group directory navigation
  const scrollToCategorySection = (catId: string) => {
    const targetElementId = catId === 'uncategorized' ? 'group-root-uncategorized' : `group-root-${catId}`;
    const tryScroll = () => {
      const el = document.getElementById(targetElementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };

    if (!tryScroll()) {
      requestAnimationFrame(() => {
        if (!tryScroll()) {
          setTimeout(tryScroll, 60);
        }
      });
    }
  };

  // Jump to root category in group view:
  // Case 1: If currently showing all websites (activeCategoryId === null):
  //         Directly smooth scroll to that category's section! (Does NOT filter/change activeCategoryId)
  // Case 2: If currently viewing a filtered category (activeCategoryId !== null):
  //         First reset view to all websites (setActiveCategoryId(null)), then smooth scroll to that category!
  const handleJumpToGroupCategory = (targetCategoryId: string) => {
    setTargetedGroupCategoryId(targetCategoryId);
    if (activeCategoryId !== null) {
      pendingScrollCategoryIdRef.current = targetCategoryId;
      setActiveCategoryId(null);
    } else {
      scrollToCategorySection(targetCategoryId);
    }
  };

  // When activeCategoryId changes to null and there is a pending scroll target, scroll to it
  useEffect(() => {
    if (activeCategoryId === null && pendingScrollCategoryIdRef.current) {
      const targetId = pendingScrollCategoryIdRef.current;
      pendingScrollCategoryIdRef.current = null;
      const timer = setTimeout(() => {
        scrollToCategorySection(targetId);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activeCategoryId]);

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

  // Inactive bookmarks with no clicks in last 6 months (excluding already archived)
  const inactiveBookmarks = useMemo(() => {
    return getInactiveBookmarks(bookmarks);
  }, [bookmarks]);
  const inactiveCount = inactiveBookmarks.length;

  // Move selected bookmarks to '已归档' (Archived)
  const handleArchiveBookmarks = (bookmarkIds: string[]) => {
    let updatedCats = [...categories];
    const existingArchivedCat = updatedCats.find(
      (c) => c.id === ARCHIVED_CATEGORY_ID || c.name === '已归档'
    );
    let targetCatId = ARCHIVED_CATEGORY_ID;

    if (!existingArchivedCat) {
      updatedCats.push(ARCHIVED_CATEGORY);
    } else {
      targetCatId = existingArchivedCat.id;
    }

    const idSet = new Set(bookmarkIds);
    const updatedBms = bookmarks.map((b) =>
      idSet.has(b.id)
        ? {
            ...b,
            categoryId: targetCatId,
            updatedAt: Date.now(),
          }
        : b
    );

    updateCategories(updatedCats, updatedBms);
    showToast(`已成功将 ${bookmarkIds.length} 个闲置网址移入「已归档」分类`, 'success');
  };

  // Restore selected bookmarks from '已归档' back to a standard category
  const handleRestoreBookmarks = (bookmarkIds: string[], targetCategoryId: string) => {
    const idSet = new Set(bookmarkIds);
    const targetCat = categories.find((c) => c.id === targetCategoryId) || categories[0];
    const updatedBms = bookmarks.map((b) =>
      idSet.has(b.id)
        ? {
            ...b,
            categoryId: targetCategoryId,
            updatedAt: Date.now(),
          }
        : b
    );
    updateBookmarks(updatedBms);
    showToast(`已成功恢复 ${bookmarkIds.length} 个网址至「${targetCat?.name || '常规'}」分类`, 'success');
  };

  // Toggle auto-archive on startup
  const handleToggleAutoArchive = (enabled: boolean) => {
    setAutoArchiveEnabled(enabled);
    localStorage.setItem('bookmarkhub_auto_archive_enabled', enabled ? 'true' : 'false');
    showToast(enabled ? '已开启启动时自动归档超 6 个月未访问书签' : '已关闭自动归档', 'info');
  };

  // Filtered & Sorted Bookmarks
  const filteredAndSortedBookmarks = useMemo(() => {
    // 1. Filtering
    let list = bookmarks.filter((b) => {
      // Category filter (includes parent category bookmarks and subcategory bookmarks)
      if (activeCategoryId) {
        const allowedCatIds = getCategoryWithChildrenIds(activeCategoryId, categories);
        if (!allowedCatIds.includes(b.categoryId)) {
          return false;
        }
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

  // Handle Drag Start to show overlay and highlight sidebar dropzones
  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    const found = bookmarks.find((b) => b.id === activeId);
    if (found) {
      setActiveDragBookmark(found);
    }
  };

  // Handle Drag End event (both Card Reordering and Category Drop)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragBookmark(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 1. Check if dropped onto a category target (sidebar button, group header, or subcategory tab)!
    const categoryDropMatch = overId.match(/^droppable-category-(?:sidebar-|mobile-|group-|groupsub-|)(.+)$/);
    if (categoryDropMatch) {
      const targetCategoryId = categoryDropMatch[1];
      const targetCategory = categories.find((c) => c.id === targetCategoryId);
      const draggedBookmark = bookmarks.find((b) => b.id === activeId);

      if (draggedBookmark && targetCategory) {
        if (draggedBookmark.categoryId === targetCategoryId) {
          showToast(`书签「${draggedBookmark.title}」已在「${targetCategory.name}」分类中`, 'info');
          return;
        }

        const { parent: targetParent } = getCategoryBreadcrumb(targetCategoryId, categories);
        const catDisplayName = targetParent
          ? `${targetParent.name} / ${targetCategory.name}`
          : targetCategory.name;

        const updated = bookmarks.map((b) =>
          b.id === draggedBookmark.id
            ? { ...b, categoryId: targetCategoryId, updatedAt: Date.now() }
            : b
        );
        updateBookmarks(updated);
        showToast(
          `已将「${draggedBookmark.title}」分类归入「${catDisplayName}」`,
          'success'
        );
        return;
      }
    }

    // 2. Otherwise handle normal card reordering within Card View
    if (active.id === over.id) return;

    const oldIndex = bookmarks.findIndex((b) => b.id === activeId);
    const newIndex = bookmarks.findIndex((b) => b.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const moved = arrayMove(bookmarks, oldIndex, newIndex);
      const reordered = moved.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));
      updateBookmarks(reordered);
      if (sortOption !== 'custom') {
        setSortOption('custom');
      }
      showToast('已调整卡片拖拽排序', 'info');
    }
  };

  // Active Category Name display with 2-level breadcrumb
  const { parent: currentParent, current: currentCat } = getCategoryBreadcrumb(
    activeCategoryId,
    categories
  );

  const currentCategoryName = currentCat
    ? currentParent
      ? `${currentParent.name} / ${currentCat.name}`
      : currentCat.name
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
    if (diff > 80) {
      if (viewMode === 'card') handleChangeViewMode('list');
      else if (viewMode === 'list') handleChangeViewMode('group');
    } else if (diff < -80) {
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

  // Full-page focused Admin Console
  if (isAdminOpen) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
        <AdminDashboard
          bookmarks={bookmarks}
          categories={categories}
          settings={systemSettings}
          currentTheme={systemSettings.defaultTheme}
          onClose={() => setIsAdminOpen(false)}
          onUpdateBookmarks={updateBookmarks}
          onUpdateCategories={updateCategories}
          onUpdateSettings={handleUpdateSettings}
          onApplyTheme={(theme) => {
            const updated = { ...systemSettings, defaultTheme: theme };
            setSystemSettings(updated);
            saveSystemSettings(updated);
            applyThemeMode(theme);
          }}
          onEditBookmark={(bookmark) => {
            setBookmarkToEdit(bookmark);
            setIsAddEditOpen(true);
          }}
          onShowQrCode={handleShowQrCode}
          initialTab={adminInitialTab}
        />

        {/* Modal overlays accessible from admin */}
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

        <QrCodeModal
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            setQrBookmark(null);
          }}
          bookmark={qrBookmark}
          categories={categories}
        />
      </div>
    );
  }

  // Dedicated Exploration Mode: 仅显示网址列表与退出按钮，全屏聚焦动效，随机打乱填满视窗，点击分类图标聚焦该分类
  if (isExplorationMode) {
    return (
      <ExplorationMode
        bookmarks={bookmarks}
        categories={categories}
        onClose={() => setIsExplorationMode(false)}
        onRecordClick={handleRecordClick}
        openInNewTab={systemSettings.openInNewTab}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans canvas-ambient-light">
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
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        onOpenAdmin={() => handleOpenAdmin('categories')}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        inactiveCount={inactiveCount}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isCompactMode={isCompactMode}
        onToggleCompactMode={handleToggleCompactMode}
        onOpenExplorationMode={() => setIsExplorationMode(true)}
      />

      {/* DndContext wrapping both Sidebar and Main Viewport to enable cross-component drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex-1 flex w-full mx-auto ${isFullscreen ? 'max-w-none px-2 sm:px-6' : 'max-w-400'}`}>
          {/* Left Sidebar with Droppable Category Targets */}
          {!isFullscreen && (
            <Sidebar
              categories={categories}
              bookmarks={bookmarks}
              activeCategoryId={activeCategoryId}
              onSelectCategory={handleSelectCategory}
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
              onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
              onOpenAdmin={() => handleOpenAdmin('categories')}
              isOpenMobile={isSidebarMobileOpen}
              onCloseMobile={() => setIsSidebarMobileOpen(false)}
              isDraggingBookmark={!!activeDragBookmark}
              inactiveCount={inactiveCount}
            />
          )}

          {/* Content Viewport */}
          <main
            className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Fullscreen Zen Focus Notification Banner */}
            {isFullscreen && (
              <div className="mb-4 p-2.5 px-3.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>全屏专注模式：已隐藏侧边栏与辅助模块，专注浏览与检索书签。按 <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-800 rounded">Esc</kbd> 退出。</span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-800 font-medium hover:bg-indigo-50 dark:hover:bg-neutral-700 transition-colors shrink-0 shadow-xs"
                >
                  退出全屏
                </button>
              </div>
            )}

            {/* 1. Daily Picks Banner: Shows one random unvisited bookmarked URL every day (if enabled in settings) */}
            {!isFullscreen && systemSettings.enableDailyPicks && (
              <DailyPicksBanner
                bookmarks={bookmarks}
                categories={categories}
                onRecordClick={handleRecordClick}
                onShowQrCode={handleShowQrCode}
                onSelectCategory={handleSelectCategory}
                onSelectTag={(tag) => setSelectedTag(tag)}
              />
            )}

            {/* Inactive Archive Banner if currently browsing '已归档' category */}
            {activeCategoryId === ARCHIVED_CATEGORY_ID && (
              <div className="mb-6 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">📦</span>
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      「已归档」分类管理
                    </div>
                    <div className="text-neutral-500 mt-0.5">
                      此专区存放超 6 个月未访问的书签，避免干扰主界面。点击访问即可重新唤醒活跃度，或拖拽卡片至其他分类移出归档。
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors shrink-0 self-start sm:self-center"
                >
                  管理与恢复归档
                </button>
              </div>
            )}
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
                <div className="flex items-center flex-wrap gap-2 text-xs text-neutral-500 mt-0.5">
                  <span>
                    {activeCategoryId
                      ? `${categoryMap.get(activeCategoryId)?.description || '分类收藏目录'} · 支持置顶与星标`
                      : '集中管理、分类检索、点击统计'}
                  </span>
                  {viewMode === 'card' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-neutral-400">
                        <GripVertical className="w-3 h-3 text-indigo-500" />
                        <span>可拖拽卡片重排，或拖至左侧分类快速归类</span>
                      </span>
                    </>
                  )}
                </div>
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
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-neutral-400 dark:focus:border-neutral-600 transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs shadow-2xs transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent focus:outline-hidden cursor-pointer text-xs"
                  >
                    <option value="custom" className="dark:bg-neutral-900">默认排序 (拖拽顺序)</option>
                    <option value="clicks_desc" className="dark:bg-neutral-900">访问最多 (Top)</option>
                    <option value="recent_click" className="dark:bg-neutral-900">最近访问</option>
                    <option value="created_desc" className="dark:bg-neutral-900">最新添加</option>
                    <option value="title_asc" className="dark:bg-neutral-900">标题字母 (A-Z)</option>
                  </select>
                </div>

                {/* Compact Mode Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleCompactMode}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    isCompactMode
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-2xs font-semibold'
                      : 'border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-2xs'
                  }`}
                  title={isCompactMode ? '当前为紧凑模式（点击恢复标准模式）' : '开启紧凑模式（卡片缩小宽高/列表双列展示）'}
                >
                  <Shrink className="w-3.5 h-3.5" />
                  <span>紧凑</span>
                </button>

                {/* Batch Add Button */}
                <button
                  type="button"
                  onClick={() => setIsBatchAddOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200/90 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-2xs cursor-pointer"
                  title="批量导入多条网址"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>批量添加</span>
                </button>
              </div>
            </div>

            {/* Active Filter Badges */}
            {(searchQuery || selectedTag || showOnlyStarred || showOnlyPinned || activeCategoryId) && (
              <div className="flex items-center flex-wrap gap-2 mb-4 text-xs">
                <span className="text-neutral-400 text-[11px]">当前过滤:</span>

                {activeCategoryId && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800">
                    <span>分类: {currentParent ? `${currentParent.name} / ` : ''}{currentCat?.name}</span>
                    <button
                      type="button"
                      onClick={() => setActiveCategoryId(null)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedTag && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    <span>#{selectedTag}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {showOnlyStarred && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                    <span>⭐ 星标</span>
                    <button
                      type="button"
                      onClick={() => setShowOnlyStarred(false)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {showOnlyPinned && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300/80 dark:border-neutral-700">
                    <span>📌 置顶</span>
                    <button
                      type="button"
                      onClick={() => setShowOnlyPinned(false)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800">
                    <span>关键词: &ldquo;{searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
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
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-dotted ml-1 cursor-pointer"
                >
                  重置全部
                </button>
              </div>
            )}

            {/* Bookmarks Render Area */}
            <div
              key={`${activeCategoryId || 'all'}-${selectedTag || 'all'}-${showOnlyStarred}-${showOnlyPinned}-${searchQuery}`}
              className="flex-1 transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-1"
            >
              {filteredAndSortedBookmarks.length > 0 ? (
                <>
                  {/* 1. Card View with dnd-kit Drag-and-Drop Sorting */}
                  {viewMode === 'card' && (
                    <SortableContext
                      items={filteredAndSortedBookmarks.map((b) => b.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div
                        className={
                          isCompactMode
                            ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3.5'
                            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5'
                        }
                      >
                        {filteredAndSortedBookmarks.map((bm) => (
                          <SortableBookmarkCard
                            key={bm.id}
                            bookmark={bm}
                            category={getDisplayCategory(bm.categoryId)}
                            onEdit={(bookmark) => {
                              setBookmarkToEdit(bookmark);
                              setIsAddEditOpen(true);
                            }}
                            onDelete={handleDeleteBookmark}
                            onTogglePin={handleTogglePin}
                            onToggleStar={handleToggleStar}
                            onRecordClick={handleRecordClick}
                            onSelectTag={(tag) => setSelectedTag(tag)}
                            onShowQrCode={handleShowQrCode}
                            showOgImage={systemSettings.showCardOgImage ?? true}
                            onSelectCategory={handleSelectCategory}
                            isCompact={isCompactMode}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}

                  {/* 2. List View */}
                  {viewMode === 'list' && (
                    <div
                      className={
                        isCompactMode
                          ? 'grid grid-cols-1 md:grid-cols-2 gap-2'
                          : 'space-y-1.5'
                      }
                    >
                      {filteredAndSortedBookmarks.map((bm) => (
                        <BookmarkListRow
                          key={bm.id}
                          bookmark={bm}
                          category={getDisplayCategory(bm.categoryId)}
                          onEdit={(bookmark) => {
                            setBookmarkToEdit(bookmark);
                            setIsAddEditOpen(true);
                          }}
                          onDelete={handleDeleteBookmark}
                          onTogglePin={handleTogglePin}
                          onToggleStar={handleToggleStar}
                          onRecordClick={handleRecordClick}
                          onSelectTag={(tag) => setSelectedTag(tag)}
                          onShowQrCode={handleShowQrCode}
                          onSelectCategory={handleSelectCategory}
                          isCompact={isCompactMode}
                        />
                      ))}
                    </div>
                  )}

                  {/* 3. Grouped by Category View */}
                  {viewMode === 'group' && (
                    <BookmarkGroupView
                      categories={categories}
                      bookmarks={filteredAndSortedBookmarks}
                      activeCategoryId={activeCategoryId}
                      getDisplayCategory={getDisplayCategory}
                      onEdit={(bookmark) => {
                        setBookmarkToEdit(bookmark);
                        setIsAddEditOpen(true);
                      }}
                      onDelete={handleDeleteBookmark}
                      onTogglePin={handleTogglePin}
                      onToggleStar={handleToggleStar}
                      onRecordClick={handleRecordClick}
                      onSelectTag={(tag) => setSelectedTag(tag)}
                      onShowQrCode={handleShowQrCode}
                      globalDefaultSubView={systemSettings.defaultSubCategoriesView}
                      showOgImage={systemSettings.showCardOgImage ?? true}
                      onSelectCategory={handleSelectCategory}
                      isCompactMode={isCompactMode}
                      targetedCategoryId={targetedGroupCategoryId}
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

        {/* Drag Overlay: Renders floating preview of the dragged bookmark under pointer */}
        <DragOverlay dropAnimation={null}>
          {activeDragBookmark ? (
            <div className="p-3 w-64 rounded-xl border border-neutral-400 dark:border-neutral-600 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl pointer-events-none select-none flex items-center gap-2.5 z-50">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={getFaviconUrl(activeDragBookmark.url)}
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {activeDragBookmark.title}
                </div>
                <div className="text-[10px] font-mono text-neutral-400 truncate">
                  {extractDomain(activeDragBookmark.url)}
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium">
                拖动中
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Mobile Bottom Navigation Bar */}
      {!isFullscreen && (
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
      )}

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setQrBookmark(null);
        }}
        bookmark={qrBookmark}
        categories={categories}
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
        onUpdateBookmarks={updateBookmarks}
        onEditBookmark={(bm) => {
          setBookmarkToEdit(bm);
          setIsAddEditOpen(true);
        }}
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
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        onOpenAdmin={(tab) => handleOpenAdmin((tab as AdminTab) || 'categories')}
        onOpenExplorationMode={() => setIsExplorationMode(true)}
        onToggleTheme={handleToggleTheme}
        isDark={isDark}
      />

      {/* Archive Management Modal */}
      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        bookmarks={bookmarks}
        categories={categories}
        onArchiveBookmarks={handleArchiveBookmarks}
        onRestoreBookmarks={handleRestoreBookmarks}
        autoArchiveEnabled={autoArchiveEnabled}
        onToggleAutoArchive={handleToggleAutoArchive}
      />

      {/* Floating Keyboard Shortcuts Helper Indicator */}
      {!isFullscreen && (
        <FloatingKeyboardShortcuts
          shortcuts={systemSettings.customShortcuts}
          onOpenSettings={() => handleOpenAdmin('settings')}
        />
      )}

      {/* Group View: Floating Directory Quick-jump Navigation Rail (Always visible in viewport in group view) */}
      {viewMode === 'group' && (
        <GroupFloatingToc
          categories={categories}
          bookmarks={bookmarks}
          activeCategoryId={activeCategoryId}
          onJumpToCategory={handleJumpToGroupCategory}
          onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />
      )}
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
