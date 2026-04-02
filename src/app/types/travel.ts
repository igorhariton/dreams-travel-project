export type TravelCategory = 'hotel' | 'rental' | 'activity' | 'restaurant' | 'stop';
export type TravelDayMode = 'full-day' | 'food' | 'attractions' | 'mixed';

export type TravelPlace = {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  category: TravelCategory;
  city?: string;
  country?: string;
  tripId?: string;
  dayId?: string | null;
  price?: number;
  isFavorite?: boolean;
};

export type TravelDay = {
  id: string;
  date: string;
  title?: string;
  destination?: string;
  mode?: TravelDayMode;
  places: TravelPlace[];
};

export type TravelTrip = {
  id: string;
  name: string;
  destination: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  days: TravelDay[];
  places: TravelPlace[];
};

export type TravelFilters = {
  tripId: string;
  country: string;
  city: string;
  category: 'all' | TravelCategory;
};

export type TravelFilterOptions = {
  trips: Array<{ value: string; label: string }>;
  countries: Array<{ value: string; label: string }>;
  cities: Array<{ value: string; label: string }>;
  categories: Array<{ value: 'all' | TravelCategory; label: string }>;
};

export type TravelBudgetSummary = {
  total: number;
  averagePerDay: number;
  byCategory: Record<TravelCategory, number>;
};

export const TRAVEL_CATEGORY_LABEL: Record<TravelCategory, string> = {
  hotel: 'Hotel',
  rental: 'Rental',
  activity: 'Activity',
  restaurant: 'Restaurant',
  stop: 'Stop',
};

export const TRAVEL_MODE_LABEL: Record<TravelDayMode, string> = {
  'full-day': 'Full day',
  food: 'Food',
  attractions: 'Attractions',
  mixed: 'Mixed',
};

export const TRAVEL_COLORS = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  navy: '#14213D',
  blue: '#2563EB',
  cyan: '#06B6D4',
  purple: '#7C3AED',
  green: '#10B981',
  amber: '#F59E0B',
  danger: '#FCA5A5',
  border: '#D9E3F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  category: {
    hotel: '#2563EB',
    rental: '#06B6D4',
    activity: '#10B981',
    restaurant: '#F59E0B',
    stop: '#7C3AED',
  } satisfies Record<TravelCategory, string>,
};
