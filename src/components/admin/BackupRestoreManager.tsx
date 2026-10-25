import React, { useState, useRef } from 'react';
import { Bookmark, Category, SystemSettings } from '../../types';
import {
  exportBookmarksOnlyJson,
  exportSystemConfigJson,
  exportFullBackupJson,
  downloadJsonFile,
  validateAndParseBackupFile,
  BackupValidationResult,
  DEFAULT_CATEGORIES,
  DEFAULT_BOOKMARKS,
  DEFAULT_SYSTEM_SETTINGS,
  executeImport,
  calculateImportDiff,
} from '../../utils/storage';
import {
  Download,
  Upload,
  Database,
  SlidersHorizontal,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  FolderTree,
  Bookmark as BookmarkIcon,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../Toast';

interface BackupRestoreManagerProps {
  bookmarks: Bookmark[];
  categories: Category[];
  settings: SystemSettings;
  onRestoreAll: (bookmarks: Bookmark[], categories: Category[], settings?: SystemSettings) => void;
  onUpdateBookmarks: (bookmarks: Bookmark[]) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
}

export const BackupRestoreManager: React.FC<BackupRestoreManagerProps> = ({
  bookmarks,
  categories,
  settings,
  onRestoreAll,
  onUpdateBookmarks,
  onUpdateCategories,
  onUpdateSettings,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    validation: BackupValidationResult;
  } | null>(null);

  const [importMode, setImportMode] = useState<'append' | 'merge' | 'overwrite'>('merge');

  // Today formatted date for filename
  const getFileDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate()
    ).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(
      2,
      '0'
    )}`;
  };

  // 1. Export Bookmarks only (5.1)
  const handleExportBookmarks = () => {
    const jsonStr = exportBookmarksOnlyJson(bookmarks, categories);
    const filename = `BookmarkHub_Bookmarks_${getFileDateStr()}.json`;
    downloadJsonFile(jsonStr, filename);
    showToast(`已导出 ${bookmarks.length} 条网址数据`, 'success');
  };

  // 2. Export System Config only (5.2)
  const handleExportConfig = () => {
    const jsonStr = exportSystemConfigJson(categories, settings);
    const filename = `BookmarkHub_Config_${getFileDateStr()}.json`;
    downloadJsonFile(jsonStr, filename);
    showToast(`已导出系统配置与 ${categories.length} 个分类结构`, 'success');
  };

  // 3. Export Full Backup (5.3)
  const handleExportFull = () => {
    const jsonStr = exportFullBackupJson(bookmarks, categories, settings);
    const filename = `BookmarkHub_FullBackup_${getFileDateStr()}.json`;
    downloadJsonFile(jsonStr, filename);
    showToast('已成功创建全量备份包（网址+分类+配置）', 'success');
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateAndParseBackupFile(content);

      setUploadedFile({
        name: file.name,
        size: file.size,
        validation,
      });

      if (!validation.isValid) {
        showToast(validation.error || '文件格式无效', 'error');
      } else {
        showToast('备份文件解析成功，请确认恢复选项', 'success');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle Restore Execution
  const handleConfirmRestore = () => {
    if (!uploadedFile || !uploadedFile.validation.isValid) return;

    const { type, parsedData } = uploadedFile.validation;

    // Full Restore
    if (type === 'full') {
      if (
        window.confirm(
          `确定根据全量备份还原系统吗？\n将导入 ${parsedData.bookmarks.length} 个书签、${
            parsedData.categories.length
          } 个分类结构${parsedData.settings ? '以及系统偏好设置' : ''}。`
        )
      ) {
        onRestoreAll(parsedData.bookmarks, parsedData.categories, parsedData.settings);
        showToast('全量数据与系统配置已成功恢复！', 'success');
        setUploadedFile(null);
      }
      return;
    }

    // Config Only Restore
    if (type === 'config') {
      if (
        window.confirm(
          `确定还原系统配置吗？\n将应用 ${parsedData.categories.length} 个分类结构${
            parsedData.settings ? '以及系统偏好设置' : ''
          }。`
        )
      ) {
        if (Array.isArray(parsedData.categories) && parsedData.categories.length > 0) {
          onUpdateCategories(parsedData.categories);
        }
        if (parsedData.settings) {
          onUpdateSettings(parsedData.settings);
        }
        showToast('系统配置与分类体系已成功还原！', 'success');
        setUploadedFile(null);
      }
      return;
    }

    // Bookmarks Restore
    if (type === 'bookmarks') {
      const diff = calculateImportDiff(JSON.stringify(parsedData), bookmarks, categories);
      const result = executeImport(diff, importMode, bookmarks, categories);
      onUpdateBookmarks(result.bookmarks);
      if (result.categories.length > 0) {
        onUpdateCategories(result.categories);
      }
      showToast(
        `书签数据导入完成：新增 ${result.addedCount} 条，更新 ${result.updatedCount} 条`,
        'success'
      );
      setUploadedFile(null);
    }
  };

  // Reset to Factory Defaults
  const handleResetToDefaults = () => {
    const answer = window.prompt(
      '危险操作确认：这将清除您当前的全部书签与自定义分类，并恢复为初始官方演示数据。\n如果确定重置，请输入 “RESET”：'
    );
    if (answer === 'RESET') {
      onRestoreAll(DEFAULT_BOOKMARKS, DEFAULT_CATEGORIES, DEFAULT_SYSTEM_SETTINGS);
      showToast('系统已成功恢复为初始官方演示数据', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Module Header Toolbar */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          <span>模块化数据备份、导出与容灾还原</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          所有数据与偏好配置均持久化保存在当前浏览器本地，支持独立导出网址数据、系统配置或创建全量归档备份包
        </p>
      </div>

      {/* 1. Modular Export Options Cards */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
          1. 导出与备份中心 (Export)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export Bookmarks Only (5.1) */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BookmarkIcon className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                仅导出网址数据
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                仅导出当前全部 {bookmarks.length} 条网址书签及标签、点击统计与访问时间
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportBookmarks}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出网址 JSON</span>
            </button>
          </div>

          {/* Export System Config Only (5.2) */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                仅导出系统配置
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                仅导出当前 {categories.length} 个分类层级、Cover 样式及页面偏好配置
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportConfig}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出配置 JSON</span>
            </button>
          </div>

          {/* Export Full Backup (5.3) */}
          <div className="p-4 rounded-2xl border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-850 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                创建全量备份包 (推荐)
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                完整打包所有网址、所有分类层级与 Cover 装饰、页面偏好与个性化配置
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportFull}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>一键下载全量备份</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Import & Restore Section */}
      <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span>2. 导入与还原数据 (Import & Restore)</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            选择任何此前导出的 BookmarkHub 备份文件（网址包、配置包或全量备份包），系统将智能识别类型并安全还原
          </p>
        </div>

        {/* Upload drop zone */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,application/json"
          className="hidden"
        />

        {!uploadedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-950/40 space-y-2"
          >
            <Upload className="w-8 h-8 text-neutral-400 mx-auto stroke-[1.5]" />
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              点击选择或拖拽备份 JSON 文件至此处
            </div>
            <p className="text-[11px] text-neutral-400">
              自动识别「全量归档包」、「系统配置包」或「独立网址包」
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-750 bg-neutral-50 dark:bg-neutral-850 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                    {uploadedFile.name}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {(uploadedFile.size / 1024).toFixed(1)} KB · 识别类型:{' '}
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {uploadedFile.validation.type === 'full'
                        ? '全量备份包 (Full Backup)'
                        : uploadedFile.validation.type === 'config'
                        ? '系统配置包 (Config Only)'
                        : '网址数据包 (Bookmarks Data)'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                更换文件
              </button>
            </div>

            {/* Validation Details */}
            {uploadedFile.validation.isValid && uploadedFile.validation.stats && (
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">待导入书签</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                    {uploadedFile.validation.stats.bookmarkCount} 个
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">待导入分类</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                    {uploadedFile.validation.stats.categoryCount} 个
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">包含偏好配置</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {uploadedFile.validation.stats.hasSettings ? '是' : '无'}
                  </span>
                </div>
              </div>
            )}

            {/* If it is bookmarks only, offer mode choice */}
            {uploadedFile.validation.type === 'bookmarks' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  导入冲突策略:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'merge', label: '智能合并', desc: '更新冲突书签并保留现有' },
                    { id: 'append', label: '仅追加', desc: '只导入不存在的新网址' },
                    { id: 'overwrite', label: '全量覆盖', desc: '清空并替换所有书签' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setImportMode(m.id as any)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        importMode === m.id
                          ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                      }`}
                    >
                      <div>{m.label}</div>
                      <div className="text-[10px] text-neutral-400">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Restore Button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="px-4 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                取消
              </button>
              <button
                type="button"
                disabled={!uploadedFile.validation.isValid}
                onClick={handleConfirmRestore}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors shadow-xs"
              >
                确认执行还原
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Factory Reset Danger Zone */}
      <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>危险区域：重置系统初始演示数据</span>
          </h4>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            清空所有已保存的自定义网址与分类，恢复为官方出厂预设的分类架构与示范书签
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="px-3.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg border border-rose-300 dark:border-rose-900 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          恢复官方初始状态
        </button>
      </div>
    </div>
  );
};
