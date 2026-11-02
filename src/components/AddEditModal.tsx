import React, { useState, useEffect, useMemo } from 'react';
import { Bookmark, Category } from '../types';
import { fetchWebpageTitle, fetchWebpageOgData } from '../utils/url';
import { buildCategoryTree, loadSystemSettings } from '../utils/storage';
import { BOOKMARK_PALETTE } from '../utils/color';
import {
  X,
  Loader2,
  Sparkles,
  Pin,
  Star,
  Plus,
  Check,
  Palette,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import { useToast } from './Toast';
import { ModalWrapper } from './ModalWrapper';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmarkData: Partial<Bookmark>) => void;
  bookmarkToEdit?: Bookmark | null;
  categories: Category[];
  availableTags: string[];
  initialCategoryId?: string;
  showCardOgImage?: boolean;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bookmarkToEdit,
  categories,
  availableTags,
  initialCategoryId,
  showCardOgImage,
}) => {
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [coverImage, setCoverImage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [isFetchingOg, setIsFetchingOg] = useState(false);

  // Close confirmation overlay state (when user clicks backdrop outside)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Mobile segmented control tab: 'basic' (基础信息) | 'extra' (补充信息)
  const [mobileTab, setMobileTab] = useState<'basic' | 'extra'>('basic');

  // Check if system settings showCardOgImage is globally enabled
  const isGlobalOgEnabled = useMemo(() => {
    if (showCardOgImage !== undefined) return showCardOgImage;
    return loadSystemSettings().showCardOgImage ?? true;
  }, [showCardOgImage, isOpen]);

  // Section collapsible state for cover / OpenGraph
  const [isCoverSectionExpanded, setIsCoverSectionExpanded] = useState<boolean>(true);

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setShowCloseConfirm(false);
      setMobileTab('basic');

      if (bookmarkToEdit) {
        setUrl(bookmarkToEdit.url);
        setTitle(bookmarkToEdit.title);
        setCategoryId(bookmarkToEdit.categoryId);
        setTags(bookmarkToEdit.tags || []);
        setNotes(bookmarkToEdit.notes || '');
        setIsPinned(bookmarkToEdit.isPinned);
        setIsStarred(bookmarkToEdit.isStarred);
        setColor(bookmarkToEdit.color);
        const existingCover = bookmarkToEdit.coverImage || bookmarkToEdit.ogImage || '';
        setCoverImage(existingCover);
        // If system OG is off, only expand if the bookmark already has a cover image
        setIsCoverSectionExpanded(isGlobalOgEnabled ? true : Boolean(existingCover));
      } else {
        setUrl('');
        setTitle('');
        setCategoryId(initialCategoryId || (categories[0]?.id ?? ''));
        setTags([]);
        setNotes('');
        setIsPinned(false);
        setIsStarred(false);
        setColor(undefined);
        setCoverImage('');
        // If system OG is off, collapse by default; if on, expand by default
        setIsCoverSectionExpanded(isGlobalOgEnabled);
      }
      setTagInput('');
    }
  }, [bookmarkToEdit, isOpen, initialCategoryId, categories, isGlobalOgEnabled]);

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

  const handleFetchOgData = async (targetUrl = url) => {
    if (!targetUrl.trim()) return;
    setIsFetchingOg(true);
    try {
      const data = await fetchWebpageOgData(targetUrl);
      if (data.title && !title) {
        setTitle(data.title);
      }
      if (data.ogImage) {
        setCoverImage(data.ogImage);
        setIsCoverSectionExpanded(true);
        showToast('已提取 OpenGraph 封面图片', 'success');
      } else {
        showToast('未检测到 OpenGraph 封面元数据，可手动输入图片 URL', 'info');
      }
      if (data.description && !notes) {
        setNotes(data.description);
      }
    } catch {
      showToast('获取 OpenGraph 元数据失败', 'error');
    } finally {
      setIsFetchingOg(false);
    }
  };

  const handleUrlBlur = () => {
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
      setMobileTab('basic');
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
      color: color || undefined,
      coverImage: coverImage.trim() || undefined,
      ogImage: coverImage.trim() || undefined,
    });

    onClose();
  };

  // Tag autocomplete suggestions (filtered)
  const tagSuggestions = availableTags
    .filter((t) => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase().trim()))
    .slice(0, 6);

  // Check if supplementary info has any active custom value
  const hasExtraConfigured = Boolean(coverImage.trim() || color || isPinned || isStarred);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      onBackdropClick={() => setShowCloseConfirm(true)}
      maxWidth="max-w-3xl lg:max-w-4xl"
      className="max-h-[90vh] flex flex-col p-0 overflow-hidden relative shadow-2xl"
    >
      {/* 1. Modal Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {bookmarkToEdit ? '编辑网址收藏' : '添加网址收藏'}
            </h2>
            <p className="text-[11px] text-neutral-400">
              录入网址并自定义归属分类、标签、封面与视觉属性
            </p>
          </div>
        </div>

        {/* Direct Close Button: Only clicking this X button closes immediately */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="直接关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Mobile Segmented Control Tab Switcher (Visible on narrow/phone screens < md) */}
      <div className="md:hidden flex items-center px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-850 gap-1.5 shrink-0 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab('basic')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'basic'
              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>基础信息</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('extra')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'extra'
              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>补充信息</span>
          {hasExtraConfigured && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          )}
        </button>
      </div>

      {/* 3. Form Body - Dual Column on Wide Screen / Segmented on Mobile */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ========================================================
              COLUMN 1: 基础信息 (网址、标题、分类、标签、备注)
             ======================================================== */}
          <div
            className={`space-y-3.5 ${
              mobileTab === 'basic' ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Group Label on Desktop */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 pb-1 border-b border-neutral-100 dark:border-neutral-800">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>基础信息</span>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                网址 URL <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  placeholder="https://example.com"
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => handleFetchTitle()}
                  disabled={isFetchingTitle || !url.trim()}
                  title="抓取并解析网页标题"
                  className="px-2.5 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
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
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                网站标题 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入网页名称"
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-neutral-400"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                归属分类
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                标签（回车添加）
              </label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
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
              )}

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
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-neutral-400"
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

              {/* Tag Suggestions */}
              {tagSuggestions.length > 0 && (
                <div className="mt-1 flex items-center flex-wrap gap-1 text-[11px] text-neutral-400">
                  <span>推荐:</span>
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

            {/* Notes Textarea */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                备注说明
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加简要备注，便于日后搜索与查阅..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-neutral-400 resize-none"
              />
            </div>

            {/* Mobile Navigation Button to Next Tab */}
            <div className="md:hidden pt-1">
              <button
                type="button"
                onClick={() => setMobileTab('extra')}
                className="w-full py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>下一步：配置封面、颜色与置顶</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ========================================================
              COLUMN 2: 补充信息 (封面/OG、分类色彩、置顶、星标)
             ======================================================== */}
          <div
            className={`space-y-3.5 ${
              mobileTab === 'extra' ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Group Label on Desktop */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 pb-1 border-b border-neutral-100 dark:border-neutral-800">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              <span>补充信息</span>
            </div>

            {/* Mobile Back Button to Basic Info */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMobileTab('basic')}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回修改基础信息</span>
              </button>
            </div>

            {/* 1. OpenGraph / Card Cover Preview (Collapsible Accordion when disabled in settings) */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCoverSectionExpanded(!isCoverSectionExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                    卡片封面 / OpenGraph 预览图
                  </span>
                  {!isGlobalOgEnabled && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0">
                      系统已折叠
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-neutral-400 shrink-0">
                  <span className="text-[10px]">
                    {isCoverSectionExpanded ? '折叠' : '展开'}
                  </span>
                  {isCoverSectionExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {isCoverSectionExpanded && (
                <div className="p-3 pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">
                      可输入图片网址或点击一键提取 OG 元数据
                    </span>
                    {coverImage && (
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="text-neutral-400 hover:text-rose-500 transition-colors"
                      >
                        清除封面
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-neutral-400 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleFetchOgData()}
                      disabled={isFetchingOg || !url.trim()}
                      title="智能提取该网站 OpenGraph 封面"
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
                    >
                      {isFetchingOg ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>提取 OG</span>
                    </button>
                  </div>

                  {coverImage && (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750">
                      <img
                        src={coverImage}
                        alt="封面预览"
                        className="w-full h-full object-cover"
                        onError={() =>
                          showToast('封面图片链接似乎无法加载，请确认地址有效', 'info')
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Visual Bookmark Color */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  视觉分类颜色 <span className="text-neutral-400 font-normal">(卡片高亮与列表条)</span>
                </label>
                {color && (
                  <button
                    type="button"
                    onClick={() => setColor(undefined)}
                    className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  >
                    清除颜色
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* No color button */}
                <button
                  type="button"
                  onClick={() => setColor(undefined)}
                  title="无指定颜色"
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    !color
                      ? 'border-neutral-900 dark:border-neutral-100 ring-2 ring-neutral-900/20 dark:ring-neutral-100/20 scale-105'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-400'
                  }`}
                >
                  <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">无</span>
                </button>

                {/* Preset swatches */}
                {BOOKMARK_PALETTE.map((item) => {
                  const isSelected = color === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setColor(item.value)}
                      title={item.label}
                      style={{ backgroundColor: item.value }}
                      className={`w-6 h-6 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 dark:ring-offset-neutral-900 scale-110 shadow-xs'
                          : 'opacity-85 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white drop-shadow-xs" />}
                    </button>
                  );
                })}

                {/* Custom Color Picker */}
                <label
                  title="自定义颜色"
                  className="relative w-6 h-6 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                >
                  <input
                    type="color"
                    value={color || '#3b82f6'}
                    onChange={(e) => setColor(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <Palette className="w-3 h-3 text-neutral-400" />
                </label>
              </div>
            </div>

            {/* 3. Pin & Star Switches */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  isPinned
                    ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'rotate-45 fill-current text-indigo-500' : ''}`} />
                  <span>置顶书签</span>
                </div>
                <span className="text-[10px] text-neutral-400">
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
                <div className="flex items-center gap-1.5">
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current text-amber-500' : ''}`} />
                  <span>星标关注</span>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {isStarred ? '已星标' : '未星标'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Modal Sticky Footer Actions */}
        <div className="flex items-center justify-between gap-2.5 pt-5 mt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-400 hidden sm:block">
            快捷键：按 Enter 可快速保存
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
            >
              {bookmarkToEdit ? '保存修改' : '确认添加'}
            </button>
          </div>
        </div>
      </form>

      {/* 5. Safe Backdrop Close Confirmation Modal Overlay */}
      {showCloseConfirm && (
        <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 rounded-2xl animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  确认放弃编辑并关闭？
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  您正在输入或修改网址收藏信息，关闭后未保存的内容将丢失。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                继续编辑
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                放弃并关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};
