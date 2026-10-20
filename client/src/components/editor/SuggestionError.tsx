"use client";

import type { SuggestionErrorProps } from "@types";

export default function SuggestionError({ message }: SuggestionErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-[11px] text-destructive"
    >
      {message}
    </div>
  );
}
