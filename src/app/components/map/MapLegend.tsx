import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRAVEL_COLORS, type TravelCategory } from '../../types/travel';

type MapLegendProps = {
  showing: number;
  total: number;
};

const categories: TravelCategory[] = ['hotel', 'rental', 'activity', 'restaurant', 'stop'];

export function MapLegend({ showing, total }: MapLegendProps) {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {categories.map((category) => (
        <span
          key={category}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-600'
          }`}
          style={{ borderColor: isDark ? '#475569' : TRAVEL_COLORS.border }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TRAVEL_COLORS.category[category] }} />
          {t(`planner.category.${category}`)}
        </span>
      ))}
      <span
        className={`ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${
          isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-700'
        }`}
        style={{ borderColor: isDark ? '#475569' : TRAVEL_COLORS.border }}
      >
        {t('planner.showing')} {showing} / {total}
      </span>
    </div>
  );
}
