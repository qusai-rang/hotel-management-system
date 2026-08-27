export const USER_ROLES = ['admin', 'manager', 'front_desk', 'housekeeping'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBERSHIP_TIERS = ['standard', 'gold', 'platinum'] as const;
export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number];

export const OCCUPANCY_STATUSES = ['vacant', 'occupied'] as const;
export type OccupancyStatus = (typeof OCCUPANCY_STATUSES)[number];

export const HOUSEKEEPING_STATUSES = ['clean', 'dirty', 'cleaning', 'needs_inspection', 'out_of_order'] as const;
export type HousekeepingStatus = (typeof HOUSEKEEPING_STATUSES)[number];

export const HK_CONTEXTS = ['stayover', 'checkout', 'vacant', 'arrival'] as const;
export type HkContext = (typeof HK_CONTEXTS)[number];

export const HK_TASK_TYPES = ['cleaning', 'inspection', 'maintenance'] as const;
export type HkTaskType = (typeof HK_TASK_TYPES)[number];

export const HK_TASK_STATUSES = ['dirty', 'cleaning', 'needs_inspection', 'done'] as const;
export type HkTaskStatus = (typeof HK_TASK_STATUSES)[number];

export const RESERVATION_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const CHARGE_DEPARTMENTS = ['room', 'restaurant', 'spa'] as const;
export type ChargeDepartment = (typeof CHARGE_DEPARTMENTS)[number];

export const FOLIO_STATUSES = ['open', 'settled'] as const;
export type FolioStatus = (typeof FOLIO_STATUSES)[number];

export const PAYMENT_METHODS = ['card', 'cash', 'online', 'room_charge'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['captured', 'pending', 'refunded', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const INVOICE_STATUSES = ['issued', 'paid', 'void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const ACTIVITY_ENTITY_TYPES = ['room', 'reservation', 'folio', 'payment', 'invoice', 'task', 'auth'] as const;
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];
