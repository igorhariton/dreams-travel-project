import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

export type Language = 'en' | 'ro' | 'ru';
export type UserRole = 'user' | 'host' | 'admin';
export type Theme = 'light' | 'dark';

export interface FavoriteItem {
  id: string;
  type: 'destination' | 'hotel' | 'rental';
  name: string;
  image: string;
  price?: number;
  rating?: number;
  location: string;
}

// ── NEW: Host Listings System ─────────────────────────────────────────────────

export type ListingStatus = 'pending' | 'approved' | 'rejected';

export type HostListing = {
  id: string;
  hostId: string;
  hostName: string;
  type: 'hotel' | 'rental';
  name: string;
  location: string;
  destinationId: string;
  description: string;
  pricePerNight: number;
  images: string[];
  amenities: string[];
  status: ListingStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  stars?: number;
  hotelType?: string;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  rentalType?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
};

export type RegisterData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'host';
};

const MOCK_USERS: (User & { password: string })[] = [
  { id: 'admin-1', name: 'Admin TravelDreams', email: 'admin@traveldreams.com', phone: '+1 888 000 0000', role: 'admin', password: 'admin123' },
  { id: 'host-1',  name: 'Maria Ionescu',      email: 'maria@host.com',         phone: '+40 721 000 001', role: 'host',  password: 'host123' },
  { id: 'host-2',  name: 'John Smith',          email: 'john@host.com',          phone: '+44 7700 900001', role: 'host',  password: 'host123' },
];

const INITIAL_LISTINGS: HostListing[] = [
  {
    id: 'hl-1', hostId: 'host-1', hostName: 'Maria Ionescu', type: 'rental',
    name: 'Santorini Sunset Villa', location: 'Santorini, Greece', destinationId: 'santorini',
    description: 'Beautiful villa with stunning caldera views.',
    pricePerNight: 350, images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800'],
    amenities: ['WiFi', 'Pool', 'Sea View'], status: 'pending',
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    bedrooms: 3, bathrooms: 2, maxGuests: 6, rentalType: 'villa',
  },
  {
    id: 'hl-2', hostId: 'host-1', hostName: 'Maria Ionescu', type: 'hotel',
    name: 'Aegean Boutique Hotel', location: 'Mykonos, Greece', destinationId: 'mykonos',
    description: 'Luxury boutique hotel in the heart of Mykonos.',
    pricePerNight: 420, images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
    amenities: ['WiFi', 'Breakfast', 'Rooftop Bar'], status: 'approved',
    submittedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    reviewedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    reviewNote: 'Great listing, approved!', stars: 4, hotelType: 'boutique',
  },
  {
    id: 'hl-3', hostId: 'host-2', hostName: 'John Smith', type: 'rental',
    name: 'Bali Jungle Retreat', location: 'Ubud, Bali', destinationId: 'bali',
    description: 'Peaceful retreat surrounded by lush jungle.',
    pricePerNight: 180, images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800'],
    amenities: ['WiFi', 'Pool', 'Garden'], status: 'rejected',
    submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    reviewedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    reviewNote: 'Images not clear enough. Please resubmit.',
    bedrooms: 2, bathrooms: 1, maxGuests: 4, rentalType: 'villa',
  },
  {
    id: 'hl-4', hostId: 'host-2', hostName: 'John Smith', type: 'hotel',
    name: 'Tokyo Zen Hotel', location: 'Shinjuku, Tokyo', destinationId: 'tokyo',
    description: 'Modern hotel blending traditional Japanese aesthetics.',
    pricePerNight: 290, images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800'],
    amenities: ['WiFi', 'Onsen', 'Restaurant'], status: 'pending',
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    stars: 5, hotelType: 'luxury',
  },
];

// ── Context Type (existing + new) ─────────────────────────────────────────────

interface AppContextType {
  // ── Existing ──
  language: Language;
  setLanguage: (lang: Language) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  t: (key: string) => string;
  translateDynamic: (text: string) => string;
  formatPrice: (price: number) => string;
  getPriceWithoutFormat: (price: number) => number;
  getCurrencySymbol: () => string;
  // ── New: Auth ──
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  isAuthLoading: boolean;
  // ── New: Host listings ──
  hostListings: HostListing[];
  addHostListing: (listing: Omit<HostListing, 'id' | 'hostId' | 'hostName' | 'status' | 'submittedAt'>) => void;
  updateHostListing: (id: string, data: Partial<HostListing>) => void;
  deleteHostListing: (id: string) => void;
  approveListing: (id: string, note?: string) => void;
  rejectListing: (id: string, note?: string) => void;
  getMyListings: () => HostListing[];
  getPendingListings: () => HostListing[];
  getApprovedListings: () => HostListing[];
}

