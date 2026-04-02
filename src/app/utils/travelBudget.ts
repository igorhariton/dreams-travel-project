import type { TravelBudgetSummary, TravelCategory, TravelDay, TravelPlace, TravelTrip } from '../types/travel';

const CATEGORY_FALLBACK_PRICE: Record<TravelCategory, number> = {
  hotel: 250,
  rental: 190,
  activity: 30,
  restaurant: 40,
  stop: 0,
};

export const placeCost = (place: TravelPlace) => place.price ?? CATEGORY_FALLBACK_PRICE[place.category] ?? 0;

export const calculateDayCost = (day: TravelDay) => day.places.reduce((sum, place) => sum + placeCost(place), 0);

export const calculateTripBudget = (trip: TravelTrip): TravelBudgetSummary => {
  const byCategory: Record<TravelCategory, number> = {
    hotel: 0,
    rental: 0,
    activity: 0,
    restaurant: 0,
    stop: 0,
  };

  trip.days.forEach((day) => {
    day.places.forEach((place) => {
      byCategory[place.category] += placeCost(place);
    });
  });

  const total = Object.values(byCategory).reduce((sum, entry) => sum + entry, 0);
  const averagePerDay = trip.days.length ? total / trip.days.length : 0;

  return { total, averagePerDay, byCategory };
};
