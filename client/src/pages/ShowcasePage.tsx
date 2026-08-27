import { useState } from 'react';
import authLobby from '@/assets/img/auth-lobby.jpg';
import avatarManager from '@/assets/img/avatar-manager.jpg';
import {
  AsyncBoundary,
  Avatar,
  Button,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterField,
  FilterSelect,
  FormInput,
  FormSelect,
  FormTextarea,
  IconButton,
  LoadingState,
  Pagination,
  ProgressMeter,
  RadioTileGroup,
  RowActionButton,
  SearchInput,
  SegmentedControl,
  StatKpiCard,
  StatusBadge,
  Stepper,
  Tabs,
  Timeline,
  ToggleSwitch,
} from '@/components/ui';
import { PhotoGallery, RoomCard } from '@/components/domain';
import type { RoomStatus } from '@/types';

interface DemoRow {
  id: string;
  guest: string;
  room: string;
  status: 'confirmed' | 'checked-in' | 'pending' | 'cancelled';
}

const demoRows: DemoRow[] = [
  { id: '#LX-9821', guest: 'Alexander Wright', room: '304', status: 'checked-in' },
  { id: '#LX-9822', guest: 'Maria Sanchez', room: '212', status: 'confirmed' },
  { id: '#LX-9823', guest: 'Chen Wei', room: '508', status: 'pending' },
];

const columns = [
  { id: 'id', header: 'Confirmation', render: (r: DemoRow) => <span className="font-medium text-primary group-hover:text-secondary">{r.id}</span> },
  { id: 'guest', header: 'Guest', render: (r: DemoRow) => r.guest },
  { id: 'room', header: 'Room', render: (r: DemoRow) => r.room },
  {
    id: 'status',
    header: 'Status',
    render: (r: DemoRow) => (
      <StatusBadge tone={r.status === 'checked-in' ? 'checkedInDark' : r.status}>{r.status.replace('-', ' ')}</StatusBadge>
    ),
  },
];

