import React, { useState } from 'react';
import { Heart, Star, MapPin, Trash2, ArrowRight, Hotel, Home as HomeIcon, Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { BookingModal } from '../components/BookingModal';

const typeConfig = {
  destination: { icon: <Globe2 size={14} />, color: 'bg-blue-100 text-blue-700', label: 'Destination' },
  hotel: { icon: <Hotel size={14} />, color: 'bg-purple-100 text-purple-700', label: 'Hotel' },
  rental: { icon: <HomeIcon size={14} />, color: 'bg-emerald-100 text-emerald-700', label: 'Rental' },
};

export default function FavoritesPage() {
  const { t, translateDynamic, favorites, removeFavorite, formatPrice } = useApp();
  const [filter, setFilter] = useState<'all' | 'destination' | 'hotel' | 'rental'>('all');
  const [bookingItem, setBookingItem] = useState<any>(null);

  const filtered = filter === 'all' ? favorites : favorites.filter(f => f.type === filter);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-600 to-pink-500 py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">{t('favorites.title')}</h1>
          <p className="text-white/80">{t('favorites.subtitle')}</p>
          {favorites.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-5 py-2 text-white text-sm">
              {favorites.length} {translateDynamic('saved')} {favorites.length === 1 ? translateDynamic('place') : translateDynamic('places')}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filter tabs */}
        {favorites.length > 0 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'destination', 'hotel', 'rental'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${filter === f ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {f === 'all' ? `❤️ ${translateDynamic('All')}` : translateDynamic(typeConfig[f].label)}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                  {f === 'all' ? favorites.length : favorites.filter(fav => fav.type === f).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="text-7xl mb-6">💔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('favorites.empty')}</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">{translateDynamic('Save your favorite destinations, hotels, and rentals to see them all in one place.')}</p>
            <Link to="/destinations" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition-all">
              {translateDynamic('Explore Destinations')} <ArrowRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((item, i) => {
                const cfg = typeConfig[item.type];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          {cfg.icon} {translateDynamic(cfg.label)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFavorite(item.id)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all shadow group"
                      >
                        <Trash2 size={14} className="text-rose-500" />
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-base mb-1">{item.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <MapPin size={10} /> {translateDynamic(item.location)}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {item.rating && (
                            <>
                              <Star size={13} className="text-amber-400 fill-amber-400" />
                              <span className="text-sm font-semibold text-gray-700">{item.rating}</span>
                            </>
                          )}
                        </div>
                        {item.price && (
                          <div className="text-right">
                            <span className="text-lg font-black text-gray-900">{formatPrice(item.price)}</span>
                            <span className="text-xs text-gray-400 ml-1">{t('common.per_night')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        {item.type !== 'destination' && (
                          <button
                            onClick={() => setBookingItem({
                              name: item.name,
                              location: item.location,
                              pricePerNight: item.price || 150,
                              rating: item.rating || 4.5,
                              image: item.image,
                            })}
                            className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                          >
                            {t('common.book_now')}
                          </button>
                        )}
                        {item.type === 'destination' && (
                          <Link to="/destinations" className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all text-center">
                            {translateDynamic('Explore')} →
                          </Link>
                        )}
                        <button
                          onClick={() => removeFavorite(item.id)}
                          className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition-all"
                        >
                          <Heart size={14} className="fill-rose-400 text-rose-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {favorites.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-2">{translateDynamic('Ready to plan your trip?')}</h3>
            <p className="text-sm text-gray-600 mb-4">{translateDynamic('Use our travel planner to create the perfect itinerary with your saved places.')}</p>
            <Link to="/planner" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all text-sm">
              {translateDynamic('Open Travel Planner')} <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      <BookingModal isOpen={!!bookingItem} onClose={() => setBookingItem(null)} item={bookingItem} />
    </div>
  );
}
