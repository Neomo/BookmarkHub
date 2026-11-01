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
  Folder,
  CheckCircle2,
  HelpCircle,
  Hash,
  Eye,
  AlertTriangle,
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

// Sortable Row for Root Categories
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
      className={`rounded-xl border transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs ring-1 ring-indigo-500/50'
          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs'
      }`}
    >
      {/* Root Category Bar */}
      <div
        onClick={() => onSelectEdit(category)}
        className="group px-3 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 -ml-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="按住上下拖拽调整一级分类排序"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Expand/Collapse Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className={`p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform ${
              hasChildren ? '' : 'opacity-0 pointer-events-none'
            }`}
            title={isExpanded ? '折叠二级分类' : '展开二级分类'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Category Icon Badge */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs font-semibold"
            style={{ backgroundColor: category.color || '#6366f1' }}
          >
            <CategoryIcon name={category.icon} className="w-4 h-4" />
          </div>

          {/* Name & Badges */}
          <div className="min-w-0 flex-1 flex items-center gap-2">
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
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                {category.children.length} 子分类
              </span>
            )}

            {/* Bookmark count chip */}
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0 tabular-nums">
              {totalGroupCount} 书签
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 shrink-0"
        >
          {/* Quick Add Subcategory */}
          <button
            type="button"
            onClick={() => onAddSubcategory(category.id)}
            title="在此分类下添加二级子分类"
            className="px-2 py-1 text-[11px] font-medium rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1"
          >
            <CornerDownRight className="w-3 h-3 text-indigo-500" />
            <span>加子分类</span>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onSelectEdit(category)}
            title="编辑此分类"
            className={`p-1.5 rounded-md transition-colors ${
              isSelected
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            title="删除分类及其子分类"
            className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children Subcategories Container */}
      {isExpanded && childrenNode}
    </div>
  );
};

