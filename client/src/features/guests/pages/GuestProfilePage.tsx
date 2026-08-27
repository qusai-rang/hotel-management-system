import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon, LoadingState } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useGuestProfile } from '@/hooks/useFeatureData';
import type { GuestProfileDTO } from '@/types/api';

type ProfileTab = 'history' | 'preferences' | 'payments' | 'notes';

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'history', label: 'Stay History' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'payments', label: 'Payments' },
  { key: 'notes', label: 'Notes' },
];

function tabClass(active: boolean): string {
  return active
    ? 'px-6 py-4 font-label-lg text-label-lg text-primary border-b-2 border-secondary whitespace-nowrap'
    : 'px-6 py-4 font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap';
}

/** Stay History tab content — reference/guest_profile_luxestay_pro lines 282-339. */
function StayHistory({ profile }: { profile: GuestProfileDTO }) {
  const navigate = useNavigate();
  const openReservation = (reservationId: string) => {
    navigate(`/reservations/${reservationId}`);
  };

  return (
    <div className="p-0 flex-1 overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface text-primary font-label-md text-label-md uppercase tracking-wider border-b border-outline-variant/50">
          <tr>
            <th className="px-6 py-4 font-medium">Confirmation</th>
            <th className="px-6 py-4 font-medium">Dates</th>
            <th className="px-6 py-4 font-medium">Room</th>
            <th className="px-6 py-4 font-medium">Amount</th>
            <th className="px-6 py-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="font-body-sm text-body-sm text-on-surface-variant divide-y divide-outline-variant/30">
          {profile.stayHistory.map((stay) => (
            <tr
              key={stay.reservationCode}
              onClick={() => openReservation(stay.reservationCode)}
              className="hover:bg-surface-bright/50 transition-colors cursor-pointer group"
            >
              <td className="px-6 py-4 font-medium text-primary group-hover:text-secondary">{stay.reservationCode}</td>
              <td className="px-6 py-4">{new Date(stay.checkInDate).toLocaleDateString()} - {new Date(stay.checkOutDate).toLocaleDateString()}</td>
              <td className="px-6 py-4">{stay.roomTypeName}{stay.roomNumber ? ` (${stay.roomNumber})` : ''}</td>
              <td className="px-6 py-4">${Math.round(stay.totalCents / 100).toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-variant text-primary font-label-md text-label-md">
                  {stay.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GuestProfilePage() {
  const navigate = useNavigate();
  const { guestId = '' } = useParams();
  const [tab, setTab] = useState<ProfileTab>('history');
  const { data: guest, isLoading, isError } = useGuestProfile(guestId);

  if (isLoading) {
    return <LoadingState message="Loading guest profile…" />;
  }

  if (isError || !guest) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-surface-container-lowest border border-outline-variant rounded-lg p-8 shadow-sm text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">group</span>
        <h2 className="font-headline-md text-headline-md text-primary mt-4">Guest not found</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
          No guest matches ID &ldquo;{guestId}&rdquo;. It may have been removed or the link is incorrect.
        </p>
        <Link
          to="/reservations"
          className="inline-flex items-center gap-2 mt-6 h-10 px-4 bg-primary text-on-primary font-label-lg text-label-lg rounded hover:bg-inverse-surface transition-colors shadow-sm"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Back to Reservations
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumbs & Actions — reference/guest_profile_luxestay_pro lines 200-216 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
          <span className="hover:text-primary transition-colors">Guests</span>
          <Icon name="chevron_right" className="text-[16px]" />
          <span className="text-primary font-medium">{guest.fullName}</span>
        </div>
        <div className="flex gap-3">
          {guest.email && (
            <a
              href={`mailto:${guest.email}`}
              className="bg-surface-container-lowest border border-primary text-primary px-4 py-2 rounded font-label-lg text-label-lg hover:-translate-y-[1px] transition-transform flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <Icon name="mail" className="text-[18px]" />
              Send Message
            </a>
          )}
          <button
            type="button"
            onClick={() => navigate('/reservations/new')}
            className="bg-primary text-on-primary px-4 py-2 rounded font-label-lg text-label-lg hover:-translate-y-[1px] transition-transform flex items-center gap-2 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="add_circle" className="text-[18px]" />
            New Reservation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Profile & Stats) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="surface-card rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-surface-container-highest overflow-hidden mb-4 border-2 border-surface-bright shadow-sm relative">
              <div className="w-full h-full flex items-center justify-center bg-primary-fixed-dim text-primary font-headline-lg text-headline-lg">
                {guest.firstName?.[0]}{guest.lastName?.[0]}
              </div>
              <div
                className="absolute bottom-0 right-0 bg-secondary-fixed text-on-secondary-fixed rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm"
                title={guest.membershipTier}
              >
                <Icon name="workspace_premium" fill className="text-[14px]" />
              </div>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-1">{guest.fullName}</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed/20 text-secondary mb-4">
              <Icon name="workspace_premium" fill className="text-[14px]" />
              <span className="font-label-md text-label-md uppercase tracking-wider">{guest.membershipTier}</span>
            </div>
            <div className="w-full border-t border-outline-variant/30 my-4"></div>
            <div className="w-full space-y-3 text-left">
              {guest.email && (
                <div className="flex items-center gap-3 text-on-surface-variant font-body-sm text-body-sm">
                  <Icon name="mail" className="text-outline" />
                  <span>{guest.email}</span>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-3 text-on-surface-variant font-body-sm text-body-sm">
                  <Icon name="call" className="text-outline" />
                  <span>{guest.phone}</span>
                </div>
              )}
              {guest.address && (
                <div className="flex items-center gap-3 text-on-surface-variant font-body-sm text-body-sm">
                  <Icon name="location_on" className="text-outline" />
                  <span>{guest.address.lines?.join(', ')}{guest.address.city ? `, ${guest.address.city}` : ''}{guest.address.country ? `, ${guest.address.country}` : ''}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="mt-6 w-full bg-surface-container-lowest border border-outline-variant text-primary font-label-md text-label-md py-2 rounded hover:bg-surface-bright transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              Edit Profile
            </button>
          </div>

          <div className="surface-card rounded-xl p-6">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Guest Lifetime Value</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
                <span className="text-on-surface-variant font-body-sm text-body-sm">Total Stays</span>
                <span className="font-headline-sm text-headline-sm text-primary">{guest.stats.totalStays}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
                <span className="text-on-surface-variant font-body-sm text-body-sm">Total Spent</span>
                <span className="font-headline-sm text-headline-sm text-primary">${Math.round(guest.stats.totalSpendCents / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-body-sm text-body-sm">Last Visit</span>
                <span className="font-body-sm text-body-sm text-primary font-medium">
                  {guest.stats.lastVisit ? new Date(guest.stats.lastVisit).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Tabs & Details) — reference/guest_profile_luxestay_pro lines 272-341 */}
        <div className="lg:col-span-8">
          <div className="surface-card rounded-xl overflow-hidden h-full flex flex-col">
            <div className="flex border-b border-outline-variant bg-surface-bright/50 px-2 overflow-x-auto">
              {TABS.map((t) => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn(tabClass(tab === t.key), 'cursor-pointer focus-visible:outline-none')}>
                  {t.label}
                </button>
              ))}
            </div>
            {tab === 'history' ? (
              <StayHistory profile={guest} />
            ) : (
              /* Preferences / Payments / Notes have no content in the Stitch export. */
              <div className="p-6">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {TABS.find((t) => t.key === tab)?.label} details are not part of the current design export.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
