import React from 'react';
import { Calendar, MapPin, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DayToolbar } from './DayToolbar';
import { Button } from '../common/Button';
import type { TravelDay, TravelDayMode } from '../../types/travel';
import { TRAVEL_COLORS } from '../../types/travel';

type DayCardProps = {
  day: TravelDay;
  dayIndex: number;
  dayCost: number;
  isActive: boolean;
  selectedPlaceId: string | null;
  onSelectDay: () => void;
  onModeChange: (mode: TravelDayMode) => void;
  onAddActivity: () => void;
  onSuggestDay: () => void;
  onClearDay: () => void;
  onDuplicateDay: () => void;
  onAddRestaurant: () => void;
  onAddAttraction: () => void;
  onAddFirstActivity: () => void;
  onSuggestItinerary: () => void;
  onSelectPlace: (placeId: string) => void;
  onRemovePlace: (placeId: string) => void;
};

export function DayCard({
  day,
  dayIndex,
  dayCost,
  isActive,
  selectedPlaceId,
  onSelectDay,
  onModeChange,
  onAddActivity,
  onSuggestDay,
  onClearDay,
  onDuplicateDay,
  onAddRestaurant,
  onAddAttraction,
  onAddFirstActivity,
  onSuggestItinerary,
  onSelectPlace,
  onRemovePlace,
}: DayCardProps) {
  const { theme, t, formatPrice, translateDynamic } = useApp();
  const isDark = theme === 'dark';
  const defaultDayLabel = `${t('planner.day')} ${dayIndex + 1}`;
  const normalizedTitle = day.title
    ? day.title.replace(/^Day\b/i, t('planner.day')).replace(/\bcopy\b/i, t('planner.copy'))
    : defaultDayLabel;

  return (
    <div
      className={`rounded-2xl border p-3 shadow-sm transition ${isDark ? 'bg-slate-800' : 'bg-white'}`}
      style={
        isActive
          ? { borderColor: '#2563EB', boxShadow: '0 0 0 1px #2563EB inset' }
          : { borderColor: isDark ? '#334155' : '#D9E3F0' }
      }
    >
      <button onClick={onSelectDay} className="mb-2 w-full text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={`text-base font-black ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{translateDynamic(normalizedTitle)}</div>
            <div className={`mt-0.5 flex flex-wrap items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="inline-flex items-center gap-1"><Calendar size={12} />{day.date}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={12} />{translateDynamic(day.destination || t('planner.destination'))}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{day.places.length} {t('planner.activities')}</div>
            <div className={`text-sm font-black ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{formatPrice(dayCost)}</div>
          </div>
        </div>
      </button>

      <DayToolbar
        mode={day.mode || 'mixed'}
        onModeChange={onModeChange}
        onAddActivity={onAddActivity}
        onSuggestDay={onSuggestDay}
        onClearDay={onClearDay}
        onDuplicateDay={onDuplicateDay}
        onAddRestaurant={onAddRestaurant}
        onAddAttraction={onAddAttraction}
      />

      {!day.places.length ? (
        <div
          className={`mt-3 rounded-xl border border-dashed p-4 text-center ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}
          style={{ borderColor: isDark ? '#475569' : '#D9E3F0' }}
        >
          <div className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t('planner.empty_title')}</div>
          <div className={`mt-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{t('planner.empty_subtitle')}</div>
          <div className="mt-3 flex justify-center gap-2">
            <Button variant="primary" size="sm" onClick={onAddFirstActivity}>{t('planner.add_first_activity')}</Button>
            <Button variant="secondary" size="sm" onClick={onSuggestItinerary}>{t('planner.suggest_itinerary')}</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {day.places.map((place) => {
            const selected = selectedPlaceId === place.id;
            const locationText = place.address || `${place.city || ''} ${place.country || ''}`.trim() || t('planner.unknown');
            return (
              <div
                key={`${day.id}-${place.id}`}
                className={`flex items-center justify-between gap-2 rounded-xl border p-2 ${isDark ? 'bg-slate-800' : 'bg-white'}`}
                style={
                  selected
                    ? { borderColor: TRAVEL_COLORS.blue, boxShadow: '0 0 0 1px #2563EB inset' }
                    : { borderColor: isDark ? '#475569' : '#D9E3F0' }
                }
              >
                <button onClick={() => onSelectPlace(place.id)} className="min-w-0 flex-1 text-left">
                  <div className={`truncate text-sm font-semibold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{translateDynamic(place.name)}</div>
                  <div className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {translateDynamic(locationText)}
                  </div>
                </button>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: TRAVEL_COLORS.category[place.category] }}
                >
                  {t(`planner.category.${place.category}`)}
                </span>
                <button
                  onClick={() => onRemovePlace(place.id)}
                  className={`rounded-lg border p-1 ${
                    isDark
                      ? 'border-rose-800 text-rose-300 hover:bg-rose-950/40'
                      : 'border-rose-200 text-rose-500 hover:bg-rose-50'
                  }`}
                  aria-label={t('planner.remove_activity')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
