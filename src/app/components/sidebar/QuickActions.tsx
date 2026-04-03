import React from 'react';
import { Plus, Sparkles, Trash2, Copy, Utensils, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import type { TravelDayMode } from '../../types/travel';

type QuickActionsProps = {
  onAddDay: () => void;
  onAddActivity: () => void;
  onSuggestDay: (mode: TravelDayMode) => void;
  onClearDay: () => void;
  onDuplicateDay: () => void;
  onAddRestaurant: () => void;
  onAddAttraction: () => void;
  onSuggestItinerary: () => void;
};

export function QuickActions({
  onAddDay,
  onAddActivity,
  onSuggestDay,
  onClearDay,
  onDuplicateDay,
  onAddRestaurant,
  onAddAttraction,
  onSuggestItinerary,
}: QuickActionsProps) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border p-3 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}
      style={{ borderColor: isDark ? '#334155' : '#D9E3F0' }}
    >
      <h3 className={`mb-3 text-sm font-black ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>Quick actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" size="sm" onClick={onAddDay}><Plus size={14} />Add Day</Button>
        <Button variant="secondary" size="sm" onClick={onAddActivity}><Plus size={14} />Add Activity</Button>
        <Button variant="secondary" size="sm" onClick={() => onSuggestDay('full-day')}><Sparkles size={14} />Suggest Day</Button>
        <Button variant="secondary" size="sm" onClick={onSuggestItinerary}><Sparkles size={14} />Suggest itinerary</Button>
        <Button variant="secondary" size="sm" onClick={onAddRestaurant}><Utensils size={14} />Add Restaurant</Button>
        <Button variant="secondary" size="sm" onClick={onAddAttraction}><Camera size={14} />Add Attraction</Button>
        <Button variant="secondary" size="sm" onClick={onDuplicateDay}><Copy size={14} />Duplicate Day</Button>
        <Button variant="danger" size="sm" onClick={onClearDay}><Trash2 size={14} />Clear Day</Button>
      </div>
    </div>
  );
}
