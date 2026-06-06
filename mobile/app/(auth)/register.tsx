import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Card, CardContent, CardHeader } from "@/src/components/Card";
import { Input } from "@/src/components/Input";
import { PasswordInput } from "@/src/components/PasswordInput";
import { APP_CONFIG, DESCRIPTIONS, ERRORS, LABELS, ROUTES } from "@/src/constants";
import { BUTTON_VARIANTS } from "@/src/constants/designTokens";
import { useAuth } from "@/src/contexts/AuthContext";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setError("");
    if (form.username.trim().length < APP_CONFIG.VALIDATION_MIN_USERNAME) {
      setError(LABELS.USERNAME_MIN_LENGTH);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(ERRORS.PASSWORDS_DO_NOT_MATCH);
      return;
    }
    if (form.password.length < APP_CONFIG.VALIDATION_MIN_PASSWORD) {
      setError(ERRORS.PASSWORD_MIN_LENGTH);
      return;
    }
    setLoading(true);
    const { confirmPassword: _confirm, ...payload } = form;
    const result = await register(payload);
    setLoading(false);
    if (result.success) router.replace(ROUTES.TABS);
    else setError(result.error ?? ERRORS.REGISTRATION_FAILED);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.groupedBackground }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{LABELS.REGISTER}</Text>
        <Text style={styles.subtitle}>{DESCRIPTIONS.REGISTER}</Text>

        <Card>
          <CardHeader title={LABELS.CREATE_ACCOUNT} />
          <CardContent>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input label={LABELS.USERNAME} value={form.username} onChangeText={set("username")} autoCapitalize="none" />
            <Input
              label={LABELS.EMAIL}
              value={form.email}
              onChangeText={set("email")}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <PasswordInput label={LABELS.PASSWORD} value={form.password} onChangeText={set("password")} />
            <PasswordInput
              label={LABELS.CONFIRM_PASSWORD}
              value={form.confirmPassword}
              onChangeText={set("confirmPassword")}
            />
            <Input label={LABELS.FIRST_NAME} value={form.firstName} onChangeText={set("firstName")} />
            <Input label={LABELS.LAST_NAME} value={form.lastName} onChangeText={set("lastName")} />
            <Button title={LABELS.REGISTER} onPress={onSubmit} loading={loading} variant={BUTTON_VARIANTS.PRIMARY} />
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Text style={styles.link}>{LABELS.BACK_TO_SIGN_IN}</Text>
            </Pressable>
          </CardContent>
        </Card>

        <Text style={styles.footer}>{APP_CONFIG.COPYRIGHT}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: { padding: 24, paddingBottom: 48 },
    heading: { fontSize: 28, fontWeight: "700", color: colors.foreground, textAlign: "center" },
    subtitle: { textAlign: "center", color: colors.mutedForeground, marginBottom: 20, marginTop: 6 },
    errorBox: {
      backgroundColor: `${colors.destructive}1a`,
      borderWidth: 1,
      borderColor: `${colors.destructive}4d`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    errorText: { color: colors.destructive, fontSize: 14 },
    back: { marginTop: 16, alignItems: "center" },
    link: { color: colors.primary, fontWeight: "500" },
    footer: { textAlign: "center", color: colors.mutedForeground, fontSize: 12, marginTop: 24 },
  });
