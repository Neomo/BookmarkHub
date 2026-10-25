import React, { useState } from 'react';
import { Category, Bookmark } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { buildCategoryTree, CategoryTreeItem } from '../utils/storage';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  FolderTree,
  CornerDownRight,
  FolderPlus,
} from 'lucide-react';
import { useToast } from './Toast';

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
  '#64748b', // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  bookmarks,
  onSaveCategories,
}) => {
  const [catList, setCatList] = useState<Category[]>(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [iconInput, setIconInput] = useState('Folder');
  const [colorInput, setColorInput] = useState('#6366f1');
  const [parentIdInput, setParentIdInput] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  // Root level categories (candidates to be parents)
  const rootCategories = catList.filter((c) => !c.parentId);

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNameInput(cat.name);
    setIconInput(cat.icon);
    setColorInput(cat.color || '#6366f1');
    setParentIdInput(cat.parentId || null);
    setIsAdding(false);
  };

  const handleStartAdd = (prefillParentId: string | null = null) => {
    setIsAdding(true);
    setEditingId(null);
    setNameInput('');
    setIconInput(prefillParentId ? 'Folder' : 'FolderTree');
    setParentIdInput(prefillParentId);

    if (prefillParentId) {
      const parent = catList.find((c) => c.id === prefillParentId);
      setColorInput(parent?.color || PRESET_COLORS[0]);
    } else {
      setColorInput(PRESET_COLORS[catList.length % PRESET_COLORS.length]);
    }
  };

  const handleSaveItem = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showToast('分类名称不能为空', 'error');
      return;
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
      showToast(parentIdInput ? '已添加二级子分类' : '已添加一级分类', 'success');
    } else if (editingId) {
      // Prevent setting oneself as own parent
      const effectiveParentId = parentIdInput === editingId ? null : (parentIdInput || null);

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
      setEditingId(null);
      showToast('分类已更新', 'success');
    }
  };

  // Move root categories
  const handleMoveRoot = (index: number, direction: 'up' | 'down') => {
    const roots = catList.filter((c) => !c.parentId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= roots.length) return;

    const [moved] = roots.splice(index, 1);
    roots.splice(targetIndex, 0, moved);

    // Reconstruct list keeping children grouped with their parents
    const reordered: Category[] = [];
    roots.forEach((root, rootIdx) => {
      reordered.push({ ...root, order: reordered.length + 1 });
      const children = catList.filter((c) => c.parentId === root.id);
      children.forEach((child) => {
        reordered.push({ ...child, order: reordered.length + 1 });
      });
    });

    setCatList(reordered);
    onSaveCategories(reordered);
  };

  // Move subcategories within same parent
  const handleMoveSubcategory = (parentId: string, childIndex: number, direction: 'up' | 'down') => {
    const children = catList.filter((c) => c.parentId === parentId);
    const targetIndex = direction === 'up' ? childIndex - 1 : childIndex + 1;
    if (targetIndex < 0 || targetIndex >= children.length) return;

    const [moved] = children.splice(childIndex, 1);
    children.splice(targetIndex, 0, moved);

    // Update orders
    const childIdSet = new Set(children.map((c) => c.id));
    const nonChildren = catList.filter((c) => !childIdSet.has(c.id));
    const updated = [...nonChildren, ...children].map((c, idx) => ({ ...c, order: idx + 1 }));

    setCatList(updated);
    onSaveCategories(updated);
  };

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

    const linkedBookmarks = bookmarks.filter((b) => allAffectedIds.includes(b.categoryId));
    const remainingCategories = catList.filter((c) => !allAffectedIds.includes(c.id));

    if (remainingCategories.length === 0) {
      showToast('无法删除全部根分类，请至少保留一个可用分类', 'error');
      return;
    }

    const fallbackCategory = remainingCategories[0];
    let updatedBookmarks: Bookmark[] | undefined = undefined;

    if (linkedBookmarks.length > 0) {
      updatedBookmarks = bookmarks.map((b) =>
        allAffectedIds.includes(b.categoryId) ? { ...b, categoryId: fallbackCategory.id } : b
      );
      showToast(
        `已删除分类，相关的 ${linkedBookmarks.length} 个书签已迁移至「${fallbackCategory.name}」`,
        'info'
      );
    } else {
      showToast('分类已删除', 'success');
    }

    setCatList(remainingCategories);
    onSaveCategories(remainingCategories, updatedBookmarks);
  };

  const categoryTree = buildCategoryTree(catList);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              二级分类管理与排序
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List & Edit Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Active Add/Edit Form Box */}
          {(isAdding || editingId) && (
            <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {isAdding
                    ? parentIdInput
                      ? '新建二级子分类'
                      : '新建一级顶级分类'
                    : '编辑分类'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  取消
                </button>
              </div>

              {/* Hierarchy Parent Selection */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  层级结构（归属父分类）
                </label>
                <select
                  value={parentIdInput || ''}
                  onChange={(e) => setParentIdInput(e.target.value ? e.target.value : null)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
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
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  分类名称
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="例如: 前端与样式 / 影音娱乐"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  选择图标
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5">
                  {AVAILABLE_ICONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIconInput(item.name)}
                      className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                        iconInput === item.name
                          ? 'border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 ring-1 ring-neutral-900 dark:ring-neutral-100'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      title={item.label}
                    >
                      <item.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              {!parentIdInput && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    分类主题色彩
                  </label>
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColorInput(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          colorInput === c ? 'scale-110 border-neutral-900 dark:border-white shadow-xs' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveItem}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存分类</span>
                </button>
              </div>
            </div>
          )}

          {/* Action to trigger add top-level */}
          {!isAdding && !editingId && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartAdd(null)}
                className="flex-1 py-2 px-3 text-xs font-medium rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建一级顶级分类</span>
              </button>
            </div>
          )}

          {/* 2-Level Category Tree List */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
            {categoryTree.map((parent, rootIdx) => {
              const rootCount = bookmarks.filter((b) => b.categoryId === parent.id).length;

              return (
                <div key={parent.id} className="bg-white dark:bg-neutral-900">
                  {/* 1st Level Category Row */}
                  <div className="p-3 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900 hover:bg-neutral-100/60 dark:hover:bg-neutral-850 transition-colors text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: parent.color || '#6366f1' }}
                      >
                        <CategoryIcon name={parent.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {parent.name}
                      </span>
                      <span className="text-[11px] text-neutral-400 tabular-nums">
                        ({parent.children.length} 个子分类 · {rootCount} 项)
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Add subcategory button */}
                      <button
                        type="button"
                        onClick={() => handleStartAdd(parent.id)}
                        title="添加二级子分类"
                        className="px-2 py-1 text-[11px] rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3 h-3 text-neutral-400" />
                        <span>加子分类</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveRoot(rootIdx, 'up')}
                        disabled={rootIdx === 0}
                        title="上移"
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 rounded"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveRoot(rootIdx, 'down')}
                        disabled={rootIdx === categoryTree.length - 1}
                        title="下移"
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 rounded"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(parent)}
                        title="编辑"
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(parent.id)}
                        title="删除分类及其子分类"
                        className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2nd Level Subcategories List */}
                  {parent.children.length > 0 && (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 pl-8 bg-white dark:bg-neutral-950/40">
                      {parent.children.map((child, childIdx) => {
                        const childCount = bookmarks.filter((b) => b.categoryId === child.id).length;

                        return (
                          <div
                            key={child.id}
                            className="p-2.5 pr-3 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 shrink-0" />
                              <CategoryIcon name={child.icon} className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="text-neutral-700 dark:text-neutral-300 truncate">
                                {child.name}
                              </span>
                              <span className="text-[11px] text-neutral-400 tabular-nums">
                                ({childCount} 项)
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveSubcategory(parent.id, childIdx, 'up')}
                                disabled={childIdx === 0}
                                title="上移"
                                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 rounded"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSubcategory(parent.id, childIdx, 'down')}
                                disabled={childIdx === parent.children.length - 1}
                                title="下移"
                                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 rounded"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(child)}
                                title="编辑"
                                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(child.id)}
                                title="删除子分类"
                                className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
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
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[11px] text-neutral-400">
            支持一级分类与二级子分类自由建立与关联
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
