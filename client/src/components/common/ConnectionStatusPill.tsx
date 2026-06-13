import { CONNECTION_STATUS_CONFIG } from "@constants/config";
import { PILL_SIZES } from "@constants/designTokens";

import StatusPill from "@components/common/StatusPill";

export interface ConnectionStatusPillProps {
  connected: boolean;
  size?: keyof typeof PILL_SIZES;
}

/** Active / inactive pill for platform connection status. */
export default function ConnectionStatusPill({ connected, size = "MD" }: ConnectionStatusPillProps) {
  const config = connected ? CONNECTION_STATUS_CONFIG.active : CONNECTION_STATUS_CONFIG.inactive;
  return <StatusPill label={config.label} className={config.className} size={size} />;
}
