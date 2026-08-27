import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormLabel } from '@/components/ui/FormInput';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useRoomTypes, useAvailability, useGuests, useCreateReservation } from '@/hooks/useFeatureData';

const STEPS = [
  { n: 1, title: 'Dates & Room', sub: 'Select stay details' },
  { n: 2, title: 'Guest Info', sub: 'Profile or new guest' },
  { n: 3, title: 'Review & Deposit', sub: 'Confirm booking' },
] as const;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [iy, im, id] = checkIn.split('-').map(Number);
  const [oy, om, od] = checkOut.split('-').map(Number);
  const ms = Date.UTC(oy, om - 1, od) - Date.UTC(iy, im - 1, id);
  return Math.max(0, Math.round(ms / 86_400_000));
}

function prettyDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const dateInputClass =
  'w-full h-[40px] pl-10 pr-3 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none';
const selectClass =
  'w-full h-[40px] px-3 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 font-body-md text-body-md text-on-surface bg-surface-container-lowest appearance-none cursor-pointer';
const textInputClass =
  'w-full h-[40px] px-3 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none placeholder:text-outline';

export default function CreateReservationPage() {
  const navigate = useNavigate();

  /* Wizard state */
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  /* Step 1: Dates & Room */
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  /* Step 2: Guest Info */
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>('existing');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  /* Special requests */
  const [specialRequest, setSpecialRequest] = useState('');

  /* Per-step validation messages */
  const [stepError, setStepError] = useState<string | null>(null);

  /* API data */
  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes();
  const { data: guests = [], isLoading: guestsLoading } = useGuests();
  const createMutation = useCreateReservation();

  /* Availability query — only fires when all required fields are present */
  const canSearch = !!checkIn && !!checkOut && nightsBetween(checkIn, checkOut) > 0 && parseInt(adults, 10) >= 1;
  const availabilityParams = canSearch
    ? {
        from: checkIn,
        to: checkOut,
        adults: parseInt(adults, 10),
        children: parseInt(children, 10),
        roomTypeId: selectedRoomTypeId ?? undefined,
      }
    : null;
  const { data: availabilityGroups = [], isLoading: availabilityLoading } = useAvailability(availabilityParams);

  /* Derived data */
  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);

  const selectedRoomType = useMemo(() => {
    if (!selectedRoomTypeId) return null;
    return roomTypes.find((rt) => rt.id === selectedRoomTypeId) ?? null;
  }, [selectedRoomTypeId, roomTypes]);

  const availableRoomsForType = useMemo(() => {
    if (!selectedRoomTypeId) return [];
    const group = availabilityGroups.find((g) => g.roomType.id === selectedRoomTypeId);
    return group?.availableRooms ?? [];
  }, [selectedRoomTypeId, availabilityGroups]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return availableRoomsForType.find((r) => r.roomId === selectedRoomId) ?? null;
  }, [selectedRoomId, availableRoomsForType]);

  const ratePerNightCents = selectedRoom?.ratePerNightCents ?? selectedRoomType?.basePricePerNightCents ?? 0;
  const subtotalCents = ratePerNightCents * nights;
  const taxCents = Math.round(subtotalCents * 0.12);
  const totalCents = subtotalCents + taxCents;
  const depositCents = Math.round(totalCents * 0.5);

  const guestName =
    guestMode === 'existing'
      ? guests.find((g) => g.id === selectedGuestId)?.fullName ?? null
      : [firstName, lastName].filter(Boolean).join(' ') || null;

  function validateStep(current: 1 | 2 | 3): string | null {
    if (current === 1) {
      if (!checkIn || !checkOut) return 'Please select check-in and check-out dates.';
      if (nights < 1) return 'Check-out must be after check-in (at least one night).';
      if (!selectedRoomTypeId) return 'Please select a room type.';
      return null;
    }
    if (current === 2) {
      if (guestMode === 'existing' && !selectedGuestId) return 'Please select an existing profile or switch to "New Guest".';
      if (guestMode === 'new') {
        if (!firstName.trim() || !lastName.trim()) return 'First and last name are required.';
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
      }
      return null;
    }
    return null;
  }

  function goTo(next: 1 | 2 | 3) {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    /* When entering step 1, reset room selection if dates changed */
    if (next === 1) {
      setSelectedRoomId(null);
    }
    setStep(next);
  }

  function handleSubmit() {
    const error = validateStep(2);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);

    const payload: Parameters<typeof createMutation.mutate>[0] = {
      roomTypeId: selectedRoomTypeId!,
      roomId: selectedRoomId ?? undefined,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: parseInt(adults, 10),
      children: parseInt(children, 10),
      specialRequests: specialRequest.trim() ? [{ title: specialRequest.trim() }] : [],
      source: 'direct',
    };

    if (guestMode === 'existing' && selectedGuestId) {
      payload.guestId = selectedGuestId;
    } else {
      payload.newGuest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };
    }

    createMutation.mutate(payload, {
      onSuccess: (result) => {
        setCreatedCode(result.code);
        setSubmitted(true);
      },
      onError: (err: Error & { response?: { data?: { error?: { code?: string; message?: string } } } }) => {
        const apiError = err?.response?.data?.error;
        if (apiError?.code === 'CONFLICT') {
          setStepError('This room is no longer available for the selected dates. Please go back and choose a different room.');
        } else if (apiError?.code === 'VALIDATION_ERROR') {
          setStepError(apiError.message || 'Please check your input and try again.');
        } else {
          setStepError(apiError?.message || 'Failed to create reservation. Please try again.');
        }
      },
    });
  }

  function resetWizard() {
    setSubmitted(false);
    setCreatedCode(null);
    setStep(1);
    setCheckIn('');
    setCheckOut('');
    setAdults('2');
    setChildren('0');
    setSelectedRoomTypeId(null);
    setSelectedRoomId(null);
    setGuestMode('existing');
    setSelectedGuestId(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setSpecialRequest('');
    setStepError(null);
    createMutation.reset();
  }

  /* ---------- Left progress rail ---------- */
  function progressRailJsx() {
    return (
      <div className="bg-primary text-on-primary w-full md:w-[280px] flex-shrink-0 p-8 flex flex-col justify-between">
        <div>
          <div className="font-headline-sm text-headline-sm mb-8 tracking-tight">New Reservation</div>
          <nav aria-label="Progress">
            <ol className="overflow-hidden" role="list">
              {STEPS.map((s, idx) => {
                const isActive = s.n === step;
                const isDone = s.n < step;
                const reached = isActive || isDone;
                const isLast = idx === STEPS.length - 1;
                return (
                  <li key={s.n} className={isLast ? 'relative' : 'relative pb-10'}>
                    {!isLast && (
                      <div aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-outline-variant/30" />
                    )}
                    <div className="relative flex items-center group">
                      <span className="h-9 flex items-center">
                        <span
                          className={
                            reached
                              ? 'relative z-10 w-8 h-8 flex items-center justify-center bg-secondary rounded-full'
                              : 'relative z-10 w-8 h-8 flex items-center justify-center bg-primary border-2 border-outline-variant/50 rounded-full'
                          }
                        >
                          <span
                            className={
                              reached
                                ? 'font-label-lg text-label-lg text-on-primary'
                                : 'font-label-lg text-label-lg text-outline-variant/50'
                            }
                          >
                            {s.n}
                          </span>
                        </span>
                      </span>
                      <span className="ml-4 min-w-0 flex flex-col">
                        <span
                          className={cn(
                            'font-label-lg text-label-lg tracking-wide',
                            reached ? 'text-secondary-fixed' : 'text-on-primary/50',
                          )}
                        >
                          {s.title}
                        </span>
                        <span
                          className={cn(
                            'font-body-sm text-body-sm',
                            reached ? 'text-on-primary/70' : 'text-on-primary/40',
                          )}
                        >
                          {s.sub}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
        <div className="mt-8 hidden md:block">
          <button
            type="button"
            onClick={() => navigate('/reservations')}
            className="font-label-md text-label-md text-on-primary/70 hover:text-on-primary transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded"
          >
            <Icon name="close" className="text-[18px]" />
            Cancel Reservation
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Step 1: Stay Details ---------- */
  function stayDetailsJsx() {
    return (
      <>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Stay Details</h2>
        <div className="space-y-8">
          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="cr-checkin">Check-in Date</FormLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">
                  calendar_month
                </span>
                <input
                  id="cr-checkin"
                  type="date"
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    setSelectedRoomId(null);
                  }}
                  className={dateInputClass}
                />
              </div>
            </div>
            <div>
              <FormLabel htmlFor="cr-checkout">Check-out Date</FormLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">
                  calendar_month
                </span>
                <input
                  id="cr-checkout"
                  type="date"
                  value={checkOut}
                  min={checkIn || undefined}
                  onChange={(e) => {
                    setCheckOut(e.target.value);
                    setSelectedRoomId(null);
                  }}
                  className={dateInputClass}
                />
              </div>
            </div>
          </div>

          {/* Occupancy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="cr-adults">Adults</FormLabel>
              <div className="relative">
                <select id="cr-adults" value={adults} onChange={(e) => { setAdults(e.target.value); setSelectedRoomId(null); }} className={selectClass}>
                  {['1', '2', '3', '4'].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
            <div>
              <FormLabel htmlFor="cr-children">Children</FormLabel>
              <div className="relative">
                <select id="cr-children" value={children} onChange={(e) => { setChildren(e.target.value); setSelectedRoomId(null); }} className={selectClass}>
                  {['0', '1', '2', '3'].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <hr className="border-outline-variant/30" />

          {/* Room Type Selection (Bento-style Grid) */}
          <div>
            <div className="block font-label-md text-label-md text-on-surface-variant mb-4">Select Room Type</div>
            {roomTypesLoading ? (
              <LoadingState message="Loading room types…" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roomTypes.map((rt) => {
                  const isSelected = rt.id === selectedRoomTypeId;
                  return (
                    <label key={rt.id} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="room_type"
                        className="peer sr-only"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedRoomTypeId(rt.id);
                          setSelectedRoomId(null);
                        }}
                      />
                      <div
                        className={
                          isSelected
                            ? 'p-4 rounded-lg border-2 border-secondary bg-surface-container-low shadow-sm transition-all h-full'
                            : 'p-4 rounded-lg border border-outline-variant hover:border-outline bg-surface-container-lowest hover:shadow-sm transition-all h-full opacity-80 peer-checked:opacity-100'
                        }
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={cn(
                              'font-headline-sm text-headline-sm font-bold',
                              isSelected ? 'text-primary' : 'text-on-surface',
                            )}
                          >
                            {rt.name}
                          </span>
                          {isSelected ? (
                            <Icon name="check_circle" fill className="text-secondary" />
                          ) : (
                            <Icon name="circle" className="text-outline-variant" />
                          )}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant mb-4">{rt.description}</div>
                        <div className="flex justify-between items-end">
                          <div className="flex gap-1">
                            {rt.amenities.map((a) => (
                              <Icon key={a.iconName} name={a.iconName} className="text-[16px] text-outline" />
                            ))}
                          </div>
                          <span className="font-label-lg text-label-lg text-on-surface">
                            {usd.format(rt.basePricePerNightCents / 100)}/nt
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Rooms (shown when dates + room type selected) */}
          {selectedRoomTypeId && canSearch && (
            <div>
              <div className="block font-label-md text-label-md text-on-surface-variant mb-4">
                Available Rooms {availabilityLoading && <span className="text-outline">(searching…)</span>}
              </div>
              {availabilityLoading ? (
                <div className="py-4 text-on-surface-variant font-body-sm text-body-sm">Searching for available rooms…</div>
              ) : availableRoomsForType.length === 0 ? (
                <div className="py-4 text-on-surface-variant font-body-sm text-body-sm">
                  No rooms available for the selected dates. Try different dates or a different room type.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableRoomsForType.map((r) => {
                    const isSel = r.roomId === selectedRoomId;
                    return (
                      <label key={r.roomId} className="relative cursor-pointer block">
                        <input
                          type="radio"
                          name="room_select"
                          className="peer sr-only"
                          checked={isSel}
                          onChange={() => setSelectedRoomId(r.roomId)}
                        />
                        <div
                          className={
                            isSel
                              ? 'p-3 rounded-lg border-2 border-secondary bg-surface-container-low shadow-sm transition-all flex items-center gap-3'
                              : 'p-3 rounded-lg border border-outline-variant hover:border-outline bg-surface-container-lowest hover:shadow-sm transition-all flex items-center gap-3 opacity-80 peer-checked:opacity-100'
                          }
                        >
                          <div className="min-w-0 flex flex-col">
                            <span className="font-body-sm text-body-sm font-semibold text-primary">
                              Room {r.roomNumber} · Floor {r.floor}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {r.bedsLabel} · {r.sizeSqft ? `${r.sizeSqft} sqft` : ''} · {r.capacityAdults} adults
                            </span>
                          </div>
                          <span className="ml-auto shrink-0 font-label-lg text-label-lg text-on-surface">
                            {usd.format(r.ratePerNightCents / 100)}/nt
                          </span>
                          <span className="ml-auto shrink-0">
                            {isSel ? (
                              <Icon name="check_circle" fill className="text-secondary" />
                            ) : (
                              <Icon name="circle" className="text-outline-variant" />
                            )}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  /* ---------- Step 2: Guest Info ---------- */
  function guestInfoJsx() {
    return (
      <>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Guest Info</h2>
        <div className="space-y-8">
          <div>
            <div className="block font-label-md text-label-md text-on-surface-variant mb-4">Profile or new guest</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="guest_mode"
                  className="peer sr-only"
                  checked={guestMode === 'existing'}
                  onChange={() => setGuestMode('existing')}
                />
                <div
                  className={
                    guestMode === 'existing'
                      ? 'p-4 rounded-lg border-2 border-secondary bg-surface-container-low shadow-sm transition-all h-full'
                      : 'p-4 rounded-lg border border-outline-variant hover:border-outline bg-surface-container-lowest hover:shadow-sm transition-all h-full opacity-80 peer-checked:opacity-100'
                  }
                >
                  <div className="flex justify-between items-start">
                    <span className={cn('font-headline-sm text-headline-sm font-bold', guestMode === 'existing' ? 'text-primary' : 'text-on-surface')}>
                      Existing Profile
                    </span>
                    {guestMode === 'existing' ? (
                      <Icon name="check_circle" fill className="text-secondary" />
                    ) : (
                      <Icon name="circle" className="text-outline-variant" />
                    )}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-2">Choose a returning guest.</div>
                </div>
              </label>
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="guest_mode"
                  className="peer sr-only"
                  checked={guestMode === 'new'}
                  onChange={() => setGuestMode('new')}
                />
                <div
                  className={
                    guestMode === 'new'
                      ? 'p-4 rounded-lg border-2 border-secondary bg-surface-container-low shadow-sm transition-all h-full'
                      : 'p-4 rounded-lg border border-outline-variant hover:border-outline bg-surface-container-lowest hover:shadow-sm transition-all h-full opacity-80 peer-checked:opacity-100'
                  }
                >
                  <div className="flex justify-between items-start">
                    <span className={cn('font-headline-sm text-headline-sm font-bold', guestMode === 'new' ? 'text-primary' : 'text-on-surface')}>
                      New Guest
                    </span>
                    {guestMode === 'new' ? (
                      <Icon name="check_circle" fill className="text-secondary" />
                    ) : (
                      <Icon name="circle" className="text-outline-variant" />
                    )}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-2">Enter new contact details.</div>
                </div>
              </label>
            </div>
          </div>

          {guestMode === 'existing' ? (
            <div>
              <div className="block font-label-md text-label-md text-on-surface-variant mb-4">Select Profile</div>
              {guestsLoading ? (
                <LoadingState message="Loading guests…" />
              ) : (
                <div className="space-y-3">
                  {guests.map((g) => {
                    const isSelected = g.id === selectedGuestId;
                    return (
                      <label key={g.id} className="relative cursor-pointer block">
                        <input
                          type="radio"
                          name="guest_profile"
                          className="peer sr-only"
                          checked={isSelected}
                          onChange={() => setSelectedGuestId(g.id)}
                        />
                        <div
                          className={
                            isSelected
                              ? 'p-3 pr-4 rounded-lg border-2 border-secondary bg-surface-container-low shadow-sm transition-all flex items-center gap-3'
                              : 'p-3 pr-4 rounded-lg border border-outline-variant hover:border-outline bg-surface-container-lowest hover:shadow-sm transition-all flex items-center gap-3 opacity-80 peer-checked:opacity-100'
                          }
                        >
                          <div className="w-8 h-8 rounded-full bg-surface-dim text-on-surface flex items-center justify-center font-label-lg font-bold shrink-0">
                            {g.firstName?.[0]}{g.lastName?.[0]}
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span className="font-body-sm text-body-sm font-semibold text-primary">{g.fullName}</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {g.membershipTier.charAt(0).toUpperCase() + g.membershipTier.slice(1)} member
                            </span>
                          </div>
                          <span className="ml-auto shrink-0">
                            {isSelected ? (
                              <Icon name="check_circle" fill className="text-secondary" />
                            ) : (
                              <Icon name="circle" className="text-outline-variant" />
                            )}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="cr-first-name">First Name</FormLabel>
                  <input
                    id="cr-first-name"
                    type="text"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={textInputClass}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="cr-last-name">Last Name</FormLabel>
                  <input
                    id="cr-last-name"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={textInputClass}
                  />
                </div>
              </div>
              <div>
                <FormLabel htmlFor="cr-email">Email Address</FormLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">
                    mail
                  </span>
                  <input
                    id="cr-email"
                    type="email"
                    placeholder="jane.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${dateInputClass} pr-3`}
                  />
                </div>
              </div>
              <div>
                <FormLabel htmlFor="cr-phone">Phone Number</FormLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">
                    call
                  </span>
                  <input
                    id="cr-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${dateInputClass} pr-3`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Special Requests */}
          <div>
            <FormLabel htmlFor="cr-requests">Special Requests (optional)</FormLabel>
            <textarea
              id="cr-requests"
              placeholder="Any special requests for this stay..."
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none placeholder:text-outline resize-none"
            />
          </div>
        </div>
      </>
    );
  }

  /* ---------- Step 3: Review & Deposit ---------- */
  function reviewJsx() {
    const rows: Array<[string, string]> = [
      ['Guest', guestName ?? '—'],
      ['Room Type', selectedRoomType ? `${selectedRoomType.name} · ${usd.format(ratePerNightCents / 100)}/nt` : '—'],
      ...(selectedRoom ? ([['Room', `Room ${selectedRoom.roomNumber} · Floor ${selectedRoom.floor}`] as [string, string]]) : []),
      ['Check-in', prettyDate(checkIn)],
      ['Check-out', prettyDate(checkOut)],
      ['Nights', String(nights)],
      ['Occupancy', `${adults} adult${adults === '1' ? '' : 's'}, ${children} child${children === '1' ? '' : 'ren'}`],
      ...(specialRequest.trim() ? ([['Special Requests', specialRequest.trim()] as [string, string]]) : []),
    ];
    return (
      <>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Review &amp; Deposit</h2>
        <div className="space-y-8">
          <div className="rounded-lg border border-outline-variant overflow-hidden">
            <dl className="divide-y divide-outline-variant/30">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between items-center px-4 py-3 bg-surface-container-lowest">
                  <dt className="font-body-sm text-body-sm text-on-surface-variant">{k}</dt>
                  <dd className="font-body-sm text-body-sm font-medium text-on-surface">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-outline-variant/30 bg-surface-bright px-4 py-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Subtotal ({nights} night{nights === 1 ? '' : 's'})</span>
                <span className="font-body-sm text-body-sm font-bold text-on-surface">{usd.format(subtotalCents / 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Taxes &amp; Fees (12%)</span>
                <span className="font-body-sm text-body-sm text-on-surface">{usd.format(taxCents / 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-label-lg text-label-lg text-on-surface">Total</span>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">{usd.format(totalCents / 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-label-lg text-label-lg text-on-surface-variant">Deposit due today (50%)</span>
                <span className="font-label-lg text-label-lg text-secondary">{usd.format(depositCents / 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Balance due at property</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{usd.format((totalCents - depositCents) / 100)}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---------- Success state ---------- */
  if (submitted && createdCode) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto min-h-[600px]">
          {progressRailJsx()}
          <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest p-6 md:p-10 text-center">
            <Icon name="check_circle" fill className="text-secondary text-[56px]" />
            <h2 className="font-headline-md text-headline-md text-on-surface mt-4 mb-2">Reservation Created</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              Confirmation <span className="font-mono font-semibold text-on-surface">{createdCode}</span>
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
              {guestName} · {selectedRoomType?.name ?? '—'} · {prettyDate(checkIn)} – {prettyDate(checkOut)} ({nights} night{nights === 1 ? '' : 's'})
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/reservations')}
                className="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-2.5 rounded hover:-translate-y-[1px] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                View Reservations
              </button>
              <button
                type="button"
                onClick={resetWizard}
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer focus-visible:outline-none"
              >
                New Reservation
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const nextLabel: Record<1 | 2 | 3, string> = { 1: 'Next: Guest Info', 2: 'Next: Review & Deposit', 3: 'Create Reservation' };
  const isSubmitting = createMutation.isPending;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto min-h-[600px]">
        {progressRailJsx()}

        <div className="flex-1 flex flex-col bg-surface-container-lowest">
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            {step === 1 && stayDetailsJsx()}
            {step === 2 && guestInfoJsx()}
            {step === 3 && reviewJsx()}
            {stepError && (
              <p role="alert" className="font-body-sm text-body-sm text-error mt-6">
                {stepError}
              </p>
            )}
          </div>

          <div className="p-6 border-t border-outline-variant/30 bg-surface-bright flex justify-between items-center mt-auto">
            <div className="flex items-center gap-6 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/reservations')}
                className="md:hidden font-label-md text-label-md text-on-surface-variant cursor-pointer focus-visible:outline-none"
              >
                Cancel
              </button>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setStep((step - 1) as 1 | 2);
                  }}
                  disabled={isSubmitting}
                  className="flex font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors items-center gap-1 cursor-pointer focus-visible:outline-none disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Back
                </button>
              )}
              <div className="hidden md:block font-body-sm text-body-sm text-on-surface-variant truncate">
                Subtotal: <span className="font-bold text-on-surface">{usd.format(subtotalCents / 100)}</span> ({nights} night{nights === 1 ? '' : 's'})
              </div>
            </div>
            <button
              type="button"
              onClick={() => (step === 3 ? handleSubmit() : goTo((step + 1) as 2 | 3))}
              disabled={isSubmitting}
              className="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-2.5 rounded hover:-translate-y-[1px] transition-transform flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Creating…
                </>
              ) : (
                <>
                  {nextLabel[step]}
                  {step < 3 && <Icon name="arrow_forward" className="text-[18px]" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
