import React from 'react';
import { Copy, Sparkles, Trash2, Utensils, Camera, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import type { TravelDayMode } from '../../types/travel';
import { TRAVEL_MODE_LABEL } from '../../types/travel';

type DayToolbarProps = {
  mode: TravelDayMode;
  onModeChange: (mode: TravelDayMode) => void;
  onAddActivity: () => void;
  onSuggestDay: () => void;
  onClearDay: () => void;
  onDuplicateDay: () => void;
  onAddRestaurant: () => void;
  onAddAttraction: () => void;
};

const modes: TravelDayMode[] = ['full-day', 'food', 'attractions', 'mixed'];

export function DayToolbar({
  mode,
  onModeChange,
  onAddActivity,
  onSuggestDay,
  onClearDay,
  onDuplicateDay,
  onAddRestaurant,
  onAddAttraction,
}: DayToolbarProps) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {modes.map((entry) => (
        <button
          key={entry}
          onClick={() => onModeChange(entry)}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold transition ${
            mode === entry
              ? 'border-transparent bg-slate-900 text-white'
              : isDark
                ? 'border-slate-600 bg-slate-800 text-slate-300'
                : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          {TRAVEL_MODE_LABEL[entry]}
        </button>
      ))}

      <Button size="sm" variant="secondary" onClick={onAddActivity}><Plus size={12} />Add Activity</Button>
      <Button size="sm" variant="secondary" onClick={onAddRestaurant}><Utensils size={12} />Food</Button>
      <Button size="sm" variant="secondary" onClick={onAddAttraction}><Camera size={12} />Attractions</Button>
      <Button size="sm" variant="secondary" onClick={onSuggestDay}><Sparkles size={12} />Suggest</Button>
      <Button size="sm" variant="secondary" onClick={onDuplicateDay}><Copy size={12} />Duplicate</Button>
      <Button size="sm" variant="danger" onClick={onClearDay}><Trash2 size={12} />Clear</Button>
    </div>
  );
}
