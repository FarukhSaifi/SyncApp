import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { PostCard } from "@components/PostCard";
import { ScreenIntro } from "@components/ScreenIntro";
import { PostListSkeleton } from "@components/skeletons/PostCardSkeleton";
import { DESCRIPTIONS, ERRORS, LABELS, TOAST, editorRoute } from "@constants";
import { LAYOUT, RADIUS, SETTINGS_LAYOUT } from "@constants/designTokens";
import { FILTER_STATUS_ALL, POST_STATUS, getStatusLabel } from "@constants/postStatus";
import { useThemeColors } from "@contexts/ThemeContext";
import { usePosts } from "@hooks/usePosts";
import { useResponsiveLayout } from "@hooks/useResponsiveLayout";
import { useTabBarInset } from "@hooks/useTabBarInset";
import { toast } from "@hooks/useToast";
import { apiClient } from "@services/apiClient";
import type { Post } from "@types";

const FILTERS = [FILTER_STATUS_ALL, POST_STATUS.DRAFT, POST_STATUS.PUBLISHED] as const;

export default function DashboardScreen() {
  const colors = useThemeColors();
  const tabBarInset = useTabBarInset();
  const layout = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(colors, tabBarInset, layout.horizontalPadding),
    [colors, tabBarInset, layout.horizontalPadding],
  );
  const { posts, loading, error, fetchPosts, removePost } = usePosts();
  const [filter, setFilter] = useState<string>(FILTER_STATUS_ALL);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (filter === FILTER_STATUS_ALL) return posts;
    return posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const confirmDelete = (post: Post) => {
    const id = post._id || post.id!;
    Alert.alert(LABELS.CONFIRM_DELETE, post.title, [
      { text: LABELS.CANCEL, style: "cancel" },
      {
        text: LABELS.DELETE,
        style: "destructive",
        onPress: async () => {
          try {
            const res = await apiClient.deletePost(id);
            if (res.success) {
              removePost(id);
              toast.success(TOAST.POST_DELETED);
            } else {
              toast.error(res.error ?? ERRORS.DELETE_FAILED);
            }
          } catch (e) {
            toast.error((e as Error).message);
          }
        },
      },
    ]);
  };

  const listPadding = { paddingBottom: tabBarInset };

  if (loading && !refreshing && posts.length === 0) {
    return (
      <View collapsable={false} style={styles.shell}>
        <View style={styles.container}>
          <ScreenIntro title={LABELS.DASHBOARD} description={DESCRIPTIONS.DASHBOARD} />
          <View style={styles.filters}>
            <SkeletonChipRow colors={colors} />
          </View>
          <View style={[styles.listArea, listPadding]}>
            <PostListSkeleton count={5} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View collapsable={false} style={styles.shell}>
      <View style={styles.container}>
        <ScreenIntro title={LABELS.DASHBOARD} description={DESCRIPTIONS.DASHBOARD} />
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                {f === FILTER_STATUS_ALL ? LABELS.FILTER_ALL : getStatusLabel(f)}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          style={styles.listArea}
          data={filtered}
          keyExtractor={(item) => item._id || item.id || item.title}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={[filtered.length === 0 ? styles.emptyList : undefined, listPadding]}
          contentInsetAdjustmentBehavior="automatic"
          ListEmptyComponent={<Text style={styles.empty}>{LABELS.NO_POSTS}</Text>}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => router.push(editorRoute(String(item._id || item.id)))}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      </View>
    </View>
  );
}

function SkeletonChipRow({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: LAYOUT.SKELETON_CHIP_WIDTH,
            height: LAYOUT.SKELETON_CHIP_HEIGHT,
            borderRadius: RADIUS.FULL,
            backgroundColor: colors.muted,
            opacity: 0.6,
          }}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, _tabBarInset: number, horizontalPadding: number) =>
  StyleSheet.create({
    shell: { flex: 1, backgroundColor: colors.groupedBackground },
    container: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: SETTINGS_LAYOUT.PAGE_PADDING,
    },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: SETTINGS_LAYOUT.CARD_GAP },
    listArea: { flex: 1 },
    chip: {
      paddingHorizontal: SETTINGS_LAYOUT.CHIP_PADDING_X,
      paddingVertical: SETTINGS_LAYOUT.CHIP_PADDING_Y,
      borderRadius: RADIUS.MD,
      backgroundColor: "transparent",
    },
    chipActive: { backgroundColor: `${colors.primary}1a` },
    chipText: { fontSize: 14, color: colors.mutedForeground, textTransform: "capitalize", fontWeight: "500" },
    chipTextActive: { color: colors.primary, fontWeight: "600" },
    emptyList: { flexGrow: 1, justifyContent: "center" },
    empty: { textAlign: "center", color: colors.mutedForeground, fontSize: 16 },
    error: { color: colors.destructive, marginBottom: 8 },
  });
