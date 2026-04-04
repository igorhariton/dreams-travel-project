// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Building2, Home, Star, Pencil, Trash2, Plus, AlertTriangle,
  LayoutDashboard, BarChart3, Database, Link2, ChevronRight, BedDouble, Users,
  Globe2, Download, X, ImagePlus, FileText, FolderKanban, CheckCircle2,
  SlidersHorizontal, ArrowUpDown, Clock, XCircle, MessageSquare, ShieldCheck, LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { Destination, Hotel, Rental } from '../data/travelData';
import { useApp } from '../context/AppContext';
import type { HostListing } from '../context/AppContext';

type ViewMode = 'destinations' | 'hotels' | 'rentals';
type AdminSection =
  | 'dashboard'
  | 'destinations'
  | 'hotels'
  | 'rentals'
  | 'content'
  | 'broken-links'
  | 'analytics'
  | 'host-listings';

type AddItemType = 'destination' | 'hotel' | 'rental';

type AddFormState = {
  type: AddItemType;
  name: string;
  destinationId: string;
  location: string;
  country: string;
  continent: string;
  description: string;
  pricePerNight: string;
  typeLabel: string;
  host: string;
  stars: string;
  bedrooms: string;
  bathrooms: string;
  maxGuests: string;
  bestSeason: string;
  tags: string;
  amenities: string;
  imageUrls: string[];
};

function normalize(value?: string) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatPrice(value: number) {
  return '$' + value.toLocaleString() + '/night';
}

function buildDestinationMap(destinations: Destination[]) {
  const map = new Map<string, Destination>();
  destinations.forEach((destination) => {
    map.set(normalize(destination.id), destination);
    map.set(normalize(destination.name), destination);
    map.set(normalize(destination.country), destination);
  });
  return map;
}

function findLinkedDestination(
  rawDestinationId: string,
  rawLocation: string,
  destinationMap: Map<string, Destination>,
  destinations: Destination[],
) {
  const byId = destinationMap.get(normalize(rawDestinationId));
  if (byId) return byId;
  const byLocation = destinationMap.get(normalize(rawLocation));
  if (byLocation) return byLocation;
  const normalizedDestinationId = normalize(rawDestinationId);
  const normalizedLocation = normalize(rawLocation);
  return destinations.find((destination) => {
    const destinationId = normalize(destination.id);
    const destinationName = normalize(destination.name);
    return (
      normalizedDestinationId.includes(destinationId) ||
      normalizedDestinationId.includes(destinationName) ||
      normalizedLocation.includes(destinationId) ||
      normalizedLocation.includes(destinationName)
    );
  });
}

function toArray(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

// ── FIX 1: StatCard — hint text și icon always white (fundal e gradient colorat)
function StatCard({
  title, value, icon: Icon, hint, tone,
}: {
  title: string; value: string | number; icon: React.ElementType; hint: string; tone: string;
}) {
  return (
    <div className={'isolate overflow-hidden rounded-[28px] border-0 text-white shadow-lg ' + tone}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/80">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-3 text-xs text-white/75">{hint}</p>
          </div>
          <div className="rounded-2xl bg-white/20 p-3">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="mt-5 flex gap-1.5 opacity-80">
          <span className="h-2 w-6 rounded-full bg-white/80" />
          <span className="h-2 w-3 rounded-full bg-white/50" />
          <span className="h-2 w-5 rounded-full bg-white/65" />
          <span className="h-2 w-2 rounded-full bg-white/35" />
        </div>
      </div>
    </div>
  );
}

// ── FIX 2: SidebarItem — active state pe light mai vizibil, hover mai clar
function SidebarItem({
  icon: Icon, label, active, badge, onClick, isDarkTheme,
}: {
  icon: React.ElementType; label: string; active?: boolean; badge?: string; onClick?: () => void; isDarkTheme?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'group relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition-all duration-200 ' +
        (active
          ? isDarkTheme
            ? 'translate-x-1 bg-white/14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]'
            : 'translate-x-1 bg-blue-100 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.3)]'
          : isDarkTheme
            ? 'text-slate-300 hover:bg-white/8 hover:text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
      }
    >
      <span className="flex items-center gap-3">
        <span className={'transition-transform duration-200 ' + (active ? 'scale-110' : 'group-hover:scale-105')}>
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      {badge ? (
        <span className={
          'rounded-full px-2 py-0.5 text-[10px] font-semibold transition ' +
          (active
            ? isDarkTheme ? 'bg-cyan-300/25 text-cyan-100' : 'bg-blue-200 text-blue-800'
            : isDarkTheme ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-200 text-slate-600')
        }>
          {badge}
        </span>
      ) : (
        <ChevronRight className={'h-4 w-4 transition ' + (active ? 'translate-x-1 opacity-90' : 'opacity-40')} />
      )}
      {active && <span className={`absolute inset-y-2 left-0 w-1 rounded-full ${isDarkTheme ? 'bg-cyan-300' : 'bg-blue-500'}`} />}
    </button>
  );
}

// ── FIX 3: EmptyState — text vizibil pe light
function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Card className="rounded-3xl border-dashed border-slate-300 bg-slate-50 shadow-none">
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold text-slate-800">{title}</p>
        <p className="mt-2 max-w-md text-sm text-slate-500">{text}</p>
      </CardContent>
    </Card>
  );
}

function ImageThumb({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-600">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
      )}
    </div>
  );
}

// ── FIX 4: SectionCard — bg explicit alb pe light
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="isolate overflow-hidden rounded-[28px] border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-900 shadow-sm">
      {children}
    </Card>
  );
}

