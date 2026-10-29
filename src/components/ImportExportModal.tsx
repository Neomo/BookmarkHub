import React, { useState, useRef } from 'react';
import { Bookmark, Category, ImportDiff, ImportMode } from '../types';
import {
  exportDataAsJSON,
  calculateImportDiff,
  executeImport,
  normalizeUrl,
} from '../utils/storage';
import { generateBookmarksMarkdown, downloadMarkdownFile } from '../utils/markdownExport';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Layers,
  ArrowRight,
  Info,
  BookOpen,
} from 'lucide-react';
import { useToast } from './Toast';
import { ModalWrapper } from './ModalWrapper';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: Category[];
  onImportComplete: (bookmarks: Bookmark[], categories: Category[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  categories,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'markdown'>('export');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importDiff, setImportDiff] = useState<ImportDiff | null>(null);
  const [rawJsonText, setRawJsonText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleExportFile = () => {
    exportDataAsJSON(bookmarks, categories);
    showToast('备份文件已导出至本地', 'success');
  };

  const handleCopyExportJson = () => {
    const data = {
      version: '1.0',
      exportedAt: Date.now(),
      source: '轻藏 BookmarkHub',
      categories,
      bookmarks,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('JSON 数据已复制到剪贴板', 'info');
  };

  const handleDownloadMarkdown = () => {
    const mdContent = generateBookmarksMarkdown(bookmarks, categories);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadMarkdownFile(mdContent, `bookmarkhub_export_${dateStr}.md`);
    showToast('Markdown 文档已下载，可直接在 Notion/Obsidian 中打开', 'success');
  };

  const handleCopyMarkdown = () => {
    const mdContent = generateBookmarksMarkdown(bookmarks, categories);
    navigator.clipboard.writeText(mdContent);
    showToast('Markdown 内容已复制到剪贴板', 'info');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawJsonText(content);
        const diff = calculateImportDiff(content, bookmarks, categories);
        setImportDiff(diff);
      }
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setRawJsonText(text);
    if (!text.trim()) {
      setImportDiff(null);
      return;
    }
    const diff = calculateImportDiff(text, bookmarks, categories);
    setImportDiff(diff);
  };

  const handleConfirmImport = () => {
    if (!importDiff || !importDiff.isFormatValid) {
      showToast('无效的导入数据', 'error');
      return;
    }

    const result = executeImport(importDiff, importMode, bookmarks, categories);
    onImportComplete(result.bookmarks, result.categories);

    let summary = '';
    if (importMode === 'overwrite') {
      summary = `已覆盖全部数据，当前共 ${result.bookmarks.length} 个书签`;
    } else if (importMode === 'append') {
      summary = `追加完成：新增 ${result.addedCount} 个书签`;
    } else {
      summary = `合并完成：新增 ${result.addedCount} 个，更新 ${result.updatedCount} 个书签`;
    }

    showToast(summary, 'success');
    setImportDiff(null);
    setRawJsonText('');
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      className="max-h-[90vh]"
    >
        {/* Header with Segmented Tab */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              导出 JSON 备份
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'markdown'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              导出 Markdown
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'import'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              导入数据 (Import)
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 space-y-3">
                <div className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    完整数据备份 (JSON 格式)
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  导出包含当前所有的网址书签、自定义分类结构、标签元数据、置顶星标状态及点击访问统计。可在任意设备重新导入恢复。
                </p>

                <div className="flex items-center gap-6 pt-2 text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">
                  <div>
                    书签数量: <strong className="text-neutral-900 dark:text-neutral-100">{bookmarks.length}</strong>
                  </div>
                  <div>
                    分类数量: <strong className="text-neutral-900 dark:text-neutral-100">{categories.length}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleExportFile}
                  className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>下载 JSON 备份文件</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyExportJson}
                  className="py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>复制 JSON 文本</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Notion / Obsidian 知识库格式 (Markdown)
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  按分类多级结构自动生成精美排版的 Markdown 文件，包含目录索引、网址超链接、标签、备注、健康状态与访问热度。完美兼容 Notion、Obsidian、Logseq、Typora、GitHub 等。
                </p>

                <div className="flex items-center gap-6 pt-2 text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">
                  <div>
                    将导出书签: <strong className="text-neutral-900 dark:text-neutral-100">{bookmarks.length}</strong> 项
                  </div>
                  <div>
                    涵盖分类: <strong className="text-neutral-900 dark:text-neutral-100">{categories.length}</strong> 个
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>下载 .md 文档</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>复制 Markdown 内容</span>
                </button>
              </div>

              {/* Preview preview box */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40">
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Markdown 导出预览</span>
                  <span className="text-[10px] text-neutral-400 font-normal">多级大纲格式</span>
                </div>
                <div className="max-h-32 overflow-y-auto font-mono text-[11px] text-neutral-500 whitespace-pre-wrap leading-relaxed select-text p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  {generateBookmarksMarkdown(bookmarks.slice(0, 5), categories)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-5">
              {/* File upload & Textarea */}
              {!importDiff ? (
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 rounded-xl p-8 text-center cursor-pointer bg-neutral-50/50 dark:bg-neutral-950/30 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                      点击选择或拖拽 JSON 备份文件
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      支持 BookmarkHub 备份文件或书签列表 JSON
                    </p>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                    </div>
                    <span className="relative bg-white dark:bg-neutral-900 px-3 text-[11px] text-neutral-400">
                      或者直接粘贴 JSON 文本
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={rawJsonText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="在此粘贴包含书签数据的 JSON 字符串..."
                    className="w-full p-3 font-mono text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400"
                  />
                </div>
              ) : (
                /* Diff Preview and Mode Selection */
                <div className="space-y-4">
                  {/* Diff Analysis KPI Strip */}
                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        数据解析成功：检测到 {importDiff.totalIncoming} 条书签
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setImportDiff(null);
                          setRawJsonText('');
                        }}
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                      >
                        重选文件
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs tabular-nums">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">新增书签</div>
                        <div className="text-base font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                          +{importDiff.newBookmarks.length}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                        <div className="text-[11px] text-amber-700 dark:text-amber-400">同网址差异项</div>
                        <div className="text-base font-bold text-amber-800 dark:text-amber-300 font-mono">
                          {importDiff.conflicts.length}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
                        <div className="text-[11px] text-neutral-500">完全相同项</div>
                        <div className="text-base font-bold text-neutral-700 dark:text-neutral-300 font-mono">
                          {importDiff.unchangedBookmarks.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      请选择导入模式：
                    </label>

                    <div className="space-y-2">
                      {/* 1. Append Mode */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          importMode === 'append'
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-850 ring-1 ring-neutral-900 dark:ring-neutral-100'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="import_mode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="mt-0.5 text-neutral-900"
                        />
                        <div className="min-w-0 text-xs">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            追加模式 (Append)
                          </div>
                          <div className="text-neutral-500 mt-0.5">
                            只新增本地不存在的 {importDiff.newBookmarks.length} 项网址，完全跳过任何已有重复项，不影响现有书签。
                          </div>
                        </div>
                      </label>

                      {/* 2. Merge Mode */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          importMode === 'merge'
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-850 ring-1 ring-neutral-900 dark:ring-neutral-100'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="import_mode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-0.5 text-neutral-900"
                        />
                        <div className="min-w-0 text-xs">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            合并模式 (Merge) — 推荐
                          </div>
                          <div className="text-neutral-500 mt-0.5">
                            自动去重：新增 {importDiff.newBookmarks.length} 项新网址，并用导入数据更新已存在的 {importDiff.conflicts.length} 项书签详情。
                          </div>
                        </div>
                      </label>

                      {/* 3. Overwrite Mode */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          importMode === 'overwrite'
                            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-500'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="import_mode"
                          value="overwrite"
                          checked={importMode === 'overwrite'}
                          onChange={() => setImportMode('overwrite')}
                          className="mt-0.5 text-rose-600"
                        />
                        <div className="min-w-0 text-xs">
                          <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>覆盖模式 (Overwrite)</span>
                          </div>
                          <div className="text-neutral-500 mt-0.5">
                            清空本地当前全部 {bookmarks.length} 条书签及分类，完全以导入文件的 {importDiff.totalIncoming} 条数据重新构建。
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Sample Differences preview */}
                  {importDiff.conflicts.length > 0 && importMode === 'merge' && (
                    <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40 text-xs space-y-1.5">
                      <div className="font-medium text-neutral-700 dark:text-neutral-300">
                        更新差异预览（共 {importDiff.conflicts.length} 处）：
                      </div>
                      <div className="max-h-28 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800 text-[11px] text-neutral-500">
                        {importDiff.conflicts.slice(0, 4).map((c, idx) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                            <span className="truncate">{c.existing.title}</span>
                            <ArrowRight className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate text-neutral-800 dark:text-neutral-200 font-medium">
                              {c.incoming.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirm CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs transition-colors ${
                        importMode === 'overwrite'
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200'
                      }`}
                    >
                      {importMode === 'overwrite'
                        ? `确认覆盖并替换为 ${importDiff.totalIncoming} 条数据`
                        : importMode === 'append'
                        ? `确认追加 ${importDiff.newBookmarks.length} 条新书签`
                        : `确认合并导入 (${importDiff.newBookmarks.length} 新增, ${importDiff.conflicts.length} 更新)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
    </ModalWrapper>
  );
};
