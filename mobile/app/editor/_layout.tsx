import { Stack } from "expo-router";
import { Platform } from "react-native";

import { AppHeaderRight } from "@/src/components/AppHeaderActions";
import { LABELS } from "@/src/constants";
import { editorProfileHeaderOptions, tabScreenOptions } from "@/src/constants/layout";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export default function EditorLayout() {
  const colors = useThemeColors();
  const header = tabScreenOptions(colors);
  const profileHeader = <AppHeaderRight />;

  return (
    <Stack
      screenOptions={{
        ...header,
        headerShown: true,
        title: LABELS.NEW_POST,
        ...editorProfileHeaderOptions(profileHeader),
        headerBackButtonDisplayMode: Platform.OS === "ios" ? "minimal" : "default",
        headerBackTitle: LABELS.DASHBOARD,
      }}
    >
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="generate-image"
        options={{ title: LABELS.GENERATE_IMAGE, presentation: "modal", headerRight: () => null }}
      />
    </Stack>
  );
}
