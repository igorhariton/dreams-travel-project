import React from 'react';
import { MapPin, Star, Users } from 'lucide-react';
import type { AssistantAction, AssistantListing } from '../../chat/types';

interface ChatListingCardsProps {
  listings: AssistantListing[];
  formatPrice: (price: number) => string;
  onAction: (action: AssistantAction) => void;
}

export function ChatListingCards({ listings, formatPrice, onAction }: ChatListingCardsProps) {
  if (listings.length === 0) return null;

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="travel-panel overflow-hidden border border-[#D9E2EC] bg-white shadow-sm dark:border-[#334155] dark:bg-[#1F2937]"
        >
          <div className="relative h-28 w-full overflow-hidden">
            <img src={listing.image} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
            <span className="travel-badge absolute left-2 top-2 bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">
              {listing.type === 'hotel' ? 'Hotel' : 'Rental'}
            </span>
          </div>
          <div className="p-3">
            <div className="line-clamp-1 text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">{listing.title}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <MapPin size={12} />
              <span className="line-clamp-1">{listing.location}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{formatPrice(listing.pricePerNight)} / night</span>
              <span className="inline-flex items-center gap-1 text-[#475569] dark:text-[#CBD5E1]">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                {listing.rating.toFixed(1)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {listing.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="travel-badge bg-[#EFF6FF] px-2 py-1 text-[10px] font-medium text-[#1D4ED8] dark:bg-[#243144] dark:text-[#CBD5E1]"
                >
                  {amenity}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onAction({
                    id: `book-${listing.id}`,
                    kind: 'book_now',
                    label: 'Book now',
                    payload: { listingId: listing.id },
                  })
                }
                className="travel-primary-button px-3 py-2 text-xs font-semibold text-white"
              >
                Book now
              </button>
              <button
                type="button"
                onClick={() =>
                  onAction({
                    id: `avail-${listing.id}`,
                    kind: 'check_availability',
                    label: 'Check availability',
                    payload: { listingId: listing.id },
                  })
                }
                className="travel-secondary-button inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold"
              >
                <Users size={12} />
                Availability
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

