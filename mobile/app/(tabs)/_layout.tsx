import { Tabs, router } from "expo-router";

import { AppHeaderLeft, AppHeaderRight } from "@/src/components/AppHeaderActions";
import { FloatingTabBar, type FloatingTabBarProps } from "@/src/components/FloatingTabBar";
import { FLOATING_TAB_BAR_STYLE, LABELS, ROUTES, tabScreenOptions } from "@/src/constants";
import { USER_ROLES } from "@/src/constants/userRoles";
import { useAuth } from "@/src/contexts/AuthContext";
import { useThemeColors } from "@/src/contexts/ThemeContext";

const tabHeaderActions = {
  headerLeft: () => <AppHeaderLeft />,
  headerRight: () => <AppHeaderRight />,
};

export default function TabLayout() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const header = tabScreenOptions(colors);
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <FloatingTabBar {...(props as FloatingTabBarProps)} />}
      screenOptions={{
        ...header,
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: FLOATING_TAB_BAR_STYLE,
        ...tabHeaderActions,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: LABELS.DASHBOARD,
          tabBarLabel: LABELS.DASHBOARD,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: LABELS.ANALYTICS,
          tabBarLabel: LABELS.ANALYTICS,
        }}
      />
      <Tabs.Screen
        name="new-post"
        options={{
          title: LABELS.TAB_NEW,
          tabBarLabel: LABELS.TAB_NEW,
          href: null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push(ROUTES.EDITOR_NEW);
          },
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: LABELS.SETTINGS,
          tabBarLabel: LABELS.SETTINGS,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: LABELS.USERS,
          tabBarLabel: LABELS.USERS,
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}
