import React, { useState, useMemo, useCallback, useRef, useEffect, useDeferredValue } from 'react';
import { Search, Star, MapPin, Home, Building2, Trees, Mountain, Users, Bed, Bath, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Rental, Destination } from '../data/travelData';
import { ImageCarousel } from '../components/ImageCarousel';
import { PaginationControls } from '../components/PaginationControls';
import { BookingModal } from '../components/BookingModal';
import { ListingDetailsModal, type ListingDetailsItem } from '../components/ListingDetailsModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { prefetchImages } from '../utils/prefetchImages';

const typeConfig = {
  apartment: { icon: <Building2 size={14} />, label: 'Apartment', color: 'bg-blue-100 text-blue-700' },
  villa: { icon: <Home size={14} />, label: 'Villa', color: 'bg-purple-100 text-purple-700' },
  traditional: { icon: <Trees size={14} />, label: 'Traditional', color: 'bg-green-100 text-green-700' },
  chalet: { icon: <Mountain size={14} />, label: 'Chalet', color: 'bg-orange-100 text-orange-700' },
};

function LazyCard({ children, minHeight = 420 }: { children: React.ReactNode; minHeight?: number }) {
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
      {visible
        ? children
        : <div className="w-full bg-gray-100 rounded-2xl animate-pulse" style={{ minHeight }} />}
    </div>
  );
}

