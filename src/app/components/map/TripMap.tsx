import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import { useApp, useTheme } from '../../context/AppContext';
import type { TravelCategory, TravelLayerType, TravelMapLocation, TravelPlace } from '../../types/travel';
import { TRAVEL_CATEGORY_LABEL, TRAVEL_COLORS } from '../../types/travel';

type TripMapProps = {
  places: TravelPlace[];
  selectedPlaceId: string | null;
  focusedPlaceId: string | null;
  focusNonce: number;
  onPlaceSelect: (placeId: string) => void;
  height?: number | string;
  isLoading?: boolean;
  sizeInvalidateKey?: string | number | boolean;
};

const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180],
];

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const SINGLE_PLACE_ZOOM: Record<TravelCategory, number> = {
  hotel: 11,
  rental: 11,
  activity: 10,
  restaurant: 12,
  stop: 10,
};

const TRIP_OVERLAP_DISTANCE_KM = 0.08;
const TRIP_OVERLAP_BASE_METERS = 34;
const TRIP_OVERLAP_RING_STEP_METERS = 18;
const TRIP_OVERLAP_MAX_METERS = 110;
const TRIP_OVERLAP_SPREAD_LIMIT = 120;
const TRIP_CATEGORY_PRIORITY: Record<TravelCategory, number> = {
  hotel: 0,
  rental: 1,
  activity: 2,
  restaurant: 3,
  stop: 4,
};

const validCoords = (place: TravelPlace) =>
  Number.isFinite(place.lat) &&
  Number.isFinite(place.lng) &&
  place.lat >= -90 &&
  place.lat <= 90 &&
  place.lng >= -180 &&
  place.lng <= 180;

const coordinateOffsetMeters = (lat: number, lng: number, distanceMeters: number, bearingDegrees: number) => {
  const EARTH_RADIUS_METERS = 6_371_000;
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const resultLat = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing),
  );

  const resultLng =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(resultLat),
    );

  return {
    lat: (resultLat * 180) / Math.PI,
    lng: (resultLng * 180) / Math.PI,
  };
};

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLng = toRad(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
};

const spreadOverlappingTripPlaces = (places: TravelPlace[]) => {
  if (places.length < 2) return places;
  if (places.length > TRIP_OVERLAP_SPREAD_LIMIT) return places;

  const working = places.map((place) => ({ ...place }));
  const clusters: TravelPlace[][] = [];
  const visited = new Set<number>();

  for (let index = 0; index < working.length; index += 1) {
    if (visited.has(index)) continue;

    const queue = [index];
    const groupIndexes = [index];
    visited.add(index);

    while (queue.length) {
      const currentIndex = queue.shift()!;
      const current = working[currentIndex];

      for (let candidateIndex = 0; candidateIndex < working.length; candidateIndex += 1) {
        if (visited.has(candidateIndex)) continue;
        const candidate = working[candidateIndex];
        const distance = haversineKm(current.lat, current.lng, candidate.lat, candidate.lng);
        if (distance > TRIP_OVERLAP_DISTANCE_KM) continue;

        visited.add(candidateIndex);
        queue.push(candidateIndex);
        groupIndexes.push(candidateIndex);
      }
    }

    clusters.push(groupIndexes.map((groupIndex) => working[groupIndex]));
  }

  for (const cluster of clusters) {
    if (cluster.length <= 1) continue;

    const orderedCluster = [...cluster].sort((left, right) => {
      const priorityDelta = TRIP_CATEGORY_PRIORITY[left.category] - TRIP_CATEGORY_PRIORITY[right.category];
      if (priorityDelta !== 0) return priorityDelta;
      return left.id.localeCompare(right.id);
    });

    const centerLat = orderedCluster.reduce((sum, place) => sum + place.lat, 0) / orderedCluster.length;
    const centerLng = orderedCluster.reduce((sum, place) => sum + place.lng, 0) / orderedCluster.length;

    for (let ring = 0; ring < Math.ceil(orderedCluster.length / 8); ring += 1) {
      const ringPlaces = orderedCluster.slice(ring * 8, ring * 8 + 8);
      const bearingStep = 360 / ringPlaces.length;
      const distanceMeters = Math.min(TRIP_OVERLAP_BASE_METERS + ring * TRIP_OVERLAP_RING_STEP_METERS, TRIP_OVERLAP_MAX_METERS);

      ringPlaces.forEach((place, index) => {
        const offset = coordinateOffsetMeters(centerLat, centerLng, distanceMeters, index * bearingStep + ring * 22.5);
        place.lat = offset.lat;
        place.lng = offset.lng;
      });
    }
  }

  return working;
};

const markerIconCache = new Map<string, L.DivIcon>();
const TRIP_MAP_CLUSTER_ICON = L.divIcon({
  html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:linear-gradient(135deg,${TRAVEL_COLORS.blue},${TRAVEL_COLORS.cyan});border:3px solid #ffffff;box-shadow:0 4px 12px rgba(37,99,235,0.35)"></span>`,
  className: 'planner-map-cluster',
  iconSize: [24, 24],
});

const markerIcon = (category: TravelCategory, selected: boolean) => {
  const key = `${category}-${selected ? 'selected' : 'default'}`;
  const cached = markerIconCache.get(key);
  if (cached) return cached;

  const dotSize = selected ? 18 : 15;
  const dotBorder = selected ? 4 : 3;
  const iconSize = dotSize + dotBorder * 2;
  const icon = L.divIcon({
    className: 'planner-map-marker',
    html: `<span style="display:block;width:${dotSize}px;height:${dotSize}px;border-radius:999px;background:${TRAVEL_COLORS.category[category]};border:${dotBorder}px solid #ffffff;box-shadow:0 2px 10px rgba(15,23,42,0.35)"></span>`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [Math.round(iconSize / 2), Math.round(iconSize / 2)],
    popupAnchor: [0, -Math.round(iconSize / 2)],
  });
  markerIconCache.set(key, icon);
  return icon;
};

type TripPlaceMarkerProps = {
  place: TravelPlace;
  selected: boolean;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
  onPlaceSelect: (placeId: string) => void;
  formatPrice: (price?: number) => string;
  t: (key: string) => string;
};

