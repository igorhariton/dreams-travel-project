import { useCallback, useEffect, useMemo, useState } from 'react';
import { destinations, hotels, rentals } from '../data/travelData';
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

const buildTripsFromTravelData = (): TravelTrip[] => {
  const baseStart = todayIso();

  return destinations.map((destination, index) => {
    const tripId = `trip-${destination.id}`;
    const city = destination.name;
    const country = destination.country;

    const hotelPlaces: TravelPlace[] = hotels
      .filter((hotel) => hotel.destinationId === destination.id)
      .map((hotel) => ({
        id: `place-hotel-${hotel.id}`,
        name: hotel.name,
        address: hotel.location,
        lat: destination.lat,
        lng: destination.lng,
        category: 'hotel',
        city,
        country,
        tripId,
        price: hotel.pricePerNight,
        isFavorite: false,
      }));

    const rentalPlaces: TravelPlace[] = rentals
      .filter((rental) => rental.destinationId === destination.id)
      .map((rental) => ({
        id: `place-rental-${rental.id}`,
        name: rental.name,
        address: rental.location,
        lat: destination.lat,
        lng: destination.lng,
        category: 'rental',
        city,
        country,
        tripId,
        price: rental.pricePerNight,
        isFavorite: false,
      }));

    const activityPlaces: TravelPlace[] = destination.mustVisit.map((name, nameIndex) => ({
      id: `place-activity-${destination.id}-${nameIndex}`,
      name,
      address: `${name}, ${city}, ${country}`,
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
  const seededTrips = useMemo(() => buildTripsFromTravelData(), []);
  const defaultTrip = seededTrips.find((trip) => trip.id === 'trip-santorini') || seededTrips[0];
  const defaultDay = defaultTrip?.days[0];

  const [trips, setTrips] = useState<TravelTrip[]>(seededTrips);
  const [activeTripId, setActiveTripId] = useState(defaultTrip?.id || '');
  const [activeDayId, setActiveDayId] = useState(defaultDay?.id || '');
  const [filters, setFilters] = useState<TravelFilters>({
    ...DEFAULT_FILTERS,
    tripId: defaultTrip?.id || 'all',
    country: defaultTrip?.country || 'all',
    city: defaultTrip?.destination || 'all',
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
        index.set(place.id, trip.id);
      });
    });
    return index;
  }, [trips]);
  const filteredPlaces = useMemo(() => applyTravelFilters(allPlaces, filters), [allPlaces, filters]);
  const filterOptions = useMemo(() => buildTravelFilterOptions(trips, allPlaces, filters), [trips, allPlaces, filters]);
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
      setFilters((prev) => ({
        ...prev,
        tripId,
        country: scopedTrip?.country || 'all',
        city: scopedTrip?.destination || 'all',
      }));

      if (!scopedTrip) return;
      setActiveTripId(scopedTrip.id);
      setActiveDayId(scopedTrip.days[0]?.id || '');
    },
    [trips],
  );

  const setCountryFilter = useCallback((country: string) => {
    setFilters((prev) => ({ ...prev, country, city: 'all' }));
  }, []);

  const setCityFilter = useCallback((city: string) => {
    setFilters((prev) => ({ ...prev, city }));
  }, []);

  const setCategoryFilter = useCallback((category: TravelFilters['category']) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const selectDay = useCallback(
    (dayId: string) => {
      const tripId = findTripIdByDayId(dayId);
      if (tripId && tripId !== activeTripId) {
        setActiveTripId(tripId);
      }
      setActiveDayId(dayId);
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
      if (tripId && tripId !== activeTripId) setActiveTripId(tripId);
      const dayWithPlace = scopedTrip.days.find((day) => day.places.some((place) => place.id === placeId));
      if (dayWithPlace) setActiveDayId(dayWithPlace.id);
    },
    [activeTripId, mapController, placeTripIndex, trips],
  );

  const selectPlaceFromMap = useCallback(
    (placeId: string) => {
      setSelectedPlaceId(placeId);
      const tripId = placeTripIndex.get(placeId) || activeTripId;
      const scopedTrip = trips.find((trip) => trip.id === tripId);
      if (!scopedTrip) return;
      if (tripId && tripId !== activeTripId) setActiveTripId(tripId);
      const dayWithPlace = scopedTrip.days.find((day) => day.places.some((place) => place.id === placeId));
      if (dayWithPlace) setActiveDayId(dayWithPlace.id);
    },
    [activeTripId, placeTripIndex, trips],
  );

  const addDay = useCallback(() => {
    if (!activeTrip) return;
    const newDayId = makeId('day');
    const previousDay = activeTrip.days[activeTrip.days.length - 1];
    const nextDate = addDays(previousDay?.date || activeTrip.startDate || todayIso(), 1);

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
    setActiveDayId(newDayId);
  }, [activeTrip, updateActiveTrip]);

  const clearDay = useCallback(
    (dayId: string) => {
      const tripId = findTripIdByDayId(dayId);
      if (!tripId) return;
      updateTrip(tripId, (trip) => ({
        ...trip,
        days: trip.days.map((day) => (day.id === dayId ? { ...day, places: [] } : day)),
      }));
    },
    [findTripIdByDayId, updateTrip],
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

      if (tripId !== activeTripId) setActiveTripId(tripId);
      setActiveDayId(duplicatedId);
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

      if (tripId !== activeTripId) setActiveTripId(tripId);
      setActiveDayId(dayId);
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

  const visibleSidebarPlaces = useMemo(() => {
    return filteredPlaces;
  }, [filteredPlaces]);

  const favorites = useMemo(
    () => applyTravelFilters(allPlaces.filter((place) => place.isFavorite), filters),
    [allPlaces, filters],
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
    allPlaces,
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
