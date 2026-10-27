import type React from "react";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KEYBOARD_KEYS } from "@constants/designTokens";
import { INITIAL_EDITOR_FORM } from "@constants/editor";
import { SYNC_LABEL } from "@constants/messages";
import { PLATFORMS } from "@constants/platforms";
import { POST_STATUS } from "@constants/postStatus";

const getPost = vi.hoisted(() => vi.fn());
const createPost = vi.hoisted(() => vi.fn());
const updatePost = vi.hoisted(() => vi.fn());
const publish = vi.hoisted(() => vi.fn());
const downloadMdx = vi.hoisted(() => vi.fn());
const publishAll = vi.hoisted(() => vi.fn());
const request = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const routeParams = vi.hoisted(() => ({ id: undefined as string | undefined }));

vi.mock("next/navigation", () => ({
  useParams: () => (routeParams.id ? { id: routeParams.id } : {}),
  useRouter: () => ({ push: vi.fn(), replace }),
}));

const editorToast = {
  saveSuccess: vi.fn(),
  apiError: vi.fn(),
  validationError: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  publishSuccess: vi.fn(),
  publishError: vi.fn(),
  exportSuccess: vi.fn(),
  exportError: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => editorToast,
}));

vi.mock("@utils/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@utils/apiClient")>();
  return {
    ...mod,
    apiClient: {
      ...mod.apiClient,
      getPost: (...args: unknown[]) => getPost(...args),
      createPost: (...args: unknown[]) => createPost(...args),
      updatePost: (...args: unknown[]) => updatePost(...args),
      publish: (...args: unknown[]) => publish(...args),
      publishAll: (...args: unknown[]) => publishAll(...args),
      downloadMdx: (...args: unknown[]) => downloadMdx(...args),
      request: (...args: unknown[]) => request(...args),
    },
  };
});

import { useEditorState } from "./useEditorState";

