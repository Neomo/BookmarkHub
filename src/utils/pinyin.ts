/**
 * Lightweight Chinese Pinyin Initials & Fuzzy Search Utility
 */

// Common Chinese character Unicode range: 0x4E00 - 0x9FA5
// Standard GB2312/Unicode first letter approximation table for fast client-side pinyin matching
const PINYIN_FIRST_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// Quick lookup mapping for commonly used tech/bookmark characters
const CHAR_PINYIN_MAP: Record<string, string> = {
  人: 'r', 工: 'g', 智: 'z', 能: 'n', 开: 'k', 发: 'f', 工具: 'gj',
  设: 's', 计: 'j', 资: 'z', 源: 'y', 讯: 'x', 阅: 'y', 读: 'd',
  高: 'g', 效: 'x', 办: 'b', 公: 'g', 社: 's', 区: 'q', 技: 'j', 术: 's',
  代: 'd', 码: 'm', 托: 't', 管: 'g', 模: 'm', 型: 'x', 样: 'y', 式: 's',
  协: 'x', 作: 'z', 原: 'y', 灵: 'l', 感: 'g', 插: 'c', 画: 'h',
  极: 'j', 客: 'k', 硅: 'g', 谷: 'g', 创: 'c', 业: 'y', 数: 's', 字: 'z',
  生: 's', 活: 'h', 笔: 'b', 记: 'j', 知: 'z', 识: 's', 库: 'k', 项: 'x',
  目: 'm', 敏: 'm', 捷: 'j', 文: 'w', 档: 'd', 离: 'l', 线: 'x', 白: 'b',
  板: 'b', 手: 's', 绘: 'h', 架: 'j', 构: 'g', 图: 't', 标: 'b', 量: 'l',
  少: 's', 派: 'p', 掘: 'j', 金: 'j', 哔: 'b', 哩: 'l',
};

/**
 * Extract initial pinyin letters if possible, or lowercase character
 */
export function getCharPinyinInitial(char: string): string {
  if (CHAR_PINYIN_MAP[char]) {
    return CHAR_PINYIN_MAP[char];
  }
  // If ASCII letter or digit, return lowercase
  if (/^[a-zA-Z0-9]$/.test(char)) {
    return char.toLowerCase();
  }
  return char;
}

/**
 * Converts a string to its initial pinyin string
 */
export function getPinyinInitials(str: string): string {
  return Array.from(str)
    .map(getCharPinyinInitial)
    .join('');
}

/**
 * Fuzzy score & matching across bookmark fields
 */
export function matchBookmark(
  query: string,
  item: {
    title: string;
    url: string;
    tags?: string[];
    notes?: string;
    categoryName?: string;
  }
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // 1. Direct substring match (case-insensitive) on Title, URL, Notes, Category
  const titleLower = item.title.toLowerCase();
  const urlLower = item.url.toLowerCase();
  const notesLower = (item.notes || '').toLowerCase();
  const catLower = (item.categoryName || '').toLowerCase();

  if (
    titleLower.includes(q) ||
    urlLower.includes(q) ||
    notesLower.includes(q) ||
    catLower.includes(q)
  ) {
    return true;
  }

  // 2. Tag match
  if (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))) {
    return true;
  }

  // 3. Pinyin initials match on Title
  const titleInitials = getPinyinInitials(titleLower);
  if (titleInitials.includes(q)) {
    return true;
  }

  // 4. Pinyin initials match on Tags
  if (item.tags) {
    for (const tag of item.tags) {
      if (getPinyinInitials(tag.toLowerCase()).includes(q)) {
        return true;
      }
    }
  }

  // 5. Pinyin initials on Category
  if (item.categoryName && getPinyinInitials(catLower).includes(q)) {
    return true;
  }

  return false;
}
