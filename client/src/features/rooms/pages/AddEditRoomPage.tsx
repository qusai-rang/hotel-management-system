import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { useRoomDetail } from '@/hooks/useFeatureData';

/**
 * reference/add_edit_room_luxestay_pro — bare focused-task form (source suppresses
 * the nav shells). One static source state; serves both create and edit modes.
 * custom-shadow-card from the source shares its exact value with the app's
 * existing shadow-ambient utility, so that class is reused.
 */

interface RoomFormState {
  roomNumber: string;
  floor: string;
  roomType: string;
  basePrice: string;
  status: string;
  description: string;
  maxAdults: string;
  maxChildren: string;
}

type RoomTypeValue = 'standard' | 'deluxe' | 'suite' | 'penthouse';

const typeLabelToValue: Record<string, RoomTypeValue> = {
  'Standard King': 'standard',
  'Deluxe Double': 'deluxe',
  'Executive Suite': 'suite',
  Penthouse: 'penthouse',
};

const inputClass =
  'w-full h-[40px] rounded border border-outline-variant/50 bg-transparent px-3 py-2 text-on-background form-input-focus transition-all';

const selectWrapClass = 'relative';
const selectClass = `${inputClass} appearance-none cursor-pointer pr-10`;
const selectChevronClass =
  'material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant';

function createDefaults(): RoomFormState {
  /* Source-shipped defaults only: capacity inputs arrive with 2 / 0 and the
     Status select opens on "Available"; every other field starts empty. */
  return {
    roomNumber: '',
    floor: '',
    roomType: '',
    basePrice: '',
    status: 'available',
    description: '',
    maxAdults: '2',
    maxChildren: '0',
  };
}

/** Derive an editable prefill strictly from fields already present in the
 *  detail layer. Values the source form cannot represent stay empty. */
function prefillFromDetail(_roomId: string, apiDetail: { number: string; floor: number; roomType: { name: string }; capacityAdults: number; capacityChildren: number | null; bedsLabel: string; rateOverrideCents: number | null; occupancyStatus: string; housekeepingStatus: string } | null | undefined): RoomFormState {
  if (!apiDetail) return createDefaults();

  const statusMap: Record<string, string> = {
    available: 'available',
    maintenance: 'maintenance',
    cleaning: 'cleaning',
    dirty: 'cleaning',
  };

  const price = apiDetail.rateOverrideCents != null
    ? String(apiDetail.rateOverrideCents / 100)
    : '';

  return {
    roomNumber: apiDetail.number,
    floor: String(apiDetail.floor),
    roomType: typeLabelToValue[apiDetail.roomType.name] ?? '',
    basePrice: price,
    status: statusMap[apiDetail.occupancyStatus] ?? '',
    description: '',
    maxAdults: String(apiDetail.capacityAdults ?? 2),
    maxChildren: String(apiDetail.capacityChildren ?? 0),
  };
}

