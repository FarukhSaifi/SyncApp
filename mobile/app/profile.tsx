import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Card, CardContent, CardHeader } from "@/src/components/Card";
import { Input } from "@/src/components/Input";
import { PasswordInput } from "@/src/components/PasswordInput";
import { APP_CONFIG, DESCRIPTIONS, ERRORS, LABELS, PLACEHOLDERS } from "@/src/constants";
import { getBadgeStyles } from "@/src/constants/colorClasses";
import { BUTTON_VARIANTS, IOS26, RADIUS } from "@/src/constants/designTokens";
import { USER_ROLE_LABELS } from "@/src/constants/userRoles";
import { useAuth } from "@/src/contexts/AuthContext";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { toast } from "@/src/hooks/useToast";

export default function ProfileScreen() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const colors = useThemeColors();
  const badges = useMemo(() => getBadgeStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    bio: user?.bio ?? "",
    avatar: user?.avatar ?? "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || user?.username;
  const roleBadge = user?.role ? badges[user.role === "admin" ? "admin" : "primary"] : badges.primary;

  const saveProfile = async () => {
    setProfileLoading(true);
    try {
      await updateProfile(profile);
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(ERRORS.PASSWORDS_DO_NOT_MATCH);
      return;
    }
    if (passwords.newPassword.length < APP_CONFIG.VALIDATION_MIN_PASSWORD) {
      toast.error(ERRORS.PASSWORD_MIN_LENGTH);
      return;
    }
    setPasswordLoading(true);
    const result = await changePassword(passwords.currentPassword, passwords.newPassword);
    setPasswordLoading(false);
    if (result.success) {
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.accountCard}>
        <CardHeader title={LABELS.ACCOUNT_INFO} />
        <CardContent>
          <View style={styles.accountRow}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{(user?.username ?? "?").charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.accountMeta}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <Text style={styles.username}>@{user?.username}</Text>
              {user?.role ? (
                <View style={[styles.roleBadge, { backgroundColor: roleBadge.backgroundColor }]}>
                  <Text style={[styles.roleText, { color: roleBadge.color }]}>
                    {USER_ROLE_LABELS[user.role] ?? user.role}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.section}>
        <CardHeader title={LABELS.PROFILE} description={DESCRIPTIONS.PROFILE} />
        <CardContent>
          <Input
            label={LABELS.FIRST_NAME}
            value={profile.firstName}
            onChangeText={(v) => setProfile((p) => ({ ...p, firstName: v }))}
          />
          <Input
            label={LABELS.LAST_NAME}
            value={profile.lastName}
            onChangeText={(v) => setProfile((p) => ({ ...p, lastName: v }))}
          />
          <Input
            label={LABELS.BIO}
            value={profile.bio}
            onChangeText={(v) => setProfile((p) => ({ ...p, bio: v }))}
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
          <Input
            label={LABELS.AVATAR_URL}
            value={profile.avatar}
            onChangeText={(v) => setProfile((p) => ({ ...p, avatar: v }))}
            autoCapitalize="none"
          />
          <Button title={LABELS.SAVE} onPress={saveProfile} loading={profileLoading} />
        </CardContent>
      </Card>

      <Card style={styles.section}>
        <CardHeader title={LABELS.CHANGE_PASSWORD} />
        <CardContent>
          <PasswordInput
            label={LABELS.CURRENT_PASSWORD}
            value={passwords.currentPassword}
            onChangeText={(v) => setPasswords((p) => ({ ...p, currentPassword: v }))}
          />
          <PasswordInput
            label={LABELS.NEW_PASSWORD}
            value={passwords.newPassword}
            onChangeText={(v) => setPasswords((p) => ({ ...p, newPassword: v }))}
          />
          <PasswordInput
            label={LABELS.CONFIRM_PASSWORD}
            value={passwords.confirmPassword}
            onChangeText={(v) => setPasswords((p) => ({ ...p, confirmPassword: v }))}
            placeholder={PLACEHOLDERS.CONFIRM_PASSWORD}
          />
          <Button
            title={LABELS.CHANGE_PASSWORD}
            variant={BUTTON_VARIANTS.OUTLINE}
            onPress={savePassword}
            loading={passwordLoading}
          />
        </CardContent>
      </Card>

      <Button title={LABELS.LOGOUT} variant="danger" onPress={() => void logout()} style={styles.logout} />
      <Button
        title={LABELS.DASHBOARD}
        variant={BUTTON_VARIANTS.OUTLINE}
        onPress={() => router.back()}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.groupedBackground },
    content: { padding: IOS26.SCREEN_PADDING, paddingBottom: 40 },
    accountCard: { marginBottom: IOS26.GROUPED_GAP },
    section: { marginBottom: IOS26.GROUPED_GAP },
    accountRow: { flexDirection: "row", gap: 14, alignItems: "center" },
    avatarImage: { width: 72, height: 72, borderRadius: RADIUS.FULL },
    avatarFallback: {
      width: 72,
      height: 72,
      borderRadius: RADIUS.FULL,
      backgroundColor: `${colors.primary}26`,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetter: { fontSize: 28, fontWeight: "700", color: colors.primary },
    accountMeta: { flex: 1 },
    displayName: { fontSize: 20, fontWeight: "700", color: colors.foreground },
    email: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
    username: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
    roleBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.FULL,
      marginTop: 8,
    },
    roleText: { fontSize: 11, fontWeight: "600" },
    logout: { marginTop: 8 },
  });
