import { NavLink, useNavigate } from 'react-router-dom';
import { useLogout } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui/Icon';
import avatarManagerMgmt from '@/assets/img/avatar-manager-mgmt.jpg';
import avatarManagerRdetails from '@/assets/img/avatar-manager-rdetails.jpg';
import { mainNavItems, secondaryNavItems, mgmtNavItems, mgmtUtilityLinks, type NavItem, type MgmtNavItem } from './navConfig';

export type SidebarVariant =
  | 'default'
  | 'desk'
  | 'details'
  | 'rooms'
  | 'mgmt'
  | 'roomDetails'
  | 'config'
  | 'guest'
  | 'housekeeping'
  | 'billing'
  | 'invoice';

interface SidebarProps {
  /** Mobile drawer state; desktop is always visible (md+). */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  /**
   * `default` = dashboard shell (gold circular brand chip, CTA above nav).
   * `desk`    = reservations shell (square brand chip, Settings + solid New Booking at bottom).
   * `details` = reservation_details shell (square chip w/ mt-2, CTA after brand with mb-6,
   *             nav in scrollable pr-2 space-y-1 column, Settings under a top divider).
   * `rooms`   = rooms_luxestay_pro shell (GOLD square brand chip, nav gap-2 with Settings
   *             mt-auto inside the scroll area, CTA pinned at the very bottom).
   */
  variant?: SidebarVariant;
}

/** Exact link treatments from reference/dashboard_luxestay_pro (lines 158/165). */
function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'flex items-center gap-3 px-4 py-3 bg-surface-container-highest text-primary font-bold rounded-lg scale-95 active:scale-100 transition-transform'
    : 'flex items-center gap-3 px-4 py-3 text-on-primary-fixed-variant hover:text-on-primary hover:bg-primary-fixed-variant transition-colors scale-95 active:scale-100 transition-transform rounded-lg';
}

/** reference/reservation_details lines 148/153: same recipe plus shadow-sm on the active tab. */
function detailNavLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'flex items-center gap-3 px-4 py-3 bg-surface-container-highest text-primary font-bold rounded-lg scale-95 active:scale-100 transition-transform shadow-sm'
    : navLinkClass({ isActive });
}

/** reference/rooms_luxestay_pro lines 140/149: no scale classes when inactive, filled icon on active. */
function roomsNavLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'flex items-center gap-3 px-4 py-3 bg-surface-container-highest text-primary font-bold rounded-lg scale-95 active:scale-100 transition-transform shadow-sm'
    : 'flex items-center gap-3 px-4 py-3 text-on-primary-fixed-variant hover:text-on-primary hover:bg-primary-fixed-variant transition-colors rounded-lg';
}

/** reference/room_management_grid_view lines 125/131: gold left-bar indicator when active. */
function mgmtNavLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'flex items-center gap-3 py-3 font-body-md text-body-md text-secondary-fixed font-bold border-l-4 border-secondary-fixed pl-4 transition-all duration-200 ease-in-out'
    : 'flex items-center gap-3 py-3 font-body-md text-body-md text-on-primary-container pl-5 hover:text-secondary-fixed-dim hover:bg-primary-container transition-all duration-200 ease-in-out';
}

/** reference/room_details lines 207/211: same left-bar recipe plus bg-primary-container
 *  on the active item; space-x-3 instead of gap-3. */
function rdNavLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'flex items-center space-x-3 py-3 text-secondary-fixed font-bold border-l-4 border-secondary-fixed pl-4 hover:text-secondary-fixed-dim hover:bg-primary-container transition-colors bg-primary-container'
    : 'flex items-center space-x-3 py-3 text-on-primary-container pl-5 hover:text-secondary-fixed-dim hover:bg-primary-container transition-colors';
}

/** reference/guest_profile_luxestay_pro lines 132-163: rounded-lg items, hover lifts to
 *  on-primary-fixed-variant with gold text and a slight scale; active = bold gold on the
 *  same raised background, statically scaled down. */
function guestNavLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'flex items-center gap-3 px-4 py-3 rounded-lg text-secondary-fixed bg-on-primary-fixed-variant font-bold scale-95 transition-colors duration-150 ease-in-out'
    : 'flex items-center gap-3 px-4 py-3 rounded-lg text-on-primary font-medium hover:bg-on-primary-fixed-variant hover:text-secondary-fixed transition-colors duration-150 ease-in-out hover:scale-[0.98]';
}

