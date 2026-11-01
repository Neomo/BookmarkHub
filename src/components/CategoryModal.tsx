import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Category, Bookmark } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { buildCategoryTree, CategoryTreeItem } from '../utils/storage';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  FolderTree,
  CornerDownRight,
  FolderPlus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ListFilter,
  CheckCheck,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from './Toast';
import { ModalWrapper } from './ModalWrapper';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  bookmarks: Bookmark[];
  onSaveCategories: (categories: Category[], updatedBookmarks?: Bookmark[]) => void;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#64748b', // Slate
  '#3b82f6', // Blue
];

// Compact Sortable Row for Root Categories
interface SortableRootRowProps {
  category: CategoryTreeItem;
  isSelected: boolean;
  isExpanded: boolean;
  bookmarkCount: number;
  totalGroupCount: number;
  onToggleExpand: () => void;
  onSelectEdit: (cat: Category) => void;
  onAddSubcategory: (parentId: string) => void;
  onDelete: (id: string) => void;
  childrenNode?: React.ReactNode;
}

const SortableRootCategoryRow: React.FC<SortableRootRowProps> = ({
  category,
  isSelected,
  isExpanded,
  bookmarkCount,
  totalGroupCount,
  onToggleExpand,
  onSelectEdit,
  onAddSubcategory,
  onDelete,
  childrenNode,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: { type: 'root', category },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const hasChildren = category.children && category.children.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500/40'
          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      {/* Root Category Bar - Compact */}
      <div
        onClick={() => onSelectEdit(category)}
        className="group px-2 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 -ml-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="按住拖拽排序"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Expand/Collapse Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className={`p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform ${
              hasChildren ? '' : 'opacity-0 pointer-events-none'
            }`}
            title={isExpanded ? '折叠子分类' : '展开子分类'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Category Icon Badge */}
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0 shadow-2xs font-medium"
            style={{ backgroundColor: category.color || '#6366f1' }}
          >
            <CategoryIcon name={category.icon} className="w-3.5 h-3.5" />
          </div>

          {/* Name & Badges */}
          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold truncate ${
                isSelected
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {category.name}
            </span>

            {/* Child count chip */}
            {hasChildren && (
              <span className="px-1.5 py-0.2 text-[9px] font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                {category.children.length} 子类
              </span>
            )}

            {/* Bookmark count chip */}
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0 tabular-nums">
              {totalGroupCount} 项
            </span>
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 shrink-0"
        >
          {/* Quick Add Subcategory */}
          <button
            type="button"
            onClick={() => onAddSubcategory(category.id)}
            title="添加二级子分类"
            className="px-1.5 py-0.5 text-[10px] font-medium rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-0.5"
          >
            <CornerDownRight className="w-2.5 h-2.5 text-indigo-500" />
            <span>+子类</span>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onSelectEdit(category)}
            title="编辑此分类"
            className={`p-1 rounded transition-colors ${
              isSelected
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Edit2 className="w-3 h-3" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            title="删除分类"
            className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Children Subcategories Container */}
      {isExpanded && childrenNode}
    </div>
  );
};

