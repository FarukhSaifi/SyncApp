import { useEffect, useState } from "react";

import {
  ANALYTICS_LABELS,
  APP_CONFIG,
  BUTTON_LABELS,
  INFO_MESSAGES,
  KEYBOARD_KEYS,
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

import { APP_SHELL } from "@constants/designTokens";

import AppLogo from "@components/common/AppLogo";

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const navigation = [
    { name: PAGE_TITLES.DASHBOARD, href: ROUTES.DASHBOARD, icon: FiHome },
    { name: ANALYTICS_LABELS.PAGE_TITLE, href: ROUTES.ANALYTICS, icon: FiBarChart2 },
    { name: BUTTON_LABELS.NEW_POST, href: ROUTES.EDITOR, icon: FiPlus },
    { name: PAGE_TITLES.SETTINGS, href: ROUTES.SETTINGS, icon: FiSettings },
    ...(user?.role === USER_ROLES.ADMIN ? [{ name: PAGE_TITLES.USERS, href: ROUTES.USERS, icon: FiUsers }] : []),
  ];

  const isEditorRoute = Boolean(pathname?.startsWith(ROUTES.EDITOR));

  const handleLogout = () => {
    setShowMobileDrawer(false);
    logout();
    router.push(ROUTES.LOGIN);
  };

  useEffect(() => {
    setShowMobileDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!showMobileDrawer) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_KEYS.ESCAPE) {
        setShowMobileDrawer(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMobileDrawer]);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const userDisplayName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || PLACEHOLDERS.USER;

  const isNavActive = (href: string) => {
    if (href === ROUTES.DASHBOARD) {
      return pathname === ROUTES.DASHBOARD;
    }
    return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  };

  const renderNavLinks = (onNavigate?: () => void) => {
    return navigation.map((item) => {
      const Icon = item.icon;
      const isActive = isNavActive(item.href);

      return (
        <Link
          key={item.name}
          href={item.href}
          className={`${APP_SHELL.NAV_LINK_BASE} ${isActive ? APP_SHELL.NAV_LINK_ACTIVE : APP_SHELL.NAV_LINK_IDLE}`}
          onClick={onNavigate}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.name}</span>
        </Link>
      );
    });
  };

  const renderSidebarChrome = (options?: { onNavigate?: () => void; onClose?: () => void }) => {
    const onNavigate = options?.onNavigate;
    const onClose = options?.onClose;

    return (
      <>
        <div className={APP_SHELL.SIDEBAR_BRAND_CLASS}>
          <Link href={ROUTES.DASHBOARD} className={APP_SHELL.SIDEBAR_BRAND_LINK_CLASS} onClick={onNavigate}>
            <AppLogo priority />
            <span className={APP_SHELL.LOGO_TEXT_CLASS}>{APP_CONFIG.APP_NAME}</span>
          </Link>
          {onClose ? (
            <button
              type="button"
              className={APP_SHELL.MENU_BUTTON_CLASS}
              onClick={onClose}
              aria-label={INFO_MESSAGES.CLOSE_MOBILE_MENU_ARIA}
            >
              <FiX className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <nav className={APP_SHELL.SIDEBAR_NAV_CLASS} aria-label={INFO_MESSAGES.MAIN_NAVIGATION_ARIA}>
          {renderNavLinks(onNavigate)}
        </nav>

        <div className={APP_SHELL.SIDEBAR_FOOTER_CLASS}>
          <button
            type="button"
            onClick={toggleTheme}
            className={APP_SHELL.PROFILE_BUTTON_CLASS}
            aria-label={INFO_MESSAGES.TOGGLE_THEME_ARIA}
            title={INFO_MESSAGES.TOGGLE_THEME(theme === THEME_VALUES.DARK ? THEME_VALUES.LIGHT : THEME_VALUES.DARK)}
          >
            {theme === THEME_VALUES.DARK ? (
              <FiSun className="h-4 w-4 shrink-0" />
            ) : (
              <FiMoon className="h-4 w-4 shrink-0" />
            )}
            <span>
              {theme === THEME_VALUES.DARK ? INFO_MESSAGES.THEME_SWITCH_TO_LIGHT : INFO_MESSAGES.THEME_SWITCH_TO_DARK}
            </span>
          </button>

          <Link href={ROUTES.PROFILE} className={APP_SHELL.PROFILE_BUTTON_CLASS} onClick={onNavigate}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <FiUser className="h-4 w-4 text-primary" />
            </div>
            <span className="min-w-0 truncate text-left">
              <span className="block truncate text-foreground">{userDisplayName}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
          </Link>

          <button type="button" onClick={handleLogout} className={APP_SHELL.PROFILE_BUTTON_CLASS}>
            <FiLogOut className="h-4 w-4 shrink-0" />
            <span>{BUTTON_LABELS.SIGN_OUT}</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className={isEditorRoute ? APP_SHELL.ROOT_EDITOR_CLASS : APP_SHELL.ROOT_CLASS}>
      {/* Desktop sidebar stays off on editor — writing needs full width; toolbar has Back. */}
      {!isEditorRoute ? <aside className={APP_SHELL.SIDEBAR_CLASS}>{renderSidebarChrome()}</aside> : null}

      <div className={isEditorRoute ? APP_SHELL.CONTENT_COLUMN_EDITOR_CLASS : APP_SHELL.CONTENT_COLUMN_CLASS}>
        <header className={APP_SHELL.MOBILE_HEADER_CLASS}>
          <div className={APP_SHELL.MOBILE_HEADER_INNER_CLASS}>
            <Link href={ROUTES.DASHBOARD} className="flex min-w-0 items-center gap-1.5">
              <AppLogo priority />
              <span className={APP_SHELL.LOGO_TEXT_CLASS}>{APP_CONFIG.APP_NAME}</span>
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                className={APP_SHELL.THEME_BUTTON_CLASS}
                aria-label={INFO_MESSAGES.TOGGLE_THEME_ARIA}
              >
                {theme === THEME_VALUES.DARK ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                className={APP_SHELL.MENU_BUTTON_CLASS}
                onClick={() => {
                  setShowMobileDrawer(true);
                }}
                aria-label={INFO_MESSAGES.OPEN_MOBILE_MENU_ARIA}
                aria-expanded={showMobileDrawer}
              >
                <FiMenu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {showMobileDrawer ? (
          <>
            <button
              type="button"
              className={APP_SHELL.DRAWER_OVERLAY_CLASS}
              aria-label={INFO_MESSAGES.CLOSE_MOBILE_MENU_ARIA}
              onClick={() => {
                setShowMobileDrawer(false);
              }}
            />
            <div
              className={APP_SHELL.DRAWER_PANEL_CLASS}
              role="dialog"
              aria-modal="true"
              aria-label={INFO_MESSAGES.OPEN_MOBILE_MENU_ARIA}
            >
              {renderSidebarChrome({
                onNavigate: () => {
                  setShowMobileDrawer(false);
                },
                onClose: () => {
                  setShowMobileDrawer(false);
                },
              })}
            </div>
          </>
        ) : null}

        <main className={isEditorRoute ? APP_SHELL.MAIN_EDITOR_CLASS : APP_SHELL.MAIN_CLASS}>{children}</main>

        {!isEditorRoute ? (
          <footer className={APP_SHELL.FOOTER_CLASS}>
            <div className={APP_SHELL.FOOTER_INNER_CLASS}>
              <p>{APP_CONFIG.COPYRIGHT}</p>
              <p className="mt-1">{APP_CONFIG.APP_DESCRIPTION}</p>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
};

export default Layout;
