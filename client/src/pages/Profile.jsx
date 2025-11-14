import React, { useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiSave, FiUser } from "react-icons/fi";
import Button from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { SYNC_LABEL } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/useToast";

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(profileData);

      if (result.success) {
        // Toast is already handled in AuthContext
      } else {
        // Error toast is already handled in AuthContext
      }
    } catch (error) {
      toast.apiError(SYNC_LABEL.UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.validationError(SYNC_LABEL.PASSWORDS_DO_NOT_MATCH);
      return;
    }

    if (passwordData.newPassword.length < 6) {
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
    } catch (error) {
      toast.apiError(SYNC_LABEL.UNEXPECTED_ERROR);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">{SYNC_LABEL.PROFILE_SETTINGS_TITLE}</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm">{SYNC_LABEL.PROFILE_SETTINGS_DESCRIPTION}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-1.5 sm:space-x-2">
                <FiUser className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>{SYNC_LABEL.PROFILE_INFORMATION}</span>
              </CardTitle>
              <CardDescription>{SYNC_LABEL.PROFILE_INFORMATION_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium  mb-2">{SYNC_LABEL.LABEL_FIRST_NAME}</label>
                    <Input
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      placeholder={SYNC_LABEL.PLACEHOLDER_FIRST_NAME_PROFILE}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium  mb-2">{SYNC_LABEL.LABEL_LAST_NAME}</label>
                    <Input
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      placeholder={SYNC_LABEL.PLACEHOLDER_LAST_NAME_PROFILE}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_BIO}</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    placeholder={SYNC_LABEL.PLACEHOLDER_BIO_PROFILE}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium  mb-2">{SYNC_LABEL.LABEL_AVATAR_URL}</label>
                  <Input
                    name="avatar"
                    value={profileData.avatar}
                    onChange={handleProfileChange}
                    placeholder={SYNC_LABEL.PLACEHOLDER_AVATAR_URL_PROFILE}
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
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-1.5 sm:space-x-2">
                <FiLock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>{SYNC_LABEL.CHANGE_PASSWORD}</span>
              </CardTitle>
              <CardDescription>{SYNC_LABEL.CHANGE_PASSWORD_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium  mb-2">{SYNC_LABEL.CURRENT_PASSWORD}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <Input
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder={SYNC_LABEL.PLACEHOLDER_CURRENT_PASSWORD}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <FiEyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FiEye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium  mb-2">{SYNC_LABEL.NEW_PASSWORD}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <Input
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder={SYNC_LABEL.PLACEHOLDER_NEW_PASSWORD}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium  mb-2">{SYNC_LABEL.CONFIRM_NEW_PASSWORD}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder={SYNC_LABEL.PLACEHOLDER_CONFIRM_PASSWORD}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
        </div>

        {/* Account Information */}
        <Card className="mt-8 shadow-sm border">
          <CardHeader>
            <CardTitle>{SYNC_LABEL.ACCOUNT_INFORMATION}</CardTitle>
            <CardDescription>{SYNC_LABEL.ACCOUNT_INFORMATION_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 items-stretch">
              {/* Avatar + Username */}
              <div className="flex flex-col items-center text-center space-y-3 p-4 border rounded-lg">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ring-2 ring-primary/20">
                  {user?.avatar ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <img src={user.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl sm:text-2xl font-semibold text-gray-600">
                      {(user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-semibold text-blue-600 break-all">{user?.username}</div>
                  <div className="text-xs text-gray-500">{SYNC_LABEL.USERNAME_LABEL}</div>
                </div>
              </div>

              {/* Email */}
              <div className="text-center p-4 border rounded-lg break-words">
                <div className="text-base sm:text-lg font-semibold text-green-600 break-words">{user?.email}</div>
                <div className="text-xs text-gray-500 mt-1">{SYNC_LABEL.EMAIL_LABEL}</div>
              </div>

              {/* Role */}
              <div className="text-center sm:col-span-1 p-4 border rounded-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium capitalize">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> {user?.role}
                </div>
                <div className="text-xs text-gray-500 mt-2">{SYNC_LABEL.ROLE_LABEL}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
