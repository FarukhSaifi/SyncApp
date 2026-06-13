import type { ConnectionStatusPillProps } from "@types";

import { CONNECTION_STATUS_CONFIG } from "@constants/config";

import StatusPill from "@components/common/StatusPill";

/** Active / inactive pill for platform connection status. */
export default function ConnectionStatusPill({ connected, size = "MD" }: ConnectionStatusPillProps) {
  const config = connected ? CONNECTION_STATUS_CONFIG.active : CONNECTION_STATUS_CONFIG.inactive;
  return <StatusPill label={config.label} className={config.className} size={size} />;
}
