import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Cache, cacheKeys } from "./cache";

describe("Cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves values", () => {
    const cache = new Cache<string>();
    cache.set("k", "v", 0);
    expect(cache.get("k")).toBe("v");
    expect(cache.has("k")).toBe(true);
    expect(cache.size()).toBe(1);
  });

  it("expires entries after TTL", () => {
    const cache = new Cache<number>();
    cache.set("ttl", 42, 1000);
    vi.advanceTimersByTime(1001);
    expect(cache.get("ttl")).toBeUndefined();
    expect(cache.has("ttl")).toBe(false);
  });

  it("getOrSet fetches once then serves cache", async () => {
    const cache = new Cache<string>();
    const fetchFn = vi.fn(async () => "fetched");
    const first = await cache.getOrSet("key", fetchFn, 0);
    const second = await cache.getOrSet("key", fetchFn, 0);
    expect(first).toBe("fetched");
    expect(second).toBe("fetched");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("invalidatePattern removes matching keys", () => {
    const cache = new Cache<string>();
    cache.set("posts:list:u1:1:10:", "a", 0);
    cache.set("posts:stats:u1", "b", 0);
    cache.set("user:profile:u1", "c", 0);
    cache.invalidatePattern(cacheKeys.posts.all());
    expect(cache.has("posts:list:u1:1:10:")).toBe(false);
    expect(cache.has("posts:stats:u1")).toBe(false);
    expect(cache.has("user:profile:u1")).toBe(true);
  });
});
