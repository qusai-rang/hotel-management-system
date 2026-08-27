import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon, LoadingState } from '@/components/ui';
import { cn } from '@/utils/cn';
import roomSuiteMain from '@/assets/img/room-suite-main.jpg';
import roomSuiteBath from '@/assets/img/room-suite-bath.jpg';
import roomSuiteSitting from '@/assets/img/room-suite-sitting.jpg';
import { useRoomDetail } from '@/hooks/useFeatureData';

const galleryAssets: Record<string, string> = {
  'suite-main': roomSuiteMain,
  'suite-bath': roomSuiteBath,
  'suite-sitting': roomSuiteSitting,
};

const statusPillMap: Record<string, { cls: string; icon: string }> = {
  available: { cls: 'bg-emerald-100 text-emerald-800', icon: 'check' },
  occupied: { cls: 'bg-red-100 text-red-800', icon: 'person' },
  dirty: { cls: 'bg-amber-100 text-amber-800', icon: 'cleaning_services' },
  maintenance: { cls: 'bg-red-100 text-red-800', icon: 'build' },
};

const statusLabelMap: Record<string, string> = {
  available: 'Available',
  occupied: 'Occupied',
  dirty: 'Dirty',
  maintenance: 'Maintenance',
};

function galleryJsx() {
  const images = [
    { key: 'suite-main', alt: 'Suite Main View' },
    { key: 'suite-bath', alt: 'Bathroom Detail' },
    { key: 'suite-sitting', alt: 'Sitting Area Detail' },
  ];
  const [main, ...sides] = images;
  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm">
      <div className="grid grid-cols-4 gap-2 h-[250px] sm:h-[350px] md:h-[400px]">
        <div className="col-span-4 md:col-span-3 rounded overflow-hidden relative group">
          <img
            alt={main.alt}
            src={galleryAssets[main.key]}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        {sides.length > 0 && (
          <div className="hidden md:flex flex-col gap-2 col-span-1 h-full">
            {sides.map((image) => (
              <img
                key={image.key}
                alt={image.alt}
                src={galleryAssets[image.key]}
                className="w-full h-1/2 object-cover rounded"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RoomDetailsPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams();
  const { data: room, isLoading, isError } = useRoomDetail(roomId);

  if (isLoading) {
    return <LoadingState message="Loading room details…" />;
  }

  if (isError || !room) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-surface-container-lowest border border-outline-variant rounded-lg p-8 shadow-sm text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">bed</span>
        <h2 className="font-headline-md text-headline-md text-primary mt-4">Room not found</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
          No room matches ID &ldquo;{roomId}&rdquo;. It may have been removed or the link is incorrect.
        </p>
        <Link
          to="/rooms"
          className="inline-flex items-center gap-2 mt-6 h-10 px-4 bg-primary text-on-primary font-label-lg text-label-lg rounded hover:bg-inverse-surface transition-colors shadow-sm"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Back to Rooms
        </Link>
      </div>
    );
  }

  const statusKey = room.displayStatus as string;
  const pill = statusPillMap[statusKey] ?? statusPillMap.available;
  const statusLbl = statusLabelMap[statusKey] ?? statusKey;
  const floorLabel = `Floor ${room.floor}`;
  const capacityParts: string[] = [];
  if (room.capacityAdults) capacityParts.push(`${room.capacityAdults} Adult${room.capacityAdults !== 1 ? 's' : ''}`);
  if (room.capacityChildren) capacityParts.push(`${room.capacityChildren} Child${room.capacityChildren !== 1 ? 'ren' : ''}`);

  const specs = [
    { label: 'Floor', value: floorLabel },
    { label: 'Capacity', value: capacityParts.join(', ') || '—' },
    { label: 'Bed Type', value: room.roomType.bedLabel },
    { label: 'Size', value: room.sizeSqft ? `${room.sizeSqft} sq ft` : '—' },
    { label: 'Base Rate', value: room.rateOverrideCents != null ? `$${Math.round(room.rateOverrideCents / 100)} / night` : '—', valueClass: 'text-secondary font-semibold font-body-md' },
  ];

  return (
    <>
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2 text-on-surface-variant font-body-sm mb-2">
            <Link to="/rooms/manage" className="hover:text-primary transition-colors">
              Room Management
            </Link>
            <Icon name="chevron_right" className="text-sm" />
            <span className="text-primary font-medium">Room {room.number}</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
            Room {room.number} - {room.roomType.name}
          </h2>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(`/rooms/${room.id}/edit`)}
            className="bg-surface border border-primary text-primary font-label-lg px-4 py-2 rounded hover:bg-surface-container-low transition-colors flex items-center space-x-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="edit" className="text-sm" />
            <span>Edit Room</span>
          </button>
          <button
            type="button"
            title="Maintenance workflows arrive with the backend phase"
            className="bg-primary text-on-primary font-label-lg px-4 py-2 rounded hover:bg-primary-container transition-colors shadow-sm transform hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            Block for Maintenance
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {galleryJsx()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6 shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-4 border-b border-surface-container pb-2">
                Specifications
              </h3>
              <div className="space-y-4">
                {specs.map((spec) => (
                  <div key={spec.label}>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant font-body-sm">{spec.label}</span>
                      <span className={cn('text-primary font-medium font-body-md', spec.valueClass)}>
                        {spec.value}
                      </span>
                    </div>
                    <div aria-hidden="true" className="w-full h-px bg-surface-container mt-4" />
                  </div>
                ))}
              </div>
            </div>

            {room.roomType.amenities.length > 0 && (
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-4 border-b border-surface-container pb-2">
                  Amenities
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {room.roomType.amenities.map((amenity) => (
                    <div key={amenity.label} className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                        <Icon name={amenity.iconName} className="text-sm" />
                      </div>
                      <span className="font-body-sm text-primary">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Card */}
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6 shadow-sm relative overflow-hidden">
            <div
              aria-hidden="true"
              className={cn(
                'absolute left-0 top-0 bottom-0 w-1',
                statusKey === 'occupied' ? 'bg-red-600' : 'bg-secondary-container',
              )}
            />
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-1">Current Status</h3>
                <div className="flex items-center space-x-2">
                  <span className={cn('px-3 py-1 rounded-full font-label-md text-label-md flex items-center space-x-1', pill.cls)}>
                    <Icon name={pill.icon} fill className="text-sm" />
                    <span>{statusLbl}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                title="Status changes arrive with the backend phase"
                className="text-secondary font-label-sm hover:underline flex items-center space-x-1 cursor-pointer focus-visible:outline-none"
              >
                <span>Change</span>
                <Icon name="arrow_drop_down" className="text-sm" />
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant mb-4">
              Housekeeping status: <span className="text-primary font-medium">{room.housekeepingStatus}</span>
            </p>
            <button
              type="button"
              title="Housekeeping workflows arrive with the backend phase"
              className="w-full bg-surface border border-outline-variant text-primary font-label-md py-2 rounded hover:bg-surface-container-low transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              Request Cleaning
            </button>
          </div>

          {/* Current Stay Details */}
          {room.currentStay && (
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6 shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center space-x-2">
                <Icon name="luggage" className="text-secondary" />
                <span>Current Stay</span>
              </h3>
              <div className="mb-4">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">Guest Name</p>
                <p className="font-body-md text-primary font-medium">{room.currentStay.guestName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant mb-1">Check-in</p>
                  <p className="font-body-sm text-primary">{formatDate(room.currentStay.checkInDate)}</p>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant mb-1">Check-out</p>
                  <p className="font-body-sm text-primary">{formatDate(room.currentStay.checkOutDate)}</p>
                </div>
              </div>
              {room.currentStay.reservationCode && (
                <div className="mb-4">
                  <p className="font-label-md text-label-md text-on-surface-variant mb-1">Booking ID</p>
                  <p className="font-body-sm text-primary">{room.currentStay.reservationCode}</p>
                </div>
              )}
              <Link
                to={`/reservations/${room.currentStay.bookingId}`}
                className="inline-flex items-center space-x-1 mt-2 text-secondary font-label-md hover:underline"
              >
                <span>View Reservation Details</span>
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </div>
          )}

          {/* Maintenance Info */}
          {room.maintenance && (
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6 shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center space-x-2">
                <Icon name="build" className="text-secondary" />
                <span>Maintenance</span>
              </h3>
              <div className="space-y-2">
                <p className="font-body-sm text-on-surface">{room.maintenance.title}</p>
                <p className="font-body-sm text-on-surface-variant">Reported: {formatDate(room.maintenance.reportedAt)}</p>
                <p className="font-body-sm text-on-surface-variant">Assigned: {room.maintenance.assignedTo}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
