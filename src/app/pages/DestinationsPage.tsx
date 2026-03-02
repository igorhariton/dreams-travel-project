import React, { useEffect, useState } from 'react';
import { Search, Star, MapPin, Globe2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { destinations } from '../data/travelData';
import { destinationDescriptionsI18n } from '../data/destinationDescriptions.i18n';
import { destinationDetailsI18n } from '../data/destinationDetails.i18n';
import { ImageCarousel } from '../components/ImageCarousel';

const continentOptions = [
  { value: 'All', labelKey: 'destinations.continent.all' },
  { value: 'Europe', labelKey: 'destinations.continent.europe' },
  { value: 'Asia', labelKey: 'destinations.continent.asia' },
  { value: 'Middle East', labelKey: 'destinations.continent.middle_east' },
  { value: 'Americas', labelKey: 'destinations.continent.americas' },
  { value: 'Africa', labelKey: 'destinations.continent.africa' },
] as const;

const tagOptions = [
  { value: 'Beach', labelKey: 'destinations.tag.beach' },
  { value: 'Culture', labelKey: 'destinations.tag.culture' },
  { value: 'Romance', labelKey: 'destinations.tag.romance' },
  { value: 'Adventure', labelKey: 'destinations.tag.adventure' },
  { value: 'Food', labelKey: 'destinations.tag.food' },
  { value: 'Luxury', labelKey: 'destinations.tag.luxury' },
  { value: 'City', labelKey: 'destinations.tag.city' },
  { value: 'Nature', labelKey: 'destinations.tag.nature' },
] as const;

export default function DestinationsPage() {
  const { t, addFavorite, removeFavorite, isFavorite, language } = useApp();
  const [search, setSearch] = useState('');
  const [activeContinent, setActiveContinent] = useState('All');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedDest, setSelectedDest] = useState<typeof destinations[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'culture' | 'cuisine' | 'mustvisit'>('overview');
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const locale = language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'en-US';

  const getContinentLabel = (continent: string) => {
    const option = continentOptions.find(c => c.value === continent);
    return option ? t(option.labelKey) : continent;
  };

  const getTagLabel = (tag: string) => t(`destinations.tag.${tag.toLowerCase()}`);

  const filtered = destinations.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.country.toLowerCase().includes(search.toLowerCase());
    const matchContinent = activeContinent === 'All' || d.continent === activeContinent;
    const matchTags = activeTags.length === 0 || activeTags.some(tag => d.tags.includes(tag));
    return matchSearch && matchContinent && matchTags;
  });

  const toggleTag = (tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  useEffect(() => {
    if (language === 'en') return;

    let cancelled = false;

    const translateText = async (text: string, targetLanguage: 'ro' | 'ru') => {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Translate request failed with status ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data) || !Array.isArray(data[0])) return text;
      return (data[0] as Array<unknown>)
        .map(part => (Array.isArray(part) ? String(part[0] ?? '') : ''))
        .join('') || text;
    };

    const run = async () => {
      const targetLanguage = language as 'ro' | 'ru';
      const selectedNotInFiltered = selectedDest && !filtered.some(dest => dest.id === selectedDest.id) ? [selectedDest] : [];
      const targetDestinations = [...filtered, ...selectedNotInFiltered];
      const pending: Record<string, string> = {};
      const seenKeys = new Set<string>();

      const addKey = (key: string, value: string) => {
        if (seenKeys.has(key) || translatedTexts[key] || pending[key]) return;
        seenKeys.add(key);
        pending[key] = value;
      };

      for (const dest of targetDestinations) {
        addKey(`${targetLanguage}:${dest.id}:description`, dest.description);
        addKey(`${targetLanguage}:${dest.id}:culture`, dest.culture);
        addKey(`${targetLanguage}:${dest.id}:cuisine`, dest.cuisine);

        const mustVisitPlaces = selectedDest?.id === dest.id ? dest.mustVisit : dest.mustVisit.slice(0, 3);
        mustVisitPlaces.forEach((place, index) => {
          addKey(`${targetLanguage}:${dest.id}:mustvisit:${index}`, place);
        });
      }

      const translatedBatch: Record<string, string> = {};
      for (const [key, sourceText] of Object.entries(pending)) {
        try {
          translatedBatch[key] = await translateText(sourceText, targetLanguage);
        } catch {
          translatedBatch[key] = sourceText;
        }
      }

      if (!cancelled && Object.keys(translatedBatch).length > 0) {
        setTranslatedTexts(prev => ({ ...prev, ...translatedBatch }));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [filtered, language, selectedDest, translatedTexts]);

  const getLocalizedDescription = (dest: typeof destinations[number]) => {
    if (language === 'en') return dest.description;
    if (language === 'ro' || language === 'ru') {
      return destinationDescriptionsI18n[language][dest.id] || dest.description;
    }
    return translatedTexts[`${language}:${dest.id}:description`] || dest.description;
  };

  const getLocalizedCulture = (dest: typeof destinations[number]) => {
    if (language === 'en') return dest.culture;
    if (language === 'ro' || language === 'ru') {
      return destinationDetailsI18n[language][dest.id]?.culture || dest.culture;
    }
    return translatedTexts[`${language}:${dest.id}:culture`] || dest.culture;
  };

  const getLocalizedCuisine = (dest: typeof destinations[number]) => {
    if (language === 'en') return dest.cuisine;
    if (language === 'ro' || language === 'ru') {
      return destinationDetailsI18n[language][dest.id]?.cuisine || dest.cuisine;
    }
    return translatedTexts[`${language}:${dest.id}:cuisine`] || dest.cuisine;
  };

  const getLocalizedMustVisit = (dest: typeof destinations[number], place: string, index: number) => {
    if (language === 'en') return place;
    return translatedTexts[`${language}:${dest.id}:mustvisit:${index}`] || place;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img
          src="/images/_site/hero-destinations.jpg"
          alt="Destinations"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-blue-900/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="text-4xl font-black text-white mb-3">{t('section.top_destinations')}</h1>
          <p className="text-white/80 text-lg max-w-lg">{t('section.top_destinations_sub')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
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

            {/* Continents */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {continentOptions.map(c => (
                <button
                  key={c.value}
                  onClick={() => setActiveContinent(c.value)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeContinent === c.value ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {t(c.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {tagOptions.map(tag => (
              <button
                key={tag.value}
                onClick={() => toggleTag(tag.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTags.includes(tag.value) ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-cyan-50 hover:text-cyan-600'}`}
              >
                {t(tag.labelKey)}
                {activeTags.includes(tag.value) && <X size={10} className="inline ml-1" />}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button onClick={() => setActiveTags([])} className="text-xs text-red-500 hover:underline ml-1">{t('common.clear_all')}</button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-sm text-gray-500 mb-6">{filtered.length} {t('destinations.found')}</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedDest(dest)}
            >
              <div className="relative h-60 overflow-hidden">
                <ImageCarousel images={dest.images} className="h-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-3 right-3">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (isFavorite(dest.id)) removeFavorite(dest.id);
                      else addFavorite({ id: dest.id, type: 'destination', name: dest.name, image: dest.images[0], rating: dest.rating, location: dest.country });
                    }}
                    className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow"
                  >
                    {isFavorite(dest.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 pointer-events-none">
                  <div className="text-xl font-black text-white">{dest.name}</div>
                  <div className="flex items-center gap-1 text-white/80 text-sm">
                    <Globe2 size={12} /> {dest.country} · {getContinentLabel(dest.continent)}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="font-bold text-sm">{dest.rating}</span>
                    <span className="text-xs text-gray-400">({dest.reviews.toLocaleString(locale)})</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">🗓️ {dest.bestSeason}</span>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{getLocalizedDescription(dest)}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {dest.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-full">{getTagLabel(tag)}</span>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="text-xs font-semibold text-gray-500 mb-2">{t('section.must_visit')}:</div>
                  <div className="flex flex-wrap gap-1">
                    {dest.mustVisit.slice(0, 3).map((p, index) => (
                      <span key={p} className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">📍 {getLocalizedMustVisit(dest, p, index)}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Destination Detail Modal */}
      <AnimatePresence>
        {selectedDest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDest(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="relative h-72">
                <ImageCarousel images={selectedDest.images} className="h-72" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <button
                  onClick={() => setSelectedDest(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
                >
                  <X size={18} />
                </button>
                <div className="absolute bottom-5 left-5 text-white pointer-events-none">
                  <div className="text-3xl font-black">{selectedDest.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={14} /> {selectedDest.country}
                    <span className="w-1 h-1 bg-white/60 rounded-full" />
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span>{selectedDest.rating}</span>
                    <span className="text-white/70">({selectedDest.reviews.toLocaleString(locale)} {t('common.reviews')})</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-6">
                {(['overview', 'culture', 'cuisine', 'mustvisit'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {t(`destinations.tab.${tab}`)}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <p className="text-gray-600 leading-relaxed mb-5">{getLocalizedDescription(selectedDest)}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs font-semibold text-gray-500 mb-1">{t('destinations.best_season')}</div>
                        <div className="font-medium text-gray-900">{selectedDest.bestSeason}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs font-semibold text-gray-500 mb-1">{t('destinations.tags')}</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedDest.tags.map(tag => <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{getTagLabel(tag)}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'culture' && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">🎭 {t('section.culture')}</h3>
                    <p className="text-gray-600 leading-relaxed">{getLocalizedCulture(selectedDest)}</p>
                  </div>
                )}
                {activeTab === 'cuisine' && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">🍜 {t('section.cuisine')}</h3>
                    <p className="text-gray-600 leading-relaxed">{getLocalizedCuisine(selectedDest)}</p>
                  </div>
                )}
                {activeTab === 'mustvisit' && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">📍 {t('section.must_visit')}</h3>
                    <div className="space-y-2">
                      {selectedDest.mustVisit.map((place, i) => (
                        <div key={place} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                          <span className="font-medium text-gray-800">{getLocalizedMustVisit(selectedDest, place, i)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => {
                    if (isFavorite(selectedDest.id)) removeFavorite(selectedDest.id);
                    else addFavorite({ id: selectedDest.id, type: 'destination', name: selectedDest.name, image: selectedDest.images[0], rating: selectedDest.rating, location: selectedDest.country });
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-all text-sm ${isFavorite(selectedDest.id) ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  {isFavorite(selectedDest.id) ? `❤️ ${t('destinations.in_favorites')}` : `🤍 ${t('destinations.add_favorites')}`}
                </button>
                <button className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all text-sm">
                  {t('destinations.explore_hotels')} →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
