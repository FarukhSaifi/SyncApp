import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { glassToastConfig, glassToastDefaults } from "@/src/components/GlassToast";

/** Global toast host with Liquid Glass cards. */
export function AppToast() {
  const insets = useSafeAreaInsets();

  return (
    <Toast
      config={glassToastConfig}
      topOffset={insets.top + 10}
      visibilityTime={glassToastDefaults.visibilityTime}
      swipeable={glassToastDefaults.swipeable}
    />
  );
}
