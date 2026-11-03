import { EventEmitter } from "node:events";

import { describe, expect, it, vi } from "vitest";

vi.mock("node:https", () => ({
  default: {
    get: vi.fn((_url: string, _opts: unknown, cb: (res: EventEmitter) => void) => {
      const res = new EventEmitter();
      process.nextTick(() => {
        cb(res);
        res.emit("data", JSON.stringify(["query", ["syncapp seo", "syncapp test"]]));
        res.emit("end");
      });
      const req = new EventEmitter();
      return req;
    }),
  },
}));

import { fetchGoogleSearchSuggestions } from "./googleSuggest";

describe("fetchGoogleSearchSuggestions", () => {
  it("parses suggestion array from Google response", async () => {
    const suggestions = await fetchGoogleSearchSuggestions("syncapp");
    expect(suggestions).toEqual(["syncapp seo", "syncapp test"]);
  });
});
