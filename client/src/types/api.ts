/* ================================================================== */
/*  Frontend API DTO Types — mirrors backend serializer shapes         */
/*  Do NOT import from server; these are independently maintained.     */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  User / Auth                                                        */
/* ------------------------------------------------------------------ */

export type UserRole = 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'maintenance';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt: string | null;
}

export interface LoginResponse {
  success: boolean;
  user: SafeUser;
  token: string;
}

export interface MeResponse {
  success: boolean;
  user: SafeUser;
}

/* ------------------------------------------------------------------ */
/*  API Response Envelopes                                              */
/* ------------------------------------------------------------------ */

export interface ApiSuccessResponse<T> {
  success: true;
  item?: T;
  items?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  user?: T extends SafeUser ? SafeUser : never;
  token?: T extends SafeUser ? string : never;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */

export interface PaginatedResponse<T> {
  success: true;
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ------------------------------------------------------------------ */
/*  Room Type                                                          */
/* ------------------------------------------------------------------ */

export interface RoomTypeDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  basePricePerNightCents: number;
  maxGuests: number;
  bedLabel: string;
  sizeSqft: number | null;
  amenities: { iconName: string; label: string }[];
  accentColor: string | null;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomTypeListItem {
  id: string;
  code: string;
  name: string;
  basePricePerNightCents: number;
  maxGuests: number;
  totalRooms: number;
}

/* ------------------------------------------------------------------ */
/*  Room                                                               */
/* ------------------------------------------------------------------ */

export type RoomDisplayStatus = 'available' | 'occupied' | 'dirty' | 'maintenance';

export interface RoomListItem {
  id: string;
  number: string;
  floor: number;
  roomType: { id: string; code: string; name: string };
  capacityAdults: number;
  capacityChildren: number | null;
  bedsLabel: string;
  sizeSqft: number | null;
  rateOverrideCents: number | null;
  occupancyStatus: string;
  housekeepingStatus: string;
  displayStatus: RoomDisplayStatus;
  currentGuest: { name: string; initials: string; departure: string } | null;
  priorityNote: string | null;
}

export interface RoomDetailDTO {
  id: string;
  number: string;
  floor: number;
  roomType: {
    id: string;
    code: string;
    name: string;
    description: string;
    bedLabel: string;
    sizeSqft: number | null;
    amenities: { iconName: string; label: string }[];
    accentColor: string | null;
  };
  capacityAdults: number;
  capacityChildren: number | null;
  bedsLabel: string;
  sizeSqft: number | null;
  rateOverrideCents: number | null;
  occupancyStatus: string;
  housekeepingStatus: string;
  displayStatus: RoomDisplayStatus;
  currentStay: {
    guestName: string;
    guestId: string;
    checkInDate: string;
    checkOutDate: string;
    reservationCode: string;
    bookingId: string;
  } | null;
  maintenance: { title: string; reportedAt: string; assignedTo: string; estimatedFixAt: string } | null;
  priorityNote: string | null;
  cleanedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Guest                                                              */
/* ------------------------------------------------------------------ */

export interface GuestListItem {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: { lines: string[]; city: string | null; country: string | null } | null;
  membershipTier: string;
  notes: string;
}

export interface GuestProfileDTO {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: { lines: string[]; city: string | null; country: string | null } | null;
  membershipTier: string;
  notes: string;
  stats: {
    totalStays: number;
    totalSpendCents: number;
    lastVisit: string | null;
  };
  stayHistory: {
    reservationCode: string;
    checkInDate: string;
    checkOutDate: string;
    roomNumber: string | null;
    roomTypeName: string;
    totalCents: number;
    status: string;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Reservation                                                        */
/* ------------------------------------------------------------------ */

export interface ReservationListItem {
  id: string;
  code: string;
  guest: { id: string; fullName: string; initials: string; email: string | null; phone: string | null } | null;
  roomType: { id: string; code: string; name: string } | null;
  room: { id: string; number: string } | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: string;
  ratePerNightCents: number;
  totalCents: number;
  depositCents: number;
  adults: number;
  children: number;
  source: string;
  createdAt: string;
}

export interface ReservationDetailDTO {
  id: string;
  code: string;
  status: string;
  guest: { id: string; slug: string; fullName: string; email: string | null; phone: string | null; membershipTier: string } | null;
  roomType: { id: string; code: string; name: string; bedLabel: string; amenities: { iconName: string; label: string }[] } | null;
  room: { id: string; number: string; floor: number; bedsLabel: string } | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  ratePerNightCents: number;
  taxRateBps: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  depositCents: number;
  amountPaidCents: number;
  outstandingCents: number;
  specialRequests: { title: string; description: string | null; iconName: string | null; dueAt: string | null }[];
  internalNotes: { body: string; addedBy: string | null; addedAt: string }[];
  source: string;
  createdBy: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Availability                                                       */
/* ------------------------------------------------------------------ */

export interface AvailabilityRoomItem {
  roomId: string;
  roomNumber: string;
  floor: number;
  capacityAdults: number;
  capacityChildren: number | null;
  bedsLabel: string;
  sizeSqft: number | null;
  ratePerNightCents: number;
  roomType: { id: string; code: string; name: string; amenities: { iconName: string; label: string }[]; accentColor: string | null };
}

export interface AvailabilityGroup {
  roomType: {
    id: string;
    code: string;
    name: string;
    description: string;
    bedLabel: string;
    amenities: { iconName: string; label: string }[];
    accentColor: string | null;
    basePricePerNightCents: number;
  };
  availableRooms: AvailabilityRoomItem[];
}

/* ------------------------------------------------------------------ */
/*  Housekeeping                                                       */
/* ------------------------------------------------------------------ */

export interface HousekeepingTaskDTO {
  id: string;
  roomId: string;
  room: { number: string; floor: number; roomTypeCode: string; roomTypeName: string } | null;
  context: string;
  type: string;
  status: string;
  assignee: { id: string; name: string; role: string } | null;
  progressPercent: number;
  estimateCompletionAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  ticket: {
    title: string | null;
    reportedAt: string | null;
    assignedTeamLabel: string | null;
    estimatedFixAt: string | null;
  } | null;
  priorityNote: string | null;
}

export interface HousekeepingStatsDTO {
  totalTasks: number;
  dirtyRooms: number;
  cleaningTasks: number;
  needsInspectionRooms: number;
  maintenanceRooms: number;
  cleanRooms: number;
  completedToday: number;
  openTasks: number;
  byContext: Record<string, number>;
  byFloor: Record<string, number>;
}

export interface StaffScheduleEntryDTO {
  staff: { id: string; name: string; role: string };
  floors: number[];
  assignedTaskCount: number;
  completedTaskCount: number;
  completionRate: number;
  inProgressTaskCount: number;
  overdueTaskCount: number;
}

/* ------------------------------------------------------------------ */
/*  Folio                                                              */
/* ------------------------------------------------------------------ */

export interface FolioDTO {
  id: string;
  folioNumber: string;
  reservationId: string;
  guestId: string;
  charges: {
    description: string;
    department: string;
    quantity: number;
    unitAmountCents: number;
    totalCents: number;
    postedAt: string;
    postedBy: string | null;
  }[];
  discounts: {
    label: string;
    amountCents: number;
  }[];
  taxRateBps: number;
  status: string;
  computed: {
    subtotalCents: number;
    taxCents: number;
    discountTotalCents: number;
    totalCents: number;
    paidCents: number;
    balanceCents: number;
  };
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Payment                                                            */
/* ------------------------------------------------------------------ */

export interface PaymentDTO {
  id: string;
  folioId: string;
  amountCents: number;
  method: string;
  cardBrand: string | null;
  cardLast4: string | null;
  gatewayRef: string | null;
  status: string;
  processedBy: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Billing                                                            */
/* ------------------------------------------------------------------ */

export interface BillingTransactionRow {
  id: string;
  folioId: string;
  folioNumber: string;
  guestName: string;
  guestId: string;
  reservationCode: string;
  description: string;
  department: string;
  amountCents: number;
  method: string;
  status: string;
  createdAt: string;
}

export interface BillingMetrics {
  mtdCapturedRevenueCents: number;
  pendingOpenBalanceCents: number;
  todayPaymentCount: number;
  todayPaymentValueCents: number;
  mtdRefundsCents: number;
}

/* ------------------------------------------------------------------ */
/*  Invoice                                                            */
/* ------------------------------------------------------------------ */

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  folioId: string;
  guestId: string | null;
  hotelBlock: {
    name: string;
    addressLines: string[];
    email: string | null;
    phone: string | null;
  };
  billTo: {
    name: string;
    addressLines: string[];
    email: string | null;
  };
  lineItems: {
    description: string;
    subDescription: string | null;
    quantity: number;
    unitAmountCents: number;
    totalCents: number;
  }[];
  subtotalCents: number;
  taxRateBps: number;
  taxCents: number;
  discountTotalCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceDueCents: number;
  issueDate: string;
  dueDate: string;
  status: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

export interface DashboardSummary {
  occupancy: {
    totalRooms: number;
    occupiedRooms: number;
    vacantRooms: number;
    availableRooms: number;
    dirtyRooms: number;
    cleaningRooms: number;
    needsInspectionRooms: number;
    maintenanceRooms: number;
    occupancyRate: number;
  };
  today: {
    arrivals: number;
    departures: number;
    housekeepingTasks: number;
  };
  upcoming: number;
  recentBookings: {
    id: string;
    code: string;
    guestName: string;
    roomType: string;
    roomNumber: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    createdAt: string;
  }[];
  revenue: {
    todayCapturedCents: number;
    todayPaymentCount: number;
    mtdRevenueCents: number;
    outstandingBalanceCents: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Checkout                                                           */
/* ------------------------------------------------------------------ */

export interface CheckoutSessionDTO {
  reservation: {
    id: string;
    code: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children: number;
    ratePerNightCents: number;
    nights: number;
  };
  guest: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: { lines: string[]; city: string | null; country: string | null } | null;
  } | null;
  room: {
    id: string;
    number: string;
    floor: number;
    bedsLabel: string;
    roomType: { id: string; code: string; name: string } | null;
  } | null;
  folio: {
    id: string;
    folioNumber: string;
    status: string;
    charges: {
      description: string;
      department: string;
      quantity: number;
      unitAmountCents: number;
      totalCents: number;
    }[];
    discounts: {
      label: string;
      amountCents: number;
    }[];
    taxRateBps: number;
    computed: {
      subtotalCents: number;
      taxCents: number;
      discountTotalCents: number;
      totalCents: number;
      paidCents: number;
      balanceCents: number;
    };
  } | null;
  payments: {
    id: string;
    amountCents: number;
    method: string;
    status: string;
    createdAt: string;
  }[];
}

export interface CheckoutCompletionDTO {
  reservationCode: string;
  status: string;
  checkedOutAt: string;
  invoiceNumber: string | null;
  folioStatus: string;
  roomNumber: string | null;
  roomStatus: string | null;
}
