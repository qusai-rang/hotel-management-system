import type { UserRole, MembershipTier, OccupancyStatus, HousekeepingStatus, HkContext, HkTaskType, HkTaskStatus, ReservationStatus, FolioStatus, PaymentMethod, PaymentStatus, InvoiceStatus } from '../models/enums';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HotelSeed {
  name: string;
  brandName: string;
  addressLines: string[];
  contact: { email: string; phone: string };
  finance: { iban: string; paymentNotes: string };
  policies: {
    checkInTime: string;
    checkOutTime: string;
    taxRateBps: number;
    currency: string;
    dueDays: number;
  };
  floors: { number: number; label: string }[];
}

interface UserSeed {
  seedKey: string;
  name: string;
  email: string;
  role: UserRole;
}

interface RoomTypeSeed {
  code: string;
  name: string;
  description: string;
  basePricePerNightCents: number;
  maxGuests: number;
  bedLabel: string;
  sizeSqft?: number;
  amenities: { iconName: string; label: string }[];
  accentColor?: string;
}

interface RoomSeed {
  number: string;
  floor: number;
  roomTypeCode: string;
  capacityAdults: number;
  capacityChildren?: number;
  bedsLabel: string;
  sizeSqft?: number;
  rateOverrideCents?: number;
  occupancyStatus: OccupancyStatus;
  housekeepingStatus: HousekeepingStatus;
  priorityNote?: string;
}

interface GuestSeed {
  seedKey: string;
  slug: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: { lines: string[]; city?: string; country?: string };
  membershipTier: MembershipTier;
  notes?: string;
}

interface ReservationSeed {
  code: string;
  guestSeedKey: string;
  roomTypeCode: string;
  roomNumber?: string;
  status: ReservationStatus;
  checkInDate: Date;
  checkOutDate: Date;
  adults: number;
  children: number;
  specialRequests?: { title: string; description: string; iconName?: string; dueAt?: Date }[];
  ratePerNightCents: number;
  taxRateBps: number;
  depositCents: number;
  source: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
}

interface CheckoutSessionSeed {
  reservationCode: string;
  guestSeedKey: string;
  folioNumber: string;
  charges: { description: string; department: 'room' | 'restaurant' | 'spa'; quantity: number; unitAmountCents: number; postedAt: Date }[];
  discounts: { label: string; amountCents: number }[];
  taxRateBps: number;
  status: FolioStatus;
}

interface PaymentSeed {
  folioNumber: string;
  amountCents: number;
  method: PaymentMethod;
  cardBrand?: string;
  cardLast4?: string;
  gatewayRef?: string;
  status: PaymentStatus;
}

interface InvoiceSeed {
  invoiceNumber: string;
  folioNumber: string;
  guestSeedKey: string;
  hotelBlock: { name: string; addressLines: string[]; email: string; phone: string };
  billTo: { name: string; addressLines: string[]; email: string };
  lineItems: { description: string; subDescription?: string; quantity: number; unitAmountCents: number }[];
  subtotalCents: number;
  taxRateBps: number;
  taxCents: number;
  discountTotalCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceDueCents: number;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
}

interface HousekeepingSeed {
  roomNumber: string;
  context: HkContext;
  type: HkTaskType;
  status: HkTaskStatus;
  assigneeSeedKey?: string;
  progressPercent: number;
  estimateCompletionAt?: Date;
  lastActivityAt: Date;
  ticket?: { title: string; reportedAt: Date; assignedTeamLabel?: string; estimatedFixAt?: Date };
}

