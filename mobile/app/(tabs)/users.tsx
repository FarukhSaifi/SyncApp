import { useMemo } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { Modal } from "@/src/components/Modal";
import { PasswordInput } from "@/src/components/PasswordInput";
import { ScreenIntro } from "@/src/components/ScreenIntro";
import { UserCard } from "@/src/components/UserCard";
import { UserListSkeleton } from "@/src/components/skeletons/UserCardSkeleton";
import { BUTTON_VARIANTS, IOS26, RADIUS } from "@/src/constants/designTokens";
import { LABELS } from "@/src/constants/messages";
import { USER_ROLE_OPTIONS, USER_VERIFIED_FILTER } from "@/src/constants/userRoles";
import { useAuth } from "@/src/contexts/AuthContext";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { useTabBarInset } from "@/src/hooks/useTabBarInset";
import { useUsers } from "@/src/hooks/useUsers";

const VERIFIED_FILTERS = [
  { value: USER_VERIFIED_FILTER.ALL, label: LABELS.FILTER_ALL },
  { value: USER_VERIFIED_FILTER.VERIFIED, label: LABELS.VERIFIED },
  { value: USER_VERIFIED_FILTER.UNVERIFIED, label: LABELS.UNVERIFIED },
] as const;

export default function UsersTabScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const tabBarInset = useTabBarInset();
  const styles = useMemo(() => createStyles(colors, tabBarInset), [colors, tabBarInset]);

  const {
    users,
    searchInput,
    setSearchInput,
    roleFilter,
    setRoleFilter,
    verifiedFilter,
    setVerifiedFilter,
    page,
    setPage,
    totalPages,
    loading,
    refreshing,
    creating,
    updating,
    showAddModal,
    setShowAddModal,
    addForm,
    setAddForm,
    editingUser,
    editForm,
    setEditForm,
    confirmDelete,
    openEdit,
    closeEdit,
    updateUser,
    createUser,
    refresh,
    clearFilters,
    hasActiveFilters,
    isAdmin,
  } = useUsers({ userRole: user?.role });

  if (!isAdmin) return null;

  const listHeader = (
    <>
      <ScreenIntro description={LABELS.USER_MANAGEMENT} />
      <View style={styles.toolbar}>
        <Button title={LABELS.REFRESH} variant={BUTTON_VARIANTS.OUTLINE} onPress={refresh} style={styles.toolbarBtn} />
        <Button title={LABELS.ADD_USER} onPress={() => setShowAddModal(true)} style={styles.toolbarBtn} />
      </View>
      <Input
        value={searchInput}
        onChangeText={(v) => {
          setSearchInput(v);
          setPage(1);
        }}
        placeholder={LABELS.SEARCH_USERS}
        containerStyle={{ marginBottom: 12 }}
      />
      <FilterRow
        label={LABELS.ROLE}
        options={[{ value: "", label: LABELS.ALL_ROLES }, ...USER_ROLE_OPTIONS]}
        value={roleFilter}
        onChange={(v) => {
          setRoleFilter(v);
          setPage(1);
        }}
        colors={colors}
      />
      <FilterRow
        label={LABELS.VERIFIED}
        options={VERIFIED_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
        value={verifiedFilter}
        onChange={(v) => {
          setVerifiedFilter(v);
          setPage(1);
        }}
        colors={colors}
      />
      {hasActiveFilters ? (
        <Pressable onPress={clearFilters} style={styles.clearFilters}>
          <Text style={styles.clearFiltersText}>{LABELS.CLEAR_FILTERS}</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (loading && !refreshing) {
    return (
      <View collapsable={false} style={styles.shell}>
        <View style={styles.container}>
          {listHeader}
          <UserListSkeleton count={5} />
        </View>
      </View>
    );
  }

  return (
    <View collapsable={false} style={styles.shell}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={users}
        keyExtractor={(item) => item._id || item.id || item.username}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <UserCard user={item} onEdit={() => openEdit(item)} onDelete={() => confirmDelete(item)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>{LABELS.NO_USERS}</Text>}
        ListFooterComponent={
          <View style={styles.pagination}>
            <Button
              title={LABELS.PREV}
              variant={BUTTON_VARIANTS.OUTLINE}
              disabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={styles.pageBtn}
            />
            <Text style={styles.pageText}>
              {page} / {totalPages}
            </Text>
            <Button
              title={LABELS.NEXT}
              variant={BUTTON_VARIANTS.OUTLINE}
              disabled={page >= totalPages}
              onPress={() => setPage((p) => p + 1)}
              style={styles.pageBtn}
            />
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        title={LABELS.ADD_USER}
        onClose={() => setShowAddModal(false)}
        footer={
          <>
            <Button title={LABELS.ADD_USER} onPress={() => void createUser()} loading={creating} />
            <Button title={LABELS.CANCEL} variant={BUTTON_VARIANTS.OUTLINE} onPress={() => setShowAddModal(false)} />
          </>
        }
      >
        <Input
          label={LABELS.USERNAME}
          value={addForm.username}
          onChangeText={(v) => setAddForm((f) => ({ ...f, username: v }))}
          autoCapitalize="none"
        />
        <Input
          label={LABELS.EMAIL}
          value={addForm.email}
          onChangeText={(v) => setAddForm((f) => ({ ...f, email: v }))}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <PasswordInput
          label={LABELS.PASSWORD}
          value={addForm.password}
          onChangeText={(v) => setAddForm((f) => ({ ...f, password: v }))}
        />
        <Input
          label={LABELS.FIRST_NAME}
          value={addForm.firstName}
          onChangeText={(v) => setAddForm((f) => ({ ...f, firstName: v }))}
        />
        <Input
          label={LABELS.LAST_NAME}
          value={addForm.lastName}
          onChangeText={(v) => setAddForm((f) => ({ ...f, lastName: v }))}
        />
        <RolePicker value={addForm.role} onChange={(role) => setAddForm((f) => ({ ...f, role }))} colors={colors} />
        <VerifiedToggle
          value={addForm.isVerified}
          onChange={(isVerified) => setAddForm((f) => ({ ...f, isVerified }))}
          colors={colors}
        />
      </Modal>

      <Modal
        visible={Boolean(editingUser)}
        title={LABELS.EDIT_USER}
        onClose={closeEdit}
        footer={
          <>
            <Button title={LABELS.SAVE} onPress={() => void updateUser()} loading={updating} />
            <Button title={LABELS.CANCEL} variant={BUTTON_VARIANTS.OUTLINE} onPress={closeEdit} />
          </>
        }
      >
        {editingUser ? (
          <>
            <Text style={styles.editMeta}>
              {editingUser.username} · {editingUser.email}
            </Text>
            <RolePicker
              value={editForm.role}
              onChange={(role) => setEditForm((f) => ({ ...f, role }))}
              colors={colors}
            />
            <VerifiedToggle
              value={editForm.isVerified}
              onChange={(isVerified) => setEditForm((f) => ({ ...f, isVerified }))}
              colors={colors}
            />
          </>
        ) : null}
      </Modal>
    </View>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
  colors,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { marginBottom: 10 },
        label: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.mutedForeground,
          marginBottom: 6,
          textTransform: "uppercase",
        },
        row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: RADIUS.FULL,
          backgroundColor: colors.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        chipText: { fontSize: 13, color: colors.mutedForeground, fontWeight: "500" },
        chipTextActive: { color: colors.primaryForeground },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => (
          <Pressable
            key={opt.value || "all"}
            onPress={() => onChange(opt.value)}
            style={[styles.chip, value === opt.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RolePicker({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (role: string) => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <FilterRow label={LABELS.ROLE} options={USER_ROLE_OPTIONS} value={value} onChange={onChange} colors={colors} />
  );
}

function VerifiedToggle({
  value,
  onChange,
  colors,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginVertical: 12,
          paddingVertical: 8,
        },
        label: { fontSize: 15, color: colors.foreground, fontWeight: "500" },
      }),
    [colors],
  );

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{LABELS.VERIFIED}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, tabBarInset: number) =>
  StyleSheet.create({
    shell: { flex: 1, backgroundColor: colors.groupedBackground },
    container: { flex: 1, paddingHorizontal: IOS26.SCREEN_PADDING, paddingTop: IOS26.SCREEN_PADDING },
    list: { flex: 1 },
    listContent: {
      paddingHorizontal: IOS26.SCREEN_PADDING,
      paddingTop: IOS26.SCREEN_PADDING,
      paddingBottom: tabBarInset,
    },
    toolbar: { flexDirection: "row", gap: 8, marginBottom: 12 },
    toolbarBtn: { flex: 1 },
    clearFilters: { alignSelf: "flex-start", marginBottom: 12 },
    clearFiltersText: { color: colors.primary, fontSize: 14, fontWeight: "500" },
    empty: { textAlign: "center", color: colors.mutedForeground, marginTop: 24, fontSize: 16 },
    pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 16 },
    pageBtn: { flex: 1 },
    pageText: { color: colors.mutedForeground, fontSize: 15 },
    editMeta: { fontSize: 14, color: colors.mutedForeground, marginBottom: 8, textAlign: "center" },
  });
