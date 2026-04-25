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
  places.filter((place) => {
    if (!hasValidCoordinates(place)) return false;
    if (filters.tripId !== 'all' && place.tripId !== filters.tripId) return false;
    if (filters.country !== 'all' && place.country !== filters.country) return false;
    if (filters.city !== 'all' && place.city !== filters.city) return false;
    if (filters.category !== 'all' && place.category !== filters.category) return false;
    return true;
  });

export const buildTravelFilterOptions = (trips: TravelTrip[], places: TravelPlace[], filters: TravelFilters): TravelFilterOptions => {
  const scopedCountrySet = new Set<string>();
  const scopedCitySet = new Set<string>();
  const scopedCategorySet = new Set<TravelPlace['category']>();

  places.forEach((place) => {
    if (!hasValidCoordinates(place)) return;
    if (filters.tripId !== 'all' && place.tripId !== filters.tripId) return;

    if (place.country) scopedCountrySet.add(place.country);

    if (filters.country !== 'all' && place.country !== filters.country) return;

    if (place.city) scopedCitySet.add(place.city);
    scopedCategorySet.add(place.category);
  });

  const countries = Array.from(scopedCountrySet).sort((a, b) => a.localeCompare(b));
  const cities = Array.from(scopedCitySet).sort((a, b) => a.localeCompare(b));
  const categories = Array.from(scopedCategorySet).sort();

  return {
    trips: [{ value: 'all', label: 'All trips' }, ...trips.map((trip) => ({ value: trip.id, label: trip.name }))],
    countries: [{ value: 'all', label: 'All countries' }, ...countries.map((country) => ({ value: country, label: country }))],
    cities: [{ value: 'all', label: 'All cities' }, ...cities.map((city) => ({ value: city, label: city }))],
    categories: [{ value: 'all', label: 'All categories' }, ...categories.map((category) => ({ value: category, label: TRAVEL_CATEGORY_LABEL[category] }))],
  };
};