export default function RentalsPage() {
  const { t, translateDynamic, addFavorite, removeFavorite, isFavorite, formatPrice, theme, publicRentals, publicDestinations } = useApp();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [destFilter, setDestFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minGuests, setMinGuests] = useState(1);
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'price_desc'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [activeItem, setActiveItem] = useState<ListingDetailsItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sliderMaxPrice = useMemo(
    () => Math.max(700, ...publicRentals.map((rental) => Number(rental.pricePerNight) || 0)),
    [publicRentals],
  );
  const effectiveMaxPrice = maxPrice ?? sliderMaxPrice;
  const selectTriggerToneClass = theme === 'dark'
    ? 'rounded-2xl border border-slate-500/70 bg-[#162338]/90 px-4 text-sm font-medium text-slate-100 shadow-[0_8px_18px_rgba(2,6,23,0.35)] data-[placeholder]:text-slate-300 [&_svg]:text-slate-300 focus-visible:border-sky-300 focus-visible:ring-sky-300/30'
    : 'rounded-2xl border-[#D9E2EC] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm focus-visible:border-[#60A5FA] focus-visible:ring-[#60A5FA]/25';
  const selectContentToneClass = theme === 'dark'
    ? 'z-[120] rounded-[16px] border border-slate-500/70 bg-[#152338]/95 p-1 text-slate-100 shadow-[0_18px_36px_rgba(2,6,23,0.58)] backdrop-blur'
    : 'z-[120] rounded-[16px] border border-[#D9E2EC] bg-white p-1 shadow-xl';
  const selectItemToneClass = theme === 'dark'
    ? 'rounded-xl px-3 py-2 text-sm font-medium text-slate-100 focus:bg-[#264160] focus:text-white data-[state=checked]:bg-[#D7E7FB] data-[state=checked]:text-[#0F2747]'
    : 'rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]';

  const typeCounts = useMemo(() => ({
    all: publicRentals.length,
    villa: publicRentals.filter(r => r.type === 'villa').length,
    apartment: publicRentals.filter(r => r.type === 'apartment').length,
    traditional: publicRentals.filter(r => r.type === 'traditional').length,
    chalet: publicRentals.filter(r => r.type === 'chalet').length,
  }), [publicRentals]);

  const filtered = useMemo(() => {
    const f = publicRentals.filter(r => {
      const normalizedSearch = deferredSearch.toLowerCase();
      const matchSearch = r.name.toLowerCase().includes(normalizedSearch) || r.location.toLowerCase().includes(normalizedSearch);
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      const matchDest = destFilter === 'all' || r.destinationId === destFilter;
      const matchPrice = r.pricePerNight <= effectiveMaxPrice;
      const matchGuests = r.maxGuests >= minGuests;
      return matchSearch && matchType && matchDest && matchPrice && matchGuests;
    });
    if (sortBy === 'rating') return [...f].sort((a, b) => b.rating - a.rating);
    if (sortBy === 'price_asc') return [...f].sort((a, b) => a.pricePerNight - b.pricePerNight);
    return [...f].sort((a, b) => b.pricePerNight - a.pricePerNight);
  }, [publicRentals, deferredSearch, typeFilter, destFilter, effectiveMaxPrice, minGuests, sortBy]);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRentals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);
  const destinationById = useMemo(
    () => new Map(publicDestinations.map((destination) => [destination.id, destination])),
    [publicDestinations],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, deferredSearch, typeFilter, destFilter, effectiveMaxPrice, minGuests, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const nextPageStart = currentPage * pageSize;
    const nextPageRentals = filtered.slice(nextPageStart, nextPageStart + pageSize);
    prefetchImages(nextPageRentals.map((rental) => rental.images[0]));
  }, [filtered, currentPage, pageSize]);

  const handleFavorite = useCallback((e: React.MouseEvent, rental: Rental) => {
    e.stopPropagation();
    if (isFavorite(rental.id)) removeFavorite(rental.id);
    else addFavorite({ id: rental.id, type: 'rental', name: rental.name, image: rental.images[0], price: rental.pricePerNight, rating: rental.rating, location: rental.location });
  }, [isFavorite, addFavorite, removeFavorite]);

  const openRentalDetails = useCallback((rental: Rental) => {
    const destination = destinationById.get(rental.destinationId);
    setActiveItem({
      id: rental.id,
      kind: 'rental',
      name: rental.name,
      location: rental.location,
      images: rental.images,
      rating: rental.rating,
      reviews: rental.reviews,
      pricePerNight: rental.pricePerNight,
      description: rental.description,
      amenities: rental.amenities,
      typeLabel: rental.type.charAt(0).toUpperCase() + rental.type.slice(1),
      host: rental.host,
      bedrooms: rental.bedrooms,
      bathrooms: rental.bathrooms,
      maxGuests: rental.maxGuests,
      lat: destination?.lat,
      lng: destination?.lng,
    });
    setIsBookingOpen(false);
    setIsDetailsOpen(true);
  }, [destinationById]);

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
        <img
          src="/images/_site/hero-rentals.jpg"
          alt="Rentals"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/68 via-emerald-950/44 to-cyan-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_44%)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="text-4xl font-black text-white [text-shadow:0_4px_18px_rgba(2,6,23,0.55)] mb-2">{t('section.rentals')}</h1>
          <p className="text-white/85">{t('section.rentals_sub')}</p>
        </div>
      </div>

      {/* Type Cards */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {([
              { value: 'all', label: 'All Types', icon: '🏡', count: typeCounts.all },
              { value: 'villa', label: 'Villas', icon: '🏰', count: typeCounts.villa },
              { value: 'apartment', label: 'Apartments', icon: '🏢', count: typeCounts.apartment },
              { value: 'traditional', label: 'Traditional', icon: '🌿', count: typeCounts.traditional },
              { value: 'chalet', label: 'Chalets', icon: '⛰️', count: typeCounts.chalet },
            ] as const).map(type => (
              <button type="button" key={type.value} onClick={() => setTypeFilter(type.value)}
                className={`shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${typeFilter === type.value ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="text-xl">{type.icon}</span>
                <div className="text-left">
                  <div className={`text-sm font-semibold ${typeFilter === type.value ? 'text-cyan-700' : 'text-gray-700'}`}>{translateDynamic(type.label)}</div>
                  <div className="text-xs text-gray-400">{type.count} {translateDynamic('listings')}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
              <Search size={15} className="text-gray-400" />
              <input type="text" placeholder={translateDynamic('Search rentals...')} value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder-gray-400" />
            </div>
            <Select value={destFilter} onValueChange={setDestFilter}>
              <SelectTrigger className={`h-[46px] w-full sm:w-[220px] ${selectTriggerToneClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                className={selectContentToneClass}
              >
                <SelectItem value="all" className={selectItemToneClass}>
                  {translateDynamic('All Destinations')}
                </SelectItem>
                {publicDestinations.map((destination: Destination) => (
                  <SelectItem
                    key={destination.id}
                    value={destination.id}
                    className={selectItemToneClass}
                  >
                    {destination.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'rating' | 'price_asc' | 'price_desc')}>
              <SelectTrigger className={`h-[46px] w-full sm:w-[220px] ${selectTriggerToneClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                className={selectContentToneClass}
              >
                <SelectItem value="rating" className={selectItemToneClass}>
                  {translateDynamic('Top Rated')}
                </SelectItem>
                <SelectItem value="price_asc" className={selectItemToneClass}>
                  {translateDynamic('Price: Low to High')}
                </SelectItem>
                <SelectItem value="price_desc" className={selectItemToneClass}>
                  {translateDynamic('Price: High to Low')}
                </SelectItem>
              </SelectContent>
            </Select>
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              <SlidersHorizontal size={15} /> {translateDynamic('Filters')}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {translateDynamic('Max Price')}: {formatPrice(effectiveMaxPrice)}/{t('common.per_night')}
                </label>
                <input
                  type="range"
                  min={50}
                  max={sliderMaxPrice}
                  value={effectiveMaxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{translateDynamic('Min. Guests Capacity')}</label>
                <div className="flex gap-2">
                  {[1, 2, 4, 6, 8].map(g => (
                    <button type="button" key={g} onClick={() => setMinGuests(g)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${minGuests === g ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                      {g}+
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-sm text-gray-500 mb-6">
          {filtered.length} {translateDynamic('rentals available')}
        </p>

        <PaginationControls
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          tone="emerald"
          className="mt-0 mb-6"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {paginatedRentals.map((rental, index) => (
            <LazyCard key={rental.id} minHeight={420}>
              <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="relative h-56 overflow-hidden shrink-0">
                  <ImageCarousel images={rental.images} className="h-56" showIndicators={false} showCounter={false} priority={index < 3} />
                  <div className="absolute top-3 left-3">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full ${typeConfig[rental.type].color}`}>
                      {typeConfig[rental.type].icon} {translateDynamic(typeConfig[rental.type].label)}
                    </span>
                  </div>
                  <button onClick={e => handleFavorite(e, rental)}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow ${
                      theme === 'dark' ? 'bg-slate-900/85' : 'bg-white/90'
                    }`}>
                    {isFavorite(rental.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{rental.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{rental.location}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-xl font-black text-gray-900">{formatPrice(rental.pricePerNight)}</div>
                      <div className="text-xs text-gray-400">{t('common.per_night')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{rental.rating}</span>
                      <span className="text-xs text-gray-400">({rental.reviews})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 ml-auto">
                      <span className="flex items-center gap-1"><Bed size={11} /> {rental.bedrooms} {translateDynamic('bed')}</span>
                      <span className="flex items-center gap-1"><Bath size={11} /> {rental.bathrooms} {translateDynamic('bath')}</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {rental.maxGuests}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{translateDynamic(rental.description)}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {rental.amenities.slice(0, 4).map(a => (
                      <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{translateDynamic(a)}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {rental.host[0]}
                    </div>
                    <span>{translateDynamic('Hosted by')} <strong className="text-gray-700">{translateDynamic(rental.host)}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openRentalDetails(rental)}
                    className="mt-auto w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                    {t('common.view_details')}
                  </button>
                </div>
              </div>
            </LazyCard>
          ))}
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          tone="emerald"
        />
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