export default function AddEditRoomPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const isEdit = Boolean(roomId);
  const { data: apiDetail } = useRoomDetail(roomId ?? '');
  const initial = useMemo(() => (roomId ? prefillFromDetail(roomId, apiDetail) : createDefaults()), [roomId, apiDetail]);
  const [form, setForm] = useState<RoomFormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<'roomNumber', string>>>({});
  const [saved, setSaved] = useState(false);

  /* Exit targets: back to where the flow started (details when editing). */
  const exitTarget = isEdit ? `/rooms/${roomId}` : '/rooms/manage';

  const set = <K extends keyof RoomFormState>(key: K, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'roomNumber') setErrors({});
  };

  const handleSave = () => {
    /* UI-level validation only — the source marks no explicit required fields;
       the room number is the minimum identity a room record needs. */
    if (!form.roomNumber.trim()) {
      setErrors({ roomNumber: 'Room number is required.' });
      return;
    }
    setSaved(true);
    window.setTimeout(() => navigate(exitTarget), 900);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      {/* Top Navigation */}
      <header className="bg-surface-container-lowest h-header-height border-b border-outline-variant flex items-center px-container-padding sticky top-0 z-40">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(exitTarget)}
          className="mr-4 text-on-surface-variant hover:text-secondary transition-colors cursor-pointer focus-visible:outline-none"
        >
          <Icon name="arrow_back" />
        </button>
        <div className="font-headline-sm text-headline-sm text-primary">
          {isEdit ? `Edit Room ${initial.roomNumber || roomId}` : 'Add New Room'}
        </div>
        <div className="ml-auto">
          <button
            type="button"
            aria-label="Close"
            title="Close"
            onClick={() => navigate(exitTarget)}
            className="text-on-surface-variant hover:text-secondary transition-colors p-2 rounded-full hover:bg-surface-container cursor-pointer focus-visible:outline-none"
          >
            <Icon name="close" />
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 p-container-padding max-w-[1200px] mx-auto w-full">
        <form
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/30">
              <h2 className="font-headline-sm text-headline-sm mb-6 pb-2 border-b border-outline-variant/50">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="room-number" className="block font-label-md text-label-md text-on-surface-variant mb-2">
                    Room Number
                  </label>
                  <input
                    id="room-number"
                    type="text"
                    placeholder="e.g. 101"
                    value={form.roomNumber}
                    onChange={(e) => set('roomNumber', e.target.value)}
                    className={inputClass}
                  />
                  {errors.roomNumber && (
                    <p className="mt-1.5 font-label-md text-label-md text-error" role="alert">
                      {errors.roomNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="room-floor" className="block font-label-md text-label-md text-on-surface-variant mb-2">
                    Floor
                  </label>
                  <input
                    id="room-floor"
                    type="text"
                    placeholder="e.g. 1st Floor"
                    value={form.floor}
                    onChange={(e) => set('floor', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="room-type" className="block font-label-md text-label-md text-on-surface-variant mb-2">
                    Room Type
                  </label>
                  <div className={selectWrapClass}>
                    <select
                      id="room-type"
                      value={form.roomType}
                      onChange={(e) => set('roomType', e.target.value)}
                      className={`${selectClass} ${form.roomType ? '' : 'text-on-surface-variant'}`}
                    >
                      <option disabled value="">
                        Select Room Type
                      </option>
                      <option value="standard">Standard King</option>
                      <option value="deluxe">Deluxe Double</option>
                      <option value="suite">Executive Suite</option>
                      <option value="penthouse">Penthouse</option>
                    </select>
                    <span aria-hidden="true" className={selectChevronClass}>
                      expand_more
                    </span>
                  </div>
                </div>
                <div>
                  <label htmlFor="room-price" className="block font-label-md text-label-md text-on-surface-variant mb-2">
                    Base Price (Per Night)
                  </label>
                  <div className="relative">
                    <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      $
                    </span>
                    <input
                      id="room-price"
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={form.basePrice}
                      onChange={(e) => set('basePrice', e.target.value)}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="room-status" className="block font-label-md text-label-md text-on-surface-variant mb-2">
                    Status
                  </label>
                  <div className={selectWrapClass}>
                    <select
                      id="room-status"
                      value={form.status}
                      onChange={(e) => set('status', e.target.value)}
                      className={selectClass}
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="cleaning">Cleaning</option>
                    </select>
                    <span aria-hidden="true" className={selectChevronClass}>
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Description Card */}
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/30">
              <h2 className="font-headline-sm text-headline-sm mb-6 pb-2 border-b border-outline-variant/50">
                Description &amp; Highlights
              </h2>
              <div>
                <label htmlFor="room-description" className="block font-label-md text-label-md text-on-surface-variant mb-2">
                  Public Room Description
                </label>
                <textarea
                  id="room-description"
                  placeholder="Describe the room's unique features, views, and atmosphere..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className="w-full rounded border border-outline-variant/50 bg-transparent px-3 py-2 text-on-background form-input-focus transition-all min-h-[120px]"
                />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Capacity Card */}
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/30">
              <h2 className="font-headline-sm text-headline-sm mb-6 pb-2 border-b border-outline-variant/50">Capacity</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="max-adults" className="font-body-md text-body-md text-on-background">
                    Max Adults
                  </label>
                  <input
                    id="max-adults"
                    type="number"
                    min="1"
                    value={form.maxAdults}
                    onChange={(e) => set('maxAdults', e.target.value)}
                    className="w-20 h-[40px] rounded border border-outline-variant/50 bg-transparent px-3 py-2 text-center text-on-background form-input-focus transition-all"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <label htmlFor="max-children" className="font-body-md text-body-md text-on-background">
                    Max Children
                  </label>
                  <input
                    id="max-children"
                    type="number"
                    min="0"
                    value={form.maxChildren}
                    onChange={(e) => set('maxChildren', e.target.value)}
                    className="w-20 h-[40px] rounded border border-outline-variant/50 bg-transparent px-3 py-2 text-center text-on-background form-input-focus transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Form Actions (Sticky on Mobile, Static on Desktop) */}
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/30 sticky top-[88px]">
              <h2 className="font-headline-sm text-headline-sm mb-6 pb-2 border-b border-outline-variant/50">Actions</h2>
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-lg text-label-lg py-3 px-4 rounded-lg hover:-translate-y-[1px] transition-transform shadow-sm flex justify-center items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  <Icon name="save" />
                  Save Room
                </button>
                <button
                  type="button"
                  onClick={() => navigate(exitTarget)}
                  className="w-full bg-transparent border border-primary text-primary font-label-lg text-label-lg py-3 px-4 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  Cancel
                </button>
              </div>
              {saved && (
                <p className="mt-4 flex items-center justify-center gap-2 font-label-md text-label-md text-emerald-700" role="status">
                  <Icon name="check_circle" className="text-[16px]" />
                  Room saved.
                </p>
              )}
            </section>
          </div>
        </form>
      </main>
    </div>
  );
}
