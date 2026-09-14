import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { ROUTES } from "@/src/constants";
import { BUTTON_VARIANTS, RADIUS } from "@/src/constants/designTokens";
import { PLATFORM_DISPLAY_NAMES, type PlatformSlug } from "@/src/constants/platforms";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import type { EditorForm } from "@/src/types";

interface ChannelsTabProps {
  form: EditorForm;
  platforms: typeof import("@/src/constants/platforms").PLATFORMS;
  connectedPlatforms: PlatformSlug[];
  loadingPlatforms?: boolean;
  selectedPlatforms: PlatformSlug[];
  togglePlatform: (platform: PlatformSlug) => void;
  updateField: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void;
  generateLinkedInSummary: () => Promise<void>;
  aiLoading: boolean;
}

const PLATFORM_THEMES: Record<
  PlatformSlug,
  { brandColor: string; icon: keyof typeof Ionicons.glyphMap; summary: string }
> = {
  medium: {
    brandColor: "#00AB6C",
    icon: "book-outline",
    summary: "Long-form editorial publication format with full markdown and clean typography.",
  },
  devto: {
    brandColor: "#0A0A0A",
    icon: "code-working-outline",
    summary: "Developer community format with code highlighting, tags, and interactive cover banner.",
  },
  wordpress: {
    brandColor: "#21759B",
    icon: "globe-outline",
    summary: "Standard CMS blog post with category taxonomy, slug, and featured media.",
  },
  linkedin: {
    brandColor: "#0A66C2",
    icon: "logo-linkedin",
    summary: "Executive social feed post with professional hook, hashtags, and call to action.",
  },
};

