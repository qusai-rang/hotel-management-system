/**
 * Room-management records mirroring reference/room_management_grid_view/code.html.
 * Only fields visible in the source are modeled. Distinct from features/rooms/data.ts
 * (Screen 6) on purpose — the two screens show different card designs and metadata.
 */

export type ManagementRoomStatus = 'occupied' | 'available' | 'cleaning';

export interface ManagementGuest {
  name: string;
  /** e.g. "Check-out: Tomorrow" */
  note: string;
  /** Asset key resolved by the page (keeps this module bundler-free). */
  avatarKey?: string;
}

export interface CleaningProgress {
  percent: number;
  /** e.g. "Est. completion: 14:30" */
  estimate: string;
}

export interface ManagementRoom {
  id: string;
  typeLabel: string;
  status: ManagementRoomStatus;
  capacityLabel: string;
  rate: string;
  guest?: ManagementGuest;
  readyNote?: string;
  cleaning?: CleaningProgress;
  secondaryActionLabel: 'Manage' | 'Book' | 'Expedite';
}

export const mgmtFloorOptions = ['All Floors', '1st Floor', '2nd Floor', '3rd Floor (Executive)'] as const;

export const mgmtTypeOptions = [
  'All Types',
  'Standard King',
  'Deluxe Double',
  'Executive Suite',
  'Presidential Suite',
] as const;

export const mgmtStatusOptions = ['All Statuses', 'Available', 'Occupied', 'Cleaning', 'Maintenance'] as const;

export const managementRooms: ManagementRoom[] = [
  {
    id: '301',
    typeLabel: 'Executive Suite',
    status: 'occupied',
    capacityLabel: '2 Adults',
    rate: '$450/nt',
    guest: { name: 'Eleanor Vance', note: 'Check-out: Tomorrow', avatarKey: 'eleanor-vance' },
    secondaryActionLabel: 'Manage',
  },
  {
    id: '302',
    typeLabel: 'Deluxe King',
    status: 'available',
    capacityLabel: '2 Adults',
    rate: '$280/nt',
    readyNote: 'Ready for check-in',
    secondaryActionLabel: 'Book',
  },
  {
    id: '305',
    typeLabel: 'Standard Double',
    status: 'cleaning',
    capacityLabel: '4 Adults',
    rate: '$220/nt',
    cleaning: { percent: 60, estimate: 'Est. completion: 14:30' },
    secondaryActionLabel: 'Expedite',
  },
];
