import { StatusPill } from "@components/StatusPill";
import { LABELS } from "@constants/messages";
import type { ConnectionStatusPillProps } from "@types";

/** Platform connection status — parity with web ConnectionStatusPill. */
export function ConnectionStatusPill({ connected, saved = false }: ConnectionStatusPillProps) {
  if (saved) {
    return <StatusPill label={LABELS.SAVE} tone="primary" />;
  }
  if (connected) {
    return <StatusPill label={LABELS.CONNECTED} tone="positive" />;
  }
  return <StatusPill label={LABELS.NOT_CONNECTED} tone="muted" />;
}
