export type BookingItemType = 'hotel' | 'rental' | 'destination';

export type BookingStatus = 'confirmed' | 'pending';

export interface BookingItem {
  id: string;
  title: string;
  type: BookingItemType;
  location: string;
  price: number;
  currency: string;
  image: string;
  bookedAt: string;
  status: BookingStatus;
  sourceId?: string;
}

export interface CreateBookingInput {
  sourceId?: string;
  title: string;
  type: BookingItemType;
  location: string;
  price: number;
  currency: string;
  image: string;
  bookedAt?: string;
  status?: BookingStatus;
}

export interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
}