// ── FIX 5: Pagination — text și border cu contrast corect pe light
function Pagination({ current, total, pageSize, onChange }: { current: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-slate-500">{Math.min((current - 1) * pageSize + 1, total)}–{Math.min(current * pageSize, total)} din {total}</p>
      <div className="flex gap-1">
        <button type="button" onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">← Prev</button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const page = totalPages <= 7 ? i + 1 : current <= 4 ? i + 1 : current >= totalPages - 3 ? totalPages - 6 + i : current - 3 + i;
          return (
            <button key={page} type="button" onClick={() => onChange(page)}
              className={'rounded-xl border px-3 py-1.5 text-sm transition ' + (page === current ? 'border-slate-900 bg-slate-950 text-white dark:bg-cyan-500 dark:border-cyan-500' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300')}>
              {page}
            </button>
          );
        })}
        <button type="button" onClick={() => onChange(Math.min(totalPages, current + 1))} disabled={current === totalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}

type Lang = 'en' | 'ro' | 'ru';

const T: Record<Lang, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard overview', destinations: 'Destinations management',
    hotels: 'Hotels management', rentals: 'Rentals management',
    content: 'Content studio', brokenLinks: 'Broken links review', analytics: 'Analytics overview',
    dashSub: 'Quick overview of project status, link health and recent activity.',
    destSub: 'Manage destinations separately without duplication.',
    hotelsSub: 'Separate list for hotels with filters and destination links.',
    rentalsSub: 'Separate list for rentals and houses.',
    contentSub: 'Media, drafts and editorial notes.',
    brokenSub: 'Review hotels and rentals not mapped to a destination.',
    analyticsSub: 'Quick stats for inventory, images and content distribution.',
    addItem: 'Add item', exportData: 'Export data',
    addDestination: 'Add destination', addHotel: 'Add hotel', addRental: 'Add rental',
    searchDest: 'Search destination...', searchHotel: 'Search hotel...', searchRental: 'Search rental...',
    allContinents: 'All continents', sortDefault: 'Default', sortNameAZ: 'Name A–Z',
    sortRating: 'Rating ↓', sortPriceUp: 'Price ↑', sortPriceDown: 'Price ↓',
    reset: 'Reset', results: 'results',
    edit: 'Edit', delete: 'Delete', save: 'Save changes', cancel: 'Cancel',
    addNew: 'Add new item', editDest: 'Edit destination', editHotel: 'Edit hotel', editRental: 'Edit rental',
    fillInfo: 'Fill in the information and add photos.',
    modifyInfo: 'Modify any field and save.',
    controlOverview: 'Control overview',
    controlOverviewSub: 'Dashboard stays for overview — real lists are moved to each section.',
    totalDestinations: 'Total destinations', totalDestinationsHint: 'Active destinations in catalog.',
    listings: 'Listings', listingsHint: 'Hotels and rentals ready to publish.',
    validLinks: 'Valid links', validLinksHint: 'Correct mappings between properties and destinations.',
    mediaFiles: 'Media files', mediaFilesHint: 'Photos available in the platform.',
    projectRisk: 'Project Risk', linkConsistency: 'Link consistency score',
    linkConsistencySub: 'Review hotels and rentals that are not mapped to a destination.',
    openBrokenLinks: 'Open broken links',
    quickActivity: 'Quick activity',
    act1: 'dashboard viewed', act2: 'inventory synced', act3: 'media ready', act4: 'export prepared',
    minsAgo: '2 min ago',
    contentStudio: 'Content studio',
    contentStudioSub: 'Area for media, drafts, completions and content organization.',
    mediaLibrary: 'Media library', mediaLibraryHint: 'Images loaded for destinations, hotels and rentals.',
    draftNotes: 'Draft notes', draftNotesHint: 'Destinations that need a richer description.',
    contentBlocks: 'Content blocks', contentBlocksHint: 'Total items that can be edited in the platform.',
    editorialNotes: 'Editorial notes', editorialNotesSub: 'What needs to be completed in content.',
    priority: 'Priority',
    note1: 'Complete descriptions for new destinations',
    note1sub: 'Add richer information about culture, season and key points.',
    note2: 'Unify main images',
    note2sub: 'Ensure cover image for each important hotel and rental.',
    note3: 'Review tags and amenities',
    note3sub: 'Avoid empty data and use consistent labels.',
    recentMedia: 'Recent media', recentMediaSub: 'Quick preview of existing photos.',
    addNewItem: 'Add new item', noRecentMedia: 'No recent images.',
    publishingChecklist: 'Publishing checklist', checklistReady: 'Ready for next content pass',
    check1: 'Cover image set', check2: 'Description updated',
    check3: 'Destination mapping checked', check4: 'Pricing and amenities verified',
    brokenLinksTitle: 'Broken links review',
    brokenLinksSub: 'Here you see only incorrectly mapped items, not the whole catalog.',
    allMappedOk: 'Everything is correctly mapped',
    allMappedOkSub: 'No hotels or rentals without a valid destination.',
    location: 'Location', unknown: 'Unknown', openSection: 'Open section',
    analyticsOverview: 'Analytics overview',
    analyticsSub2: 'A separate area for statistics, not the same content cards.',
    avgDestRating: 'Average destination rating',
    avgHotelRating: 'Average hotel rating',
    avgRentalPrice: 'Average rental price',
    itemsWithImages: 'Items with images',
    destByContinent: 'Destinations by continent',
    actionsTitle: 'Actions',
    exportAnalytics: 'Export analytics data',
    openContentStudio: 'Open content studio',
    reviewBrokenLinks: 'Review broken links',
    addType_destination: 'Destination', addType_hotel: 'Hotel', addType_rental: 'Rental / House',
    addTypeSub_destination: 'Add new location.', addTypeSub_hotel: 'Add new hotel.', addTypeSub_rental: 'Add house or apartment.',
    fieldName: 'Name', fieldContinent: 'Continent', fieldLinkedDest: 'Linked destination',
    fieldCountry: 'Country', fieldLocation: 'Location', fieldBestSeason: 'Best season',
    fieldPrice: 'Price per night', fieldDescription: 'Description / info',
    fieldTags: 'Tags', fieldHotelType: 'Hotel type', fieldStars: 'Stars',
    fieldRentalType: 'Rental type', fieldHost: 'Host',
    fieldBedrooms: 'Bedrooms', fieldBathrooms: 'Bathrooms', fieldMaxGuests: 'Max guests',
    fieldAmenities: 'Amenities', photos: 'Photos',
    photosSub: 'You can add one or more images.', addImage: 'Add image',
    pasteUrl: 'Paste image URL', preview: 'Preview',
    chooseDest: 'Choose destination',
    editTitle_destination: 'Edit destination', editTitle_hotel: 'Edit hotel', editTitle_rental: 'Edit rental',
    editSub: 'Modify any field and save',
    fieldTara: 'Country', fieldContinent2: 'Continent',
    fieldTipHotel: 'Hotel type', fieldStele: 'Stars', fieldPret: 'Price/night ($)',
    fieldDormitoare: 'Bedrooms', fieldBai: 'Bathrooms',
    fieldAmenitiesSep: 'Amenities (comma separated)', fieldTagsSep: 'Tags (comma separated)',
    fotografii: 'Photos', adauga: 'Add',
    destListSub: 'Manage destinations separately, no duplication with other admin areas.',
    bestSeason: 'Best season', reviews: 'reviews',
    hotelListSub: 'Separate list for hotels, with filters and destination links.',
    stars: 'stars',
    rentalListSub: 'Separate list for rentals and houses, without the same duplicated structure.',
    host: 'Host', bedrooms: 'bedrooms', maxGuests: 'max',
    destInvalid: 'Destination invalid',
    statusOverview: 'Status overview', totalRecords: 'Total records',
    validLinksLabel: 'Valid links', needReview: 'Need review',
    noResults: 'No results', noResultsSub: 'Try a different search or filter.',
    noHotels: 'No hotels', noHotelsSub: 'Check filters or imported data.',
    noRentals: 'No rentals', noRentalsSub: 'Check filters or imported data.',
  },
  ro: {
    dashboard: 'Dashboard overview', destinations: 'Gestionare destinații',
    hotels: 'Gestionare hoteluri', rentals: 'Gestionare rentals',
    content: 'Studio conținut', brokenLinks: 'Review linkuri rupte', analytics: 'Analytics',
    dashSub: 'Vezi rapid situația proiectului, statusul linkurilor și activitatea recentă.',
    destSub: 'Administrezi destinațiile separat, fără duplicare cu alte zone.',
    hotelsSub: 'Listă separată pentru hoteluri, cu filtre și legătură la destinații.',
    rentalsSub: 'Listă separată pentru rentals și case.',
    contentSub: 'Zonă pentru media, drafturi și notițe editoriale.',
    brokenSub: 'Verifici rapid hotelurile și rentals care nu sunt mapate corect.',
    analyticsSub: 'Statistici rapide pentru inventar, poze și distribuția conținutului.',
    addItem: 'Adaugă', exportData: 'Export date',
    addDestination: 'Adaugă destinație', addHotel: 'Adaugă hotel', addRental: 'Adaugă rental',
    searchDest: 'Caută destinație...', searchHotel: 'Caută hotel...', searchRental: 'Caută rental...',
    allContinents: 'Toate continentele', sortDefault: 'Implicit', sortNameAZ: 'Nume A–Z',
    sortRating: 'Rating ↓', sortPriceUp: 'Preț ↑', sortPriceDown: 'Preț ↓',
    reset: 'Resetează', results: 'rezultate',
    edit: 'Editează', delete: 'Șterge', save: 'Salvează modificările', cancel: 'Anulează',
    addNew: 'Adaugă element nou', editDest: 'Editează destinația', editHotel: 'Editează hotelul', editRental: 'Editează rentalul',
    fillInfo: 'Completează informațiile și adaugă fotografii.',
    modifyInfo: 'Modifică orice câmp și salvează.',
    controlOverview: 'Control overview',
    controlOverviewSub: 'Dashboard-ul rămâne pentru overview, iar listele reale sunt mutate separat pe fiecare secțiune.',
    totalDestinations: 'Total destinații', totalDestinationsHint: 'Destinații active în catalog.',
    listings: 'Listings', listingsHint: 'Hoteluri și rentals publicabile.',
    validLinks: 'Link-uri valide', validLinksHint: 'Mapări corecte între proprietăți și destinații.',
    mediaFiles: 'Fișiere media', mediaFilesHint: 'Poze disponibile în platformă.',
    projectRisk: 'Risc proiect', linkConsistency: 'Scor consistență linkuri',
    linkConsistencySub: 'Verifică hotelurile și rentals care nu sunt mapate la o destinație.',
    openBrokenLinks: 'Deschide linkuri rupte',
    quickActivity: 'Activitate recentă',
    act1: 'dashboard vizualizat', act2: 'inventar sincronizat', act3: 'media gata', act4: 'export pregătit',
    minsAgo: 'acum 2 min',
    contentStudio: 'Studio conținut',
    contentStudioSub: 'Zonă pentru media, drafturi, completări și organizare de conținut.',
    mediaLibrary: 'Bibliotecă media', mediaLibraryHint: 'Imagini încărcate pentru destinații, hoteluri și rentals.',
    draftNotes: 'Note draft', draftNotesHint: 'Destinații care au nevoie de descriere mai bogată.',
    contentBlocks: 'Blocuri conținut', contentBlocksHint: 'Total elemente care pot fi editate în platformă.',
    editorialNotes: 'Note editoriale', editorialNotesSub: 'Ce trebuie completat în conținut.',
    priority: 'Prioritate',
    note1: 'Completează descrieri pentru destinații noi',
    note1sub: 'Adaugă informații mai bogate despre cultură, sezon și puncte cheie.',
    note2: 'Uniformizează imaginile principale',
    note2sub: 'Asigură cover image pentru fiecare hotel și rental important.',
    note3: 'Revizuire tags și amenities',
    note3sub: 'Evită datele goale și folosește etichete consistente.',
    recentMedia: 'Media recentă', recentMediaSub: 'Preview rapid pentru pozele existente.',
    addNewItem: 'Adaugă element nou', noRecentMedia: 'Nu există imagini recente.',
    publishingChecklist: 'Checklist publicare', checklistReady: 'Gata pentru următoarea rundă de conținut',
    check1: 'Imagine copertă setată', check2: 'Descriere actualizată',
    check3: 'Mapare destinație verificată', check4: 'Prețuri și facilități verificate',
    brokenLinksTitle: 'Review linkuri rupte',
    brokenLinksSub: 'Aici vezi doar elementele cu mapare greșită, nu tot catalogul din nou.',
    allMappedOk: 'Totul este mapat corect',
    allMappedOkSub: 'Nu există hoteluri sau rentals fără destinație validă.',
    location: 'Locație', unknown: 'Necunoscută', openSection: 'Deschide secțiunea',
    analyticsOverview: 'Analytics overview',
    analyticsSub2: 'O zonă separată pentru statistici, nu pentru aceleași carduri de conținut.',
    avgDestRating: 'Rating mediu destinații',
    avgHotelRating: 'Rating mediu hoteluri',
    avgRentalPrice: 'Preț mediu rental',
    itemsWithImages: 'Elemente cu imagini',
    destByContinent: 'Destinații pe continent',
    actionsTitle: 'Acțiuni',
    exportAnalytics: 'Exportă date analytics',
    openContentStudio: 'Deschide studio conținut',
    reviewBrokenLinks: 'Verifică linkuri rupte',
    addType_destination: 'Destinație', addType_hotel: 'Hotel', addType_rental: 'Rental / Casă',
    addTypeSub_destination: 'Adaugi locație nouă.', addTypeSub_hotel: 'Adaugi hotel nou.', addTypeSub_rental: 'Adaugi casă sau apartament.',
    fieldName: 'Nume', fieldContinent: 'Continent', fieldLinkedDest: 'Destinație legată',
    fieldCountry: 'Țară', fieldLocation: 'Locație', fieldBestSeason: 'Sezon optim',
    fieldPrice: 'Preț per noapte', fieldDescription: 'Descriere / informații',
    fieldTags: 'Tags', fieldHotelType: 'Tip hotel', fieldStars: 'Stele',
    fieldRentalType: 'Tip rental', fieldHost: 'Gazdă',
    fieldBedrooms: 'Dormitoare', fieldBathrooms: 'Băi', fieldMaxGuests: 'Max oaspeți',
    fieldAmenities: 'Facilități', photos: 'Fotografii',
    photosSub: 'Poți pune una sau mai multe imagini.', addImage: 'Adaugă imagine',
    pasteUrl: 'Lipește URL imagine', preview: 'Preview',
    chooseDest: 'Alege destinația',
    editTitle_destination: 'Editează destinația', editTitle_hotel: 'Editează hotelul', editTitle_rental: 'Editează rentalul',
    editSub: 'Modifică orice câmp și salvează',
    fieldTara: 'Țară', fieldContinent2: 'Continent',
    fieldTipHotel: 'Tip hotel', fieldStele: 'Stele', fieldPret: 'Preț/noapte ($)',
    fieldDormitoare: 'Dormitoare', fieldBai: 'Băi',
    fieldAmenitiesSep: 'Amenities (separate cu virgulă)', fieldTagsSep: 'Tags (separate cu virgulă)',
    fotografii: 'Fotografii', adauga: 'Adaugă',
    destListSub: 'Administrezi destinațiile separat, fără duplicare cu alte zone din admin.',
    bestSeason: 'Sezon optim', reviews: 'recenzii',
    hotelListSub: 'Listă separată pentru hoteluri, cu filtre și legătură la destinații.',
    stars: 'stele',
    rentalListSub: 'Listă separată pentru rentals și case, fără aceeași structură duplicată.',
    host: 'Gazdă', bedrooms: 'dormitoare', maxGuests: 'max',
    destInvalid: 'Destinație invalidă',
    statusOverview: 'Status general', totalRecords: 'Total înregistrări',
    validLinksLabel: 'Link-uri valide', needReview: 'Necesită verificare',
    noResults: 'Fără rezultate', noResultsSub: 'Încearcă alt text de căutare sau filtru.',
    noHotels: 'Fără hoteluri', noHotelsSub: 'Verifică filtrele sau datele importate.',
    noRentals: 'Fără rentals', noRentalsSub: 'Verifică filtrele sau datele importate.',
  },
  ru: {
    dashboard: 'Обзор панели', destinations: 'Управление направлениями',
    hotels: 'Управление отелями', rentals: 'Управление арендой',
    content: 'Студия контента', brokenLinks: 'Проверка битых ссылок', analytics: 'Аналитика',
    dashSub: 'Быстрый обзор статуса проекта, ссылок и недавней активности.',
    destSub: 'Управляйте направлениями отдельно, без дублирования.',
    hotelsSub: 'Отдельный список для отелей с фильтрами.',
    rentalsSub: 'Отдельный список для аренды и домов.',
    contentSub: 'Медиа, черновики и редакционные заметки.',
    brokenSub: 'Просмотр отелей и аренды без привязки к направлению.',
    analyticsSub: 'Быстрая статистика по инвентарю и контенту.',
    addItem: 'Добавить', exportData: 'Экспорт данных',
    addDestination: 'Добавить направление', addHotel: 'Добавить отель', addRental: 'Добавить аренду',
    searchDest: 'Поиск направления...', searchHotel: 'Поиск отеля...', searchRental: 'Поиск аренды...',
    allContinents: 'Все континенты', sortDefault: 'По умолчанию', sortNameAZ: 'Имя А–Я',
    sortRating: 'Рейтинг ↓', sortPriceUp: 'Цена ↑', sortPriceDown: 'Цена ↓',
    reset: 'Сброс', results: 'результатов',
    edit: 'Изменить', delete: 'Удалить', save: 'Сохранить изменения', cancel: 'Отмена',
    addNew: 'Добавить новый элемент', editDest: 'Изменить направление', editHotel: 'Изменить отель', editRental: 'Изменить аренду',
    fillInfo: 'Заполните информацию и добавьте фотографии.',
    modifyInfo: 'Измените любое поле и сохраните.',
    controlOverview: 'Обзор управления',
    controlOverviewSub: 'Панель остаётся для обзора, а реальные списки перемещены в отдельные разделы.',
    totalDestinations: 'Всего направлений', totalDestinationsHint: 'Активные направления в каталоге.',
    listings: 'Объявления', listingsHint: 'Отели и аренда готовые к публикации.',
    validLinks: 'Валидные ссылки', validLinksHint: 'Корректные привязки объектов к направлениям.',
    mediaFiles: 'Медиафайлы', mediaFilesHint: 'Фотографии доступные в платформе.',
    projectRisk: 'Риск проекта', linkConsistency: 'Оценка консистентности ссылок',
    linkConsistencySub: 'Проверьте отели и аренду без привязки к направлению.',
    openBrokenLinks: 'Открыть битые ссылки',
    quickActivity: 'Последняя активность',
    act1: 'панель просмотрена', act2: 'инвентарь синхронизирован', act3: 'медиа готово', act4: 'экспорт подготовлен',
    minsAgo: '2 мин. назад',
    contentStudio: 'Студия контента',
    contentStudioSub: 'Зона для медиа, черновиков, дополнений и организации контента.',
    mediaLibrary: 'Медиатека', mediaLibraryHint: 'Изображения загруженные для направлений, отелей и аренды.',
    draftNotes: 'Черновые заметки', draftNotesHint: 'Направления которым нужно более богатое описание.',
    contentBlocks: 'Блоки контента', contentBlocksHint: 'Всего элементов которые можно редактировать.',
    editorialNotes: 'Редакционные заметки', editorialNotesSub: 'Что нужно дополнить в контенте.',
    priority: 'Приоритет',
    note1: 'Заполнить описания для новых направлений',
    note1sub: 'Добавьте более богатую информацию о культуре, сезоне и ключевых точках.',
    note2: 'Унифицировать главные изображения',
    note2sub: 'Обеспечить обложку для каждого важного отеля и аренды.',
    note3: 'Проверить теги и удобства',
    note3sub: 'Избегайте пустых данных и используйте согласованные метки.',
    recentMedia: 'Последние медиа', recentMediaSub: 'Быстрый предпросмотр существующих фото.',
    addNewItem: 'Добавить новый элемент', noRecentMedia: 'Нет последних изображений.',
    publishingChecklist: 'Чеклист публикации', checklistReady: 'Готово к следующему циклу контента',
    check1: 'Обложка установлена', check2: 'Описание обновлено',
    check3: 'Привязка к направлению проверена', check4: 'Цены и удобства проверены',
    brokenLinksTitle: 'Проверка битых ссылок',
    brokenLinksSub: 'Здесь только элементы с неверной привязкой, не весь каталог.',
    allMappedOk: 'Всё привязано корректно',
    allMappedOkSub: 'Нет отелей или аренды без валидного направления.',
    location: 'Локация', unknown: 'Неизвестна', openSection: 'Открыть раздел',
    analyticsOverview: 'Обзор аналитики',
    analyticsSub2: 'Отдельная зона для статистики, а не те же карточки контента.',
    avgDestRating: 'Средний рейтинг направлений',
    avgHotelRating: 'Средний рейтинг отелей',
    avgRentalPrice: 'Средняя цена аренды',
    itemsWithImages: 'Элементы с изображениями',
    destByContinent: 'Направления по континентам',
    actionsTitle: 'Действия',
    exportAnalytics: 'Экспорт данных аналитики',
    openContentStudio: 'Открыть студию контента',
    reviewBrokenLinks: 'Проверить битые ссылки',
    addType_destination: 'Направление', addType_hotel: 'Отель', addType_rental: 'Аренда / Дом',
    addTypeSub_destination: 'Добавить новое направление.', addTypeSub_hotel: 'Добавить новый отель.', addTypeSub_rental: 'Добавить дом или апартаменты.',
    fieldName: 'Название', fieldContinent: 'Континент', fieldLinkedDest: 'Связанное направление',
    fieldCountry: 'Страна', fieldLocation: 'Локация', fieldBestSeason: 'Лучший сезон',
    fieldPrice: 'Цена за ночь', fieldDescription: 'Описание / информация',
    fieldTags: 'Теги', fieldHotelType: 'Тип отеля', fieldStars: 'Звёзды',
    fieldRentalType: 'Тип аренды', fieldHost: 'Хозяин',
    fieldBedrooms: 'Спальни', fieldBathrooms: 'Ванные', fieldMaxGuests: 'Макс. гостей',
    fieldAmenities: 'Удобства', photos: 'Фотографии',
    photosSub: 'Можно добавить одно или несколько изображений.', addImage: 'Добавить фото',
    pasteUrl: 'Вставить URL изображения', preview: 'Предпросмотр',
    chooseDest: 'Выбрать направление',
    editTitle_destination: 'Изменить направление', editTitle_hotel: 'Изменить отель', editTitle_rental: 'Изменить аренду',
    editSub: 'Измените любое поле и сохраните',
    fieldTara: 'Страна', fieldContinent2: 'Континент',
    fieldTipHotel: 'Тип отеля', fieldStele: 'Звёзды', fieldPret: 'Цена/ночь ($)',
    fieldDormitoare: 'Спальни', fieldBai: 'Ванные',
    fieldAmenitiesSep: 'Удобства (через запятую)', fieldTagsSep: 'Теги (через запятую)',
    fotografii: 'Фотографии', adauga: 'Добавить',
    destListSub: 'Управляйте направлениями отдельно, без дублирования в других зонах.',
    bestSeason: 'Лучший сезон', reviews: 'отзывов',
    hotelListSub: 'Отдельный список для отелей с фильтрами и привязкой к направлениям.',
    stars: 'звёзд',
    rentalListSub: 'Отдельный список для аренды и домов.',
    host: 'Хозяин', bedrooms: 'спален', maxGuests: 'макс.',
    destInvalid: 'Направление недействительно',
    statusOverview: 'Обзор статуса', totalRecords: 'Всего записей',
    validLinksLabel: 'Валидные ссылки', needReview: 'Требует проверки',
    noResults: 'Нет результатов', noResultsSub: 'Попробуйте другой поиск или фильтр.',
    noHotels: 'Нет отелей', noHotelsSub: 'Проверьте фильтры или импортированные данные.',
    noRentals: 'Нет аренды', noRentalsSub: 'Проверьте фильтры или импортированные данные.',
  },
};

