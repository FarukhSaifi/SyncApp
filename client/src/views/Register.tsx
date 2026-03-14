"use client";
import React, { useState } from "react";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import Input from "@components/common/Input";

import { useAuth } from "@contexts/AuthContext";

import { APP_CONFIG, BUTTON_VARIANTS, ROUTES, SYNC_LABEL } from "@constants";

interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

const Register = () => {
  const [formData, setFormData] = useState<RegisterFormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const { register } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      setError(SYNC_LABEL.PASSWORDS_DO_NOT_MATCH_REGISTER);
      return false;
    }

    if (formData.password.length < APP_CONFIG.VALIDATION_MIN_PASSWORD) {
      setError(SYNC_LABEL.PASSWORD_MIN_LENGTH_REGISTER);
      return false;
    }

    if (formData.username.length < APP_CONFIG.VALIDATION_MIN_USERNAME) {
      setError(SYNC_LABEL.USERNAME_MIN_LENGTH);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);

      if (result.success) {
        router.push(ROUTES.DASHBOARD);
      } else {
        setError(result.error ?? SYNC_LABEL.UNEXPECTED_ERROR);
      }
    } catch (err) {
      setError(SYNC_LABEL.UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{SYNC_LABEL.CREATE_ACCOUNT}</h1>
          <p className="mt-1.5 sm:mt-2 text-sm text-muted-foreground">{SYNC_LABEL.JOIN_SYNCAPP}</p>
        </div>

        <Card className="shadow-sm border rounded-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">{SYNC_LABEL.SIGN_UP}</CardTitle>
            <CardDescription>{SYNC_LABEL.FILL_DETAILS}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  label={SYNC_LABEL.LABEL_FIRST_NAME}
                  leftIcon={<FiUser className="h-5 w-5" />}
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder={SYNC_LABEL.FIRST_NAME_PROFILE}
                />
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  label={SYNC_LABEL.LABEL_LAST_NAME}
                  leftIcon={<FiUser className="h-5 w-5" />}
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder={SYNC_LABEL.LAST_NAME_PROFILE}
                />
              </div>

              <Input
                id="username"
                name="username"
                type="text"
                label={SYNC_LABEL.LABEL_USERNAME}
                required
                leftIcon={<FiUser className="h-5 w-5" />}
                value={formData.username}
                onChange={handleInputChange}
                placeholder={SYNC_LABEL.CHOOSE_USERNAME}
                autoComplete="username"
              />

              <Input
                id="email"
                name="email"
                type="email"
                label={SYNC_LABEL.EMAIL_LABEL}
                required
                leftIcon={<FiMail className="h-5 w-5" />}
                value={formData.email}
                onChange={handleInputChange}
                placeholder={SYNC_LABEL.PLACEHOLDER_EMAIL}
                autoComplete="email"
              />

              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label={SYNC_LABEL.LABEL_PASSWORD}
                required
                hint={SYNC_LABEL.PASSWORD_MIN_LENGTH_REGISTER}
                leftIcon={<FiLock className="h-5 w-5" />}
                rightIcon={showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                value={formData.password}
                onChange={handleInputChange}
                placeholder={SYNC_LABEL.CREATE_PASSWORD}
                autoComplete="new-password"
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                label={SYNC_LABEL.CONFIRM_NEW_PASSWORD}
                required
                leftIcon={<FiLock className="h-5 w-5" />}
                rightIcon={showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={SYNC_LABEL.CONFIRM_PASSWORD_REGISTER}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant={BUTTON_VARIANTS.PRIMARY}
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  SYNC_LABEL.CREATING_ACCOUNT
                ) : (
                  <>
                    <span>{SYNC_LABEL.CREATE_ACCOUNT_BUTTON}</span>
                    <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {SYNC_LABEL.ALREADY_HAVE_ACCOUNT}{" "}
                <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:text-primary/90 transition-colors">
                  {SYNC_LABEL.SIGN_IN_HERE}
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

export default Register;
