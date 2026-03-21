import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, Plane, Hotel, Home as HomeIcon, Map, Shield, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { destinations, hotels } from '../data/travelData';
import { ImageCarousel } from '../components/ImageCarousel';
import { BookingModal } from '../components/BookingModal';

export default function HomePage() {
  const { t, translateDynamic, addFavorite, isFavorite, removeFavorite, formatPrice, theme } = useApp();
  const navigate = useNavigate();
  const heroFrameRef = useRef<HTMLIFrameElement>(null);
  const [bookingItem, setBookingItem] = useState<any>(null);

  const featuredDestinations = destinations.slice(0, 4);
  const featuredHotels = hotels.slice(0, 3);
  const heroSrc = theme === 'dark' ? '/TravelHero_Dark.html' : '/TravelHero_Light.html';

  const stats = [
    { value: '50+', label: 'Countries', icon: <Map size={20} /> },
    { value: '2,400+', label: 'Hotels', icon: <Hotel size={20} /> },
    { value: '1.2M', label: 'Happy Travelers', icon: <Users size={20} /> },
    { value: '4.9★', label: 'Average Rating', icon: <Star size={20} /> },
  ];

  const howItWorks = [
    { icon: <Search size={28} />, title: 'Search & Discover', desc: 'Browse hundreds of destinations, hotels, and unique rentals.' },
    { icon: <Calendar size={28} />, title: 'Plan & Customize', desc: 'Build your perfect itinerary with our smart travel planner.' },
    { icon: <Shield size={28} />, title: 'Book Securely', desc: 'Reserve with confidence — free cancellation on most bookings.' },
    { icon: <Plane size={28} />, title: 'Travel & Enjoy', desc: 'Explore the world and create memories that last a lifetime.' },
  ];

  const cuisineItems = [
    { img: '/images/_site/food-1.jpg', name: 'Asian Street Food', dest: 'Bangkok & Tokyo' },
    { img: '/images/_site/food-2.jpg', name: 'Italian Cuisine', dest: 'Rome & Florence' },
    { img: '/images/_site/food-3.jpg', name: 'Balinese Feasts', dest: 'Ubud, Bali' },
  ];

  const allDestinationNames = Array.from(
    new Set(destinations.map((item) => `${item.name}, ${item.country}`))
  );

  const postDestinationsToHero = (targetWindow: WindowProxy | null) => {
    if (!targetWindow) return;
    targetWindow.postMessage(
      {
        source: 'travel-app',
        type: 'destinations',
        destinations: allDestinationNames,
      },
      window.location.origin
    );
  };

  useEffect(() => {
    const onHeroMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const payload = event.data as {
        source?: string;
        type?: string;
        destination?: string;
        checkIn?: string;
        checkOut?: string;
        guests?: number;
      };

      if (!payload || payload.source !== 'travel-hero') return;

      if (payload.type === 'request-destinations') {
        postDestinationsToHero(event.source as WindowProxy | null);
        return;
      }

      if (payload.type !== 'search') return;

      const params = new URLSearchParams();
      if (payload.destination?.trim()) params.set('destination', payload.destination.trim());
      if (payload.checkIn) params.set('checkIn', payload.checkIn);
      if (payload.checkOut) params.set('checkOut', payload.checkOut);
      params.set('guests', String(payload.guests ?? 2));

      navigate(`/planner?${params.toString()}`);
    };

    window.addEventListener('message', onHeroMessage);
    return () => window.removeEventListener('message', onHeroMessage);
  }, [navigate]);

  const handleHeroFrameLoad = () => {
    postDestinationsToHero(heroFrameRef.current?.contentWindow ?? null);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-visible">
        <iframe
          ref={heroFrameRef}
          key={theme}
          title="Travel hero"
          src={heroSrc}
          className="absolute inset-0 w-full h-full border-0 pointer-events-auto"
          onLoad={handleHeroFrameLoad}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.25), rgba(0,0,0,0.55))' }}
          aria-hidden="true"
        />
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-blue-900 to-cyan-800 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center text-white"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  {s.icon}
                </div>
                <div className="text-3xl font-black mb-1">{s.value}</div>
                <div className="text-sm text-blue-200">{translateDynamic(s.label)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Destinations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900">{t('section.top_destinations')}</h2>
              <p className="text-gray-500 mt-2">{t('section.top_destinations_sub')}</p>
            </div>
            <Link to="/destinations" className="flex items-center gap-1.5 text-cyan-600 font-semibold hover:gap-2.5 transition-all text-sm">
              {t('common.see_all')} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/destinations')}
              >
                <div className="relative h-52 overflow-hidden">
                  <ImageCarousel images={dest.images} className="h-52" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
                    {dest.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-white/90 text-xs font-medium px-2 py-1 rounded-full text-gray-700">{translateDynamic(tag)}</span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFavorite(dest.id)) {
                        removeFavorite(dest.id);
                      } else {
                        addFavorite({
                          id: dest.id, type: 'destination', name: dest.name,
                          image: dest.images[0], rating: dest.rating, location: `${dest.country}`
                        });
                      }
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <span className={isFavorite(dest.id) ? 'text-red-500' : 'text-gray-400'}>
                      {isFavorite(dest.id) ? '❤️' : '🤍'}
                    </span>
                  </button>
                  <div className="absolute bottom-3 left-3 pointer-events-none">
                    <div className="text-white font-bold">{dest.name}</div>
                    <div className="text-white/80 text-sm">{dest.country}</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{dest.rating}</span>
                      <span className="text-xs text-gray-400">({dest.reviews.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} /> {translateDynamic(dest.bestSeason.split(' ')[0])}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{translateDynamic(dest.description)}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-1">
                      {dest.mustVisit.slice(0, 2).map(place => (
                        <span key={place} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{translateDynamic(place).split(' ')[0]}</span>
                      ))}
                    </div>
                    <ArrowRight size={16} className="text-cyan-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture & Cuisine */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-cyan-500 font-semibold text-sm uppercase tracking-wide">{translateDynamic('Immerse Yourself')}</span>
              <h2 className="text-4xl font-black text-gray-900 mt-2 mb-4">{t('section.culture')} & {t('section.cuisine')}</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                {translateDynamic('Every destination has a story told through its people, art, rituals, and food. From ancient temples to vibrant street markets, let us guide you to the heart of every culture.')}
              </p>
              <div className="space-y-4">
                {[
                  { icon: '🎭', title: 'Cultural Festivals', desc: 'Participate in local celebrations and traditional ceremonies' },
                  { icon: '🍜', title: 'Culinary Tours', desc: 'Taste authentic dishes at hidden local restaurants' },
                  { icon: '🏛️', title: 'Historical Sites', desc: 'Explore ancient ruins, museums and UNESCO heritage sites' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{translateDynamic(item.title)}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{translateDynamic(item.desc)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {cuisineItems.map((item, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 h-48' : 'h-40'} group`}
                >
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <div className="font-semibold">{translateDynamic(item.name)}</div>
                    <div className="text-xs text-white/80">{translateDynamic(item.dest)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900">{t('section.featured_hotels')}</h2>
              <p className="text-gray-500 mt-2">{t('section.featured_hotels_sub')}</p>
            </div>
            <Link to="/hotels" className="flex items-center gap-1.5 text-cyan-600 font-semibold hover:gap-2.5 transition-all text-sm">
              {t('common.see_all')} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredHotels.map((hotel, i) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-56 overflow-hidden">
                  <ImageCarousel images={hotel.images} className="h-56" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      {'★'.repeat(hotel.stars)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (isFavorite(hotel.id)) removeFavorite(hotel.id);
                      else addFavorite({ id: hotel.id, type: 'hotel', name: hotel.name, image: hotel.images[0], price: hotel.pricePerNight, rating: hotel.rating, location: hotel.location });
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <span className={isFavorite(hotel.id) ? 'text-red-500' : 'text-gray-400'}>{isFavorite(hotel.id) ? '❤️' : '🤍'}</span>
                  </button>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{hotel.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {hotel.location}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-lg font-black text-gray-900">{formatPrice(hotel.pricePerNight)}</div>
                      <div className="text-xs text-gray-400">{t('common.per_night')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold">{hotel.rating}</span>
                    <span className="text-xs text-gray-400">({hotel.reviews.toLocaleString()} {t('common.reviews')})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {hotel.amenities.slice(0, 4).map(a => (
                      <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{translateDynamic(a)}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => setBookingItem({ name: hotel.name, location: hotel.location, pricePerNight: hotel.pricePerNight, rating: hotel.rating, image: hotel.images[0] })}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    {t('common.book_now')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900">{t('section.how_it_works')}</h2>
            <p className="text-gray-500 mt-2">{translateDynamic('Simple steps to your perfect journey')}</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-blue-200 to-cyan-200" style={{ left: '12.5%', right: '12.5%' }} />
            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-200">
                  {item.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-orange-400 to-red-500 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-md">{i + 1}</div>
                <h3 className="font-bold text-gray-900 mb-2">{translateDynamic(item.title)}</h3>
                <p className="text-sm text-gray-500">{translateDynamic(item.desc)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/_site/cta.jpg" alt="CTA" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-cyan-900/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-black text-white mb-4">{translateDynamic('Start Planning Your Dream Trip')}</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              {translateDynamic('Create a personalized travel itinerary in minutes with our AI-powered planner.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/planner" className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg">
                <Map size={18} /> {t('nav.planner')}
              </Link>
              <Link to="/destinations" className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition-all">
                {t('hero.explore')} <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <BookingModal
        isOpen={!!bookingItem}
        onClose={() => setBookingItem(null)}
        item={bookingItem}
      />
    </>
  );
}
