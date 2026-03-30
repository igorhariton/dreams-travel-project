import React, { useState, useMemo, useCallback, useRef, useEffect, useDeferredValue } from 'react';
import { Search, Filter, Star, MapPin, Globe2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { destinations } from '../data/travelData';
import { ImageCarousel } from '../components/ImageCarousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const continents = ['All', 'Europe', 'Asia', 'Middle East', 'Americas', 'Africa'];
const tags = ['Beach', 'Culture', 'Romance', 'Adventure', 'Food', 'Luxury', 'City', 'Nature'];

// Renders only when visible in viewport
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
      {visible ? children : <div className="w-full bg-gray-100 rounded-2xl animate-pulse" style={{ minHeight }} />}
    </div>
  );
}

export default function DestinationsPage() {
  const { t, translateDynamic, addFavorite, removeFavorite, isFavorite } = useApp();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [activeContinent, setActiveContinent] = useState('All');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedDest, setSelectedDest] = useState<typeof destinations[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'culture' | 'cuisine' | 'mustvisit'>('overview');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'trending'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const sorted = useMemo(() => {
    const filtered = destinations.filter(d => {
      const normalizedSearch = deferredSearch.toLowerCase();
      const matchSearch = d.name.toLowerCase().includes(normalizedSearch) || d.country.toLowerCase().includes(normalizedSearch);
      const matchContinent = activeContinent === 'All' || d.continent === activeContinent;
      const matchTags = activeTags.length === 0 || activeTags.some(tag => d.tags.includes(tag));
      return matchSearch && matchContinent && matchTags;
    });
    if (sortBy === 'rating') return [...filtered].sort((a, b) => b.rating - a.rating);
    if (sortBy === 'name') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return [...filtered].sort((a, b) => b.reviews - a.reviews);
  }, [deferredSearch, activeContinent, activeTags, sortBy]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  const handleFavorite = useCallback((e: React.MouseEvent, dest: typeof destinations[0]) => {
    e.stopPropagation();
    if (isFavorite(dest.id)) removeFavorite(dest.id);
    else addFavorite({ id: dest.id, type: 'destination', name: dest.name, image: dest.images[0], rating: dest.rating, location: dest.country });
  }, [isFavorite, addFavorite, removeFavorite]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img src="/images/_site/hero-destinations.jpg" alt="Destinations" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.72) 0%, rgba(2,6,23,0.5) 100%)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="text-4xl font-black text-white mb-3">{t('section.top_destinations')}</h1>
          <p className="text-white/80 text-lg max-w-lg">{t('section.top_destinations_sub')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {continents.map(c => (
                <button key={c} onClick={() => setActiveContinent(c)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeContinent === c ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {translateDynamic(c)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'rating' | 'name' | 'trending')}>
              <SelectTrigger className="h-[46px] w-[160px] rounded-2xl border-[#D9E2EC] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm focus-visible:border-[#60A5FA] focus-visible:ring-[#60A5FA]/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                className="z-[120] rounded-[16px] border border-[#D9E2EC] bg-white p-1 shadow-xl"
              >
                <SelectItem value="rating" className="rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]">
                  {translateDynamic('Top Rated')}
                </SelectItem>
                <SelectItem value="trending" className="rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]">
                  {translateDynamic('Trending')}
                </SelectItem>
                <SelectItem value="name" className="rounded-xl px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-[#F1F5F9] data-[state=checked]:bg-[#DBEAFE]">
                  A-Z
                </SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              <Filter size={16} /> {t('common.filter')}
            </button>
            <div className="ml-auto flex rounded-xl border border-gray-200 overflow-hidden bg-white">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>⊞</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>☰</button>
            </div>
          </div>

          {showFilters && (
            <div className="flex gap-2 mt-3 flex-wrap animate-in fade-in duration-300">
              {tags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTags.includes(tag) ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-cyan-50 hover:text-cyan-600'}`}>
                  {translateDynamic(tag)}
                  {activeTags.includes(tag) && <X size={10} className="inline ml-1" />}
                </button>
              ))}
              {activeTags.length > 0 && (
                <button onClick={() => setActiveTags([])} className="text-xs text-red-500 hover:underline ml-1">{translateDynamic('Clear all')}</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-sm text-gray-500 mb-6">{sorted.length} {translateDynamic('destinations found')}</p>

        {viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sorted.map(dest => (
              <LazyCard key={dest.id}>
                <div
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
                  onClick={() => setSelectedDest(dest)}
                >
                  <div className="relative h-60 overflow-hidden">
                    <ImageCarousel images={dest.images} className="h-60" />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%)' }} />
                    <div className="absolute top-3 right-3">
                      <button onClick={e => handleFavorite(e, dest)}
                        className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow">
                        {isFavorite(dest.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 pointer-events-none">
                      <div className="text-xl font-black text-white">{dest.name}</div>
                      <div className="flex items-center gap-1 text-white/80 text-sm">
                        <Globe2 size={12} /> {translateDynamic(dest.country)} · {translateDynamic(dest.continent)}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex flex-1 flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-sm">{dest.rating}</span>
                        <span className="text-xs text-gray-400">({dest.reviews.toLocaleString()})</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">🗓️ {translateDynamic(dest.bestSeason)}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{translateDynamic(dest.description)}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {dest.tags.map(tag => (
                        <span key={tag} className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-full">{translateDynamic(tag)}</span>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 pt-3 mb-4">
                      <div className="text-xs font-semibold text-gray-500 mb-2">{t('section.must_visit')}:</div>
                      <div className="flex flex-wrap gap-1">
                        {dest.mustVisit.slice(0, 3).map(p => (
                          <span key={p} className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">📍 {translateDynamic(p)}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDest(dest);
                      }}
                      className="mt-auto w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                    >
                      {t('common.view_details')}
                    </button>
                  </div>
                </div>
              </LazyCard>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map(dest => (
              <LazyCard key={dest.id} minHeight={140}>
                <div
                  onClick={() => setSelectedDest(dest)}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex gap-4 p-4 border border-gray-100 h-full"
                >
                  <div className="w-40 h-32 shrink-0 rounded-xl overflow-hidden">
                    <ImageCarousel images={dest.images} className="h-32" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{dest.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={14} className="text-gray-500" />
                        <span className="text-sm text-gray-600">{translateDynamic(dest.country)}</span>
                        <span className="text-gray-300 mx-1">•</span>
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium">{dest.rating}</span>
                        <span className="text-xs text-gray-500">({dest.reviews.toLocaleString()})</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{translateDynamic(dest.description)}</p>
                      <div className="flex flex-wrap gap-1">
                        {dest.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">{translateDynamic(tag)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={e => handleFavorite(e, dest)} className="p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xl">{isFavorite(dest.id) ? '❤️' : '🤍'}</span>
                  </button>
                </div>
              </LazyCard>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedDest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDest(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="relative h-72">
                <ImageCarousel images={selectedDest.images} className="h-72" />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 45%)' }} />
                <button onClick={() => setSelectedDest(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow">
                  <X size={18} />
                </button>
                <div className="absolute bottom-5 left-5 text-white pointer-events-none">
                  <div className="text-3xl font-black">{selectedDest.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={14} /> {translateDynamic(selectedDest.country)}
                    <span className="w-1 h-1 bg-white/60 rounded-full" />
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span>{selectedDest.rating}</span>
                    <span className="text-white/70">({selectedDest.reviews.toLocaleString()} {t('common.reviews')})</span>
                  </div>
                </div>
              </div>

              <div className="flex border-b border-gray-100 px-6">
                {(['overview', 'culture', 'cuisine', 'mustvisit'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab === 'mustvisit' ? t('section.must_visit') : translateDynamic(tab.charAt(0).toUpperCase() + tab.slice(1))}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <p className="text-gray-600 leading-relaxed mb-5">{translateDynamic(selectedDest.description)}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs font-semibold text-gray-500 mb-1">{translateDynamic('Best Season')}</div>
                        <div className="font-medium text-gray-900">{translateDynamic(selectedDest.bestSeason)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs font-semibold text-gray-500 mb-1">{translateDynamic('Tags')}</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedDest.tags.map(tag => <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{translateDynamic(tag)}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'culture' && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">🎭 {translateDynamic('Culture & Heritage')}</h3>
                    <p className="text-gray-600 leading-relaxed">{translateDynamic(selectedDest.culture)}</p>
                  </div>
                )}
                {activeTab === 'cuisine' && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">🍜 {t('section.cuisine')}</h3>
                    <p className="text-gray-600 leading-relaxed">{translateDynamic(selectedDest.cuisine)}</p>
                  </div>
                )}
                {activeTab === 'mustvisit' && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">📍 {t('section.must_visit')}</h3>
                    <div className="space-y-2">
                      {selectedDest.mustVisit.map((place, i) => (
                        <div key={place} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                          <span className="font-medium text-gray-800">{translateDynamic(place)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => { if (isFavorite(selectedDest.id)) removeFavorite(selectedDest.id); else addFavorite({ id: selectedDest.id, type: 'destination', name: selectedDest.name, image: selectedDest.images[0], rating: selectedDest.rating, location: selectedDest.country }); }}
                  className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-all text-sm ${isFavorite(selectedDest.id) ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  {isFavorite(selectedDest.id) ? `❤️ ${translateDynamic('In Favorites')}` : `🤍 ${translateDynamic('Add to Favorites')}`}
                </button>
                <button className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all text-sm">
                  {translateDynamic('Explore Hotels')} →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
