import React from 'react';
import { TRAVEL_CATEGORY_LABEL, TRAVEL_COLORS, type TravelCategory } from '../../types/travel';

type MapLegendProps = {
  showing: number;
  total: number;
};

const categories: TravelCategory[] = ['hotel', 'rental', 'activity', 'restaurant', 'stop'];

export function MapLegend({ showing, total }: MapLegendProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {categories.map((category) => (
        <span
          key={category}
          className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600"
          style={{ borderColor: TRAVEL_COLORS.border }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TRAVEL_COLORS.category[category] }} />
          {TRAVEL_CATEGORY_LABEL[category]}
        </span>
      ))}
      <span
        className="ml-auto inline-flex items-center rounded-full border bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700"
        style={{ borderColor: TRAVEL_COLORS.border }}
      >
        Showing {showing} / {total}
      </span>
    </div>
  );
}
