/**
 * Room records mirroring reference/rooms_luxestay_pro/code.html.
 * Only fields visible in the source are modeled.
 */

export type RoomGridStatus = 'available' | 'occupied' | 'dirty' | 'maintenance';

export interface RoomGuest {
  initials: string;
  name: string;
  /** e.g. "Out: Oct 15" */
  departure: string;
}

export interface RoomMaintenanceInfo {
  title: string;
  reported: string;
  assignedTo: string;
  estimate: string;
}

export interface RoomRecord {
  id: string;
  number: string;
  typeLabel: string;
  status: RoomGridStatus;
  floor: 1 | 2 | 3 | 4;
  capacity?: number;
  /** Bed composition line, icon glyph included (e.g. king_bed / bed). */
  beds?: { iconName: string; label: string };
  cleanedNote?: string;
  priorityNote?: string;
  guest?: RoomGuest;
  maintenance?: RoomMaintenanceInfo;
  pricePerNight?: number;
  footerActionLabel: 'Details' | 'Manage' | 'View Ticket';
}

/** Floor filter options verbatim from the source select. */
export const floorOptions = [
  { label: 'All Floors', value: null },
  { label: 'Floor 1 - Lobby Level', value: 1 },
  { label: 'Floor 2 - Mezzanine', value: 2 },
  { label: 'Floor 3 - Executive', value: 3 },
  { label: 'Floor 4 - Penthouse', value: 4 },
] as const;

/** Status segmented-control labels verbatim from the source. */
export const statusFilterLabels = ['All', 'Available', 'Occupied', 'Dirty'] as const;

export type StatusFilter = (typeof statusFilterLabels)[number];

export const rooms: RoomRecord[] = [
  {
    id: '301',
    number: '301',
    typeLabel: 'Executive Suite',
    status: 'available',
    floor: 3,
    capacity: 4,
    beds: { iconName: 'king_bed', label: '1 King, 1 Sofa' },
    cleanedNote: 'Cleaned 2h ago',
    pricePerNight: 450,
    footerActionLabel: 'Details',
  },
  {
    id: '215',
    number: '215',
    typeLabel: 'Standard King',
    status: 'occupied',
    floor: 2,
    guest: { initials: 'JS', name: 'John Smith', departure: 'Out: Oct 15' },
    footerActionLabel: 'Manage',
  },
  {
    id: '218',
    number: '218',
    typeLabel: 'Standard Double',
    status: 'dirty',
    floor: 2,
    capacity: 2,
    beds: { iconName: 'bed', label: '2 Queens' },
    priorityNote: 'Priority Cleaning (Check-in 3PM)',
    footerActionLabel: 'Details',
  },
  {
    id: '405',
    number: '405',
    typeLabel: 'Penthouse',
    status: 'maintenance',
    floor: 4,
    maintenance: {
      title: 'HVAC Issue',
      reported: 'Reported Oct 12, 09:00 AM',
      assignedTo: 'Assigned: Tech Team B',
      estimate: 'Est. fix: Today 4PM',
    },
    footerActionLabel: 'View Ticket',
  },
];
