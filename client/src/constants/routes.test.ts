import { describe, expect, it } from "vitest";

import { ROUTES, routeNeedsPosts } from "./routes";

describe("routes", () => {
  it("routeNeedsPosts is true for dashboard and editor paths", () => {
    expect(routeNeedsPosts(ROUTES.DASHBOARD)).toBe(true);
    expect(routeNeedsPosts(ROUTES.EDITOR)).toBe(true);
    expect(routeNeedsPosts(`${ROUTES.EDITOR}/abc123`)).toBe(true);
  });

  it("routeNeedsPosts is false for non-post routes", () => {
    expect(routeNeedsPosts(ROUTES.ANALYTICS)).toBe(false);
    expect(routeNeedsPosts(ROUTES.SETTINGS)).toBe(false);
    expect(routeNeedsPosts(ROUTES.LOGIN)).toBe(false);
  });
});
