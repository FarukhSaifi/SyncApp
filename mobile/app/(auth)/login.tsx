import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AppLogo } from "@components/AppLogo";
import { Button } from "@components/Button";
import { Card, CardContent, CardHeader } from "@components/Card";
import { Input } from "@components/Input";
import { PasswordInput } from "@components/PasswordInput";
import { DESCRIPTIONS, ERRORS, LABELS, PLACEHOLDERS, ROUTES } from "@constants";
import { BUTTON_VARIANTS, RADIUS, SETTINGS_LAYOUT, TYPOGRAPHY } from "@constants/designTokens";
import { useAuth } from "@contexts/AuthContext";
import { useThemeColors } from "@contexts/ThemeContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) router.replace(ROUTES.TABS);
    else setError(result.error ?? ERRORS.SIGN_IN_FAILED);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <AppLogo variant="auth" />
        </View>
        <Text style={styles.heading}>{LABELS.WELCOME_BACK}</Text>
        <Text style={styles.subtitle}>{DESCRIPTIONS.TAGLINE}</Text>

        <Card style={styles.card}>
          <CardHeader title={LABELS.LOGIN} description={DESCRIPTIONS.LOGIN} align="center" />
          <CardContent>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label={LABELS.EMAIL}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder={PLACEHOLDERS.EMAIL}
            />
            <PasswordInput label={LABELS.PASSWORD} value={password} onChangeText={setPassword} />

            <Button
              title={LABELS.LOGIN}
              onPress={onSubmit}
              loading={loading}
              variant={BUTTON_VARIANTS.PRIMARY}
              style={styles.submit}
            />

            <Link href={ROUTES.REGISTER} asChild>
              <Pressable style={styles.linkWrap}>
                <Text style={styles.link}>{LABELS.CREATE_ACCOUNT}</Text>
              </Pressable>
            </Link>
          </CardContent>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.groupedBackground },
    inner: { flex: 1, justifyContent: "center", padding: SETTINGS_LAYOUT.PAGE_PADDING + 8 },
    brand: { alignItems: "center", marginBottom: SETTINGS_LAYOUT.CARD_GAP },
    heading: {
      ...TYPOGRAPHY.LARGE_TITLE,
      color: colors.foreground,
      textAlign: "center",
    },
    subtitle: {
      textAlign: "center",
      color: colors.mutedForeground,
      marginBottom: SETTINGS_LAYOUT.SECTION_GAP,
      marginTop: 6,
      fontSize: SETTINGS_LAYOUT.HEADER_DESC_SIZE,
    },
    card: { width: "100%", borderRadius: RADIUS.CARD },
    errorBox: {
      backgroundColor: `${colors.destructive}1a`,
      borderWidth: 1,
      borderColor: `${colors.destructive}4d`,
      borderRadius: RADIUS.MD,
      padding: 12,
      marginBottom: 12,
    },
    errorText: { color: colors.destructive, fontSize: 14 },
    submit: { marginTop: 8 },
    linkWrap: { marginTop: SETTINGS_LAYOUT.SECTION_GAP, alignItems: "center" },
    link: { color: colors.primary, fontSize: 15, fontWeight: "500" },
  });
