export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'dirty'
  | 'cleaning'
  | 'needs-inspection'
  | 'maintenance';

export type ReservationStatus = 'confirmed' | 'checked-in' | 'pending' | 'cancelled';

export type PaymentStatus = 'paid' | 'pending' | 'refunded';

export interface SelectOption {
  value: string;
  label: string;
}
