import React from 'react';
import { CalendarDays, CalendarRange, PiggyBank, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { useTravelPlanner } from '../../hooks/useTravelPlanner';
import { calculateDayCost } from '../../utils/travelBudget';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { MapFilters } from '../map/MapFilters';
import { MapLegend } from '../map/MapLegend';
import { TripMap } from '../map/TripMap';
import { DayCard } from '../days/DayCard';
import { QuickActions } from '../sidebar/QuickActions';
import { StayFavorites } from '../sidebar/StayFavorites';
import type { TravelDayMode } from '../../types/travel';
import { TRAVEL_MODE_LABEL } from '../../types/travel';

const suggestModes: TravelDayMode[] = ['full-day', 'food', 'attractions', 'mixed'];

const parseIsoDate = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const toIsoDate = (date?: Date) => (date ? format(date, 'yyyy-MM-dd') : '');

type PlannerDateFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  minDate?: string;
};

function PlannerDateField({ label, value, onChange, minDate }: PlannerDateFieldProps) {
  const selected = parseIsoDate(value);
  const min = parseIsoDate(minDate);

  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">
      {label}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-2xl border bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:ring-2"
            style={{ borderColor: '#D9E3F0' }}
          >
            <span>{selected ? format(selected, 'MM/dd/yyyy') : 'Select date'}</span>
            <CalendarDays size={15} className="text-slate-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto rounded-2xl border border-[#D9E3F0] bg-white p-3 shadow-[0_18px_46px_rgba(15,23,42,0.18)]"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(toIsoDate(date || undefined))}
            disabled={min ? { before: min } : undefined}
            initialFocus
          />
          <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => onChange(toIsoDate(new Date()))}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              Today
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </label>
  );
}

