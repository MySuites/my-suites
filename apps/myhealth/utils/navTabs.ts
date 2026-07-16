export interface NavTab {
  key: string;
  href: string;
  // Broad section match — used by TopNavBanner to highlight which of the 5
  // main screens the user is in, including sub-routes like workout history.
  match: string[];
  // Narrower match — used by DashboardButton to decide whether the user is
  // exactly on the tab's own dashboard screen (not a sub-route of it).
  dashboardMatch: string[];
  icon: string;
  label: string;
}

// The 5 main screens, shared between TopNavBanner (switches between them) and
// DashboardButton (resolves "this screen's own dashboard").
export const NAV_TABS: NavTab[] = [
  { key: 'sleep', href: '/(tabs)/sleep', match: ['/sleep', '/(tabs)/sleep'], dashboardMatch: ['/sleep', '/(tabs)/sleep'], icon: 'moon.zzz.fill', label: 'Sleep' },
  { key: 'mind', href: '/(tabs)/mind', match: ['/mind', '/(tabs)/mind'], dashboardMatch: ['/mind', '/(tabs)/mind'], icon: 'brain.head.profile', label: 'Mind' },
  { key: 'profile', href: '/(tabs)', match: ['/', '/index', '/(tabs)', '/(tabs)/index'], dashboardMatch: ['/', '/index', '/(tabs)', '/(tabs)/index'], icon: 'person.fill', label: 'Profile' },
  { key: 'workout', href: '/(tabs)/workout', match: ['/workout', '/(tabs)/workout', '/history', '/(tabs)/history', '/exercises', '/(tabs)/exercises'], dashboardMatch: ['/workout', '/(tabs)/workout'], icon: 'dumbbell.fill', label: 'Workout' },
  { key: 'nutrition', href: '/(tabs)/nutrition', match: ['/nutrition', '/(tabs)/nutrition'], dashboardMatch: ['/nutrition', '/(tabs)/nutrition'], icon: 'fork.knife', label: 'Nutrition' },
];

export function findCurrentTab(pathname: string): NavTab {
  return NAV_TABS.find((tab) => tab.match.some((m) => pathname === m)) ?? NAV_TABS[2];
}

export function isOnOwnDashboard(pathname: string): boolean {
  const tab = findCurrentTab(pathname);
  return tab.dashboardMatch.some((m) => pathname === m);
}