interface ActivitySeed {
  entityType: 'room' | 'reservation' | 'folio' | 'payment' | 'invoice' | 'task' | 'auth';
  entityRef: string;
  action: string;
  title: string;
  description: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

interface CounterSeed {
  key: string;
  seq: number;
}

/* ------------------------------------------------------------------ */
/*  October 2023 reference date                                        */
/* ------------------------------------------------------------------ */

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

/* ------------------------------------------------------------------ */
/*  Hotel                                                              */
/* ------------------------------------------------------------------ */

export const hotelData: HotelSeed = {
  name: 'LuxeStay Pro',
  brandName: 'LuxeStay',
  addressLines: ['123 Luxury Avenue', 'Riviera District, Monaco 98000'],
  contact: { email: 'billing@luxestaypro.com', phone: '+377 98 76 54 32' },
  finance: {
    iban: 'MC89 3000 4000 5000 6000 7',
    paymentNotes: 'Please make all checks payable to LuxeStay Pro. Wire transfers can be sent to IBAN: MC89 3000 4000 5000 6000 7. Thank you for choosing LuxeStay.',
  },
  policies: {
    checkInTime: '15:00',
    checkOutTime: '11:00',
    taxRateBps: 1400,
    currency: 'USD',
    dueDays: 14,
  },
  floors: [
    { number: 1, label: 'Lobby Level' },
    { number: 2, label: 'Mezzanine' },
    { number: 3, label: 'Executive' },
    { number: 4, label: 'Penthouse' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */

export const userData: UserSeed[] = [
  { seedKey: 'admin',      name: 'Admin User',    email: 'admin@luxestay.com',     role: 'admin' },
  { seedKey: 'elena',      name: 'Elena Rostova',  email: 'elena.r@luxestay.com',   role: 'manager' },
  { seedKey: 'front_desk', name: 'Front Desk',    email: 'frontdesk@luxestay.com', role: 'front_desk' },
  { seedKey: 'marcus',     name: 'Marcus Torres',  email: 'marcus.t@luxestay.com',  role: 'housekeeping' },
  { seedKey: 'sarah',      name: 'Sarah Jenkins',  email: 'sarah.j@luxestay.com',   role: 'housekeeping' },
  { seedKey: 'david',      name: 'David Wong',     email: 'david.w@luxestay.com',   role: 'housekeeping' },
];

/* ------------------------------------------------------------------ */
/*  Room Types                                                         */
/* ------------------------------------------------------------------ */

export const roomTypeData: RoomTypeSeed[] = [
  {
    code: 'STD-Q', name: 'Standard Queen',
    description: 'Comfortable queen room with modern amenities.',
    basePricePerNightCents: 18900, maxGuests: 2, bedLabel: '1 Queen',
    amenities: [{ iconName: 'wifi', label: 'Free Wifi' }],
  },
  {
    code: 'STD-D', name: 'Standard Double',
    description: 'Standard double room with two queen beds.',
    basePricePerNightCents: 22000, maxGuests: 4, bedLabel: '2 Queens',
    amenities: [{ iconName: 'wifi', label: 'Free Wifi' }],
  },
  {
    code: 'STD-K', name: 'Standard King',
    description: 'Standard king room with city views.',
    basePricePerNightCents: 24900, maxGuests: 2, bedLabel: '1 King',
    amenities: [{ iconName: 'wifi', label: 'Free Wifi' }],
  },
  {
    code: 'DLX-K', name: 'Deluxe King',
    description: 'King bed, partial ocean view, balcony.',
    basePricePerNightCents: 28000, maxGuests: 2, bedLabel: '1 King',
    amenities: [{ iconName: 'wifi', label: 'Free Wifi' }, { iconName: 'balcony', label: 'Balcony' }],
  },
  {
    code: 'DLX-D', name: 'Deluxe Double',
    description: 'Deluxe double room with premium amenities.',
    basePricePerNightCents: 31900, maxGuests: 4, bedLabel: '2 Queens',
    amenities: [{ iconName: 'wifi', label: 'Free Wifi' }, { iconName: 'balcony', label: 'Balcony' }],
  },
  {
    code: 'EXE-S', name: 'Executive Suite',
    description: 'Spacious 45sqm suite featuring panoramic city views, deep soaking tub, and exclusive access to the Club Lounge.',
    basePricePerNightCents: 45000, maxGuests: 3, bedLabel: '1 King, 1 Sofa',
    sizeSqft: 650,
    amenities: [
      { iconName: 'wifi', label: 'High-Speed WiFi' },
      { iconName: 'kitchen', label: 'Mini Bar' },
      { iconName: 'ac_unit', label: 'Climate Control' },
      { iconName: 'location_city', label: 'City View' },
      { iconName: 'tv', label: 'Smart TV' },
      { iconName: 'local_cafe', label: 'Coffee Maker' },
    ],
    accentColor: '#6366f1',
  },
  {
    code: 'PRE-S', name: 'Presidential Suite',
    description: 'The finest suite with panoramic ocean views and private terrace.',
    basePricePerNightCents: 89900, maxGuests: 4, bedLabel: '1 King, 1 Queen',
    sizeSqft: 1200,
    amenities: [
      { iconName: 'wifi', label: 'High-Speed WiFi' },
      { iconName: 'kitchen', label: 'Full Kitchen' },
      { iconName: 'local_cafe', label: 'Coffee Maker' },
      { iconName: 'pool', label: 'Private Pool' },
    ],
  },
  {
    code: 'PNT-S', name: 'Penthouse Suite',
    description: 'Top-floor penthouse with wrap-around terrace and butler service.',
    basePricePerNightCents: 75000, maxGuests: 4, bedLabel: '1 King, 1 Sofa',
    sizeSqft: 1100,
    amenities: [
      { iconName: 'wifi', label: 'High-Speed WiFi' },
      { iconName: 'kitchen', label: 'Full Kitchen' },
      { iconName: 'pool', label: 'Private Terrace' },
    ],
  },
  {
    code: 'OVS-S', name: 'Ocean View Suite',
    description: 'Elegant suite with direct ocean views and spa-inspired bathroom.',
    basePricePerNightCents: 45000, maxGuests: 2, bedLabel: '1 King',
    sizeSqft: 550,
    amenities: [
      { iconName: 'wifi', label: 'Free Wifi' },
      { iconName: 'local_cafe', label: 'Coffee Maker' },
    ],
  },
  {
    code: 'DLX-KS', name: 'Deluxe King Suite',
    description: 'Spacious suite with king bed and sitting area.',
    basePricePerNightCents: 35000, maxGuests: 2, bedLabel: '1 King',
    amenities: [
      { iconName: 'wifi', label: 'Free Wifi' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Rooms                                                              */
/* ------------------------------------------------------------------ */

export const roomData: RoomSeed[] = [
  { number: '102', floor: 1, roomTypeCode: 'DLX-K',  capacityAdults: 2, bedsLabel: '1 King',  occupancyStatus: 'occupied', housekeepingStatus: 'dirty',    priorityNote: 'Priority Cleaning (Check-in 3PM)' },
  { number: '112', floor: 1, roomTypeCode: 'STD-D',  capacityAdults: 4, bedsLabel: '2 Queens', occupancyStatus: 'vacant',   housekeepingStatus: 'clean' },
  { number: '205', floor: 2, roomTypeCode: 'EXE-S',  capacityAdults: 3, bedsLabel: '1 King, 1 Sofa', sizeSqft: 650, occupancyStatus: 'vacant',   housekeepingStatus: 'cleaning' },
  { number: '208', floor: 2, roomTypeCode: 'DLX-K',  capacityAdults: 2, bedsLabel: '1 King',  occupancyStatus: 'occupied', housekeepingStatus: 'dirty',    priorityNote: 'Priority Cleaning (Check-in 3PM)' },
  { number: '215', floor: 2, roomTypeCode: 'STD-K',  capacityAdults: 2, bedsLabel: '1 King',  occupancyStatus: 'occupied', housekeepingStatus: 'dirty' },
  { number: '218', floor: 2, roomTypeCode: 'STD-D',  capacityAdults: 2, bedsLabel: '2 Queens', occupancyStatus: 'vacant',   housekeepingStatus: 'dirty',    priorityNote: 'Priority Cleaning (Check-in 3PM)' },
  { number: '301', floor: 3, roomTypeCode: 'EXE-S',  capacityAdults: 2, bedsLabel: '1 King, 1 Sofa', sizeSqft: 650, rateOverrideCents: 45000, occupancyStatus: 'vacant',   housekeepingStatus: 'clean' },
  { number: '302', floor: 3, roomTypeCode: 'DLX-K',  capacityAdults: 2, bedsLabel: '1 King',  rateOverrideCents: 28000, occupancyStatus: 'vacant',   housekeepingStatus: 'clean' },
  { number: '304', floor: 3, roomTypeCode: 'EXE-S',  capacityAdults: 2, capacityChildren: 1, bedsLabel: '1 King', sizeSqft: 650, rateOverrideCents: 45000, occupancyStatus: 'occupied', housekeepingStatus: 'dirty' },
  { number: '305', floor: 3, roomTypeCode: 'STD-D',  capacityAdults: 4, bedsLabel: '2 Queens', rateOverrideCents: 22000, occupancyStatus: 'vacant',   housekeepingStatus: 'cleaning' },
  { number: '312', floor: 3, roomTypeCode: 'STD-D',  capacityAdults: 4, bedsLabel: '2 Queens', occupancyStatus: 'vacant',   housekeepingStatus: 'out_of_order' },
  { number: '315', floor: 3, roomTypeCode: 'DLX-K',  capacityAdults: 2, bedsLabel: '1 King',  occupancyStatus: 'occupied', housekeepingStatus: 'dirty' },
  { number: '401', floor: 4, roomTypeCode: 'PNT-S',  capacityAdults: 4, bedsLabel: '1 King, 1 Sofa', sizeSqft: 1100, occupancyStatus: 'vacant',   housekeepingStatus: 'needs_inspection' },
  { number: '402', floor: 4, roomTypeCode: 'OVS-S',  capacityAdults: 2, bedsLabel: '1 King', sizeSqft: 550, occupancyStatus: 'occupied', housekeepingStatus: 'dirty' },
  { number: '405', floor: 4, roomTypeCode: 'PNT-S',  capacityAdults: 4, bedsLabel: '1 King, 1 Sofa', sizeSqft: 1100, occupancyStatus: 'vacant',   housekeepingStatus: 'out_of_order' },
  { number: '420', floor: 4, roomTypeCode: 'DLX-K',  capacityAdults: 2, bedsLabel: '1 King',  occupancyStatus: 'occupied', housekeepingStatus: 'dirty' },
];

/* ------------------------------------------------------------------ */
/*  Guests                                                             */
/* ------------------------------------------------------------------ */

export const guestData: GuestSeed[] = [
  {
    seedKey: 'alexander-wright', slug: 'alexander-wright',
    firstName: 'Alexander', lastName: 'Wright',
    email: 'a.wright@example.com', phone: '+1 (555) 123-4567',
    address: { lines: ['100 Park Avenue', 'Suite 2100'], city: 'New York', country: 'USA' },
    membershipTier: 'platinum',
    notes: 'VIP guest. Prefers high-floor rooms. Anniversary Oct 25.',
  },
  {
    seedKey: 'alexander-vance', slug: 'alexander-vance',
    firstName: 'Alexander', lastName: 'Vance',
    email: 'a.vance@example.com', phone: '+1 (555) 019-8234',
    address: { lines: ['4242 Corporate Park Blvd', 'Suite 400'], city: 'San Francisco', country: 'USA' },
    membershipTier: 'platinum',
  },
  {
    seedKey: 'eleanor-vance', slug: 'eleanor-vance',
    firstName: 'Eleanor', lastName: 'Vance',
    email: 'eleanor.vance@email.com', phone: '+44 20 7946 0958',
    address: { lines: ['456 Heritage Lane', 'Apt 4B'], city: 'London', country: 'United Kingdom' },
    membershipTier: 'platinum',
  },
  {
    seedKey: 'eleanor-astor', slug: 'eleanor-astor',
    firstName: 'Eleanor', lastName: 'Astor',
    email: 'eleanor.astor@example.com', phone: '+1 (555) 234-5678',
    address: { lines: ['789 Park Avenue'], city: 'New York', country: 'USA' },
    membershipTier: 'gold',
  },
  {
    seedKey: 'james-dupont', slug: 'james-dupont',
    firstName: 'James', lastName: 'Dupont',
    email: 'james.dupont@example.com', phone: '+1 (555) 345-6789',
    membershipTier: 'standard',
  },
  {
    seedKey: 'robert-chen', slug: 'robert-chen',
    firstName: 'Robert', lastName: 'Chen',
    email: 'robert.chen@example.com', phone: '+1 (555) 456-7890',
    membershipTier: 'standard',
  },
  {
    seedKey: 'sarah-miller', slug: 'sarah-miller',
    firstName: 'Sarah', lastName: 'Miller',
    email: 'sarah.miller@example.com', phone: '+1 (555) 567-8901',
    membershipTier: 'standard',
  },
  {
    seedKey: 'smith', slug: 'smith',
    firstName: 'John', lastName: 'Smith',
    email: 'john.smith@example.com', phone: '+1 (555) 678-9012',
    membershipTier: 'standard',
  },
  {
    seedKey: 'jenkins', slug: 'jenkins',
    firstName: 'Ms', lastName: 'Jenkins',
    email: 'ms.jenkins@example.com', phone: '+1 (555) 789-0123',
    membershipTier: 'standard',
  },
  {
    seedKey: 'anderson', slug: 'anderson',
    firstName: 'Mr', lastName: 'Anderson',
    email: 'mr.anderson@example.com', phone: '+1 (555) 890-1234',
    membershipTier: 'platinum',
    notes: 'VIP. Prefers late checkout.',
  },
  {
    seedKey: 'lee', slug: 'lee',
    firstName: 'David', lastName: 'Lee',
    email: 'david.lee@example.com', phone: '+1 (555) 901-2345',
    membershipTier: 'standard',
  },
  {
    seedKey: 'garcia', slug: 'garcia',
    firstName: 'Garcia', lastName: 'Couple',
    email: 'garcia@example.com', phone: '+1 (555) 012-3456',
    membershipTier: 'standard',
  },
  {
    seedKey: 'richards', slug: 'richards',
    firstName: 'Eleanor', lastName: 'Richards',
    email: 'eleanor.richards@example.com', phone: '+1 (555) 123-4500',
    membershipTier: 'standard',
  },
  {
    seedKey: 'lin', slug: 'jessica-lin',
    firstName: 'Jessica', lastName: 'Lin',
    email: 'jessica.lin@example.com', phone: '+1 (555) 234-5600',
    membershipTier: 'standard',
  },
  {
    seedKey: 'sterling', slug: 'marcus-sterling',
    firstName: 'Marcus', lastName: 'Sterling',
    email: 'marcus.sterling@example.com', phone: '+1 (555) 345-6700',
    membershipTier: 'standard',
  },
  {
    seedKey: 's-chen', slug: 'sophia-chen',
    firstName: 'Sophia', lastName: 'Chen',
    email: 'sophia.chen@example.com', phone: '+1 (555) 456-7800',
    membershipTier: 'standard',
  },
  {
    seedKey: 'd-miller', slug: 'david-miller',
    firstName: 'David', lastName: 'Miller',
    email: 'david.miller@example.com', phone: '+1 (555) 567-8900',
    membershipTier: 'standard',
  },
];

/* ------------------------------------------------------------------ */
/*  Reservations                                                       */
/* ------------------------------------------------------------------ */

export const reservationData: ReservationSeed[] = [
  {
    code: 'RSV-9938', guestSeedKey: 'eleanor-astor', roomTypeCode: 'EXE-S', roomNumber: '402',
    status: 'confirmed',
    checkInDate: d(2023, 10, 14), checkOutDate: d(2023, 10, 18),
    adults: 2, children: 0,
    ratePerNightCents: 45000, taxRateBps: 1400, depositCents: 0,
    source: 'Direct Web Booking',
  },
  {
    code: 'RSV-9941', guestSeedKey: 'james-dupont', roomTypeCode: 'DLX-K', roomNumber: '315',
    status: 'pending',
    checkInDate: d(2023, 10, 16), checkOutDate: d(2023, 10, 19),
    adults: 2, children: 0,
    ratePerNightCents: 28000, taxRateBps: 1400, depositCents: 47250,
    source: 'Direct Web Booking',
  },
  {
    code: 'RSV-9912', guestSeedKey: 'sarah-miller', roomTypeCode: 'STD-Q',
    status: 'cancelled',
    checkInDate: d(2023, 10, 18), checkOutDate: d(2023, 10, 20),
    adults: 1, children: 0,
    ratePerNightCents: 18900, taxRateBps: 1400, depositCents: 42000,
    source: 'Online Travel Agency',
  },
  {
    code: 'RSV-9955', guestSeedKey: 'robert-chen', roomTypeCode: 'DLX-K', roomNumber: '208',
    status: 'checked_in',
    checkInDate: d(2023, 10, 12), checkOutDate: d(2023, 10, 15),
    adults: 2, children: 0,
    ratePerNightCents: 28000, taxRateBps: 1400, depositCents: 110500,
    source: 'Direct Web Booking',
    checkedInAt: d(2023, 10, 12, 14, 30),
  },
  {
    code: 'RSV-29381', guestSeedKey: 'alexander-vance', roomTypeCode: 'DLX-KS', roomNumber: '304',
    status: 'confirmed',
    checkInDate: d(2023, 10, 24), checkOutDate: d(2023, 10, 27),
    adults: 2, children: 0,
    specialRequests: [
      { title: 'Feather-free Pillows', description: 'Guest has severe allergy. Housekeeping notified.', iconName: 'star' },
      { title: 'Anniversary Amenity', description: 'Deliver champagne and strawberries on Oct 25 at 6:00 PM.', iconName: 'cake', dueAt: d(2023, 10, 25, 18) },
    ],
    ratePerNightCents: 35000, taxRateBps: 1400, depositCents: 50000,
    source: 'Direct Web Booking',
  },
  {
    code: 'BKG-8924-AW', guestSeedKey: 'alexander-wright', roomTypeCode: 'EXE-S', roomNumber: '304',
    status: 'checked_in',
    checkInDate: d(2023, 10, 12), checkOutDate: d(2023, 10, 15),
    adults: 2, children: 0,
    ratePerNightCents: 45000, taxRateBps: 1200, depositCents: 45000,
    source: 'Direct Web Booking',
    checkedInAt: d(2023, 10, 12, 14),
  },
  {
    code: 'LX-9871', guestSeedKey: 'richards', roomTypeCode: 'EXE-S',
    status: 'pending',
    checkInDate: d(2023, 10, 26), checkOutDate: d(2023, 10, 29),
    adults: 2, children: 0,
    ratePerNightCents: 45000, taxRateBps: 1400, depositCents: 0,
    source: 'Direct Web Booking',
  },
  {
    code: 'LX-9872', guestSeedKey: 'sterling', roomTypeCode: 'DLX-K',
    status: 'checked_in',
    checkInDate: d(2023, 10, 26), checkOutDate: d(2023, 10, 28),
    adults: 2, children: 0,
    ratePerNightCents: 28000, taxRateBps: 1400, depositCents: 84000,
    source: 'Direct Web Booking',
    checkedInAt: d(2023, 10, 26, 15),
  },
  {
    code: 'LX-9873', guestSeedKey: 'lin', roomTypeCode: 'STD-Q',
    status: 'confirmed',
    checkInDate: d(2023, 10, 27), checkOutDate: d(2023, 11, 2),
    adults: 1, children: 0,
    ratePerNightCents: 18900, taxRateBps: 1400, depositCents: 105000,
    source: 'Online Travel Agency',
  },
];

/* ------------------------------------------------------------------ */
/*  Checkout Sessions (Folios)                                         */
/* ------------------------------------------------------------------ */

export const checkoutSessionData: CheckoutSessionSeed[] = [
  {
    reservationCode: 'BKG-8924-AW', guestSeedKey: 'alexander-wright', folioNumber: '#8842',
    charges: [
      { description: 'Deluxe King Room', department: 'room', quantity: 3, unitAmountCents: 45000, postedAt: d(2023, 10, 12) },
      { description: 'Restaurant - The Azure', department: 'restaurant', quantity: 1, unitAmountCents: 18500, postedAt: d(2023, 10, 13) },
      { description: 'Tranquility Spa', department: 'spa', quantity: 2, unitAmountCents: 12000, postedAt: d(2023, 10, 14) },
    ],
    discounts: [{ label: 'Loyalty Discount (Gold Tier)', amountCents: 8875 }],
    taxRateBps: 1200,
    status: 'open',
  },
];

/* ------------------------------------------------------------------ */
/*  Payments                                                           */
/* ------------------------------------------------------------------ */

export const paymentData: PaymentSeed[] = [
  {
    folioNumber: '#8842', amountCents: 45000, method: 'card',
    cardBrand: 'Visa', cardLast4: '4242', status: 'captured',
  },
  {
    folioNumber: '#8842', amountCents: 45000, method: 'card',
    cardBrand: 'Visa', cardLast4: '4242', status: 'captured',
  },
];

/* ------------------------------------------------------------------ */
/*  Invoices                                                           */
/* ------------------------------------------------------------------ */

export const invoiceData: InvoiceSeed[] = [
  {
    invoiceNumber: 'INV-2023-0845', folioNumber: '#8842', guestSeedKey: 'eleanor-vance',
    hotelBlock: {
      name: 'LuxeStay Pro',
      addressLines: ['123 Luxury Avenue', 'Riviera District, Monaco 98000'],
      email: 'billing@luxestaypro.com',
      phone: '+377 98 76 54 32',
    },
    billTo: {
      name: 'Eleanor Vance',
      addressLines: ['456 Heritage Lane, Apt 4B', 'London, W1J 7BT', 'United Kingdom'],
      email: 'eleanor.vance@email.com',
    },
    lineItems: [
      { description: 'Ocean View Suite (Room 402)', subDescription: 'Oct 20 - Oct 23 (3 Nights)', quantity: 3, unitAmountCents: 45000 },
      { description: 'Room Service - Breakfast', subDescription: 'Oct 21', quantity: 2, unitAmountCents: 4500 },
      { description: 'Azure Spa Retreat - Massage', subDescription: 'Oct 22', quantity: 1, unitAmountCents: 18000 },
      { description: 'Mini-bar Charges', quantity: 1, unitAmountCents: 3500 },
    ],
    subtotalCents: 161500,
    taxRateBps: 1400,
    taxCents: 22610,
    discountTotalCents: 0,
    totalCents: 184110,
    amountPaidCents: 50000,
    balanceDueCents: 134110,
    issueDate: d(2023, 10, 24),
    dueDate: d(2023, 11, 7),
    status: 'issued',
  },
];

/* ------------------------------------------------------------------ */
/*  Housekeeping Tasks                                                 */
/* ------------------------------------------------------------------ */

export const housekeepingData: HousekeepingSeed[] = [
  {
    roomNumber: '102', context: 'stayover', type: 'cleaning', status: 'dirty',
    assigneeSeedKey: 'marcus', progressPercent: 0,
    lastActivityAt: d(2023, 10, 24, 8),
  },
  {
    roomNumber: '205', context: 'checkout', type: 'cleaning', status: 'cleaning',
    assigneeSeedKey: 'sarah', progressPercent: 60,
    estimateCompletionAt: d(2023, 10, 24, 14, 30),
    lastActivityAt: d(2023, 10, 24, 10, 15),
  },
  {
    roomNumber: '312', context: 'vacant', type: 'maintenance', status: 'dirty',
    progressPercent: 0,
    lastActivityAt: d(2023, 10, 23, 9),
    ticket: {
      title: 'Plumbing Maintenance',
      reportedAt: d(2023, 10, 23, 9),
      assignedTeamLabel: 'Maintenance Team A',
      estimatedFixAt: d(2023, 10, 25, 12),
    },
  },
  {
    roomNumber: '401', context: 'arrival', type: 'inspection', status: 'needs_inspection',
    assigneeSeedKey: 'david', progressPercent: 90,
    lastActivityAt: d(2023, 10, 24, 10, 25),
  },
];

/* ------------------------------------------------------------------ */
/*  Activity Logs                                                      */
/* ------------------------------------------------------------------ */

export const activityLogData: ActivitySeed[] = [
  {
    entityType: 'room', entityRef: '304', action: 'cleaned',
    title: 'Room Cleaned', description: 'By Housekeeping Staff (Maria)',
    createdAt: d(2023, 10, 24, 10, 30),
  },
  {
    entityType: 'room', entityRef: '304', action: 'maintenance',
    title: 'AC Maintenance', description: 'Filter replaced by Tech Dept.',
    createdAt: d(2023, 10, 20, 14),
  },
  {
    entityType: 'reservation', entityRef: 'RSV-29381', action: 'created',
    title: 'Reservation Created', description: 'Created by Direct Web Booking.',
    createdAt: d(2023, 10, 12, 14, 30),
  },
  {
    entityType: 'reservation', entityRef: 'RSV-29381', action: 'deposit_captured',
    title: 'Deposit Payment Captured', description: 'Successfully processed $500.00 via Stripe gateway.',
    createdAt: d(2023, 10, 12, 14, 32),
  },
  {
    entityType: 'reservation', entityRef: 'RSV-29381', action: 'pre_arrival_email',
    title: 'Pre-arrival Email Sent', description: 'Automated system dispatched the welcome guide and upgrade offers.',
    createdAt: d(2023, 10, 24, 9),
  },
];

/* ------------------------------------------------------------------ */
/*  Counters                                                           */
/* ------------------------------------------------------------------ */

export const counterData: CounterSeed[] = [
  { key: 'folio', seq: 8851 },
  { key: 'invoice', seq: 846 },
];
