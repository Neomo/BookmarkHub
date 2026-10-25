import React, { useState } from 'react';
import { Category, Bookmark } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Edit2, Check } from 'lucide-react';
import { useToast } from './Toast';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  bookmarks: Bookmark[];
  onSaveCategories: (categories: Category[], updatedBookmarks?: Bookmark[]) => void;
}

const PRESET_COLORS = [
  '#4f46e5', // Indigo
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
  const [colorInput, setColorInput] = useState('#4f46e5');
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNameInput(cat.name);
    setIconInput(cat.icon);
    setColorInput(cat.color || '#4f46e5');
    setIsAdding(false);
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setNameInput('');
    setIconInput('Folder');
    setColorInput(PRESET_COLORS[catList.length % PRESET_COLORS.length]);
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
        order: catList.length + 1,
      };
      const updated = [...catList, newCat];
      setCatList(updated);
      onSaveCategories(updated);
      setIsAdding(false);
      showToast('分类已添加', 'success');
    } else if (editingId) {
      const updated = catList.map((c) =>
        c.id === editingId
          ? { ...c, name: trimmed, icon: iconInput, color: colorInput }
          : c
      );
      setCatList(updated);
      onSaveCategories(updated);
      setEditingId(null);
      showToast('分类已更新', 'success');
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= catList.length) return;

    const listCopy = [...catList];
    const [moved] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, moved);

    const reordered = listCopy.map((cat, idx) => ({ ...cat, order: idx + 1 }));
    setCatList(reordered);
    onSaveCategories(reordered);
  };

  const handleDelete = (id: string) => {
    if (catList.length <= 1) {
      showToast('至少需要保留一个分类', 'error');
      return;
    }

    const linkedBookmarks = bookmarks.filter((b) => b.categoryId === id);
    const remainingCategories = catList.filter((c) => c.id !== id);
    const fallbackCategory = remainingCategories[0];

    let updatedBookmarks: Bookmark[] | undefined = undefined;
    if (linkedBookmarks.length > 0) {
      // Reassign bookmarks to fallback category
      updatedBookmarks = bookmarks.map((b) =>
        b.categoryId === id ? { ...b, categoryId: fallbackCategory.id } : b
      );
      showToast(`已删除分类，该分类下的 ${linkedBookmarks.length} 个书签已迁移至「${fallbackCategory.name}」`, 'info');
    } else {
      showToast('分类已删除', 'success');
    }

    setCatList(remainingCategories);
    onSaveCategories(remainingCategories, updatedBookmarks);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            分类管理与排序
          </h2>
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
                  {isAdding ? '新建分类' : '修改分类'}
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

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  分类名称
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="例如: 影音娱乐"
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
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  主题色彩
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveItem}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存</span>
                </button>
              </div>
            </div>
          )}

          {/* Action to trigger add */}
          {!isAdding && !editingId && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加新分类</span>
            </button>
          )}

          {/* Category List with Reorder Controls */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            {catList.map((cat, index) => {
              const count = bookmarks.filter((b) => b.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color || '#4f46e5' }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 tabular-nums">
                      ({count} 项)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      title="上移"
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 rounded"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === catList.length - 1}
                      title="下移"
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 rounded"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      title="编辑"
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      title="删除"
                      className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
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
