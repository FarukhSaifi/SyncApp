import { Link, Stack } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LABELS, ROUTES } from "@/src/constants";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export default function NotFoundScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <Stack.Screen options={{ title: LABELS.NOT_FOUND_TITLE }} />
      <View style={styles.container}>
        <Text style={styles.title}>{LABELS.NOT_FOUND_MESSAGE}</Text>
        <Link href={ROUTES.TABS} style={styles.link}>
          <Text style={styles.linkText}>{LABELS.NOT_FOUND_CTA}</Text>
        </Link>
      </View>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: colors.background,
    },
    title: { fontSize: 20, fontWeight: "600", color: colors.foreground },
    link: { marginTop: 15, paddingVertical: 15 },
    linkText: { fontSize: 14, color: colors.primary, fontWeight: "500" },
  });