function NavList({
  items,
  onNavigate,
  linkClass = navLinkClass,
  tailItemClass,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  linkClass?: typeof navLinkClass;
  /** Extra class for the final item (e.g. rooms shell pins Settings with mt-auto). */
  tailItemClass?: string;
}) {
  return (
    <>
      {items.map((item, idx) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={(data) =>
            cn(linkClass(data), tailItemClass && idx === items.length - 1 && tailItemClass)
          }
          onClick={onNavigate}
        >
          {({ isActive }) => (
            <>
              <Icon name={item.iconName} fill={isActive} />
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

function Brand({ variant }: { variant: SidebarVariant }) {
  if (variant === 'mgmt' || variant === 'roomDetails') {
    /* Text-only brand — room_management_grid_view lines 116-122 / room_details lines 202-205.
       room_details adds a bottom divider and keeps the manager portrait for the footer. */
    return (
      <>
        <div
          className={cn(
            'px-5 py-6',
            variant === 'roomDetails' && 'border-b border-primary-container',
          )}
        >
          <h1 className="font-headline-sm text-headline-sm text-secondary-fixed tracking-tight">LuxeStay Pro</h1>
          <p className={cn(variant === 'mgmt' ? 'font-body-sm text-body-sm' : 'font-label-md text-label-md', 'text-on-primary-container mt-1')}>
            Grand Plaza Heights
          </p>
        </div>
        {variant === 'mgmt' && (
          <div className="px-5 mb-8 flex items-center gap-3">
            <img
              alt="Hotel manager portrait"
              src={avatarManagerMgmt}
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
        )}
      </>
    );
  }
  if (variant === 'default') {
    /* reference/dashboard lines 140-148 */
    return (
      <div className="flex items-center gap-4 px-2 py-6 mb-4">
        <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
          <Icon name="domain" fill className="text-primary" />
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm text-on-primary">Luxe Stay</h1>
          <p className="font-label-md text-label-md opacity-70">Premium Management</p>
        </div>
      </div>
    );
  }
  if (variant === 'rooms') {
    /* reference/rooms_luxestay_pro lines 129-137: gold square chip */
    return (
      <div className="flex items-center gap-4 px-4 py-6 mb-4">
        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-on-secondary shadow-sm shrink-0">
          <Icon name="hotel" fill />
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm text-on-primary">Luxe Stay</h1>
          <p className="font-label-md text-label-md text-primary-fixed-dim">Premium Management</p>
        </div>
      </div>
    );
  }
  /* desk (enhanced_reservations 140-148) and details (reservation_details 134-142) share the
     square brand chip; details adds mt-2 and an explicit icon size. */
  return (
    <div className={cn('flex items-center gap-4 mb-8 px-2', variant === 'details' && 'mt-2')}>
      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
        <Icon name="hotel" fill className="text-primary" />
      </div>
      <div>
        <h1 className="font-headline-sm text-headline-sm text-on-primary">Luxe Stay</h1>
        <p className="font-label-md text-label-md text-on-primary-container opacity-80">Premium Management</p>
      </div>
    </div>
  );
}

/** Renders a footer utility link. Support has no destination and stays inert;
 *  Logout is wired to the auth logout flow. */
function UtilityLink({
  item,
  className,
  closeMobile,
}: {
  item: MgmtNavItem;
  className: string;
  closeMobile?: () => void;
}) {
  const logout = useLogout();

  if (item.label === 'Logout') {
    return (
      <button
        type="button"
        onClick={() => {
          closeMobile?.();
          logout();
        }}
        className={`${className} w-full text-left cursor-pointer focus-visible:outline-none g-focus-ring`}
      >
        <Icon name={item.iconName} />
        <span>{item.label}</span>
      </button>
    );
  }

  return (
    <span className={className}>
      <Icon name={item.iconName} />
      <span>{item.label}</span>
    </span>
  );
}

/** Sidebar content shared by the management shells — room_management_grid_view lines 114-180
 *  and room_details lines 200-253. */
function MgmtSidebarBody({
  variant,
  onCloseMobile,
}: {
  variant: 'mgmt' | 'roomDetails';
  onCloseMobile: () => void;
}) {
  const rd = variant === 'roomDetails';
  const linkClass = rd ? rdNavLinkClass : mgmtNavLinkClass;

  return (
    <>
      <Brand variant={variant} />
      {rd ? (
        <nav aria-label="Main" className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2">
            {mgmtNavItems.map((item) =>
              item.path ? (
                <li key={item.label}>
                  <NavLink to={item.path} onClick={onCloseMobile} className={rdNavLinkClass}>
                    {() => (
                      <>
                        {/* room_details keeps icons unfilled even when active */}
                        <Icon name={item.iconName} />
                        <span className="font-body-md">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ) : (
                <li key={item.label}>
                  <span className={rdNavLinkClass({ isActive: false })}>
                    <Icon name={item.iconName} />
                    <span className="font-body-md">{item.label}</span>
                  </span>
                </li>
              ),
            )}
          </ul>
        </nav>
      ) : (
        <ul className="flex flex-col gap-2 flex-grow overflow-y-auto">
          {mgmtNavItems.map((item) =>
            item.path ? (
              <li key={item.label}>
                <NavLink to={item.path} onClick={onCloseMobile} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <Icon name={item.iconName} fill={isActive} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ) : (
              <li key={item.label}>
                <span className={linkClass({ isActive: false })}>
                  <Icon name={item.iconName} />
                  <span>{item.label}</span>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
      {rd ? (
        /* room_details lines 232-252: CTA + utilities + manager profile under a top divider */
        <div className="p-5 border-t border-primary-container">
          <button
            type="button"
            title="Upgrade Stay"
            className="w-full bg-secondary-fixed text-primary font-label-lg text-label-lg py-3 rounded hover:bg-secondary-fixed-dim transition-colors mb-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            Upgrade Stay
          </button>
          <div className="space-y-2">
            {mgmtUtilityLinks.map((item) => (
              <UtilityLink
                key={item.label}
                item={item}
                closeMobile={onCloseMobile}
                className="flex items-center space-x-3 py-2 font-body-sm text-body-sm text-on-primary-container pl-5 hover:text-secondary-fixed-dim hover:bg-primary-container transition-colors"
              />
            ))}
          </div>
          <div className="mt-6 flex items-center space-x-3">
            <img
              alt="Hotel Manager Profile"
              src={avatarManagerRdetails}
              className="w-10 h-10 rounded-full object-cover border border-primary-container"
            />
            <p className="font-label-md text-label-md text-on-primary">Manager Profile</p>
          </div>
        </div>
      ) : (
        <>
          {/* Upgrade Stay CTA — reference lines 161-165; no destination screen exists yet */}
          <div className="px-5 mt-auto">
            <button
              type="button"
              title="Upgrade Stay"
              className="w-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-lg text-label-lg py-3 rounded hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              Upgrade Stay
            </button>
          </div>
          {/* Support / Logout — Support inert until a destination exists; Logout wired */}
          <ul className="flex flex-col gap-2 mt-6 pb-4">
            {mgmtUtilityLinks.map((item) => (
              <li key={item.label}>
                <UtilityLink
                  item={item}
                  closeMobile={onCloseMobile}
                  className="flex items-center gap-3 py-2 font-body-sm text-body-sm text-on-primary-container pl-5 hover:text-secondary-fixed-dim transition-colors"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/** reference/room_configuration lines 110-174: settings-area sidebar — label-lg nav
 *  with Settings active, secondary-container CTA, utilities under a divider, no avatar. */
function ConfigSidebarBody({ onCloseMobile }: { onCloseMobile: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive
      ? 'flex items-center space-x-3 py-3 text-secondary-fixed font-bold border-l-4 border-secondary-fixed pl-4 bg-primary-container transition-all duration-200 ease-in-out'
      : 'flex items-center space-x-3 py-3 text-on-primary-container pl-5 hover:text-secondary-fixed-dim hover:bg-primary-container transition-all duration-200 ease-in-out';

  return (
    <>
      <div className="px-container-padding py-6">
        <h1 className="font-headline-sm text-headline-sm text-secondary-fixed tracking-tight">LuxeStay Pro</h1>
        <p className="font-label-md text-label-md text-on-primary-container mt-1">Grand Plaza Heights</p>
      </div>
      <nav aria-label="Main" className="flex-1 mt-6">
        <ul className="space-y-2">
          {mgmtNavItems.map((item) =>
            item.path ? (
              <li key={item.label}>
                <NavLink to={item.path} onClick={onCloseMobile} className={linkClass}>
                  {() => (
                    <>
                      {/* source keeps icons unfilled in this shell */}
                      <Icon name={item.iconName} />
                      <span className="font-label-lg text-label-lg">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ) : (
              <li key={item.label}>
                <span className={linkClass({ isActive: false })}>
                  <Icon name={item.iconName} />
                  <span className="font-label-lg text-label-lg">{item.label}</span>
                </span>
              </li>
            ),
          )}
        </ul>
      </nav>
      <div className="px-container-padding py-6">
        <button
          type="button"
          title="Upgrade Stay"
          className="w-full bg-secondary-container text-on-secondary-fixed-variant font-label-lg text-label-lg py-3 rounded hover:bg-secondary-fixed-dim transition-colors shadow-sm mb-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          Upgrade Stay
        </button>
        <ul className="space-y-2 border-t border-primary-container pt-4">
          {mgmtUtilityLinks.map((item) => (
            <li key={item.label}>
              <UtilityLink
                item={item}
                closeMobile={onCloseMobile}
                className="flex items-center space-x-3 py-2 text-on-primary-container pl-5 hover:text-secondary-fixed-dim transition-all duration-200 ease-in-out font-label-lg text-label-lg"
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** reference/guest_profile_luxestay_pro lines 123-170: diamond brand ("LuxeStay Pro" /
 *  "Premium HMS"), space-y-1 nav with Guests active, star-icon Upgrade Stay pinned last.
 *  Analytics has no destination screen and renders inert; Settings routes to /settings. */
function GuestSidebarBody({ onCloseMobile }: { onCloseMobile: () => void }) {
  return (
    <>
      <div className="mb-8 px-4 flex items-center gap-3">
        <Icon name="diamond" fill className="text-secondary-fixed text-[32px]" />
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-secondary-fixed">LuxeStay Pro</h1>
          <p className="font-label-md text-label-md text-secondary-fixed opacity-80">Premium HMS</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {mainNavItems.map((item) => (
          <NavLink key={item.path} to={item.path} onClick={onCloseMobile} className={guestNavLinkClass}>
            {({ isActive }) => (
              <>
                <Icon name={item.iconName} fill={isActive} />
                <span className="font-label-lg text-label-lg">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Analytics — no destination screen exists yet */}
        <span className={guestNavLinkClass({ isActive: false })}>
          <Icon name="analytics" />
          <span className="font-label-lg text-label-lg">Analytics</span>
        </span>
        <NavLink to="/settings" onClick={onCloseMobile} className={guestNavLinkClass}>
          {({ isActive }) => (
            <>
              <Icon name="settings" fill={isActive} />
              <span className="font-label-lg text-label-lg">Settings</span>
            </>
          )}
        </NavLink>
      </div>
      <div className="mt-auto pt-6 px-4">
        <button
          type="button"
          title="Upgrade Stay"
          className="w-full bg-secondary-fixed text-on-secondary-fixed font-label-lg text-label-lg py-3 rounded-lg shadow-sm hover:-translate-y-[1px] transition-transform flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          <Icon name="star" fill className="text-[18px]" />
          Upgrade Stay
        </button>
      </div>
    </>
  );
}

/** reference/housekeeping_dashboard_luxestay_pro lines 124-187: bare gold hotel brand icon,
 *  gap-2 nav with compact px-3 py-2.5 items (Housekeeping active, filled icon), upgrade-icon
 *  CTA pinned last. Analytics has no destination screen and renders inert. */
function HkSidebarBody({ onCloseMobile }: { onCloseMobile: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive
      ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-fixed bg-on-primary-fixed-variant font-bold scale-95 duration-150 ease-in-out'
      : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-primary font-medium hover:bg-on-primary-fixed-variant hover:text-secondary-fixed transition-colors scale-95 duration-150 ease-in-out';

  return (
    <>
      <div className="flex items-center gap-3 mb-10 px-2">
        <Icon name="hotel" fill className="text-secondary-fixed text-3xl" />
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-secondary-fixed">LuxeStay Pro</h1>
          <p className="font-label-md text-label-md text-primary-fixed-dim">Premium HMS</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2 flex-1">
        {mainNavItems.map((item) => (
          <li key={item.path}>
            <NavLink to={item.path} onClick={onCloseMobile} className={linkClass}>
              {({ isActive }) => (
                <>
                  <Icon name={item.iconName} fill={isActive} />
                  <span className="font-label-lg text-label-lg">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        {/* Analytics — no destination screen exists yet */}
        <li>
          <span className={linkClass({ isActive: false })}>
            <Icon name="analytics" />
            <span className="font-label-lg text-label-lg">Analytics</span>
          </span>
        </li>
        <li>
          <NavLink to="/settings" onClick={onCloseMobile} className={linkClass}>
            {({ isActive }) => (
              <>
                <Icon name="settings" fill={isActive} />
                <span className="font-label-lg text-label-lg">Settings</span>
              </>
            )}
          </NavLink>
        </li>
      </ul>
      <div className="mt-auto">
        <button
          type="button"
          title="Upgrade Stay"
          className="w-full bg-secondary-fixed text-on-secondary-fixed font-label-lg text-label-lg py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          <Icon name="upgrade" />
          Upgrade Stay
        </button>
      </div>
    </>
  );
}

/** reference/invoice_luxestay_pro lines 118-167: diamond-family brand but with the filled
 *  gold hotel_class chip icon, space-y-1 nav (Billing active, icons unfilled even when
 *  active), and a solid-gold Upgrade Stay CTA above a top divider. Analytics/Guests render
 *  inert per source; Settings routes to /settings. */
function InvoiceSidebarBody({ onCloseMobile }: { onCloseMobile: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive
      ? 'flex items-center gap-3 px-3 py-3 text-secondary-fixed bg-on-primary-fixed-variant rounded-lg font-bold transition-colors'
      : 'flex items-center gap-3 px-3 py-3 rounded-lg text-on-primary font-medium hover:bg-on-primary-fixed-variant hover:text-secondary-fixed transition-colors';

  return (
    <>
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
          <Icon name="hotel_class" fill className="text-on-secondary-fixed" />
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-secondary-fixed">LuxeStay Pro</h1>
          <p className="font-label-md text-label-md text-secondary-fixed opacity-80">Premium HMS</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavLink key={item.path} to={item.path} onClick={onCloseMobile} className={linkClass}>
            {() => (
              <>
                {/* source keeps every nav icon unfilled in this shell, incl. active Billing */}
                <Icon name={item.iconName} />
                <span className="font-label-lg text-label-lg">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Analytics — no destination screen exists yet */}
        <span className={linkClass({ isActive: false })}>
          <Icon name="analytics" />
          <span className="font-label-lg text-label-lg">Analytics</span>
        </span>
        <NavLink to="/settings" onClick={onCloseMobile} className={linkClass}>
          {() => (
            <>
              <Icon name="settings" />
              <span className="font-label-lg text-label-lg">Settings</span>
            </>
          )}
        </NavLink>
      </nav>
      <div className="mt-auto pt-6 border-t border-on-primary-fixed-variant">
        <button
          type="button"
          title="Upgrade Stay"
          className="w-full bg-secondary text-on-secondary py-3 px-4 rounded-DEFAULT font-label-lg text-label-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          <Icon name="star" fill />
          Upgrade Stay
        </button>
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen, onCloseMobile, variant = 'default' }: SidebarProps) {
  const navigate = useNavigate();
  const desk = variant === 'desk';
  const details = variant === 'details';
  const rooms = variant === 'rooms';
  const goToNewBooking = () => {
    onCloseMobile();
    navigate('/reservations/new');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          'bg-primary font-body-md text-body-md fixed left-0 top-0 h-full w-sidebar-width shadow-sm z-20 md:flex flex-col',
          variant === 'mgmt' || variant === 'roomDetails' || variant === 'config'
            ? 'py-unit'
            : variant === 'guest' ||
                variant === 'housekeeping' ||
                variant === 'billing' ||
                variant === 'invoice'
              ? 'py-6 px-4'
              : 'border-r border-outline-variant p-4',
          'transition-transform duration-300 md:translate-x-0',
          mobileOpen ? 'flex translate-x-0 shadow-xl' : '-translate-x-full',
        )}
      >
        {variant !== 'mgmt' && variant !== 'roomDetails' && variant !== 'config' && variant !== 'guest' && variant !== 'housekeeping' && variant !== 'invoice' && (
          <>
        <Brand variant={variant} />

        {/* CTA (dashboard placement: above the nav) */}
        {!desk && !details && !rooms && (
          <button
            type="button"
            onClick={goToNewBooking}
            className="w-full bg-secondary-fixed hover:bg-secondary-fixed-dim text-primary font-label-lg text-label-lg py-3 px-4 rounded-lg flex items-center justify-center gap-2 mb-8 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="add" />
            New Booking
          </button>
        )}

        {/* details placement: solid-gold CTA directly after the brand block */}
        {details && (
          <button
            type="button"
            onClick={goToNewBooking}
            className="w-full bg-secondary text-on-secondary font-label-lg text-label-lg py-3 rounded-lg mb-6 hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="add" className="text-[18px]" />
            New Booking
          </button>
        )}

        {/* Navigation links */}
        {rooms ? (
          /* reference/rooms lines 139-169: single scroll column, Settings rides at its end */
          <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
            <NavList items={mainNavItems} onNavigate={onCloseMobile} linkClass={roomsNavLinkClass} />
            <NavList
              items={secondaryNavItems}
              onNavigate={onCloseMobile}
              linkClass={roomsNavLinkClass}
              tailItemClass="mt-auto"
            />
          </div>
        ) : details ? (
          <div className="flex-1 overflow-y-auto pr-2 space-y-1">
            <NavList items={mainNavItems} onNavigate={onCloseMobile} linkClass={detailNavLinkClass} />
          </div>
        ) : (
          <nav aria-label="Main" className={cn('overflow-y-auto', desk ? 'flex flex-col gap-1 flex-grow' : 'flex-1')}>
            {desk ? (
              <NavList items={mainNavItems} onNavigate={onCloseMobile} />
            ) : (
              <ul className="space-y-2">
                <NavList items={mainNavItems} onNavigate={onCloseMobile} />
              </ul>
            )}
          </nav>
        )}

        {rooms ? (
          /* CTA pinned at the very bottom — reference/rooms lines 170-176 */
          <div className="mt-4 px-2">
            <button
              type="button"
              onClick={goToNewBooking}
              className="w-full py-3 bg-secondary text-on-secondary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <Icon name="add" />
              New Booking
            </button>
          </div>
        ) : desk ? (
          /* Settings & CTA — reference/enhanced_reservations lines 182-192 */
          <div className="flex flex-col gap-4 mt-auto">
            <NavList items={secondaryNavItems} onNavigate={onCloseMobile} />
            <button
              type="button"
              onClick={goToNewBooking}
              className="w-full py-3 px-4 bg-secondary text-on-secondary font-label-lg text-label-lg rounded-lg hover-shift hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <Icon name="add" className="text-[18px]" />
              New Booking
            </button>
          </div>
        ) : details ? (
          /* Settings under divider — reference/reservation_details lines 174-179 */
          <div className="pt-4 mt-4 border-t border-primary-fixed-variant/30">
            <NavList items={secondaryNavItems} onNavigate={onCloseMobile} linkClass={detailNavLinkClass} />
          </div>
        ) : (
          /* Bottom settings — billing adds a top divider (billing_payments line 125) */
          <div className={cn('mt-auto', variant === 'billing' && 'pt-6 border-t border-on-primary-fixed-variant')}>
            <ul>
              <NavList items={secondaryNavItems} onNavigate={onCloseMobile} />
            </ul>
          </div>
        )}
          </>
        )}
        {(variant === 'mgmt' || variant === 'roomDetails') && (
          <MgmtSidebarBody variant={variant} onCloseMobile={onCloseMobile} />
        )}
        {variant === 'config' && <ConfigSidebarBody onCloseMobile={onCloseMobile} />}
        {variant === 'guest' && <GuestSidebarBody onCloseMobile={onCloseMobile} />}
        {variant === 'housekeeping' && <HkSidebarBody onCloseMobile={onCloseMobile} />}
        {variant === 'invoice' && <InvoiceSidebarBody onCloseMobile={onCloseMobile} />}
      </aside>
    </>
  );
}
