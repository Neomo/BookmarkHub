import React from 'react';
import { SystemSettings, ThemeMode, ViewMode, SortOption } from '../../types';
import {
  Sun,
  Moon,
  Laptop,
  LayoutGrid,
  List,
  Layers,
  Sparkles,
  ExternalLink,
  Archive,
  SlidersHorizontal,
  Check,
  FolderTree,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '../Toast';

interface PageSettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  currentTheme: ThemeMode;
  onApplyTheme: (theme: ThemeMode) => void;
}

export const PageSettings: React.FC<PageSettingsProps> = ({
  settings,
  onUpdateSettings,
  currentTheme,
  onApplyTheme,
}) => {
  const { showToast } = useToast();

  const handleUpdate = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    const updated = {
      ...settings,
      [key]: value,
    };
    onUpdateSettings(updated);
    if (key === 'defaultTheme') {
      onApplyTheme(value as ThemeMode);
    }
    showToast('偏好设置已保存并生效', 'success');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Module Header Toolbar */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          <span>页面显示与系统偏好设置</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          配置系统默认色彩主题、默认主视图、今日发现推荐横幅开关及浏览行为
        </p>
      </div>

      <div className="space-y-5">
        {/* 1. Default Theme Mode (4.1) */}
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              默认色彩主题
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              设置进入系统时默认加载的外观视觉风格
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              {
                id: 'system',
                label: '跟随系统',
                desc: '自适应操作系统深浅色设置',
                icon: Laptop,
              },
              {
                id: 'light',
                label: '浅色明亮',
                desc: '清新简约的明亮白昼模式',
                icon: Sun,
              },
              {
                id: 'dark',
                label: '深色暗黑',
                desc: '沉浸护眼的暗夜极客模式',
                icon: Moon,
              },
            ].map((t) => {
              const isSelected = settings.defaultTheme === t.id;
              const IconComp = t.icon;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleUpdate('defaultTheme', t.id as ThemeMode)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                    isSelected
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-850 ring-1 ring-neutral-900 dark:ring-neutral-100 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <IconComp className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    {isSelected && <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />}
                  </div>

                  <div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      {t.label}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Default View Mode (4.2) */}
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              默认展示视图
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              进入书签首页时优先呈现的布局模式
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              {
                id: 'card',
                label: '卡片矩阵视图',
                desc: '网格排布，信息全面，支持拖拽排序',
                icon: LayoutGrid,
              },
              {
                id: 'list',
                label: '紧凑列表视图',
                desc: '高密度单行排列，适合批量查阅',
                icon: List,
              },
              {
                id: 'group',
                label: '分类分组视图',
                desc: '按一级与二级专区分组呈现',
                icon: Layers,
              },
            ].map((v) => {
              const isSelected = settings.defaultViewMode === v.id;
              const IconComp = v.icon;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleUpdate('defaultViewMode', v.id as ViewMode)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                    isSelected
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-850 ring-1 ring-neutral-900 dark:ring-neutral-100 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <IconComp className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    {isSelected && <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />}
                  </div>

                  <div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      {v.label}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{v.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Daily Picks Banner Toggle (4.3) */}
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {'{今日发现 · DAILY PICK}'} 推荐模块
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                每天在主视图顶部推荐一条未曾点击访问的宝藏网址，促进书签有效重温
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.enableDailyPicks}
              onChange={(e) => handleUpdate('enableDailyPicks', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 dark:peer-checked:after:bg-neutral-900"></div>
          </label>
        </div>

        {/* 4. Card OpenGraph / Cover Preview Toggle */}
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                卡片封面与 OpenGraph 预览图
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                在卡片矩阵与分组视图中展示网址的 OpenGraph 封面预览图或自定义配图，提供更具辨识度的视觉体验
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.showCardOgImage ?? true}
              onChange={(e) => handleUpdate('showCardOgImage', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 dark:peer-checked:after:bg-neutral-900"></div>
          </label>
        </div>

        {/* 5. Subcategories Default View Mode */}
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                二级分类专区全局默认显示方式
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                在分组视图下，二级目录标签栏默认展开或折叠（单个分类可在分类管理中单独覆盖设置）
              </p>
            </div>
          </div>

          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs shrink-0">
            <button
              type="button"
              onClick={() => handleUpdate('defaultSubCategoriesView', 'expanded')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                settings.defaultSubCategoriesView === 'expanded'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              默认展开
            </button>
            <button
              type="button"
              onClick={() => handleUpdate('defaultSubCategoriesView', 'collapsed')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                settings.defaultSubCategoriesView === 'collapsed'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              默认折叠
            </button>
          </div>
        </div>

        {/* 5. Open In New Tab */}
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                新标签页打开网址
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                点击书签卡片或列表行时，默认在浏览器新标签页中打开链接
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.openInNewTab}
              onChange={(e) => handleUpdate('openInNewTab', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 dark:peer-checked:after:bg-neutral-900"></div>
          </label>
        </div>

        {/* 6. Auto Inactive Archive Months */}
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                闲置书签智能归档周期
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                设定零点击/无访问书签判定为“闲置”并提示归档的月数周期
              </p>
            </div>
          </div>

          <select
            value={settings.autoArchiveMonths || 6}
            onChange={(e) => handleUpdate('autoArchiveMonths', Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-medium"
          >
            <option value={3}>3 个月</option>
            <option value={6}>6 个月 (推荐)</option>
            <option value={12}>12 个月 (1年)</option>
          </select>
        </div>

        {/* 7. Global Custom Keyboard Shortcuts */}
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>全局快捷键自定义</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  Ctrl / ⌘ + 按键
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                自定义操作快捷触发按键，自动持久化保存到本地存储
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                handleUpdate('customShortcuts', {
                  search: 'k',
                  newBookmark: 'n',
                  toggleTheme: 't',
                  openAdmin: 'm',
                  toggleView: 'v',
                });
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-dotted"
            >
              恢复默认键位
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              {
                id: 'search',
                label: '聚焦搜索框',
                desc: '快速定位到全局检索输入框',
                value: settings.customShortcuts?.search || 'k',
              },
              {
                id: 'newBookmark',
                label: '新建书签收藏',
                desc: '快速打开网址录入弹窗',
                value: settings.customShortcuts?.newBookmark || 'n',
              },
              {
                id: 'toggleTheme',
                label: '切换深浅色主题',
                desc: '明亮与暗夜模式即时切换',
                value: settings.customShortcuts?.toggleTheme || 't',
              },
              {
                id: 'openAdmin',
                label: '打开全方位管理中心',
                desc: '管理分类、标签、网址与备份',
                value: settings.customShortcuts?.openAdmin || 'm',
              },
              {
                id: 'toggleView',
                label: '循环切换视图',
                desc: '卡片 / 列表 / 分组布局快速切换',
                value: settings.customShortcuts?.toggleView || 'v',
              },
            ].map((sc) => (
              <div
                key={sc.id}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {sc.label}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">{sc.desc}</div>
                </div>

                <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
                  <span className="text-neutral-400 text-[11px]">Ctrl +</span>
                  <input
                    type="text"
                    maxLength={1}
                    value={sc.value.toUpperCase()}
                    onChange={(e) => {
                      const char = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                      if (!char) return;
                      const next = {
                        ...(settings.customShortcuts || {
                          search: 'k',
                          newBookmark: 'n',
                          toggleTheme: 't',
                          openAdmin: 'm',
                          toggleView: 'v',
                        }),
                        [sc.id]: char,
                      };
                      handleUpdate('customShortcuts', next);
                    }}
                    className="w-8 h-7 text-center font-bold text-xs uppercase bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-xs focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:outline-hidden"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
