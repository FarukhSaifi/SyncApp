/**
 * Editor-related constants: initial form state and Quill config.
 * Keeps magic values out of Editor.jsx and makes tuning easier.
 */
export const INITIAL_EDITOR_FORM = Object.freeze({
  title: "",
  content_markdown: "",
  status: "draft",
  cover_image: "",
  canonical_url: "",
});

export const QUILL_MODULES = Object.freeze({
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image", "code-block"],
    ["clean"],
  ],
});

export const SCROLL_TO_TOP_THRESHOLD = 300;
