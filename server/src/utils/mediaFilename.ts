import createSlug from "slugify";
import { STRING_LIMITS } from "../constants/validation";

/** Safe path segment from slug or title — no path chars, lowercase. */
export function slugifyMediaName(value?: string | null, fallback = "post"): string {
  const raw = (value || "").trim();
  const slug =
    createSlug(raw, {
      lower: true,
      strict: true,
      trim: true,
      locale: "en",
    }).slice(0, STRING_LIMITS.POST_SLUG_MAX) || fallback;
  return (
    slug
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || fallback
  );
}

/**
 * Prefer post slug, else slugified title, else post id — for cover/inline storage names.
 */
export function resolvePostMediaSlug(opts: {
  slug?: string | null;
  title?: string | null;
  postId?: string | null;
}): string {
  if (opts.slug?.trim()) return slugifyMediaName(opts.slug);
  if (opts.title?.trim()) return slugifyMediaName(opts.title);
  if (opts.postId?.trim()) return slugifyMediaName(opts.postId, "post");
  return "post";
}

/** e.g. cover-how-to-optimize-react.png */
export function buildCoverFilename(opts: {
  slug?: string | null;
  title?: string | null;
  postId?: string | null;
  ext: string;
}): string {
  const base = resolvePostMediaSlug(opts);
  const ext = (opts.ext || "png").replace(/[^a-z0-9]/gi, "") || "png";
  return `cover-${base}.${ext}`;
}

/** e.g. inline-how-to-optimize-react-1.png */
export function buildInlineImageFilename(opts: {
  slug?: string | null;
  title?: string | null;
  postId?: string | null;
  index: number;
  ext: string;
}): string {
  const base = resolvePostMediaSlug(opts);
  const ext = (opts.ext || "png").replace(/[^a-z0-9]/gi, "") || "png";
  return `inline-${base}-${opts.index}.${ext}`;
}
