import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Minus, Plus, X } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { AssistantListing, BookingDraft } from '../../chat/types';

interface ChatBookingWidgetProps {
  listings: AssistantListing[];
  defaultListingId?: string;
  formatPrice: (price: number) => string;
  onSubmit: (draft: BookingDraft) => Promise<void> | void;
  onCancel: () => void;
}

function toDisplayDate(date?: Date) {
  return date ? format(date, 'MMM d, yyyy') : 'Select date';
}

function toIsoDate(date?: Date) {
  return date ? format(date, 'yyyy-MM-dd') : '';
}

export function ChatBookingWidget({
  listings,
  defaultListingId,
  formatPrice,
  onSubmit,
  onCancel,
}: ChatBookingWidgetProps) {
  const [selectedListingId, setSelectedListingId] = useState(defaultListingId || listings[0]?.id || '');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedListing = useMemo(() => {
    return listings.find((listing) => listing.id === selectedListingId) || listings[0];
  }, [listings, selectedListingId]);

  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / oneDay));
  }, [dateRange]);

  const subtotal = (selectedListing?.pricePerNight || 0) * nights;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + serviceFee;
  const isValid = Boolean(selectedListing && dateRange?.from && dateRange?.to && nights > 0);

  const handleSubmit = async () => {
    if (!selectedListing || !isValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        listingId: selectedListing.id,
        checkIn: toIsoDate(dateRange?.from),
        checkOut: toIsoDate(dateRange?.to),
        guests,
        total,
        note: note.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="travel-shell border border-[#D9E2EC] bg-white p-4 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Reservation Request</h3>
          <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
            Choose dates, guests, and send a booking request in chat.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="travel-icon-button p-2 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#243144] dark:hover:text-[#F9FAFB]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Property</label>
          <Select value={selectedListingId} onValueChange={setSelectedListingId}>
            <SelectTrigger className="travel-select-trigger h-11 rounded-[18px] text-sm">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent className="travel-select-content">
              {listings.map((listing) => (
                <SelectItem key={listing.id} value={listing.id} className="travel-select-item">
                  {listing.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Stay Dates</label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="travel-input-field travel-date-input inline-flex h-11 w-full items-center justify-between text-left text-sm"
              >
                <span className="text-[#0F172A] dark:text-[#F9FAFB]">
                  {dateRange?.from && dateRange?.to
                    ? `${toDisplayDate(dateRange.from)} - ${toDisplayDate(dateRange.to)}`
                    : 'Select check-in and check-out'}
                </span>
                <CalendarDays size={16} className="text-[#64748B] dark:text-[#94A3B8]" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              portalled={false}
              side="bottom"
              align="start"
              className="travel-calendar-popover w-[332px] max-w-[calc(100vw-2rem)] p-4"
            >
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(nextRange) => setDateRange(nextRange)}
                disabled={{ before: startOfToday() }}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Guests</label>
          <div className="travel-input-field flex h-11 items-center justify-between">
            <button
              type="button"
              onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
              className="travel-icon-button p-1 text-[#475569] hover:bg-[#EFF6FF] dark:text-[#CBD5E1] dark:hover:bg-[#243144]"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests((prev) => Math.min(16, prev + 1))}
              className="travel-icon-button p-1 text-[#475569] hover:bg-[#EFF6FF] dark:text-[#CBD5E1] dark:hover:bg-[#243144]"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Message (optional)</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Early check-in request, room preference..."
            rows={3}
            className="travel-input-field w-full resize-none text-sm"
          />
        </div>
      </div>

      <div className="travel-summary-box mt-4 border border-[#D9E2EC] bg-[#F1F5F9] p-3 dark:border-[#334155] dark:bg-[#1F2937]">
        <div className="flex items-center justify-between text-xs text-[#475569] dark:text-[#CBD5E1]">
          <span>Nightly rate</span>
          <span className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">
            {selectedListing ? formatPrice(selectedListing.pricePerNight) : '--'} / night
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[#475569] dark:text-[#CBD5E1]">
          <span>Nights</span>
          <span className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{nights || '--'}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[#475569] dark:text-[#CBD5E1]">
          <span>Service fee</span>
          <span className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{formatPrice(serviceFee)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[#D9E2EC] pt-2 text-sm font-bold text-[#0F172A] dark:border-[#334155] dark:text-[#F9FAFB]">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onCancel} className="travel-secondary-button flex-1 px-3 py-2.5 text-xs font-semibold">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="travel-primary-button inline-flex flex-1 items-center justify-center gap-1 px-3 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={14} />
          {isSubmitting ? 'Submitting...' : 'Send reservation'}
        </button>
      </div>
    </div>
  );
}
