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
  const detailsCanvas = shellVariant === 'details';
  /* Full-height frames: the topbar stays in flow and the main scrolls internally. */
  const framed = shellVariant === 'guest' || shellVariant === 'housekeeping';

  /* Invoice shell — reference/invoice_luxestay_pro wraps all chrome in #nav-shell so the
     source print stylesheet can drop it; main centers the max-w-4xl document column. */
  if (shellVariant === 'invoice') {
    return (
      <div className="min-h-screen bg-background">
        <div id="nav-shell">
          <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} variant="invoice" />
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
    <div className={framed ? 'h-screen overflow-hidden bg-background' : 'min-h-screen bg-background'}>
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} variant={shellVariant} />
      <div className={framed ? 'md:ml-[260px] h-full flex flex-col relative overflow-hidden' : 'md:ml-[260px]'}>
        <Topbar onMenuClick={() => setMobileOpen(true)} variant={shellVariant} />
        <main
          className={
            shellVariant === 'housekeeping'
              ? 'flex-1 overflow-y-auto p-container-padding bg-background'
              : shellVariant === 'billing'
                ? 'mt-header-height min-h-[calc(100vh-64px)] p-gutter md:p-container-padding pb-24 bg-background'
                : framed
                ? 'flex-1 overflow-y-auto p-4 md:p-container-padding bg-background'
                : detailsCanvas
              ? 'mt-header-height min-h-[calc(100vh-64px)] bg-surface-bright pt-6 pb-24 px-4 md:px-container-padding'
              : shellVariant === 'roomDetails'
                ? 'mt-header-height min-h-[calc(100vh-64px)] bg-background p-4 md:p-6 lg:p-container-padding overflow-y-auto'
                : shellVariant === 'rooms' || shellVariant === 'mgmt' || shellVariant === 'config'
                  ? 'mt-header-height min-h-[calc(100vh-64px)] bg-background'
                  : 'mt-header-height min-h-[calc(100vh-64px)] bg-background p-4 md:p-container-padding'
          }
        >
          <div
            className={
              shellVariant === 'rooms'
                ? 'p-container-padding max-w-7xl mx-auto flex flex-col gap-6'
                : framed || shellVariant === 'billing'
                  ? undefined
                  : shellVariant === 'mgmt' || shellVariant === 'config'
                  ? 'p-container-padding'
                  : detailsCanvas
                    ? 'max-w-[1200px] mx-auto'
                    : 'max-w-7xl mx-auto'
            }
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
