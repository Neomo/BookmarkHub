import React, { useState } from 'react';
import { Bookmark, Category } from '../types';
import { BookmarkCard } from './BookmarkCard';
import { CategoryIcon } from './CategoryIcon';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';

interface BookmarkGroupViewProps {
  categories: Category[];
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  onRecordClick: (bookmark: Bookmark) => void;
  onSelectTag?: (tag: string) => void;
}

export const BookmarkGroupView: React.FC<BookmarkGroupViewProps> = ({
  categories,
  bookmarks,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleStar,
  onRecordClick,
  onSelectTag,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Group bookmarks by categoryId
  const grouped = new Map<string, Bookmark[]>();
  for (const cat of categories) {
    grouped.set(cat.id, []);
  }
  const uncategorized: Bookmark[] = [];

  for (const bm of bookmarks) {
    if (grouped.has(bm.categoryId)) {
      grouped.get(bm.categoryId)!.push(bm);
    } else {
      uncategorized.push(bm);
    }
  }

  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const catBookmarks = grouped.get(cat.id) || [];
        const isCollapsed = collapsedCategories[cat.id];

        return (
          <section key={cat.id} className="space-y-3">
            {/* Category header */}
            <div
              onClick={() => toggleCollapse(cat.id)}
              className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="p-1 -ml-1 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 rounded transition-colors"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: cat.color || '#4f46e5' }}
                >
                  <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {cat.name}
                </h2>
                <span className="text-xs text-neutral-400 tabular-nums font-mono">
                  ({catBookmarks.length})
                </span>
              </div>

              <span className="text-xs text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                {isCollapsed ? '展开' : '折叠'}
              </span>
            </div>

            {/* Cards container */}
            {!isCollapsed && (
              catBookmarks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
                  {catBookmarks.map((bm) => (
                    <BookmarkCard
                      key={bm.id}
                      bookmark={bm}
                      category={cat}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onTogglePin={onTogglePin}
                      onToggleStar={onToggleStar}
                      onRecordClick={onRecordClick}
                      onSelectTag={onSelectTag}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                  该分类下暂无书签
                </div>
              )
            )}
          </section>
        );
      })}

      {uncategorized.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <Folder className="w-4 h-4 text-neutral-400" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              未分类
            </h2>
            <span className="text-xs text-neutral-400 tabular-nums font-mono">
              ({uncategorized.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
            {uncategorized.map((bm) => (
              <BookmarkCard
                key={bm.id}
                bookmark={bm}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onToggleStar={onToggleStar}
                onRecordClick={onRecordClick}
                onSelectTag={onSelectTag}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
