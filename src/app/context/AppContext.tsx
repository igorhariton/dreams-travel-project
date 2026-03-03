import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface AppContextType {
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
  formatPrice: (price: number) => string;
  getPriceWithoutFormat: (price: number) => number;
  getCurrencySymbol: () => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.destinations': 'Destinations',
    'nav.hotels': 'Hotels',
    'nav.rentals': 'Rentals',
    'nav.planner': 'Planner',
    'nav.favorites': 'Favorites',
    'nav.chat': 'Chat',
    'nav.admin': 'Admin',
    'nav.signin': 'Sign In',
    'nav.role.user': 'Traveler',
    'nav.role.host': 'Host',
    'nav.role.admin': 'Admin',
    // Hero
    'hero.title': 'Discover Your Next Dream Destination',
    'hero.subtitle': 'Explore breathtaking destinations, book luxury stays, and craft unforgettable journeys.',
    'hero.search': 'Where do you want to go?',
    'hero.checkin': 'Check-in',
    'hero.checkout': 'Check-out',
    'hero.guests': 'Guests',
    'hero.search_btn': 'Search',
    'hero.explore': 'Explore Now',
    // Sections
    'section.top_destinations': 'Top Destinations',
    'section.top_destinations_sub': 'Handpicked places loved by travelers worldwide',
    'section.featured_hotels': 'Featured Hotels',
    'section.featured_hotels_sub': 'Luxury stays for every budget and style',
    'section.rentals': 'Unique Rentals',
    'section.rentals_sub': 'Villas, apartments and traditional houses',
    'section.culture': 'Culture & Experiences',
    'section.cuisine': 'Local Cuisine',
    'section.must_visit': 'Must-Visit Places',
    'section.how_it_works': 'How It Works',
    // Common
    'common.per_night': 'per night',
    'common.book_now': 'Book Now',
    'common.view_details': 'View Details',
    'common.add_wishlist': 'Add to Wishlist',
    'common.remove_wishlist': 'Remove',
    'common.rating': 'Rating',
    'common.reviews': 'reviews',
    'common.from': 'From',
    'common.guests': 'guests',
    'common.nights': 'nights',
    'common.total': 'Total',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm Booking',
    'common.see_all': 'See All',
    'common.save': 'Save',
    'common.filter': 'Filter',
    'common.sort': 'Sort By',
    'common.search': 'Search',
    // Planner
    'planner.title': 'My Travel Planner',
    'planner.subtitle': 'Build your perfect itinerary day by day',
    'planner.add_day': 'Add Day',
    'planner.add_activity': 'Add Activity',
    'planner.trip_name': 'Trip Name',
    'planner.start_date': 'Start Date',
    'planner.duration': 'Duration',
    'planner.days': 'days',
    // Favorites
    'favorites.title': 'My Favorites',
    'favorites.subtitle': 'Your saved destinations, hotels and rentals',
    'favorites.empty': 'No favorites yet. Start exploring!',
    // Chat
    'chat.title': 'Travel Assistant',
    'chat.subtitle': 'Ask anything about your destination',
    'chat.placeholder': 'Ask about destinations, hotels, visa requirements...',
    'chat.send': 'Send',
    'chat.online': 'Online',
    // Admin
    'admin.title': 'Admin Dashboard',
    'admin.users': 'Users',
    'admin.hotels': 'Hotels',
    'admin.bookings': 'Bookings',
    'admin.revenue': 'Revenue',
    'admin.manage': 'Manage',
    // Booking
    'booking.title': 'Complete Your Booking',
    'booking.name': 'Full Name',
    'booking.email': 'Email Address',
    'booking.phone': 'Phone Number',
    'booking.special': 'Special Requests',
    'booking.success': 'Booking Confirmed!',
  },
  ro: {
    // Nav
    'nav.home': 'Acasă',
    'nav.destinations': 'Destinații',
    'nav.hotels': 'Hoteluri',
    'nav.rentals': 'Închirieri',
    'nav.planner': 'Planificator',
    'nav.favorites': 'Favorite',
    'nav.chat': 'Chat',
    'nav.admin': 'Admin',
    'nav.signin': 'Conectare',
    'nav.role.user': 'Călător',
    'nav.role.host': 'Gazdă',
    'nav.role.admin': 'Admin',
    // Hero
    'hero.title': 'Descoperă Următoarea Ta Destinație de Vis',
    'hero.subtitle': 'Explorează destinații spectaculoase, rezervă cazări de lux și creează călătorii de neuitat.',
    'hero.search': 'Unde vrei să mergi?',
    'hero.checkin': 'Check-in',
    'hero.checkout': 'Check-out',
    'hero.guests': 'Oaspeți',
    'hero.search_btn': 'Caută',
    'hero.explore': 'Explorează Acum',
    // Sections
    'section.top_destinations': 'Destinații de Top',
    'section.top_destinations_sub': 'Locuri alese cu grijă, iubite de călătorii din toată lumea',
    'section.featured_hotels': 'Hoteluri Recomandate',
    'section.featured_hotels_sub': 'Cazări de lux pentru orice buget și stil',
    'section.rentals': 'Închirieri Unice',
    'section.rentals_sub': 'Vile, apartamente și case tradiționale',
    'section.culture': 'Cultură și Experiențe',
    'section.cuisine': 'Bucătărie Locală',
    'section.must_visit': 'Locuri de Vizitat',
    'section.how_it_works': 'Cum Funcționează',
    // Common
    'common.per_night': 'pe noapte',
    'common.book_now': 'Rezervă Acum',
    'common.view_details': 'Vezi Detalii',
    'common.add_wishlist': 'Adaugă la Favorite',
    'common.remove_wishlist': 'Elimină',
    'common.rating': 'Rating',
    'common.reviews': 'recenzii',
    'common.from': 'De la',
    'common.guests': 'oaspeți',
    'common.nights': 'nopți',
    'common.total': 'Total',
    'common.cancel': 'Anulează',
    'common.confirm': 'Confirmă Rezervarea',
    'common.see_all': 'Vezi Tot',
    'common.save': 'Salvează',
    'common.filter': 'Filtrează',
    'common.sort': 'Sortează',
    'common.search': 'Caută',
    // Planner
    'planner.title': 'Planificatorul Meu de Călătorie',
    'planner.subtitle': 'Construiește itinerariul perfect zi cu zi',
    'planner.add_day': 'Adaugă Zi',
    'planner.add_activity': 'Adaugă Activitate',
    'planner.trip_name': 'Numele Călătoriei',
    'planner.start_date': 'Data de Start',
    'planner.duration': 'Durată',
    'planner.days': 'zile',
    // Favorites
    'favorites.title': 'Favoritele Mele',
    'favorites.subtitle': 'Destinațiile, hotelurile și închirierile salvate',
    'favorites.empty': 'Nu ai favorite încă. Începe să explorezi!',
    // Chat
    'chat.title': 'Asistent de Călătorie',
    'chat.subtitle': 'Întreabă orice despre destinația ta',
    'chat.placeholder': 'Întreabă despre destinații, hoteluri, vize...',
    'chat.send': 'Trimite',
    'chat.online': 'Online',
    // Admin
    'admin.title': 'Panou Admin',
    'admin.users': 'Utilizatori',
    'admin.hotels': 'Hoteluri',
    'admin.bookings': 'Rezervări',
    'admin.revenue': 'Venituri',
    'admin.manage': 'Gestionează',
    // Booking
    'booking.title': 'Finalizează Rezervarea',
    'booking.name': 'Nume Complet',
    'booking.email': 'Adresă Email',
    'booking.phone': 'Număr Telefon',
    'booking.special': 'Cereri Speciale',
    'booking.success': 'Rezervare Confirmată!',
  },
  ru: {
    // Nav
    'nav.home': 'Главная',
    'nav.destinations': 'Направления',
    'nav.hotels': 'Отели',
    'nav.rentals': 'Аренда',
    'nav.planner': 'Планировщик',
    'nav.favorites': 'Избранное',
    'nav.chat': 'Чат',
    'nav.admin': 'Админ',
    'nav.signin': 'Войти',
    'nav.role.user': 'Путешественник',
    'nav.role.host': 'Хозяин',
    'nav.role.admin': 'Админ',
    // Hero
    'hero.title': 'Откройте для Себя Место Своей Мечты',
    'hero.subtitle': 'Исследуйте потрясающие направления, бронируйте роскошное жильё и создавайте незабываемые путешествия.',
    'hero.search': 'Куда вы хотите поехать?',
    'hero.checkin': 'Заезд',
    'hero.checkout': 'Выезд',
    'hero.guests': 'Гости',
    'hero.search_btn': 'Поиск',
    'hero.explore': 'Исследовать',
    // Sections
    'section.top_destinations': 'Лучшие Направления',
    'section.top_destinations_sub': 'Тщательно отобранные места, любимые путешественниками всего мира',
    'section.featured_hotels': 'Избранные Отели',
    'section.featured_hotels_sub': 'Роскошное проживание для любого бюджета и стиля',
    'section.rentals': 'Уникальная Аренда',
    'section.rentals_sub': 'Виллы, апартаменты и традиционные дома',
    'section.culture': 'Культура и Опыт',
    'section.cuisine': 'Местная Кухня',
    'section.must_visit': 'Обязательно к Посещению',
    'section.how_it_works': 'Как Это Работает',
    // Common
    'common.per_night': 'за ночь',
    'common.book_now': 'Забронировать',
    'common.view_details': 'Подробнее',
    'common.add_wishlist': 'В избранное',
    'common.remove_wishlist': 'Удалить',
    'common.rating': 'Рейтинг',
    'common.reviews': 'отзывов',
    'common.from': 'От',
    'common.guests': 'гостей',
    'common.nights': 'ночей',
    'common.total': 'Итого',
    'common.cancel': 'Отмена',
    'common.confirm': 'Подтвердить Бронь',
    'common.see_all': 'Смотреть всё',
    'common.save': 'Сохранить',
    'common.filter': 'Фильтр',
    'common.sort': 'Сортировать',
    'common.search': 'Поиск',
    // Planner
    'planner.title': 'Мой Планировщик Путешествий',
    'planner.subtitle': 'Создайте идеальный маршрут день за днём',
    'planner.add_day': 'Добавить День',
    'planner.add_activity': 'Добавить Активность',
    'planner.trip_name': 'Название Поездки',
    'planner.start_date': 'Дата Начала',
    'planner.duration': 'Продолжительность',
    'planner.days': 'дней',
    // Favorites
    'favorites.title': 'Моё Избранное',
    'favorites.subtitle': 'Сохранённые направления, отели и аренда',
    'favorites.empty': 'Пока нет избранного. Начните исследовать!',
    // Chat
    'chat.title': 'Тревел-Ассистент',
    'chat.subtitle': 'Спрашивайте всё о вашем направлении',
    'chat.placeholder': 'Спросите о направлениях, отелях, визах...',
    'chat.send': 'Отправить',
    'chat.online': 'Онлайн',
    // Admin
    'admin.title': 'Панель Администратора',
    'admin.users': 'Пользователи',
    'admin.hotels': 'Отели',
    'admin.bookings': 'Бронирования',
    'admin.revenue': 'Доход',
    'admin.manage': 'Управление',
    // Booking
    'booking.title': 'Завершить Бронирование',
    'booking.name': 'Полное Имя',
    'booking.email': 'Электронная Почта',
    'booking.phone': 'Номер Телефона',
    'booking.special': 'Особые Пожелания',
    'booking.success': 'Бронирование Подтверждено!',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Exchange rates relative to USD (base currency)
const EXCHANGE_RATES: Record<Language, number> = {
  'en': 1.0,      // USD
  'ro': 4.97,     // RON (Romanian Lei)
  'ru': 98.50,    // RUB (Russian Ruble)
};

const CURRENCY_SYMBOLS: Record<Language, string> = {
  'en': '$',      // USD
  'ro': 'lei',    // Romanian Lei
  'ru': '₽',      // Russian Ruble
};

export function AppProvider({ children }: { children: ReactNode }) {
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

  // Apply theme on mount and when it changes
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    // Force a reflow to ensure CSS variables are recalculated
    htmlElement.style.colorScheme = theme;
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const getCurrencySymbol = (): string => {
    return CURRENCY_SYMBOLS[language];
  };

  const getPriceWithoutFormat = (price: number): number => {
    const exchangeRate = EXCHANGE_RATES[language];
    return Math.round(price * exchangeRate);
  };

  const formatPrice = (price: number): string => {
    const convertedPrice = getPriceWithoutFormat(price);
    const symbol = CURRENCY_SYMBOLS[language];
    
    // Format based on currency
    if (language === 'en') {
      return `${symbol}${convertedPrice}`;
    } else if (language === 'ro') {
      return `${convertedPrice} ${symbol}`;
    } else if (language === 'ru') {
      return `${convertedPrice}${symbol}`;
    }
    return `${symbol}${convertedPrice}`;
  };

  const addFavorite = (item: FavoriteItem) => {
    setFavorites(prev => {
      if (prev.find(f => f.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const isFavorite = (id: string) => favorites.some(f => f.id === id);

  return (
    <AppContext.Provider value={{ language, setLanguage, role, setRole, theme, setTheme, toggleTheme, favorites, addFavorite, removeFavorite, isFavorite, t, formatPrice, getPriceWithoutFormat, getCurrencySymbol }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
