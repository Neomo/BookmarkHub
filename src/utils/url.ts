/**
 * Extract clean hostname/domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const raw = url.trim();
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0] || url;
  }
}

/**
 * Get favicon URL for a domain with Google S2 service
 */
export function getFaviconUrl(url: string): string {
  const domain = extractDomain(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

/**
 * Clean up title generated from URL or domain
 */
export function getFallbackTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // Well known domains clean mapping
    const domainMap: Record<string, string> = {
      'github.com': 'GitHub',
      'google.com': 'Google',
      'aistudio.google.com': 'Google AI Studio',
      'youtube.com': 'YouTube',
      'bilibili.com': '哔哩哔哩 (Bilibili)',
      'v2ex.com': 'V2EX',
      'zhihu.com': '知乎',
      'sspai.com': '少数派 (sspai)',
      'juejin.cn': '稀土掘金',
      'notion.so': 'Notion',
      'figma.com': 'Figma',
      'dribbble.com': 'Dribbble',
      'huggingface.co': 'Hugging Face',
      'openai.com': 'OpenAI',
      'chatgpt.com': 'ChatGPT',
      'claude.ai': 'Claude',
      'tailwindcss.com': 'Tailwind CSS',
      'linear.app': 'Linear',
    };

    if (domainMap[host]) {
      if (pathParts.length > 0) {
        const lastPart = decodeURIComponent(pathParts[pathParts.length - 1]).replace(/[-_]/g, ' ');
        return `${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)} - ${domainMap[host]}`;
      }
      return domainMap[host];
    }

    // Capitalize domain prefix
    const domainPrefix = host.split('.')[0];
    const cleanHost = domainPrefix.charAt(0).toUpperCase() + domainPrefix.slice(1);

    if (pathParts.length > 0) {
      const lastPart = decodeURIComponent(pathParts[pathParts.length - 1]).replace(/[-_]/g, ' ');
      return `${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)} - ${cleanHost}`;
    }

    return cleanHost;
  } catch {
    return url;
  }
}

/**
 * Fetch webpage title with multi-strategy:
 * 1. Attempt rapid fetch via public CORS proxy with timeout
 * 2. Fall back to smart domain/path title parser
 */
export async function fetchWebpageTitle(url: string): Promise<{ title: string; source: 'fetched' | 'fallback' }> {
  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2600);

    // Use a lightweight CORS proxy to inspect HTML <title>
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.contents === 'string') {
        const titleMatch = data.contents.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const rawTitle = titleMatch[1].trim();
          // Unescape common HTML entities
          const decoded = rawTitle
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–');
          if (decoded.length > 0 && decoded.length < 150) {
            return { title: decoded, source: 'fetched' };
          }
        }
      }
    }
  } catch {
    // Network or CORS proxy timeout, gracefully fallback
  }

  return {
    title: getFallbackTitleFromUrl(targetUrl),
    source: 'fallback',
  };
}

export interface ParsedBatchItem {
  title: string;
  url: string;
  notes?: string;
  tags?: string[];
}

/**
 * Parse batch input containing multiple lines:
 * Formats supported:
 * 1. Markdown link: [Title](URL)
 * 2. CSV / comma separated: Title, URL or URL, Title
 * 3. Space / tab separated: URL Title or Title URL
 * 4. Plain URL: https://example.com
 */
export function parseBatchInput(text: string): ParsedBatchItem[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: ParsedBatchItem[] = [];

  for (const line of lines) {
    // 1. Markdown format: [Title](URL)
    const mdMatch = line.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i);
    if (mdMatch) {
      items.push({
        title: mdMatch[1].trim(),
        url: mdMatch[2].trim(),
      });
      continue;
    }

    // 2. Comma separated
    if (line.includes(',')) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        if (/^https?:\/\//i.test(parts[0])) {
          items.push({
            url: parts[0],
            title: parts[1] || getFallbackTitleFromUrl(parts[0]),
            notes: parts[2] || '',
          });
          continue;
        } else if (/^https?:\/\//i.test(parts[1])) {
          items.push({
            title: parts[0] || getFallbackTitleFromUrl(parts[1]),
            url: parts[1],
            notes: parts[2] || '',
          });
          continue;
        }
      }
    }

    // 3. Space separated
    const parts = line.split(/\s+/);
    if (parts.length > 1) {
      if (/^https?:\/\//i.test(parts[0])) {
        const url = parts[0];
        const title = parts.slice(1).join(' ');
        items.push({ url, title });
        continue;
      } else if (/^https?:\/\//i.test(parts[parts.length - 1])) {
        const url = parts[parts.length - 1];
        const title = parts.slice(0, -1).join(' ');
        items.push({ url, title });
        continue;
      }
    }

    // 4. Plain URL or line
    let cleanedUrl = line;
    if (!/^https?:\/\//i.test(cleanedUrl) && (cleanedUrl.includes('.') || cleanedUrl.startsWith('localhost'))) {
      cleanedUrl = `https://${cleanedUrl}`;
    }

    if (/^https?:\/\//i.test(cleanedUrl)) {
      items.push({
        url: cleanedUrl,
        title: getFallbackTitleFromUrl(cleanedUrl),
      });
    }
  }

  return items;
}

/**
 * Format relative time in Chinese
 */
export function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '从未访问';
  const diff = Date.now() - timestamp;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (3600 * 1000))} 小时前`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 3600 * 1000))} 天前`;
  if (diff < 30 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (7 * 24 * 3600 * 1000))} 周前`;
  
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
