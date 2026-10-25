import React from 'react';
import {
  Sparkles,
  Code,
  Palette,
  BookOpen,
  Zap,
  Folder,
  Globe,
  Bookmark,
  Compass,
  Terminal,
  Cpu,
  Layers,
  Shield,
  Heart,
  Briefcase,
  Coffee,
  BookmarkCheck,
  Archive,
  LucideProps,
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  { name: 'Sparkles', label: 'AI/灵感', icon: Sparkles },
  { name: 'Code', label: '开发/编程', icon: Code },
  { name: 'Palette', label: '设计/艺术', icon: Palette },
  { name: 'BookOpen', label: '阅读/资讯', icon: BookOpen },
  { name: 'Zap', label: '高效/闪电', icon: Zap },
  { name: 'Globe', label: '互联网/全球', icon: Globe },
  { name: 'Terminal', label: '终端/命令行', icon: Terminal },
  { name: 'Cpu', label: '硬件/算力', icon: Cpu },
  { name: 'Layers', label: '系统/架构', icon: Layers },
  { name: 'Shield', label: '安全/隐私', icon: Shield },
  { name: 'Briefcase', label: '商务/办公', icon: Briefcase },
  { name: 'Coffee', label: '生活/休闲', icon: Coffee },
  { name: 'Archive', label: '归档/封存', icon: Archive },
  { name: 'Folder', label: '通用文件夹', icon: Folder },
];

const iconMap: Record<string, React.FC<LucideProps>> = {
  Sparkles,
  Code,
  Palette,
  BookOpen,
  Zap,
  Folder,
  Globe,
  Bookmark,
  Compass,
  Terminal,
  Cpu,
  Layers,
  Shield,
  Heart,
  Briefcase,
  Coffee,
  BookmarkCheck,
  Archive,
};

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  const IconComponent = iconMap[name] || Folder;
  return <IconComponent {...props} />;
};
