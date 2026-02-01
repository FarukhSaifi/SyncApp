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
import { APP_CONFIG, PLACEHOLDERS, ROUTES, USER_ROLES } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const navigation = [
    { name: "Dashboard", href: ROUTES.DASHBOARD, icon: FiHome },
    { name: "New Post", href: ROUTES.EDITOR, icon: FiPlus },
    { name: "Settings", href: ROUTES.SETTINGS, icon: FiSettings },
    ...(user?.role === USER_ROLES.ADMIN ? [{ name: "Users", href: ROUTES.USERS, icon: FiUsers }] : []),
  ];

  const handleLogout = () => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    logout();
    navigate(ROUTES.LOGIN);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
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
            <Link to="/" className="flex items-center space-x-2">
              <FiFileText className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">SyncApp</span>
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
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
                className="p-2.5 sm:p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
                aria-label="Toggle theme"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>

              {/* Profile Menu */}
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="User menu"
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
                      className="block px-4 py-2.5 sm:py-2 text-sm text-foreground hover:bg-accent transition-colors min-h-[44px] sm:min-h-0 items-center touch-manipulation"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 sm:py-2 text-sm text-foreground hover:bg-accent transition-colors min-h-[44px] sm:min-h-0 flex items-center touch-manipulation"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden relative" ref={mobileMenuRef}>
                <button
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  onClick={() => {
                    setShowMobileMenu(!showMobileMenu);
                    setShowProfileMenu(false);
                  }}
                  aria-label="Open mobile menu"
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
                            isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
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
                        className="flex items-center space-x-2 px-4 py-2.5 sm:py-2 text-sm text-foreground hover:bg-accent transition-colors min-h-[44px] sm:min-h-0 touch-manipulation"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <FiUser className="h-4 w-4 shrink-0" />
                        <span>Profile Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full text-left px-4 py-2.5 sm:py-2 text-sm text-foreground hover:bg-accent transition-colors min-h-[44px] sm:min-h-0 touch-manipulation"
                      >
                        <FiLogOut className="h-4 w-4" />
                        <span>Sign Out</span>
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