const TripPlaceMarker = React.memo(function TripPlaceMarker({
  place,
  selected,
  markerRefs,
  onPlaceSelect,
  formatPrice,
  t,
}: TripPlaceMarkerProps) {
  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={markerIcon(place.category, selected)}
      ref={(ref) => {
        if (ref) markerRefs.current[place.id] = ref;
        else delete markerRefs.current[place.id];
      }}
      eventHandlers={{
        click: (event) => {
          onPlaceSelect(place.id);
          event.target.openPopup();
        },
      }}
    >
      <Popup>
        <div className="min-w-[260px] text-slate-800">
          {place.imageUrl && (
            <img
              src={place.imageUrl}
              alt={place.name}
              className="mb-2 h-24 w-full rounded-lg object-cover"
              loading="lazy"
            />
          )}
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                {t(`planner.category.${place.category}`)}
              </span>
              {(place.price || place.rating) && (
                <div className="flex items-center gap-2 text-xs">
                  {place.price ? <span className="font-semibold text-slate-800">{formatPrice(place.price)}</span> : null}
                  {place.rating ? <span className="font-semibold text-amber-600">★ {place.rating.toFixed(1)}</span> : null}
                </div>
              )}
            </div>
            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-2 gap-y-1 text-[11px] leading-5">
              <span className="font-semibold text-slate-500">Name</span>
              <span className="font-semibold text-slate-900">{place.name}</span>
              <span className="font-semibold text-slate-500">Location</span>
              <span className="text-slate-700">{place.address || t('planner.unknown_address')}</span>
              <span className="font-semibold text-slate-500">City</span>
              <span className="text-slate-700">{place.city || t('planner.na')}</span>
              <span className="font-semibold text-slate-500">Country</span>
              <span className="text-slate-700">{place.country || t('planner.na')}</span>
              <span className="font-semibold text-slate-500">Description</span>
              <span className="text-slate-700">{place.description || t('planner.na')}</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

function SyncMapSize({ sizeInvalidateKey }: { sizeInvalidateKey?: string | number | boolean }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [map, sizeInvalidateKey]);

  return null;
}

function FitBounds({ places, boundsKey }: { places: TravelPlace[]; boundsKey: string }) {
  const map = useMap();

  useEffect(() => {
    if (!places.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
      return;
    }
    if (places.length === 1) {
      const place = places[0];
      map.setView([place.lat, place.lng], SINGLE_PLACE_ZOOM[place.category] ?? 10, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.22), { animate: true, maxZoom: 14 });
  }, [boundsKey, map]);

  return null;
}

function FocusPlace({
  places,
  focusedPlaceId,
  focusNonce,
  markerRefs,
}: {
  places: TravelPlace[];
  focusedPlaceId: string | null;
  focusNonce: number;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusedPlaceId) return;
    const target = places.find((place) => place.id === focusedPlaceId);
    if (!target) return;

    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 10), { animate: true, duration: 0.8 });
    const marker = markerRefs.current[focusedPlaceId];
    if (marker) marker.openPopup();
  }, [focusedPlaceId, focusNonce, places, markerRefs, map]);

  return null;
}

