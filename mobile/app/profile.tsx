import { router } from "expo-router";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@components/Button";
import { Card, CardContent, CardHeader } from "@components/Card";
import { Input } from "@components/Input";
import { PasswordInput } from "@components/PasswordInput";
import { ScreenIntro } from "@components/ScreenIntro";
import { SettingsSectionNav } from "@components/settings/SettingsSectionNav";
import { StatusPill } from "@components/StatusPill";
import { APP_CONFIG, DESCRIPTIONS, ERRORS, LABELS, PLACEHOLDERS, PROFILE_SECTION_IDS } from "@constants";
import { BUTTON_VARIANTS, RADIUS, SETTINGS_LAYOUT } from "@constants/designTokens";
import { USER_ROLE_LABELS } from "@constants/userRoles";
import { useAuth } from "@contexts/AuthContext";
import { useThemeColors } from "@contexts/ThemeContext";
import { toast } from "@hooks/useToast";

export default function ProfileScreen() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionY = useRef<Record<string, number>>({});

  const [activeSectionId, setActiveSectionId] = useState<string>(PROFILE_SECTION_IDS.ACCOUNT);
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

  const sectionNavItems = useMemo(
    () => [
      { id: PROFILE_SECTION_IDS.ACCOUNT, label: LABELS.ACCOUNT_INFO },
      { id: PROFILE_SECTION_IDS.INFORMATION, label: LABELS.PROFILE },
      { id: PROFILE_SECTION_IDS.PASSWORD, label: LABELS.CHANGE_PASSWORD },
    ],
    [],
  );

  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const y = sectionY.current[sectionId];
    if (typeof y === "number") {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  };

  const onSectionLayout = (sectionId: string) => (event: { nativeEvent: { layout: { y: number } } }) => {
    sectionY.current[sectionId] = event.nativeEvent.layout.y;
  };

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
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <ScreenIntro title={LABELS.PROFILE} description={DESCRIPTIONS.PROFILE} />
      <SettingsSectionNav items={sectionNavItems} activeId={activeSectionId} onSelect={scrollToSection} />

      <View onLayout={onSectionLayout(PROFILE_SECTION_IDS.ACCOUNT)}>
        <Card>
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
                  <StatusPill
                    label={USER_ROLE_LABELS[user.role] ?? user.role}
                    tone={user.role === "admin" ? "warning" : "primary"}
                  />
                ) : null}
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View onLayout={onSectionLayout(PROFILE_SECTION_IDS.INFORMATION)}>
        <Card>
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
              style={styles.bioInput}
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
      </View>

      <View onLayout={onSectionLayout(PROFILE_SECTION_IDS.PASSWORD)}>
        <Card>
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
      </View>

      <Button title={LABELS.LOGOUT} variant="danger" onPress={() => void logout()} style={styles.logout} />
      <Button
        title={LABELS.DASHBOARD}
        variant={BUTTON_VARIANTS.OUTLINE}
        onPress={() => router.back()}
        style={styles.back}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.groupedBackground },
    content: {
      padding: SETTINGS_LAYOUT.PAGE_PADDING,
      paddingBottom: 40,
      gap: SETTINGS_LAYOUT.SECTION_GAP,
    },
    accountRow: { flexDirection: "row", gap: 14, alignItems: "center" },
    avatarImage: { width: 64, height: 64, borderRadius: RADIUS.FULL },
    avatarFallback: {
      width: 64,
      height: 64,
      borderRadius: RADIUS.FULL,
      backgroundColor: `${colors.primary}1a`,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetter: { fontSize: 24, fontWeight: "600", color: colors.primary },
    accountMeta: { flex: 1, gap: 2 },
    displayName: {
      fontSize: SETTINGS_LAYOUT.SECTION_TITLE_SIZE,
      fontWeight: SETTINGS_LAYOUT.SECTION_TITLE_WEIGHT,
      color: colors.foreground,
    },
    email: { fontSize: 14, color: colors.mutedForeground },
    username: { fontSize: 14, color: colors.mutedForeground },
    bioInput: { minHeight: 80, textAlignVertical: "top" },
    logout: { marginTop: 4 },
    back: { marginTop: 0 },
  });
