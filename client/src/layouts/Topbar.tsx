import { NavLink } from 'react-router-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import avatarManager from '@/assets/img/avatar-manager.jpg';
import avatarManagerDesk from '@/assets/img/avatar-manager-desk.jpg';
import avatarManagerDetails from '@/assets/img/avatar-manager-details.jpg';
import avatarManagerRooms from '@/assets/img/avatar-manager-rooms.jpg';
import avatarManagerRdetailsSm from '@/assets/img/avatar-manager-rdetails-sm.jpg';
import avatarManagerConfig from '@/assets/img/avatar-manager-config.jpg';
import avatarManagerGuest from '@/assets/img/avatar-manager-guest.jpg';
import avatarManagerHousekeeping from '@/assets/img/avatar-manager-housekeeping.jpg';
import avatarManagerBilling from '@/assets/img/avatar-manager-billing.jpg';
import avatarManagerInvoice from '@/assets/img/avatar-manager-invoice.jpg';
import { Icon } from '@/components/ui/Icon';

export type TopbarVariant =
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
  | 'invoice'
  | 'dashboard';

interface TopbarProps {
  onMenuClick: () => void;
  /**
   * `default` = dashboard shell (bordered search pill, flat bell, 32px avatar).
   * `desk`    = reservations shell (flex-1 borderless pill, 40px round bell, divider, 36px avatar).
   * `details` = reservation_details shell (bordered pill w/ focus-within ring, centered title,
   *             sm-only divider + Check In, 36px avatar).
   * `rooms`   = rooms_luxestay_pro shell (pill search w/ ring-2 wired to /rooms?q=,
   *             sm-visible title, h-8 divider, pill Check In w/ login icon, 40px avatar).
   */
  variant?: TopbarVariant;
}