export function TripMap({
  places,
  selectedPlaceId,
  focusedPlaceId,
  focusNonce,
  onPlaceSelect,
  height = 330,
  isLoading = false,
  sizeInvalidateKey,
}: TripMapProps) {
  const { theme, t, formatPrice } = useApp();
  const isDark = theme === 'dark';
  const deferredPlaces = useDeferredValue(places);
  const displayPlacesKey = useMemo(
    () =>
      deferredPlaces
        .filter(validCoords)
        .map((place) => `${place.id}:${place.category}:${place.lat.toFixed(5)}:${place.lng.toFixed(5)}`)
        .join('|'),
    [deferredPlaces],
  );
  const displayPlaces = useMemo(
    () => spreadOverlappingTripPlaces(deferredPlaces.filter(validCoords)),
    [displayPlacesKey],
  );
  const boundsKey = useMemo(
    () => displayPlaces.map((place) => `${place.id}:${place.lat.toFixed(5)}:${place.lng.toFixed(5)}`).join('|'),
    [displayPlaces],
  );
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const tileUrl = LIGHT_TILE_URL;
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const tileSubdomains = ['a', 'b', 'c'] as const;

  if (isLoading) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border border-dashed text-sm ${
          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-500'
        }`}
        style={{ borderColor: isDark ? '#475569' : TRAVEL_COLORS.border, minHeight: height }}
      >
        {t('planner.loading_map_locations')}
      </div>
    );
  }

  if (!displayPlaces.length) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border border-dashed text-sm ${
          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-500'
        }`}
        style={{ borderColor: isDark ? '#475569' : TRAVEL_COLORS.border, minHeight: height }}
      >
        {t('planner.no_valid_locations')}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${isDark ? 'bg-slate-800' : 'bg-white'}`}
      style={{ borderColor: isDark ? '#475569' : TRAVEL_COLORS.border }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        scrollWheelZoom
        style={{ width: '100%', height }}
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          subdomains={[...tileSubdomains]}
          detectRetina
          noWrap={true}
        />

        <SyncMapSize sizeInvalidateKey={sizeInvalidateKey} />
        <FitBounds places={displayPlaces} boundsKey={boundsKey} />
        <FocusPlace
          places={displayPlaces}
          focusedPlaceId={focusedPlaceId}
          focusNonce={focusNonce}
          markerRefs={markerRefs}
        />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={55}
          showCoverageOnHover={false}
          removeOutsideVisibleBounds
          iconCreateFunction={() => TRIP_MAP_CLUSTER_ICON}
        >
          {displayPlaces.map((place) => (
            <TripPlaceMarker
              key={place.id}
              place={place}
              selected={selectedPlaceId === place.id}
              markerRefs={markerRefs}
              onPlaceSelect={onPlaceSelect}
              formatPrice={formatPrice}
              t={t}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

type TravelLayersMapProps = {
  locations: TravelMapLocation[];
  selectedDestinationId?: string | null;
  height?: number;
  initialFilters?: Partial<Record<TravelLayerType, boolean>>;
  sizeInvalidateKey?: string | number | boolean;
  onViewDetails?: (locationId: string) => void;
  onExploreHotels?: () => void;
  showExploreCta?: boolean;
  showHeatmap?: boolean;
  singleLocationMode?: boolean;
  singleLocationZoom?: number;
  forceTheme?: 'light' | 'dark';
};

type NormalizedTravelMapLocation = TravelMapLocation & {
  lat: number;
  lng: number;
  isApproximate: boolean;
  overlapCount?: number;
};

type CoordinateReference = {
  lat: number;
  lng: number;
  reason: string;
  maxDistanceKm?: number;
};

const LIGHT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const MALDIVES_MAIN_REFERENCE = { lat: 4.1755, lng: 73.5093 };
const COORDINATE_WARNING_CACHE = new Set<string>();
const GENERIC_LOCATION_NAMES = new Set(['destination', 'hotel', 'rental']);
const TRAVEL_MAP_DEBUG = Boolean((globalThis as typeof globalThis & { __TRAVEL_MAP_DEBUG__?: boolean }).__TRAVEL_MAP_DEBUG__);

const debugTravelMap = (message: string, payload: unknown) => {
  console.info(`[travel-map] ${message}`, payload);
};

const serializeDebugLocation = (
  location: Pick<TravelMapLocation, 'id' | 'type' | 'name' | 'lat' | 'lng' | 'country' | 'isApproximate'>,
) => {
  const lat = Number(location.lat);
  const lng = Number(location.lng);

  return {
    id: location.id,
    type: location.type,
    name: location.name,
    lat: Number.isFinite(lat) ? Number(lat.toFixed(6)) : lat,
    lng: Number.isFinite(lng) ? Number(lng.toFixed(6)) : lng,
    country: location.country,
    isApproximate: Boolean(location.isApproximate),
  };
};

const DEFAULT_LAYER_FILTERS: Record<TravelLayerType, boolean> = {
  destination: true,
  hotel: true,
  rental: true,
};

const LAYER_META: Record<
  TravelLayerType,
  {
    label: string;
    shortLabel: string;
    gradient: [string, string];
    accent: string;
    glyph: string;
    cta: string;
  }
> = {
  destination: {
    label: 'Destinations',
    shortLabel: 'D',
    gradient: ['#1D4ED8', '#06B6D4'],
    accent: '#2563EB',
    glyph:
      '<path d="M12 6.6l2 3.7 3.9 1.9-3.9 1.9-2 3.7-2-3.7-3.9-1.9 3.9-1.9z" fill="#0F172A"/><circle cx="12" cy="12.1" r="2.1" fill="#2563EB"/>',
    cta: 'View Destination',
  },
  hotel: {
    label: 'Hotels',
    shortLabel: 'H',
    gradient: ['#0EA5E9', '#3B82F6'],
    accent: '#0EA5E9',
    glyph:
      '<rect x="8" y="6.9" width="8" height="10.8" rx="1.5" fill="#0F172A"/><rect x="9.5" y="8.6" width="1.4" height="1.5" rx="0.4" fill="#FFFFFF"/><rect x="11.3" y="8.6" width="1.4" height="1.5" rx="0.4" fill="#FFFFFF"/><rect x="13.1" y="8.6" width="1.4" height="1.5" rx="0.4" fill="#FFFFFF"/><rect x="9.5" y="10.7" width="1.4" height="1.5" rx="0.4" fill="#FFFFFF"/><rect x="11.3" y="10.7" width="1.4" height="1.5" rx="0.4" fill="#FFFFFF"/><rect x="13.1" y="10.7" width="1.4" height="1.5" rx="0.4" fill="#FFFFFF"/><rect x="11" y="13.1" width="2" height="4.5" rx="0.5" fill="#FFFFFF"/>',
    cta: 'View Hotel',
  },
  rental: {
    label: 'Rentals',
    shortLabel: 'R',
    gradient: ['#06B6D4', '#10B981'],
    accent: '#06B6D4',
    glyph:
      '<path d="M12 7.2l5.5 4.3h-1.6v6.1h-3.4v-3h-1.1v3H8v-6.1H6.5z" fill="#0F172A"/><path d="M9.3 14h1.8v1.8H9.3z" fill="#FFFFFF"/>',
    cta: 'View Rental',
  },
};

const MALDIVES_LOCATION_REFERENCES: Array<{
  pattern: RegExp;
  lat: number;
  lng: number;
  reason: string;
  maxDistanceKm: number;
}> = [
  {
    pattern: /feydhoo|addu/i,
    lat: -0.682603,
    lng: 73.135077,
    reason: 'feydhoo-island-center',
    maxDistanceKm: 0.8,
  },
  {
    pattern: /north\s*mal[ée]\s*atoll|kaafu\s*atoll|hulhumale/i,
    lat: 4.220862,
    lng: 73.542525,
    reason: 'hulhumale-island-center',
    maxDistanceKm: 3.5,
  },
  {
    pattern: /\bmal[ée]\b/i,
    lat: 4.1755,
    lng: 73.5093,
    reason: 'male-island-center',
    maxDistanceKm: 2.5,
  },
  {
    pattern: /gulhi/i,
    lat: 3.990976,
    lng: 73.509239,
    reason: 'gulhi-island-center',
    maxDistanceKm: 0.9,
  },
  {
    pattern: /south\s*mal[ée]\s*atoll|maafushi/i,
    lat: 3.941157,
    lng: 73.489928,
    reason: 'maafushi-island-center',
    maxDistanceKm: 1.5,
  },
  {
    pattern: /ari\s*atoll|alif/i,
    lat: 4.262992,
    lng: 72.991746,
    reason: 'ari-reference-island-center',
    maxDistanceKm: 40,
  },
  {
    pattern: /baa\s*atoll/i,
    lat: 5.1035,
    lng: 73.0713,
    reason: 'baa-reference-island-center',
    maxDistanceKm: 25,
  },
];

const MALDIVES_SAFE_BOUNDS = {
  minLat: -0.7,
  maxLat: 8.8,
  minLng: 71.6,
  maxLng: 75.7,
};

const SINGLE_MARKER_FALLBACK_ZOOM = 14;
const FIT_BOUNDS_MAX_ZOOM = 16;
const FIT_BOUNDS_PADDING: L.PointExpression = [56, 56];
const OVERLAP_DISTANCE_KM = 0.06;
const OVERLAP_OFFSET_BASE_METERS = 8;
const OVERLAP_OFFSET_RING_STEP_METERS = 6;
const MAX_MALDIVES_DESTINATION_DISTANCE_KM = 1200;
const MAX_MALDIVES_LISTING_DISTANCE_KM = 1400;

export const isValidCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

export const isValidCoordinatePair = isValidCoordinate;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const isMaldivesLocation = (location: TravelMapLocation) => {
  const text = `${location.name} ${location.country || ''} ${location.description || ''}`.toLowerCase();
  return text.includes('maldives') || slugify(location.id).includes('maldives');
};

const isInMaldivesSafeBounds = (lat: number, lng: number) =>
  lat >= MALDIVES_SAFE_BOUNDS.minLat &&
  lat <= MALDIVES_SAFE_BOUNDS.maxLat &&
  lng >= MALDIVES_SAFE_BOUNDS.minLng &&
  lng <= MALDIVES_SAFE_BOUNDS.maxLng;

const logCoordinateWarning = (id: string, message: string, location: TravelMapLocation) => {
  const key = `${id}:${message}`;
  if (COORDINATE_WARNING_CACHE.has(key)) return;
  COORDINATE_WARNING_CACHE.add(key);
  console.warn(`[travel-map] ${message}`, {
    id: location.id,
    type: location.type,
    name: location.name,
    lat: location.lat,
    lng: location.lng,
    country: location.country,
  });
};

const addReferenceKey = (store: Map<string, CoordinateReference>, key: string, reference: CoordinateReference) => {
  if (!key) return;
  if (!store.has(key)) {
    store.set(key, reference);
  }
};

const resolveReferenceByText = (location: TravelMapLocation): CoordinateReference | null => {
  if (!isMaldivesLocation(location)) return null;

  const searchable = `${location.name} ${location.description || ''} ${location.country || ''}`;
  for (const reference of MALDIVES_LOCATION_REFERENCES) {
    if (reference.pattern.test(searchable)) {
      return {
        lat: reference.lat,
        lng: reference.lng,
        reason: reference.reason,
        maxDistanceKm: reference.maxDistanceKm,
      };
    }
  }

  return { lat: MALDIVES_MAIN_REFERENCE.lat, lng: MALDIVES_MAIN_REFERENCE.lng, reason: 'maldives-main-reference' };
};

type SwapDetectionResult = {
  shouldSwap: boolean;
  confidence: number;
  reason: string;
};

export const detectSwappedLatLng = (
  lat: number,
  lng: number,
  options: { location?: TravelMapLocation; reference?: CoordinateReference | null } = {},
): SwapDetectionResult => {
  const swappedLat = lng;
  const swappedLng = lat;
  const currentValid = isValidCoordinate(lat, lng);
  const swappedValid = isValidCoordinate(swappedLat, swappedLng);

  if (!currentValid && swappedValid) {
    return {
      shouldSwap: true,
      confidence: 1,
      reason: 'invalid-coordinate-swapped-valid',
    };
  }

  if (!currentValid || !swappedValid) {
    return {
      shouldSwap: false,
      confidence: 0,
      reason: 'swap-not-applicable',
    };
  }

  const location = options.location;
  const reference = options.reference || null;

  if (location && isMaldivesLocation(location)) {
    const currentInBounds = isInMaldivesSafeBounds(lat, lng);
    const swappedInBounds = isInMaldivesSafeBounds(swappedLat, swappedLng);
    if (!currentInBounds && swappedInBounds) {
      return {
        shouldSwap: true,
        confidence: 0.98,
        reason: 'maldives-bounds-swap',
      };
    }
  }

  if (reference) {
    const distanceCurrent = haversineKm(lat, lng, reference.lat, reference.lng);
    const distanceSwapped = haversineKm(swappedLat, swappedLng, reference.lat, reference.lng);
    if (distanceSwapped + 12 < distanceCurrent * 0.35 && distanceSwapped < 900) {
      return {
        shouldSwap: true,
        confidence: 0.93,
        reason: 'reference-distance-swap',
      };
    }
  }

  return {
    shouldSwap: false,
    confidence: 0,
    reason: 'no-strong-swap-signal',
  };
};

const isSuspiciousCoordinate = (
  location: TravelMapLocation,
  lat: number,
  lng: number,
  reference: CoordinateReference | null,
) => {
  if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) return 'near-null-island';
  if (!isMaldivesLocation(location)) return null;
  if (!isInMaldivesSafeBounds(lat, lng)) return 'outside-maldives-bounds';

  if (reference) {
    const distance = haversineKm(lat, lng, reference.lat, reference.lng);
    if (distance > (location.type === 'destination' ? MAX_MALDIVES_DESTINATION_DISTANCE_KM : MAX_MALDIVES_LISTING_DISTANCE_KM)) {
      return `too-far-from-reference-${Math.round(distance)}km`;
    }
  }

  return null;
};

const spreadOverlappingPoints = (locations: NormalizedTravelMapLocation[]) => {
  const clusters: NormalizedTravelMapLocation[][] = [];
  const visited = new Set<number>();

  for (let index = 0; index < locations.length; index += 1) {
    if (visited.has(index)) continue;

    const queue = [index];
    const groupIndexes = [index];
    visited.add(index);

    while (queue.length) {
      const currentIndex = queue.shift()!;
      const current = locations[currentIndex];

      for (let candidateIndex = 0; candidateIndex < locations.length; candidateIndex += 1) {
        if (visited.has(candidateIndex)) continue;
        const candidate = locations[candidateIndex];
        const distance = haversineKm(current.lat, current.lng, candidate.lat, candidate.lng);
        if (distance > OVERLAP_DISTANCE_KM) continue;

        visited.add(candidateIndex);
        queue.push(candidateIndex);
        groupIndexes.push(candidateIndex);
      }
    }

    clusters.push(groupIndexes.map((groupIndex) => locations[groupIndex]));
  }

  for (const cluster of clusters) {
    if (cluster.length <= 1) continue;

    const orderedCluster = [...cluster].sort((left, right) => {
      if (left.type === right.type) return left.id.localeCompare(right.id);
      if (left.type === 'destination') return -1;
      if (right.type === 'destination') return 1;
      return left.type.localeCompare(right.type);
    });

    const anchor = orderedCluster.find((location) => location.type === 'destination') || orderedCluster[0];
    let offsetIndex = 0;

    for (const location of orderedCluster) {
      if (location.id === anchor.id) continue;

      const ring = Math.floor(offsetIndex / 8);
      const baseDistanceMeters = OVERLAP_OFFSET_BASE_METERS + ring * OVERLAP_OFFSET_RING_STEP_METERS;
      const maxDistanceMeters = isMaldivesLocation(location) ? 18 : 28;
      const distanceMeters = Math.min(baseDistanceMeters, maxDistanceMeters);
      const bearing = (offsetIndex % 8) * 45;
      const offset = coordinateOffsetMeters(anchor.lat, anchor.lng, distanceMeters, bearing);
      location.lat = offset.lat;
      location.lng = offset.lng;
      location.overlapCount = orderedCluster.length;
      location.isApproximate = true;
      offsetIndex += 1;
    }
  }

  return locations;
};

const buildDestinationReferenceMap = (locations: TravelMapLocation[]) => {
  const references = new Map<string, CoordinateReference>();

  for (const location of locations) {
    if (location.type !== 'destination') continue;

    let lat = Number(location.lat);
    let lng = Number(location.lng);
    const textReference = resolveReferenceByText(location);
    const swapDetection = detectSwappedLatLng(lat, lng, { location, reference: textReference });

    if (swapDetection.shouldSwap) {
      [lat, lng] = [lng, lat];
    }

    if (!isValidCoordinate(lat, lng)) {
      if (!textReference) continue;
      lat = textReference.lat;
      lng = textReference.lng;
    }

    const reference: CoordinateReference = {
      lat,
      lng,
      reason: 'destination-reference',
    };

    addReferenceKey(references, slugify(location.id), reference);
    addReferenceKey(references, slugify(location.id.split(':').pop() || ''), reference);
    addReferenceKey(references, slugify(location.name), reference);
    addReferenceKey(references, slugify(location.country || ''), reference);
  }

  return references;
};

const getLocationReference = (
  location: TravelMapLocation,
  destinationReferences: Map<string, CoordinateReference>,
): CoordinateReference | null => {
  const textReference = resolveReferenceByText(location);
  if (textReference && isMaldivesLocation(location)) {
    return textReference;
  }

  const referenceByCountry = destinationReferences.get(slugify(location.country || ''));
  const referenceByName = destinationReferences.get(slugify(location.name));
  const referenceById = destinationReferences.get(slugify(location.id));
  return referenceById || referenceByCountry || referenceByName || textReference || null;
};

type NormalizeLocationContext = {
  destinationReferences: Map<string, CoordinateReference>;
};

export const normalizeLocation = (
  location: TravelMapLocation,
  context: NormalizeLocationContext,
): NormalizedTravelMapLocation | null => {
  let lat = Number(location.lat);
  let lng = Number(location.lng);
  let isApproximate = Boolean(location.isApproximate);

  const reference = getLocationReference(location, context.destinationReferences);
  const swapDetection = detectSwappedLatLng(lat, lng, { location, reference });

  if (swapDetection.shouldSwap) {
    [lat, lng] = [lng, lat];
    logCoordinateWarning(location.id, `swapped-lat-lng-corrected:${swapDetection.reason}`, location);
  }

  if (!isValidCoordinate(lat, lng)) {
    logCoordinateWarning(location.id, 'invalid-coordinate-rejected', location);
    return null;
  }

  const suspiciousReason = isSuspiciousCoordinate(location, lat, lng, reference);
  if (suspiciousReason && reference) {
    lat = reference.lat;
    lng = reference.lng;
    isApproximate = true;
    logCoordinateWarning(location.id, `suspicious-coordinate-corrected:${suspiciousReason}`, location);
  } else if (suspiciousReason) {
    logCoordinateWarning(location.id, `suspicious-coordinate:${suspiciousReason}`, location);
  }

  if (location.type !== 'destination' && reference) {
    const listingDistance = haversineKm(lat, lng, reference.lat, reference.lng);
    const maxListingDistance = isMaldivesLocation(location) ? MAX_MALDIVES_LISTING_DISTANCE_KM : 1800;
    if (listingDistance > maxListingDistance) {
      lat = reference.lat;
      lng = reference.lng;
      isApproximate = true;
      logCoordinateWarning(location.id, 'listing-too-far-from-destination-fallback', location);
    }
  }

  if (reference?.maxDistanceKm && isMaldivesLocation(location)) {
    const distanceFromIslandCenter = haversineKm(lat, lng, reference.lat, reference.lng);
    if (distanceFromIslandCenter > reference.maxDistanceKm) {
      lat = reference.lat;
      lng = reference.lng;
      isApproximate = true;
      logCoordinateWarning(location.id, `snapped-to-maldives-island-center:${reference.reason}`, location);
    }
  }

  if (location.type === 'destination' && isMaldivesLocation(location) && !isInMaldivesSafeBounds(lat, lng)) {
    lat = MALDIVES_MAIN_REFERENCE.lat;
    lng = MALDIVES_MAIN_REFERENCE.lng;
    isApproximate = true;
    logCoordinateWarning(location.id, 'destination-reset-to-maldives-reference', location);
  }

  return {
    ...location,
    lat,
    lng,
    isApproximate,
  };
};

export const normalizeTravelMapLocations = (locations: TravelMapLocation[]): NormalizedTravelMapLocation[] => {
  // Normalize all incoming data before Leaflet render so invalid/suspicious points never reach marker creation.
  if (TRAVEL_MAP_DEBUG) {
    debugTravelMap('input-locations', locations.map(serializeDebugLocation));
  }

  const destinationReferences = buildDestinationReferenceMap(locations);
  const normalized = locations
    .map((location) => normalizeLocation(location, { destinationReferences }))
    .filter((location): location is NormalizedTravelMapLocation => Boolean(location));

  const spreadLocations = spreadOverlappingPoints(normalized);

  if (TRAVEL_MAP_DEBUG) {
    debugTravelMap(
      'normalized-locations',
      spreadLocations.map((location) => ({
        ...serializeDebugLocation(location),
        overlapCount: location.overlapCount ?? 1,
      })),
    );
  }

  return spreadLocations;
};

const formatShortPrice = (price?: number) => {
  if (!Number.isFinite(price)) return null;
  return `$${Math.round(Number(price))}`;
};

const formatRating = (rating?: number) => (Number.isFinite(rating) ? Number(rating).toFixed(1) : null);

const getLocationDisplayName = (location: Pick<NormalizedTravelMapLocation, 'id' | 'name' | 'country'>) => {
  const rawName = (location.name || '').trim();
  const normalizedName = slugify(rawName);

  if (rawName && !GENERIC_LOCATION_NAMES.has(normalizedName)) {
    return rawName;
  }

  const country = (location.country || '').trim();
  if (country && slugify(country) !== normalizedName) {
    return country;
  }

  const idCandidate = location.id.split(':').slice(1).join(' ').replace(/[-_]+/g, ' ').trim();
  return idCandidate || rawName || 'Location';
};

const premiumMarkerIconCache = new Map<string, L.DivIcon>();
export const createCustomIcon = (layer: TravelLayerType, active: boolean, approximate: boolean) => {
  const key = `${layer}-${active ? 'active' : 'idle'}-${approximate ? 'approx' : 'exact'}`;
  const cached = premiumMarkerIconCache.get(key);
  if (cached) return cached;

  const layerMeta = LAYER_META[layer];
  const size = active ? 60 : 52;
  const icon = L.divIcon({
    className: 'travel-premium-map-icon',
    html: `
      <div class="travel-premium-marker-wrapper ${active ? 'is-active' : ''}" data-layer="${layer}" data-approximate="${approximate ? '1' : '0'}" style="position:relative;width:${size}px;height:${size + 14}px;transform:translateZ(0);">
        <svg width="${size}" height="${size + 14}" viewBox="0 0 44 58" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-${key}" x1="6" y1="6" x2="36" y2="44" gradientUnits="userSpaceOnUse">
              <stop stop-color="${layerMeta.gradient[0]}" />
              <stop offset="1" stop-color="${layerMeta.gradient[1]}" />
            </linearGradient>
          </defs>
          <path d="M22 2.5C12.885 2.5 5.5 9.885 5.5 19C5.5 31.84 20.304 47.541 21.306 48.589C21.691 48.991 22.309 48.991 22.694 48.589C23.696 47.541 38.5 31.84 38.5 19C38.5 9.885 31.115 2.5 22 2.5Z" fill="url(#grad-${key})" stroke="white" stroke-width="2.6"/>
          <circle cx="22" cy="18.8" r="8.9" fill="white" />
          <g transform="translate(10 7)">${layerMeta.glyph}</g>
          ${
            approximate
              ? '<circle cx="33.5" cy="11.5" r="5.2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.4"/><text x="33.5" y="13.6" text-anchor="middle" font-size="6.7" font-family="system-ui,-apple-system,sans-serif" font-weight="800" fill="#334155">~</text>'
              : ''
          }
          ${
            active
              ? '<circle cx="22" cy="19" r="15" stroke="#BFDBFE" stroke-width="2.2" fill="none" opacity="0.9" />'
              : ''
          }
        </svg>
      </div>
    `,
    iconSize: [size, size + 14],
    iconAnchor: [size / 2, size + 2],
    popupAnchor: [0, -(size - 2)],
  });
  premiumMarkerIconCache.set(key, icon);
  return icon;
};

const createClusterIcon = () =>
  L.divIcon({
    className: 'travel-premium-cluster',
    html: `
      <div class="travel-premium-cluster-badge" aria-hidden="true"></div>
    `,
    iconSize: [32, 32],
  });

export const getVisibleBounds = (locations: NormalizedTravelMapLocation[]) => {
  // Fit bounds must use only visible, valid markers to avoid wrong centering/zoom glitches.
  const validLocations = locations.filter((location) => isValidCoordinate(location.lat, location.lng));
  if (!validLocations.length) return null;
  return L.latLngBounds(validLocations.map((location) => [location.lat, location.lng] as [number, number]));
};

const getBoundsFitMaxZoom = (bounds: L.LatLngBounds) => {
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  const diagonalKm = haversineKm(southWest.lat, southWest.lng, northEast.lat, northEast.lng);

  if (diagonalKm <= 1) return FIT_BOUNDS_MAX_ZOOM;
  if (diagonalKm <= 5) return 15;
  if (diagonalKm <= 25) return 14;
  if (diagonalKm <= 120) return 12;
  return 10;
};

type LayerVisibility = Record<TravelLayerType, boolean>;

type MapThemeStyles = {
  filterButtonActive: string;
  filterButtonInactive: string;
  filterCountActive: string;
  filterCountInactive: string;
  controlsButton: string;
  mapFrame: string;
  popupCard: string;
  popupTitle: string;
  popupMeta: string;
  popupTag: string;
  popupApprox: string;
  ctaHotel: string;
  ctaRental: string;
  iconStyle: (active: boolean, accent: string) => React.CSSProperties;
};

// Filter helper: returns only markers allowed by the current layer state.
export const getVisibleLocations = (
  locations: NormalizedTravelMapLocation[],
  layerVisibility: LayerVisibility,
) =>
  locations.filter((location) => {
    if (location.type === 'destination') return layerVisibility.destination;
    if (location.type === 'hotel') return layerVisibility.hotel;
    if (location.type === 'rental') return layerVisibility.rental;
    return false;
  });

// Bounds helper: every filter change re-fits the map using only visible markers.
export const fitMapToVisibleMarkers = (
  map: L.Map,
  visibleLocations: NormalizedTravelMapLocation[],
  options: { animate?: boolean; singleMarkerZoom?: number } = {},
) => {
  const shouldAnimate = options.animate ?? true;
  const singleMarkerZoom = options.singleMarkerZoom ?? SINGLE_MARKER_FALLBACK_ZOOM;
  const visibleSummary = TRAVEL_MAP_DEBUG ? visibleLocations.map(serializeDebugLocation) : [];

  if (!visibleLocations.length) {
    if (TRAVEL_MAP_DEBUG) {
      debugTravelMap('fit-bounds-empty', { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    }
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: shouldAnimate });
    return;
  }

  if (visibleLocations.length === 1) {
    if (TRAVEL_MAP_DEBUG) {
      debugTravelMap('fit-bounds-single-marker', {
        marker: visibleSummary[0],
        zoom: singleMarkerZoom,
      });
    }
    map.setView([visibleLocations[0].lat, visibleLocations[0].lng], singleMarkerZoom, {
      animate: shouldAnimate,
    });
    return;
  }

  const bounds = getVisibleBounds(visibleLocations);
  if (!bounds) {
    if (TRAVEL_MAP_DEBUG) {
      debugTravelMap('fit-bounds-invalid-visible-markers', visibleSummary);
    }
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: shouldAnimate });
    return;
  }

  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  const maxZoom = getBoundsFitMaxZoom(bounds);

  if (TRAVEL_MAP_DEBUG) {
    debugTravelMap('fit-bounds-visible-markers', {
      markerCount: visibleSummary.length,
      markers: visibleSummary,
      bounds: {
        southWest: {
          lat: Number(southWest.lat.toFixed(6)),
          lng: Number(southWest.lng.toFixed(6)),
        },
        northEast: {
          lat: Number(northEast.lat.toFixed(6)),
          lng: Number(northEast.lng.toFixed(6)),
        },
      },
      padding: FIT_BOUNDS_PADDING,
      maxZoom,
    });
  }

  map.fitBounds(bounds, {
    animate: shouldAnimate,
    maxZoom,
    padding: FIT_BOUNDS_PADDING,
  });
};

// Theme helper: ensures controls, chips and popup cards always match light/dark mode.
export const getMapThemeStyles = (isDark: boolean): MapThemeStyles => {
  if (isDark) {
    return {
      filterButtonActive: 'border-slate-500 bg-slate-800 text-white shadow-[0_8px_20px_rgba(2,6,23,0.35)]',
      filterButtonInactive: 'border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800',
      filterCountActive: 'bg-white/20 text-white',
      filterCountInactive: 'bg-slate-700 text-slate-300',
      controlsButton:
        'rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-800',
      mapFrame: 'border-slate-600 bg-slate-900',
      popupCard: 'bg-slate-900 text-slate-100',
      popupTitle: 'text-slate-100',
      popupMeta: 'text-slate-300',
      popupTag: 'bg-slate-700 text-slate-200',
      popupApprox: 'text-amber-300',
      ctaHotel:
        'travel-premium-popup-cta travel-premium-popup-cta--hotel mt-2 w-full rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400',
      ctaRental:
        'travel-premium-popup-cta travel-premium-popup-cta--rental mt-2 w-full rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-400',
      iconStyle: (active, accent) => ({
        background: active ? 'rgba(255,255,255,0.18)' : `${accent}1f`,
        color: active ? '#ffffff' : '#E2E8F0',
      }),
    };
  }

  return {
    filterButtonActive: 'border-blue-200 bg-blue-50 text-slate-800 shadow-[0_6px_14px_rgba(59,130,246,0.14)]',
    filterButtonInactive: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    filterCountActive: 'bg-blue-100 text-blue-700',
    filterCountInactive: 'bg-slate-100 text-slate-500',
    controlsButton:
      'rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50',
    mapFrame: 'border-slate-200 bg-white',
    popupCard: 'bg-white text-slate-800',
    popupTitle: 'text-slate-900',
    popupMeta: 'text-slate-600',
    popupTag: 'bg-slate-100 text-slate-600',
    popupApprox: 'text-amber-600',
    ctaHotel:
      'travel-premium-popup-cta travel-premium-popup-cta--hotel mt-2 w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700',
    ctaRental:
      'travel-premium-popup-cta travel-premium-popup-cta--rental mt-2 w-full rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700',
    iconStyle: (active, accent) => ({
      background: active ? 'rgba(59,130,246,0.15)' : `${accent}16`,
      color: active ? '#1D4ED8' : accent,
    }),
  };
};

function MapInstanceCapture({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    return () => {
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [map, mapRef]);

  return null;
}

function MapSizeInvalidationController({ watchKey }: { watchKey: string }) {
  const map = useMap();

  useEffect(() => {
    // When map mounts inside animated/hidden containers, repeated invalidation prevents blank tiles/wrong sizing.
    const invalidate = () => {
      map.invalidateSize({ pan: false, debounceMoveend: true });
    };

    let animationFrame = window.requestAnimationFrame(invalidate);
    const timeoutA = window.setTimeout(invalidate, 80);
    const timeoutB = window.setTimeout(invalidate, 180);
    const timeoutC = window.setTimeout(invalidate, 360);

    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => invalidate());
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', invalidate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeoutA);
      window.clearTimeout(timeoutB);
      window.clearTimeout(timeoutC);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', invalidate);
    };
  }, [map, watchKey]);

  return null;
}

function VisibleMarkersBoundsController({
  visibleLocations,
  singleMarkerZoom,
}: {
  visibleLocations: NormalizedTravelMapLocation[];
  singleMarkerZoom?: number;
}) {
  const map = useMap();
  const boundsKey = useMemo(
    () =>
      visibleLocations.length
        ? visibleLocations.map((location) => `${location.id}:${location.lat.toFixed(5)}:${location.lng.toFixed(5)}`).join('|')
        : 'empty',
    [visibleLocations],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fitMapToVisibleMarkers(map, visibleLocations, { animate: true, singleMarkerZoom });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [map, visibleLocations, boundsKey, singleMarkerZoom]);

  return null;
}

export const MALDIVES_EXAMPLE_LOCATIONS: TravelMapLocation[] = [
  {
    id: 'destination:maldives',
    type: 'destination',
    name: 'Maldives',
    country: 'Maldives',
    lat: 4.1756,
    lng: 73.5094,
    description: 'Luxury island destination with turquoise lagoons, overwater villas, and world-class diving.',
    rating: 4.95,
    imageUrl: '/images/maldives/1.jpg',
    tags: ['Luxury', 'Diving', 'Islands'],
  },
  {
    id: 'hotel:overwater-paradise',
    type: 'hotel',
    name: 'Overwater Paradise Resort',
    country: 'Maldives',
    lat: 4.2133,
    lng: 73.5409,
    price: 980,
    rating: 4.96,
    description: 'North Malé Atoll - iconic overwater suites with lagoon access.',
    imageUrl: '/images/hotels/h4/1.jpg',
  },
  {
    id: 'hotel:male-harbor-signature',
    type: 'hotel',
    name: 'Malé Harbor Signature Hotel',
    country: 'Maldives',
    lat: 4.1753,
    lng: 73.5097,
    price: 420,
    rating: 4.72,
    description: 'Malé city center - premium city stay close to transfer terminals.',
    imageUrl: '/images/hotels/h4/1.jpg',
  },
  {
    id: 'hotel:south-male-reef-retreat',
    type: 'hotel',
    name: 'South Malé Reef Retreat',
    country: 'Maldives',
    lat: 3.9444,
    lng: 73.4906,
    price: 540,
    rating: 4.84,
    description: 'South Malé Atoll - coral reef house reef and private speedboat transfers.',
    imageUrl: '/images/hotels/h4/1.jpg',
  },
  {
    id: 'rental:beach-villa-south-male',
    type: 'rental',
    name: 'Maldives Beach Villa',
    country: 'Maldives',
    lat: 3.9904,
    lng: 73.5055,
    price: 640,
    rating: 4.91,
    capacity: 4,
    description: 'Maafushi area - private beachfront rental with chef and pool.',
    imageUrl: '/images/rentals/r6/1.jpg',
  },
];

export function TravelLayersMap({
  locations,
  selectedDestinationId = null,
  height = 420,
  initialFilters,
  sizeInvalidateKey,
  onViewDetails,
  onExploreHotels,
  showExploreCta = true,
  showHeatmap = false,
  singleLocationMode = false,
  singleLocationZoom = SINGLE_MARKER_FALLBACK_ZOOM,
  forceTheme,
}: TravelLayersMapProps) {
  const { theme } = useTheme();
  const isDark = (forceTheme ?? theme) === 'dark';
  const mapThemeStyles = useMemo(() => getMapThemeStyles(isDark), [isDark]);
  const mapTileUrl = LIGHT_TILE_URL;
  const mapTileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const mapTileSubdomains = ['a', 'b', 'c'] as const;
  const mapRef = useRef<L.Map | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(selectedDestinationId || null);
  const [isLocating, setIsLocating] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [preparedLocations, setPreparedLocations] = useState<NormalizedTravelMapLocation[]>([]);
  const initialDestinationVisibility = initialFilters?.destination ?? DEFAULT_LAYER_FILTERS.destination;
  const initialHotelVisibility = initialFilters?.hotel ?? DEFAULT_LAYER_FILTERS.hotel;
  const initialRentalVisibility = initialFilters?.rental ?? DEFAULT_LAYER_FILTERS.rental;
  const [layerVisibility, setLayerVisibility] = useState<Record<TravelLayerType, boolean>>(() => ({
    destination: initialDestinationVisibility,
    hotel: initialHotelVisibility,
    rental: initialRentalVisibility,
  }));

  useEffect(() => {
    setActiveMarkerId(selectedDestinationId || null);
  }, [selectedDestinationId]);

  useEffect(() => {
    setLayerVisibility({
      destination: initialDestinationVisibility,
      hotel: initialHotelVisibility,
      rental: initialRentalVisibility,
    });
  }, [initialDestinationVisibility, initialHotelVisibility, initialRentalVisibility]);

  useEffect(() => {
    setIsPreparing(true);
    const frame = window.requestAnimationFrame(() => {
      const normalized = normalizeTravelMapLocations(locations);
      setPreparedLocations(normalized);
      setIsPreparing(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [locations]);

  const validLocations = useMemo(() => preparedLocations, [preparedLocations]);
  const destinationLocations = useMemo(
    () => validLocations.filter((location) => location.type === 'destination'),
    [validLocations],
  );
  const hotelLocations = useMemo(
    () => validLocations.filter((location) => location.type === 'hotel'),
    [validLocations],
  );
  const rentalLocations = useMemo(
    () => validLocations.filter((location) => location.type === 'rental'),
    [validLocations],
  );

  useEffect(() => {
    if (TRAVEL_MAP_DEBUG) {
      debugTravelMap('all-locations-before-filtering', {
        locationCount: validLocations.length,
        locations: validLocations.map(serializeDebugLocation),
      });
    }
  }, [validLocations]);

  const selectedDestination = useMemo(() => {
    if (selectedDestinationId) {
      const found = destinationLocations.find((location) => location.id === selectedDestinationId);
      if (found) return found;
    }
    return destinationLocations[0] ?? null;
  }, [destinationLocations, selectedDestinationId]);

  // Visible markers are derived from current filter state and used for both rendering and bounds fitting.
  const activeLocations = useMemo(() => {
    if (singleLocationMode) {
      return validLocations.slice(0, 1);
    }
    return getVisibleLocations(validLocations, layerVisibility);
  }, [singleLocationMode, validLocations, layerVisibility]);

  useEffect(() => {
    if (!singleLocationMode || activeLocations.length !== 1) return;
    setActiveMarkerId(activeLocations[0].id);
  }, [singleLocationMode, activeLocations]);
  const filteredDestinations = useMemo(
    () => activeLocations.filter((location) => location.type === 'destination'),
    [activeLocations],
  );
  const filteredHotels = useMemo(
    () => activeLocations.filter((location) => location.type === 'hotel'),
    [activeLocations],
  );
  const filteredRentals = useMemo(
    () => activeLocations.filter((location) => location.type === 'rental'),
    [activeLocations],
  );
  const visibleListingsCount = filteredHotels.length + filteredRentals.length;
  const activeLayerCount =
    (layerVisibility.destination ? 1 : 0) +
    (layerVisibility.hotel ? 1 : 0) +
    (layerVisibility.rental ? 1 : 0);
  // In single-layer mode users expect to see every marker directly; keep clustering only for high-volume mixed views.
  const shouldClusterListings = !singleLocationMode && visibleListingsCount >= 50 && activeLayerCount > 1;
  const mapSizeWatchKey = `${sizeInvalidateKey ?? ''}|${height}|${activeLocations.length}|${
    layerVisibility.destination ? 1 : 0
  }${layerVisibility.hotel ? 1 : 0}${layerVisibility.rental ? 1 : 0}|single:${singleLocationMode ? 1 : 0}|zoom:${singleLocationZoom}`;

  useEffect(() => {
    if (TRAVEL_MAP_DEBUG) {
      debugTravelMap('filtered-locations', {
        totalLocationCount: validLocations.length,
        filteredLocationCount: activeLocations.length,
        layerVisibility,
        filteredLocations: activeLocations.map(serializeDebugLocation),
      });
    }
  }, [activeLocations, layerVisibility, validLocations.length]);

  useEffect(() => {
    if (TRAVEL_MAP_DEBUG) {
      debugTravelMap('rendered-marker-counts', {
        requestedLocationCount: locations.length,
        normalizedLocationCount: validLocations.length,
        destinationCount: destinationLocations.length,
        hotelCount: hotelLocations.length,
        rentalCount: rentalLocations.length,
        renderedDestinationMarkers: filteredDestinations.length,
        renderedHotelMarkers: filteredHotels.length,
        renderedRentalMarkers: filteredRentals.length,
        renderedMarkerCount: filteredDestinations.length + filteredHotels.length + filteredRentals.length,
        activeVisibleMarkerCount: activeLocations.length,
        layerVisibility,
        activeLocationIds: activeLocations.map((location) => location.id),
      });
    }
  }, [
    activeLocations,
    destinationLocations.length,
    filteredDestinations.length,
    filteredHotels.length,
    filteredRentals.length,
    hotelLocations.length,
    layerVisibility,
    locations.length,
    rentalLocations.length,
    validLocations.length,
  ]);

  // Clicking a chip now focuses that category, so Hotels/Rentals always show all markers of that type.
  const activateLayer = (layer: TravelLayerType) => {
    setLayerVisibility({
      destination: layer === 'destination',
      hotel: layer === 'hotel',
      rental: layer === 'rental',
    });
  };

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;

    fitMapToVisibleMarkers(map, activeLocations, { animate: true, singleMarkerZoom: singleLocationZoom });
  };

  const handleLocateUser = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo([position.coords.latitude, position.coords.longitude], 12, {
          animate: true,
          duration: 0.9,
        });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  };

  const handleViewDetails = (event: React.MouseEvent<HTMLButtonElement>, locationId: string) => {
    event.preventDefault();
    event.stopPropagation();
    onViewDetails?.(locationId);
  };

  const listingMarkers = (
    <>
      {filteredHotels.map((location) => {
        const displayName = getLocationDisplayName(location);
        return (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={createCustomIcon('hotel', activeMarkerId === location.id, location.isApproximate)}
            eventHandlers={{
              click: () => setActiveMarkerId(location.id),
              mouseover: () => setActiveMarkerId(location.id),
            }}
          >
            <Popup
              className={`travel-premium-popup ${isDark ? 'travel-premium-popup--dark' : ''}`}
              closeButton={false}
              offset={[0, -14]}
            >
              <div
                className={`travel-premium-popup-card travel-premium-popup-card--hotel min-w-[260px] rounded-2xl p-1 ${mapThemeStyles.popupCard}`}
              >
                {location.imageUrl && (
                  <img
                    src={location.imageUrl}
                    alt={displayName}
                    className="travel-premium-popup-image h-28 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                )}
                <div className="px-1 pb-1 pt-2">
                  <h4 className={`mt-1 text-base font-bold ${mapThemeStyles.popupTitle}`}>{displayName}</h4>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${mapThemeStyles.popupMeta}`}>
                      {formatShortPrice(location.price) || 'N/A'} / night
                    </span>
                    <span className="font-semibold text-amber-600">
                      {formatRating(location.rating) ? `★ ${formatRating(location.rating)}` : 'No rating'}
                    </span>
                  </div>
                  {location.description && <p className={`mt-2 text-xs leading-5 ${mapThemeStyles.popupMeta}`}>{location.description}</p>}
                  {location.isApproximate && (
                    <div className={`mt-2 text-[10px] font-semibold ${mapThemeStyles.popupApprox}`}>Approximate location</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => handleViewDetails(event, location.id)}
                  className={`${mapThemeStyles.ctaHotel} ${onViewDetails ? '' : 'cursor-default opacity-70'}`}
                  disabled={!onViewDetails}
                >
                  {LAYER_META.hotel.cta}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {filteredRentals.map((location) => {
        const displayName = getLocationDisplayName(location);
        return (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={createCustomIcon('rental', activeMarkerId === location.id, location.isApproximate)}
            eventHandlers={{
              click: () => setActiveMarkerId(location.id),
              mouseover: () => setActiveMarkerId(location.id),
            }}
          >
            <Popup
              className={`travel-premium-popup ${isDark ? 'travel-premium-popup--dark' : ''}`}
              closeButton={false}
              offset={[0, -14]}
            >
              <div
                className={`travel-premium-popup-card travel-premium-popup-card--rental min-w-[260px] rounded-2xl p-1 ${mapThemeStyles.popupCard}`}
              >
                {location.imageUrl && (
                  <img
                    src={location.imageUrl}
                    alt={displayName}
                    className="travel-premium-popup-image h-28 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                )}
                <div className="px-1 pb-1 pt-2">
                  <h4 className={`mt-1 text-base font-bold ${mapThemeStyles.popupTitle}`}>{displayName}</h4>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${mapThemeStyles.popupMeta}`}>
                      {formatShortPrice(location.price) || 'N/A'} / night
                    </span>
                    <span className={`font-semibold ${mapThemeStyles.popupMeta}`}>
                      {location.capacity ? `${location.capacity} guests` : 'Capacity N/A'}
                    </span>
                  </div>
                  {location.description && <p className={`mt-2 text-xs leading-5 ${mapThemeStyles.popupMeta}`}>{location.description}</p>}
                  {location.isApproximate && (
                    <div className={`mt-2 text-[10px] font-semibold ${mapThemeStyles.popupApprox}`}>Approximate location</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => handleViewDetails(event, location.id)}
                  className={`${mapThemeStyles.ctaRental} ${onViewDetails ? '' : 'cursor-default opacity-70'}`}
                  disabled={!onViewDetails}
                >
                  {LAYER_META.rental.cta}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );

  if (isPreparing) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border text-sm ${
          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'
        }`}
        style={{ borderColor: isDark ? '#475569' : TRAVEL_COLORS.border, minHeight: height }}
      >
        Preparing map markers...
      </div>
    );
  }

  if (!validLocations.length) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border border-dashed text-sm ${
          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-500'
        }`}
        style={{ borderColor: isDark ? '#475569' : TRAVEL_COLORS.border, minHeight: height }}
      >
        No valid map locations found.
      </div>
    );
  }

  const mapCenter: [number, number] =
    singleLocationMode && activeLocations.length === 1
      ? [activeLocations[0].lat, activeLocations[0].lng]
      : selectedDestination
        ? [selectedDestination.lat, selectedDestination.lng]
        : DEFAULT_CENTER;
  const mapZoom =
    singleLocationMode && activeLocations.length === 1 ? singleLocationZoom : selectedDestination ? 9 : 3;

  return (
    <div className="space-y-3">
      {!singleLocationMode && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(['destination', 'hotel', 'rental'] as const).map((layer) => {
              const isActive = layerVisibility[layer];
              const meta = LAYER_META[layer];

              return (
                <button
                  key={layer}
                  type="button"
                  onClick={() => activateLayer(layer)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive ? mapThemeStyles.filterButtonActive : mapThemeStyles.filterButtonInactive
                  }`}
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full text-[10px]"
                    style={mapThemeStyles.iconStyle(isActive, meta.accent)}
                  >
                    {meta.shortLabel}
                  </span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLocateUser}
              className={mapThemeStyles.controlsButton}
            >
              {isLocating ? 'Locating...' : 'My location'}
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className={mapThemeStyles.controlsButton}
            >
              Reset view
            </button>
          </div>
        </div>
      )}

      <div className={`overflow-hidden rounded-2xl border ${mapThemeStyles.mapFrame}`}>
        <MapContainer
          className={`travel-premium-map-canvas ${isDark ? 'travel-premium-map-canvas--dark' : ''}`}
          center={mapCenter}
          zoom={mapZoom}
          minZoom={2}
          zoomSnap={0.25}
          zoomDelta={0.5}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1.0}
          worldCopyJump={false}
          scrollWheelZoom
          zoomAnimation
          fadeAnimation
          markerZoomAnimation
          style={{ width: '100%', height }}
        >
          <TileLayer
            attribution={mapTileAttribution}
            url={mapTileUrl}
            subdomains={[...mapTileSubdomains]}
            detectRetina
            noWrap={true}
          />

          <MapInstanceCapture mapRef={mapRef} />
          <MapSizeInvalidationController watchKey={mapSizeWatchKey} />
          <VisibleMarkersBoundsController
            visibleLocations={activeLocations}
            singleMarkerZoom={singleLocationZoom}
          />

          {!singleLocationMode &&
            showHeatmap &&
            [...filteredHotels, ...filteredRentals].slice(0, 120).map((location) => (
              <Circle
                key={`heat-${location.id}`}
                center={[location.lat, location.lng]}
                radius={location.type === 'hotel' ? 700 : 550}
                pathOptions={{
                  color: location.type === 'hotel' ? '#2563EB' : '#06B6D4',
                  fillColor: location.type === 'hotel' ? '#2563EB' : '#06B6D4',
                  fillOpacity: 0.1,
                  weight: 0,
                }}
              />
            ))}

          {filteredDestinations.map((location) => {
            const displayName = getLocationDisplayName(location);
            return (
              <Marker
                key={location.id}
                position={[location.lat, location.lng]}
                icon={createCustomIcon('destination', activeMarkerId === location.id, location.isApproximate)}
                eventHandlers={{
                  click: () => setActiveMarkerId(location.id),
                  mouseover: () => setActiveMarkerId(location.id),
                }}
              >
                <Popup
                  className={`travel-premium-popup ${isDark ? 'travel-premium-popup--dark' : ''}`}
                  closeButton={false}
                  offset={[0, -14]}
                >
                  <div
                    className={`travel-premium-popup-card travel-premium-popup-card--destination min-w-[250px] rounded-2xl p-1 ${mapThemeStyles.popupCard}`}
                  >
                    {location.imageUrl && (
                      <img
                        src={location.imageUrl}
                        alt={displayName}
                        className="travel-premium-popup-image h-28 w-full rounded-xl object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="px-1 pb-1 pt-2">
                      <h4 className={`mt-1 text-base font-bold ${mapThemeStyles.popupTitle}`}>{displayName}</h4>
                      {location.country && <div className={`text-xs ${mapThemeStyles.popupMeta}`}>{location.country}</div>}
                      {location.description && <p className={`mt-2 text-xs leading-5 ${mapThemeStyles.popupMeta}`}>{location.description}</p>}
                      {!!location.tags?.length && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {location.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${mapThemeStyles.popupTag}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {location.isApproximate && (
                        <div className={`mt-2 text-[10px] font-semibold ${mapThemeStyles.popupApprox}`}>Approximate location</div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {shouldClusterListings ? (
            <MarkerClusterGroup
              chunkedLoading
              animate
              animateAddingMarkers
              maxClusterRadius={62}
              showCoverageOnHover={false}
              iconCreateFunction={() => createClusterIcon()}
              spiderfyOnMaxZoom
              spiderfyDistanceMultiplier={1.4}
              zoomToBoundsOnClick
              removeOutsideVisibleBounds
            >
              {listingMarkers}
            </MarkerClusterGroup>
          ) : (
            listingMarkers
          )}
        </MapContainer>
      </div>

      {!singleLocationMode && showExploreCta && (
        <button
          type="button"
          onClick={onExploreHotels}
          className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Explore Hotels
        </button>
      )}
    </div>
  );
}

