import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookmarkCard } from './BookmarkCard';
import { Bookmark, Category } from '../types';

interface SortableBookmarkCardProps {
  bookmark: Bookmark;
  category?: Category;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  onRecordClick: (bookmark: Bookmark) => void;
  onSelectTag?: (tag: string) => void;
  onShowQrCode?: (bookmark: Bookmark) => void;
  isDragDisabled?: boolean;
  showOgImage?: boolean;
  onSelectCategory?: (categoryId: string) => void;
  isCompact?: boolean;
}

export const SortableBookmarkCard: React.FC<SortableBookmarkCardProps> = ({
  bookmark,
  category,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleStar,
  onRecordClick,
  onSelectTag,
  onShowQrCode,
  isDragDisabled = false,
  showOgImage = true,
  onSelectCategory,
  isCompact = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    disabled: isDragDisabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : isMenuOpen ? 40 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`h-full ${isMenuOpen ? 'relative z-40' : ''}`}>
      <BookmarkCard
        bookmark={bookmark}
        category={category}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePin={onTogglePin}
        onToggleStar={onToggleStar}
        onRecordClick={onRecordClick}
        onSelectTag={onSelectTag}
        onShowQrCode={onShowQrCode}
        dragHandleProps={isDragDisabled ? undefined : { ...attributes, ...listeners }}
        isDragging={isDragging}
        showOgImage={showOgImage}
        onSelectCategory={onSelectCategory}
        isCompact={isCompact}
        onMenuOpenChange={setIsMenuOpen}
      />
    </div>
  );
};
