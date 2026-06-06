import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Card, CardContent } from "@/src/components/Card";
import { Input } from "@/src/components/Input";
import { PasswordInput } from "@/src/components/PasswordInput";
import { ScreenIntro } from "@/src/components/ScreenIntro";
import { APP_CONFIG, DESCRIPTIONS, ERRORS, EXTERNAL_LINKS, LABELS, TOAST } from "@/src/constants";
import { IOS26, RADIUS } from "@/src/constants/designTokens";
import { PLATFORMS } from "@/src/constants/platforms";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { useTabBarInset } from "@/src/hooks/useTabBarInset";
import { toast } from "@/src/hooks/useToast";
import { apiClient } from "@/src/services/apiClient";

type PlatformKey = "medium" | "devto" | "wordpress";

export default function SettingsScreen() {
  const colors = useThemeColors();
  const tabBarInset = useTabBarInset();
  const styles = useMemo(() => createStyles(colors, tabBarInset), [colors, tabBarInset]);

  const [mediumKey, setMediumKey] = useState("");
  const [devtoKey, setDevtoKey] = useState("");
  const [devtoUser, setDevtoUser] = useState("");
  const [wpKey, setWpKey] = useState("");
  const [wpUrl, setWpUrl] = useState("");
  const [connected, setConnected] = useState<Record<PlatformKey, boolean>>({
    medium: false,
    devto: false,
    wordpress: false,
  });
  const [savedFlash, setSavedFlash] = useState<Record<PlatformKey, boolean>>({
    medium: false,
    devto: false,
    wordpress: false,
  });
  const [saving, setSaving] = useState<PlatformKey | null>(null);
  const [showKeys, setShowKeys] = useState<Record<PlatformKey, boolean>>({
    medium: false,
    devto: false,
    wordpress: false,
  });

  useEffect(() => {
    void (async () => {
      try {
        const [m, d, w] = await Promise.all([
          apiClient.getCredential(PLATFORMS.MEDIUM),
          apiClient.getCredential(PLATFORMS.DEVTO),
          apiClient.getCredential(PLATFORMS.WORDPRESS),
        ]);
        if (m.success && m.data) {
          setMediumKey((m.data as { api_key?: string }).api_key ?? "");
          setConnected((c) => ({ ...c, medium: true }));
        }
        if (d.success && d.data) {
          const cred = d.data as { api_key?: string; platform_config?: { devto_username?: string } };
          setDevtoKey(cred.api_key ?? "");
          setDevtoUser(cred.platform_config?.devto_username ?? "");
          setConnected((c) => ({ ...c, devto: true }));
        }
        if (w.success && w.data) {
          const cred = w.data as { api_key?: string; site_url?: string };
          setWpKey(cred.api_key ?? "");
          setWpUrl(cred.site_url ?? "");
          setConnected((c) => ({ ...c, wordpress: true }));
        }
      } catch {
        /* credentials may not exist yet */
      }
    })();
  }, []);

  const flashSaved = (platform: PlatformKey) => {
    setSavedFlash((s) => ({ ...s, [platform]: true }));
    setConnected((c) => ({ ...c, [platform]: true }));
    setTimeout(() => setSavedFlash((s) => ({ ...s, [platform]: false })), APP_CONFIG.SAVED_TOAST_DURATION_MS);
  };

  const save = async (platform: PlatformKey, apiPlatform: string, body: Record<string, unknown>) => {
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

  return (
    <View collapsable={false} style={styles.shell}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenIntro description={LABELS.SETTINGS_INTRO} />

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
              save("devto", PLATFORMS.DEVTO, { api_key: devtoKey, platform_config: { devto_username: devtoUser } })
            }
            loading={saving === "devto"}
          />
        </PlatformCard>

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
            onPress={() => save("wordpress", PLATFORMS.WORDPRESS, { api_key: wpKey, site_url: wpUrl })}
            loading={saving === "wordpress"}
          />
        </PlatformCard>

        <Text style={styles.section}>{LABELS.HELP_SUPPORT}</Text>
        <Card>
          <CardContent>
            <HelpLink
              label="Medium settings"
              onPress={() => void openLink(EXTERNAL_LINKS.MEDIUM_SETTINGS)}
              colors={colors}
            />
            <HelpLink
              label="Dev.to settings"
              onPress={() => void openLink(EXTERNAL_LINKS.DEVTO_SETTINGS)}
              colors={colors}
            />
            <HelpLink
              label="WordPress JWT plugin"
              onPress={() => void openLink(EXTERNAL_LINKS.WORDPRESS_JWT_PLUGIN)}
              colors={colors}
            />
          </CardContent>
        </Card>
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
  const statusColor = connected ? colors.positive : colors.mutedForeground;
  const statusLabel = saved ? LABELS.SAVE : connected ? LABELS.CONNECTED : LABELS.NOT_CONNECTED;

  return (
    <Card style={styles.sectionCard}>
      <CardContent>
        <View style={styles.platformHeader}>
          <Text style={styles.platform}>{title}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}26` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.platformDesc}>{description}</Text>
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
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 }}>
      <Ionicons name="link-outline" size={18} color={colors.primary} />
      <Text style={{ color: colors.foreground, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, tabBarInset: number) =>
  StyleSheet.create({
    shell: { flex: 1, backgroundColor: colors.groupedBackground },
    scroll: { flex: 1 },
    content: { padding: IOS26.SCREEN_PADDING, paddingBottom: tabBarInset },
    sectionCard: { marginBottom: IOS26.GROUPED_GAP },
    platformHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    platform: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    platformDesc: { fontSize: 14, lineHeight: 20, color: colors.mutedForeground, marginBottom: 10 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.FULL },
    statusText: { fontSize: 11, fontWeight: "600" },
    docLink: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    docLinkText: { color: colors.primary, fontSize: 14, fontWeight: "500" },
    section: {
      fontSize: 13,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 12,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
  });
