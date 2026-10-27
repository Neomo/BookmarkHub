import { Bookmark } from '../types';

export type HealthStatus = 'unknown' | 'healthy' | 'warning' | 'error' | 'checking';

export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  responseTimeMs?: number;
  checkedAt: number;
}

/**
 * Validates bookmark URL accessibility in client browser environment.
 * Uses mode: 'no-cors' so cross-origin restrictions don't block domain reachability detection.
 * If server responds (opaque response), the endpoint is online (healthy).
 * If abort/timeout occurs (>5000ms), marked as warning/slow.
 * If fetch throws a network/DNS error, marked as error/unreachable.
 */
export async function checkBookmarkHealth(
  url: string,
  timeoutMs = 5000
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Basic format test
    new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return {
      status: 'error',
      message: '网址 URL 格式无效',
      checkedAt: Date.now(),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;

    return {
      status: 'healthy',
      message: `链接通畅，服务正常响应 (${responseTimeMs}ms)`,
      responseTimeMs,
      checkedAt: Date.now(),
    };
  } catch (err: any) {
    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;

    if (err.name === 'AbortError') {
      return {
        status: 'warning',
        message: `响应超时 (超过 ${timeoutMs / 1000}s)，服务响应缓慢或受限`,
        responseTimeMs,
        checkedAt: Date.now(),
      };
    }

    return {
      status: 'error',
      message: '无法建立连接 (DNS 错误、域名已失效或连接被拒绝)',
      responseTimeMs,
      checkedAt: Date.now(),
    };
  }
}

/**
 * Batch checks all bookmarks with concurrency limiting (up to 4 concurrent probes)
 */
export async function batchCheckBookmarksHealth(
  bookmarks: Bookmark[],
  onProgress?: (completed: number, total: number, current: Bookmark) => void
): Promise<Bookmark[]> {
  const results: Bookmark[] = [...bookmarks];
  const total = bookmarks.length;
  let completed = 0;

  // Process in batches of 4
  const CONCURRENCY = 4;
  for (let i = 0; i < total; i += CONCURRENCY) {
    const chunk = bookmarks.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (bm) => {
        const checkRes = await checkBookmarkHealth(bm.url);
        const index = results.findIndex((item) => item.id === bm.id);
        if (index !== -1) {
          results[index] = {
            ...results[index],
            healthStatus: checkRes.status,
            lastHealthCheckedAt: checkRes.checkedAt,
          };
        }
        completed++;
        onProgress?.(completed, total, bm);
      })
    );
  }

  return results;
}