// ── Translations (unchanged from original) ────────────────────────────────────

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home', 'nav.destinations': 'Destinations', 'nav.hotels': 'Hotels',
    'nav.rentals': 'Rentals', 'nav.planner': 'Planner', 'nav.favorites': 'Favorites',
    'nav.chat': 'Chat', 'nav.admin': 'Admin', 'nav.signin': 'Sign In',
    'nav.role.user': 'Traveler', 'nav.role.host': 'Host', 'nav.role.admin': 'Admin',
    'hero.title': 'Discover Your Next Dream Destination',
    'hero.subtitle': 'Explore breathtaking destinations, book luxury stays, and craft unforgettable journeys.',
    'hero.search': 'Where do you want to go?', 'hero.checkin': 'Check-in', 'hero.checkout': 'Check-out',
    'hero.guests': 'Guests', 'hero.search_btn': 'Search', 'hero.explore': 'Explore Now',
    'section.top_destinations': 'Top Destinations', 'section.top_destinations_sub': 'Handpicked places loved by travelers worldwide',
    'section.featured_hotels': 'Featured Hotels', 'section.featured_hotels_sub': 'Luxury stays for every budget and style',
    'section.rentals': 'Unique Rentals', 'section.rentals_sub': 'Villas, apartments and traditional houses',
    'section.culture': 'Culture & Experiences', 'section.cuisine': 'Local Cuisine',
    'section.must_visit': 'Must-Visit Places', 'section.how_it_works': 'How It Works',
    'common.per_night': 'per night', 'common.book_now': 'Book Now', 'common.view_details': 'View Details',
    'common.add_wishlist': 'Add to Wishlist', 'common.remove_wishlist': 'Remove', 'common.rating': 'Rating',
    'common.reviews': 'reviews', 'common.from': 'From', 'common.guests': 'guests', 'common.nights': 'nights',
    'common.total': 'Total', 'common.cancel': 'Cancel', 'common.confirm': 'Confirm Booking',
    'common.see_all': 'See All', 'common.save': 'Save', 'common.filter': 'Filter', 'common.sort': 'Sort By',
    'common.search': 'Search', 'common.clear_all': 'Clear all', 'common.any': 'Any',
    'destinations.found': 'destinations found', 'destinations.tab.overview': 'Overview',
    'destinations.tab.culture': 'Culture', 'destinations.tab.cuisine': 'Cuisine',
    'destinations.tab.mustvisit': 'Must Visit', 'destinations.best_season': 'Best Season',
    'destinations.tags': 'Tags', 'destinations.in_favorites': 'In Favorites',
    'destinations.add_favorites': 'Add to Favorites', 'destinations.explore_hotels': 'Explore Hotels',
    'destinations.continent.all': 'All', 'destinations.continent.europe': 'Europe',
    'destinations.continent.asia': 'Asia', 'destinations.continent.middle_east': 'Middle East',
    'destinations.continent.americas': 'Americas', 'destinations.continent.africa': 'Africa',
    'destinations.tag.beach': 'Beach', 'destinations.tag.culture': 'Culture',
    'destinations.tag.romance': 'Romance', 'destinations.tag.adventure': 'Adventure',
    'destinations.tag.food': 'Food', 'destinations.tag.luxury': 'Luxury',
    'destinations.tag.city': 'City', 'destinations.tag.nature': 'Nature',
    'hotels.search_placeholder': 'Search hotels...', 'hotels.all_destinations': 'All Destinations',
    'hotels.sort.top_rated': 'Top Rated', 'hotels.sort.price_low_high': 'Price: Low to High',
    'hotels.sort.price_high_low': 'Price: High to Low', 'hotels.max_price': 'Max Price',
    'hotels.min_stars': 'Min Stars', 'hotels.available': 'hotels available',
    'hotels.saved': 'Saved', 'hotels.save': 'Save', 'hotels.per_night_short': '/night',
    'hotels.type.luxury': 'Luxury', 'hotels.type.boutique': 'Boutique', 'hotels.type.budget': 'Budget', 'hotels.type.resort': 'Resort',
    'home.stats.countries': 'Countries', 'home.stats.hotels': 'Hotels',
    'home.stats.travelers': 'Happy Travelers', 'home.stats.avg_rating': 'Average Rating',
    'home.culture.badge': 'Immerse Yourself',
    'home.culture.description': 'Every destination has a story told through its people, art, rituals, and food. From ancient temples to vibrant street markets, let us guide you to the heart of every culture.',
    'home.culture.item1_title': 'Cultural Festivals', 'home.culture.item1_desc': 'Participate in local celebrations and traditional ceremonies',
    'home.culture.item2_title': 'Culinary Tours', 'home.culture.item2_desc': 'Taste authentic dishes at hidden local restaurants',
    'home.culture.item3_title': 'Historical Sites', 'home.culture.item3_desc': 'Explore ancient ruins, museums and UNESCO heritage sites',
    'home.cuisine.item1_name': 'Asian Street Food', 'home.cuisine.item1_dest': 'Bangkok & Tokyo',
    'home.cuisine.item2_name': 'Italian Cuisine', 'home.cuisine.item2_dest': 'Rome & Florence',
    'home.cuisine.item3_name': 'Balinese Feasts', 'home.cuisine.item3_dest': 'Ubud, Bali',
    'home.how.subtitle': 'Simple steps to your perfect journey',
    'home.how.search_title': 'Search & Discover', 'home.how.search_desc': 'Browse hundreds of destinations, hotels, and unique rentals.',
    'home.how.plan_title': 'Plan & Customize', 'home.how.plan_desc': 'Build your perfect itinerary with our smart travel planner.',
    'home.how.book_title': 'Book Securely', 'home.how.book_desc': 'Reserve with confidence — free cancellation on most bookings.',
    'home.how.travel_title': 'Travel & Enjoy', 'home.how.travel_desc': 'Explore the world and create memories that last a lifetime.',
    'home.cta.title': 'Start Planning Your Dream Trip',
    'home.cta.subtitle': 'Create a personalized travel itinerary in minutes with our AI-powered planner.',
    'footer.brand_desc': 'Your ultimate travel companion for discovering breathtaking destinations, booking luxury stays, and crafting unforgettable journeys.',
    'footer.explore': 'Explore', 'footer.top_destinations': 'Top Destinations', 'footer.contact': 'Contact',
    'footer.dest.santorini': 'Santorini, Greece', 'footer.dest.bali': 'Bali, Indonesia',
    'footer.dest.paris': 'Paris, France', 'footer.dest.maldives': 'Maldives',
    'footer.dest.tokyo': 'Tokyo, Japan', 'footer.dest.dubai': 'Dubai, UAE',
    'footer.address_line1': '123 Explorer Avenue', 'footer.address_line2': 'San Francisco, CA 94102',
    'footer.rights': '© 2026 TravelDreams. All rights reserved.',
    'footer.privacy': 'Privacy Policy', 'footer.terms': 'Terms of Service', 'footer.cookies': 'Cookie Policy',
    'rentals.all_types': 'All Types', 'rentals.type.villas': 'Villas', 'rentals.type.apartments': 'Apartments',
    'rentals.type.traditional_plural': 'Traditional', 'rentals.type.chalets': 'Chalets',
    'rentals.listings': 'listings', 'rentals.search_placeholder': 'Search rentals...',
    'rentals.sort.top_rated': 'Top Rated', 'rentals.sort.price_low_high': 'Price: Low to High',
    'rentals.sort.price_high_low': 'Price: High to Low', 'rentals.max_price': 'Max Price',
    'rentals.per_night_short': '/night', 'rentals.min_guests_capacity': 'Min. Guests Capacity',
    'rentals.available': 'rentals available', 'rentals.type.apartment': 'Apartment',
    'rentals.type.villa': 'Villa', 'rentals.type.traditional': 'Traditional', 'rentals.type.chalet': 'Chalet',
    'rentals.bed': 'bed', 'rentals.bath': 'bath', 'rentals.hosted_by': 'Hosted by',
    'favorites.saved': 'saved', 'favorites.place_singular': 'place', 'favorites.place_plural': 'places',
    'favorites.filter.all': 'All', 'favorites.type.destination': 'Destination',
    'favorites.type.hotel': 'Hotel', 'favorites.type.rental': 'Rental',
    'favorites.empty_sub': 'Save your favorite destinations, hotels, and rentals to see them all in one place.',
    'favorites.explore_destinations': 'Explore Destinations', 'favorites.explore_short': 'Explore',
    'favorites.cta_title': 'Ready to plan your trip?',
    'favorites.cta_subtitle': 'Use our travel planner to create the perfect itinerary with your saved places.',
    'favorites.open_planner': 'Open Travel Planner',
    'planner.trip_settings': 'Trip Settings', 'planner.destination': 'Destination',
    'planner.budget_summary': 'Budget Summary', 'planner.total_budget': 'Total Budget',
    'planner.planning_for': 'Planning for', 'planner.best': 'Best',
    'planner.share': 'Share', 'planner.export': 'Export', 'planner.day': 'Day',
    'planner.suggest': 'Suggest', 'planner.activity_title': 'Activity title *',
    'planner.notes_optional': 'Notes (optional)', 'planner.cost': 'Cost ($)',
    'booking.confirmed_for': 'Your booking for',
    'booking.confirmed_suffix': 'has been confirmed. A confirmation email will be sent shortly.',
    'booking.step': 'Step', 'booking.of': 'of', 'booking.peak_season': 'Peak season',
    'booking.offseason_deal': 'Off-season deal', 'booking.taxes_fees': 'Taxes & fees',
    'booking.continue_details': 'Continue to Details', 'booking.payment_details': 'Payment Details',
    'booking.card_number': 'Card number: **** **** **** 4242', 'booking.expiry': 'MM / YY', 'booking.cvc': 'CVC',
    'booking.placeholder_name': 'John Doe', 'booking.placeholder_email': 'john@example.com',
    'booking.placeholder_phone': '+1 234 567 8900', 'booking.placeholder_special': 'Late check-in, dietary requirements...',
    'planner.title': 'My Travel Planner', 'planner.subtitle': 'Build your perfect itinerary day by day',
    'planner.add_day': 'Add Day', 'planner.add_activity': 'Add Activity',
    'planner.trip_name': 'Trip Name', 'planner.start_date': 'Start Date', 'planner.duration': 'Duration', 'planner.days': 'days',
    'favorites.title': 'My Favorites', 'favorites.subtitle': 'Your saved destinations, hotels and rentals',
    'favorites.empty': 'No favorites yet. Start exploring!',
    'chat.title': 'Travel Assistant', 'chat.subtitle': 'Ask anything about your destination',
    'chat.placeholder': 'Ask about destinations, hotels, visa requirements...', 'chat.send': 'Send', 'chat.online': 'Online',
    'admin.title': 'Admin Dashboard', 'admin.users': 'Users', 'admin.hotels': 'Hotels',
    'admin.bookings': 'Bookings', 'admin.revenue': 'Revenue', 'admin.manage': 'Manage',
    'booking.title': 'Complete Your Booking', 'booking.name': 'Full Name',
    'booking.email': 'Email Address', 'booking.phone': 'Phone Number',
    'booking.special': 'Special Requests', 'booking.success': 'Booking Confirmed!',
  },
  ro: {
    'nav.home': 'Acasă', 'nav.destinations': 'Destinații', 'nav.hotels': 'Hoteluri',
    'nav.rentals': 'Închirieri', 'nav.planner': 'Planificator', 'nav.favorites': 'Favorite',
    'nav.chat': 'Chat', 'nav.admin': 'Admin', 'nav.signin': 'Conectare',
    'nav.role.user': 'Călător', 'nav.role.host': 'Gazdă', 'nav.role.admin': 'Admin',
    'hero.title': 'Descoperă Următoarea Ta Destinație de Vis',
    'hero.subtitle': 'Explorează destinații spectaculoase, rezervă cazări de lux și creează călătorii de neuitat.',
    'hero.search': 'Unde vrei să mergi?', 'hero.checkin': 'Check-in', 'hero.checkout': 'Check-out',
    'hero.guests': 'Oaspeți', 'hero.search_btn': 'Caută', 'hero.explore': 'Explorează Acum',
    'section.top_destinations': 'Destinații de Top', 'section.top_destinations_sub': 'Locuri alese cu grijă',
    'section.featured_hotels': 'Hoteluri Recomandate', 'section.featured_hotels_sub': 'Cazări de lux pentru orice buget',
    'section.rentals': 'Închirieri Unice', 'section.rentals_sub': 'Vile, apartamente și case tradiționale',
    'section.culture': 'Cultură și Experiențe', 'section.cuisine': 'Bucătărie Locală',
    'section.must_visit': 'Locuri de Vizitat', 'section.how_it_works': 'Cum Funcționează',
    'common.per_night': 'pe noapte', 'common.book_now': 'Rezervă Acum', 'common.view_details': 'Vezi Detalii',
    'common.add_wishlist': 'Adaugă la Favorite', 'common.remove_wishlist': 'Elimină', 'common.rating': 'Rating',
    'common.reviews': 'recenzii', 'common.from': 'De la', 'common.guests': 'oaspeți', 'common.nights': 'nopți',
    'common.total': 'Total', 'common.cancel': 'Anulează', 'common.confirm': 'Confirmă Rezervarea',
    'common.see_all': 'Vezi Tot', 'common.save': 'Salvează', 'common.filter': 'Filtrează',
    'common.sort': 'Sortează', 'common.search': 'Caută', 'common.clear_all': 'Șterge tot', 'common.any': 'Oricare',
    'destinations.found': 'destinații găsite', 'destinations.tab.overview': 'Prezentare',
    'destinations.tab.culture': 'Cultură', 'destinations.tab.cuisine': 'Bucătărie',
    'destinations.tab.mustvisit': 'De Vizitat', 'destinations.best_season': 'Sezon ideal',
    'destinations.tags': 'Etichete', 'destinations.in_favorites': 'În Favorite',
    'destinations.add_favorites': 'Adaugă la Favorite', 'destinations.explore_hotels': 'Explorează Hoteluri',
    'destinations.continent.all': 'Toate', 'destinations.continent.europe': 'Europa',
    'destinations.continent.asia': 'Asia', 'destinations.continent.middle_east': 'Orientul Mijlociu',
    'destinations.continent.americas': 'Americi', 'destinations.continent.africa': 'Africa',
    'destinations.tag.beach': 'Plajă', 'destinations.tag.culture': 'Cultură',
    'destinations.tag.romance': 'Romantic', 'destinations.tag.adventure': 'Aventură',
    'destinations.tag.food': 'Gastronomie', 'destinations.tag.luxury': 'Lux',
    'destinations.tag.city': 'Oraș', 'destinations.tag.nature': 'Natură',
    'hotels.search_placeholder': 'Caută hoteluri...', 'hotels.all_destinations': 'Toate Destinațiile',
    'hotels.sort.top_rated': 'Cel Mai Bun Rating', 'hotels.sort.price_low_high': 'Preț: Crescător',
    'hotels.sort.price_high_low': 'Preț: Descrescător', 'hotels.max_price': 'Preț Maxim',
    'hotels.min_stars': 'Stele Minime', 'hotels.available': 'hoteluri disponibile',
    'hotels.saved': 'Salvat', 'hotels.save': 'Salvează', 'hotels.per_night_short': '/noapte',
    'hotels.type.luxury': 'Lux', 'hotels.type.boutique': 'Boutique', 'hotels.type.budget': 'Buget', 'hotels.type.resort': 'Resort',
    'home.stats.countries': 'Țări', 'home.stats.hotels': 'Hoteluri',
    'home.stats.travelers': 'Călători Fericiți', 'home.stats.avg_rating': 'Rating Mediu',
    'home.culture.badge': 'Descoperă În Profunzime',
    'home.culture.description': 'Fiecare destinație are o poveste spusă prin oameni, artă, ritualuri și mâncare.',
    'home.culture.item1_title': 'Festivaluri Culturale', 'home.culture.item1_desc': 'Participă la sărbători locale',
    'home.culture.item2_title': 'Tururi Culinare', 'home.culture.item2_desc': 'Gustă preparate autentice',
    'home.culture.item3_title': 'Situri Istorice', 'home.culture.item3_desc': 'Explorează ruine antice și muzee',
    'home.cuisine.item1_name': 'Mâncare Stradală Asiatică', 'home.cuisine.item1_dest': 'Bangkok & Tokyo',
    'home.cuisine.item2_name': 'Bucătărie Italiană', 'home.cuisine.item2_dest': 'Roma & Florența',
    'home.cuisine.item3_name': 'Festinuri Balineze', 'home.cuisine.item3_dest': 'Ubud, Bali',
    'home.how.subtitle': 'Pași simpli către călătoria perfectă',
    'home.how.search_title': 'Caută și Descoperă', 'home.how.search_desc': 'Răsfoiește sute de destinații.',
    'home.how.plan_title': 'Planifică și Personalizează', 'home.how.plan_desc': 'Construiește itinerariul perfect.',
    'home.how.book_title': 'Rezervă în Siguranță', 'home.how.book_desc': 'Anulare gratuită pentru majoritatea rezervărilor.',
    'home.how.travel_title': 'Călătorește și Bucură-te', 'home.how.travel_desc': 'Creează amintiri care durează o viață.',
    'home.cta.title': 'Începe să Îți Planifici Călătoria de Vis', 'home.cta.subtitle': 'Creează un itinerariu personalizat în câteva minute.',
    'footer.brand_desc': 'Partenerul tău ideal de călătorie pentru a descoperi destinații uimitoare.',
    'footer.explore': 'Explorează', 'footer.top_destinations': 'Destinații de Top', 'footer.contact': 'Contact',
    'footer.dest.santorini': 'Santorini, Grecia', 'footer.dest.bali': 'Bali, Indonezia',
    'footer.dest.paris': 'Paris, Franța', 'footer.dest.maldives': 'Maldive',
    'footer.dest.tokyo': 'Tokyo, Japonia', 'footer.dest.dubai': 'Dubai, EAU',
    'footer.address_line1': 'Aleea Explorer 123', 'footer.address_line2': 'San Francisco, CA 94102',
    'footer.rights': '© 2026 TravelDreams. Toate drepturile rezervate.',
    'footer.privacy': 'Politica de Confidențialitate', 'footer.terms': 'Termeni și Condiții', 'footer.cookies': 'Politica de Cookie-uri',
    'rentals.all_types': 'Toate Tipurile', 'rentals.type.villas': 'Vile', 'rentals.type.apartments': 'Apartamente',
    'rentals.type.traditional_plural': 'Tradiționale', 'rentals.type.chalets': 'Cabane',
    'rentals.listings': 'listări', 'rentals.search_placeholder': 'Caută închirieri...',
    'rentals.sort.top_rated': 'Cel Mai Bun Rating', 'rentals.sort.price_low_high': 'Preț: Crescător',
    'rentals.sort.price_high_low': 'Preț: Descrescător', 'rentals.max_price': 'Preț Maxim',
    'rentals.per_night_short': '/noapte', 'rentals.min_guests_capacity': 'Capacitate Minimă Oaspeți',
    'rentals.available': 'închirieri disponibile', 'rentals.type.apartment': 'Apartament',
    'rentals.type.villa': 'Vilă', 'rentals.type.traditional': 'Tradițional', 'rentals.type.chalet': 'Cabană',
    'rentals.bed': 'pat', 'rentals.bath': 'baie', 'rentals.hosted_by': 'Găzduit de',
    'favorites.saved': 'salvate', 'favorites.place_singular': 'loc', 'favorites.place_plural': 'locuri',
    'favorites.filter.all': 'Toate', 'favorites.type.destination': 'Destinație',
    'favorites.type.hotel': 'Hotel', 'favorites.type.rental': 'Închiriere',
    'favorites.empty_sub': 'Salvează destinațiile, hotelurile și închirierile preferate.',
    'favorites.explore_destinations': 'Explorează Destinații', 'favorites.explore_short': 'Explorează',
    'favorites.cta_title': 'Gata să îți planifici călătoria?', 'favorites.cta_subtitle': 'Folosește planificatorul pentru itinerariul perfect.',
    'favorites.open_planner': 'Deschide Planificatorul',
    'planner.trip_settings': 'Setări Călătorie', 'planner.destination': 'Destinație',
    'planner.budget_summary': 'Rezumat Buget', 'planner.total_budget': 'Buget Total',
    'planner.planning_for': 'Planificare pentru', 'planner.best': 'Ideal',
    'planner.share': 'Distribuie', 'planner.export': 'Exportă', 'planner.day': 'Ziua',
    'planner.suggest': 'Sugerează', 'planner.activity_title': 'Titlu activitate *',
    'planner.notes_optional': 'Notițe (opțional)', 'planner.cost': 'Cost ($)',
    'booking.confirmed_for': 'Rezervarea pentru', 'booking.confirmed_suffix': 'a fost confirmată.',
    'booking.step': 'Pasul', 'booking.of': 'din', 'booking.peak_season': 'Sezon de vârf',
    'booking.offseason_deal': 'Ofertă extrasezon', 'booking.taxes_fees': 'Taxe și comisioane',
    'booking.continue_details': 'Continuă la Detalii', 'booking.payment_details': 'Detalii Plată',
    'booking.card_number': 'Număr card: **** **** **** 4242', 'booking.expiry': 'LL / AA', 'booking.cvc': 'CVC',
    'booking.placeholder_name': 'Ion Popescu', 'booking.placeholder_email': 'ion@example.com',
    'booking.placeholder_phone': '+40 712 345 678', 'booking.placeholder_special': 'Check-in târziu...',
    'planner.title': 'Planificatorul Meu de Călătorie', 'planner.subtitle': 'Construiește itinerariul perfect zi cu zi',
    'planner.add_day': 'Adaugă Zi', 'planner.add_activity': 'Adaugă Activitate',
    'planner.trip_name': 'Numele Călătoriei', 'planner.start_date': 'Data de Start', 'planner.duration': 'Durată', 'planner.days': 'zile',
    'favorites.title': 'Favoritele Mele', 'favorites.subtitle': 'Destinațiile, hotelurile și închirierile salvate',
    'favorites.empty': 'Nu ai favorite încă. Începe să explorezi!',
    'chat.title': 'Asistent de Călătorie', 'chat.subtitle': 'Întreabă orice despre destinația ta',
    'chat.placeholder': 'Întreabă despre destinații, hoteluri, vize...', 'chat.send': 'Trimite', 'chat.online': 'Online',
    'admin.title': 'Panou Admin', 'admin.users': 'Utilizatori', 'admin.hotels': 'Hoteluri',
    'admin.bookings': 'Rezervări', 'admin.revenue': 'Venituri', 'admin.manage': 'Gestionează',
    'booking.title': 'Finalizează Rezervarea', 'booking.name': 'Nume Complet',
    'booking.email': 'Adresă Email', 'booking.phone': 'Număr Telefon',
    'booking.special': 'Cereri Speciale', 'booking.success': 'Rezervare Confirmată!',
  },
  ru: {
    'nav.home': 'Главная', 'nav.destinations': 'Направления', 'nav.hotels': 'Отели',
    'nav.rentals': 'Аренда', 'nav.planner': 'Планировщик', 'nav.favorites': 'Избранное',
    'nav.chat': 'Чат', 'nav.admin': 'Админ', 'nav.signin': 'Войти',
    'nav.role.user': 'Путешественник', 'nav.role.host': 'Хозяин', 'nav.role.admin': 'Админ',
    'hero.title': 'Откройте для Себя Место Своей Мечты',
    'hero.subtitle': 'Исследуйте потрясающие направления, бронируйте роскошное жильё и создавайте незабываемые путешествия.',
    'hero.search': 'Куда вы хотите поехать?', 'hero.checkin': 'Заезд', 'hero.checkout': 'Выезд',
    'hero.guests': 'Гости', 'hero.search_btn': 'Поиск', 'hero.explore': 'Исследовать',
    'section.top_destinations': 'Лучшие Направления', 'section.top_destinations_sub': 'Тщательно отобранные места',
    'section.featured_hotels': 'Избранные Отели', 'section.featured_hotels_sub': 'Роскошное проживание для любого бюджета',
    'section.rentals': 'Уникальная Аренда', 'section.rentals_sub': 'Виллы, апартаменты и традиционные дома',
    'section.culture': 'Культура и Опыт', 'section.cuisine': 'Местная Кухня',
    'section.must_visit': 'Обязательно к Посещению', 'section.how_it_works': 'Как Это Работает',
    'common.per_night': 'за ночь', 'common.book_now': 'Забронировать', 'common.view_details': 'Подробнее',
    'common.add_wishlist': 'В избранное', 'common.remove_wishlist': 'Удалить', 'common.rating': 'Рейтинг',
    'common.reviews': 'отзывов', 'common.from': 'От', 'common.guests': 'гостей', 'common.nights': 'ночей',
    'common.total': 'Итого', 'common.cancel': 'Отмена', 'common.confirm': 'Подтвердить Бронь',
    'common.see_all': 'Смотреть всё', 'common.save': 'Сохранить', 'common.filter': 'Фильтр',
    'common.sort': 'Сортировать', 'common.search': 'Поиск', 'common.clear_all': 'Очистить всё', 'common.any': 'Любой',
    'destinations.found': 'направлений найдено', 'destinations.tab.overview': 'Обзор',
    'destinations.tab.culture': 'Культура', 'destinations.tab.cuisine': 'Кухня',
    'destinations.tab.mustvisit': 'Обязательно', 'destinations.best_season': 'Лучший сезон',
    'destinations.tags': 'Теги', 'destinations.in_favorites': 'В Избранном',
    'destinations.add_favorites': 'В Избранное', 'destinations.explore_hotels': 'Смотреть Отели',
    'destinations.continent.all': 'Все', 'destinations.continent.europe': 'Европа',
    'destinations.continent.asia': 'Азия', 'destinations.continent.middle_east': 'Ближний Восток',
    'destinations.continent.americas': 'Америка', 'destinations.continent.africa': 'Африка',
    'destinations.tag.beach': 'Пляж', 'destinations.tag.culture': 'Культура',
    'destinations.tag.romance': 'Романтика', 'destinations.tag.adventure': 'Приключения',
    'destinations.tag.food': 'Еда', 'destinations.tag.luxury': 'Люкс',
    'destinations.tag.city': 'Город', 'destinations.tag.nature': 'Природа',
    'hotels.search_placeholder': 'Поиск отелей...', 'hotels.all_destinations': 'Все Направления',
    'hotels.sort.top_rated': 'С Высоким Рейтингом', 'hotels.sort.price_low_high': 'Цена: По Возрастанию',
    'hotels.sort.price_high_low': 'Цена: По Убыванию', 'hotels.max_price': 'Макс. Цена',
    'hotels.min_stars': 'Мин. Звезды', 'hotels.available': 'отелей доступно',
    'hotels.saved': 'Сохранено', 'hotels.save': 'Сохранить', 'hotels.per_night_short': '/ночь',
    'hotels.type.luxury': 'Люкс', 'hotels.type.boutique': 'Бутик', 'hotels.type.budget': 'Бюджет', 'hotels.type.resort': 'Курорт',
    'home.stats.countries': 'Страны', 'home.stats.hotels': 'Отели',
    'home.stats.travelers': 'Счастливые Путешественники', 'home.stats.avg_rating': 'Средний Рейтинг',
    'home.culture.badge': 'Погрузитесь Глубже', 'home.culture.description': 'У каждого направления есть своя история.',
    'home.culture.item1_title': 'Культурные Фестивали', 'home.culture.item1_desc': 'Участвуйте в местных праздниках',
    'home.culture.item2_title': 'Гастрономические Туры', 'home.culture.item2_desc': 'Пробуйте аутентичные блюда',
    'home.culture.item3_title': 'Исторические Места', 'home.culture.item3_desc': 'Исследуйте древние руины и музеи',
    'home.cuisine.item1_name': 'Азиатская Уличная Еда', 'home.cuisine.item1_dest': 'Бангкок и Токио',
    'home.cuisine.item2_name': 'Итальянская Кухня', 'home.cuisine.item2_dest': 'Рим и Флоренция',
    'home.cuisine.item3_name': 'Балийские Угощения', 'home.cuisine.item3_dest': 'Убуд, Бали',
    'home.how.subtitle': 'Простые шаги к идеальному путешествию',
    'home.how.search_title': 'Поиск и Открытие', 'home.how.search_desc': 'Просматривайте сотни направлений.',
    'home.how.plan_title': 'Планируйте и Настраивайте', 'home.how.plan_desc': 'Создайте идеальный маршрут.',
    'home.how.book_title': 'Безопасное Бронирование', 'home.how.book_desc': 'Бронируйте с уверенностью.',
    'home.how.travel_title': 'Путешествуйте и Наслаждайтесь', 'home.how.travel_desc': 'Исследуйте мир.',
    'home.cta.title': 'Начните Планировать Путешествие Мечты', 'home.cta.subtitle': 'Создайте персональный маршрут за минуты.',
    'footer.brand_desc': 'Ваш идеальный помощник в путешествиях.',
    'footer.explore': 'Исследуйте', 'footer.top_destinations': 'Лучшие Направления', 'footer.contact': 'Контакты',
    'footer.dest.santorini': 'Санторини, Греция', 'footer.dest.bali': 'Бали, Индонезия',
    'footer.dest.paris': 'Париж, Франция', 'footer.dest.maldives': 'Мальдивы',
    'footer.dest.tokyo': 'Токио, Япония', 'footer.dest.dubai': 'Дубай, ОАЭ',
    'footer.address_line1': '123 Explorer Avenue', 'footer.address_line2': 'San Francisco, CA 94102',
    'footer.rights': '© 2026 TravelDreams. Все права защищены.',
    'footer.privacy': 'Политика Конфиденциальности', 'footer.terms': 'Условия Использования', 'footer.cookies': 'Политика Cookie',
    'rentals.all_types': 'Все Типы', 'rentals.type.villas': 'Виллы', 'rentals.type.apartments': 'Апартаменты',
    'rentals.type.traditional_plural': 'Традиционные', 'rentals.type.chalets': 'Шале',
    'rentals.listings': 'объявлений', 'rentals.search_placeholder': 'Поиск аренды...',
    'rentals.sort.top_rated': 'С Высоким Рейтингом', 'rentals.sort.price_low_high': 'Цена: По Возрастанию',
    'rentals.sort.price_high_low': 'Цена: По Убыванию', 'rentals.max_price': 'Макс. Цена',
    'rentals.per_night_short': '/ночь', 'rentals.min_guests_capacity': 'Мин. Вместимость',
    'rentals.available': 'вариантов аренды', 'rentals.type.apartment': 'Апартаменты',
    'rentals.type.villa': 'Вилла', 'rentals.type.traditional': 'Традиционный', 'rentals.type.chalet': 'Шале',
    'rentals.bed': 'спальня', 'rentals.bath': 'ванная', 'rentals.hosted_by': 'Хозяин',
    'favorites.saved': 'сохранено', 'favorites.place_singular': 'место', 'favorites.place_plural': 'мест',
    'favorites.filter.all': 'Все', 'favorites.type.destination': 'Направление',
    'favorites.type.hotel': 'Отель', 'favorites.type.rental': 'Аренда',
    'favorites.empty_sub': 'Сохраняйте любимые направления, отели и аренду.',
    'favorites.explore_destinations': 'Смотреть Направления', 'favorites.explore_short': 'Смотреть',
    'favorites.cta_title': 'Готовы спланировать поездку?', 'favorites.cta_subtitle': 'Используйте планировщик путешествий.',
    'favorites.open_planner': 'Открыть Планировщик',
    'planner.trip_settings': 'Настройки Поездки', 'planner.destination': 'Направление',
    'planner.budget_summary': 'Сводка Бюджета', 'planner.total_budget': 'Общий Бюджет',
    'planner.planning_for': 'Планирование для', 'planner.best': 'Лучшее',
    'planner.share': 'Поделиться', 'planner.export': 'Экспорт', 'planner.day': 'День',
    'planner.suggest': 'Подсказать', 'planner.activity_title': 'Название активности *',
    'planner.notes_optional': 'Заметки (необязательно)', 'planner.cost': 'Стоимость ($)',
    'booking.confirmed_for': 'Бронирование для', 'booking.confirmed_suffix': 'подтверждено.',
    'booking.step': 'Шаг', 'booking.of': 'из', 'booking.peak_season': 'Высокий сезон',
    'booking.offseason_deal': 'Выгодно вне сезона', 'booking.taxes_fees': 'Налоги и сборы',
    'booking.continue_details': 'Перейти к Деталям', 'booking.payment_details': 'Детали Оплаты',
    'booking.card_number': 'Номер карты: **** **** **** 4242', 'booking.expiry': 'ММ / ГГ', 'booking.cvc': 'CVC',
    'booking.placeholder_name': 'Иван Иванов', 'booking.placeholder_email': 'ivan@example.com',
    'booking.placeholder_phone': '+7 999 123 45 67', 'booking.placeholder_special': 'Поздний заезд...',
    'planner.title': 'Мой Планировщик Путешествий', 'planner.subtitle': 'Создайте идеальный маршрут день за днём',
    'planner.add_day': 'Добавить День', 'planner.add_activity': 'Добавить Активность',
    'planner.trip_name': 'Название Поездки', 'planner.start_date': 'Дата Начала', 'planner.duration': 'Продолжительность', 'planner.days': 'дней',
    'favorites.title': 'Моё Избранное', 'favorites.subtitle': 'Сохранённые направления, отели и аренда',
    'favorites.empty': 'Пока нет избранного. Начните исследовать!',
    'chat.title': 'Тревел-Ассистент', 'chat.subtitle': 'Спрашивайте всё о вашем направлении',
    'chat.placeholder': 'Спросите о направлениях, отелях, визах...', 'chat.send': 'Отправить', 'chat.online': 'Онлайн',
    'admin.title': 'Панель Администратора', 'admin.users': 'Пользователи', 'admin.hotels': 'Отели',
    'admin.bookings': 'Бронирования', 'admin.revenue': 'Доход', 'admin.manage': 'Управление',
    'booking.title': 'Завершить Бронирование', 'booking.name': 'Полное Имя',
    'booking.email': 'Электронная Почта', 'booking.phone': 'Номер Телефона',
    'booking.special': 'Особые Пожелания', 'booking.success': 'Бронирование Подтверждено!',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const EXCHANGE_RATES: Record<Language, number> = { 'en': 1.0, 'ro': 4.97, 'ru': 98.50 };
const CURRENCY_SYMBOLS: Record<Language, string> = { 'en': '$', 'ro': 'lei', 'ru': '₽' };

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Existing state ────────────────────────────────────────────────────────
  const [language, setLanguage] = useState<Language>('en');
  const [role, setRole] = useState<UserRole>('user');
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'light';
  });
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<Language, Record<string, string>>>({ en: {}, ro: {}, ru: {} });
  const pendingTranslations = useRef<Set<string>>(new Set());

  // ── New state ─────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [hostListings, setHostListings] = useState<HostListing[]>(INITIAL_LISTINGS);
  const [mockUsers, setMockUsers] = useState(MOCK_USERS);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('td_user');
      if (saved) {
        const user = JSON.parse(saved) as User;
        setCurrentUser(user);
        setRole(user.role);
      }
    } catch {}
    setIsAuthLoading(false);
  }, []);

  // ── Theme (unchanged) ─────────────────────────────────────────────────────
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (theme === 'dark') { htmlElement.classList.add('dark'); }
    else { htmlElement.classList.remove('dark'); }
    htmlElement.style.colorScheme = theme;
  }, [theme]);

  const setTheme = (newTheme: Theme) => { setThemeState(newTheme); localStorage.setItem('theme', newTheme); };
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // ── NEW: Auth ─────────────────────────────────────────────────────────────
  async function login(email: string, password: string) {
    setIsAuthLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const found = mockUsers.find(u => u.email === email && u.password === password);
    setIsAuthLoading(false);
    if (!found) return { success: false, error: 'Invalid email or password.' };
    const { password: _pw, ...user } = found;
    setCurrentUser(user);
    setRole(user.role);
    localStorage.setItem('td_user', JSON.stringify(user));
    return { success: true };
  }

  function logout() {
    setCurrentUser(null);
    setRole('user');
    localStorage.removeItem('td_user');
  }

  async function register(data: RegisterData) {
    setIsAuthLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const exists = mockUsers.find(u => u.email === data.email);
    if (exists) { setIsAuthLoading(false); return { success: false, error: 'Email already in use.' }; }
    const newUser = { id: 'host-' + Date.now(), name: data.name, email: data.email, phone: data.phone, role: 'host' as UserRole, password: data.password };
    setMockUsers(prev => [...prev, newUser]);
    const { password: _pw, ...user } = newUser;
    setCurrentUser(user);
    setRole('host');
    localStorage.setItem('td_user', JSON.stringify(user));
    setIsAuthLoading(false);
    return { success: true };
  }

  // ── NEW: Host listing actions ──────────────────────────────────────────────
  function addHostListing(listing: Omit<HostListing, 'id' | 'hostId' | 'hostName' | 'status' | 'submittedAt'>) {
    if (!currentUser) return;
    setHostListings(prev => [{
      ...listing,
      id: 'hl-' + Date.now(),
      hostId: currentUser.id,
      hostName: currentUser.name,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }, ...prev]);
  }

  function updateHostListing(id: string, data: Partial<HostListing>) {
    setHostListings(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }

  function deleteHostListing(id: string) {
    setHostListings(prev => prev.filter(l => l.id !== id));
  }

  function approveListing(id: string, note?: string) {
    setHostListings(prev => prev.map(l => l.id === id ? {
      ...l, status: 'approved' as ListingStatus,
      reviewedAt: new Date().toISOString(),
      reviewNote: note || 'Approved.',
    } : l));
  }

  function rejectListing(id: string, note?: string) {
    setHostListings(prev => prev.map(l => l.id === id ? {
      ...l, status: 'rejected' as ListingStatus,
      reviewedAt: new Date().toISOString(),
      reviewNote: note || 'Rejected.',
    } : l));
  }

  function getMyListings() {
    if (!currentUser) return [];
    return hostListings.filter(l => l.hostId === currentUser.id);
  }

  function getPendingListings() { return hostListings.filter(l => l.status === 'pending'); }
  function getApprovedListings() { return hostListings.filter(l => l.status === 'approved'); }

  // ── Existing: Translation logic (unchanged) ───────────────────────────────
  const shouldTranslate = (text: string): boolean => {
    if (!text || text.trim().length < 2) return false;
    const hasLetters = /[A-Za-zÀ-ÖØ-öø-ÿА-Яа-я]/.test(text);
    const hasManySymbols = /^[^A-Za-zÀ-ÖØ-öø-ÿА-Яа-я0-9\s]+$/.test(text);
    return hasLetters && !hasManySymbols;
  };

  const translateWithGoogle = async (text: string, target: Language): Promise<string> => {
    if (target === 'en') return text;
    const params = new URLSearchParams({ client: 'gtx', sl: 'en', tl: target, dt: 't', q: text });
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
    if (!res.ok) return text;
    const data = await res.json();
    const translated = Array.isArray(data?.[0]) ? data[0].map((chunk: any[]) => chunk?.[0] ?? '').join('') : '';
    return translated || text;
  };

  const translateDynamic = (text: string): string => {
    if (language === 'en' || !shouldTranslate(text)) return text;
    const cached = dynamicTranslations[language][text];
    if (cached) return cached;
    const cacheKey = `${language}::${text}`;
    if (!pendingTranslations.current.has(cacheKey)) {
      pendingTranslations.current.add(cacheKey);
      void translateWithGoogle(text, language)
        .then(translated => setDynamicTranslations(prev => ({ ...prev, [language]: { ...prev[language], [text]: translated } })))
        .catch(() => {})
        .finally(() => pendingTranslations.current.delete(cacheKey));
    }
    return text;
  };

  const t = (key: string): string => {
    const localized = translations[language][key];
    if (localized) return localized;
    const english = translations['en'][key];
    if (!english) return key;
    return translateDynamic(english);
  };

  const getCurrencySymbol = (): string => CURRENCY_SYMBOLS[language];
  const getPriceWithoutFormat = (price: number): number => Math.round(price * EXCHANGE_RATES[language]);
  const formatPrice = (price: number): string => {
    const p = getPriceWithoutFormat(price);
    const s = CURRENCY_SYMBOLS[language];
    if (language === 'en') return `${s}${p}`;
    if (language === 'ro') return `${p} ${s}`;
    return `${p}${s}`;
  };

  const addFavorite = (item: FavoriteItem) => setFavorites(prev => prev.find(f => f.id === item.id) ? prev : [...prev, item]);
  const removeFavorite = (id: string) => setFavorites(prev => prev.filter(f => f.id !== id));
  const isFavorite = (id: string) => favorites.some(f => f.id === id);

  return (
    <AppContext.Provider value={{
      // Existing
      language, setLanguage, role, setRole, theme, setTheme, toggleTheme,
      favorites, addFavorite, removeFavorite, isFavorite,
      t, translateDynamic, formatPrice, getPriceWithoutFormat, getCurrencySymbol,
      // New
      currentUser, login, logout, register, isAuthLoading,
      hostListings, addHostListing, updateHostListing, deleteHostListing,
      approveListing, rejectListing,
      getMyListings, getPendingListings, getApprovedListings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}