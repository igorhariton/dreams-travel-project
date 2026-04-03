import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import { useApp } from '../../context/AppContext';
import type { TravelCategory, TravelPlace } from '../../types/travel';
import { TRAVEL_COLORS } from '../../types/travel';

type TripMapProps = {
  places: TravelPlace[];
  selectedPlaceId: string | null;
  focusedPlaceId: string | null;
  focusNonce: number;
  onPlaceSelect: (placeId: string) => void;
  height?: number;
  isLoading?: boolean;
};

const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180],
];

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

const validCoords = (place: TravelPlace) =>
  Number.isFinite(place.lat) &&
  Number.isFinite(place.lng) &&
  place.lat >= -90 &&
  place.lat <= 90 &&
  place.lng >= -180 &&
  place.lng <= 180;

const markerIcon = (category: TravelCategory, selected: boolean) =>
  L.divIcon({
    className: 'planner-map-marker',
    html: `<span style="display:block;width:${selected ? 18 : 14}px;height:${selected ? 18 : 14}px;border-radius:999px;background:${TRAVEL_COLORS.category[category]};border:${selected ? 3 : 2}px solid #ffffff;box-shadow:0 2px 10px rgba(15,23,42,0.35)"></span>`,
    iconSize: [selected ? 18 : 14, selected ? 18 : 14],
    iconAnchor: [selected ? 9 : 7, selected ? 9 : 7],
    popupAnchor: [0, -9],
  });

function FitBounds({ places }: { places: TravelPlace[] }) {
  const map = useMap();

  useEffect(() => {
    if (!places.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
      return;
    }
    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 12, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.22), { animate: true, maxZoom: 14 });
  }, [map, places]);

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
}: TripMapProps) {
  const { theme, t, translateDynamic } = useApp();
  const isDark = theme === 'dark';
  const validPlaces = useMemo(() => places.filter(validCoords), [places]);
  const markerRefs = useRef<Record<string, L.Marker>>({});

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

  if (!validPlaces.length) {
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true}
        />

        <FitBounds places={validPlaces} />
        <FocusPlace
          places={validPlaces}
          focusedPlaceId={focusedPlaceId}
          focusNonce={focusNonce}
          markerRefs={markerRefs}
        />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={55}
          showCoverageOnHover={false}
          iconCreateFunction={(cluster) =>
            L.divIcon({
              html: `<span style="display:grid;place-items:center;width:38px;height:38px;border-radius:999px;background:linear-gradient(135deg,${TRAVEL_COLORS.blue},${TRAVEL_COLORS.cyan});color:#ffffff;font-weight:800;font-size:12px;border:2px solid #ffffff;box-shadow:0 6px 14px rgba(37,99,235,0.35)">${cluster.getChildCount()}</span>`,
              className: 'planner-map-cluster',
              iconSize: [38, 38],
            })
          }
        >
          {validPlaces.map((place) => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={markerIcon(place.category, selectedPlaceId === place.id)}
              ref={(ref) => {
                if (ref) markerRefs.current[place.id] = ref;
                else delete markerRefs.current[place.id];
              }}
              eventHandlers={{
                click: () => onPlaceSelect(place.id),
              }}
            >
              <Popup>
                <div className="min-w-[220px] text-slate-800">
                  <div className="font-bold">{translateDynamic(place.name)}</div>
                  <div className="mt-1 text-xs text-slate-600">{translateDynamic(place.address || t('planner.unknown_address'))}</div>
                  <div className="mt-2 text-xs">
                    <b>{t('planner.filter.category')}:</b> {t(`planner.category.${place.category}`)}
                  </div>
                  <div className="text-xs">
                    <b>{t('planner.filter.city')}:</b> {translateDynamic(place.city || t('planner.na'))}
                  </div>
                  <div className="text-xs">
                    <b>{t('planner.filter.country')}:</b> {translateDynamic(place.country || t('planner.na'))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