export default function TravelPlannerWorkspace() {
  const { formatPrice, translateDynamic } = useApp();
  const planner = useTravelPlanner();

  const activeDayId = planner.activeDay?.id || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1450px] space-y-4 p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-3">
          <section className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: '#D9E3F0' }}>
            <h2 className="mb-3 text-base font-black text-slate-900">Trip Settings</h2>
            <div className="grid gap-2">
              <Select
                label="Active trip"
                value={planner.activeTripId}
                options={planner.filterOptions.trips.filter((trip) => trip.value !== 'all')}
                onChange={planner.setTripFilter}
              />
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">
                Trip name
                <input
                  value={planner.activeTrip?.name || ''}
                  onChange={(event) => planner.updateTripSettings({ name: event.target.value })}
                  className="h-10 rounded-xl border px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2"
                  style={{ borderColor: '#D9E3F0' }}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">
                Destination
                <input
                  value={planner.activeTrip?.destination || ''}
                  onChange={(event) => planner.updateTripSettings({ destination: event.target.value })}
                  className="h-10 rounded-xl border px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2"
                  style={{ borderColor: '#D9E3F0' }}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <PlannerDateField
                  label="Start date"
                  value={planner.activeTrip?.startDate || ''}
                  onChange={(next) => planner.updateTripSettings({ startDate: next })}
                />
                <PlannerDateField
                  label="End date"
                  value={planner.activeTrip?.endDate || ''}
                  minDate={planner.activeTrip?.startDate || ''}
                  onChange={(next) => planner.updateTripSettings({ endDate: next })}
                />
              </div>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">
                Budget target
                <input
                  type="number"
                  min={0}
                  value={planner.activeTrip?.budget || 0}
                  onChange={(event) => planner.updateTripSettings({ budget: Number(event.target.value) || 0 })}
                  className="h-10 rounded-xl border px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2"
                  style={{ borderColor: '#D9E3F0' }}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: '#D9E3F0' }}>
            <h2 className="mb-3 text-base font-black text-slate-900">Suggest Settings</h2>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {suggestModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => planner.activeDay && planner.suggestDay(planner.activeDay.id, mode)}
                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                      planner.activeSuggestMode === mode
                        ? 'border-transparent bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {TRAVEL_MODE_LABEL[mode]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => planner.activeDay && planner.suggestDay(planner.activeDay.id, 'full-day')}
                >
                  <Sparkles size={14} />
                  Suggest Day
                </Button>
                <Button variant="secondary" size="sm" onClick={planner.suggestItinerary}>
                  <Sparkles size={14} />
                  Suggest itinerary
                </Button>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3 text-xs text-slate-600" style={{ borderColor: '#D9E3F0' }}>
                Selected mode applies instant suggestions and updates day cards + map in sync.
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: '#D9E3F0' }}>
            <h2 className="mb-3 text-base font-black text-slate-900">Budget Summary</h2>
            <div className="grid gap-2">
              <div className="rounded-xl border bg-slate-50 p-3" style={{ borderColor: '#D9E3F0' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total trip</span>
                  <PiggyBank size={16} className="text-slate-500" />
                </div>
                <div className="mt-1 text-xl font-black text-slate-900">{formatPrice(planner.budget?.total || 0)}</div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3" style={{ borderColor: '#D9E3F0' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Average / day</span>
                  <CalendarRange size={16} className="text-slate-500" />
                </div>
                <div className="mt-1 text-xl font-black text-slate-900">{formatPrice(planner.budget?.averagePerDay || 0)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(planner.budget?.byCategory || {}).map(([category, value]) => (
                  <div key={category} className="rounded-lg border bg-white p-2 text-slate-600" style={{ borderColor: '#D9E3F0' }}>
                    <div className="font-semibold">{translateDynamic(category)}</div>
                    <div className="mt-0.5 text-sm font-black text-slate-900">{formatPrice(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <aside className="space-y-4 xl:col-span-4">
            <StayFavorites
              places={planner.visibleSidebarPlaces}
              favorites={planner.favorites}
              selectedPlaceId={planner.selectedPlaceId}
              dayPlaceIds={planner.dayPlaceIds}
              onSelectPlace={planner.selectPlaceFromList}
              onQuickAdd={(placeId) => activeDayId && planner.addPlaceToDay(activeDayId, placeId)}
              onToggleFavorite={planner.toggleFavorite}
              onCategoryFilter={planner.setCategoryFilter}
            />

            <QuickActions
              onAddDay={planner.addDay}
              onAddActivity={() => activeDayId && planner.addActivity(activeDayId)}
              onSuggestDay={(mode) => activeDayId && planner.suggestDay(activeDayId, mode)}
              onClearDay={() => activeDayId && planner.clearDay(activeDayId)}
              onDuplicateDay={() => activeDayId && planner.duplicateDay(activeDayId)}
              onAddRestaurant={() => activeDayId && planner.addRestaurant(activeDayId)}
              onAddAttraction={() => activeDayId && planner.addAttraction(activeDayId)}
              onSuggestItinerary={planner.suggestItinerary}
            />
          </aside>

          <main className="space-y-4 xl:col-span-8">
            <section
              className="rounded-2xl border bg-white p-4 shadow-sm xl:sticky xl:top-20 xl:z-10"
              style={{ borderColor: '#D9E3F0' }}
            >
              <h2 className="text-lg font-black text-slate-900">Map / stops preview</h2>
              <p className="mb-3 text-sm text-slate-500">
                Real-time map updates for Trip / Country / City / Category filters with list synchronization.
              </p>
              <MapFilters
                filters={planner.filters}
                options={planner.filterOptions}
                onTripChange={planner.setTripFilter}
                onCountryChange={planner.setCountryFilter}
                onCityChange={planner.setCityFilter}
                onCategoryChange={planner.setCategoryFilter}
              />
              <div className="mt-3">
                <TripMap
                  places={planner.filteredPlaces}
                  selectedPlaceId={planner.selectedPlaceId}
                  focusedPlaceId={planner.mapController.focusedPlaceId}
                  focusNonce={planner.mapController.focusNonce}
                  onPlaceSelect={planner.selectPlaceFromMap}
                />
              </div>
              <MapLegend showing={planner.filteredPlaces.length} total={planner.allPlaces.length} />
            </section>

            <section className="space-y-3">
              {planner.activeTrip?.days.map((day, index) => (
                <DayCard
                  key={day.id}
                  day={day}
                  dayIndex={index}
                  dayCost={calculateDayCost(day)}
                  isActive={planner.activeDayId === day.id}
                  selectedPlaceId={planner.selectedPlaceId}
                  onSelectDay={() => planner.selectDay(day.id)}
                  onModeChange={(mode) => planner.setDayMode(day.id, mode)}
                  onAddActivity={() => planner.addActivity(day.id)}
                  onSuggestDay={() => planner.suggestDay(day.id, planner.activeSuggestMode)}
                  onClearDay={() => planner.clearDay(day.id)}
                  onDuplicateDay={() => planner.duplicateDay(day.id)}
                  onAddRestaurant={() => planner.addRestaurant(day.id)}
                  onAddAttraction={() => planner.addAttraction(day.id)}
                  onAddFirstActivity={() => planner.addActivity(day.id)}
                  onSuggestItinerary={planner.suggestItinerary}
                  onSelectPlace={planner.selectPlaceFromList}
                  onRemovePlace={(placeId) => planner.removePlaceFromDay(day.id, placeId)}
                />
              ))}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
