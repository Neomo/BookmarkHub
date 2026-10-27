import { Bookmark, Category } from '../types';
import { buildCategoryTree } from './storage';
import { extractDomain } from './url';

/**
 * Formats a timestamp into YYYY-MM-DD HH:mm
 */
function formatDate(timestamp?: number | null): string {
  if (!timestamp) return '从未访问';
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Generates structured Markdown text from bookmarks and categories,
 * optimized for Notion, Obsidian, Logseq, and general Markdown readers.
 */
export function generateBookmarksMarkdown(
  bookmarks: Bookmark[],
  categories: Category[]
): string {
  const tree = buildCategoryTree(categories);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const lines: string[] = [];

  // Header Frontmatter & Document Title
  lines.push('# 📚 轻藏 BookmarkHub · 书签知识库合集');
  lines.push('');
  lines.push(`> 导出时间：${nowStr}  `);
  lines.push(`> 统计概要：共 **${bookmarks.length}** 个收藏网址 · **${categories.length}** 个分类专区  `);
  lines.push(`> 适用工具：可直接导入或粘贴至 **Notion**、**Obsidian**、**Logseq** 等双链笔记软件中。  `);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Index Table of Contents
  lines.push('## 📑 目录导航');
  lines.push('');
  for (const root of tree) {
    lines.push(`- [${root.name}](#${encodeURIComponent(root.name)})`);
    for (const child of root.children) {
      lines.push(`  - [${child.name}](#${encodeURIComponent(child.name)})`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Helper to format bookmark item
  const renderBookmarkItem = (bm: Bookmark) => {
    const badges: string[] = [];
    if (bm.isStarred) badges.push('`★ 星标`');
    if (bm.isPinned) badges.push('`📌 置顶`');
    if (bm.healthStatus === 'healthy') badges.push('`● 正常`');
    if (bm.healthStatus === 'error') badges.push('`⚠ 失效`');

    const badgeStr = badges.length > 0 ? ` ${badges.join(' ')}` : '';
    const domain = extractDomain(bm.url);

    lines.push(`- [**${bm.title}**](${bm.url})${badgeStr}`);
    lines.push(`  - **链接**：\`${bm.url}\` (${domain})`);

    if (bm.notes?.trim()) {
      lines.push(`  - **备注**：${bm.notes.trim()}`);
    }

    if (bm.tags && bm.tags.length > 0) {
      lines.push(`  - **标签**：${bm.tags.map((t) => `\`#${t}\``).join(' ')}`);
    }

    lines.push(`  - **数据**：访问 ${bm.clickCount} 次 · 最近访问于 ${formatDate(bm.lastClickedAt)}`);
  };

  // Grouped by Category Hierarchy
  const handledBookmarkIds = new Set<string>();

  for (const root of tree) {
    lines.push(`## 📁 <a id="${encodeURIComponent(root.name)}"></a>${root.name}`);
    if (root.description) {
      lines.push(`*${root.description}*  `);
    }
    lines.push('');

    // Root-level bookmarks (directly assigned to parent category)
    const directBookmarks = bookmarks.filter((b) => b.categoryId === root.id);
    if (directBookmarks.length > 0) {
      for (const bm of directBookmarks) {
        renderBookmarkItem(bm);
        handledBookmarkIds.add(bm.id);
      }
      lines.push('');
    }

    // Children subcategories
    for (const child of root.children) {
      lines.push(`### 📂 <a id="${encodeURIComponent(child.name)}"></a>${root.name} / ${child.name}`);
      const subBookmarks = bookmarks.filter((b) => b.categoryId === child.id);

      if (subBookmarks.length === 0) {
        lines.push('*（此分类暂无书签）*');
      } else {
        for (const bm of subBookmarks) {
          renderBookmarkItem(bm);
          handledBookmarkIds.add(bm.id);
        }
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  // Uncategorized or lingering bookmarks
  const unhandled = bookmarks.filter((b) => !handledBookmarkIds.has(b.id));
  if (unhandled.length > 0) {
    lines.push('## 📦 未分类书签');
    lines.push('');
    for (const bm of unhandled) {
      renderBookmarkItem(bm);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Trigger download of Markdown file
 */
export function downloadMarkdownFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