// Sortable Row for Secondary Subcategories
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
      className={`group px-3 py-2 flex items-center justify-between gap-2 cursor-pointer select-none rounded-lg border transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500/40'
          : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Drag handle for subcategory */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
          title="按住拖拽排序二级分类"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Tree branch connector indicator */}
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 shrink-0" />

        {/* Subcategory Icon */}
        <div className="w-5 h-5 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 shrink-0">
          <CategoryIcon name={category.icon} className="w-3 h-3" />
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

        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0 tabular-nums">
          ({bookmarkCount} 项)
        </span>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 shrink-0"
      >
        <button
          type="button"
          onClick={() => onSelectEdit(category)}
          title="编辑此二级分类"
          className={`p-1 rounded transition-colors ${
            isSelected
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(category.id)}
          title="删除二级分类"
          className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
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

  // Active edit / add state
  // null = overview/idle mode, string = category.id being edited
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

  // Input and container refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setCatList(categories);
      setSearchQuery('');
      setEditingId(null);
      setIsAdding(false);
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

  // Auto-focus input when editing starts & scroll to editor on smaller screens
  useEffect(() => {
    if (editingId || isAdding) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);

      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setTimeout(() => {
          editorPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
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
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
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
      setEditingId(newCat.id); // keep selected in right pane

      // Make sure parent is expanded
      if (parentIdInput) {
        setExpandedMap((prev) => ({ ...prev, [parentIdInput]: true }));
      }

      showToast(parentIdInput ? '已添加二级子分类' : '已添加一级分类', 'success');
      return true;
    } else if (editingId) {
      // Prevent setting oneself as own parent
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
    // If the user modified the form and has a valid non-empty name, auto-save before closing
    if ((isAdding || editingId) && nameInput.trim().length > 0) {
      const trimmed = nameInput.trim();
      const currentEditingCat = catList.find((c) => c.id === editingId);

      // Check if anything actually changed
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

    // Check if it's a root category with subcategories
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
        `已删除「${target.name}」，相关的 ${linkedBookmarks.length} 个书签已迁移至「${fallbackCategory.name}」`,
        'info'
      );
    } else {
      showToast(`已删除分类「${target.name}」`, 'success');
    }

    if (editingId === id || allAffectedIds.includes(editingId || '')) {
      setEditingId(null);
      setIsAdding(false);
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
        // Rebuild full list preserving children under their roots
        const reconstructed: Category[] = [];
        reorderedRoots.forEach((root) => {
          reconstructed.push({ ...root, order: reconstructed.length + 1 });
          const children = catList.filter((c) => c.parentId === root.id);
          children.forEach((child) => {
            reconstructed.push({ ...child, order: reconstructed.length + 1 });
          });
        });

        // Any remaining orphan categories
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

        // Reconstruct maintaining grouping
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

    // Case 3: Moving subcategory across parents or into another parent
    if (activeCat.parentId) {
      let targetParentId: string | null = null;

      if (!overCat.parentId) {
        // Dropped directly on a root category
        targetParentId = overCat.id;
      } else {
        // Dropped on another subcategory under a different parent
        targetParentId = overCat.parentId;
      }

      if (targetParentId && targetParentId !== activeCat.id) {
        const updatedCat = { ...activeCat, parentId: targetParentId };
        const updatedList = catList.map((c) =>
          c.id === activeCat.id ? updatedCat : c
        );

        // Normalize orders
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
            catList.find((c) => c.id === targetParentId)?.name || '目标分类'
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

  // Check if current category being edited has subcategories (cannot be made a subcategory)
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
      maxWidth="max-w-5xl"
      className="max-h-[90vh] flex flex-col p-0 overflow-hidden"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                二级分类管理与排序
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                支持拖拽排序 · 实时修改
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              左右双栏布局：左侧自由拖拽调整层级顺序，右侧随时即时编辑与保存
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleModalClose}
          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Dual-Pane Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-[540px] max-h-[calc(90vh-125px)] overflow-hidden">
        {/* =========================================
            LEFT COLUMN: Category Tree & Drag-and-Drop
           ========================================= */}
        <div className="md:col-span-7 flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-950/40 min-h-0 overflow-hidden">
          {/* Top Actions & Search Bar */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2 shrink-0">
            <div className="flex items-center gap-2">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索分类名称..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Add Top-level Category Button */}
              <button
                type="button"
                onClick={() => handleStartAdd(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建一级分类</span>
              </button>
            </div>

            {/* Sub-toolbar: Stats & Expand All */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400 px-0.5">
              <span className="tabular-nums">
                共 {totalRoots} 个一级分类 · {totalSubcategories} 个二级子分类
              </span>
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors flex items-center gap-1"
              >
                <FolderPlus className="w-3 h-3" />
                <span>全部展开 / 折叠</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Tree List Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-0">
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
                    {searchQuery ? '未找到符合条件的分类' : '暂无分类，请点击上方按钮新建'}
                  </div>
                ) : (
                  filteredTree.map((parent) => {
                    const isSelected = editingId === parent.id;
                    const isExpanded = expandedMap[parent.id] ?? true;

                    // Bookmarks count for this parent specifically
                    const directCount = bookmarks.filter(
                      (b) => b.categoryId === parent.id
                    ).length;

                    // Total bookmarks under parent including its children
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
                            <div className="px-3 pb-2.5 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/30 rounded-b-xl space-y-1">
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
                  <div className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-indigo-500 shadow-xl flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 opacity-95">
                    <GripVertical className="w-4 h-4 text-indigo-500" />
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

          {/* Left Column Bottom Footer Hint */}
          <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 text-[11px] text-neutral-400 flex items-center gap-1.5 shrink-0">
            <span className="font-medium text-neutral-500 dark:text-neutral-300">💡 提示：</span>
            <span>按住 ⠿ 把手可上下拖拽调序；点击任意分类即可在右侧实时修改</span>
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: Persistent Sticky Editor Panel
           ========================================= */}
        <div
          ref={editorPanelRef}
          className="md:col-span-5 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden"
        >
          {isAdding || editingId ? (
            /* ACTIVE EDITING / ADDING MODE */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Editor Header */}
              <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {isAdding ? (
                      <Plus className="w-3.5 h-3.5" />
                    ) : (
                      <Edit2 className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {isAdding
                        ? parentIdInput
                          ? '新建二级子分类'
                          : '新建一级顶级分类'
                        : '编辑分类'}
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      {isAdding
                        ? parentIdInput
                          ? `将作为「${
                              catList.find((c) => c.id === parentIdInput)?.name ||
                              ''
                            }」的二级目录`
                          : '作为全新的一级根目录'
                        : `当前编辑: ${activeEditingCategory?.name || ''}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  取消
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
                {/* Real-time Category Visual Preview Card */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                    实时显示预览
                  </label>
                  <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: colorInput }}
                      >
                        <CategoryIcon name={iconInput} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {nameInput.trim() || '分类名称预览'}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {parentIdInput
                            ? `↳ 属于「${
                                catList.find((c) => c.id === parentIdInput)
                                  ?.name || '顶级分类'
                              }」`
                            : '一级顶级分类'}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {parentIdInput ? '二级分类' : '一级分类'}
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
                      placeholder="例如: 大模型社区 / 前端开发 / 影音娱乐"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 pr-8"
                    />
                    {nameInput && (
                      <button
                        type="button"
                        onClick={() => setNameInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    支持按 Enter 键一键快速保存
                  </p>
                </div>

                {/* 2. Hierarchy Parent Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    层级归属（选择父分类）
                  </label>
                  <select
                    value={parentIdInput || ''}
                    disabled={currentCategoryHasChildren}
                    onChange={(e) =>
                      setParentIdInput(e.target.value ? e.target.value : null)
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                  {currentCategoryHasChildren ? (
                    <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>该分类下已有二级子分类，无法直接变更为子分类</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-neutral-400 mt-1">
                      切换此选项可将此分类升级为一级分类或移动至任意父分类下
                    </p>
                  )}
                </div>

                {/* 3. Theme Color */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    主题标识色彩
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColorInput(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          colorInput === c
                            ? 'scale-110 border-neutral-900 dark:border-white shadow-xs'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}

                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[11px] text-neutral-400">自定义:</span>
                      <input
                        type="color"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Icon Selector with Search & Categories */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                      选择分类图标
                    </label>
                    <span className="text-[10px] text-neutral-400">
                      已选: {iconInput}
                    </span>
                  </div>

                  {/* Icon Search & Group Filter */}
                  <div className="space-y-2 mb-2">
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="搜索图标 (例如: Code / Book / AI)..."
                      className="w-full px-2.5 py-1 text-[11px] rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden"
                    />

                    {/* Group chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                      {iconGroups.map((grp) => (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => setSelectedIconGroup(grp)}
                          className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                            selectedIconGroup === grp
                              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {grp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Grid */}
                  <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60">
                    {filteredIcons.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIconInput(item.name)}
                        className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all ${
                          iconInput === item.name
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                            : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title={`${item.label} (${item.name})`}
                      >
                        <item.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Editor Action Footer */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 flex items-center justify-between gap-3 shrink-0">
                <span className="text-[10px] text-neutral-400">
                  按 Enter 键也可直接保存
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                  >
                    取消
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveItem}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAdding ? '确认添加分类' : '保存分类修改'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* OVERVIEW / IDLE MODE */
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-5">
                {/* Visual Overview Card */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 dark:from-indigo-950/20 dark:via-neutral-900 dark:to-neutral-900">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        分类架构速览
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        清晰的两级结构，支持随意拖拽调序
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 text-xs">
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800">
                      <div className="text-[10px] text-neutral-400">一级顶级分类</div>
                      <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {totalRoots}{' '}
                        <span className="text-[10px] font-normal text-neutral-400">个</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800">
                      <div className="text-[10px] text-neutral-400">二级子分类</div>
                      <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                        {totalSubcategories}{' '}
                        <span className="text-[10px] font-normal text-neutral-400">个</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action */}
                <button
                  type="button"
                  onClick={() => handleStartAdd(null)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>新建一级顶级分类</span>
                </button>

                {/* Tips & Instructions */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>便捷操作指南</span>
                  </div>

                  <div className="space-y-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        ⠿ 拖拽调序：
                      </span>
                      在左侧按住任意分类左侧的拖动把手，即可上下直接调换顺序。
                    </div>

                    <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        ✏️ 实时编辑：
                      </span>
                      直接点击左侧任意分类，即可在此面板立即编辑其名称、图标和归属。
                    </div>

                    <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        ➕ 快速加子分类：
                      </span>
                      鼠标悬停在一级分类上，点击「加子分类」按钮即可快速在下方新建子目录。
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 text-[10px] text-neutral-400">
                点击左侧列表中的分类即可开始编辑
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Bottom Persistent Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 shrink-0">
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>所有更改与拖拽排序均已即时保存</span>
        </div>

        <button
          type="button"
          onClick={handleModalClose}
          className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-2xs"
        >
          完成
        </button>
      </div>
    </ModalWrapper>
  );
};
