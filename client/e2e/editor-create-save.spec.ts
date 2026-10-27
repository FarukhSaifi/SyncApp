/**
 * Reference E2E — sign in → TipTap draft → save → assert list row.
 *
 * Steps:
 * 1. Intercept all `/api/**` calls so no real backend is required.
 * 2. Open `/login`, wait for hydration, fill email/password via data-testid, submit.
 * 3. From the dashboard, open New Post (data-testid).
 * 4. Enter a title and TipTap body, then click Save.
 * 5. After redirect to the dashboard, assert the post title appears in the list.
 *
 * Run: `cd client && npm run test:e2e -- e2e/editor-create-save.spec.ts`
 */
import { expect, test, type Page, type Route } from "@playwright/test";

import { ROUTES } from "../src/constants/routes";
import { TEST_IDS } from "../src/constants/testIds";

const MOCK_USER = {
  _id: "user-e2e-1",
  username: "e2e_author",
  email: "e2e@example.com",
  firstName: "E2E",
  lastName: "Author",
  role: "user" as const,
};

const MOCK_TOKEN = "e2e-mock-jwt";

const DOCUMENT_TITLE = "E2E TipTap Draft";
const DOCUMENT_BODY = "Hello from the mocked Playwright flow.";

type MockPost = {
  _id: string;
  id: string;
  title: string;
  content_markdown: string;
  status: "draft";
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  created_at: string;
  updated_at: string;
};

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

/** In-memory posts store shared across intercepted requests in this test. */
async function installApiMocks(page: Page): Promise<{ posts: MockPost[] }> {
  const store: { posts: MockPost[] } = { posts: [] };

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (method === "POST" && path.endsWith("/auth/login")) {
      await fulfillJson(route, 200, {
        success: true,
        data: { user: MOCK_USER, token: MOCK_TOKEN },
      });
      return;
    }

    if (method === "GET" && path.endsWith("/auth/me")) {
      await fulfillJson(route, 200, { success: true, data: MOCK_USER });
      return;
    }

    if (method === "GET" && /\/posts$/.test(path)) {
      await fulfillJson(route, 200, {
        success: true,
        data: store.posts,
        pagination: {
          page: 1,
          limit: 5,
          total: store.posts.length,
          totalPages: 1,
          pages: 1,
        },
        stats: {
          total: store.posts.length,
          published: 0,
          drafts: store.posts.length,
          scheduled: 0,
        },
      });
      return;
    }

    if (method === "POST" && /\/posts$/.test(path)) {
      const payload = request.postDataJSON() as { title?: string; content_markdown?: string };
      const now = new Date().toISOString();
      const id = `post-e2e-${store.posts.length + 1}`;
      const created: MockPost = {
        _id: id,
        id,
        title: payload.title || DOCUMENT_TITLE,
        content_markdown: payload.content_markdown || DOCUMENT_BODY,
        status: "draft",
        tags: [],
        author: MOCK_USER._id,
        createdAt: now,
        updatedAt: now,
        created_at: now,
        updated_at: now,
      };
      store.posts = [created, ...store.posts];
      await fulfillJson(route, 201, { success: true, data: created });
      return;
    }

    // Soft-fail anything else the shell may call (AI, credentials, analytics).
    await fulfillJson(route, 200, { success: true, data: null });
  });

  return store;
}

test.describe("editor create + save (mocked API)", () => {
  test("signs in, creates a TipTap document, saves, and sees it in the list", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await installApiMocks(page);
    await page.goto(ROUTES.LOGIN, { waitUntil: "domcontentloaded" });

    // Wait for SSR form, then hydration marker (React must bind before submit)
    await expect(page.getByTestId(TEST_IDS.LOGIN_EMAIL)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(`[data-testid="${TEST_IDS.LOGIN_FORM}"][data-hydrated="true"]`)).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId(TEST_IDS.LOGIN_READY)).toBeAttached({ timeout: 10_000 });

    // 2. Sign in
    await page.getByTestId(TEST_IDS.LOGIN_EMAIL).fill("e2e@example.com");
    await page.getByTestId(TEST_IDS.LOGIN_PASSWORD).fill("password123");
    await page.getByTestId(TEST_IDS.LOGIN_SUBMIT).click();

    await expect(page).toHaveURL(ROUTES.DASHBOARD, { timeout: 30_000 });
    await expect(page.getByTestId(TEST_IDS.DASHBOARD_NEW_POST)).toBeVisible();

    // 3. New document
    await page.getByTestId(TEST_IDS.DASHBOARD_NEW_POST).click();
    await expect(page).toHaveURL(ROUTES.EDITOR);

    // 4. Title + TipTap body, then save (draft create redirects to dashboard)
    await page.getByTestId(TEST_IDS.EDITOR_TITLE).fill(DOCUMENT_TITLE);
    const proseMirror = page.getByTestId(TEST_IDS.EDITOR_CONTENT).locator(".ProseMirror");
    await expect(proseMirror).toBeVisible();
    await proseMirror.click();
    await page.keyboard.type(DOCUMENT_BODY);
    await page.getByTestId(TEST_IDS.EDITOR_SAVE).click();

    // 5. List shows the saved title
    await expect(page).toHaveURL(ROUTES.DASHBOARD);
    await expect(page.getByTestId(TEST_IDS.DASHBOARD_POST_LIST)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.POST_ROW).filter({ hasText: DOCUMENT_TITLE })).toBeVisible();
  });
});