describe("useEditorState", () => {
  beforeEach(() => {
    getPost.mockReset();
    createPost.mockReset();
    updatePost.mockReset();
    publish.mockReset();
    publishAll.mockReset();
    downloadMdx.mockReset();
    request.mockResolvedValue({
      success: true,
      data: [{ platform_name: PLATFORMS.DEVTO, configured: true }],
    });
    replace.mockReset();
  });

  it("creates a new draft on save", async () => {
    createPost.mockResolvedValue({
      success: true,
      data: { _id: "new-id", title: "T", status: POST_STATUS.DRAFT, slug: "t" },
    });

    const onPostCreate = vi.fn();
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate,
        onPostUpdate: vi.fn(),
      }),
    );

    act(() => {
      result.current.setFormData({ ...INITIAL_EDITOR_FORM, title: "My title", content_markdown: "Body" });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(createPost).toHaveBeenCalled();
    });
    expect(onPostCreate).toHaveBeenCalled();
  });

  it("loads existing post when id param is set", async () => {
    routeParams.id = "post-1";
    getPost.mockResolvedValue({
      success: true,
      data: {
        _id: "post-1",
        title: "Loaded",
        content_markdown: "X",
        status: POST_STATUS.DRAFT,
        tags: [],
      },
    });

    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(getPost).toHaveBeenCalledWith("post-1");
      expect(result.current.formData.title).toBe("Loaded");
    });
    routeParams.id = undefined;
  });

  it("shows validation when saving without title or content", async () => {
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(editorToast.validationError).toHaveBeenCalledWith(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
    expect(createPost).not.toHaveBeenCalled();
  });

  it("adds and removes tags", () => {
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    act(() => {
      result.current.setTagInput("#React");
    });
    act(() => {
      result.current.handleAddTag();
    });
    expect(result.current.tagList).toContain("react");

    act(() => {
      result.current.handleRemoveTag("react");
    });
    expect(result.current.tagList).not.toContain("react");
  });

  it("adds tag on Enter in tag input", () => {
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    act(() => {
      result.current.setTagInput("typescript");
    });
    act(() => {
      result.current.handleTagKeyDown({
        key: KEYBOARD_KEYS.ENTER,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>);
    });
    expect(result.current.tagList).toContain("typescript");
  });

  it("updates existing post on save when id param is set", async () => {
    routeParams.id = "post-99";
    updatePost.mockResolvedValue({
      success: true,
      data: {
        _id: "post-99",
        title: "Updated title",
        content_markdown: "Body",
        status: POST_STATUS.DRAFT,
        slug: "updated",
      },
    });

    getPost.mockResolvedValue({
      success: true,
      data: {
        _id: "post-99",
        title: "Loaded",
        content_markdown: "Body",
        status: POST_STATUS.DRAFT,
        tags: [],
      },
    });

    const onPostUpdate = vi.fn();
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate,
      }),
    );

    await waitFor(() => {
      expect(result.current.formData.title).toBe("Loaded");
    });

    act(() => {
      result.current.setFormData((prev) => ({ ...prev, title: "Updated title" }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(updatePost).toHaveBeenCalled();
      expect(onPostUpdate).toHaveBeenCalled();
    });

    routeParams.id = undefined;
  });

  it("blocks publish when platform is not connected", async () => {
    request.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    act(() => {
      result.current.setFormData({
        ...INITIAL_EDITOR_FORM,
        title: "Title",
        content_markdown: "Body",
      });
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.handlePublishToPlatform(PLATFORMS.DEVTO);
    });

    expect(editorToast.validationError).toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it("publishes to devto when connected and post exists", async () => {
    routeParams.id = "pub-1";
    getPost.mockResolvedValue({
      success: true,
      data: {
        _id: "pub-1",
        title: "Loaded",
        content_markdown: "Body",
        status: POST_STATUS.DRAFT,
        tags: [],
      },
    });
    updatePost.mockResolvedValue({
      success: true,
      data: { _id: "pub-1", title: "Loaded", content_markdown: "Body", status: POST_STATUS.DRAFT },
    });
    publish.mockResolvedValue({ success: true, message: "ok" });
    getPost.mockResolvedValue({
      success: true,
      data: {
        _id: "pub-1",
        title: "Loaded",
        content_markdown: "Body",
        status: POST_STATUS.PUBLISHED,
        tags: [],
      },
    });

    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.formData.title).toBe("Loaded");
    });

    await act(async () => {
      await result.current.handlePublishToPlatform(PLATFORMS.DEVTO);
    });

    await waitFor(() => {
      expect(publish).toHaveBeenCalledWith(PLATFORMS.DEVTO, "pub-1");
      expect(editorToast.publishSuccess).toHaveBeenCalled();
    });

    routeParams.id = undefined;
  });

  it("blocks MDX export without saved post id", async () => {
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleDownloadMdx();
    });

    expect(editorToast.validationError).toHaveBeenCalled();
    expect(downloadMdx).not.toHaveBeenCalled();
  });

  it("exports MDX when post id exists", async () => {
    routeParams.id = "export-1";
    downloadMdx.mockResolvedValue(undefined);
    getPost.mockResolvedValue({
      success: true,
      data: {
        _id: "export-1",
        title: "T",
        content_markdown: "Body",
        status: POST_STATUS.DRAFT,
        tags: [],
      },
    });

    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.formData.title).toBe("T");
    });

    await act(async () => {
      await result.current.handleDownloadMdx();
    });

    expect(downloadMdx).toHaveBeenCalledWith("export-1");
    expect(editorToast.exportSuccess).toHaveBeenCalled();
    routeParams.id = undefined;
  });

  it("publishes to all connected platforms", async () => {
    routeParams.id = "pub-all";
    getPost.mockResolvedValue({
      success: true,
      data: {
        _id: "pub-all",
        title: "T",
        content_markdown: "Body text",
        status: POST_STATUS.DRAFT,
        tags: ["a"],
      },
    });
    updatePost.mockResolvedValue({
      success: true,
      data: {
        _id: "pub-all",
        title: "T",
        content_markdown: "Body text",
        status: POST_STATUS.DRAFT,
        tags: ["a"],
      },
    });
    publishAll.mockResolvedValue({ success: true, data: { results: [] } });

    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.formData.title).toBe("T");
    });

    await act(async () => {
      await result.current.handlePublishToAll();
    });

    await waitFor(() => {
      expect(publishAll).toHaveBeenCalledWith("pub-all");
    });
    routeParams.id = undefined;
  });

  it("updates form fields via handleInputChange", async () => {
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleInputChange({
        target: { name: "title", value: "New title" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.title).toBe("New title");
  });

  it("toggles preview tab via togglePreview", () => {
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    expect(result.current.activeTab).toBe("edit");
    act(() => {
      result.current.togglePreview();
    });
    expect(result.current.activeTab).toBe("preview");
    act(() => {
      result.current.togglePreview();
    });
    expect(result.current.activeTab).toBe("edit");
  });

  it("updates arbitrary form fields via updateFormField", () => {
    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    act(() => {
      result.current.updateFormField("meta_description", "Better meta");
    });
    expect(result.current.formData.meta_description).toBe("Better meta");
  });

  it("saves schedule on existing post", async () => {
    routeParams.id = "sched-1";
    getPost.mockResolvedValue({
      success: true,
      data: {
        _id: "sched-1",
        title: "T",
        content_markdown: "Body",
        status: POST_STATUS.DRAFT,
        tags: [],
      },
    });
    updatePost.mockResolvedValue({
      success: true,
      data: {
        _id: "sched-1",
        title: "T",
        content_markdown: "Body",
        status: POST_STATUS.DRAFT,
        scheduled_for: new Date(Date.now() + 86400000).toISOString(),
        scheduled_platforms: [PLATFORMS.DEVTO],
      },
    });

    const { result } = renderHook(() =>
      useEditorState({
        onPostCreate: vi.fn(),
        onPostUpdate: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.formData.title).toBe("T");
    });

    const when = new Date(Date.now() + 86400000).toISOString();
    let ok = false;
    await act(async () => {
      ok = await result.current.handleScheduleSave(when, [PLATFORMS.DEVTO]);
    });

    expect(ok).toBe(true);
    expect(updatePost).toHaveBeenCalled();
    routeParams.id = undefined;
  });
});
