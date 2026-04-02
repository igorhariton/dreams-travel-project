import type { TravelFilterOptions, TravelFilters, TravelPlace, TravelTrip } from '../types/travel';
import { TRAVEL_CATEGORY_LABEL } from '../types/travel';

const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values.filter((entry) => entry && entry.trim().length > 0))).sort((a, b) => a.localeCompare(b));

export const hasValidCoordinates = (place: TravelPlace) =>
  Number.isFinite(place.lat) &&
  Number.isFinite(place.lng) &&
  place.lat >= -90 &&
  place.lat <= 90 &&
  place.lng >= -180 &&
  place.lng <= 180;

export const sanitizePlaces = (places: TravelPlace[]) => places.filter(hasValidCoordinates);

export const applyTravelFilters = (places: TravelPlace[], filters: TravelFilters) =>
  sanitizePlaces(places)
    .filter((place) => filters.tripId === 'all' || place.tripId === filters.tripId)
    .filter((place) => filters.country === 'all' || place.country === filters.country)
    .filter((place) => filters.city === 'all' || place.city === filters.city)
    .filter((place) => filters.category === 'all' || place.category === filters.category);

export const buildTravelFilterOptions = (trips: TravelTrip[], places: TravelPlace[], filters: TravelFilters): TravelFilterOptions => {
  const cleaned = sanitizePlaces(places);
  const scopedByTrip = cleaned.filter((place) => filters.tripId === 'all' || place.tripId === filters.tripId);
  const scopedByCountry = scopedByTrip.filter((place) => filters.country === 'all' || place.country === filters.country);

  const countries = uniqueSorted(scopedByTrip.map((place) => place.country || ''));
  const cities = uniqueSorted(scopedByCountry.map((place) => place.city || ''));
  const categories = Array.from(new Set(scopedByCountry.map((place) => place.category))).sort();

  return {
    trips: [{ value: 'all', label: 'All trips' }, ...trips.map((trip) => ({ value: trip.id, label: trip.name }))],
    countries: [{ value: 'all', label: 'All countries' }, ...countries.map((country) => ({ value: country, label: country }))],
    cities: [{ value: 'all', label: 'All cities' }, ...cities.map((city) => ({ value: city, label: city }))],
    categories: [{ value: 'all', label: 'All categories' }, ...categories.map((category) => ({ value: category, label: TRAVEL_CATEGORY_LABEL[category] }))],
  };
};
