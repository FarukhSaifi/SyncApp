import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { getBadgeStyles } from "@constants/colorClasses";
import { BUTTON_VARIANTS, RADIUS, SETTINGS_LAYOUT } from "@constants/designTokens";
import { LABELS } from "@constants/messages";
import { USER_ROLES, USER_ROLE_LABELS } from "@constants/userRoles";
import { useThemeColors } from "@contexts/ThemeContext";
import type { UserCardProps } from "@types";
import { formatDateTime, formatLastLogin } from "@utils/dateUtils";

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const badges = useMemo(() => getBadgeStyles(colors), [colors]);
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
  const isAdmin = user.role === USER_ROLES.ADMIN;
  const roleBadge = isAdmin ? badges.admin : badges.primary;
  const verifiedBadge = user.isVerified ? badges.verified : badges.unverified;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.meta}>@{user.username}</Text>
          <Text style={styles.meta}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: roleBadge.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: roleBadge.color }]}>{USER_ROLE_LABELS[user.role] ?? user.role}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: verifiedBadge.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: verifiedBadge.color }]}>
            {user.isVerified ? LABELS.VERIFIED : LABELS.UNVERIFIED}
          </Text>
        </View>
      </View>

      <View style={styles.dates}>
        <Text style={styles.dateLine}>
          {LABELS.JOINED}: {formatDateTime(user.createdAt)}
        </Text>
        {user.updatedAt ? (
          <Text style={styles.dateLine}>
            {LABELS.UPDATED}: {formatDateTime(user.updatedAt)}
          </Text>
        ) : null}
        <Text style={styles.dateLine}>
          {LABELS.LAST_LOGIN}: {formatLastLogin(user.lastLogin)}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title={LABELS.EDIT} variant={BUTTON_VARIANTS.OUTLINE} size="sm" onPress={onEdit} style={styles.btn} />
        <Button title={LABELS.DELETE} variant="danger" size="sm" onPress={onDelete} style={styles.btn} />
      </View>
    </Card>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    card: { marginBottom: SETTINGS_LAYOUT.CARD_GAP },
    header: { flexDirection: "row", gap: 12, marginBottom: SETTINGS_LAYOUT.CARD_GAP },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.FULL,
      backgroundColor: `${colors.primary}26`,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 20, fontWeight: "700", color: colors.primary },
    headerText: { flex: 1 },
    name: { fontSize: 17, fontWeight: "600", color: colors.foreground },
    meta: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.FULL },
    badgeText: { fontSize: 11, fontWeight: "600" },
    dates: { gap: 4, marginBottom: 12 },
    dateLine: { fontSize: 13, color: colors.mutedForeground },
    actions: {
      flexDirection: "row",
      gap: 8,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    btn: { flex: 1 },
  });