export function Topbar({ onMenuClick, variant = 'default' }: TopbarProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const desk = variant === 'desk';
  const details = variant === 'details';
  const rooms = variant === 'rooms';

  if (variant === 'invoice') {
    /* reference/invoice_luxestay_pro lines 169-209: pill search on surface-variant
       ("Search invoices..."), bell with error dot, sm-only help, 32px avatar — plus the
       app's only mobile bottom tab bar (Home / Rooms / Billing active / More).
       Search stays unwired (no destination in the export). */
    return (
      <>
        <header className="bg-surface-container-lowest h-header-height border-b border-outline-variant flex justify-between items-center px-gutter z-40 sticky top-0 w-full">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={onMenuClick}
              className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer focus-visible:outline-none"
            >
              <Icon name="menu" />
            </button>
            <div className="hidden md:flex items-center bg-surface-variant rounded-full px-4 py-2 w-64">
              <Icon name="search" className="text-on-surface-variant mr-2" />
              <input
                type="text"
                placeholder="Search invoices..."
                aria-label="Search invoices"
                className="bg-transparent border-none focus:ring-0 font-body-sm text-body-sm w-full p-0 text-on-surface outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              className="p-2 hover:text-primary transition-colors relative cursor-pointer focus-visible:outline-none"
            >
              <Icon name="notifications" />
              <span aria-hidden="true" className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
            </button>
            <button
              type="button"
              aria-label="Help"
              title="Help"
              className="p-2 hover:text-primary transition-colors hidden sm:block cursor-pointer focus-visible:outline-none"
            >
              <Icon name="help" />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant ml-2">
              <img alt="Manager Profile" src={avatarManagerInvoice} className="w-full h-full object-cover" />
            </div>
          </div>
        </header>
        {/* Mobile bottom tab bar — reference lines 192-209; hidden with the rest of the
            chrome when printing via the enclosing #nav-shell */}
        <nav
          aria-label="Mobile"
          className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant flex justify-around py-3 z-50"
        >
          <NavLink to="/dashboard" className="flex flex-col items-center text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="dashboard" />
            <span className="font-label-md text-label-md mt-1">Home</span>
          </NavLink>
          <NavLink to="/rooms" className="flex flex-col items-center text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="bed" />
            <span className="font-label-md text-label-md mt-1">Rooms</span>
          </NavLink>
          <NavLink to="/billing" className="flex flex-col items-center text-primary font-bold">
            {() => (
              <>
                <Icon name="payments" fill />
                <span className="font-label-md text-label-md mt-1">Billing</span>
              </>
            )}
          </NavLink>
          <span className="flex flex-col items-center text-on-surface-variant cursor-default">
            <Icon name="more_horiz" />
            <span className="font-label-md text-label-md mt-1">More</span>
          </span>
        </nav>
      </>
    );
  }

  if (variant === 'billing') {
    /* reference/billing_payments lines 130-154: mobile brand title, max-w-md pill search
       ("Search invoices, guests, rooms..."), bell + help, 32px avatar with hover border.
       Search stays unwired (no destination in the export). */
    return (
      <header className="bg-surface-container-lowest h-header-height border-b border-outline-variant flex justify-between items-center px-container-padding z-40 sticky top-0 w-full">
        <div className="flex items-center gap-4 flex-1">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Icon name="menu" className="text-[24px]" />
          </button>
          <h2 className="font-headline-md text-headline-md font-bold text-primary md:hidden m-0">LuxeStay Pro</h2>
          <div className="hidden sm:flex relative w-full max-w-md ml-4 md:ml-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search invoices, guests, rooms..."
              aria-label="Search invoices, guests, rooms"
              className="w-full h-10 pl-10 pr-4 rounded-full border border-outline-variant bg-surface focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-body-sm text-body-sm text-on-surface transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="p-2 text-on-surface-variant hover:text-primary transition-all duration-200 active:opacity-80 rounded-full hover:bg-surface-container cursor-pointer focus-visible:outline-none"
          >
            <Icon name="notifications" className="text-[24px]" />
          </button>
          <button
            type="button"
            aria-label="Help"
            title="Help"
            className="p-2 text-on-surface-variant hover:text-primary transition-all duration-200 active:opacity-80 rounded-full hover:bg-surface-container cursor-pointer focus-visible:outline-none"
          >
            <Icon name="help" className="text-[24px]" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant ml-2 cursor-pointer hover:border-secondary transition-colors">
            <img alt="Manager Profile" src={avatarManagerBilling} className="w-full h-full object-cover" />
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'housekeeping') {
    /* reference/housekeeping_dashboard_luxestay_pro lines 192-220: rounded pill search
       ("Search rooms, staff..."), bell + help, divider, and a manager identity block
       ("Elena R." / "Housekeeping Mgr") with a w-10 avatar. Search stays unwired. */
    return (
      <header className="bg-surface-container-lowest text-primary h-header-height flex justify-between items-center px-gutter z-40 border-b border-outline-variant shrink-0 relative sticky top-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="md:hidden text-primary hover:text-primary-fixed transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Icon name="menu" className="text-2xl" />
          </button>
          <div className="hidden md:flex items-center bg-surface-container rounded-full px-4 py-2 border border-outline-variant focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
            <Icon name="search" className="text-on-surface-variant mr-2" />
            <input
              type="text"
              placeholder="Search rooms, staff..."
              aria-label="Search rooms, staff"
              className="bg-transparent border-none focus:ring-0 font-body-sm text-body-sm p-0 w-64 placeholder:text-on-surface-variant outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              className="hover:text-primary transition-all duration-200 active:opacity-80 cursor-pointer focus-visible:outline-none"
            >
              <Icon name="notifications" className="text-2xl" />
            </button>
            <button
              type="button"
              aria-label="Help"
              title="Help"
              className="hover:text-primary transition-all duration-200 active:opacity-80 cursor-pointer focus-visible:outline-none"
            >
              <Icon name="help" className="text-2xl" />
            </button>
          </div>
          <div className="h-8 w-px bg-outline-variant"></div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="font-label-lg text-label-lg text-primary group-hover:text-secondary transition-colors">Elena R.</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Housekeeping Mgr</p>
            </div>
            <img
              alt="Manager Profile"
              src={avatarManagerHousekeeping}
              className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-secondary transition-all"
            />
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'guest') {
    /* reference/guest_profile_luxestay_pro lines 175-196: bordered header, w-64 bordered
       search ("Search guests..."), bell + help buttons, 32px avatar. Search stays unwired
       (no guest-list screen exists yet). */
    return (
      <header className="flex justify-between items-center px-gutter z-40 h-header-height w-full sticky top-0 bg-surface-container-lowest border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="md:hidden text-primary hover:opacity-80 cursor-pointer focus-visible:outline-none"
          >
            <Icon name="menu" />
          </button>
          <div className="relative w-64 hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search guests..."
              aria-label="Search guests"
              className="w-full h-10 pl-10 pr-4 rounded bg-background border border-outline-variant focus:border-secondary-fixed focus:ring-2 focus:ring-secondary-fixed/20 transition-all font-body-md text-body-md outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="text-on-surface-variant hover:text-primary transition-all duration-200 active:opacity-80 cursor-pointer focus-visible:outline-none"
          >
            <Icon name="notifications" />
          </button>
          <button
            type="button"
            aria-label="Help"
            title="Help"
            className="text-on-surface-variant hover:text-primary transition-all duration-200 active:opacity-80 cursor-pointer focus-visible:outline-none"
          >
            <Icon name="help" />
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant cursor-pointer">
            <img alt="Manager Profile" src={avatarManagerGuest} className="w-full h-full object-cover" />
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'config') {
    /* reference/room_configuration lines 178-198: rounded search pill ("Search settings..."),
       bell + history, 32px avatar. Search stays unwired (source has no destination). */
    return (
      <header className="flex justify-between items-center px-container-padding w-full h-header-height sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm transition-all duration-200 ease-in-out">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="md:hidden text-on-surface-variant hover:text-secondary transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Icon name="menu" />
          </button>
          <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-secondary-container">
            <Icon name="search" className="text-outline mr-2" />
            <input
              type="text"
              placeholder="Search settings..."
              aria-label="Search settings"
              className="bg-transparent border-none outline-none text-body-sm font-body-sm text-on-surface placeholder:text-outline w-64 focus:ring-0 p-0"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Icon name="notifications" />
          </button>
          <button
            type="button"
            aria-label="History"
            title="History"
            className="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Icon name="history" />
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant">
            <img alt="Manager Avatar" src={avatarManagerConfig} className="w-full h-full object-cover" />
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'roomDetails') {
    /* reference/room_details lines 257-274: bordered header, mobile-only brand/avatar,
       flex-1 desktop search, dotless bell + history. Search stays unwired (source has
       no destination for it). */
    return (
      <header className="bg-surface-container-lowest border-b border-outline-variant h-header-height w-full sticky top-0 z-40 shadow-sm flex justify-between items-center px-container-padding transition-all duration-200 ease-in-out">
        <div className="flex items-center md:hidden">
          <h1 className="font-headline-sm text-headline-sm text-primary tracking-tight">LuxeStay Pro</h1>
        </div>
        <div className="hidden md:flex items-center flex-1 max-w-md bg-surface border border-outline-variant rounded px-3 py-2 focus-within:ring-2 focus-within:ring-secondary-container transition-all">
          <Icon name="search" className="text-on-surface-variant mr-2" />
          <input
            type="text"
            placeholder="Search rooms, guests..."
            aria-label="Search rooms, guests"
            className="bg-transparent border-none outline-none w-full font-body-sm text-body-sm text-primary placeholder-on-surface-variant"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Icon name="notifications" />
          </button>
          <button
            type="button"
            aria-label="History"
            title="History"
            className="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Icon name="history" />
          </button>
          <img
            alt="Manager Avatar"
            src={avatarManagerRdetailsSm}
            className="w-8 h-8 rounded-full object-cover md:hidden border border-outline-variant"
          />
        </div>
      </header>
    );
  }

  if (variant === 'mgmt') {
    /* reference/room_management_grid_view lines 184-203: bordered square search (wired to
       /rooms/manage?q=), bell + history only — no Check In, divider or avatar. */
    return (
      <header className="h-header-height w-full sticky top-0 z-40 bg-surface-container-lowest shadow-sm flex justify-between items-center px-container-padding transition-all duration-200 ease-in-out">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="md:hidden text-on-surface-variant cursor-pointer"
          >
            <Icon name="menu" />
          </button>
          <div className="relative w-64 focus-within:ring-2 focus-within:ring-secondary-container rounded">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Search rooms or guests..."
              aria-label="Search rooms or guests"
              value={searchParams.get('q') ?? ''}
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              className="w-full h-10 pl-10 pr-4 bg-surface rounded border border-outline-variant text-body-sm focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="text-on-surface-variant hover:text-secondary transition-colors relative cursor-pointer focus-visible:outline-none"
          >
            <Icon name="notifications" />
            <span aria-hidden="true" className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full" />
          </button>
          <button
            type="button"
            aria-label="History"
            title="History"
            className="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Icon name="history" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-surface text-primary font-label-lg text-label-lg sticky top-0 z-20 h-header-height shadow-sm justify-between items-center px-gutter md:px-container-padding flex w-full">
      <div className={desk ? 'contents' : details ? 'flex items-center gap-4' : 'flex items-center gap-4 min-w-0'}>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className={
            rooms
              ? 'md:hidden text-primary p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer'
              : desk
                ? 'md:hidden text-primary p-2 -ml-2 rounded-lg hover:bg-surface-variant transition-colors cursor-pointer'
                : details
                  ? 'md:hidden p-2 -ml-2 text-on-surface-variant rounded-full hover:bg-surface-variant transition-colors cursor-pointer'
                  : 'text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1 -ml-1 md:hidden'
          }
        >
          <Icon name="menu" />
        </button>

        {rooms && (
          /* Title — reference/rooms line 187: visible from sm up */
          <div className="font-headline-md text-headline-md text-primary hidden sm:block">Luxe Stay HMS</div>
        )}

        {rooms ? (
          /* Search — reference/rooms lines 189-192, wired to /rooms?q= */
          <div className="relative ml-4 hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search rooms, guests..."
              aria-label="Search rooms, guests"
              value={searchParams.get('q') ?? ''}
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              className="pl-10 pr-4 py-2 h-10 w-64 bg-surface-container-lowest border border-outline-variant rounded-full text-body-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
            />
          </div>
        ) : null}

        {details ? (
          /* Search — reference/reservation_details lines 189-192 */
          <div className="hidden md:flex items-center bg-surface-container-highest rounded-full px-4 py-2 border border-outline-variant/30 text-on-surface-variant w-64 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/50 transition-all">
            <Icon name="search" className="text-[18px] mr-2" />
            <input
              type="text"
              placeholder="Search reservations..."
              aria-label="Search reservations"
              className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-sm placeholder:text-on-surface-variant/70"
            />
          </div>
        ) : null}

        {!desk && !details && (
          /* Search — reference/dashboard lines 210-213 */
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">
              search
            </span>
            <input
              type="text"
              placeholder="Search guests, rooms..."
              aria-label="Search guests, rooms"
              className="bg-surface-container-low border border-outline-variant rounded-full py-2 pl-10 pr-4 text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none w-64 transition-all"
            />
          </div>
        )}
      </div>

      {/* Centered title (details only) */}
      {details && (
        <div className="flex items-center font-headline-md text-headline-md text-primary md:absolute md:left-1/2 md:-translate-x-1/2">
          <span className="md:hidden">Luxe Stay HMS</span>
        </div>
      )}

      {desk && (
        /* Search — reference/enhanced_reservations lines 206-210 */
        <div className="hidden md:flex items-center flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search guests or reservation IDs..."
            aria-label="Search guests or reservation IDs"
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full font-body-sm text-body-sm focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all outline-none"
          />
        </div>
      )}

      {/* Actions */}
      <div className={desk ? 'flex items-center gap-4 ml-auto' : 'flex items-center gap-6'}>
        {(desk || details || rooms) && (
          <>
            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => navigate('/reservations')}
              className={
                rooms
                  ? 'text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80 relative p-2'
                  : desk
                    ? 'w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors relative cursor-pointer active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40'
                    : 'p-2 text-on-surface-variant hover:text-primary transition-colors relative cursor-pointer active:opacity-80 rounded-full hover:bg-surface-variant/50'
              }
            >
              <span className="material-symbols-outlined">notifications</span>
              <span
                className={
                  rooms
                    ? 'absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface'
                    : desk
                      ? 'absolute top-2 right-2 w-2 h-2 bg-error rounded-full'
                      : 'absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface'
                }
              />
            </button>
            {desk ? (
              <span aria-hidden="true" className="h-6 w-px bg-outline-variant mx-1 hidden md:block" />
            ) : details ? (
              <span aria-hidden="true" className="h-6 w-[1px] bg-outline-variant/30 hidden sm:block" />
            ) : (
              <span aria-hidden="true" className="h-8 w-px bg-outline-variant hidden sm:block" />
            )}
          </>
        )}
        {!desk && !details && !rooms && (
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => navigate('/reservations')}
            className="relative text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-full"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full" />
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/reservations')}
          className={
            rooms
              ? 'hidden sm:flex px-4 h-10 bg-primary text-on-primary font-label-lg text-label-lg rounded-full items-center gap-2 hover:bg-primary-container transition-colors shadow-sm cursor-pointer active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40'
              : desk
                ? 'hidden md:flex items-center justify-center px-4 py-2 bg-primary text-on-primary font-label-md text-label-md rounded hover-shift transition-colors tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40'
                : details
                  ? 'hidden sm:flex items-center justify-center bg-primary text-on-primary px-4 py-2 rounded font-label-md text-label-md hover:bg-primary/90 transition-colors cursor-pointer active:opacity-80'
                  : 'bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded border-none hover:bg-surface-tint transition-colors cursor-pointer active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40'
          }
        >
          {rooms && <Icon name="login" className="text-sm" />}
          Check In
        </button>

        <button
          type="button"
          aria-label="Profile"
          className={
            rooms
              ? 'w-10 h-10 rounded-full overflow-hidden border border-outline-variant cursor-pointer shrink-0'
              : details
                ? 'w-9 h-9 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 shrink-0 cursor-pointer'
                : desk
                  ? 'w-9 h-9 rounded-full overflow-hidden border border-outline-variant ml-2 cursor-pointer shrink-0'
                  : 'w-8 h-8 rounded-full overflow-hidden border border-outline-variant cursor-pointer shrink-0'
          }
        >
          <img
            alt="Manager Profile"
            src={rooms ? avatarManagerRooms : details ? avatarManagerDetails : desk ? avatarManagerDesk : avatarManager}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
}