// ── Shared input class helpers (light/dark aware)
const inputCls = 'w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';
const selectCls = 'w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const textareaCls = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';
const fieldLabelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

export default function AdminPageV2() {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [view, setView] = useState<ViewMode>('destinations');
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const {
    language,
    setLanguage,
    destinations,
    setDestinations,
    hotels,
    setHotels,
    rentals,
    setRentals,
    hostListings,
    approveListing,
    rejectListing,
    theme,
    logout,
    currentUser,
    isAuthLoading,
  } = useApp();
  const navigate = useNavigate();
  const lang = language as Lang;
  const t = T[lang];
  const isDarkTheme = theme === 'dark';
  const logoutText = lang === 'ro' ? 'Ieșire' : lang === 'ru' ? 'Выйти' : 'Logout';
  const [destPage, setDestPage] = useState(1);
  const [hotelPage, setHotelPage] = useState(1);
  const [rentalPage, setRentalPage] = useState(1);
  const PAGE_SIZE = 10;
  const [form, setForm] = useState<AddFormState>({
    type: 'destination', name: '', destinationId: '', location: '', country: '',
    continent: 'Europe', description: '', pricePerNight: '', typeLabel: '', host: '',
    stars: '', bedrooms: '', bathrooms: '', maxGuests: '', bestSeason: '', tags: '',
    amenities: '', imageUrls: [''],
  });

  const destinationMap = useMemo(() => buildDestinationMap(destinations), [destinations]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const shouldUseDark = theme === 'dark';

    htmlElement.classList.toggle('dark', shouldUseDark);
    bodyElement.classList.toggle('dark', shouldUseDark);
    htmlElement.style.colorScheme = shouldUseDark ? 'dark' : 'light';
  }, [theme]);

  const continentOptions = useMemo(() => {
    return ['all', ...Array.from(new Set(destinations.map((item) => item.continent).filter(Boolean)))];
  }, [destinations]);

  const enrichedHotels = useMemo(() => {
    return hotels.map((hotel) => {
      const destination = findLinkedDestination(hotel.destinationId, hotel.location, destinationMap, destinations);
      return { ...hotel, destinationName: destination?.name || 'Necunoscut', destinationCountry: destination?.country || '-', destinationContinent: destination?.continent || 'Unknown', linked: Boolean(destination) };
    });
  }, [hotels, destinationMap, destinations]);

  const enrichedRentals = useMemo(() => {
    return rentals.map((rental) => {
      const destination = findLinkedDestination(rental.destinationId, rental.location, destinationMap, destinations);
      return { ...rental, destinationName: destination?.name || 'Necunoscut', destinationCountry: destination?.country || '-', destinationContinent: destination?.continent || 'Unknown', linked: Boolean(destination) };
    });
  }, [rentals, destinationMap, destinations]);

  const filteredDestinations = useMemo(() => {
    let list = destinations.filter((item) => {
      const q = normalize(query);
      const matchesQuery = !q || normalize(item.name).includes(q) || normalize(item.country).includes(q) || normalize(item.continent).includes(q) || normalize(item.description).includes(q) || item.tags.some((tag) => normalize(tag).includes(q));
      const matchesContinent = continent === 'all' || normalize(item.continent) === normalize(continent);
      return matchesQuery && matchesContinent;
    });
    if (sortOrder === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortOrder === 'rating-desc') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [destinations, query, continent, sortOrder]);

  const filteredHotels = useMemo(() => {
    let list = enrichedHotels.filter((item) => {
      const q = normalize(query);
      const matchesQuery = !q || normalize(item.name).includes(q) || normalize(item.location).includes(q) || normalize(item.destinationName).includes(q) || normalize(item.type).includes(q);
      const matchesContinent = continent === 'all' || normalize(item.destinationContinent) === normalize(continent);
      return matchesQuery && matchesContinent;
    });
    if (sortOrder === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortOrder === 'rating-desc') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortOrder === 'price-asc') list = [...list].sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sortOrder === 'price-desc') list = [...list].sort((a, b) => b.pricePerNight - a.pricePerNight);
    return list;
  }, [enrichedHotels, query, continent, sortOrder]);

  const filteredRentals = useMemo(() => {
    let list = enrichedRentals.filter((item) => {
      const q = normalize(query);
      const matchesQuery = !q || normalize(item.name).includes(q) || normalize(item.location).includes(q) || normalize(item.destinationName).includes(q) || normalize(item.host).includes(q) || normalize(item.type).includes(q);
      const matchesContinent = continent === 'all' || normalize(item.destinationContinent) === normalize(continent);
      return matchesQuery && matchesContinent;
    });
    if (sortOrder === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortOrder === 'rating-desc') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortOrder === 'price-asc') list = [...list].sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sortOrder === 'price-desc') list = [...list].sort((a, b) => b.pricePerNight - a.pricePerNight);
    return list;
  }, [enrichedRentals, query, continent, sortOrder]);

  const brokenHotels = enrichedHotels.filter((h) => !h.linked);
  const brokenRentals = enrichedRentals.filter((r) => !r.linked);
  const brokenLinks = brokenHotels.length + brokenRentals.length;
  const totalRecords = destinations.length + hotels.length + rentals.length;
  const validLinks = hotels.length + rentals.length - brokenLinks;
  const totalImages =
    destinations.reduce((acc, item) => acc + (item.images?.length || 0), 0) +
    hotels.reduce((acc, item) => acc + (item.images?.length || 0), 0) +
    rentals.reduce((acc, item) => acc + (item.images?.length || 0), 0);

  const recentMedia = useMemo(() => {
    const destinationMedia = destinations.filter((item) => item.images?.[0]).slice(0, 4).map((item) => ({ title: item.name, subtitle: item.country, src: item.images?.[0] }));
    const hotelMedia = hotels.filter((item) => item.images?.[0]).slice(0, 4).map((item) => ({ title: item.name, subtitle: 'Hotel', src: item.images?.[0] }));
    return [...destinationMedia, ...hotelMedia].slice(0, 6);
  }, [destinations, hotels]);

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), destinations, hotels, rentals };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'travel-admin-export.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetForm(type?: AddItemType) {
    setForm({
      type: type || 'destination', name: '', destinationId: destinations[0]?.id || '',
      location: destinations[0]?.name || '', country: '', continent: 'Europe', description: '',
      pricePerNight: '', typeLabel: '', host: '', stars: '', bedrooms: '', bathrooms: '',
      maxGuests: '', bestSeason: '', tags: '', amenities: '', imageUrls: [''],
    });
  }

  function openAddModal(nextType?: AddItemType) {
    let resolvedType: AddItemType = nextType || 'destination';
    if (!nextType) {
      if (section === 'hotels') resolvedType = 'hotel';
      else if (section === 'rentals') resolvedType = 'rental';
      else resolvedType = 'destination';
    }
    resetForm(resolvedType);
    setIsAddModalOpen(true);
  }

  function updateForm<K extends keyof AddFormState>(key: K, value: AddFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateImageAt(index: number, value: string) {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.map((item, i) => (i === index ? value : item)) }));
  }

  function addImageField() {
    setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
  }

  function removeImageField(index: number) {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.length === 1 ? [''] : prev.imageUrls.filter((_, i) => i !== index) }));
  }

  function saveNewItem() {
    const cleanImages = form.imageUrls.map((img) => img.trim()).filter(Boolean);
    if (!form.name.trim()) { window.alert('Completeaza numele.'); return; }

    if (form.type === 'destination') {
      const newItem: Destination = {
        id: normalize(form.name), name: form.name.trim(), country: form.country.trim() || 'Unknown',
        continent: form.continent.trim() || 'Europe', description: form.description.trim() || 'New destination added from admin.',
        images: cleanImages, rating: 4.5, reviews: 0, bestSeason: form.bestSeason.trim() || 'All year',
        tags: toArray(form.tags).length ? toArray(form.tags) : ['New'],
        culture: 'To be updated', cuisine: 'To be updated', mustVisit: ['To be updated'], lat: 0, lng: 0,
      };
      setDestinations((prev) => [newItem, ...prev]);
      setSection('destinations'); setView('destinations'); setIsAddModalOpen(false); return;
    }

    if (form.type === 'hotel') {
      const targetDestination = destinations.find((item) => item.id === form.destinationId) || destinations[0];
      const newItem: Hotel = {
        id: 'hotel-' + Date.now(), name: form.name.trim(), destinationId: targetDestination?.id || 'unknown',
        location: form.location.trim() || targetDestination?.name || 'Unknown', images: cleanImages, rating: 4.5, reviews: 0,
        pricePerNight: Number(form.pricePerNight) || 150, description: form.description.trim() || 'New hotel added from admin.',
        amenities: toArray(form.amenities).length ? toArray(form.amenities) : ['WiFi'],
        type: (form.typeLabel.trim() || 'boutique') as Hotel['type'], stars: Number(form.stars) || 4,
      };
      setHotels((prev) => [newItem, ...prev]);
      setSection('hotels'); setView('hotels'); setIsAddModalOpen(false); return;
    }

    const targetDestination = destinations.find((item) => item.id === form.destinationId) || destinations[0];
    const newRental: Rental = {
      id: 'rental-' + Date.now(), name: form.name.trim(), destinationId: targetDestination?.id || 'unknown',
      location: form.location.trim() || targetDestination?.name || 'Unknown', images: cleanImages, rating: 4.5, reviews: 0,
      pricePerNight: Number(form.pricePerNight) || 120, description: form.description.trim() || 'New rental added from admin.',
      amenities: toArray(form.amenities).length ? toArray(form.amenities) : ['WiFi'],
      type: (form.typeLabel.trim() || 'apartment') as Rental['type'],
      bedrooms: Number(form.bedrooms) || 1, bathrooms: Number(form.bathrooms) || 1,
      maxGuests: Number(form.maxGuests) || 2, host: form.host.trim() || 'Admin Host',
    };
    setRentals((prev) => [newRental, ...prev]);
    setSection('rentals'); setView('rentals'); setIsAddModalOpen(false);
  }

  type EditTarget = { kind: 'destination' | 'hotel' | 'rental'; id: string };
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  useEffect(() => {
    const isOpen = isAddModalOpen || editTarget !== null;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isAddModalOpen, editTarget]);

  const [editPhotoPage, setEditPhotoPage] = useState(1);
  const EDIT_PHOTOS_PER_PAGE = 5;
  const [editForm, setEditForm] = useState<AddFormState>({
    type: 'destination', name: '', destinationId: '', location: '', country: '',
    continent: 'Europe', description: '', pricePerNight: '', typeLabel: '', host: '',
    stars: '', bedrooms: '', bathrooms: '', maxGuests: '', bestSeason: '', tags: '',
    amenities: '', imageUrls: [''],
  });

  function updateEditForm<K extends keyof AddFormState>(key: K, value: AddFormState[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditImageAt(index: number, value: string) {
    setEditForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.map((img, i) => (i === index ? value : img)) }));
  }

  function addEditImageField() {
    setEditForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
    setEditPhotoPage(() => {
      const newTotal = editForm.imageUrls.length + 1;
      return Math.ceil(newTotal / EDIT_PHOTOS_PER_PAGE);
    });
  }

  function removeEditImageField(index: number) {
    setEditForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.length === 1 ? [''] : prev.imageUrls.filter((_, i) => i !== index) }));
  }

  function editDestination(id: string) {
    const item = destinations.find((d) => d.id === id);
    if (!item) return;
    setEditPhotoPage(1);
    setEditForm({
      type: 'destination', name: item.name, destinationId: '', location: '',
      country: item.country, continent: item.continent, description: item.description,
      pricePerNight: '', typeLabel: '', host: '', stars: '', bedrooms: '', bathrooms: '',
      maxGuests: '', bestSeason: item.bestSeason, tags: item.tags?.join(', ') || '',
      amenities: '', imageUrls: item.images?.length ? item.images : [''],
    });
    setEditTarget({ kind: 'destination', id });
  }

  function editHotel(id: string) {
    const item = hotels.find((h) => h.id === id);
    if (!item) return;
    setEditPhotoPage(1);
    setEditForm({
      type: 'hotel', name: item.name, destinationId: item.destinationId,
      location: item.location, country: '', continent: '', description: item.description,
      pricePerNight: String(item.pricePerNight), typeLabel: item.type, host: '',
      stars: String(item.stars), bedrooms: '', bathrooms: '', maxGuests: '',
      bestSeason: '', tags: '', amenities: item.amenities?.join(', ') || '',
      imageUrls: item.images?.length ? item.images : [''],
    });
    setEditTarget({ kind: 'hotel', id });
  }

  function editRental(id: string) {
    const item = rentals.find((r) => r.id === id);
    if (!item) return;
    setEditPhotoPage(1);
    setEditForm({
      type: 'rental', name: item.name, destinationId: item.destinationId,
      location: item.location, country: '', continent: '', description: item.description,
      pricePerNight: String(item.pricePerNight), typeLabel: item.type, host: item.host,
      stars: '', bedrooms: String(item.bedrooms), bathrooms: String(item.bathrooms),
      maxGuests: String(item.maxGuests), bestSeason: '', tags: '',
      amenities: item.amenities?.join(', ') || '',
      imageUrls: item.images?.length ? item.images : [''],
    });
    setEditTarget({ kind: 'rental', id });
  }

  function saveEditItem() {
    if (!editTarget) return;
    const cleanImages = editForm.imageUrls.map((img) => img.trim()).filter(Boolean);
    if (!editForm.name.trim()) { window.alert('Completeaza numele.'); return; }

    if (editTarget.kind === 'destination') {
      setDestinations((prev) => prev.map((item) => {
        if (item.id !== editTarget.id) return item;
        return { ...item, name: editForm.name.trim(), country: editForm.country.trim() || item.country, continent: editForm.continent.trim() || item.continent, description: editForm.description.trim() || item.description, bestSeason: editForm.bestSeason.trim() || item.bestSeason, tags: toArray(editForm.tags).length ? toArray(editForm.tags) : item.tags, images: cleanImages.length ? cleanImages : item.images };
      }));
    } else if (editTarget.kind === 'hotel') {
      setHotels((prev) => prev.map((item) => {
        if (item.id !== editTarget.id) return item;
        return { ...item, name: editForm.name.trim(), destinationId: editForm.destinationId || item.destinationId, location: editForm.location.trim() || item.location, description: editForm.description.trim() || item.description, pricePerNight: Number(editForm.pricePerNight) || item.pricePerNight, type: (editForm.typeLabel.trim() || item.type) as Hotel['type'], stars: Number(editForm.stars) || item.stars, amenities: toArray(editForm.amenities).length ? toArray(editForm.amenities) : item.amenities, images: cleanImages.length ? cleanImages : item.images };
      }));
    } else {
      setRentals((prev) => prev.map((item) => {
        if (item.id !== editTarget.id) return item;
        return { ...item, name: editForm.name.trim(), destinationId: editForm.destinationId || item.destinationId, location: editForm.location.trim() || item.location, description: editForm.description.trim() || item.description, pricePerNight: Number(editForm.pricePerNight) || item.pricePerNight, type: (editForm.typeLabel.trim() || item.type) as Rental['type'], host: editForm.host.trim() || item.host, bedrooms: Number(editForm.bedrooms) || item.bedrooms, bathrooms: Number(editForm.bathrooms) || item.bathrooms, maxGuests: Number(editForm.maxGuests) || item.maxGuests, amenities: toArray(editForm.amenities).length ? toArray(editForm.amenities) : item.amenities, images: cleanImages.length ? cleanImages : item.images };
      }));
    }
    setEditTarget(null);
  }

  function deleteDestination(id: string) {
    if (!window.confirm('Stergi aceasta destinatie?')) return;
    setDestinations((prev) => prev.filter((item) => item.id !== id));
  }

  function deleteHotel(id: string) {
    if (!window.confirm('Stergi acest hotel?')) return;
    setHotels((prev) => prev.filter((item) => item.id !== id));
  }

  function deleteRental(id: string) {
    if (!window.confirm('Stergi acest rental?')) return;
    setRentals((prev) => prev.filter((item) => item.id !== id));
  }

  // ── Shared filter bar used in all 3 list sections
  function FilterBar({ placeholder, extraSort = false, onReset }: { placeholder: string; extraSort?: boolean; onReset: () => void }) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setDestPage(1); setHotelPage(1); setRentalPage(1); }}
            placeholder={placeholder}
            className="h-11 rounded-2xl border-slate-200 bg-white pl-10 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2">
          {/* Continent filter */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <Select value={continent} onValueChange={(v) => { if (v) { setContinent(v); setDestPage(1); setHotelPage(1); setRentalPage(1); } }}>
              <SelectTrigger className="h-11 border-0 bg-transparent p-0 pl-1 pr-2 text-sm font-medium text-slate-700 shadow-none focus:ring-0 w-[140px] dark:text-slate-200">
                <SelectValue placeholder="Continent" />
              </SelectTrigger>
              <SelectContent>
                {continentOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt === 'all' ? t.allContinents : opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <Select value={sortOrder} onValueChange={(v) => { if (v) { setSortOrder(v); setDestPage(1); setHotelPage(1); setRentalPage(1); } }}>
              <SelectTrigger className="h-11 border-0 bg-transparent p-0 pl-1 pr-2 text-sm font-medium text-slate-700 shadow-none focus:ring-0 w-[130px] dark:text-slate-200">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t.sortDefault}</SelectItem>
                <SelectItem value="name-asc">{t.sortNameAZ}</SelectItem>
                <SelectItem value="rating-desc">{t.sortRating}</SelectItem>
                {extraSort && <SelectItem value="price-asc">{t.sortPriceUp}</SelectItem>}
                {extraSort && <SelectItem value="price-desc">{t.sortPriceDown}</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {/* Reset */}
          {(query || continent !== 'all' || sortOrder !== 'default') && (
            <button
              type="button"
              onClick={onReset}
              className="flex h-11 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-red-500/40 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" /> {t.reset}
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderDestinationList() {
    return (
      <SectionCard>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">Destinations</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t.destListSub}</p>
            </div>
            <Button onClick={() => openAddModal('destination')} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-700">
              <Plus className="mr-2 h-4 w-4" /> {t.addDestination}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <FilterBar placeholder={t.searchDest} onReset={() => { setQuery(''); setContinent('all'); setSortOrder('default'); setDestPage(1); }} />
          <p className="text-xs text-slate-400">{filteredDestinations.length} {t.results}</p>
          {filteredDestinations.length === 0 ? (
            <EmptyState title={t.noResults} text={t.noResultsSub} />
          ) : (
            <div className="space-y-4">
              {filteredDestinations.slice((destPage - 1) * PAGE_SIZE, destPage * PAGE_SIZE).map((item) => (
                <Card key={item.id} className="rounded-3xl border-slate-200 bg-white shadow-none transition hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50">
                  <div className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <ImageThumb src={item.images?.[0]} alt={item.name} />
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                            <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">{item.country}</Badge>
                            <Badge variant="outline" className="rounded-full border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400">{item.continent}</Badge>
                          </div>
                          <p className="max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-amber-400" /> {item.rating}</span>
                            <span>{item.reviews.toLocaleString()} {t.reviews}</span>
                            <span>{t.bestSeason}: {item.bestSeason}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.tags?.slice(0, 6).map((tag) => (<Badge key={tag} variant="outline" className="rounded-full border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">{tag}</Badge>))}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" onClick={() => editDestination(item.id)} className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-700">
                          <Pencil className="mr-2 h-4 w-4" /> {t.edit}
                        </Button>
                        <Button variant="outline" onClick={() => deleteDestination(item.id)} className="rounded-2xl border-slate-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-500/40 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20">
                          <Trash2 className="mr-2 h-4 w-4" /> {t.delete}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Pagination current={destPage} total={filteredDestinations.length} pageSize={PAGE_SIZE} onChange={setDestPage} />
        </CardContent>
      </SectionCard>
    );
  }

  function renderHotelList() {
    return (
      <SectionCard>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">Hotels</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t.hotelListSub}</p>
            </div>
            <Button onClick={() => openAddModal('hotel')} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-700">
              <Plus className="mr-2 h-4 w-4" /> {t.addHotel}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <FilterBar placeholder={t.searchHotel} extraSort onReset={() => { setQuery(''); setContinent('all'); setSortOrder('default'); setHotelPage(1); }} />
          <p className="text-xs text-slate-400">{filteredHotels.length} {t.results}</p>
          {filteredHotels.length === 0 ? (
            <EmptyState title={t.noHotels} text={t.noHotelsSub} />
          ) : (
            <div className="space-y-4">
              {filteredHotels.slice((hotelPage - 1) * PAGE_SIZE, hotelPage * PAGE_SIZE).map((item) => (
                <Card key={item.id} className="rounded-3xl border-slate-200 bg-white shadow-none transition hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50">
                  <div className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <ImageThumb src={item.images?.[0]} alt={item.name} />
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                            <Badge className="rounded-full capitalize bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">{item.type}</Badge>
                            {!item.linked && (<Badge variant="destructive" className="rounded-full">Destination invalid</Badge>)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location}</span>
                            <span className="inline-flex items-center gap-1"><Globe2 className="h-4 w-4" /> {item.destinationName}</span>
                            <span>{item.stars} {t.stars}</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{formatPrice(item.pricePerNight)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-amber-400" /> {item.rating}</span>
                            <span>{item.reviews.toLocaleString()} reviews</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.amenities?.slice(0, 6).map((a) => (<Badge key={a} variant="outline" className="rounded-full border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">{a}</Badge>))}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" onClick={() => editHotel(item.id)} className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-700">
                          <Pencil className="mr-2 h-4 w-4" /> {t.edit}
                        </Button>
                        <Button variant="outline" onClick={() => deleteHotel(item.id)} className="rounded-2xl border-slate-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-500/40 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20">
                          <Trash2 className="mr-2 h-4 w-4" /> {t.delete}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Pagination current={hotelPage} total={filteredHotels.length} pageSize={PAGE_SIZE} onChange={setHotelPage} />
        </CardContent>
      </SectionCard>
    );
  }

  function renderRentalList() {
    return (
      <SectionCard>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">Rentals</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t.rentalListSub}</p>
            </div>
            <Button onClick={() => openAddModal('rental')} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-700">
              <Plus className="mr-2 h-4 w-4" /> {t.addRental}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <FilterBar placeholder={t.searchRental} extraSort onReset={() => { setQuery(''); setContinent('all'); setSortOrder('default'); setRentalPage(1); }} />
          <p className="text-xs text-slate-400">{filteredRentals.length} {t.results}</p>
          {filteredRentals.length === 0 ? (
            <EmptyState title={t.noRentals} text={t.noRentalsSub} />
          ) : (
            <div className="space-y-4">
              {filteredRentals.slice((rentalPage - 1) * PAGE_SIZE, rentalPage * PAGE_SIZE).map((item) => (
                <Card key={item.id} className="rounded-3xl border-slate-200 bg-white shadow-none transition hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50">
                  <div className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <ImageThumb src={item.images?.[0]} alt={item.name} />
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                            <Badge className="rounded-full capitalize bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">{item.type}</Badge>
                            {!item.linked && (<Badge variant="destructive" className="rounded-full">Destination invalid</Badge>)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location}</span>
                            <span className="inline-flex items-center gap-1"><Globe2 className="h-4 w-4" /> {item.destinationName}</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{formatPrice(item.pricePerNight)}</span>
                            <span>{t.host}: {item.host}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" /> {item.bedrooms} bedrooms</span>
                            <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {t.maxGuests} {item.maxGuests}</span>
                            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-amber-400" /> {item.rating}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.amenities?.slice(0, 6).map((a) => (<Badge key={a} variant="outline" className="rounded-full border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">{a}</Badge>))}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" onClick={() => editRental(item.id)} className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-700">
                          <Pencil className="mr-2 h-4 w-4" /> {t.edit}
                        </Button>
                        <Button variant="outline" onClick={() => deleteRental(item.id)} className="rounded-2xl border-slate-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-500/40 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20">
                          <Trash2 className="mr-2 h-4 w-4" /> {t.delete}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Pagination current={rentalPage} total={filteredRentals.length} pageSize={PAGE_SIZE} onChange={setRentalPage} />
        </CardContent>
      </SectionCard>
    );
  }

  function renderDashboard() {
    return (
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_340px]">
        <SectionCard>
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">{t.controlOverview}</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.controlOverviewSub}</p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              { label: t.totalDestinations, value: destinations.length, hint: t.totalDestinationsHint, valueColor: 'text-slate-900 dark:text-white' },
              { label: t.listings, value: hotels.length + rentals.length, hint: t.listingsHint, valueColor: 'text-slate-900 dark:text-white' },
              { label: t.validLinks, value: validLinks, hint: t.validLinksHint, valueColor: 'text-emerald-600 dark:text-emerald-400' },
              { label: t.mediaFiles, value: totalImages, hint: t.mediaFilesHint, valueColor: 'text-slate-900 dark:text-white' },
            ].map(({ label, value, hint, valueColor }) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className={`mt-2 text-3xl font-semibold ${valueColor}`}>{value}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">{hint}</p>
              </div>
            ))}
          </CardContent>
        </SectionCard>
        <div className="space-y-6">
          <SectionCard>
            <CardHeader><CardTitle className="text-lg text-slate-900 dark:text-white">{t.projectRisk}</CardTitle></CardHeader>
            <CardContent>
              <div
                className={
                  'flex flex-col items-center justify-center rounded-3xl border p-6 text-center ' +
                  (isDarkTheme
                    ? 'border-orange-700/30 bg-gradient-to-b from-orange-950/35 via-slate-900 to-slate-900'
                    : 'border-[#BFDBFE] bg-gradient-to-b from-[#EEF6FF] via-[#ECFEFF] to-[#E0F2FE]')
                }
              >
                <div
                  className={
                    'flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-dashed text-3xl font-semibold ' +
                    (isDarkTheme
                      ? 'border-orange-700 bg-slate-900 text-orange-300'
                      : 'border-[#93C5FD] bg-white text-[#2563EB] shadow-[0_10px_24px_rgba(37,99,235,0.16)]')
                  }
                >
                  {brokenLinks}
                </div>
                <p className={'mt-4 text-sm font-semibold ' + (isDarkTheme ? 'text-slate-100' : 'text-[#1E3A8A]')}>{t.linkConsistency}</p>
                <p className={'mt-1 text-xs ' + (isDarkTheme ? 'text-slate-400' : 'text-[#475569]')}>{t.linkConsistencySub}</p>
                <Button
                  onClick={() => setSection('broken-links')}
                  className={
                    'mt-5 w-full rounded-2xl text-white ' +
                    (isDarkTheme
                      ? 'bg-orange-500 hover:bg-orange-400'
                      : 'bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:brightness-105')
                  }
                >
                  {t.openBrokenLinks}
                </Button>
              </div>
            </CardContent>
          </SectionCard>
          <SectionCard>
            <CardHeader><CardTitle className="text-lg text-slate-900 dark:text-white">{t.quickActivity}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[t.act1, t.act2, t.act3, t.act4].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{item}</p>
                    <p className="text-xs text-slate-400">{t.minsAgo}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </SectionCard>
        </div>
      </div>
    );
  }

  // ── FIX 6: Content Studio — toate cardurile cu bg/text explicit pe light
  function renderContentStudio() {
    const contentStats = [
      { title: t.mediaLibrary, value: totalImages, text: t.mediaLibraryHint, icon: ImagePlus },
      { title: t.draftNotes, value: destinations.filter((d) => d.description?.length < 80).length, text: t.draftNotesHint, icon: FileText },
      { title: t.contentBlocks, value: destinations.length + hotels.length + rentals.length, text: t.contentBlocksHint, icon: FolderKanban },
    ];
    return (
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <SectionCard>
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">{t.contentStudio}</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.contentStudioSub}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {contentStats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-800/60">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.title}</p>
                      <div className="rounded-2xl bg-white p-2 shadow-sm dark:bg-slate-700">
                        <Icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                      </div>
                    </div>
                    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Editorial notes */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.editorialNotes}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.editorialNotesSub}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400">{t.priority}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { title: t.note1, sub: t.note1sub },
                    { title: t.note2, sub: t.note2sub },
                    { title: t.note3, sub: t.note3sub },
                  ].map(({ title, sub }) => (
                    <div key={title} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/40">
                      <p className="font-medium text-slate-900 dark:text-white">{title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Recent media */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.recentMedia}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.recentMediaSub}</p>
                  </div>
                  <Button variant="outline" className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-300" onClick={() => openAddModal()}>
                    <ImagePlus className="mr-2 h-4 w-4" /> {t.addNewItem}
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {recentMedia.length === 0 ? (
                    <div className="col-span-2 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">{t.noRecentMedia}</div>
                  ) : (
                    recentMedia.map((item) => (
                      <div key={item.title + item.subtitle} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="h-28 bg-slate-100 dark:bg-slate-700">
                          {item.src ? (
                            <img
                              src={item.src}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                            />
                          ) : null}
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </SectionCard>
        {/* Publishing checklist */}
        <SectionCard>
          <CardHeader><CardTitle className="text-lg text-slate-900 dark:text-white">{t.publishingChecklist}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[t.check1, t.check2, t.check3, t.check4].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{item}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.checklistReady}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </SectionCard>
      </div>
    );
  }

  function renderBrokenLinks() {
    const brokenItems = [
      ...brokenHotels.map((item) => ({ kind: 'Hotel', id: item.id, name: item.name, location: item.location })),
      ...brokenRentals.map((item) => ({ kind: 'Rental', id: item.id, name: item.name, location: item.location })),
    ];
    return (
      <SectionCard>
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900 dark:text-white">{t.brokenLinksTitle}</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.brokenLinksSub}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {brokenItems.length === 0 ? (
            <EmptyState title={t.allMappedOk} text={t.allMappedOkSub} />
          ) : (
            brokenItems.map((item) => (
              <div key={item.kind + item.id} className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-700/40 dark:bg-amber-900/20 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-amber-500 text-white">{item.kind}</Badge>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.location}: {item.location || t.unknown}</p>
                </div>
                <Button variant="outline" className="rounded-2xl border-amber-300 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-600/40 dark:bg-transparent dark:text-amber-300" onClick={() => setSection(item.kind === 'Hotel' ? 'hotels' : 'rentals')}>
                  {t.openSection}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </SectionCard>
    );
  }

  function renderAnalytics() {
    const continentCount = destinations.reduce<Record<string, number>>((acc, item) => {
      acc[item.continent] = (acc[item.continent] || 0) + 1;
      return acc;
    }, {});
    return (
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <SectionCard>
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">{t.analyticsOverview}</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.analyticsSub2}</p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              { label: t.avgDestRating, value: destinations.length ? (destinations.reduce((s, i) => s + i.rating, 0) / destinations.length).toFixed(1) : '0.0' },
              { label: t.avgHotelRating, value: hotels.length ? (hotels.reduce((s, i) => s + i.rating, 0) / hotels.length).toFixed(1) : '0.0' },
              { label: t.avgRentalPrice, value: '$' + (rentals.length ? Math.round(rentals.reduce((s, i) => s + i.pricePerNight, 0) / rentals.length) : 0) },
              { label: t.itemsWithImages, value: [...destinations, ...hotels, ...rentals].filter((i) => Array.isArray(i.images) && i.images.length > 0).length },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
            <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700/50 dark:bg-slate-800/50">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{t.destByContinent}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {Object.entries(continentCount).map(([key, value]) => (
                  <div key={key} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/40">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{key}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </SectionCard>
        <SectionCard>
          <CardHeader><CardTitle className="text-lg text-slate-900 dark:text-white">{t.actionsTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={exportData} className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"><Download className="mr-2 h-4 w-4" /> {t.exportAnalytics}</Button>
            <Button variant="outline" className="w-full rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-300" onClick={() => setSection('content')}>{t.openContentStudio}</Button>
            <Button variant="outline" className="w-full rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-300" onClick={() => setSection('broken-links')}>{t.reviewBrokenLinks}</Button>
          </CardContent>
        </SectionCard>
      </div>
    );
  }

  const [hlReviewNote, setHlReviewNote] = useState('');
  const [hlActiveNote, setHlActiveNote] = useState<string | null>(null);
  const [hlFilterStatus, setHlFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // ── FIX 7: Host listings — statusBadge, textarea, buttons cu contrast corect pe light
  function renderHostListings() {
    const reviewListings = (hostListings ?? []).filter((l: HostListing) => l.status !== 'draft');
    const pending = reviewListings.filter((l: HostListing) => l.status === 'pending');
    const filtered = hlFilterStatus === 'all'
      ? reviewListings
      : reviewListings.filter((l: HostListing) => l.status === hlFilterStatus);

    const statusBadge = (status: HostListing['status']) => {
      const map: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
        approved: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
        rejected: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
        draft: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30',
      };
      return <span className={'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ' + map[status]}>{status}</span>;
    };

    const statItems = [
      { key: 'all' as const, label: 'Total', val: reviewListings.length },
      { key: 'pending' as const, label: 'Pending', val: reviewListings.filter((l: HostListing) => l.status === 'pending').length },
      { key: 'approved' as const, label: 'Approved', val: reviewListings.filter((l: HostListing) => l.status === 'approved').length },
      { key: 'rejected' as const, label: 'Rejected', val: reviewListings.filter((l: HostListing) => l.status === 'rejected').length },
    ];

    return (
      <SectionCard>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl text-slate-900 dark:text-white">
                <ShieldCheck className="h-6 w-6 text-cyan-500" /> Host Listings Review
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review and approve or reject listings submitted by hosts.
              </p>
            </div>
            {pending.length > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 dark:border-amber-500/20 dark:bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{pending.length} pending review</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {statItems.map(({ key, label, val }) => (
              <button key={key} onClick={() => setHlFilterStatus(key)}
                className={
                  'rounded-2xl border p-4 text-left transition ' +
                  (hlFilterStatus === key
                    ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-500/50 dark:bg-cyan-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50')
                }>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{val}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
              </button>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} onClick={() => setHlFilterStatus(f)}
                className={
                  'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ' +
                  (hlFilterStatus === f
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white')
                }>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>

          {/* Listings */}
          {filtered.length === 0 ? (
            <EmptyState title="No listings" text="No listings match this filter." />
          ) : (
            <div className="space-y-4">
              {filtered.map((listing: HostListing) => (
                <div key={listing.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
                  <div className="flex gap-4 p-5">
                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-700">
                      {listing.images?.[0]
                        ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                          />
                        )
                        : <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{listing.name}</h3>
                          <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3.5 w-3.5" /> {listing.location}
                          </p>
                        </div>
                        {statusBadge(listing.status)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                          {(listing.listingType || listing.type).split('_').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">${listing.pricePerNight}/night</span>
                        <span className="text-xs">ID: {listing.id}</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          Host: <span className="font-medium text-slate-700 dark:text-slate-300">{listing.hostName} ({listing.hostPublicId || listing.hostId})</span>
                        </span>
                        <span className="text-xs">Submitted: {listing.submittedAt ? new Date(listing.submittedAt).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {listing.amenities.slice(0, 5).map((a: string) => (
                          <span key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">{a}</span>
                        ))}
                      </div>
                      {listing.reviewNote && (
                        <div className={'rounded-xl px-3 py-2 text-xs ' + (listing.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300')}>
                          <span className="font-semibold">Note: </span>{listing.reviewNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {listing.status === 'pending' && (
                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700/50 dark:bg-slate-900/30">
                      {hlActiveNote === listing.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={hlReviewNote}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHlReviewNote(e.target.value)}
                            placeholder="Add a note (optional)..."
                            rows={2}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => { approveListing(listing.id, hlReviewNote); setHlActiveNote(null); setHlReviewNote(''); }}
                              className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
                              <CheckCircle2 className="h-4 w-4" /> Approve
                            </button>
                            <button onClick={() => { rejectListing(listing.id, hlReviewNote); setHlActiveNote(null); setHlReviewNote(''); }}
                              className="flex items-center gap-1.5 rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600">
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button onClick={() => { setHlActiveNote(null); setHlReviewNote(''); }}
                              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { approveListing(listing.id, 'Approved.'); }}
                            className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25">
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </button>
                          <button onClick={() => { rejectListing(listing.id, 'Rejected.'); }}
                            className="flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25">
                            <XCircle className="h-4 w-4" /> Reject
                          </button>
                          <button onClick={() => setHlActiveNote(listing.id)}
                            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800">
                            <MessageSquare className="h-4 w-4" /> Add note
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </SectionCard>
    );
  }

  function renderMainSection() {
    if (section === 'dashboard') return renderDashboard();
    if (section === 'destinations') return renderDestinationList();
    if (section === 'hotels') return renderHotelList();
    if (section === 'rentals') return renderRentalList();
    if (section === 'content') return renderContentStudio();
    if (section === 'broken-links') return renderBrokenLinks();
    if (section === 'host-listings') return renderHostListings();
    return renderAnalytics();
  }

  const sectionTitles: Record<AdminSection, string> = {
    dashboard: t.dashboard, destinations: t.destinations, hotels: t.hotels, rentals: t.rentals,
    content: t.content, 'broken-links': t.brokenLinks, analytics: t.analytics, 'host-listings': 'Host Listings Review',
  };
  const sectionSubs: Record<AdminSection, string> = {
    dashboard: t.dashSub, destinations: t.destSub, hotels: t.hotelsSub, rentals: t.rentalsSub,
    content: t.contentSub, 'broken-links': t.brokenSub, analytics: t.analyticsSub, 'host-listings': 'Approve or reject listings submitted by hosts.',
  };

  // ── Shared modal input style
  const mInputCls = 'w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';
  const mSelectCls = 'w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  const mTextareaCls = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';
  const mLabelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isAuthLoading) {
    return (
      <div className={`admin-dashboard ${isDarkTheme ? 'admin-theme-dark bg-slate-950' : 'admin-theme-light bg-[#F1F5F9]'} min-h-screen px-4 pb-6 pt-24`}>
        <div className="mx-auto max-w-xl">
          <div className={isDarkTheme
            ? 'travel-panel border border-slate-700 bg-slate-900/70 p-10 text-center shadow-sm'
            : 'travel-panel border border-[#CFE0F0] bg-white p-10 text-center shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading admin session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className={`admin-dashboard ${isDarkTheme ? 'admin-theme-dark bg-slate-950' : 'admin-theme-light bg-[#F1F5F9]'} min-h-screen px-4 pb-6 pt-24`}>
        <div className="mx-auto max-w-xl">
          <div className={isDarkTheme
            ? 'travel-panel border border-slate-700 bg-slate-900/70 p-10 text-center shadow-sm'
            : 'travel-panel border border-[#CFE0F0] bg-white p-10 text-center shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
          >
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-[#EAF3FF] text-[#2563EB]'}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin access required</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in with an admin account to open the TravelDreams control center.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Go to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard ${isDarkTheme ? 'admin-theme-dark' : 'admin-theme-light'} min-h-screen px-4 pb-6 pt-16 md:px-6 md:pt-20 ${isDarkTheme ? 'bg-slate-950' : 'bg-[#F1F5F9]'}`}>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.35); border-radius: 999px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.6); }
      `}</style>
      <div className="mx-auto grid max-w-[1680px] gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">

        {/* ── SIDEBAR */}
        <aside className={`sticky top-20 h-fit rounded-[28px] p-4 shadow-sm ${isDarkTheme ? 'bg-slate-900 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
          <div className={`flex items-center gap-3 px-2 pb-4 ${isDarkTheme ? 'border-b border-white/10' : 'border-b border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 font-bold text-white">A</div>
              <div>
                <p className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Travel Admin</p>
                <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Control center</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={section === 'dashboard'} onClick={() => setSection('dashboard')} isDarkTheme={isDarkTheme} />
            <SidebarItem icon={MapPin} label="Destinations" badge={String(destinations.length)} active={section === 'destinations'} onClick={() => { setSection('destinations'); setView('destinations'); }} isDarkTheme={isDarkTheme} />
            <SidebarItem icon={Building2} label="Hotels" badge={String(hotels.length)} active={section === 'hotels'} onClick={() => { setSection('hotels'); setView('hotels'); }} isDarkTheme={isDarkTheme} />
            <SidebarItem icon={Home} label="Rentals" badge={String(rentals.length)} active={section === 'rentals'} onClick={() => { setSection('rentals'); setView('rentals'); }} isDarkTheme={isDarkTheme} />
            <SidebarItem icon={Database} label="Content studio" active={section === 'content'} onClick={() => setSection('content')} isDarkTheme={isDarkTheme} />
            <SidebarItem icon={Link2} label="Broken links" badge={String(brokenLinks)} active={section === 'broken-links'} onClick={() => setSection('broken-links')} isDarkTheme={isDarkTheme} />
            <SidebarItem icon={ShieldCheck} label="Host listings" badge={String((hostListings ?? []).filter((l: HostListing) => l.status === 'pending').length)} active={section === 'host-listings'} onClick={() => setSection('host-listings')} isDarkTheme={isDarkTheme} />
            <SidebarItem icon={BarChart3} label="Analytics" active={section === 'analytics'} onClick={() => setSection('analytics')} isDarkTheme={isDarkTheme} />
          </div>
          {/* Status overview */}
          <div className={`mt-6 rounded-3xl p-4 ${isDarkTheme ? 'bg-white/8' : 'bg-slate-50 border border-slate-200'}`}>
            <p className={`text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{t.statusOverview}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-600'}>{t.totalRecords}</span>
                <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{totalRecords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-600'}>{t.validLinksLabel}</span>
                <span className={`font-semibold ${isDarkTheme ? 'text-emerald-300' : 'text-emerald-600'}`}>{validLinks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-600'}>{t.needReview}</span>
                <span className={`font-semibold ${isDarkTheme ? 'text-amber-300' : 'text-amber-600'}`}>{brokenLinks}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN */}
        <main className={`flex flex-col gap-3 overflow-hidden rounded-[28px] p-3 ${isDarkTheme ? 'bg-slate-950' : 'bg-[#E8EFF6]'}`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className={`text-sm font-medium uppercase tracking-[0.16em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>overview</p>
              <h1 className={`mt-1 text-4xl font-semibold tracking-tight md:text-5xl ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {sectionTitles[section]}
              </h1>
              <p className={`mt-2 max-w-3xl text-sm md:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                {sectionSubs[section]}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => openAddModal()} className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:brightness-105">
                <Plus className="mr-2 h-4 w-4" /> {t.addItem}
              </Button>
              <Button variant="outline" onClick={exportData} className={`rounded-2xl ${isDarkTheme ? 'border-slate-600 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                <Download className="mr-2 h-4 w-4" /> {t.exportData}
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className={`rounded-2xl ${isDarkTheme ? 'border-rose-500/50 bg-slate-800 text-rose-300 hover:bg-slate-700' : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'}`}
              >
                <LogOut className="mr-2 h-4 w-4" /> {logoutText}
              </Button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            <StatCard title="Revenue" value="$30,200" icon={LayoutDashboard} hint="All earnings" tone="bg-gradient-to-r from-orange-400 to-rose-400" />
            <StatCard title="Destinations" value={destinations.length} icon={MapPin} hint="Active travel locations" tone="bg-gradient-to-r from-emerald-400 to-cyan-400" />
            <StatCard title="Listings" value={hotels.length + rentals.length} icon={Database} hint="Hotels and rentals" tone="bg-gradient-to-r from-pink-400 to-rose-400" />
            <StatCard title="Broken links" value={brokenLinks} icon={AlertTriangle} hint="Need mapping review" tone="bg-gradient-to-r from-cyan-500 to-sky-500" />
          </div>

          {renderMainSection()}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
          <div className="flex w-full max-w-6xl flex-col rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-700/50 dark:bg-slate-900" style={{ maxHeight: '85vh' }}>

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t.addNew}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.fillInfo}</p>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="shrink-0 px-6 pt-5">
              <div className="grid gap-3 md:grid-cols-3">
                {(['destination', 'hotel', 'rental'] as AddItemType[]).map((type) => (
                  <button key={type} type="button" onClick={() => updateForm('type', type)}
                    className={
                      'rounded-2xl border p-4 text-left transition ' +
                      (form.type === type
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-300'
                        : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700')
                    }>
                    <p className="font-semibold">{(t as Record<string, string>)['addType_' + type]}</p>
                    <p className={`mt-1 text-sm ${form.type === type ? 'text-white/70 dark:text-cyan-300/70' : 'text-slate-500 dark:text-slate-400'}`}>
                      {(t as Record<string, string>)['addTypeSub_' + type]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="grid min-h-0 flex-1 grid-cols-[1fr_360px] divide-x divide-slate-200 overflow-hidden dark:divide-slate-700">
              {/* LEFT — fields */}
              <div className="custom-scroll space-y-3 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={mLabelCls}>{t.fieldName}</label>
                    <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Ex: Santorini Sunset Villas" className={mInputCls} />
                  </div>
                  {form.type === 'destination' ? (
                    <div>
                      <label className={mLabelCls}>{t.fieldContinent}</label>
                      <input value={form.continent} onChange={(e) => updateForm('continent', e.target.value)} placeholder="Europe" className={mInputCls} />
                    </div>
                  ) : (
                    <div>
                      <label className={mLabelCls}>{t.fieldLinkedDest}</label>
                      <select value={form.destinationId || destinations[0]?.id || ''} onChange={(e) => { const sel = destinations.find(d => d.id === e.target.value); updateForm('destinationId', e.target.value); updateForm('location', sel?.name || ''); }} className={mSelectCls}>
                        {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}
                  {form.type === 'destination' ? (
                    <div>
                      <label className={mLabelCls}>{t.fieldCountry}</label>
                      <input value={form.country} onChange={(e) => updateForm('country', e.target.value)} placeholder="Greece" className={mInputCls} />
                    </div>
                  ) : (
                    <div>
                      <label className={mLabelCls}>{t.fieldLocation}</label>
                      <input value={form.location} onChange={(e) => updateForm('location', e.target.value)} placeholder="Santorini" className={mInputCls} />
                    </div>
                  )}
                  {form.type === 'destination' ? (
                    <div>
                      <label className={mLabelCls}>{t.fieldBestSeason}</label>
                      <input value={form.bestSeason} onChange={(e) => updateForm('bestSeason', e.target.value)} placeholder="April - October" className={mInputCls} />
                    </div>
                  ) : (
                    <div>
                      <label className={mLabelCls}>{t.fieldPrice}</label>
                      <input type="number" value={form.pricePerNight} onChange={(e) => updateForm('pricePerNight', e.target.value)} placeholder="150" className={mInputCls} />
                    </div>
                  )}
                  {form.type === 'hotel' && (
                    <>
                      <div>
                        <label className={mLabelCls}>{t.fieldHotelType}</label>
                        <input value={form.typeLabel} onChange={(e) => updateForm('typeLabel', e.target.value)} placeholder="boutique" className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldStars}</label>
                        <input type="number" value={form.stars} onChange={(e) => updateForm('stars', e.target.value)} placeholder="4" className={mInputCls} />
                      </div>
                      <div className="col-span-2">
                        <label className={mLabelCls}>{t.fieldAmenities}</label>
                        <input value={form.amenities} onChange={(e) => updateForm('amenities', e.target.value)} placeholder="WiFi, Pool, Spa, Breakfast" className={mInputCls} />
                      </div>
                    </>
                  )}
                  {form.type === 'rental' && (
                    <>
                      <div>
                        <label className={mLabelCls}>{t.fieldRentalType}</label>
                        <input value={form.typeLabel} onChange={(e) => updateForm('typeLabel', e.target.value)} placeholder="apartment" className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldHost}</label>
                        <input value={form.host} onChange={(e) => updateForm('host', e.target.value)} placeholder="Maria Host" className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldBedrooms}</label>
                        <input type="number" value={form.bedrooms} onChange={(e) => updateForm('bedrooms', e.target.value)} placeholder="2" className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldBathrooms}</label>
                        <input type="number" value={form.bathrooms} onChange={(e) => updateForm('bathrooms', e.target.value)} placeholder="1" className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldMaxGuests}</label>
                        <input type="number" value={form.maxGuests} onChange={(e) => updateForm('maxGuests', e.target.value)} placeholder="4" className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldAmenities}</label>
                        <input value={form.amenities} onChange={(e) => updateForm('amenities', e.target.value)} placeholder="WiFi, Kitchen, Sea View" className={mInputCls} />
                      </div>
                    </>
                  )}
                  {form.type === 'destination' && (
                    <div className="col-span-2">
                      <label className={mLabelCls}>{t.fieldTags}</label>
                      <input value={form.tags} onChange={(e) => updateForm('tags', e.target.value)} placeholder="volcanic, sunset, beach, luxury" className={mInputCls} />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className={mLabelCls}>{t.fieldDescription}</label>
                    <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={4} placeholder={t.fieldDescription} className={mTextareaCls} />
                  </div>
                </div>
              </div>

              {/* RIGHT — photos */}
              <div className="flex flex-col gap-3 px-5 py-5">
                <div className="flex shrink-0 items-center justify-between">
                  <div>
                    <p className={mLabelCls}>{t.photos}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.photosSub}</p>
                  </div>
                  <button type="button" onClick={addImageField} className="flex items-center gap-1.5 rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1.5 text-xs font-medium text-cyan-600 transition hover:bg-cyan-100 dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-400 dark:hover:bg-cyan-500/25">
                    <Plus className="h-3 w-3" /> {t.addImage}
                  </button>
                </div>
                {form.imageUrls.length === 0 || (form.imageUrls.length === 1 && !form.imageUrls[0]) ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center dark:border-slate-700">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <ImagePlus className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-400">No photos yet</p>
                    <button type="button" onClick={addImageField} className="text-xs text-cyan-500 hover:underline">+ Add first image</button>
                  </div>
                ) : (
                  <div className="custom-scroll flex-1 space-y-2 overflow-y-auto pr-1">
                    {form.imageUrls.map((img, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600">
                          {img ? (
                            <img
                              src={img}
                              alt={'prev-' + index}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                            />
                          ) : <div className="flex h-full items-center justify-center text-slate-400 text-xs">?</div>}
                        </div>
                        <input value={img} onChange={(e) => updateImageAt(index, e.target.value)} placeholder={t.pasteUrl} className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" />
                        <button type="button" onClick={() => removeImageField(index)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-500 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800">
                {t.cancel}
              </button>
              <button type="button" onClick={saveNewItem} className="rounded-full bg-cyan-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600">
                {t.save}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {editTarget !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
          <div className="custom-scroll w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700/50 dark:bg-slate-900" style={{ maxHeight: '85vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 pb-5 pt-8 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-500/15">
                  <Pencil className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {editTarget.kind === 'destination' ? t.editTitle_destination : editTarget.kind === 'hotel' ? t.editTitle_hotel : t.editTitle_rental}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.editSub}</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditTarget(null)} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="grid grid-cols-[1fr_420px] divide-x divide-slate-200 dark:divide-slate-700">
              {/* LEFT */}
              <div className="space-y-3 px-5 py-5">
                <div>
                  <label className={mLabelCls}>Nume</label>
                  <input value={editForm.name} onChange={(e) => updateEditForm('name', e.target.value)} className={mInputCls} />
                </div>

                {editTarget.kind === 'destination' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={mLabelCls}>Țară</label>
                        <input value={editForm.country} onChange={(e) => updateEditForm('country', e.target.value)} className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>Continent</label>
                        <input value={editForm.continent} onChange={(e) => updateEditForm('continent', e.target.value)} className={mInputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={mLabelCls}>Best season</label>
                      <input value={editForm.bestSeason} onChange={(e) => updateEditForm('bestSeason', e.target.value)} className={mInputCls} />
                    </div>
                    <div>
                      <label className={mLabelCls}>{t.fieldTagsSep}</label>
                      <input value={editForm.tags} onChange={(e) => updateEditForm('tags', e.target.value)} placeholder="Beach, Romance, Culture" className={mInputCls} />
                    </div>
                  </>
                )}

                {editTarget.kind === 'hotel' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={mLabelCls}>Locație</label>
                        <input value={editForm.location} onChange={(e) => updateEditForm('location', e.target.value)} className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldTipHotel}</label>
                        <input value={editForm.typeLabel} onChange={(e) => updateEditForm('typeLabel', e.target.value)} placeholder="luxury / boutique / budget / resort" className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldStele}</label>
                        <input type="number" value={editForm.stars} onChange={(e) => updateEditForm('stars', e.target.value)} className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldPret}</label>
                        <input type="number" value={editForm.pricePerNight} onChange={(e) => updateEditForm('pricePerNight', e.target.value)} className={mInputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={mLabelCls}>{t.fieldAmenitiesSep}</label>
                      <input value={editForm.amenities} onChange={(e) => updateEditForm('amenities', e.target.value)} placeholder="WiFi, Pool, Spa" className={mInputCls} />
                    </div>
                  </>
                )}

                {editTarget.kind === 'rental' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={mLabelCls}>Locație</label>
                        <input value={editForm.location} onChange={(e) => updateEditForm('location', e.target.value)} className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>Tip rental</label>
                        <input value={editForm.typeLabel} onChange={(e) => updateEditForm('typeLabel', e.target.value)} placeholder="apartment / villa / chalet" className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>Host</label>
                        <input value={editForm.host} onChange={(e) => updateEditForm('host', e.target.value)} className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>Preț/noapte ($)</label>
                        <input type="number" value={editForm.pricePerNight} onChange={(e) => updateEditForm('pricePerNight', e.target.value)} className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldDormitoare}</label>
                        <input type="number" value={editForm.bedrooms} onChange={(e) => updateEditForm('bedrooms', e.target.value)} className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>{t.fieldBai}</label>
                        <input type="number" value={editForm.bathrooms} onChange={(e) => updateEditForm('bathrooms', e.target.value)} className={mInputCls} />
                      </div>
                      <div>
                        <label className={mLabelCls}>Max guests</label>
                        <input type="number" value={editForm.maxGuests} onChange={(e) => updateEditForm('maxGuests', e.target.value)} className={mInputCls} />
                      </div>
                      <div className="col-span-2">
                        <label className={mLabelCls}>Amenities (separate cu virgulă)</label>
                        <input value={editForm.amenities} onChange={(e) => updateEditForm('amenities', e.target.value)} placeholder="WiFi, Pool, Kitchen" className={mInputCls} />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className={mLabelCls}>Descriere</label>
                  <textarea value={editForm.description} onChange={(e) => updateEditForm('description', e.target.value)} rows={3} className={mTextareaCls} />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditTarget(null)} className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800">
                    {t.cancel}
                  </button>
                  <button type="button" onClick={saveEditItem} className="flex-1 rounded-full bg-cyan-500 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600">
                    {t.save}
                  </button>
                </div>
              </div>

              {/* RIGHT — photos */}
              <div className="flex flex-col px-5 py-5">
                <div className="mb-3 flex shrink-0 items-center justify-between">
                  <p className={mLabelCls}>Fotografii</p>
                  <button type="button" onClick={addEditImageField} className="flex items-center gap-1 rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs font-medium text-cyan-600 transition hover:bg-cyan-100 dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-400 dark:hover:bg-cyan-500/25">
                    <Plus className="h-3 w-3" /> {t.adauga}
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  {editForm.imageUrls
                    .slice((editPhotoPage - 1) * EDIT_PHOTOS_PER_PAGE, editPhotoPage * EDIT_PHOTOS_PER_PAGE)
                    .map((img, i) => {
                      const index = (editPhotoPage - 1) * EDIT_PHOTOS_PER_PAGE + i;
                      return (
                        <div key={index} className="grid grid-cols-[1fr_44px_44px] gap-2">
                          <input value={img} onChange={(e) => updateEditImageAt(index, e.target.value)} placeholder={t.pasteUrl} className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" />
                          <div className="flex h-9 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">
                            {img ? (
                              <img
                                src={img}
                                alt={'preview-' + index}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                              />
                            ) : '·'}
                          </div>
                          <button type="button" onClick={() => removeEditImageField(index)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>
                {Math.ceil(editForm.imageUrls.length / EDIT_PHOTOS_PER_PAGE) > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      {(editPhotoPage - 1) * EDIT_PHOTOS_PER_PAGE + 1}–{Math.min(editPhotoPage * EDIT_PHOTOS_PER_PAGE, editForm.imageUrls.length)} din {editForm.imageUrls.length}
                    </p>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setEditPhotoPage((p) => Math.max(1, p - 1))} disabled={editPhotoPage === 1} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-transparent dark:text-slate-400">←</button>
                      {Array.from({ length: Math.ceil(editForm.imageUrls.length / EDIT_PHOTOS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                        <button key={page} type="button" onClick={() => setEditPhotoPage(page)}
                          className={'rounded-lg border px-2.5 py-1 text-xs transition ' + (page === editPhotoPage ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-400')}>
                          {page}
                        </button>
                      ))}
                      <button type="button" onClick={() => setEditPhotoPage((p) => Math.min(Math.ceil(editForm.imageUrls.length / EDIT_PHOTOS_PER_PAGE), p + 1))} disabled={editPhotoPage === Math.ceil(editForm.imageUrls.length / EDIT_PHOTOS_PER_PAGE)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-transparent dark:text-slate-400">→</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
