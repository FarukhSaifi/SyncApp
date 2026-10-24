import { useMemo } from "react";
import {
  Pressable,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { EDITOR_SHEET, OVERLAY, RADIUS, SETTINGS_LAYOUT, TYPOGRAPHY } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { ModalProps } from "@types";

export function Modal({ visible, title, onClose, children, footer, contentStyle }: ModalProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: OVERLAY.SCRIM,
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: EDITOR_SHEET.MAX_HEIGHT,
      height: "92%",
      backgroundColor: colors.card,
      borderTopLeftRadius: RADIUS.XL,
      borderTopRightRadius: RADIUS.XL,
      paddingTop: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.muted,
      alignSelf: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: TYPOGRAPHY.TITLE3.fontSize,
      fontWeight: TYPOGRAPHY.TITLE3.fontWeight,
      color: colors.foreground,
      textAlign: "left",
      marginBottom: 8,
      paddingHorizontal: SETTINGS_LAYOUT.PAGE_PADDING,
    },
    scroll: { flexGrow: 1 },
    content: { paddingHorizontal: SETTINGS_LAYOUT.PAGE_PADDING, paddingBottom: 8 },
    footer: {
      padding: SETTINGS_LAYOUT.PAGE_PADDING,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      gap: 8,
    },
  });
