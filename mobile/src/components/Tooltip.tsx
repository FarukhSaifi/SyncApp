import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { OVERLAY, RADIUS, TOOLTIP_UI } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { TooltipProps } from "@types";

/**
 * Mobile tooltip (desktop hover/focus parity).
 * - `openOn="press"`: tap trigger to open (tag overflow).
 * - `openOn="longPress"`: long-press opens tip; optional `onPress` still fires on tap.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  accessibilityLabel,
  openOn = "press",
  onPress,
}: TooltipProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  const show = useCallback(() => {
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

  const handlePress = useCallback(() => {
    if (openOn === "press") {
      show();
      return;
    }
    onPress?.();
  }, [openOn, onPress, show]);

  const handleLongPress = useCallback(() => {
    if (openOn === "longPress") {
      show();
    }
  }, [openOn, show]);

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={handlePress}
        onLongPress={openOn === "longPress" ? handleLongPress : undefined}
        delayLongPress={350}
        style={styles.trigger}
      >
        {children}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={hide}>
        <Pressable style={styles.scrim} onPress={hide} accessibilityLabel={accessibilityLabel}>
          <View style={styles.center} pointerEvents="box-none">
            <Pressable style={[styles.panel, side === "bottom" ? styles.panelBottom : styles.panelTop]} onPress={hide}>
              {content as ReactNode}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    root: {
      position: "relative",
      alignSelf: "flex-start",
      maxWidth: "100%",
    },
    trigger: {
      maxWidth: "100%",
    },
    scrim: {
      flex: 1,
      backgroundColor: OVERLAY.SCRIM,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    center: {
      maxWidth: TOOLTIP_UI.MAX_WIDTH,
      width: "100%",
      alignItems: "center",
    },
    panel: {
      maxWidth: TOOLTIP_UI.MAX_WIDTH,
      width: "100%",
      borderRadius: RADIUS.MD,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: TOOLTIP_UI.PANEL_PADDING_X,
      paddingVertical: TOOLTIP_UI.PANEL_PADDING_Y,
      zIndex: TOOLTIP_UI.Z_INDEX,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    panelTop: {},
    panelBottom: {},
  });
