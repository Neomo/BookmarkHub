import React, { useState, useMemo } from 'react';
import { Category } from '../types';
import { parseBatchInput, ParsedBatchItem } from '../utils/url';
import { buildCategoryTree } from '../utils/storage';
import { X, ListPlus, Check } from 'lucide-react';
import { useToast } from './Toast';
import { ModalWrapper } from './ModalWrapper';

interface BatchAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onBatchAdd: (items: ParsedBatchItem[], categoryId: string, commonTags: string[]) => void;
}

export const BatchAddModal: React.FC<BatchAddModalProps> = ({
  isOpen,
  onClose,
  categories,
  onBatchAdd,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [commonTagsInput, setCommonTagsInput] = useState('');
  const { showToast } = useToast();
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const parsedItems = useMemo(() => {
    return parseBatchInput(inputText);
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedItems.length === 0) {
      showToast('未检测到有效网址，请检查输入格式', 'error');
      return;
    }

    const tags = commonTagsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onBatchAdd(parsedItems, selectedCategoryId || categories[0]?.id, tags);
    showToast(`已成功批量添加 ${parsedItems.length} 个书签`, 'success');
    setInputText('');
    setCommonTagsInput('');
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      className="max-h-[90vh]"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              批量添加网址
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              批量文本（每行一条）
            </label>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-2">
              支持纯网址、Markdown 链接 <code className="font-mono text-neutral-600 dark:text-neutral-400">[标题](网址)</code>、或 <code className="font-mono text-neutral-600 dark:text-neutral-400">标题, 网址</code>
            </p>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`例如：\nhttps://github.com\n[Google AI Studio](https://aistudio.google.com)\n少数派, https://sspai.com\nhttps://tailwindcss.com Tailwind CSS`}
              className="w-full p-3 font-mono text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                统一分类
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              >
                {categoryTree.map((root) => (
                  <optgroup key={root.id} label={root.name}>
                    <option value={root.id}>{root.name} (一级目录)</option>
                    {root.children.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        &nbsp;&nbsp;↳ {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                附加通用标签（逗号或空格分隔）
              </label>
              <input
                type="text"
                value={commonTagsInput}
                onChange={(e) => setCommonTagsInput(e.target.value)}
                placeholder="例如: 常用 工具 推荐"
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Live Parsing Preview */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
              <span>解析预览</span>
              <span className="tabular-nums font-mono font-medium text-neutral-800 dark:text-neutral-200">
                已识别 {parsedItems.length} 条网址
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 bg-neutral-50 dark:bg-neutral-950/50">
              {parsedItems.length > 0 ? (
                parsedItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 truncate">
                        {item.url}
                      </div>
                    </div>
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  暂无解析结果，请在上方输入网址
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={parsedItems.length === 0}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors"
            >
              导入全部 ({parsedItems.length})
            </button>
          </div>
        </form>
    </ModalWrapper>
  );
};
