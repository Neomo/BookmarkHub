import React, { useState } from 'react';
import { Keyboard, X, Sparkles, Settings } from 'lucide-react';
import { CustomShortcuts } from '../types';

interface FloatingKeyboardShortcutsProps {
  shortcuts?: CustomShortcuts;
  onOpenSettings?: () => void;
}

export const FloatingKeyboardShortcuts: React.FC<FloatingKeyboardShortcutsProps> = ({
  shortcuts,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  const shortcutItems = [
    {
      label: '快速聚焦搜索框',
      keys: [`${modifierKey}`, (shortcuts?.search || 'k').toUpperCase()],
      desc: '搜索网址、标题或标签',
    },
    {
      label: '新建网址收藏',
      keys: [`${modifierKey}`, (shortcuts?.newBookmark || 'n').toUpperCase()],
      desc: '快速录入新书签',
    },
    {
      label: '切换浅色/深色主题',
      keys: [`${modifierKey}`, (shortcuts?.toggleTheme || 't').toUpperCase()],
      desc: '切换视觉外观',
    },
    {
      label: '打开系统全方位管理',
      keys: [`${modifierKey}`, (shortcuts?.openAdmin || 'm').toUpperCase()],
      desc: '管理分类/标签/设置',
    },
    {
      label: '切换显示视图',
      keys: [`${modifierKey}`, (shortcuts?.toggleView || 'v').toUpperCase()],
      desc: '卡片/列表/分组视图',
    },
    {
      label: '关闭窗口 / 取消筛选',
      keys: ['Esc'],
      desc: '退出当前弹窗或清除',
    },
  ];

  return (
    <div
      className="fixed bottom-6 right-6 z-40 hidden sm:block select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Popover Card */}
      {(isOpen || isHovered) && (
        <div className="absolute bottom-12 right-0 w-80 mb-2 p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800/90 shadow-2xl shadow-neutral-900/10 dark:shadow-neutral-950/60 transition-all duration-200 animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
                <Keyboard className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">快捷键指南</h4>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">键盘快捷操作一览</p>
              </div>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="自定义全局快捷键"
                className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="text-[11px]">自定义</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {shortcutItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 text-xs">
                <div className="flex flex-col">
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    {item.desc}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.keys.map((k, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-mono font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-xs"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              支持系统设置中自定义组合键
            </span>
            <span>按 Esc 快速返回</span>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800/90 shadow-lg shadow-neutral-900/5 hover:shadow-xl hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-200 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        title="键盘快捷键 (Hover 查看)"
      >
        <Keyboard className="w-4 h-4 transition-transform group-hover:scale-110" />
        <span className="text-xs font-medium font-mono">
          {modifierKey}+K
        </span>
      </button>
    </div>
  );
};
