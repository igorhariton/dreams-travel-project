import type { TravelDay, TravelDayMode, TravelPlace, TravelTrip } from '../types/travel';

const MODE_CATEGORY_ORDER: Record<TravelDayMode, Array<TravelPlace['category']>> = {
  'full-day': ['hotel', 'activity', 'restaurant', 'activity', 'stop'],
  food: ['restaurant', 'restaurant', 'stop'],
  attractions: ['activity', 'activity', 'stop'],
  mixed: ['activity', 'restaurant', 'stop', 'activity'],
};

const startsWith = (haystack?: string, needle?: string) =>
  !!haystack && !!needle && haystack.toLowerCase().includes(needle.toLowerCase());

const pickFirstUnused = (pool: TravelPlace[], used: Set<string>) => {
  const candidate = pool.find((place) => !used.has(place.id));
  if (!candidate) return null;
  used.add(candidate.id);
  return candidate;
};

export const suggestPlacesForDay = (trip: TravelTrip, day: TravelDay, mode: TravelDayMode, take = 5): TravelPlace[] => {
  const destinationScoped = trip.places.filter(
    (place) =>
      startsWith(place.city, trip.destination) ||
      startsWith(place.country, trip.country) ||
      startsWith(place.address, trip.destination),
  );
  const basePool = destinationScoped.length ? destinationScoped : trip.places;
  const byCategory = (category: TravelPlace['category']) => basePool.filter((place) => place.category === category);
  const orderedCategories = MODE_CATEGORY_ORDER[mode];
  const used = new Set<string>();
  const suggested: TravelPlace[] = [];

  orderedCategories.forEach((category) => {
    const picked = pickFirstUnused(byCategory(category), used);
    if (picked) suggested.push({ ...picked, dayId: day.id });
  });

  if (suggested.length < take) {
    basePool.forEach((place) => {
      if (suggested.length >= take || used.has(place.id)) return;
      used.add(place.id);
      suggested.push({ ...place, dayId: day.id });
    });
  }

  return suggested.slice(0, take);
};
