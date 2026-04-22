import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bath, BedDouble, Building2, Home, MapPin, ShieldCheck, Star, Users, X } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import { useApp } from '../context/AppContext';
import { TravelLayersMap, isValidCoordinatePair } from './map/TripMap';
import type { TravelMapLocation } from '../types/travel';
import { apiPost } from '../../services/apiClient';

export interface ListingDetailsItem {
  id: string;
  kind: 'hotel' | 'rental';
  name: string;
  location: string;
  images: string[];
  rating: number;
  reviews: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
  typeLabel: string;
  stars?: number;
  host?: string;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  lat?: number;
  lng?: number;
}

interface ListingDetailsModalProps {
  isOpen: boolean;
  item: ListingDetailsItem | null;
  onClose: () => void;
  onReserve: () => void;
  forceTheme?: 'light' | 'dark';
}

type LatLng = { lat: number; lng: number };
type GeocodeCacheEntry = LatLng & { updatedAt: number };
type GeocodeCacheMap = Record<string, GeocodeCacheEntry>;

const GEOCODE_CACHE_KEY = 'td_geocode_cache_v1';
const GEOCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function readGeocodeCache(): GeocodeCacheMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GEOCODE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GeocodeCacheMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeGeocodeCache(cache: GeocodeCacheMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage write errors
  }
}

function parseGeocodePayload(payload: unknown): LatLng | null {
  const parseLatLng = (value: unknown): LatLng | null => {
    if (!value || typeof value !== 'object') return null;
    const row = value as Record<string, unknown>;
    const lat = Number(row.lat);
    const lng = Number(row.lng ?? row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  const direct = parseLatLng(payload);
  if (direct) return direct;

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const parsed = parseLatLng(entry);
      if (parsed) return parsed;
    }
  }

  if (payload && typeof payload === 'object') {
    const row = payload as Record<string, unknown>;
    const nestedCandidates = [row.result, row.data, row.location];
    for (const candidate of nestedCandidates) {
      const parsed = parseLatLng(candidate);
      if (parsed) return parsed;
    }
    if (Array.isArray(row.results)) {
      for (const entry of row.results) {
        const parsed = parseLatLng(entry);
        if (parsed) return parsed;
      }
    }
  }

  return null;
}

async function geocodeQuery(query: string, signal: AbortSignal): Promise<LatLng | null> {
  const payload = await apiPost<unknown>(
    '/geocode',
    {
      query,
      limit: 1,
    },
    {
      timeoutMs: 12000,
      signal,
    },
  );
  return parseGeocodePayload(payload);
}

