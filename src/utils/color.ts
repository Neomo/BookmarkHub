/**
 * Color utility functions for bookmarks and categories
 */

export const BOOKMARK_PALETTE = [
  { label: '科技蓝', value: '#3b82f6' },
  { label: '翡翠绿', value: '#10b981' },
  { label: '琥珀黄', value: '#f59e0b' },
  { label: '朱红', value: '#ef4444' },
  { label: '经典紫', value: '#8b5cf6' },
  { label: '洋红', value: '#ec4899' },
  { label: '青蓝', value: '#06b6d4' },
  { label: '活力橙', value: '#f97316' },
  { label: '青柠绿', value: '#84cc16' },
  { label: '石板灰', value: '#64748b' },
];

/**
 * Converts a hex color string to rgba format with the given alpha (0 to 1)
 */
export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return '';
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length === 6) {
    const num = parseInt(clean, 16);
    if (!isNaN(num)) {
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return hex;
}
