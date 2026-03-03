import React, { useState } from 'react';
import { Search, Star, MapPin, Home, Building2, Trees, Mountain, Users, Bed, Bath, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { rentals } from '../data/travelData';
import { ImageCarousel } from '../components/ImageCarousel';
import { BookingModal } from '../components/BookingModal';

const typeConfig = {
  apartment: { icon: <Building2 size={14} />, label: 'Apartment', color: 'bg-blue-100 text-blue-700' },
  villa: { icon: <Home size={14} />, label: 'Villa', color: 'bg-purple-100 text-purple-700' },
  traditional: { icon: <Trees size={14} />, label: 'Traditional', color: 'bg-green-100 text-green-700' },
  chalet: { icon: <Mountain size={14} />, label: 'Chalet', color: 'bg-orange-100 text-orange-700' },
};

export default function RentalsPage() {
  const { t, addFavorite, removeFavorite, isFavorite, formatPrice } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState(700);
  const [minGuests, setMinGuests] = useState(1);
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'price_desc'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [bookingItem, setBookingItem] = useState<any>(null);

  let filtered = rentals.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchPrice = r.pricePerNight <= maxPrice;
    const matchGuests = r.maxGuests >= minGuests;
    return matchSearch && matchType && matchPrice && matchGuests;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price_asc') return a.pricePerNight - b.pricePerNight;
    return b.pricePerNight - a.pricePerNight;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative h-64 overflow-hidden">
        <img src="/images/_site/hero-rentals.jpg" alt="Rentals" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/80 to-emerald-900/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="text-4xl font-black text-white mb-2">{t('section.rentals')}</h1>
          <p className="text-white/80">{t('section.rentals_sub')}</p>
        </div>
      </div>

      {/* Type Cards */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {[
              { value: 'all', label: 'All Types', icon: '🏡', count: rentals.length },
              { value: 'villa', label: 'Villas', icon: '🏰', count: rentals.filter(r => r.type === 'villa').length },
              { value: 'apartment', label: 'Apartments', icon: '🏢', count: rentals.filter(r => r.type === 'apartment').length },
              { value: 'traditional', label: 'Traditional', icon: '🌿', count: rentals.filter(r => r.type === 'traditional').length },
              { value: 'chalet', label: 'Chalets', icon: '⛰️', count: rentals.filter(r => r.type === 'chalet').length },
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setTypeFilter(type.value)}
                className={`shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${typeFilter === type.value ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="text-xl">{type.icon}</span>
                <div className="text-left">
                  <div className={`text-sm font-semibold ${typeFilter === type.value ? 'text-cyan-700' : 'text-gray-700'}`}>{type.label}</div>
                  <div className="text-xs text-gray-400">{type.count} listings</div>
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
              <input type="text" placeholder="Search rentals..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder-gray-400" />
            </div>

            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-700 bg-white outline-none cursor-pointer hover:border-gray-300 transition-colors shadow-sm appearance-none">
              <option value="rating">Top Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              <SlidersHorizontal size={15} /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Max Price: {formatPrice(maxPrice)}/night</label>
                <input type="range" min={50} max={700} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-emerald-600" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Min. Guests Capacity</label>
                <div className="flex gap-2">
                  {[1, 2, 4, 6, 8].map(g => (
                    <button key={g} onClick={() => setMinGuests(g)}
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
        <p className="text-sm text-gray-500 mb-6">{filtered.length} rentals available</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filtered.map((rental, i) => (
            <motion.div key={rental.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
              <div className="relative h-56 overflow-hidden">
                <ImageCarousel images={rental.images} className="h-56" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full ${typeConfig[rental.type].color}`}>
                    {typeConfig[rental.type].icon} {typeConfig[rental.type].label}
                  </span>
                </div>
                <button
                  onClick={() => { if (isFavorite(rental.id)) removeFavorite(rental.id); else addFavorite({ id: rental.id, type: 'rental', name: rental.name, image: rental.images[0], price: rental.pricePerNight, rating: rental.rating, location: rental.location }); }}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow">
                  {isFavorite(rental.id) ? '❤️' : '🤍'}
                </button>
              </div>

              <div className="p-5">
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
                    <span className="flex items-center gap-1"><Bed size={11} /> {rental.bedrooms} bed</span>
                    <span className="flex items-center gap-1"><Bath size={11} /> {rental.bathrooms} bath</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {rental.maxGuests}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{rental.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {rental.amenities.slice(0, 4).map(a => (
                    <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{a}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {rental.host[0]}
                  </div>
                  <span>Hosted by <strong className="text-gray-700">{rental.host}</strong></span>
                </div>

                <button
                  onClick={() => setBookingItem({ name: rental.name, location: rental.location, pricePerNight: rental.pricePerNight, rating: rental.rating, image: rental.images[0] })}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                  {t('common.book_now')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <BookingModal isOpen={!!bookingItem} onClose={() => setBookingItem(null)} item={bookingItem} />
    </div>
  );
}