export function ListingDetailsModal({ isOpen, item, onClose, onReserve, forceTheme }: ListingDetailsModalProps) {
  const { t, translateDynamic, formatPrice, publicHotels, publicRentals, theme } = useApp();
  const isDark = (forceTheme ?? theme) === 'dark';
  const [resolvedCoords, setResolvedCoords] = useState<LatLng | null>(null);
  const [isResolvingCoords, setIsResolvingCoords] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverflow = documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.classList.add('modal-open');
    documentElement.classList.add('modal-open');
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.classList.remove('modal-open');
      documentElement.classList.remove('modal-open');
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !item) return;

    let active = true;
    const controller = new AbortController();
    const fallbackCoords =
      Number.isFinite(item.lat) && Number.isFinite(item.lng)
        ? { lat: Number(item.lat), lng: Number(item.lng) }
        : null;

    setResolvedCoords(fallbackCoords);
    setGeocodeError(null);

    const queries = Array.from(
      new Set(
        [`${item.name}, ${item.location}`, item.location]
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      ),
    );

    const run = async () => {
      const now = Date.now();
      const cache = readGeocodeCache();

      for (const query of queries) {
        const cached = cache[query];
        if (!cached) continue;
        if (now - cached.updatedAt > GEOCODE_CACHE_TTL_MS) continue;
        if (!active) return;
        setResolvedCoords({ lat: cached.lat, lng: cached.lng });
        setGeocodeError(null);
        return;
      }

      setIsResolvingCoords(true);
      try {
        for (const query of queries) {
          const coords = await geocodeQuery(query, controller.signal);
          if (!coords) continue;
          cache[query] = { ...coords, updatedAt: Date.now() };
          writeGeocodeCache(cache);
          if (!active) return;
          setResolvedCoords(coords);
          setGeocodeError(null);
          return;
        }
        if (active && !fallbackCoords) {
          setGeocodeError('Map location is temporarily unavailable.');
        }
      } catch {
        if (active && !controller.signal.aborted && !fallbackCoords) {
          setGeocodeError('Map location is temporarily unavailable.');
        }
      } finally {
        if (active) setIsResolvingCoords(false);
      }
    };

    void run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isOpen, item]);

  const mapLocations = useMemo<TravelMapLocation[]>(() => {
    if (!item) return [];

    const sourceListing =
      item.kind === 'hotel'
        ? publicHotels.find((hotel) => hotel.id === item.id)
        : publicRentals.find((rental) => rental.id === item.id);

    const sourceLat = Number((sourceListing as { lat?: number } | undefined)?.lat);
    const sourceLng = Number((sourceListing as { lng?: number } | undefined)?.lng);
    const itemLat = Number(item.lat);
    const itemLng = Number(item.lng);
    const exactCoords = isValidCoordinatePair(sourceLat, sourceLng)
      ? { lat: sourceLat, lng: sourceLng }
      : isValidCoordinatePair(itemLat, itemLng)
        ? { lat: itemLat, lng: itemLng }
        : null;

    const resolvedValidCoords =
      resolvedCoords && isValidCoordinatePair(resolvedCoords.lat, resolvedCoords.lng) ? resolvedCoords : null;
    const coords = exactCoords ?? resolvedValidCoords;
    if (!coords) return [];

    return [
      {
        id: `${item.kind}:${item.id}`,
        type: item.kind,
        name: item.name,
        lat: coords.lat,
        lng: coords.lng,
        price: item.pricePerNight,
        rating: item.rating,
        capacity: item.maxGuests,
        description: item.location,
        imageUrl: item.images[0],
        isApproximate: !exactCoords,
      },
    ];
  }, [item, publicHotels, publicRentals, resolvedCoords]);

  const detailCards = useMemo(() => {
    if (!item) return [];
    return item.kind === 'hotel'
      ? [
          { icon: <Building2 size={16} />, label: translateDynamic('Property Type'), value: translateDynamic(item.typeLabel) },
          { icon: <Star size={16} />, label: translateDynamic('Star Rating'), value: `${item.stars || 0}★` },
          { icon: <ShieldCheck size={16} />, label: translateDynamic('Guest Reviews'), value: `${item.reviews.toLocaleString()} ${t('common.reviews')}` },
        ]
      : [
          { icon: <BedDouble size={16} />, label: translateDynamic('Bedrooms'), value: `${item.bedrooms || 0}` },
          { icon: <Bath size={16} />, label: translateDynamic('Bathrooms'), value: `${item.bathrooms || 0}` },
          { icon: <Users size={16} />, label: translateDynamic('Max Guests'), value: `${item.maxGuests || 1}` },
        ];
  }, [item, t, translateDynamic]);

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[95] overflow-hidden p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <div className="flex h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.96 }}
                className={`travel-shell relative flex max-h-[min(92vh,920px)] w-full max-w-5xl flex-col overflow-hidden border ${
                  isDark
                    ? 'border-slate-700 bg-[#111827] shadow-[0_20px_50px_rgba(2,6,23,0.42)]'
                    : 'border-[#D9E2EC] bg-[#FFFFFF] shadow-[0_20px_60px_rgba(15,23,42,0.14)]'
                }`}
              >
                <div
                  className={`shrink-0 border-b bg-linear-to-r px-6 py-5 ${
                    isDark
                      ? 'border-slate-700 from-[#0b1220] via-[#0f172a] to-[#111827] text-white'
                      : 'border-[#D9E2EC] from-[#EEF4FA] via-[#F1F5F9] to-[#FFFFFF] text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`travel-badge px-3 py-1 text-xs font-semibold ${
                            item.kind === 'hotel'
                              ? isDark
                                ? 'bg-blue-500/15 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {translateDynamic(item.kind === 'hotel' ? 'Hotel' : 'Rental')}
                        </span>
                        <span className={`travel-badge px-3 py-1 text-xs font-medium ${isDark ? 'bg-white/10 text-slate-200' : 'bg-[#EEF4FA] text-[#475569]'}`}>
                          {translateDynamic(item.typeLabel)}
                        </span>
                      </div>
                      <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{item.name}</h2>
                      <div className={`mt-2 flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-slate-300' : 'text-[#475569]'}`}>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {item.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <strong className={isDark ? 'text-white' : 'text-[#0F172A]'}>{item.rating}</strong>
                          {`(${item.reviews.toLocaleString()} ${t('common.reviews')})`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className={`rounded-full p-2 transition-colors ${
                        isDark
                          ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                          : 'text-[#64748B] hover:bg-[#EEF4FA] hover:text-[#0F172A]'
                      }`}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className={`app-modal-scroll flex-1 overflow-y-auto bg-linear-to-b px-6 py-6 ${isDark ? 'from-[#111827] to-[#111827]' : 'from-[#F8FAFC] to-white'}`}>
                  <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
                    <div className="space-y-6">
                      <div
                        className={`travel-panel overflow-hidden border ${
                          isDark
                            ? 'border-slate-700 bg-[#1f2937] shadow-none'
                            : 'border-[#D9E2EC] bg-[#F1F5F9] shadow-[0_10px_30px_rgba(15,23,42,0.06)]'
                        }`}
                      >
                        <ImageCarousel images={item.images} className="h-[320px] md:h-[420px]" priority />
                      </div>

                      <section
                        className={`travel-panel border p-6 ${
                          isDark
                            ? 'border-slate-700 bg-[#1f2937] shadow-none'
                            : 'border-[#D9E2EC] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className={`text-lg font-bold ${isDark ? 'text-slate-50' : 'text-[#0F172A]'}`}>{translateDynamic('Location on map')}</h3>
                          <div className="flex items-center gap-3">
                            {isResolvingCoords && (
                              <span className={`text-xs font-semibold ${isDark ? 'text-cyan-300' : 'text-sky-600'}`}>{translateDynamic('Updating location...')}</span>
                            )}
                            {geocodeError && (
                              <span className={`text-xs font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{translateDynamic(geocodeError)}</span>
                            )}
                          </div>
                        </div>
                        <div className={`mt-4 overflow-hidden rounded-xl border ${isDark ? 'border-slate-700' : 'border-[#D9E2EC]'}`}>
                          <TravelLayersMap
                            locations={mapLocations}
                            sizeInvalidateKey={`${item.kind}:${item.id}:${isOpen ? 'open' : 'closed'}`}
                          height={280}
                          singleLocationMode
                          singleLocationZoom={15}
                          forceTheme="light"
                          showExploreCta={false}
                          showHeatmap={false}
                          />
                        </div>
                      </section>

                      <section
                        className={`travel-panel border p-6 ${
                          isDark
                            ? 'border-slate-700 bg-[#1f2937] shadow-none'
                            : 'border-[#D9E2EC] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]'
                        }`}
                      >
                        <h3 className={`text-lg font-bold ${isDark ? 'text-slate-50' : 'text-[#0F172A]'}`}>{translateDynamic('About this stay')}</h3>
                        <p className={`mt-3 leading-7 ${isDark ? 'text-slate-300' : 'text-[#475569]'}`}>{translateDynamic(item.description)}</p>
                      </section>

                      <section
                        className={`travel-panel border p-6 ${
                          isDark
                            ? 'border-slate-700 bg-[#1f2937] shadow-none'
                            : 'border-[#D9E2EC] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]'
                        }`}
                      >
                        <h3 className={`text-lg font-bold ${isDark ? 'text-slate-50' : 'text-[#0F172A]'}`}>{translateDynamic('Amenities')}</h3>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          {item.amenities.map((amenity) => (
                            <span key={amenity} className={`travel-badge px-3 py-2 text-sm font-medium ${isDark ? 'bg-[#243144] text-slate-200' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                              {translateDynamic(amenity)}
                            </span>
                          ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section
                      className={`travel-panel border bg-linear-to-br p-6 ${
                        isDark
                          ? 'border-slate-700 from-[#111827] via-[#0f172a] to-[#111827] text-white shadow-none'
                          : 'border-[#D9E2EC] from-[#FFFFFF] via-[#F8FAFC] to-[#EEF4FA] text-[#0F172A] shadow-[0_14px_32px_rgba(15,23,42,0.08)]'
                      }`}
                    >
                      <p className={`text-sm uppercase tracking-[0.18em] ${isDark ? 'text-cyan-200' : 'text-[#475569]'}`}>{translateDynamic('Reserve this stay')}</p>
                      <div className={`mt-3 text-4xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{formatPrice(item.pricePerNight)}</div>
                      <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-[#64748B]'}`}>{t('common.per_night')}</p>
                      <button
                        onClick={onReserve}
                        className="travel-primary-button mt-6 w-full py-3.5 text-sm font-semibold transition-all"
                      >
                        {translateDynamic('Reserve')}
                      </button>
                      <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>{translateDynamic('Choose your dates and guests first, then continue to secure payment.')}</p>
                    </section>

                    <section
                      className={`travel-panel border p-6 ${
                        isDark
                          ? 'border-slate-700 bg-[#1f2937] shadow-none'
                          : 'border-[#D9E2EC] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]'
                      }`}
                    >
                      <h3 className={`text-lg font-bold ${isDark ? 'text-slate-50' : 'text-[#0F172A]'}`}>{translateDynamic('Property details')}</h3>
                      <div className="mt-4 space-y-3">
                        {detailCards.map((detail) => (
                          <div
                            key={detail.label}
                            className={`travel-panel flex items-center justify-between border px-4 py-3 ${
                              isDark ? 'border-slate-700 bg-[#243144]' : 'border-[#D9E2EC] bg-[#F1F5F9]'
                            }`}
                          >
                            <span className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-[#475569]'}`}>
                              {detail.icon}
                              {detail.label}
                            </span>
                            <span className={`text-sm font-semibold ${isDark ? 'text-slate-50' : 'text-[#0F172A]'}`}>{detail.value}</span>
                          </div>
                        ))}
                        {item.host && (
                          <div
                            className={`travel-panel flex items-center justify-between border px-4 py-3 ${
                              isDark ? 'border-slate-700 bg-[#243144]' : 'border-[#D9E2EC] bg-[#F1F5F9]'
                            }`}
                          >
                            <span className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-[#475569]'}`}>
                              <Home size={16} />
                              {translateDynamic('Host')}
                            </span>
                            <span className={`text-sm font-semibold ${isDark ? 'text-slate-50' : 'text-[#0F172A]'}`}>{translateDynamic(item.host)}</span>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

