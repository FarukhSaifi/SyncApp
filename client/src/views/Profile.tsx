"use client";
import React, { useMemo, useState } from "react";

import SettingsPageHeader from "@components/settings/SettingsPageHeader";
import SettingsSectionNav from "@components/settings/SettingsSectionNav";
import { APP_CONFIG, COLOR_CLASSES, PAGE_DESCRIPTIONS, PROFILE_SECTION_IDS, SYNC_LABEL } from "@constants";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@hooks/useToast";
import type { PasswordFormState, ProfileFormState } from "@types";
import { FiEye, FiEyeOff, FiLock, FiSave, FiUser } from "react-icons/fi";

import { SETTINGS_LAYOUT } from "@constants/designTokens";

import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import Input from "@components/common/Input";
import Textarea from "@components/common/Textarea";

/** Profile settings — personal info and password change sections. */
const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const [profileData, setProfileData] = useState<ProfileFormState>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });
  const [passwordData, setPasswordData] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [activeSectionId, setActiveSectionId] = useState<string>(PROFILE_SECTION_IDS.INFORMATION);

  const sectionNavItems = useMemo(
    () => [
      { id: PROFILE_SECTION_IDS.INFORMATION, label: SYNC_LABEL.PROFILE_INFORMATION },
      { id: PROFILE_SECTION_IDS.PASSWORD, label: SYNC_LABEL.CHANGE_PASSWORD },
      { id: PROFILE_SECTION_IDS.ACCOUNT, label: SYNC_LABEL.ACCOUNT_INFORMATION },
    ],
    [],
  );

  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(profileData);

      if (result.success) {
        // Toast is already handled in AuthContext
      } else {
        // Error toast is already handled in AuthContext
      }
    } catch {
      toast.apiError(SYNC_LABEL.UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.validationError(SYNC_LABEL.PASSWORDS_DO_NOT_MATCH);
      return;
    }

    if (passwordData.newPassword.length < APP_CONFIG.VALIDATION_MIN_PASSWORD) {
      toast.validationError(SYNC_LABEL.PASSWORD_MIN_LENGTH);
      return;
    }

    setPasswordLoading(true);

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);

      if (result.success) {
        // Toast is already handled in AuthContext
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        // Error toast is already handled in AuthContext
      }
    } catch {
      toast.apiError(SYNC_LABEL.UNEXPECTED_ERROR);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className={SETTINGS_LAYOUT.PAGE_CLASS}>
      <SettingsPageHeader
        title={SYNC_LABEL.PROFILE_SETTINGS_TITLE}
        description={SYNC_LABEL.PROFILE_SETTINGS_DESCRIPTION}
      />

      <div className={SETTINGS_LAYOUT.BODY_CLASS}>
        <SettingsSectionNav
          items={sectionNavItems}
          activeId={activeSectionId}
          onSelect={scrollToSection}
          ariaLabel={PAGE_DESCRIPTIONS.PROFILE_SECTION_NAV_ARIA}
        />

        <div className={SETTINGS_LAYOUT.SECTIONS_CLASS}>
          {/* Profile Information */}
          <Card id={PROFILE_SECTION_IDS.INFORMATION} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-1.5 sm:space-x-2">
                <FiUser className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span>{SYNC_LABEL.PROFILE_INFORMATION}</span>
              </CardTitle>
              <CardDescription>{SYNC_LABEL.PROFILE_INFORMATION_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-first-name" className="block text-sm font-medium text-foreground mb-2">
                      {SYNC_LABEL.LABEL_FIRST_NAME}
                    </label>
                    <Input
                      id="profile-first-name"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      placeholder={SYNC_LABEL.FIRST_NAME_PROFILE}
                      className="min-h-11 sm:min-h-0"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-last-name" className="block text-sm font-medium text-foreground mb-2">
                      {SYNC_LABEL.LABEL_LAST_NAME}
                    </label>
                    <Input
                      id="profile-last-name"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      placeholder={SYNC_LABEL.LAST_NAME_PROFILE}
                      className="min-h-11 sm:min-h-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_BIO}</label>
                  <Textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    placeholder={SYNC_LABEL.BIO_PROFILE}
                    className="w-full rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_AVATAR_URL}</label>
                  <Input
                    name="avatar"
                    value={profileData.avatar}
                    onChange={handleProfileChange}
                    placeholder={SYNC_LABEL.AVATAR_URL_PROFILE}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-1.5 sm:space-x-2"
                  disabled={loading}
                >
                  <FiSave className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">
                    {loading ? SYNC_LABEL.UPDATING : SYNC_LABEL.UPDATE_PROFILE}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card id={PROFILE_SECTION_IDS.PASSWORD} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-1.5 sm:space-x-2">
                <FiLock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span>{SYNC_LABEL.CHANGE_PASSWORD}</span>
              </CardTitle>
              <CardDescription>{SYNC_LABEL.CHANGE_PASSWORD_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="profile-current-password" className="block text-sm font-medium text-foreground mb-2">
                    {SYNC_LABEL.CURRENT_PASSWORD}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="profile-current-password"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder={SYNC_LABEL.CURRENT_PASSWORD}
                      className="pl-10 pr-12 min-h-11 sm:min-h-0"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showCurrentPassword ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                      className="absolute inset-y-0 right-0 w-10 flex items-center justify-center touch-manipulation"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <FiEyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground" />
                      ) : (
                        <FiEye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-new-password" className="block text-sm font-medium text-foreground mb-2">
                    {SYNC_LABEL.NEW_PASSWORD}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="profile-new-password"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder={SYNC_LABEL.NEW_PASSWORD}
                      className="pl-10 pr-12 min-h-11 sm:min-h-0"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                      className="absolute inset-y-0 right-0 w-10 flex items-center justify-center touch-manipulation"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <FiEyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      ) : (
                        <FiEye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-confirm-password" className="block text-sm font-medium text-foreground mb-2">
                    {SYNC_LABEL.CONFIRM_NEW_PASSWORD}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="profile-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder={SYNC_LABEL.CONFIRM_PASSWORD}
                      className="pl-10 pr-12 min-h-11 sm:min-h-0"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                      className="absolute inset-y-0 right-0 w-10 flex items-center justify-center touch-manipulation"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      ) : (
                        <FiEye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-1.5 sm:space-x-2"
                  disabled={passwordLoading}
                >
                  <FiLock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">
                    {passwordLoading ? SYNC_LABEL.CHANGING_PASSWORD : SYNC_LABEL.CHANGE_PASSWORD}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card id={PROFILE_SECTION_IDS.ACCOUNT} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <CardTitle>{SYNC_LABEL.ACCOUNT_INFORMATION}</CardTitle>
              <CardDescription>{SYNC_LABEL.ACCOUNT_INFORMATION_DESC}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 items-stretch">
                <div className="flex flex-col items-center text-center space-y-3 p-4 border border-border rounded-xl bg-muted/40">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center ring-2 ring-primary/20">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl sm:text-2xl font-semibold text-foreground">
                        {(
                          user?.firstName?.[0] ||
                          user?.username?.[0] ||
                          SYNC_LABEL.DEFAULT_AVATAR_LETTER
                        ).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-semibold text-primary break-all">{user?.username}</div>
                    <div className="text-xs text-muted-foreground">{SYNC_LABEL.USERNAME_LABEL}</div>
                  </div>
                </div>

                <div className="text-center p-4 border border-border rounded-xl bg-muted/40 wrap-break-word">
                  <div
                    className={`text-base sm:text-lg font-semibold ${COLOR_CLASSES.ICON_COLOR.POSITIVE} wrap-break-word`}
                  >
                    {user?.email}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{SYNC_LABEL.EMAIL_LABEL}</div>
                </div>

                <div className="text-center sm:col-span-1 p-4 border border-border rounded-xl bg-muted/40">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${COLOR_CLASSES.ICON_BG.PRIMARY} ${COLOR_CLASSES.ICON_COLOR.PRIMARY} text-sm font-medium capitalize`}
                  >
                    <span className={`w-2 h-2 rounded-full ${COLOR_CLASSES.ICON_COLOR.PRIMARY}`} /> {user?.role}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{SYNC_LABEL.ROLE_LABEL}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
