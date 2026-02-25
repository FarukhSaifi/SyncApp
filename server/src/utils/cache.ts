/**
 * In-memory caching utility with TTL support
 * Optimizes frequently accessed data
 */

import { DEFAULT_VALUES } from '../constants';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class Cache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private timers: Map<string, ReturnType<typeof setTimeout>>;

  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key: string, value: T, ttl: number = DEFAULT_VALUES.CACHE_TTL_DEFAULT_MS): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });

    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    return entry ? entry.value : undefined;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get or set pattern - fetch if not in cache
   * @param key - Cache key
   * @param fetchFn - Function to fetch data if not cached
   * @param ttl - Time to live in milliseconds
   */
  async getOrSet(key: string, fetchFn: () => Promise<T>, ttl: number = DEFAULT_VALUES.CACHE_TTL_DEFAULT_MS): Promise<T> {
    if (this.has(key)) {
      return this.get(key)!;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern - RegExp pattern to match keys
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.delete(key));
  }
}

export const cache = new Cache();

export const cacheKeys = {
  posts: {
    list: (userId: string, page: number, limit: number): string => `posts:list:${userId}:${page}:${limit}`,
    single: (id: string): string => `posts:single:${id}`,
    slug: (slug: string): string => `posts:slug:${slug}`,
    all: (): RegExp => /^posts:/,
  },
  credentials: {
    list: (): string => 'credentials:list',
    single: (platform: string): string => `credentials:${platform}`,
    all: (): RegExp => /^credentials:/,
  },
  user: {
    profile: (id: string): string => `user:profile:${id}`,
    all: (): RegExp => /^user:/,
  },
};
