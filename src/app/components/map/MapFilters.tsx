import React from 'react';
import { useApp } from '../../context/AppContext';
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
  const { t, translateDynamic } = useApp();
  const tripOptions = options.trips.map((option) => ({
    ...option,
    label: option.value === 'all' ? t('planner.filter.all_trips') : translateDynamic(option.label),
  }));
  const countryOptions = options.countries.map((option) => ({
    ...option,
    label: option.value === 'all' ? t('planner.filter.all_countries') : translateDynamic(option.label),
  }));
  const cityOptions = options.cities.map((option) => ({
    ...option,
    label: option.value === 'all' ? t('planner.filter.all_cities') : translateDynamic(option.label),
  }));
  const categoryOptions = options.categories.map((option) => ({
    ...option,
    label: option.value === 'all' ? t('planner.filter.all_categories') : t(`planner.category.${option.value}`),
  }));

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <Select label={t('planner.filter.trip')} value={filters.tripId} options={tripOptions} onChange={onTripChange} />
      <Select label={t('planner.filter.country')} value={filters.country} options={countryOptions} onChange={onCountryChange} />
      <Select label={t('planner.filter.city')} value={filters.city} options={cityOptions} onChange={onCityChange} />
      <Select
        label={t('planner.filter.category')}
        value={filters.category}
        options={categoryOptions}
        onChange={onCategoryChange}
      />
    </div>
  );
}
