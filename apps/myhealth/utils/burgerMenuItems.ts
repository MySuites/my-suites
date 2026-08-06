import { BurgerMenuItem } from '../components/ui/BurgerMenu';

// One item list per top-nav section (see NAV_TABS in navTabs.ts) - the
// burger menu holds whatever doesn't fit in that section's own bottom nav
// bar, so items are section-specific, not per-screen. Screens that share a
// top-nav section (workout/exercises/history all live under "Workout") share
// the same list here rather than each defining their own.

export const WORKOUT_MENU_ITEMS: BurgerMenuItem[] = [
    { label: 'Workout History', icon: 'clock.fill', route: '/history' },
    { label: 'Settings', icon: 'gearshape.fill', route: '/settings' },
];

export const PROFILE_MENU_ITEMS: BurgerMenuItem[] = [
    { label: 'Progress Pictures', icon: 'camera.fill', route: '/progress-pictures' },
    { label: 'Settings', icon: 'gearshape.fill', route: '/settings' },
];

export const SLEEP_MENU_ITEMS: BurgerMenuItem[] = [
    { label: 'Settings', icon: 'gearshape.fill', route: '/settings' },
];

export const MIND_MENU_ITEMS: BurgerMenuItem[] = [
    { label: 'Settings', icon: 'gearshape.fill', route: '/settings' },
];

export const NUTRITION_MENU_ITEMS: BurgerMenuItem[] = [
    { label: 'Settings', icon: 'gearshape.fill', route: '/settings' },
];