// Compact Sortable Row for Secondary Subcategories
interface SortableSubcategoryRowProps {
  category: Category;
  parentCategory: CategoryTreeItem;
  isSelected: boolean;
  bookmarkCount: number;
  onSelectEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

const SortableSubcategoryRow: React.FC<SortableSubcategoryRowProps> = ({
  category,
  parentCategory,
  isSelected,
  bookmarkCount,
  onSelectEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: { type: 'sub', category, parentId: parentCategory.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelectEdit(category)}
      className={`group px-2 py-1 flex items-center justify-between gap-1.5 cursor-pointer select-none rounded border transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-2xs'
          : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
          title="按住拖拽排序二级分类"
        >
          <GripVertical className="w-3 h-3" />
        </button>

        {/* Subcategory Icon */}
        <div className="w-4 h-4 rounded flex items-center justify-center text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 shrink-0">
          <CategoryIcon name={category.icon} className="w-2.5 h-2.5" />
        </div>

        <span
          className={`text-xs truncate ${
            isSelected
              ? 'font-medium text-indigo-600 dark:text-indigo-400'
              : 'text-neutral-700 dark:text-neutral-300'
          }`}
        >
          {category.name}
        </span>

        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 shrink-0 tabular-nums">
          ({bookmarkCount})
        </span>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-0.5 shrink-0"
      >
        <button
          type="button"
          onClick={() => onSelectEdit(category)}
          title="编辑二级分类"
          className={`p-0.5 rounded transition-colors ${
            isSelected
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Edit2 className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(category.id)}
          title="删除二级分类"
          className="p-0.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  bookmarks,
  onSaveCategories,
}) => {
  const { showToast } = useToast();

  // Working categories state inside modal
  const [catList, setCatList] = useState<Category[]>(categories);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Expand/collapse states for roots
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Mobile Active Tab: 'list' (Category Tree) | 'editor' (Active Item Editor)
  const [mobileTab, setMobileTab] = useState<'list' | 'editor'>('list');

  // Active edit / add state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form input fields
  const [nameInput, setNameInput] = useState('');
  const [iconInput, setIconInput] = useState('Folder');
  const [colorInput, setColorInput] = useState('#6366f1');
  const [parentIdInput, setParentIdInput] = useState<string | null>(null);

  // Icon filter in editor
  const [iconSearch, setIconSearch] = useState('');
  const [selectedIconGroup, setSelectedIconGroup] = useState<string>('全部');

  // Active dragging item for DragOverlay
  const [activeDragItem, setActiveDragItem] = useState<{
    type: 'root' | 'sub';
    category: Category;
  } | null>(null);

  // Input ref
  const nameInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setCatList(categories);
      setSearchQuery('');
      setEditingId(null);
      setIsAdding(false);
      setMobileTab('list');

      // Default all expanded
      const initialExpanded: Record<string, boolean> = {};
      categories.forEach((c) => {
        if (!c.parentId) initialExpanded[c.id] = true;
      });
      setExpandedMap(initialExpanded);
    }
  }, [isOpen, categories]);

  // Derived Category Tree
  const categoryTree = useMemo(() => buildCategoryTree(catList), [catList]);

  // Root categories
  const rootCategories = useMemo(() => {
    return catList.filter((c) => !c.parentId);
  }, [catList]);

  // Icon groups
  const iconGroups = useMemo(() => {
    const groups = new Set(AVAILABLE_ICONS.map((i) => i.group));
    return ['全部', ...Array.from(groups)];
  }, []);

  const filteredIcons = useMemo(() => {
    return AVAILABLE_ICONS.filter((item) => {
      const matchGroup =
        selectedIconGroup === '全部' || item.group === selectedIconGroup;
      const matchSearch =
        !iconSearch.trim() ||
        item.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
        item.label.toLowerCase().includes(iconSearch.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [selectedIconGroup, iconSearch]);

  // Filtered categories based on search
  const filteredTree = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categoryTree;

    return categoryTree
      .map((parent) => {
        const parentMatches = parent.name.toLowerCase().includes(q);
        const matchingChildren = parent.children.filter((child) =>
          child.name.toLowerCase().includes(q)
        );

        if (parentMatches) {
          return parent;
        }

        if (matchingChildren.length > 0) {
          return {
            ...parent,
            children: matchingChildren,
          };
        }

        return null;
      })
      .filter(Boolean) as CategoryTreeItem[];
  }, [categoryTree, searchQuery]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (editingId || isAdding) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [editingId, isAdding]);

  // Start editing existing category
  const handleStartEdit = (cat: Category) => {
    setIsAdding(false);
    setEditingId(cat.id);
    setNameInput(cat.name);
    setIconInput(cat.icon || 'Folder');
    setColorInput(cat.color || '#6366f1');
    setParentIdInput(cat.parentId || null);
    setIconSearch('');
    // Auto switch to editor tab on mobile
    setMobileTab('editor');
  };

  // Start adding new category
  const handleStartAdd = (prefillParentId: string | null = null) => {
    setIsAdding(true);
    setEditingId(null);
    setNameInput('');
    setIconInput(prefillParentId ? 'Folder' : 'FolderTree');
    setParentIdInput(prefillParentId);
    setIconSearch('');

    if (prefillParentId) {
      const parent = catList.find((c) => c.id === prefillParentId);
      setColorInput(parent?.color || PRESET_COLORS[0]);
    } else {
      setColorInput(PRESET_COLORS[catList.length % PRESET_COLORS.length]);
    }

    // Auto switch to editor tab on mobile
    setMobileTab('editor');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setMobileTab('list');
  };

  // Commit item changes
  const handleSaveItem = (): boolean => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showToast('分类名称不能为空', 'error');
      nameInputRef.current?.focus();
      return false;
    }

    if (isAdding) {
      const newCat: Category = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: trimmed,
        icon: iconInput,
        color: colorInput,
        parentId: parentIdInput || null,
        order: catList.length + 1,
      };

      const updated = [...catList, newCat];
      setCatList(updated);
      onSaveCategories(updated);
      setIsAdding(false);
      setEditingId(newCat.id); // keep selected

      // Make sure parent is expanded
      if (parentIdInput) {
        setExpandedMap((prev) => ({ ...prev, [parentIdInput]: true }));
      }

      showToast(parentIdInput ? '已添加二级子分类' : '已添加一级分类', 'success');
      return true;
    } else if (editingId) {
      const effectiveParentId =
        parentIdInput === editingId ? null : parentIdInput || null;

      const updated = catList.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name: trimmed,
              icon: iconInput,
              color: colorInput,
              parentId: effectiveParentId,
            }
          : c
      );

      setCatList(updated);
      onSaveCategories(updated);

      if (effectiveParentId) {
        setExpandedMap((prev) => ({ ...prev, [effectiveParentId]: true }));
      }

      showToast('分类已成功保存', 'success');
      return true;
    }

    return true;
  };

  // Handle Close with auto-save safeguard
  const handleModalClose = () => {
    if ((isAdding || editingId) && nameInput.trim().length > 0) {
      const trimmed = nameInput.trim();
      const currentEditingCat = catList.find((c) => c.id === editingId);

      const isDirty =
        isAdding ||
        (currentEditingCat &&
          (currentEditingCat.name !== trimmed ||
            currentEditingCat.icon !== iconInput ||
            currentEditingCat.color !== colorInput ||
            (currentEditingCat.parentId || null) !== (parentIdInput || null)));

      if (isDirty) {
        handleSaveItem();
      }
    }

    onClose();
  };

  // Toggle expand/collapse for a root category
  const handleToggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleExpandAll = () => {
    const allExpanded = rootCategories.every((r) => expandedMap[r.id]);
    const nextMap: Record<string, boolean> = {};
    rootCategories.forEach((r) => {
      nextMap[r.id] = !allExpanded;
    });
    setExpandedMap(nextMap);
  };

  // Delete category with bookmark reassignment
  const handleDelete = (id: string) => {
    if (catList.length <= 1) {
      showToast('至少需要保留一个分类', 'error');
      return;
    }

    const target = catList.find((c) => c.id === id);
    if (!target) return;

    const childSubcategories = catList.filter((c) => c.parentId === id);
    const allAffectedIds = [id, ...childSubcategories.map((c) => c.id)];

    const linkedBookmarks = bookmarks.filter((b) =>
      allAffectedIds.includes(b.categoryId)
    );
    const remainingCategories = catList.filter(
      (c) => !allAffectedIds.includes(c.id)
    );

    if (remainingCategories.length === 0) {
      showToast('无法删除全部根分类，请至少保留一个可用分类', 'error');
      return;
    }

    const fallbackCategory = remainingCategories[0];
    let updatedBookmarks: Bookmark[] | undefined = undefined;

    if (linkedBookmarks.length > 0) {
      updatedBookmarks = bookmarks.map((b) =>
        allAffectedIds.includes(b.categoryId)
          ? { ...b, categoryId: fallbackCategory.id }
          : b
      );
      showToast(
        `已删除「${target.name}」，${linkedBookmarks.length} 个书签已迁移至「${fallbackCategory.name}」`,
        'info'
      );
    } else {
      showToast(`已删除分类「${target.name}」`, 'success');
    }

    if (editingId === id || allAffectedIds.includes(editingId || '')) {
      setEditingId(null);
      setIsAdding(false);
      setMobileTab('list');
    }

    setCatList(remainingCategories);
    onSaveCategories(remainingCategories, updatedBookmarks);
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const cat = catList.find((c) => c.id === active.id);
    if (cat) {
      setActiveDragItem({
        type: cat.parentId ? 'sub' : 'root',
        category: cat,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCat = catList.find((c) => c.id === active.id);
    const overCat = catList.find((c) => c.id === over.id);

    if (!activeCat || !overCat) return;

    // Case 1: Reordering Root categories
    if (!activeCat.parentId && !overCat.parentId) {
      const roots = catList.filter((c) => !c.parentId);
      const oldIndex = roots.findIndex((c) => c.id === activeCat.id);
      const newIndex = roots.findIndex((c) => c.id === overCat.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedRoots = arrayMove(roots, oldIndex, newIndex);
        const reconstructed: Category[] = [];
        reorderedRoots.forEach((root) => {
          reconstructed.push({ ...root, order: reconstructed.length + 1 });
          const children = catList.filter((c) => c.parentId === root.id);
          children.forEach((child) => {
            reconstructed.push({ ...child, order: reconstructed.length + 1 });
          });
        });

        const handledIds = new Set(reconstructed.map((c) => c.id));
        catList.forEach((c) => {
          if (!handledIds.has(c.id)) {
            reconstructed.push({ ...c, order: reconstructed.length + 1 });
          }
        });

        setCatList(reconstructed);
        onSaveCategories(reconstructed);
        showToast('一级分类顺序已更新', 'success');
      }
      return;
    }

    // Case 2: Subcategory reordering under the same parent
    if (
      activeCat.parentId &&
      overCat.parentId &&
      activeCat.parentId === overCat.parentId
    ) {
      const parentId = activeCat.parentId;
      const siblings = catList.filter((c) => c.parentId === parentId);
      const oldIndex = siblings.findIndex((c) => c.id === activeCat.id);
      const newIndex = siblings.findIndex((c) => c.id === overCat.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex);
        const nonSiblings = catList.filter((c) => c.parentId !== parentId);

        const reconstructed: Category[] = [];
        const roots = catList.filter((c) => !c.parentId);

        roots.forEach((root) => {
          reconstructed.push({ ...root, order: reconstructed.length + 1 });
          const children =
            root.id === parentId
              ? reorderedSiblings
              : nonSiblings.filter((c) => c.parentId === root.id);
          children.forEach((child) => {
            reconstructed.push({ ...child, order: reconstructed.length + 1 });
          });
        });

        setCatList(reconstructed);
        onSaveCategories(reconstructed);
        showToast('二级子分类顺序已更新', 'success');
      }
      return;
    }

    // Case 3: Moving subcategory across parents
    if (activeCat.parentId) {
      let targetParentId: string | null = null;

      if (!overCat.parentId) {
        targetParentId = overCat.id;
      } else {
        targetParentId = overCat.parentId;
      }

      if (targetParentId && targetParentId !== activeCat.id) {
        const updatedCat = { ...activeCat, parentId: targetParentId };
        const updatedList = catList.map((c) =>
          c.id === activeCat.id ? updatedCat : c
        );

        const roots = updatedList.filter((c) => !c.parentId);
        const reconstructed: Category[] = [];
        roots.forEach((root) => {
          reconstructed.push({ ...root, order: reconstructed.length + 1 });
          const children = updatedList.filter((c) => c.parentId === root.id);
          children.forEach((child) => {
            reconstructed.push({ ...child, order: reconstructed.length + 1 });
          });
        });

        setCatList(reconstructed);
        onSaveCategories(reconstructed);
        setExpandedMap((prev) => ({ ...prev, [targetParentId]: true }));
        showToast(
          `已将「${activeCat.name}」移至「${
            catList.find((c) => c.id === targetParentId)?.name || '目标'
          }」`,
          'success'
        );
      }
    }
  };

  // Selected Category details for Right Pane
  const activeEditingCategory = useMemo(() => {
    return catList.find((c) => c.id === editingId) || null;
  }, [catList, editingId]);

  // Check if current category being edited has subcategories
  const currentCategoryHasChildren = useMemo(() => {
    if (!editingId) return false;
    return catList.some((c) => c.parentId === editingId);
  }, [catList, editingId]);

  // Statistics
  const totalSubcategories = catList.filter((c) => c.parentId).length;
  const totalRoots = rootCategories.length;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleModalClose}
      maxWidth="max-w-4xl"
      className="h-[88vh] max-h-[800px] min-h-[460px] flex flex-col p-0 overflow-hidden shadow-2xl"
    >
      {/* Embedded CSS for reliable smooth visible scrollbar */}
      <style>{`
        .cat-scroll::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .cat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .cat-scroll::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.45);
          border-radius: 9999px;
        }
        .cat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.75);
        }
      `}</style>

      {/* Modal Header - Tight & Clean */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                二级分类管理与排序
              </h2>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-medium rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900">
                支持拖拽调序 · 实时保存
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              共 {totalRoots} 个一级分类 · {totalSubcategories} 个二级子分类
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleModalClose}
          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile-Only Segmented Navigation Bar (Switch between Tree & Editor) */}
      <div className="md:hidden flex items-center border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-850 p-1 shrink-0 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'list'
              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>分类目录 ({catList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!editingId && !isAdding) {
              handleStartAdd(null);
            } else {
              setMobileTab('editor');
            }
          }}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'editor'
              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>
            {editingId
              ? `编辑「${activeEditingCategory?.name || '分类'}」`
              : isAdding
              ? '新建分类'
              : '属性编辑'}
          </span>
        </button>
      </div>

      {/* Main Container: Mobile Switches Tabs; Desktop Shows Side-by-Side Dual Panes */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-neutral-50/30 dark:bg-neutral-950/20">
        {/* =========================================
            LEFT COLUMN: Category Tree & Drag-and-Drop
           ========================================= */}
        <div
          className={`flex-1 md:w-7/12 flex-col min-h-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${
            mobileTab === 'list' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Top Actions & Search Bar - Compact */}
          <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 space-y-1.5 shrink-0 bg-neutral-50/50 dark:bg-neutral-950/50">
            <div className="flex items-center gap-1.5">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="快速搜索分类..."
                  className="w-full pl-7 pr-6 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Add Top-level Category Button */}
              <button
                type="button"
                onClick={() => handleStartAdd(null)}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1 shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建一级分类</span>
              </button>
            </div>

            {/* Quick Helper Line */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 px-0.5">
              <span>按住 ⠿ 可上下自由拖拽调序</span>
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors flex items-center gap-0.5"
              >
                <FolderPlus className="w-2.5 h-2.5" />
                <span>全部展开/折叠</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Tree List Area - Dedicated Smooth Scrollbar */}
          <div className="flex-1 min-h-0 overflow-y-auto cat-scroll p-2 space-y-1.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rootCategories.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredTree.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 text-xs">
                    {searchQuery ? '未找到匹配的分类' : '暂无分类，请点击上方按钮新建'}
                  </div>
                ) : (
                  filteredTree.map((parent) => {
                    const isSelected = editingId === parent.id;
                    const isExpanded = expandedMap[parent.id] ?? true;

                    const directCount = bookmarks.filter(
                      (b) => b.categoryId === parent.id
                    ).length;

                    const allChildIds = parent.children.map((c) => c.id);
                    const totalGroupCount = bookmarks.filter(
                      (b) =>
                        b.categoryId === parent.id ||
                        allChildIds.includes(b.categoryId)
                    ).length;

                    return (
                      <SortableRootCategoryRow
                        key={parent.id}
                        category={parent}
                        isSelected={isSelected}
                        isExpanded={isExpanded}
                        bookmarkCount={directCount}
                        totalGroupCount={totalGroupCount}
                        onToggleExpand={() => handleToggleExpand(parent.id)}
                        onSelectEdit={handleStartEdit}
                        onAddSubcategory={handleStartAdd}
                        onDelete={handleDelete}
                        childrenNode={
                          parent.children.length > 0 ? (
                            <div className="ml-5 pl-2 py-1 pr-1.5 border-l-2 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 rounded-r-lg space-y-0.5">
                              <SortableContext
                                items={parent.children.map((c) => c.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {parent.children.map((child) => {
                                  const isChildSelected = editingId === child.id;
                                  const childBookmarkCount = bookmarks.filter(
                                    (b) => b.categoryId === child.id
                                  ).length;

                                  return (
                                    <SortableSubcategoryRow
                                      key={child.id}
                                      category={child}
                                      parentCategory={parent}
                                      isSelected={isChildSelected}
                                      bookmarkCount={childBookmarkCount}
                                      onSelectEdit={handleStartEdit}
                                      onDelete={handleDelete}
                                    />
                                  );
                                })}
                              </SortableContext>
                            </div>
                          ) : null
                        }
                      />
                    );
                  })
                )}
              </SortableContext>

              {/* Drag Overlay Preview */}
              <DragOverlay>
                {activeDragItem ? (
                  <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-indigo-500 shadow-xl flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 opacity-95">
                    <GripVertical className="w-3.5 h-3.5 text-indigo-500" />
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-white"
                      style={{
                        backgroundColor:
                          activeDragItem.category.color || '#6366f1',
                      }}
                    >
                      <CategoryIcon
                        name={activeDragItem.category.icon}
                        className="w-3 h-3"
                      />
                    </div>
                    <span>{activeDragItem.category.name}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: Persistent Sticky Editor Panel
           ========================================= */}
        <div
          className={`flex-1 md:w-5/12 flex-col min-h-0 bg-white dark:bg-neutral-900 ${
            mobileTab === 'editor' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {isAdding || editingId ? (
            /* ACTIVE EDITING / ADDING MODE */
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Compact Editor Header */}
              <div className="px-3.5 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40 shrink-0">
                <div className="flex items-center gap-2">
                  {/* On Mobile, provide a back to list button */}
                  <button
                    type="button"
                    onClick={() => setMobileTab('list')}
                    className="md:hidden p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
                    title="返回列表"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {isAdding ? (
                      <Plus className="w-3 h-3" />
                    ) : (
                      <Edit2 className="w-3 h-3" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {isAdding
                        ? parentIdInput
                          ? '新建二级子分类'
                          : '新建一级分类'
                        : '编辑分类'}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  取消
                </button>
              </div>

              {/* Scrollable Form Body - Tight Spacing */}
              <div className="flex-1 min-h-0 overflow-y-auto cat-scroll p-3.5 space-y-3">
                {/* Real-time Category Visual Preview Strip - Compact */}
                <div>
                  <div className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: colorInput }}
                      >
                        <CategoryIcon name={iconInput} className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {nameInput.trim() || '分类名称预览'}
                        </div>
                        <div className="text-[9px] text-neutral-400">
                          {parentIdInput
                            ? `↳ 属于「${
                                catList.find((c) => c.id === parentIdInput)
                                  ?.name || '一级分类'
                              }」`
                            : '一级顶级分类'}
                        </div>
                      </div>
                    </div>

                    <span className="px-1.5 py-0.2 text-[9px] font-medium rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {parentIdInput ? '二级' : '一级'}
                    </span>
                  </div>
                </div>

                {/* 1. Category Name */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    分类名称 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveItem();
                        }
                      }}
                      placeholder="分类名称 (支持按回车保存)"
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 pr-7"
                    />
                    {nameInput && (
                      <button
                        type="button"
                        onClick={() => setNameInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Hierarchy Parent Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    层级归属（父分类）
                  </label>
                  <select
                    value={parentIdInput || ''}
                    disabled={currentCategoryHasChildren}
                    onChange={(e) =>
                      setParentIdInput(e.target.value ? e.target.value : null)
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">无（作为一级顶级分类）</option>
                    {rootCategories
                      .filter((c) => c.id !== editingId)
                      .map((root) => (
                        <option key={root.id} value={root.id}>
                          ↳ 作为「{root.name}」的二级子分类
                        </option>
                      ))}
                  </select>
                  {currentCategoryHasChildren && (
                    <p className="text-[10px] text-amber-500 mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>该分类下包含子分类，无法变更为二级目录</span>
                    </p>
                  )}
                </div>

                {/* 3. Theme Color - Compact Inline Palette */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    主题标识色彩
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColorInput(c)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          colorInput === c
                            ? 'scale-110 border-neutral-900 dark:border-white shadow-2xs'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}

                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] text-neutral-400">自选:</span>
                      <input
                        type="color"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Icon Selector with Search & Compact Categories */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                      选择图标
                    </label>
                    <span className="text-[10px] text-neutral-400">
                      {iconInput}
                    </span>
                  </div>

                  {/* Icon Search & Group Filter */}
                  <div className="space-y-1 mb-1.5">
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="搜索图标 (例如: Code / Book / AI)..."
                      className="w-full px-2 py-1 text-[11px] rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden"
                    />

                    {/* Group chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[9px]">
                      {iconGroups.map((grp) => (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => setSelectedIconGroup(grp)}
                          className={`px-1.5 py-0.2 rounded-full shrink-0 transition-colors ${
                            selectedIconGroup === grp
                              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                          }`}
                        >
                          {grp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Grid - Dense */}
                  <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 max-h-28 overflow-y-auto cat-scroll p-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60">
                    {filteredIcons.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIconInput(item.name)}
                        className={`p-1.5 rounded border flex flex-col items-center justify-center transition-all ${
                          iconInput === item.name
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                            : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                        title={`${item.label} (${item.name})`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Editor Action Footer - Tight & Prominent */}
              <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 flex items-center justify-between gap-2 shrink-0">
                <span className="text-[10px] text-neutral-400 hidden sm:inline">
                  回车键 Enter 可直接保存
                </span>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                  >
                    取消
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveItem}
                    className="px-3.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Check className="w-3 h-3" />
                    <span>{isAdding ? '确认添加' : '保存修改'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* OVERVIEW / IDLE MODE - Compact */
            <div className="flex-1 min-h-0 p-4 flex flex-col justify-between overflow-y-auto cat-scroll">
              <div className="space-y-3.5">
                {/* Compact Overview Card */}
                <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/20 dark:from-indigo-950/20 dark:via-neutral-900 dark:to-neutral-900">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        分类概览
                      </h4>
                      <p className="text-[10px] text-neutral-400">
                        点击左侧任意分类即可在此即时修改
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 text-xs">
                    <div className="p-1.5 rounded bg-white/70 dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800">
                      <div className="text-[9px] text-neutral-400">一级分类</div>
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {totalRoots} 个
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-white/70 dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800">
                      <div className="text-[9px] text-neutral-400">二级分类</div>
                      <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {totalSubcategories} 个
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Add Button */}
                <button
                  type="button"
                  onClick={() => handleStartAdd(null)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新建一级顶级分类</span>
                </button>

                {/* Compact Tips */}
                <div className="space-y-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <div className="p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      ⠿ 拖拽调序：
                    </span>
                    按住分类左侧的把手即可上下直接调换顺序。
                  </div>

                  <div className="p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      ✏️ 实时编辑：
                    </span>
                    点击左侧任意分类即可在此快速编辑其属性。
                  </div>

                  <div className="p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      ➕ 快捷加子类：
                    </span>
                    在一级分类上点击「+子类」可直接增加二级目录。
                  </div>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-neutral-400">
                请点击左侧列表中的分类进行编辑
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Bottom Persistent Footer - Compact */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>修改与拖拽均已实时同步</span>
        </div>

        <button
          type="button"
          onClick={handleModalClose}
          className="px-4 py-1 text-xs font-semibold rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-2xs"
        >
          完成
        </button>
      </div>
    </ModalWrapper>
  );
};
