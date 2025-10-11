/**
 * In-memory caching utility with TTL support
 * Optimizes frequently accessed data
 */

class Cache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 300000) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });

    // Set expiration timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    const entry = this.cache.get(key);
    return entry ? entry.value : undefined;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get or set pattern - fetch if not in cache
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<*>}
   */
  async getOrSet(key, fetchFn, ttl = 300000) {
    if (this.has(key)) {
      return this.get(key);
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param {RegExp} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.delete(key));
  }
}

// Singleton instance
const cache = new Cache();

// Cache key builders
const cacheKeys = {
  posts: {
    list: (userId, page, limit) => `posts:list:${userId}:${page}:${limit}`,
    single: (id) => `posts:single:${id}`,
    slug: (slug) => `posts:slug:${slug}`,
    all: () => /^posts:/,
  },
  credentials: {
    list: () => "credentials:list",
    single: (platform) => `credentials:${platform}`,
    all: () => /^credentials:/,
  },
  user: {
    profile: (id) => `user:profile:${id}`,
    all: () => /^user:/,
  },
};

module.exports = {
  cache,
  cacheKeys,
  Cache,
};

