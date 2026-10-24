import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@components/Button";
import { Card, CardContent, CardHeader } from "@components/Card";
import { ConnectionStatusPill } from "@components/ConnectionStatusPill";
import { Input } from "@components/Input";
import { PasswordInput } from "@components/PasswordInput";
import { ScreenIntro } from "@components/ScreenIntro";
import { SettingsSectionNav } from "@components/settings/SettingsSectionNav";
import { APP_CONFIG, DESCRIPTIONS, ERRORS, EXTERNAL_LINKS, LABELS, SETTINGS_SECTION_IDS, TOAST } from "@constants";
import { BUTTON_VARIANTS, SETTINGS_LAYOUT } from "@constants/designTokens";
import { PLATFORM_DISPLAY_NAMES, PLATFORMS, type PlatformSlug } from "@constants/platforms";
import { useThemeColors } from "@contexts/ThemeContext";
import { useTabBarInset } from "@hooks/useTabBarInset";
import { toast } from "@hooks/useToast";
import { apiClient } from "@services/apiClient";
import { isCredentialConnected } from "@utils/credentials";

export default function SettingsScreen() {
  const colors = useThemeColors();
  const tabBarInset = useTabBarInset();
  const styles = useMemo(() => createStyles(colors, tabBarInset), [colors, tabBarInset]);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionY = useRef<Record<string, number>>({});

  const [activeSectionId, setActiveSectionId] = useState<string>(SETTINGS_SECTION_IDS.MEDIUM);
  const [mediumKey, setMediumKey] = useState("");
  const [devtoKey, setDevtoKey] = useState("");
  const [devtoUser, setDevtoUser] = useState("");
  const [wpKey, setWpKey] = useState("");
  const [wpUrl, setWpUrl] = useState("");
  const [connected, setConnected] = useState<Record<PlatformSlug, boolean>>({
    medium: false,
    devto: false,
    wordpress: false,
    linkedin: false,
  });
  const [savedFlash, setSavedFlash] = useState<Record<PlatformSlug, boolean>>({
    medium: false,
    devto: false,
    wordpress: false,
    linkedin: false,
  });
  const [saving, setSaving] = useState<PlatformSlug | null>(null);
  const [showKeys, setShowKeys] = useState<Record<PlatformSlug, boolean>>({
    medium: false,
    devto: false,
    wordpress: false,
    linkedin: false,
  });

  const sectionNavItems = useMemo(
    () => [
      { id: SETTINGS_SECTION_IDS.MEDIUM, label: PLATFORM_DISPLAY_NAMES[PLATFORMS.MEDIUM] },
      { id: SETTINGS_SECTION_IDS.DEVTO, label: PLATFORM_DISPLAY_NAMES[PLATFORMS.DEVTO] },
      { id: SETTINGS_SECTION_IDS.WORDPRESS, label: PLATFORM_DISPLAY_NAMES[PLATFORMS.WORDPRESS] },
      { id: SETTINGS_SECTION_IDS.LINKEDIN, label: PLATFORM_DISPLAY_NAMES[PLATFORMS.LINKEDIN] },
      { id: SETTINGS_SECTION_IDS.HELP, label: LABELS.HELP_SUPPORT },
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

  useEffect(() => {
    void (async () => {
      try {
        const [m, d, w, l] = await Promise.all([
          apiClient.getCredential(PLATFORMS.MEDIUM),
          apiClient.getCredential(PLATFORMS.DEVTO),
          apiClient.getCredential(PLATFORMS.WORDPRESS),
          apiClient.getCredential(PLATFORMS.LINKEDIN),
        ]);
        if (m.success && m.data) {
          // Server returns masked keys only — leave input empty for re-entry.
          const cred = m.data as { configured?: boolean; decrypt_failed?: boolean };
          setMediumKey("");
          setConnected((c) => ({
            ...c,
            medium: isCredentialConnected(cred),
          }));
        }
        if (d.success && d.data) {
          const cred = d.data as {
            configured?: boolean;
            decrypt_failed?: boolean;
            platform_config?: { devto_username?: string };
          };
          setDevtoKey("");
          setDevtoUser(cred.platform_config?.devto_username ?? "");
          setConnected((c) => ({ ...c, devto: isCredentialConnected(cred) }));
        }
        if (w.success && w.data) {
          const cred = w.data as { configured?: boolean; decrypt_failed?: boolean; site_url?: string };
          setWpKey("");
          setWpUrl(cred.site_url ?? "");
          setConnected((c) => ({ ...c, wordpress: isCredentialConnected(cred) }));
        }
        if (l.success && l.data) {
          setConnected((c) => ({
            ...c,
            linkedin: isCredentialConnected(l.data as { configured?: boolean }),
          }));
        }
      } catch {
        /* credentials may not exist yet */
      }
    })();
  }, []);

  const flashSaved = (platform: PlatformSlug) => {
    setSavedFlash((s) => ({ ...s, [platform]: true }));
    setConnected((c) => ({ ...c, [platform]: true }));
    setTimeout(() => setSavedFlash((s) => ({ ...s, [platform]: false })), APP_CONFIG.SAVED_TOAST_DURATION_MS);
  };

  const save = async (platform: PlatformSlug, apiPlatform: string, body: Record<string, unknown>) => {
    setSaving(platform);
    try {
      const res = await apiClient.upsertCredential(apiPlatform, body);
      if (res.success) {
        toast.success(TOAST.CREDENTIALS_SAVED);
        flashSaved(platform);
      } else {
        toast.error(res.error ?? ERRORS.SAVE_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.error(ERRORS.OPEN_LINK_FAILED);
    }
  };

  const connectLinkedIn = async () => {
    setSaving("linkedin");
    try {
      const res = await apiClient.getLinkedInOAuthStart();
      if (res.success && res.data?.url) {
        await openLink(res.data.url);
      } else {
        toast.error(res.error ?? ERRORS.OPEN_LINK_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const disconnectLinkedIn = async () => {
    setSaving("linkedin");
    try {
      const res = await apiClient.deleteCredential(PLATFORMS.LINKEDIN);
      if (res.success) {
        setConnected((c) => ({ ...c, linkedin: false }));
        toast.success(TOAST.LINKEDIN_DISCONNECTED);
      } else {
        toast.error(res.error ?? ERRORS.SAVE_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <View collapsable={false} style={styles.shell}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenIntro title={LABELS.SETTINGS} description={LABELS.SETTINGS_INTRO} />
        <SettingsSectionNav items={sectionNavItems} activeId={activeSectionId} onSelect={scrollToSection} />

        <View onLayout={onSectionLayout(SETTINGS_SECTION_IDS.MEDIUM)}>
          <PlatformCard
            title={LABELS.MEDIUM}
            description={DESCRIPTIONS.MEDIUM_SETUP}
            connected={connected.medium}
            saved={savedFlash.medium}
            onOpenDoc={() => void openLink(EXTERNAL_LINKS.MEDIUM_SETTINGS)}
            styles={styles}
            colors={colors}
          >
            <CredentialField
              label={LABELS.API_KEY}
              value={mediumKey}
              onChangeText={setMediumKey}
              secure={!showKeys.medium}
              onToggleSecure={() => setShowKeys((s) => ({ ...s, medium: !s.medium }))}
              colors={colors}
            />
            <Button
              title={LABELS.SAVE_CREDENTIALS}
              onPress={() => save("medium", PLATFORMS.MEDIUM, { api_key: mediumKey })}
              loading={saving === "medium"}
            />
          </PlatformCard>
        </View>

        <View onLayout={onSectionLayout(SETTINGS_SECTION_IDS.DEVTO)}>
          <PlatformCard
            title={LABELS.DEVTO}
            description={DESCRIPTIONS.DEVTO_SETUP}
            connected={connected.devto}
            saved={savedFlash.devto}
            onOpenDoc={() => void openLink(EXTERNAL_LINKS.DEVTO_SETTINGS)}
            styles={styles}
            colors={colors}
          >
            <CredentialField
              label={LABELS.API_KEY}
              value={devtoKey}
              onChangeText={setDevtoKey}
              secure={!showKeys.devto}
              onToggleSecure={() => setShowKeys((s) => ({ ...s, devto: !s.devto }))}
              colors={colors}
            />
            <Input label={LABELS.DEVTO_USERNAME} value={devtoUser} onChangeText={setDevtoUser} autoCapitalize="none" />
            <Button
              title={LABELS.SAVE_CREDENTIALS}
              onPress={() =>
                save("devto", PLATFORMS.DEVTO, {
                  api_key: devtoKey,
                  platform_config: { devto_username: devtoUser },
                })
              }
              loading={saving === "devto"}
            />
          </PlatformCard>
        </View>

        <View onLayout={onSectionLayout(SETTINGS_SECTION_IDS.WORDPRESS)}>
          <PlatformCard
            title={LABELS.WORDPRESS}
            description={DESCRIPTIONS.WORDPRESS_SETUP}
            connected={connected.wordpress}
            saved={savedFlash.wordpress}
            onOpenDoc={() => void openLink(EXTERNAL_LINKS.WORDPRESS_JWT_PLUGIN)}
            styles={styles}
            colors={colors}
          >
            <Input label={LABELS.SITE_URL} value={wpUrl} onChangeText={setWpUrl} autoCapitalize="none" />
            <CredentialField
              label={LABELS.API_KEY}
              value={wpKey}
              onChangeText={setWpKey}
              secure={!showKeys.wordpress}
              onToggleSecure={() => setShowKeys((s) => ({ ...s, wordpress: !s.wordpress }))}
              colors={colors}
            />
            <Button
              title={LABELS.SAVE_CREDENTIALS}
              onPress={() =>
                save("wordpress", PLATFORMS.WORDPRESS, {
                  api_key: wpKey,
                  site_url: wpUrl,
                })
              }
              loading={saving === "wordpress"}
            />
          </PlatformCard>
        </View>

        <View onLayout={onSectionLayout(SETTINGS_SECTION_IDS.LINKEDIN)}>
          <PlatformCard
            title={LABELS.LINKEDIN}
            description={DESCRIPTIONS.LINKEDIN_SETUP}
            connected={connected.linkedin}
            saved={savedFlash.linkedin}
            onOpenDoc={() => void openLink(EXTERNAL_LINKS.LINKEDIN_DEVELOPER)}
            styles={styles}
            colors={colors}
          >
            {connected.linkedin ? (
              <Button
                title={LABELS.DISCONNECT}
                variant={BUTTON_VARIANTS.OUTLINE}
                onPress={disconnectLinkedIn}
                loading={saving === "linkedin"}
              />
            ) : (
              <Button title={LABELS.CONNECT_LINKEDIN} onPress={connectLinkedIn} loading={saving === "linkedin"} />
            )}
          </PlatformCard>
        </View>

        <View onLayout={onSectionLayout(SETTINGS_SECTION_IDS.HELP)}>
          <Card style={styles.sectionCard}>
            <CardHeader title={LABELS.HELP_SUPPORT} />
            <CardContent>
              <HelpLink
                label={LABELS.HELP_MEDIUM_SETTINGS}
                onPress={() => void openLink(EXTERNAL_LINKS.MEDIUM_SETTINGS)}
                colors={colors}
              />
              <HelpLink
                label={LABELS.HELP_DEVTO_SETTINGS}
                onPress={() => void openLink(EXTERNAL_LINKS.DEVTO_SETTINGS)}
                colors={colors}
              />
              <HelpLink
                label={LABELS.HELP_WORDPRESS_JWT}
                onPress={() => void openLink(EXTERNAL_LINKS.WORDPRESS_JWT_PLUGIN)}
                colors={colors}
              />
              <HelpLink
                label={LABELS.HELP_LINKEDIN_DEVELOPERS}
                onPress={() => void openLink(EXTERNAL_LINKS.LINKEDIN_DEVELOPER)}
                colors={colors}
              />
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function PlatformCard({
  title,
  description,
  connected,
  saved,
  onOpenDoc,
  children,
  styles,
  colors,
}: {
  title: string;
  description: string;
  connected: boolean;
  saved: boolean;
  onOpenDoc: () => void;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Card style={styles.sectionCard}>
      <CardHeader
        title={title}
        description={description}
        trailing={<ConnectionStatusPill connected={connected} saved={saved} />}
      />
      <CardContent>
        <Pressable onPress={onOpenDoc} style={styles.docLink}>
          <Ionicons name="open-outline" size={16} color={colors.primary} />
          <Text style={styles.docLinkText}>{LABELS.SETUP_INSTRUCTIONS}</Text>
        </Pressable>
        {children}
      </CardContent>
    </Card>
  );
}

function CredentialField({
  label,
  value,
  onChangeText,
  secure,
  onToggleSecure,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure: boolean;
  onToggleSecure: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View>
      {secure ? (
        <PasswordInput label={label} value={value} onChangeText={onChangeText} autoCapitalize="none" />
      ) : (
        <Input label={label} value={value} onChangeText={onChangeText} autoCapitalize="none" />
      )}
      <Pressable onPress={onToggleSecure} style={{ marginBottom: 8 }}>
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "500" }}>
          {secure ? LABELS.SHOW_KEY : LABELS.HIDE_KEY}
        </Text>
      </Pressable>
    </View>
  );
}

function HelpLink({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
      }}
    >
      <Ionicons name="link-outline" size={18} color={colors.primary} />
      <Text style={{ color: colors.foreground, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, tabBarInset: number) =>
  StyleSheet.create({
    shell: { flex: 1, backgroundColor: colors.groupedBackground },
    scroll: { flex: 1 },
    content: {
      padding: SETTINGS_LAYOUT.PAGE_PADDING,
      paddingBottom: tabBarInset,
      gap: SETTINGS_LAYOUT.SECTION_GAP,
    },
    sectionCard: {
      marginBottom: 0,
    },
    docLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    docLinkText: { color: colors.primary, fontSize: 14, fontWeight: "500" },
  });
