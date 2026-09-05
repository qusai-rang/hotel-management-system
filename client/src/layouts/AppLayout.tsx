import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar, type TopbarVariant } from './Topbar';

/**
 * Primary application shell: 260px navy sidebar (fixed, md+) + 64px sticky topbar.
 * Content column is offset by the sidebar width on desktop.
 *
 * `shellVariant='details'` also switches the scroll canvas to the
 * reservation_details treatment (surface-bright bg, pt-6 pb-24, max-w-[1200px]).
 * `shellVariant='rooms'|'mgmt'` move all content padding to the inner canvas div
 * (reference mains carry none), matching rooms_luxestay_pro / room_management_grid_view.
 */
export function AppLayout({ shellVariant = 'default' }: { shellVariant?: TopbarVariant }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  /* Use housekeeping variant consistently across all pages */
  const sidebarVariant = 'housekeeping' as const;

  /* Invoice shell — reference/invoice_luxestay_pro wraps all chrome in #nav-shell so the
     source print stylesheet can drop it; main centers the max-w-4xl document column. */
  if (shellVariant === 'invoice') {
    return (
      <div className="min-h-screen bg-background">
        <div id="nav-shell">
          <Sidebar
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
            variant={sidebarVariant}
          />
          <Topbar onMenuClick={() => setMobileOpen(true)} variant="invoice" />
        </div>
        <div className="md:ml-[260px]">
          <main className="pt-header-height pb-20 md:pb-8 min-h-screen flex flex-col items-center p-4 sm:p-container-padding">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        variant={sidebarVariant}
      />
      <div className="md:ml-[260px] h-full flex flex-col relative overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} variant={shellVariant} />
        <main className="flex-1 overflow-y-auto p-container-padding bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
