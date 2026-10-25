import React, { useState, useMemo } from 'react';
import { Category, Bookmark, CategoryCover } from '../../types';
import { CategoryIcon, AVAILABLE_ICONS } from '../CategoryIcon';
import { buildCategoryTree, CategoryTreeItem } from '../../utils/storage';
import {
  GRADIENT_PRESETS,
  SOLID_COLOR_PRESETS,
  IMAGE_PRESETS,
  getCoverStyle,
} from '../../utils/coverPresets';
import {
  Plus,
  Trash2,
  Edit2,
  FolderTree,
  FolderPlus,
  Image as ImageIcon,
  Palette,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  Search,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layers,
  HelpCircle,
  Eye,
  Eraser,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../Toast';

interface CategoryManagerProps {
  categories: Category[];
  bookmarks: Bookmark[];
  onSaveCategories: (categories: Category[], updatedBookmarks?: Bookmark[]) => void;
  globalDefaultSubView?: 'expanded' | 'collapsed';
}

// Sortable item wrapper for category row
const SortableCategoryItem: React.FC<{
  category: Category;
  bookmarkCount: number;
  subcategories: Category[];
  allBookmarks: Bookmark[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddSubcategory: (parentId: string) => void;
  onEditCover: (cat: Category) => void;
  onMoveUp: (catId: string) => void;
  onMoveDown: (catId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  onQuickToggleSubView: (cat: Category) => void;
}> = ({
  category,
  bookmarkCount,
  subcategories,
  allBookmarks,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditCover,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onQuickToggleSubView,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const [expanded, setExpanded] = useState(true);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const coverStyle = getCoverStyle(category.cover);
  const hasCover = Boolean(category.cover?.value);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border transition-all ${
        isDragging
          ? 'opacity-50 ring-2 ring-neutral-400 dark:ring-neutral-600 bg-white dark:bg-neutral-900 shadow-xl'
          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
      }`}
    >
      {/* Category Row Container */}
      <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Drag Handle, Icon, Name, Cover Preview Badge */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-neutral-300 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-300 rounded"
            title="拖拽排序"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Icon with Color */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: category.color || '#6366f1' }}
          >
            <CategoryIcon name={category.icon} className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                {category.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                {bookmarkCount} 个网址
              </span>
              {subcategories.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  {subcategories.length} 个二级分类
                </span>
              )}
            </div>

            {/* Sub-view override badge */}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
              <span>二级专区:</span>
              <button
                type="button"
                onClick={() => onQuickToggleSubView(category)}
                className="hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-dotted font-medium"
                title="点击切换此分类的二级目录展开/折叠行为"
              >
                {category.subViewOverride === 'collapsed'
                  ? '默认折叠'
                  : category.subViewOverride === 'expanded'
                  ? '默认展开'
                  : '跟随全局默认'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cover Preview & Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {/* Cover preview mini pill */}
          <button
            type="button"
            onClick={() => onEditCover(category)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              hasCover
                ? 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                : 'border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-neutral-400'
            }`}
            title="配置分类 Cover（纯色 / 渐变 / 图片）"
          >
            {hasCover ? (
              <>
                <div
                  className="w-4 h-4 rounded-sm border border-black/10 shrink-0"
                  style={coverStyle}
                />
                <span>已设Cover</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5" />
                <span>+ 设置Cover</span>
              </>
            )}
          </button>

          {/* Add Subcategory */}
          <button
            type="button"
            onClick={() => onAddSubcategory(category.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors"
            title="为此一级分类添加二级子分类"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">加二级</span>
          </button>

          {/* Manual Up/Down Buttons */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMoveUp(category.id)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="上移"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMoveDown(category.id)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="下移"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="编辑分类属性"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            title="删除分类"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subcategories accordion */}
      {subcategories.length > 0 && (
        <div className="px-3.5 pb-3 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 rounded-b-xl">
          <div className="flex items-center justify-between py-1 mb-1">
            <span className="text-[11px] font-medium text-neutral-400">
              二级子目录 ({subcategories.length}):
            </span>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-0.5"
            >
              <span>{expanded ? '收起' : '展开'}</span>
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>

          {expanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {subcategories.map((sub) => {
                const subBmCount = allBookmarks.filter((b) => b.categoryId === sub.id).length;
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 shrink-0" />
                      <CategoryIcon name={sub.icon} className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                        {sub.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({subBmCount})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEdit(sub)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                        title="编辑二级分类"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(sub)}
                        className="p-1 text-neutral-400 hover:text-rose-500 rounded"
                        title="删除二级分类"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  bookmarks,
  onSaveCategories,
  globalDefaultSubView = 'expanded',
}) => {
  const { showToast } = useToast();

  // Dialog states
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);

  // Form input states
  const [nameInput, setNameInput] = useState('');
  const [iconInput, setIconInput] = useState('Folder');
  const [colorInput, setColorInput] = useState('#6366f1');
  const [parentIdInput, setParentIdInput] = useState<string | null>(null);
  const [subViewOverrideInput, setSubViewOverrideInput] = useState<
    'default' | 'expanded' | 'collapsed'
  >('default');

  // Cover editor modal state
  const [coverEditingCat, setCoverEditingCat] = useState<Category | null>(null);
  const [coverType, setCoverType] = useState<'solid' | 'gradient' | 'image'>('gradient');
  const [coverValue, setCoverValue] = useState('');
  const [coverTextColor, setCoverTextColor] = useState<'light' | 'dark'>('light');

  // Icon search & group filter inside modal
  const [iconSearch, setIconSearch] = useState('');
  const [selectedIconGroup, setSelectedIconGroup] = useState<string>('全部');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Root level categories in order
  const rootCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [categories]);

  // Available icon groups
  const iconGroups = useMemo(() => {
    const groups = new Set(AVAILABLE_ICONS.map((i) => i.group));
    return ['全部', ...Array.from(groups)];
  }, []);

  const filteredIcons = useMemo(() => {
    return AVAILABLE_ICONS.filter((item) => {
      const matchGroup = selectedIconGroup === '全部' || item.group === selectedIconGroup;
      const matchSearch =
        !iconSearch.trim() ||
        item.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
        item.label.toLowerCase().includes(iconSearch.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [selectedIconGroup, iconSearch]);

  // Drag reorder handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rootCategories.findIndex((c) => c.id === active.id);
    const newIndex = rootCategories.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedRoots = arrayMove(rootCategories, oldIndex, newIndex);
      // Reassign order
      const updatedRoots = reorderedRoots.map((cat, idx) => ({
        ...cat,
        order: idx + 1,
      }));

      // Combine with subcategories
      const subcategories = categories.filter((c) => c.parentId);
      const allUpdated = [...updatedRoots, ...subcategories];
      onSaveCategories(allUpdated);
      showToast('分类排序已更新', 'success');
    }
  };

  // Move root category up/down
  const handleMove = (catId: string, direction: 'up' | 'down') => {
    const index = rootCategories.findIndex((c) => c.id === catId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rootCategories.length) return;

    const reorderedRoots = arrayMove(rootCategories, index, targetIndex);
    const updatedRoots = reorderedRoots.map((cat, idx) => ({
      ...cat,
      order: idx + 1,
    }));
    const subcategories = categories.filter((c) => c.parentId);
    onSaveCategories([...updatedRoots, ...subcategories]);
  };

  // Open add modal
  const handleStartAdd = (parentId: string | null = null) => {
    setIsAdding(true);
    setEditingCat(null);
    setAddingParentId(parentId);
    setNameInput('');
    setIconInput(parentId ? 'Folder' : 'FolderTree');
    setParentIdInput(parentId);
    setSubViewOverrideInput('default');

    if (parentId) {
      const parent = categories.find((c) => c.id === parentId);
      setColorInput(parent?.color || '#6366f1');
    } else {
      setColorInput('#6366f1');
    }
  };

  // Open edit modal
  const handleStartEdit = (cat: Category) => {
    setEditingCat(cat);
    setIsAdding(false);
    setNameInput(cat.name);
    setIconInput(cat.icon);
    setColorInput(cat.color || '#6366f1');
    setParentIdInput(cat.parentId || null);
    setSubViewOverrideInput(cat.subViewOverride || 'default');
  };

  // Quick toggle subview override
  const handleQuickToggleSubView = (cat: Category) => {
    const next: 'default' | 'expanded' | 'collapsed' =
      cat.subViewOverride === 'default' || !cat.subViewOverride
        ? 'collapsed'
        : cat.subViewOverride === 'collapsed'
        ? 'expanded'
        : 'default';

    const updated = categories.map((c) => (c.id === cat.id ? { ...c, subViewOverride: next } : c));
    onSaveCategories(updated);
    showToast(
      `已设为: ${next === 'collapsed' ? '默认折叠' : next === 'expanded' ? '默认展开' : '跟随全局'}`,
      'info'
    );
  };

  // Save add/edit
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showToast('请输入分类名称', 'error');
      return;
    }

    if (isAdding) {
      const newCat: Category = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: trimmed,
        icon: iconInput,
        color: colorInput,
        parentId: parentIdInput || null,
        order: categories.length + 1,
        subViewOverride: subViewOverrideInput,
      };
      onSaveCategories([...categories, newCat]);
      showToast(parentIdInput ? '已添加二级子分类' : '已添加一级分类', 'success');
      setIsAdding(false);
    } else if (editingCat) {
      // Avoid circular parent
      const effectiveParentId = parentIdInput === editingCat.id ? null : parentIdInput;

      const updated = categories.map((c) =>
        c.id === editingCat.id
          ? {
              ...c,
              name: trimmed,
              icon: iconInput,
              color: colorInput,
              parentId: effectiveParentId || null,
              subViewOverride: subViewOverrideInput,
            }
          : c
      );
      onSaveCategories(updated);
      showToast('分类修改已保存', 'success');
      setEditingCat(null);
    }
  };

  // Delete category
  const handleDeleteCategory = (cat: Category) => {
    const childCats = categories.filter((c) => c.parentId === cat.id);
    const affectedCatIds = [cat.id, ...childCats.map((c) => c.id)];
    const affectedBookmarks = bookmarks.filter((b) => affectedCatIds.includes(b.categoryId));

    let confirmMsg = `确定删除分类「${cat.name}」吗？`;
    if (childCats.length > 0) {
      confirmMsg += ` 该分类下包含 ${childCats.length} 个二级子分类也将一并删除。`;
    }
    if (affectedBookmarks.length > 0) {
      confirmMsg += ` 关联的 ${affectedBookmarks.length} 个书签将转为未分类。`;
    }

    if (window.confirm(confirmMsg)) {
      const remainingCats = categories.filter((c) => !affectedCatIds.includes(c.id));
      const updatedBookmarks = bookmarks.map((b) => {
        if (affectedCatIds.includes(b.categoryId)) {
          return { ...b, categoryId: remainingCats[0]?.id || 'cat-dev' };
        }
        return b;
      });

      onSaveCategories(remainingCats, updatedBookmarks);
      showToast('分类已成功删除', 'success');
    }
  };

  // Clean empty categories (categories with 0 bookmarks)
  const handleCleanEmptyCategories = () => {
    const usedCatIds = new Set(bookmarks.map((b) => b.categoryId));
    // Also include parent categories of used categories
    for (const cat of categories) {
      if (usedCatIds.has(cat.id) && cat.parentId) {
        usedCatIds.add(cat.parentId);
      }
    }

    const emptyCats = categories.filter((c) => !usedCatIds.has(c.id));
    if (emptyCats.length === 0) {
      showToast('当前没有空的无书签分类', 'info');
      return;
    }

    if (
      window.confirm(
        `检测到 ${emptyCats.length} 个未包含任何书签的空分类（${emptyCats
          .map((c) => c.name)
          .slice(0, 5)
          .join(', ')}${emptyCats.length > 5 ? '等' : ''}），确定一键清理吗？`
      )
    ) {
      const remaining = categories.filter((c) => usedCatIds.has(c.id));
      onSaveCategories(remaining);
      showToast(`已清理 ${emptyCats.length} 个空分类`, 'success');
    }
  };

  // Open Cover Editor
  const handleOpenCoverEditor = (cat: Category) => {
    setCoverEditingCat(cat);
    if (cat.cover) {
      setCoverType(cat.cover.type);
      setCoverValue(cat.cover.value);
      setCoverTextColor(cat.cover.textColor || 'light');
    } else {
      setCoverType('gradient');
      setCoverValue(GRADIENT_PRESETS[0].css);
      setCoverTextColor('light');
    }
  };

  // Save Cover
  const handleSaveCover = () => {
    if (!coverEditingCat) return;

    let updatedCover: CategoryCover | undefined = undefined;
    if (coverValue.trim()) {
      updatedCover = {
        type: coverType,
        value: coverValue.trim(),
        textColor: coverTextColor,
      };
    }

    const updated = categories.map((c) =>
      c.id === coverEditingCat.id ? { ...c, cover: updatedCover } : c
    );
    onSaveCategories(updated);
    showToast(updatedCover ? '分类 Cover 已设置' : '分类 Cover 已清除', 'success');
    setCoverEditingCat(null);
  };

  return (
    <div className="space-y-6">
      {/* Module Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <span>分类体系与 Cover 视觉配置</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            拖拽手柄排序，为一级分类配置纯色/渐变/图片 Cover 装饰背景，设置二级目录展示模式
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCleanEmptyCategories}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
            title="一键移除无任何书签的冗余分类"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>清理空分类</span>
          </button>

          <button
            type="button"
            onClick={() => handleStartAdd(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>新建一级分类</span>
          </button>
        </div>
      </div>

      {/* Categories Reorderable List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={rootCategories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {rootCategories.map((root, idx) => {
              const subcategories = categories
                .filter((c) => c.parentId === root.id)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

              const childIds = new Set(subcategories.map((c) => c.id));
              const totalBmCount = bookmarks.filter(
                (b) => b.categoryId === root.id || childIds.has(b.categoryId)
              ).length;

              return (
                <SortableCategoryItem
                  key={root.id}
                  category={root}
                  bookmarkCount={totalBmCount}
                  subcategories={subcategories}
                  allBookmarks={bookmarks}
                  onEdit={handleStartEdit}
                  onDelete={handleDeleteCategory}
                  onAddSubcategory={handleStartAdd}
                  onEditCover={handleOpenCoverEditor}
                  onMoveUp={(id) => handleMove(id, 'up')}
                  onMoveDown={(id) => handleMove(id, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === rootCategories.length - 1}
                  onQuickToggleSubView={handleQuickToggleSubView}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* ======================================================== */}
      {/* 1. Modal: Add / Edit Category Dialog                     */}
      {/* ======================================================== */}
      {(isAdding || editingCat) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-neutral-500" />
                <span>
                  {isAdding
                    ? addingParentId
                      ? '添加二级子分类'
                      : '新建一级主分类'
                    : `编辑分类: ${editingCat?.name}`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingCat(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveCategory} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  分类名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="如：人工智能、前端工程、设计灵感..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              {/* Parent Category Hierarchy Select */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  所属层级
                </label>
                <select
                  value={parentIdInput || ''}
                  onChange={(e) => setParentIdInput(e.target.value ? e.target.value : null)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">顶级目录 (一级主分类)</option>
                  {rootCategories
                    .filter((r) => r.id !== editingCat?.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        ↳ 作为二级分类，隶属于: {r.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Sub-view override setting */}
              {!parentIdInput && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    二级目录专区默认显示
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'default', label: '跟随全局默认' },
                      { id: 'expanded', label: '默认展开' },
                      { id: 'collapsed', label: '默认折叠' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setSubViewOverrideInput(opt.id as 'default' | 'expanded' | 'collapsed')
                        }
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          subViewOverrideInput === opt.id
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Picker Swatches */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  代表主题色
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {SOLID_COLOR_PRESETS.map((p) => {
                    const isSelected = colorInput === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setColorInput(p.value)}
                        style={{ backgroundColor: p.value }}
                        title={p.name}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 dark:ring-offset-neutral-900 scale-110 shadow-xs'
                            : 'opacity-80 hover:opacity-100 hover:scale-105'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                      </button>
                    );
                  })}
                  <input
                    type="color"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    className="w-7 h-7 rounded-full border border-neutral-300 dark:border-neutral-700 cursor-pointer overflow-hidden"
                    title="自定义拾色器"
                  />
                </div>
              </div>

              {/* Icon Selector with 50+ icons & search */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    选择图标 ({filteredIcons.length})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-400">当前图标:</span>
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-white"
                      style={{ backgroundColor: colorInput }}
                    >
                      <CategoryIcon name={iconInput} className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Filter & search bar */}
                <div className="space-y-2 mb-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="搜索图标名称 (如: AI, Code, Image, Music)..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  {/* Group buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                    {iconGroups.map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setSelectedIconGroup(grp)}
                        className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                          selectedIconGroup === grp
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                      >
                        {grp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 border border-neutral-200 dark:border-neutral-800 rounded-xl max-h-44 overflow-y-auto bg-neutral-50/50 dark:bg-neutral-950/40">
                  {filteredIcons.map((item) => {
                    const isSelected = iconInput === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIconInput(item.name)}
                        title={`${item.label} (${item.name})`}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs scale-105'
                            : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        <CategoryIcon name={item.name} className="w-4 h-4 shrink-0" />
                        <span className="text-[9px] truncate w-full text-center">
                          {item.label.split('/')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingCat(null);
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-xs"
                >
                  {isAdding ? '确认添加' : '保存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Modal: Category Cover Studio                          */}
      {/* ======================================================== */}
      {coverEditingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  设置分类 Cover · 「{coverEditingCat.name}」
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCoverEditingCat(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Live Preview Card */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>实时渲染预览效果（浅色/深色模式自适应）</span>
                </label>
                <div
                  className="w-full h-28 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm transition-all"
                  style={getCoverStyle({
                    type: coverType,
                    value: coverValue || '#6366f1',
                    textColor: coverTextColor,
                  })}
                >
                  <div className="absolute inset-0 bg-black/15 pointer-events-none" />

                  {/* Top row */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                        <CategoryIcon name={coverEditingCat.icon} className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm tracking-wide text-white drop-shadow-sm">
                        {coverEditingCat.name}
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs text-white/90">
                      Cover 效果预览
                    </span>
                  </div>

                  {/* Bottom description */}
                  <div className="relative z-10 text-white/80 text-xs">
                    在分组视图主标题与侧边栏 Hover 展开时呈现该质感背景
                  </div>
                </div>
              </div>

              {/* Cover Type Switcher */}
              <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCoverType('gradient');
                    if (!coverValue.includes('gradient')) {
                      setCoverValue(GRADIENT_PRESETS[0].css);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    coverType === 'gradient'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>高级渐变色</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCoverType('solid');
                    if (coverValue.includes('gradient') || coverValue.startsWith('http')) {
                      setCoverValue(SOLID_COLOR_PRESETS[0].value);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    coverType === 'solid'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>纯色色彩</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCoverType('image');
                    if (!coverValue.startsWith('http')) {
                      setCoverValue(IMAGE_PRESETS[0].url);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    coverType === 'image'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>高清在线图片</span>
                </button>
              </div>

              {/* 1. Gradient Presets Grid */}
              {coverType === 'gradient' && (
                <div className="space-y-3">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    精选高辨识度预设渐变（浅/深色均具绝佳对比度）:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {GRADIENT_PRESETS.map((p) => {
                      const isSelected = coverValue === p.css;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setCoverValue(p.css);
                            setCoverTextColor(p.textColor);
                          }}
                          className={`h-16 rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden transition-all text-left ${
                            isSelected
                              ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 scale-[1.02] shadow-md'
                              : 'hover:scale-[1.01] opacity-90 hover:opacity-100'
                          }`}
                          style={{ background: p.css }}
                        >
                          <div className="flex items-center justify-between text-white drop-shadow-xs">
                            <span className="text-xs font-bold">{p.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-[10px] text-white/80">{p.category}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      或输入自定义 CSS Gradient 代码:
                    </label>
                    <input
                      type="text"
                      value={coverValue}
                      onChange={(e) => setCoverValue(e.target.value)}
                      placeholder="如: linear-gradient(135deg, #6366f1, #0ea5e9)..."
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                    />
                  </div>
                </div>
              )}

              {/* 2. Solid Color Presets Grid */}
              {coverType === 'solid' && (
                <div className="space-y-3">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    精选纯色风格:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {SOLID_COLOR_PRESETS.map((p) => {
                      const isSelected = coverValue === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setCoverValue(p.value)}
                          className={`h-12 rounded-xl px-3 flex items-center justify-between transition-all ${
                            isSelected
                              ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 scale-105 shadow-md'
                              : 'hover:scale-102 opacity-90 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: p.value }}
                        >
                          <span className="text-xs font-bold text-white drop-shadow-xs">
                            {p.name}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-neutral-400">自定义 HEX 颜色:</span>
                    <input
                      type="color"
                      value={coverValue.startsWith('#') ? coverValue : '#6366f1'}
                      onChange={(e) => setCoverValue(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={coverValue}
                      onChange={(e) => setCoverValue(e.target.value)}
                      className="px-3 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 w-28"
                    />
                  </div>
                </div>
              )}

              {/* 3. Image Presets & Custom URL */}
              {coverType === 'image' && (
                <div className="space-y-3">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    精选高清纹理图库:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {IMAGE_PRESETS.map((p) => {
                      const isSelected = coverValue === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setCoverValue(p.url);
                            setCoverTextColor(p.textColor);
                          }}
                          className={`h-20 rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden transition-all text-left bg-cover bg-center ${
                            isSelected
                              ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 scale-[1.02] shadow-md'
                              : 'hover:scale-[1.01] opacity-90 hover:opacity-100'
                          }`}
                          style={{ backgroundImage: `url(${p.url})` }}
                        >
                          <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                          <div className="relative z-10 flex items-center justify-between text-white drop-shadow-xs">
                            <span className="text-xs font-bold">{p.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="relative z-10 text-[10px] text-white/90">
                            {p.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      或输入在线图片 URL:
                    </label>
                    <input
                      type="url"
                      value={coverValue}
                      onChange={(e) => setCoverValue(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setCoverValue('');
                  handleSaveCover();
                }}
                className="text-xs text-rose-500 hover:text-rose-600 transition-colors"
              >
                清除 Cover 装饰
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCoverEditingCat(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveCover}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-xs"
                >
                  应用 Cover 样式
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
