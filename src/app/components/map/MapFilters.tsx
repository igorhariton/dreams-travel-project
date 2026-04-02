import React from 'react';
import type { TravelFilterOptions, TravelFilters } from '../../types/travel';
import { Select } from '../common/Select';

type MapFiltersProps = {
  filters: TravelFilters;
  options: TravelFilterOptions;
  onTripChange: (tripId: string) => void;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  onCategoryChange: (category: TravelFilters['category']) => void;
};

export function MapFilters({
  filters,
  options,
  onTripChange,
  onCountryChange,
  onCityChange,
  onCategoryChange,
}: MapFiltersProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <Select label="Trip" value={filters.tripId} options={options.trips} onChange={onTripChange} />
      <Select label="Country" value={filters.country} options={options.countries} onChange={onCountryChange} />
      <Select label="City" value={filters.city} options={options.cities} onChange={onCityChange} />
      <Select
        label="Category"
        value={filters.category}
        options={options.categories}
        onChange={onCategoryChange}
      />
    </div>
  );
}
