import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Destination, Hotel, Rental } from '../data/travelData';
import { useMapController } from './useMapController';
import type {
  TravelCategory,
  TravelDay,
  TravelDayMode,
  TravelFilters,
  TravelPlace,
  TravelTrip,
} from '../types/travel';
import { calculateDayCost, calculateTripBudget } from '../utils/travelBudget';
import { applyTravelFilters, buildTravelFilterOptions } from '../utils/travelFilters';
import { suggestPlacesForDay } from '../utils/travelSuggestions';

const DEFAULT_FILTERS: TravelFilters = {
  tripId: 'all',
  country: 'all',
  city: 'all',
  category: 'all',
};

const todayIso = () => {
  const date = new Date();
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
};

const addDays = (isoDate: string, days: number) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const cursor = new Date(year, (month || 1) - 1, day || 1);
  cursor.setDate(cursor.getDate() + days);
  return `${cursor.getFullYear()}-${`${cursor.getMonth() + 1}`.padStart(2, '0')}-${`${cursor.getDate()}`.padStart(2, '0')}`;
};

const toTitle = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const cleanWords = (value: string) => value.split(',').map((entry) => entry.trim()).filter(Boolean);
const normalizeLookup = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const compactLookup = (value: string) => value.replace(/\s+/g, '');
const splitAliases = (value: string) =>
  value
    .replace(/\s*&\s*/g, '|')
    .replace(/\s*\/\s*/g, '|')
    .replace(/\s*-\s*/g, '|')
    .replace(/\s*,\s*/g, '|')
    .replace(/\s+and\s+/gi, '|')
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
const hasValidLatLng = (lat?: number, lng?: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  (lat as number) >= -90 &&
  (lat as number) <= 90 &&
  (lng as number) >= -180 &&
  (lng as number) <= 180;

const uniquePlacesById = (places: TravelPlace[]) => {
  const seen = new Set<string>();
  return places.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
};

const relabelTripDays = (days: TravelDay[]) =>
  days.map((day, index) => ({
    ...day,
    title: `Day ${index + 1}`,
  }));

let uid = 0;
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(uid += 1).toString(36)}`;

const seedDays = (trip: TravelTrip): TravelDay[] => {
  const dayIds = [makeId('day'), makeId('day'), makeId('day')];
  const baseDate = trip.startDate || todayIso();
  const byCategory = (category: TravelCategory) => trip.places.filter((place) => place.category === category);

  const day1Places = [
    byCategory('hotel')[0] || byCategory('rental')[0],
    byCategory('activity')[0],
    byCategory('restaurant')[0],
  ].filter(Boolean) as TravelPlace[];

  const day2Places = [
    byCategory('activity')[1] || byCategory('activity')[0],
    byCategory('restaurant')[1] || byCategory('restaurant')[0],
    byCategory('stop')[0],
  ].filter(Boolean) as TravelPlace[];

  const day3Places = [
    byCategory('stop')[1] || byCategory('stop')[0],
    byCategory('activity')[2] || byCategory('activity')[0],
    byCategory('restaurant')[2] || byCategory('restaurant')[0],
  ].filter(Boolean) as TravelPlace[];

  const source = [day1Places, day2Places, day3Places];

  return dayIds.map((dayId, index) => ({
    id: dayId,
    date: addDays(baseDate, index),
    title: `Day ${index + 1}`,
    destination: trip.destination,
    mode: index === 0 ? 'full-day' : index === 1 ? 'mixed' : 'attractions',
    places: source[index].map((place) => ({ ...place, dayId })),
  }));
};

const buildTripsFromTravelData = (
  destinations: Destination[],
  hotels: Hotel[],
  rentals: Rental[],
): TravelTrip[] => {
  const aliasOwner = new Map<string, string | null>();
  const destinationAliases = new Map<string, string[]>();
  const countryDestinationIndex = new Map<string, string[]>();

  const registerAlias = (destinationId: string, alias: string) => {
    const normalizedAlias = normalizeLookup(alias);
    if (normalizedAlias.length < 3) return;

    const compactAlias = compactLookup(normalizedAlias);
    const currentOwner = aliasOwner.get(normalizedAlias);
    if (currentOwner === undefined) aliasOwner.set(normalizedAlias, destinationId);
    else if (currentOwner !== destinationId) aliasOwner.set(normalizedAlias, null);

    const currentCompactOwner = aliasOwner.get(compactAlias);
    if (currentCompactOwner === undefined) aliasOwner.set(compactAlias, destinationId);
    else if (currentCompactOwner !== destinationId) aliasOwner.set(compactAlias, null);
  };

  destinations.forEach((destination) => {
    const rawAliases = new Set<string>([
      destination.id,
      destination.id.replace(/[_-]+/g, ' '),
      destination.name,
      destination.country,
      ...splitAliases(destination.name),
      ...splitAliases(destination.id.replace(/[_-]+/g, ' ')),
    ]);

    const nameWords = destination.name
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3);
    if (nameWords.length >= 2) rawAliases.add(`${nameWords[0]} ${nameWords[1]}`);
    if (nameWords.length >= 3) rawAliases.add(`${nameWords[0]} ${nameWords[1]} ${nameWords[2]}`);

    const normalizedAliases = Array.from(
      new Set(
        Array.from(rawAliases)
          .map((alias) => normalizeLookup(alias))
          .filter((alias) => alias.length >= 3),
      ),
    );
    destinationAliases.set(destination.id, normalizedAliases);
    normalizedAliases.forEach((alias) => registerAlias(destination.id, alias));

    const countryKey = normalizeLookup(destination.country);
    if (countryKey) {
      const existing = countryDestinationIndex.get(countryKey) || [];
      countryDestinationIndex.set(countryKey, [...existing, destination.id]);
    }
  });

  const resolveListingDestinationId = (rawDestinationId?: string, rawLocation?: string) => {
    const candidates = [normalizeLookup(rawDestinationId), normalizeLookup(rawLocation)].filter(
      (candidate) => candidate.length > 0,
    );
    if (!candidates.length) return null;

    for (const candidate of candidates) {
      const exact = aliasOwner.get(candidate);
      if (exact) return exact;
      const compactExact = aliasOwner.get(compactLookup(candidate));
      if (compactExact) return compactExact;
    }

    let bestMatch: { destinationId: string; score: number } | null = null;
    for (const [destinationId, aliases] of destinationAliases.entries()) {
      let score = 0;
      for (const candidate of candidates) {
        for (const alias of aliases) {
          if (alias.length < 4) continue;
          if (candidate.includes(alias)) {
            score = Math.max(score, alias.length);
          }
        }
      }
      if (score > (bestMatch?.score || 0)) {
        bestMatch = { destinationId, score };
      }
    }
    if (bestMatch && bestMatch.score >= 4) return bestMatch.destinationId;

    for (const candidate of candidates) {
      for (const [countryKey, destinationIds] of countryDestinationIndex.entries()) {
        if (!countryKey || destinationIds.length !== 1) continue;
        if (candidate.includes(countryKey)) {
          return destinationIds[0];
        }
      }
    }

    return null;
  };

  const hotelsByDestinationId = new Map<string, Hotel[]>();
  hotels.forEach((hotel) => {
    const resolvedDestinationId = resolveListingDestinationId(hotel.destinationId, hotel.location);
    if (!resolvedDestinationId) return;
    const scopedHotels = hotelsByDestinationId.get(resolvedDestinationId) || [];
    hotelsByDestinationId.set(resolvedDestinationId, [...scopedHotels, hotel]);
  });

  const rentalsByDestinationId = new Map<string, Rental[]>();
  rentals.forEach((rental) => {
    const resolvedDestinationId = resolveListingDestinationId(rental.destinationId, rental.location);
    if (!resolvedDestinationId) return;
    const scopedRentals = rentalsByDestinationId.get(resolvedDestinationId) || [];
    rentalsByDestinationId.set(resolvedDestinationId, [...scopedRentals, rental]);
  });

  const baseStart = todayIso();

  return destinations.map((destination, index) => {
    const tripId = `trip-${destination.id}`;
    const city = destination.name;
    const country = destination.country;
    const destinationHeroImage = destination.images[0];

    const hotelPlaces: TravelPlace[] = (hotelsByDestinationId.get(destination.id) || []).map((hotel) => {
      const lat = hasValidLatLng(hotel.lat, hotel.lng) ? (hotel.lat as number) : destination.lat;
      const lng = hasValidLatLng(hotel.lat, hotel.lng) ? (hotel.lng as number) : destination.lng;
      return {
        id: `place-hotel-${hotel.id}`,
        name: hotel.name,
        address: hotel.location,
        description: hotel.description,
        imageUrl: hotel.images[0] || destinationHeroImage,
        lat,
        lng,
        category: 'hotel',
        city,
        country,
        tripId,
        price: hotel.pricePerNight,
        rating: hotel.rating,
        reviews: hotel.reviews,
        isFavorite: false,
      };
    });

    const rentalPlaces: TravelPlace[] = (rentalsByDestinationId.get(destination.id) || []).map((rental) => {
      const lat = hasValidLatLng(rental.lat, rental.lng) ? (rental.lat as number) : destination.lat;
      const lng = hasValidLatLng(rental.lat, rental.lng) ? (rental.lng as number) : destination.lng;
      return {
        id: `place-rental-${rental.id}`,
        name: rental.name,
        address: rental.location,
        description: rental.description,
        imageUrl: rental.images[0] || destinationHeroImage,
        lat,
        lng,
        category: 'rental',
        city,
        country,
        tripId,
        price: rental.pricePerNight,
        rating: rental.rating,
        reviews: rental.reviews,
        isFavorite: false,
      };
    });

    const activityPlaces: TravelPlace[] = destination.mustVisit.map((name, nameIndex) => ({
      id: `place-activity-${destination.id}-${nameIndex}`,
      name,
      address: `${name}, ${city}, ${country}`,
      description: `Explore ${name} in ${city}.`,
      imageUrl: destinationHeroImage,
      lat: destination.lat,
      lng: destination.lng,
      category: 'activity',
      city,
      country,
      tripId,
      price: 25 + (nameIndex % 3) * 8,
      isFavorite: false,
    }));

    const restaurantPlaces: TravelPlace[] = cleanWords(destination.cuisine)
      .slice(0, 4)
      .map((dish, dishIndex) => ({
        id: `place-restaurant-${destination.id}-${dishIndex}`,
        name: `${toTitle(dish)} spot`,
        address: `${city}, ${country}`,
        description: `Popular ${dish.toLowerCase()} cuisine stop in ${city}.`,
        imageUrl: destinationHeroImage,
        lat: destination.lat,
        lng: destination.lng,
        category: 'restaurant',
        city,
        country,
        tripId,
        price: 32 + (dishIndex % 2) * 11,
        isFavorite: false,
      }));

    const stopPlaces: TravelPlace[] = [
      {
        id: `place-stop-${destination.id}-center`,
        name: `${city} city center`,
        address: `${city}, ${country}`,
        description: `Central stop in ${city}.`,
        imageUrl: destinationHeroImage,
        lat: destination.lat,
        lng: destination.lng,
        category: 'stop',
        city,
        country,
        tripId,
        price: 0,
        isFavorite: false,
      },
      {
        id: `place-stop-${destination.id}-oldtown`,
        name: `${city} old town`,
        address: `${city}, ${country}`,
        description: `Historic old town area in ${city}.`,
        imageUrl: destinationHeroImage,
        lat: destination.lat,
        lng: destination.lng,
        category: 'stop',
        city,
        country,
        tripId,
        price: 0,
        isFavorite: false,
      },
    ];

    const places = [...hotelPlaces, ...rentalPlaces, ...activityPlaces, ...restaurantPlaces, ...stopPlaces];
    const startDate = addDays(baseStart, index % 10);
    const trip: TravelTrip = {
      id: tripId,
      name: destination.name,
      destination: destination.name,
      country: destination.country,
      startDate,
      endDate: addDays(startDate, 2),
      budget: 2500,
      days: [],
      places,
    };

    return {
      ...trip,
      days: seedDays(trip),
    };
  });
};

type UpdateTrip = (trip: TravelTrip) => TravelTrip;

export const useTravelPlanner = () => {
  const { publicDestinations, publicHotels, publicRentals } = useApp();
  const seededTrips = useMemo(
    () => buildTripsFromTravelData(publicDestinations, publicHotels, publicRentals),
    [publicDestinations, publicHotels, publicRentals],
  );
  const defaultTrip = seededTrips.find((trip) => trip.id === 'trip-santorini') || seededTrips[0];
  const defaultDay = defaultTrip?.days[0];

  const [trips, setTrips] = useState<TravelTrip[]>(seededTrips);
  const [activeTripId, setActiveTripId] = useState(defaultTrip?.id || '');
  const [activeDayId, setActiveDayId] = useState(defaultDay?.id || '');
  const [filters, setFilters] = useState<TravelFilters>({
    ...DEFAULT_FILTERS,
  });
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [activeSuggestMode, setActiveSuggestMode] = useState<TravelDayMode>('full-day');

  const mapController = useMapController();

  const activeTrip = useMemo(() => trips.find((trip) => trip.id === activeTripId) || trips[0], [activeTripId, trips]);
  const activeDay = useMemo(
    () => activeTrip?.days.find((day) => day.id === activeDayId) || activeTrip?.days[0] || null,
    [activeDayId, activeTrip],
  );

  const allPlaces = useMemo(() => trips.flatMap((trip) => trip.places), [trips]);
  const placeTripIndex = useMemo(() => {
    const index = new Map<string, string>();
    trips.forEach((trip) => {
      trip.places.forEach((place) => {
        if (!index.has(place.id)) index.set(place.id, trip.id);
      });
    });
    return index;
  }, [trips]);
  const dedupedAllPlaces = useMemo(() => uniquePlacesById(allPlaces), [allPlaces]);
  const filteredPlaces = useMemo(() => applyTravelFilters(dedupedAllPlaces, filters), [dedupedAllPlaces, filters]);
  const filterOptions = useMemo(() => buildTravelFilterOptions(trips, dedupedAllPlaces, filters), [trips, dedupedAllPlaces, filters]);
  const budget = useMemo(() => (activeTrip ? calculateTripBudget(activeTrip) : null), [activeTrip]);

  const updateTrip = useCallback(
    (tripId: string, updater: UpdateTrip) => {
      setTrips((prev) => prev.map((trip) => (trip.id === tripId ? updater(trip) : trip)));
    },
    [],
  );

  const updateActiveTrip = useCallback(
    (updater: UpdateTrip) => {
      if (!activeTripId) return;
      updateTrip(activeTripId, updater);
    },
    [activeTripId, updateTrip],
  );

  const findTripIdByDayId = useCallback(
    (dayId: string) => trips.find((trip) => trip.days.some((day) => day.id === dayId))?.id || null,
    [trips],
  );

  useEffect(() => {
    if (!activeTrip) return;
    if (!activeTrip.days.some((day) => day.id === activeDayId)) {
      setActiveDayId(activeTrip.days[0]?.id || '');
    }
  }, [activeDayId, activeTrip]);

  useEffect(() => {
    if (selectedPlaceId && !allPlaces.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(null);
    }
  }, [allPlaces, selectedPlaceId]);

  const setTripFilter = useCallback(
    (tripId: string) => {
      const scopedTrip = tripId === 'all' ? null : trips.find((trip) => trip.id === tripId) || null;
      startTransition(() => {
        setFilters((prev) => ({
          ...prev,
          tripId,
          country: scopedTrip?.country || 'all',
          city: scopedTrip?.destination || 'all',
        }));

        if (!scopedTrip) return;
        setActiveTripId(scopedTrip.id);
        setActiveDayId(scopedTrip.days[0]?.id || '');
      });
    },
    [trips],
  );

  const setCountryFilter = useCallback((country: string) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, country, city: 'all' }));
    });
  }, []);

  const setCityFilter = useCallback((city: string) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, city }));
    });
  }, []);

  const setCategoryFilter = useCallback((category: TravelFilters['category']) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, category }));
    });
  }, []);

  const selectDay = useCallback(
    (dayId: string) => {
      const tripId = findTripIdByDayId(dayId);
      startTransition(() => {
        if (tripId && tripId !== activeTripId) {
          setActiveTripId(tripId);
        }
        setActiveDayId(dayId);
      });
    },
    [activeTripId, findTripIdByDayId],
  );

  const selectPlaceFromList = useCallback(
    (placeId: string) => {
      setSelectedPlaceId(placeId);
      mapController.focusPlace(placeId);
      const tripId = placeTripIndex.get(placeId) || activeTripId;
      const scopedTrip = trips.find((trip) => trip.id === tripId);
      if (!scopedTrip) return;
      const dayWithPlace = scopedTrip.days.find((day) => day.places.some((place) => place.id === placeId));
      startTransition(() => {
        if (tripId && tripId !== activeTripId) setActiveTripId(tripId);
        if (dayWithPlace) setActiveDayId(dayWithPlace.id);
      });
    },
    [activeTripId, mapController, placeTripIndex, trips],
  );

  const selectPlaceFromMap = useCallback(
    (placeId: string) => {
      setSelectedPlaceId(placeId);
      mapController.focusPlace(placeId);
    },
    [mapController],
  );

  const addDay = useCallback(() => {
    if (!activeTrip) return;
    const newDayId = makeId('day');
    const previousDay = activeTrip.days[activeTrip.days.length - 1];
    const nextDate = previousDay ? addDays(previousDay.date, 1) : activeTrip.startDate || todayIso();

    updateActiveTrip((trip) => ({
      ...trip,
      endDate: nextDate,
      days: [
        ...trip.days,
        {
          id: newDayId,
          date: nextDate,
          title: `Day ${trip.days.length + 1}`,
          destination: trip.destination,
          mode: 'mixed',
          places: [],
        },
      ],
    }));
    startTransition(() => {
      setActiveDayId(newDayId);
    });
  }, [activeTrip, updateActiveTrip]);

  const clearDay = useCallback(
    (dayId: string) => {
      const tripId = findTripIdByDayId(dayId);
      if (!tripId) return;
      updateTrip(tripId, (trip) => {
        const remainingDays = trip.days.filter((day) => day.id !== dayId);
        if (!remainingDays.length) {
          return {
            ...trip,
            days: [],
            endDate: trip.startDate || trip.endDate,
          };
        }

        const normalizedDays = relabelTripDays(remainingDays);
        return {
          ...trip,
          days: normalizedDays,
          endDate: normalizedDays[normalizedDays.length - 1]?.date || trip.endDate,
        };
      });

      if (activeDayId === dayId) {
        const trip = trips.find((entry) => entry.id === tripId);
        const remainingDays = trip?.days.filter((day) => day.id !== dayId) || [];
        startTransition(() => {
          setActiveDayId(remainingDays[0]?.id || '');
        });
      }
    },
    [activeDayId, findTripIdByDayId, trips, updateTrip],
  );

  const duplicateDay = useCallback(
    (dayId: string) => {
      const tripId = findTripIdByDayId(dayId);
      if (!tripId) return;
      const scopedTrip = trips.find((trip) => trip.id === tripId);
      if (!scopedTrip) return;
      const sourceIndex = scopedTrip.days.findIndex((day) => day.id === dayId);
      if (sourceIndex < 0) return;
      const source = scopedTrip.days[sourceIndex];
      const duplicatedId = makeId('day');
      const duplicated: TravelDay = {
        ...source,
        id: duplicatedId,
        date: addDays(source.date, 1),
        title: `${source.title || 'Day'} copy`,
        places: source.places.map((place) => ({ ...place, dayId: duplicatedId })),
      };

      updateTrip(tripId, (trip) => {
        const nextDays = [...trip.days];
        nextDays.splice(sourceIndex + 1, 0, duplicated);
        return { ...trip, days: nextDays, endDate: nextDays[nextDays.length - 1]?.date || trip.endDate };
      });

      startTransition(() => {
        if (tripId !== activeTripId) setActiveTripId(tripId);
        setActiveDayId(duplicatedId);
      });
    },
    [activeTripId, findTripIdByDayId, trips, updateTrip],
  );

  const setDayMode = useCallback(
    (dayId: string, mode: TravelDayMode) => {
      setActiveSuggestMode(mode);
      const tripId = findTripIdByDayId(dayId);
      if (!tripId) return;
      updateTrip(tripId, (trip) => ({
        ...trip,
        days: trip.days.map((day) => (day.id === dayId ? { ...day, mode } : day)),
      }));
    },
    [findTripIdByDayId, updateTrip],
  );

  const addPlaceToDay = useCallback(
    (dayId: string, placeId: string) => {
      const tripId = findTripIdByDayId(dayId);
      if (!tripId) return;
      const scopedTrip = trips.find((trip) => trip.id === tripId);
      if (!scopedTrip) return;
      const source = allPlaces.find((place) => place.id === placeId);
      if (!source) return;

      updateTrip(tripId, (trip) => ({
        ...trip,
        days: trip.days.map((day) => {
          if (day.id !== dayId) return day;
          if (day.places.some((place) => place.id === placeId)) return day;
          return { ...day, places: [...day.places, { ...source, dayId }] };
        }),
      }));

      startTransition(() => {
        if (tripId !== activeTripId) setActiveTripId(tripId);
        setActiveDayId(dayId);
      });
      setSelectedPlaceId(placeId);
      mapController.focusPlace(placeId);
    },
    [activeTripId, allPlaces, findTripIdByDayId, mapController, trips, updateTrip],
  );

  const removePlaceFromDay = useCallback(
    (dayId: string, placeId: string) => {
      const tripId = findTripIdByDayId(dayId);
      if (!tripId) return;
      updateTrip(tripId, (trip) => ({
        ...trip,
        days: trip.days.map((day) =>
          day.id === dayId ? { ...day, places: day.places.filter((place) => place.id !== placeId) } : day,
        ),
      }));
    },
    [findTripIdByDayId, updateTrip],
  );

  const toggleFavorite = useCallback((placeId: string) => {
    setTrips((prev) =>
      prev.map((trip) => ({
        ...trip,
        places: trip.places.map((place) =>
          place.id === placeId ? { ...place, isFavorite: !place.isFavorite } : place,
        ),
        days: trip.days.map((day) => ({
          ...day,
          places: day.places.map((place) =>
            place.id === placeId ? { ...place, isFavorite: !place.isFavorite } : place,
          ),
        })),
      })),
    );
  }, []);

  const addByCategory = useCallback(
    (dayId: string, category: TravelCategory) => {
      const tripId = findTripIdByDayId(dayId);
      if (!tripId) return;
      const scopedTrip = trips.find((trip) => trip.id === tripId);
      if (!scopedTrip) return;
      const day = scopedTrip.days.find((entry) => entry.id === dayId);
      if (!day) return;
      const next = scopedTrip.places.find(
        (place) => place.category === category && !day.places.some((dayPlace) => dayPlace.id === place.id),
      );
      if (!next) return;
      addPlaceToDay(dayId, next.id);
    },
    [addPlaceToDay, findTripIdByDayId, trips],
  );

  const addActivity = useCallback(
    (dayId: string) => addByCategory(dayId, 'activity'),
    [addByCategory],
  );

  const addRestaurant = useCallback(
    (dayId: string) => addByCategory(dayId, 'restaurant'),
    [addByCategory],
  );

  const addAttraction = useCallback(
    (dayId: string) => addByCategory(dayId, 'activity'),
    [addByCategory],
  );

  const suggestDay = useCallback(
    (dayId: string, mode: TravelDayMode) => {
      setActiveSuggestMode(mode);
      const tripId = findTripIdByDayId(dayId);
      if (!tripId) return;
      updateTrip(tripId, (trip) => ({
        ...trip,
        days: trip.days.map((day) =>
          day.id === dayId
            ? { ...day, mode, places: suggestPlacesForDay(trip, day, mode, 6) }
            : day,
        ),
      }));
    },
    [findTripIdByDayId, updateTrip],
  );

  const suggestItinerary = useCallback(() => {
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((day) => {
        const mode = day.mode || activeSuggestMode;
        return { ...day, mode, places: suggestPlacesForDay(trip, day, mode, 6) };
      }),
    }));
  }, [activeSuggestMode, updateActiveTrip]);

  const addFirstActivity = useCallback(() => {
    if (!activeDay) return;
    addActivity(activeDay.id);
  }, [activeDay, addActivity]);

  const updateTripSettings = useCallback(
    (partial: Partial<TravelTrip>) => {
      updateActiveTrip((trip) => ({ ...trip, ...partial }));
    },
    [updateActiveTrip],
  );

  const activeDayCost = useMemo(() => (activeDay ? calculateDayCost(activeDay) : 0), [activeDay]);

  const dayPlaceIds = useMemo(() => {
    if (!activeDay) return new Set<string>();
    return new Set(activeDay.places.map((place) => place.id));
  }, [activeDay]);

  const visibleSidebarPlaces = useMemo(() => uniquePlacesById(filteredPlaces), [filteredPlaces]);

  const favorites = useMemo(
    () => applyTravelFilters(dedupedAllPlaces.filter((place) => place.isFavorite), filters),
    [dedupedAllPlaces, filters],
  );

  return {
    trips,
    activeTrip,
    activeDay,
    activeTripId,
    activeDayId,
    selectedPlaceId,
    activeSuggestMode,
    filters,
    filterOptions,
    allPlaces: dedupedAllPlaces,
    filteredPlaces,
    visibleSidebarPlaces,
    favorites,
    dayPlaceIds,
    budget,
    activeDayCost,
    mapController,
    setActiveTripId,
    setActiveDayId,
    setTripFilter,
    setCountryFilter,
    setCityFilter,
    setCategoryFilter,
    updateTripSettings,
    selectDay,
    selectPlaceFromList,
    selectPlaceFromMap,
    addDay,
    addActivity,
    addRestaurant,
    addAttraction,
    addFirstActivity,
    addPlaceToDay,
    removePlaceFromDay,
    clearDay,
    duplicateDay,
    setDayMode,
    suggestDay,
    suggestItinerary,
    toggleFavorite,
  };
};
