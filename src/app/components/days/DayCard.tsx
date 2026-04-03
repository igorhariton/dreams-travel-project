import React from 'react';
import { Calendar, MapPin, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DayToolbar } from './DayToolbar';
import { Button } from '../common/Button';
import type { TravelDay, TravelDayMode } from '../../types/travel';
import { TRAVEL_CATEGORY_LABEL, TRAVEL_COLORS } from '../../types/travel';

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
  const { theme } = useApp();
  const isDark = theme === 'dark';

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
            <div className={`text-base font-black ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{day.title || `Day ${dayIndex + 1}`}</div>
            <div className={`mt-0.5 flex flex-wrap items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="inline-flex items-center gap-1"><Calendar size={12} />{day.date}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={12} />{day.destination || 'Destination'}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{day.places.length} activities</div>
            <div className={`text-sm font-black ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>${dayCost.toLocaleString()}</div>
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
          <div className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Start building your dream trip</div>
          <div className={`mt-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>No activities yet for this day.</div>
          <div className="mt-3 flex justify-center gap-2">
            <Button variant="primary" size="sm" onClick={onAddFirstActivity}>Add first activity</Button>
            <Button variant="secondary" size="sm" onClick={onSuggestItinerary}>Suggest itinerary</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {day.places.map((place) => {
            const selected = selectedPlaceId === place.id;
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
                  <div className={`truncate text-sm font-semibold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{place.name}</div>
                  <div className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{place.address || `${place.city || ''} ${place.country || ''}`}</div>
                </button>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: TRAVEL_COLORS.category[place.category] }}
                >
                  {TRAVEL_CATEGORY_LABEL[place.category]}
                </span>
                <button
                  onClick={() => onRemovePlace(place.id)}
                  className={`rounded-lg border p-1 ${
                    isDark
                      ? 'border-rose-800 text-rose-300 hover:bg-rose-950/40'
                      : 'border-rose-200 text-rose-500 hover:bg-rose-50'
                  }`}
                  aria-label="Remove activity"
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