export default function ShowcasePage() {
  const [tab, setTab] = useState('history');
  const [segment, setSegment] = useState('grid');
  const [tile, setTile] = useState('credit');
  const [card, setCard] = useState('deluxe');
  const [toggle, setToggle] = useState(true);
  const [page, setPage] = useState(2);

  return (
    <div className="p-6 md:p-10 space-y-12 max-w-7xl mx-auto">
      <header className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-headline-lg text-primary">Design System Showcase</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Phase 2 primitives extracted verbatim from the Stitch reference screens.
        </p>
      </header>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3 p-6 surface-card rounded-xl">
          <Button leftIcon="add_circle">Primary</Button>
          <Button variant="gold">Gold</Button>
          <Button variant="goldSoft" leftIcon="add">Gold Soft</Button>
          <Button variant="outline" leftIcon="download">Outline</Button>
          <Button variant="outlinePrimary" leftIcon="print">Outline Primary</Button>
          <Button variant="danger" leftIcon="delete">Danger</Button>
          <Button variant="ghost" rightIcon="arrow_forward">Ghost</Button>
          <IconButton icon="notifications" label="Notifications" showDot />
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Status badges */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Status Badges</h2>
        <div className="flex flex-wrap items-center gap-3 p-6 surface-card rounded-xl">
          {(
            [
              ['confirmed', 'Confirmed'],
              ['checkedIn', 'Checked In'],
              ['pending', 'Pending'],
              ['cancelled', 'Cancelled'],
              ['available', 'Available'],
              ['occupied', 'Occupied'],
              ['dirty', 'Dirty'],
              ['maintenance', 'Maintenance'],
              ['cleaning', 'Cleaning'],
              ['alert', 'Occupied'],
              ['inProgress', 'Cleaning'],
              ['dirtyAlert', 'Dirty'],
              ['outOfService', 'Out of Service'],
              ['needsInspection', 'Needs Inspection'],
              ['paid', 'Paid'],
              ['paymentPending', 'Payment Pending'],
              ['refunded', 'Refunded'],
              ['completed', 'Completed'],
              ['pendingArrival', 'Arriving Today'],
              ['checkedInDark', 'Checked In'],
              ['platinum', 'Platinum Member'],
              ['neutral', 'Neutral'],
            ] as const
          ).map(([tone, label]) => (
            <StatusBadge key={tone} tone={tone} icon={['inProgress', 'dirtyAlert', 'outOfService', 'needsInspection'].includes(tone) ? { inProgress: 'sync', dirtyAlert: 'warning', outOfService: 'build', needsInspection: 'visibility' }[tone as 'inProgress'] : undefined} spin={tone === 'inProgress'}>
              {label}
            </StatusBadge>
          ))}
        </div>
      </section>

      {/* KPI cards */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">KPI Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatKpiCard
            label="Occupancy Rate"
            value="78%"
            icon="trending_up"
            caption={
              <>
                <span className="material-symbols-outlined text-base text-emerald-600">arrow_upward</span>
                <span className="text-emerald-600 font-medium">+2.5%</span> vs last month
              </>
            }
          />
          <StatKpiCard variant="darkAction" label="Today's Arrivals" value={18} icon="flight_land" actionLabel="View List" />
          <StatKpiCard variant="edge" label="Urgent" value={3} unit="Rooms" icon="warning" edgeClass="bg-error" iconChipClass="bg-error-container text-on-error-container" />
          <StatKpiCard variant="decorative" value="$48,290" label="This Month" icon="payments" caption="Total revenue this month" />
        </div>
      </section>

      {/* Table + pagination */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Data Table + Pagination</h2>
        <DataTable
          columns={columns}
          data={demoRows}
          rowKey={(r) => r.id}
          selectable
          selectedIds={new Set(['#LX-9821'])}
          onToggleRow={() => undefined}
          onRowClick={() => undefined}
          actions={(r) => (
            <>
              <RowActionButton icon="visibility" label={`View ${r.id}`} revealOnHover={false} />
              <RowActionButton icon="more_vert" label={`More for ${r.id}`} revealOnHover={false} />
            </>
          )}
        />
        <Pagination page={page} totalPages={9} totalItems={86} onPageChange={setPage} />
      </section>

      {/* Filters & search */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Filters &amp; Segmented Control</h2>
        <FilterBar
          variant="card"
          aside={<SearchInput placeholder="Search reservations..." />}
        >
          <FilterField label="Check-in Date" uppercase>
            <FormInput variant="default" type="date" aria-label="Check-in date" />
          </FilterField>
          <FilterSelect
            placeholder="All Statuses"
            options={[
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'checked-in', label: 'Checked In' },
            ]}
          />
          <SegmentedControl
            ariaLabel="Room status filter"
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'all', label: 'All' },
              { value: 'grid', label: 'Grid', icon: 'grid_view' },
              { value: 'list', label: 'List', icon: 'view_list' },
            ]}
          />
        </FilterBar>
      </section>

      {/* Forms */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Forms</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-surface-container-lowest border border-outline-variant/30 custom-shadow-card rounded-xl">
          <FormInput label="Email Address" leadingIcon="mail" placeholder="manager@luxestay.com" />
          <FormInput label="Base Price" prefixText="$" type="number" placeholder="0.00" />
          <FormSelect
            label="Room Type"
            placeholder="Select Room Type"
            options={[
              { value: 'standard', label: 'Standard King' },
              { value: 'suite', label: 'Executive Suite' },
            ]}
          />
          <FormTextarea label="Public Description" placeholder="Describe the room's unique features..." className="lg:col-span-3" />
          <div className="flex items-center gap-3 lg:col-span-3 pt-2 border-t border-outline-variant/30">
            <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-secondary cursor-pointer" /> Post to Cleaning Board
            </label>
            <span className="w-px h-6 bg-outline-variant" />
            <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-3">
              <ToggleSwitch checked={toggle} onChange={(e) => setToggle(e.target.checked)} label="Priority checkout" />
              Priority Checkout
            </span>
          </div>
        </div>
      </section>

      {/* Radio tiles */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Radio Tiles</h2>
        <div className="p-6 surface-card rounded-xl space-y-8">
          <RadioTileGroup
            name="room-type-demo"
            variant="card"
            value={card}
            onChange={setCard}
            options={[
              { value: 'deluxe', label: 'Deluxe Double', description: 'Garden view, queen bed, work desk.', priceNote: '$220 / night', icons: ['wifi', 'coffee', 'tv'] },
              { value: 'suite', label: 'Executive Suite', description: 'Separate living area, lounge access.', priceNote: '$450 / night', icons: ['wifi', 'local_bar', 'ac_unit'] },
            ]}
          />
          <RadioTileGroup
            name="payment-demo"
            variant="tile"
            value={tile}
            onChange={setTile}
            options={[
              { value: 'credit', label: 'Credit Card', icon: 'credit_card' },
              { value: 'cash', label: 'Cash', icon: 'payments' },
              { value: 'transfer', label: 'Bank Transfer', icon: 'account_balance' },
            ]}
          />
        </div>
      </section>

      {/* Room cards + gallery */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Domain: Room Card &amp; Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          <RoomCard
            number="301"
            type="Executive Suite"
            floor="3rd"
            capacity="2"
            rate="$450"
            status={'available' as RoomStatus}
            guestName="Sarah Jenkins"
            guestNote="Checking out today"
            priorityNote="Priority Checkout — flight at 18:40"
            actions={<Button size="sm" variant="outline">Details</Button>}
          >
            <ProgressMeter value={65} barClass="bg-secondary" />
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Cleaning in progress — ETA 45 min</p>
          </RoomCard>
          <RoomCard number="305" type="Deluxe King" floor="3rd" capacity="2" rate="$320" status={'maintenance' as RoomStatus}>
            <p className="font-body-sm text-body-sm text-error flex items-start gap-2">
              <span className="material-symbols-outlined text-base mt-0.5">report_problem</span>
              Reported Issue: AC unit not cooling, ticket #8841.
            </p>
          </RoomCard>
          <RoomCard number="310" type="Standard Queen" floor="3rd" capacity="2" rate="$180" status={'occupied' as RoomStatus} />
        </div>
        <PhotoGallery
          images={[
            { src: authLobby, alt: 'Suite main view' },
            { src: avatarManager, alt: 'Detail one' },
            { src: authLobby, alt: 'Detail two' },
          ]}
        />
      </section>

      {/* Tabs / timeline / stepper / feedback */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Tabs · Timeline · Stepper · Feedback</h2>
        <div className="surface-card overflow-hidden rounded-xl">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              { key: 'history', label: 'Stay History' },
              { key: 'preferences', label: 'Preferences' },
              { key: 'payments', label: 'Payments' },
              { key: 'notes', label: 'Notes' },
            ]}
          />
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Timeline
              items={[
                { title: 'Reservation Created', time:'May 10, 09:15', active: true, description: 'Booked via website.' },
                { title: 'Checked In', time: 'Oct 12, 14:00', active: true, description: 'Key cards issued at reception.' },
                { title: 'Housekeeping Visit', time: 'Oct 13, 11:30' },
                { title: 'Scheduled Check-out', time: 'Oct 18, 12:00' },
              ]}
            />
            <Stepper
              currentStep={1}
              steps={[
                { label: 'Guest Details', description: 'Who is staying?' },
                { label: 'Room Selection', description: 'Choose a room type.' },
                { label: 'Review & Confirm', description: 'Verify and confirm booking.' },
              ]}
            />
            <div className="space-y-6">
              <EmptyState title="No Internal Notes" description="Notes added here are only visible to staff." actionLabel="Add Note" />
              <AsyncBoundary isLoading={false} isError={false}>
                <p className="font-label-lg text-label-lg text-primary">Loaded content region.</p>
              </AsyncBoundary>
            </div>
          </div>
        </div>
        <LoadingState message="Fetching folio…" />
        <ErrorState message="Failed to load transactions." retryLabel="Retry" onRetry={() => undefined} />
      </section>

      {/* Avatars + misc */}
      <section className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-primary">Avatars</h2>
        <div className="flex items-end gap-6 p-6 surface-card rounded-xl">
          <Avatar initials="AW" size="xs" alt="XS" />
          <Avatar initials="AW" size="sm" alt="SM" />
          <Avatar initials="AW" size="md" alt="MD" />
          <Avatar src={avatarManager} size="lg" alt="LG" />
          <Avatar src={avatarManager} size="xl" alt="XL" badgeIcon="workspace_premium" badgeTitle="Platinum Member" />
          <CardHeader title="Inline card header demo" subtitle="With subtitle and actions" actions={<Button size="sm" variant="outline">Export</Button>} />
        </div>
      </section>
    </div>
  );
}
