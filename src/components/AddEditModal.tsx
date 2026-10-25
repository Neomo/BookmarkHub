import React, { useState, useEffect } from 'react';
import { Bookmark, Category } from '../types';
import { fetchWebpageTitle } from '../utils/url';
import { X, Loader2, Sparkles, Pin, Star, Plus } from 'lucide-react';
import { useToast } from './Toast';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmarkData: Partial<Bookmark>) => void;
  bookmarkToEdit?: Bookmark | null;
  categories: Category[];
  availableTags: string[];
  initialCategoryId?: string;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bookmarkToEdit,
  categories,
  availableTags,
  initialCategoryId,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (bookmarkToEdit) {
      setUrl(bookmarkToEdit.url);
      setTitle(bookmarkToEdit.title);
      setCategoryId(bookmarkToEdit.categoryId);
      setTags(bookmarkToEdit.tags || []);
      setNotes(bookmarkToEdit.notes || '');
      setIsPinned(bookmarkToEdit.isPinned);
      setIsStarred(bookmarkToEdit.isStarred);
    } else {
      setUrl('');
      setTitle('');
      setCategoryId(initialCategoryId || (categories[0]?.id ?? ''));
      setTags([]);
      setNotes('');
      setIsPinned(false);
      setIsStarred(false);
    }
    setTagInput('');
  }, [bookmarkToEdit, isOpen, initialCategoryId, categories]);

  if (!isOpen) return null;

  const handleFetchTitle = async (targetUrl = url) => {
    if (!targetUrl.trim()) return;
    setIsFetchingTitle(true);
    try {
      const result = await fetchWebpageTitle(targetUrl);
      if (result.title) {
        setTitle(result.title);
        if (result.source === 'fetched') {
          showToast('已自动抓取网页标题', 'success');
        } else {
          showToast('已根据域名智能解析标题，可手动修改', 'info');
        }
      }
    } catch {
      showToast('获取标题失败，请手动输入', 'error');
    } finally {
      setIsFetchingTitle(false);
    }
  };

  const handleUrlBlur = () => {
    // If title is currently empty, automatically fetch title
    if (url.trim() && !title.trim()) {
      handleFetchTitle(url);
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = url.trim();
    if (!finalUrl) {
      showToast('请输入网址', 'error');
      return;
    }
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const finalTitle = title.trim() || finalUrl;

    onSave({
      url: finalUrl,
      title: finalTitle,
      categoryId: categoryId || categories[0]?.id || 'cat-dev',
      tags,
      notes: notes.trim(),
      isPinned,
      isStarred,
    });

    onClose();
  };

  // Tag autocomplete suggestions (filtered)
  const tagSuggestions = availableTags
    .filter((t) => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase().trim()))
    .slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {bookmarkToEdit ? '编辑网址' : '添加网址收藏'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              网址 URL <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="例如: https://github.com"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => handleFetchTitle()}
                disabled={isFetchingTitle || !url.trim()}
                title="抓取并解析网页标题"
                className="px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isFetchingTitle ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span>抓取标题</span>
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              网站标题 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入网页名称"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              归属分类
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              标签（回车添加）
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-6">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="输入标签名并按回车..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                disabled={!tagInput.trim()}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick suggestions */}
            {tagSuggestions.length > 0 && (
              <div className="mt-1.5 flex items-center flex-wrap gap-1 text-[11px] text-neutral-400">
                <span>推荐标签:</span>
                {tagSuggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddTag(t)}
                    className="hover:text-neutral-900 dark:hover:text-neutral-200 underline decoration-dotted"
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              备注说明
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="添加简要备注，便于日后搜索与查阅..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400 resize-none"
            />
          </div>

          {/* Pin & Star Switches */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                isPinned
                  ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'rotate-45 fill-current' : ''}`} />
                <span>置顶书签</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {isPinned ? '已置顶' : '未置顶'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsStarred(!isStarred)}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                isStarred
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-amber-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
                <span>星标关注</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {isStarred ? '已星标' : '未星标'}
              </span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              {bookmarkToEdit ? '保存修改' : '确认添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
