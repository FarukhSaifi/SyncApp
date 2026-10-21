import { useEffect, useRef, useState } from "react";

import {
  ANALYTICS_LABELS,
  APP_CONFIG,
  BUTTON_LABELS,
  INFO_MESSAGES,
  PAGE_TITLES,
  PLACEHOLDERS,
  ROUTES,
  THEME_VALUES,
  USER_ROLES,
} from "@constants";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import type { LayoutProps } from "@types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiBarChart2,
  FiChevronDown,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiPlus,
  FiSettings,
  FiSun,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { APP_HEADER } from "@constants/designTokens";

import AppLogo from "@components/common/AppLogo";

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: PAGE_TITLES.DASHBOARD, href: ROUTES.DASHBOARD, icon: FiHome },
    { name: ANALYTICS_LABELS.PAGE_TITLE, href: ROUTES.ANALYTICS, icon: FiBarChart2 },
    { name: BUTTON_LABELS.NEW_POST, href: ROUTES.EDITOR, icon: FiPlus },
    { name: PAGE_TITLES.SETTINGS, href: ROUTES.SETTINGS, icon: FiSettings },
    ...(user?.role === USER_ROLES.ADMIN ? [{ name: PAGE_TITLES.USERS, href: ROUTES.USERS, icon: FiUsers }] : []),
  ];

  const handleLogout = () => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    logout();
    router.push(ROUTES.LOGIN);
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
  }, [pathname]);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const userDisplayName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || PLACEHOLDERS.USER;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — compact on mobile (≤15dvh), full chrome on md+ */}
      <header className={APP_HEADER.ROOT_CLASS}>
        <div className={APP_HEADER.INNER_CLASS}>
          <div className="flex w-full items-center justify-between gap-2">
            {/* Logo */}
            <Link href={ROUTES.DASHBOARD} className="flex min-w-0 items-center gap-1.5 md:gap-2">
              <AppLogo priority />
              <span className={`${APP_HEADER.LOGO_TEXT_CLASS} truncate`}>{APP_CONFIG.APP_NAME}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
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
            <div className={APP_HEADER.ACTIONS_GAP_CLASS}>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={APP_HEADER.THEME_BUTTON_CLASS}
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
                      href={ROUTES.PROFILE}
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
                  className={APP_HEADER.MENU_BUTTON_CLASS}
                  onClick={() => {
                    setShowMobileMenu(!showMobileMenu);
                    setShowProfileMenu(false);
                  }}
                  aria-label={INFO_MESSAGES.OPEN_MOBILE_MENU_ARIA}
                  aria-expanded={showMobileMenu}
                >
                  {showMobileMenu ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
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
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
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
                        href={ROUTES.PROFILE}
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
      {pathname?.startsWith(ROUTES.EDITOR) ? (
        /* Editor: full-bleed, no container, no footer */
        <main className="flex-1 overflow-hidden">{children}</main>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default Layout;
