"use client";
import React, { useLayoutEffect, useRef, useState } from "react";

import {
  APP_LOGO_VARIANTS,
  BUTTON_LABELS,
  BUTTON_VARIANTS,
  KEYBOARD_KEYS,
  ROUTES,
  SYNC_LABEL,
  TEST_IDS,
} from "@constants";
import { useAuth } from "@contexts/AuthContext";
import type { LoginFormState } from "@types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";

import AppLogo from "@components/common/AppLogo";
import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import Input from "@components/common/Input";

/** Sign-in screen — email/password form with show-password and Enter-to-submit. */
const Login = () => {
  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [hydrated, setHydrated] = useState<boolean>(false);

  const { login } = useAuth();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitLogin = async () => {
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        router.push(ROUTES.DASHBOARD);
      } else {
        setError(result.error ?? SYNC_LABEL.UNEXPECTED_ERROR);
      }
    } catch {
      setError(SYNC_LABEL.UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitLogin();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === KEYBOARD_KEYS.ENTER && !loading) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <AppLogo variant={APP_LOGO_VARIANTS.AUTH} priority />
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-foreground">{SYNC_LABEL.WELCOME_BACK}</h1>
          <p className="mt-1.5 sm:mt-2 text-sm text-muted-foreground">{SYNC_LABEL.SIGN_IN_DESCRIPTION}</p>
        </div>

        <Card className="shadow-sm border rounded-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">{SYNC_LABEL.SIGN_IN}</CardTitle>
            <CardDescription>{SYNC_LABEL.SIGN_IN_DESCRIPTION_2}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              method="post"
              action="#"
              className="space-y-6"
              aria-busy={loading}
              data-testid={TEST_IDS.LOGIN_FORM}
              data-hydrated={hydrated ? "true" : "false"}
            >
              {hydrated ? <span data-testid={TEST_IDS.LOGIN_READY} hidden /> : null}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </div>
              )}

              <Input
                id="email"
                name="email"
                type="email"
                label={SYNC_LABEL.EMAIL_LABEL}
                required
                autoFocus
                leftIcon={<FiMail className="h-5 w-5" />}
                value={formData.email}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={SYNC_LABEL.PLACEHOLDER_EMAIL}
                autoComplete="email"
                data-testid={TEST_IDS.LOGIN_EMAIL}
              />

              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label={SYNC_LABEL.LABEL_PASSWORD}
                required
                leftIcon={<FiLock className="h-5 w-5" />}
                rightIcon={showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={SYNC_LABEL.PLACEHOLDER_PASSWORD}
                autoComplete="current-password"
                data-testid={TEST_IDS.LOGIN_PASSWORD}
              />

              <Button
                type="submit"
                variant={BUTTON_VARIANTS.PRIMARY}
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
                data-testid={TEST_IDS.LOGIN_SUBMIT}
              >
                {loading ? (
                  SYNC_LABEL.SIGNING_IN
                ) : (
                  <>
                    <span>{BUTTON_LABELS.SIGN_IN}</span>
                    <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {SYNC_LABEL.DONT_HAVE_ACCOUNT}{" "}
                <Link
                  href={ROUTES.REGISTER}
                  className="font-medium text-primary hover:text-primary/90 transition-colors"
                >
                  {SYNC_LABEL.SIGN_UP_HERE}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>{SYNC_LABEL.COPYRIGHT}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
