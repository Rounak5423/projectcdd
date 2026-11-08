/**
 * CIVORA — Client-Side API Request Deduplicator & Memory Cache
 * 
 * Prevents redundant in-flight HTTP requests and caches stable GET queries
 * with short-lived TTLs to eliminate network round-trip overhead and browser lag.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();

  /**
   * Deduplicates concurrent requests for the same key and caches the result for ttlMs.
   */
  public async deduplicate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 4000
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    // If an identical request is already in-flight, reuse its promise
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const promise = fetcher()
      .then((data) => {
        if (ttlMs > 0) {
          this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
        }
        return data;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Invalidates specific cache keys or all keys matching a prefix.
   */
  public invalidate(prefix?: string) {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCacheManager();
