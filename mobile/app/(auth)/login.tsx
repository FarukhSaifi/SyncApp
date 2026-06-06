import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Card, CardContent, CardHeader } from "@/src/components/Card";
import { Input } from "@/src/components/Input";
import { PasswordInput } from "@/src/components/PasswordInput";
import { DESCRIPTIONS, ERRORS, LABELS, PLACEHOLDERS, ROUTES } from "@/src/constants";
import { BUTTON_VARIANTS } from "@/src/constants/designTokens";
import { useAuth } from "@/src/contexts/AuthContext";
import { useThemeColors } from "@/src/contexts/ThemeContext";

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
        <Text style={styles.heading}>{LABELS.WELCOME_BACK}</Text>
        <Text style={styles.subtitle}>{DESCRIPTIONS.TAGLINE}</Text>

        <Card style={styles.card}>
          <CardHeader title={LABELS.LOGIN} description={DESCRIPTIONS.LOGIN} />
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
              style={{ marginTop: 8 }}
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
    inner: { flex: 1, justifyContent: "center", padding: 24 },
    heading: { fontSize: 34, fontWeight: "700", color: colors.foreground, textAlign: "center", letterSpacing: 0.3 },
    subtitle: { textAlign: "center", color: colors.mutedForeground, marginBottom: 24, marginTop: 6 },
    card: { width: "100%" },
    errorBox: {
      backgroundColor: `${colors.destructive}1a`,
      borderWidth: 1,
      borderColor: `${colors.destructive}4d`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    errorText: { color: colors.destructive, fontSize: 14 },
    linkWrap: { marginTop: 20, alignItems: "center" },
    link: { color: colors.primary, fontSize: 15, fontWeight: "500" },
  });
