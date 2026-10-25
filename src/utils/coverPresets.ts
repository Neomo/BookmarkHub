import { CategoryCover } from '../types';

export interface GradientPreset {
  id: string;
  name: string;
  category: string;
  css: string;
  textColor: 'light' | 'dark';
}

export interface ImagePreset {
  id: string;
  name: string;
  category: string;
  url: string;
  textColor: 'light' | 'dark';
}

export const SOLID_COLOR_PRESETS = [
  { name: '经典紫', value: '#6366f1' },
  { name: '蔚蓝天', value: '#0ea5e9' },
  { name: '翡翠绿', value: '#10b981' },
  { name: '琥珀金', value: '#f59e0b' },
  { name: '洋红樱', value: '#ec4899' },
  { name: '星芒紫', value: '#8b5cf6' },
  { name: '烈焰红', value: '#ef4444' },
  { name: '极光青', value: '#06b6d4' },
  { name: '活力橙', value: '#f97316' },
  { name: '松石绿', value: '#14b8a6' },
  { name: '高级灰', value: '#475569' },
  { name: '黑耀金', value: '#18181b' },
];

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'grad-ocean',
    name: '星辰深海',
    category: '科技/通用',
    css: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 50%, #06b6d4 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-sunset',
    name: '黄昏盛景',
    category: '创意/生活',
    css: 'linear-gradient(135deg, #ea580c 0%, #db2777 50%, #7c3aed 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-emerald',
    name: '极地森境',
    category: '自然/健康',
    css: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-midnight',
    name: '深邃暗夜',
    category: '极客/暗黑',
    css: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 60%, #312e81 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-cyber',
    name: '赛博霓虹',
    category: '潮流/AI',
    css: 'linear-gradient(135deg, #2563eb 0%, #9333ea 50%, #ec4899 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-amber',
    name: '金芒破晓',
    category: '商务/金融',
    css: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-rose',
    name: '蔷薇物语',
    category: '艺术/设计',
    css: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f43f5e 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-slate',
    name: '极简北欧',
    category: '效率/办公',
    css: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #64748b 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-aurora',
    name: '极光幻彩',
    category: '未来/科幻',
    css: 'linear-gradient(135deg, #4338ca 0%, #0891b2 50%, #059669 100%)',
    textColor: 'light',
  },
  {
    id: 'grad-pastel-soft',
    name: '柔和浅黛',
    category: '柔光/轻快',
    css: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #fae8ff 100%)',
    textColor: 'dark',
  },
];

export const IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'img-ai',
    name: 'AI 算力星云',
    category: 'AI / 科技',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    textColor: 'light',
  },
  {
    id: 'img-code',
    name: '矩阵极客代码',
    category: '开发 / 编程',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    textColor: 'light',
  },
  {
    id: 'img-design',
    name: '现代极简流体',
    category: '设计 / 创意',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    textColor: 'light',
  },
  {
    id: 'img-reading',
    name: '宁静极简书房',
    category: '阅读 / 资讯',
    url: 'https://images.unsplash.com/photo-1507842229450-799435b6c56d?auto=format&fit=crop&w=1200&q=80',
    textColor: 'light',
  },
  {
    id: 'img-work',
    name: '现代协同空间',
    category: '办公 / 效率',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    textColor: 'light',
  },
  {
    id: 'img-abstract-mesh',
    name: '几何渐变晶格',
    category: '抽象 / 现代',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
    textColor: 'light',
  },
];

/**
 * Returns React inline CSS properties for a given CategoryCover
 */
export function getCoverStyle(cover?: CategoryCover): React.CSSProperties {
  if (!cover || !cover.value) {
    return {};
  }

  if (cover.type === 'solid') {
    return {
      backgroundColor: cover.value,
    };
  }

  if (cover.type === 'gradient') {
    return {
      background: cover.value,
    };
  }

  if (cover.type === 'image') {
    return {
      backgroundImage: `url(${cover.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  return {};
}
