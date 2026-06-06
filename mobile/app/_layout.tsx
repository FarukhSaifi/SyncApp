import { HeaderActionSlot } from "@/src/components/AppHeaderActions";
import { AppToast } from "@/src/components/AppToast";
import { IconHeaderButton } from "@/src/components/IconHeaderButton";
import { LoadingScreen } from "@/src/components/LoadingScreen";
import { LABELS, ROUTES } from "@/src/constants";
import { HEADER_ICON_BUTTON } from "@/src/constants/designTokens";
import { stackHeaderOptions } from "@/src/constants/layout";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const { isDark, colors } = useTheme();
  const segments = useSegments();
  const header = stackHeaderOptions(colors);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace(ROUTES.LOGIN);
    } else if (isAuthenticated && inAuth) {
      router.replace(ROUTES.TABS);
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.groupedBackground },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="editor" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            title: LABELS.PROFILE,
            presentation: "modal",
            gestureEnabled: true,
            ...header,
            headerLeft: () => (
              <HeaderActionSlot edge="left">
                <IconHeaderButton accessibilityLabel={LABELS.CANCEL} onPress={() => router.back()}>
                  <Ionicons name="close" size={HEADER_ICON_BUTTON.PROFILE_ICON_SIZE} color={colors.primary} />
                </IconHeaderButton>
              </HeaderActionSlot>
            ),
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
        <AppToast />
      </AuthProvider>
    </ThemeProvider>
  );
}
