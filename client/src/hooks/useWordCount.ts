/**
 * useWordCount — Computes word count, char count, and estimated reading time.
 * Debounced so the editor stays responsive during rapid typing.
 */
import { useEffect, useState } from "react";

import { EDITOR_DEBOUNCE_MS, READING_SPEED_WPM } from "@constants/editor";
import type { WordCountStats } from "@types";

import { useDebounce } from "./useDebounce";

/** Strip HTML tags from content */
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function useWordCount(content: string): WordCountStats {
  const debouncedContent = useDebounce(content, EDITOR_DEBOUNCE_MS);
  const [stats, setStats] = useState<WordCountStats>({
    words: 0,
    characters: 0,
    readingTimeMinutes: 0,
  });

  useEffect(() => {
    const plain = stripHtml(debouncedContent);
    const chars = plain.length;
    const wordArray = plain.split(/\s+/).filter(Boolean);
    const wordCount = wordArray.length;
    const readingTime = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / READING_SPEED_WPM)) : 0;

    setStats({ words: wordCount, characters: chars, readingTimeMinutes: readingTime });
  }, [debouncedContent]);

  return stats;
}
