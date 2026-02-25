import React, { useEffect, useRef, useState } from "react";
import {
  FiChevronDown,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMoon,
  FiPlus,
  FiSettings,
  FiSun,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";

import {
  APP_CONFIG,
  BUTTON_LABELS,
  INFO_MESSAGES,
  PAGE_TITLES,
  PLACEHOLDERS,
  ROUTES,
  THEME_VALUES,
  UI_TEXT,
  USER_ROLES,
} from "@constants";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: PAGE_TITLES.DASHBOARD, href: ROUTES.DASHBOARD, icon: FiHome },
    { name: BUTTON_LABELS.NEW_POST, href: ROUTES.EDITOR, icon: FiPlus },
    { name: PAGE_TITLES.SETTINGS, href: ROUTES.SETTINGS, icon: FiSettings },
    ...(user?.role === USER_ROLES.ADMIN ? [{ name: PAGE_TITLES.USERS, href: ROUTES.USERS, icon: FiUsers }] : []),
  ];

  const handleLogout = () => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    logout();
    navigate(ROUTES.LOGIN);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showProfileMenu || showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProfileMenu, showMobileMenu]);

  // Close menus when route changes
  useEffect(() => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const userDisplayName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || PLACEHOLDERS.USER;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2">
              <FiFileText className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">{UI_TEXT.appName}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/20"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 sm:p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
                aria-label={INFO_MESSAGES.TOGGLE_THEME_ARIA}
                title={INFO_MESSAGES.TOGGLE_THEME(theme === THEME_VALUES.DARK ? THEME_VALUES.LIGHT : THEME_VALUES.DARK)}
              >
                {theme === THEME_VALUES.DARK ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>

              {/* Profile Menu */}
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                  aria-label={INFO_MESSAGES.USER_MENU_ARIA}
                  aria-expanded={showProfileMenu}
                >
                  <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                    <FiUser className="h-4 w-4 text-primary" />
                  </div>
                  <span className="hidden sm:block">{user?.firstName || user?.username || PLACEHOLDERS.USER}</span>
                  <FiChevronDown className={`h-4 w-4 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-foreground">{userDisplayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link
                      to={ROUTES.PROFILE}
                      className="block px-4 py-2.5 sm:py-2 text-sm text-foreground hover:bg-primary/20 transition-colors min-h-[44px] sm:min-h-0 items-center touch-manipulation"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      {INFO_MESSAGES.PROFILE_SETTINGS_LINK}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 sm:py-2 text-sm text-foreground hover:bg-primary/20 transition-colors min-h-[44px] sm:min-h-0 flex items-center touch-manipulation"
                    >
                      {BUTTON_LABELS.SIGN_OUT}
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden relative" ref={mobileMenuRef}>
                <button
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                  onClick={() => {
                    setShowMobileMenu(!showMobileMenu);
                    setShowProfileMenu(false);
                  }}
                  aria-label={INFO_MESSAGES.OPEN_MOBILE_MENU_ARIA}
                  aria-expanded={showMobileMenu}
                >
                  {showMobileMenu ? (
                    <FiX className="h-6 w-6" />
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>

                {showMobileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border rounded-md shadow-lg py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-foreground">{userDisplayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    </div>

                    {/* Navigation Links */}
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary/20"
                          }`}
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}

                    {/* Profile & Logout */}
                    <div className="border-t mt-2 pt-2">
                      <Link
                        to={ROUTES.PROFILE}
                        className="flex items-center space-x-2 px-4 py-2.5 sm:py-2 text-sm text-foreground hover:bg-primary/20 transition-colors min-h-[44px] sm:min-h-0 touch-manipulation"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <FiUser className="h-4 w-4 shrink-0" />
                        <span>{INFO_MESSAGES.PROFILE_SETTINGS_LINK}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full text-left px-4 py-2.5 sm:py-2 text-sm text-foreground hover:bg-primary/20 transition-colors min-h-[44px] sm:min-h-0 touch-manipulation"
                      >
                        <FiLogOut className="h-4 w-4" />
                        <span>{BUTTON_LABELS.SIGN_OUT}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>{APP_CONFIG.COPYRIGHT}</p>
            <p className="mt-1">{APP_CONFIG.APP_DESCRIPTION}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
