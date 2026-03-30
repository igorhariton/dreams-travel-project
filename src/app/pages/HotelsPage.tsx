import React, { useState, useMemo, useCallback, useRef, useEffect, useDeferredValue } from 'react';
import { Search, Star, MapPin, SlidersHorizontal, Wifi, Coffee, Car, Waves, Dumbbell, Utensils } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hotels, destinations } from '../data/travelData';
import { ImageCarousel } from '../components/ImageCarousel';
import { BookingModal } from '../components/BookingModal';
import { ListingDetailsModal, type ListingDetailsItem } from '../components/ListingDetailsModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const amenityIcons: Record<string, React.ReactNode> = {
  'Wifi': <Wifi size={13} />,
  'Pool': <Waves size={13} />,
  'Gym': <Dumbbell size={13} />,
  'Restaurant': <Utensils size={13} />,
  'Parking': <Car size={13} />,
  'Spa': <span>💆</span>,
};

// Renders children only when visible in viewport
function LazyCard({ children, minHeight = 320 }: { children: React.ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight }}>
      {visible ? children : <div className="w-full h-full bg-gray-100 rounded-2xl animate-pulse" style={{ minHeight }} />}
    </div>
  );
}

export default function HotelsPage() {
  const { t, translateDynamic, addFavorite, removeFavorite, isFavorite, formatPrice } = useApp();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [destFilter, setDestFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minStars, setMinStars] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'price_desc'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [activeItem, setActiveItem] = useState<ListingDetailsItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    const f = hotels.filter(h => {
      const normalizedSearch = deferredSearch.toLowerCase();
      const matchSearch = h.name.toLowerCase().includes(normalizedSearch) || h.location.toLowerCase().includes(normalizedSearch);
      const matchDest = destFilter === 'all' || h.destinationId === destFilter;
      const matchPrice = h.pricePerNight <= maxPrice;
      const matchStars = h.stars >= minStars;
      return matchSearch && matchDest && matchPrice && matchStars;
    });
    if (sortBy === 'rating') return [...f].sort((a, b) => b.rating - a.rating);
    if (sortBy === 'price_asc') return [...f].sort((a, b) => a.pricePerNight - b.pricePerNight);
    return [...f].sort((a, b) => b.pricePerNight - a.pricePerNight);
  }, [deferredSearch, destFilter, maxPrice, minStars, sortBy]);

  const handleFavoriteHotel = useCallback((e: React.MouseEvent, hotel: typeof hotels[0]) => {
    e.stopPropagation();
    if (isFavorite(hotel.id)) removeFavorite(hotel.id);
    else addFavorite({ id: hotel.id, type: 'hotel', name: hotel.name, image: hotel.images[0], price: hotel.pricePerNight, rating: hotel.rating, location: hotel.location });
  }, [isFavorite, addFavorite, removeFavorite]);

  const openHotelDetails = useCallback((hotel: typeof hotels[0]) => {
    setActiveItem({
      id: hotel.id,
      kind: 'hotel',
      name: hotel.name,
      location: hotel.location,
      images: hotel.images,
      rating: hotel.rating,
      reviews: hotel.reviews,
      pricePerNight: hotel.pricePerNight,
      description: hotel.description,
      amenities: hotel.amenities,
      typeLabel: hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1),
      stars: hotel.stars,
    });
    setIsBookingOpen(false);
    setIsDetailsOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setIsDetailsOpen(false);
    if (!isBookingOpen) setActiveItem(null);
  }, [isBookingOpen]);

  const startBooking = useCallback(() => {
    setIsDetailsOpen(false);
    setIsBookingOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    setIsBookingOpen(false);
    setActiveItem(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative h-64 overflow-hidden">
        <img src="/images/_site/hero-hotels.jpg" alt="Hotels" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 to-blue-900/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="text-4xl font-black text-white mb-2">{t('section.featured_hotels')}</h1>
          <p className="text-white/80">{t('section.featured_hotels_sub')}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
              <Search size={15} className="text-gray-400" />
              <input type="text" placeholder={translateDynamic('Search hotels...')} value={search} onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder-gray-400" />
            </div>
            <Select value={destFilter} onValueChange={setDestFilter}>
              <SelectTrigger className="h-[46px] w-full sm:w-[220px] rounded-2xl border-[#D9E2EC] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm focus-visible:border-[#60A5FA] focus-visible:ring-[#60A5FA]/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                className="z-[120] max-h-80 rounded-[16px] border border-[#D9E2EC] bg-white p-1 shadow-xl"
              >
                <SelectItem value="all" className="rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]">
                  {translateDynamic('All Destinations')}
                </SelectItem>
                {destinations.map(d => (
                  <SelectItem
                    key={d.id}
                    value={d.id}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]"
                  >
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'rating' | 'price_asc' | 'price_desc')}>
              <SelectTrigger className="h-[46px] w-full sm:w-[200px] rounded-2xl border-[#D9E2EC] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm focus-visible:border-[#60A5FA] focus-visible:ring-[#60A5FA]/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                className="z-[120] rounded-[16px] border border-[#D9E2EC] bg-white p-1 shadow-xl"
              >
                <SelectItem value="rating" className="rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]">
                  {translateDynamic('Top Rated')}
                </SelectItem>
                <SelectItem value="price_asc" className="rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]">
                  {translateDynamic('Price: Low to High')}
                </SelectItem>
                <SelectItem value="price_desc" className="rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]">
                  {translateDynamic('Price: High to Low')}
                </SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              <SlidersHorizontal size={15} /> {t('common.filter')}
            </button>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>⊞</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>☰</button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{translateDynamic('Max Price')}: {formatPrice(maxPrice)}/{t('common.per_night')}</label>
                <input type="range" min={50} max={1000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{translateDynamic('Min Stars')}</label>
                <div className="flex gap-2">
                  {[0, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setMinStars(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${minStars === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                      {s === 0 ? translateDynamic('Any') : `${s}★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-sm text-gray-500 mb-6">{filtered.length} {translateDynamic('hotels available')}</p>

        {viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map(hotel => (
              <LazyCard key={hotel.id} minHeight={380}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                  <div className="relative h-56 overflow-hidden shrink-0">
                    <ImageCarousel images={hotel.images} className="h-56" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        {translateDynamic(hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1))}
                      </span>
                    </div>
                    <button onClick={e => handleFavoriteHotel(e, hotel)}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow">
                      {isFavorite(hotel.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{hotel.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{hotel.location}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xl font-black text-gray-900">{formatPrice(hotel.pricePerNight)}</div>
                        <div className="text-xs text-gray-400">{t('common.per_night')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                      ))}
                      <span className="text-sm font-semibold ml-1">{hotel.rating}</span>
                      <span className="text-xs text-gray-400">({hotel.reviews.toLocaleString()} {t('common.reviews')})</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{translateDynamic(hotel.description)}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {hotel.amenities.slice(0, 5).map(a => (
                        <span key={a} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                          {amenityIcons[a] || '•'} {translateDynamic(a)}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => openHotelDetails(hotel)}
                      className="mt-auto w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                      {t('common.view_details')}
                    </button>
                  </div>
                </div>
              </LazyCard>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(hotel => (
              <LazyCard key={hotel.id} minHeight={160}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex">
                  <div className="relative w-64 shrink-0 overflow-hidden">
                    <ImageCarousel images={hotel.images} className="h-full min-h-[160px]" />
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{hotel.name}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{hotel.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black text-gray-900">{formatPrice(hotel.pricePerNight)}</div>
                          <div className="text-xs text-gray-400">{t('common.per_night')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 mb-2">
                        {Array.from({ length: hotel.stars }).map((_, i) => (
                          <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                        ))}
                        <span className="text-sm font-semibold ml-1">{hotel.rating}</span>
                        <span className="text-xs text-gray-400">({hotel.reviews.toLocaleString()})</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-3">{translateDynamic(hotel.description)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {hotel.amenities.slice(0, 6).map(a => (
                          <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{translateDynamic(a)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={e => handleFavoriteHotel(e, hotel)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${isFavorite(hotel.id) ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {isFavorite(hotel.id) ? `❤️ ${translateDynamic('Saved')}` : `🤍 ${t('common.save')}`}
                      </button>
                      <button
                        onClick={() => openHotelDetails(hotel)}
                        className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                        {t('common.view_details')}
                      </button>
                    </div>
                  </div>
                </div>
              </LazyCard>
            ))}
          </div>
        )}
      </div>

      <ListingDetailsModal
        isOpen={isDetailsOpen}
        item={activeItem}
        onClose={closeDetails}
        onReserve={startBooking}
      />
      <BookingModal isOpen={isBookingOpen} onClose={closeBooking} item={activeItem} />
    </div>
  );
}
