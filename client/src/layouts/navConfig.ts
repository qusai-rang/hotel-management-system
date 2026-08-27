export interface NavItem {
  label: string;
  iconName: string;
  path: string;
}

/** Canonical sidebar navigation — labels normalized across the Stitch screens. */
export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', iconName: 'dashboard', path: '/dashboard' },
  { label: 'Reservations', iconName: 'calendar_month', path: '/reservations' },
  { label: 'Rooms', iconName: 'bed', path: '/rooms' },
  { label: 'Housekeeping', iconName: 'cleaning_services', path: '/housekeeping' },
  { label: 'Billing', iconName: 'payments', path: '/billing' },
];

export const secondaryNavItems: NavItem[] = [{ label: 'Settings', iconName: 'settings', path: '/settings' }];

/** reference/room_management_grid_view sidebar (lines 123-179). Items without a path
 *  have no destination screen in the app yet and render as inert entries. */
export interface MgmtNavItem {
  label: string;
  iconName: string;
  path?: string;
}

export const mgmtNavItems: MgmtNavItem[] = [
  { label: 'Dashboard', iconName: 'dashboard', path: '/dashboard' },
  { label: 'Room Management', iconName: 'bed', path: '/rooms/manage' },
  { label: 'Reservations', iconName: 'calendar_month', path: '/reservations' },
  { label: 'Guest Services', iconName: 'concierge' },
  { label: 'Analytics', iconName: 'insights' },
  { label: 'Settings', iconName: 'settings', path: '/settings' },
];

export const mgmtUtilityLinks: MgmtNavItem[] = [
  { label: 'Support', iconName: 'help' },
  { label: 'Logout', iconName: 'logout' },
];