export function ChannelsTab({
  form,
  platforms,
  connectedPlatforms,
  loadingPlatforms = false,
  selectedPlatforms,
  togglePlatform,
  updateField,
  generateLinkedInSummary,
  aiLoading,
}: ChannelsTabProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const linkedinCharCount = (form.linkedin_post ?? "").length;

  const availablePlatforms = useMemo(
    () => (Object.values(platforms) as PlatformSlug[]).filter((p) => connectedPlatforms.includes(p)),
    [platforms, connectedPlatforms],
  );

  return (
    <View style={styles.container}>
      {/* Intro section */}
      <View style={styles.introHeader}>
        <Text style={styles.sectionTitle}>Publishing Channels</Text>
        <Text style={styles.sectionSubtitle}>
          {availablePlatforms.length > 0
            ? "Your authenticated publishing channels ready for distribution."
            : "No active publishing channels found. Connect channels in Settings to publish."}
        </Text>
      </View>

      {/* Loading state */}
      {loadingPlatforms ? (
        <Card style={styles.stateCard}>
          <Text style={styles.stateCardText}>Checking connected channels...</Text>
        </Card>
      ) : null}

      {/* No Connected Platforms Card */}
      {!loadingPlatforms && availablePlatforms.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="link-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Channels Connected</Text>
          <Text style={styles.emptySubtitle}>
            Connect your accounts (Medium, DEV.to, WordPress, or LinkedIn) with API keys in Settings to enable one-click
            publishing.
          </Text>
          <Button
            title="Connect Channels in Settings"
            variant={BUTTON_VARIANTS.PRIMARY}
            onPress={() => router.push(ROUTES.SETTINGS as any)}
            style={styles.emptyBtn}
          />
        </Card>
      ) : null}

      {/* Platform Cards Selection - ONLY shows connected platforms */}
      {availablePlatforms.length > 0 ? (
        <View style={styles.platformsList}>
          {availablePlatforms.map((platform) => {
            const selected = selectedPlatforms.includes(platform);
            const theme = PLATFORM_THEMES[platform];
            const hasTitle = Boolean(form.title.trim());
            const hasContent = Boolean(form.content_markdown.trim());
            const isChannelReady = hasTitle && hasContent;

            return (
              <Pressable
                key={platform}
                onPress={() => togglePlatform(platform)}
                style={({ pressed }) => [
                  styles.platformCard,
                  selected && styles.platformCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.platformIconWrapper, { backgroundColor: `${theme.brandColor}20` }]}>
                  <Ionicons name={theme.icon} size={22} color={theme.brandColor} />
                </View>

                <View style={styles.platformCopy}>
                  <View style={styles.platformTitleRow}>
                    <Text style={styles.platformName}>{PLATFORM_DISPLAY_NAMES[platform]}</Text>
                    <View
                      style={[styles.statusPill, isChannelReady ? styles.statusPillReady : styles.statusPillAttention]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isChannelReady ? styles.statusPillTextReady : styles.statusPillTextAttention,
                        ]}
                      >
                        {isChannelReady ? "Ready" : "Needs Content"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.platformSummary} numberOfLines={2}>
                    {theme.summary}
                  </Text>
                </View>

                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={selected ? colors.primary : colors.mutedForeground}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Dedicated LinkedIn Adaptation Studio - only shown when LinkedIn is authenticated */}
      {connectedPlatforms.includes(platforms.LINKEDIN) ? (
        <Card style={styles.linkedinCard}>
          <View style={styles.linkedinHeader}>
            <View style={styles.linkedinTitleRow}>
              <View style={styles.linkedinIcon}>
                <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
              </View>
              <View>
                <Text style={styles.cardHeading}>LinkedIn Post Adaptation</Text>
                <Text style={styles.cardSub}>Optimized summary tailored for your professional network</Text>
              </View>
            </View>

            <Button
              title="AI Summarize"
              variant={BUTTON_VARIANTS.OUTLINE}
              size="sm"
              onPress={() => void generateLinkedInSummary()}
              loading={aiLoading}
            />
          </View>

          <TextInput
            style={styles.linkedinInput}
            value={form.linkedin_post}
            onChangeText={(val) => updateField("linkedin_post", val)}
            multiline
            placeholder="Craft your LinkedIn hook, key takeaways, and hashtags..."
            placeholderTextColor={colors.mutedForeground}
            textAlignVertical="top"
          />

          <View style={styles.linkedinFooter}>
            <Text style={[styles.counterText, linkedinCharCount > 1300 && styles.counterOverlimit]}>
              {linkedinCharCount} / 1300 characters
            </Text>
            <Text style={styles.hintText}>Recommended: 600 - 1000 characters</Text>
          </View>
        </Card>
      ) : null}

      {/* Live Preview Mockup Card */}
      {availablePlatforms.length > 0 ? (
        <Card style={styles.mockupCard}>
          <Text style={styles.mockupHeading}>LIVE CHANNEL MOCKUP</Text>
          <Text style={styles.mockupSub}>
            {connectedPlatforms.includes(platforms.LINKEDIN)
              ? "Simulated LinkedIn feed appearance"
              : `Simulated ${availablePlatforms.map((p) => PLATFORM_DISPLAY_NAMES[p]).join(", ")} appearance`}
          </Text>

          <View style={styles.feedPostMock}>
            <View style={styles.feedAuthorRow}>
              <View style={styles.feedAvatar}>
                <Ionicons name="person" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.feedAuthorName}>You</Text>
                <Text style={styles.feedTime}>Just now • Public</Text>
              </View>
            </View>

            <Text style={styles.feedTitle} numberOfLines={2}>
              {form.title || "Your story headline"}
            </Text>

            <Text style={styles.feedSnippet} numberOfLines={3}>
              {connectedPlatforms.includes(platforms.LINKEDIN) && form.linkedin_post
                ? form.linkedin_post
                : form.content_markdown.slice(0, 180) || "Your story content excerpt will appear here."}
            </Text>

            {form.cover_image ? (
              <Image source={{ uri: form.cover_image }} style={styles.feedCover} resizeMode="cover" />
            ) : null}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      paddingBottom: 24,
    },
    introHeader: {
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.foreground,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 4,
      lineHeight: 18,
    },
    platformsList: {
      gap: 10,
      marginBottom: 18,
    },
    platformCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 12,
    },
    platformCardSelected: {
      borderColor: `${colors.primary}80`,
      backgroundColor: colors.card,
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.99 }],
    },
    platformIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.MD,
      alignItems: "center",
      justifyContent: "center",
    },
    platformCopy: {
      flex: 1,
    },
    platformTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
      paddingRight: 6,
    },
    platformName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
    },
    platformSummary: {
      fontSize: 12,
      color: colors.mutedForeground,
      lineHeight: 16,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: RADIUS.FULL,
    },
    statusPillReady: {
      backgroundColor: `${colors.positive}20`,
    },
    statusPillAttention: {
      backgroundColor: `${colors.warning}20`,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: "700",
    },
    statusPillTextReady: {
      color: colors.positive,
    },
    statusPillTextAttention: {
      color: colors.warning,
    },
    linkedinCard: {
      padding: 16,
      marginBottom: 18,
    },
    linkedinHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    linkedinTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    linkedinIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#0A66C220",
      alignItems: "center",
      justifyContent: "center",
    },
    cardHeading: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
    },
    cardSub: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 1,
    },
    linkedinInput: {
      backgroundColor: colors.background,
      borderRadius: RADIUS.MD,
      padding: 12,
      fontSize: 14,
      lineHeight: 20,
      color: colors.foreground,
      minHeight: 110,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 10,
    },
    linkedinFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    counterText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    counterOverlimit: {
      color: colors.destructive,
      fontWeight: "700",
    },
    hintText: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    mockupCard: {
      padding: 16,
    },
    mockupHeading: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.mutedForeground,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    mockupSub: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 14,
    },
    feedPostMock: {
      backgroundColor: colors.background,
      borderRadius: RADIUS.MD,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    feedAuthorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    feedAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
    },
    feedAuthorName: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    feedTime: {
      fontSize: 10,
      color: colors.mutedForeground,
    },
    feedTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 6,
    },
    feedSnippet: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.mutedForeground,
      marginBottom: 10,
    },
    feedCover: {
      width: "100%",
      height: 140,
      borderRadius: RADIUS.SM,
      marginTop: 6,
    },
    stateCard: {
      padding: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    stateCardText: {
      fontSize: 13,
      color: colors.mutedForeground,
    },
    emptyCard: {
      padding: 24,
      alignItems: "center",
      marginBottom: 20,
    },
    emptyIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${colors.primary}18`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 6,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 18,
    },
    emptyBtn: {
      alignSelf: "stretch",
    },
  });
