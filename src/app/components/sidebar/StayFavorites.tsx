import React, { useMemo, useState } from 'react';
import { Heart, MapPin, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import type { TravelCategory, TravelPlace } from '../../types/travel';
import { TRAVEL_CATEGORY_LABEL, TRAVEL_COLORS } from '../../types/travel';

type StayFavoritesProps = {
  places: TravelPlace[];
  favorites: TravelPlace[];
  selectedPlaceId: string | null;
  dayPlaceIds: Set<string>;
  onSelectPlace: (placeId: string) => void;
  onQuickAdd: (placeId: string) => void;
  onToggleFavorite: (placeId: string) => void;
  onCategoryFilter: (category: 'all' | TravelCategory) => void;
};

const categoryTabs: Array<'all' | TravelCategory> = ['all', 'hotel', 'rental', 'activity', 'restaurant', 'stop'];

export function StayFavorites({
  places,
  favorites,
  selectedPlaceId,
  dayPlaceIds,
  onSelectPlace,
  onQuickAdd,
  onToggleFavorite,
  onCategoryFilter,
}: StayFavoritesProps) {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'all' | TravelCategory>('all');

  const listed = useMemo(
    () => (activeTab === 'all' ? places : places.filter((place) => place.category === activeTab)),
    [activeTab, places],
  );

  return (
    <div
      className={`rounded-2xl border p-3 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}
      style={{ borderColor: isDark ? '#334155' : '#D9E3F0' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className={`text-sm font-black ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>Stay + Favorites</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {listed.length} items
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {categoryTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              onCategoryFilter(tab);
            }}
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold transition ${
              activeTab === tab
                ? 'text-white'
                : isDark
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-white text-slate-600'
            }`}
            style={
              activeTab === tab
                ? { backgroundColor: tab === 'all' ? TRAVEL_COLORS.navy : TRAVEL_COLORS.category[tab], borderColor: 'transparent' }
                : { borderColor: isDark ? '#475569' : '#D9E3F0' }
            }
          >
            {tab === 'all' ? 'All' : TRAVEL_CATEGORY_LABEL[tab]}
          </button>
        ))}
      </div>

      <div
        className={`mb-3 rounded-xl border p-2 ${isDark ? 'bg-slate-700/60' : 'bg-slate-50'}`}
        style={{ borderColor: isDark ? '#475569' : '#D9E3F0' }}
      >
        <div className={`mb-1 text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>Favorite Quick Add</div>
        {!favorites.length ? (
          <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            Mark places with heart and quickly add them to the active day.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {favorites.slice(0, 8).map((favorite) => (
              <button
                key={favorite.id}
                onClick={() => onQuickAdd(favorite.id)}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                  isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
                style={{ borderColor: isDark ? '#475569' : '#D9E3F0' }}
              >
                + {favorite.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-h-[420px] space-y-1.5 overflow-auto pr-1">
        {listed.map((place) => {
          const selected = selectedPlaceId === place.id;
          const added = dayPlaceIds.has(place.id);

          return (
            <div
              key={place.id}
              className={`rounded-xl border p-2 transition ${
                selected ? 'shadow-sm ring-1' : ''
              }`}
              style={
                selected
                  ? { borderColor: TRAVEL_COLORS.blue, boxShadow: '0 0 0 1px #2563EB inset' }
                  : { borderColor: isDark ? '#475569' : '#D9E3F0' }
              }
            >
              <button
                onClick={() => onSelectPlace(place.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{place.name}</div>
                    <div className={`mt-0.5 inline-flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <MapPin size={11} />
                      {place.city || place.country || place.address || 'Unknown'}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: TRAVEL_COLORS.category[place.category] }}
                  >
                    {TRAVEL_CATEGORY_LABEL[place.category]}
                  </span>
                </div>
              </button>
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => onToggleFavorite(place.id)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                    place.isFavorite
                      ? isDark
                        ? 'bg-rose-950/40 text-rose-300'
                        : 'bg-rose-50 text-rose-600'
                      : isDark
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-white text-slate-600'
                  }`}
                  style={{ borderColor: isDark ? '#475569' : '#D9E3F0' }}
                >
                  <Heart size={12} fill={place.isFavorite ? 'currentColor' : 'none'} />
                  Favorite
                </button>
                {added ? (
                  <span
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                      isDark ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    Added
                  </span>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => onQuickAdd(place.id)}>
                    <Plus size={12} />
                    Add
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
