import { EDITOR_CONFIG } from "@/src/constants/editor";

/** React Native Image does not render SVG data URLs; use react-native-svg instead. */
export function isSvgDataUrl(uri: string): boolean {
  return /^data:image\/svg\+xml/i.test(uri.trim());
}

export function decodeSvgXmlFromDataUrl(dataUrl: string): string | null {
  const trimmed = dataUrl.trim();
  const base64Match = trimmed.match(/^data:image\/svg\+xml(?:;charset=utf-8)?;base64,(.+)$/i);
  if (base64Match) {
    try {
      return atob(base64Match[1]);
    } catch {
      return null;
    }
  }
  const utf8Match = trimmed.match(/^data:image\/svg\+xml(?:;charset=utf-8)?,(.+)$/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return null;
    }
  }
  return null;
}

export function isPlaceholderImageDataUrl(uri: string): boolean {
  return isSvgDataUrl(uri) && uri.length < EDITOR_CONFIG.PLACEHOLDER_SVG_MAX_LENGTH;
}
