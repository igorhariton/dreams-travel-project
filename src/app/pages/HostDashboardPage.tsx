import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  DollarSign,
  Edit3,
  Eye,
  HousePlus,
  Layers,
  ListFilter,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  TriangleAlert,
  XCircle,
  LogOut,
} from 'lucide-react';
import {
  useApp,
  type HostListing,
  type HostListingCategory,
  type HostListingType,
  type ListingStatus,
} from '../context/AppContext';
import { destinations } from '../data/travelData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

type HostSection =
  | 'dashboard'
  | 'my-listings'
  | 'add-listing'
  | 'pending-review'
  | 'approved-listings'
  | 'rejected-listings'
  | 'bookings'
  | 'earnings'
  | 'messages';

type SortKey = 'newest' | 'oldest' | 'status' | 'price_low' | 'price_high';

type ListingFormState = {
  name: string;
  listingType: HostListingType;
  destinationId: string;
  location: string;
  address: string;
  pricePerNight: string;
  maxGuests: string;
  bedrooms: string;
  bathrooms: string;
  stars: string;
  amenities: string;
  description: string;
  images: string[];
  policies: string;
  availabilityNotes: string;
  featuredTags: string;
};

const HOST_LISTING_TYPES: { value: HostListingType; label: string; category: HostListingCategory }[] = [
  { value: 'hotel', label: 'Hotel', category: 'hotel' },
  { value: 'resort', label: 'Resort', category: 'hotel' },
  { value: 'boutique_hotel', label: 'Boutique Hotel', category: 'hotel' },
  { value: 'apartment', label: 'Apartment', category: 'rental' },
  { value: 'villa', label: 'Villa', category: 'rental' },
  { value: 'house', label: 'House', category: 'rental' },
  { value: 'cabin', label: 'Cabin', category: 'rental' },
  { value: 'chalet', label: 'Chalet', category: 'rental' },
  { value: 'guesthouse', label: 'Guesthouse', category: 'rental' },
];

function createEmptyForm(): ListingFormState {
  return {
  name: '',
  listingType: 'hotel',
  destinationId: '',
  location: '',
  address: '',
  pricePerNight: '',
  maxGuests: '',
  bedrooms: '',
  bathrooms: '',
  stars: '4',
  amenities: '',
  description: '',
  images: [''],
  policies: '',
  availabilityNotes: '',
  featuredTags: '',
  };
}

const CUSTOM_DESTINATION_VALUE = '__custom_destination__';

const STATUS_STYLES_LIGHT: Record<ListingStatus, string> = {
  draft: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_STYLES_DARK: Record<ListingStatus, string> = {
  draft: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
};

function inferCategory(listingType: HostListingType): HostListingCategory {
  return listingType === 'hotel' || listingType === 'resort' || listingType === 'boutique_hotel' ? 'hotel' : 'rental';
}

function toLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseCsv(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function isHotelType(listingType: HostListingType) {
  return inferCategory(listingType) === 'hotel';
}

function mapListingToForm(listing: HostListing): ListingFormState {
  const listingImages = (listing.images || []).map((image) => image.trim()).filter(Boolean);
  return {
    name: listing.name,
    listingType: listing.listingType,
    destinationId: listing.destinationId || '',
    location: listing.location,
    address: listing.address || '',
    pricePerNight: String(listing.pricePerNight || ''),
    maxGuests: String(listing.maxGuests || ''),
    bedrooms: listing.bedrooms ? String(listing.bedrooms) : '',
    bathrooms: listing.bathrooms ? String(listing.bathrooms) : '',
    stars: listing.stars ? String(listing.stars) : '4',
    amenities: (listing.amenities || []).join(', '),
    description: listing.description || '',
    images: listingImages.length ? listingImages : [''],
    policies: listing.policies || '',
    availabilityNotes: listing.availabilityNotes || '',
    featuredTags: (listing.featuredTags || []).join(', '),
  };
}

function statusIcon(status: ListingStatus) {
  if (status === 'approved') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'pending') return <Loader2 className="h-3.5 w-3.5" />;
  if (status === 'rejected') return <XCircle className="h-3.5 w-3.5" />;
  return <Edit3 className="h-3.5 w-3.5" />;
}

function StatusBadge({ status, isDarkTheme }: { status: ListingStatus; isDarkTheme: boolean }) {
  const toneClasses = isDarkTheme ? STATUS_STYLES_DARK[status] : STATUS_STYLES_LIGHT[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${toneClasses}`}>
      {statusIcon(status)}
      {status === 'pending' ? 'pending review' : status}
    </span>
  );
}

export default function HostDashboardPage() {
  const {
    role,
    currentUser,
    theme,
    formatPrice,
    addHostListing,
    updateHostListing,
    deleteHostListing,
    submitHostListing,
    resubmitHostListing,
    duplicateHostListing,
    getMyListings,
    translateDynamic,
    language,
    logout,
  } = useApp();
  const navigate = useNavigate();

  const [section, setSection] = useState<HostSection>('dashboard');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | HostListingType>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<ListingFormState>(createEmptyForm());
  const isDarkTheme = theme === 'dark';
  const logoutLabel = language === 'ro' ? 'Ieșire' : language === 'ru' ? 'Выйти' : 'Logout';

  const myListings = getMyListings();

  const listingsByStatus = useMemo(
    () => ({
      draft: myListings.filter((listing) => listing.status === 'draft'),
      pending: myListings.filter((listing) => listing.status === 'pending'),
      approved: myListings.filter((listing) => listing.status === 'approved'),
      rejected: myListings.filter((listing) => listing.status === 'rejected'),
    }),
    [myListings],
  );

  const activeEdit = useMemo(
    () => (editingId ? myListings.find((listing) => listing.id === editingId) || null : null),
    [editingId, myListings],
  );

  const previewListing = useMemo(
    () => (previewId ? myListings.find((listing) => listing.id === previewId) || null : null),
    [previewId, myListings],
  );

  const totalEarnings = useMemo(
    () =>
      myListings.reduce(
        (sum, listing) =>
          sum + (listing.earningsTotal ?? (listing.bookingsCount || 0) * listing.pricePerNight),
        0,
      ),
    [myListings],
  );

  const totalBookings = useMemo(
    () => myListings.reduce((sum, listing) => sum + (listing.bookingsCount || 0), 0),
    [myListings],
  );

  const pendingRevenue = useMemo(
    () =>
      listingsByStatus.pending.reduce(
        (sum, listing) => sum + (listing.bookingsCount || 0) * listing.pricePerNight,
        0,
      ),
    [listingsByStatus.pending],
  );

  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = myListings.filter((listing) => {
      const byQuery =
        !normalized ||
        listing.name.toLowerCase().includes(normalized) ||
        listing.id.toLowerCase().includes(normalized) ||
        listing.location.toLowerCase().includes(normalized);
      const byStatus = statusFilter === 'all' || listing.status === statusFilter;
      const byType = typeFilter === 'all' || listing.listingType === typeFilter;
      return byQuery && byStatus && byType;
    });

    const priority: Record<ListingStatus, number> = {
      pending: 0,
      draft: 1,
      rejected: 2,
      approved: 3,
    };

    return source.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === 'price_low') return a.pricePerNight - b.pricePerNight;
      if (sortBy === 'price_high') return b.pricePerNight - a.pricePerNight;
      return priority[a.status] - priority[b.status];
    });
  }, [myListings, query, statusFilter, typeFilter, sortBy]);

  const sectionListings = useMemo(() => {
    if (section === 'pending-review') return listingsByStatus.pending;
    if (section === 'approved-listings') return listingsByStatus.approved;
    if (section === 'rejected-listings') return listingsByStatus.rejected;
    return filteredListings;
  }, [section, filteredListings, listingsByStatus]);

  const averageNightlyPrice = useMemo(() => {
    if (!myListings.length) return 0;
    return Math.round(myListings.reduce((sum, listing) => sum + listing.pricePerNight, 0) / myListings.length);
  }, [myListings]);

  const navItems: { key: HostSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'my-listings', label: 'My Listings', icon: <Layers className="h-4 w-4" />, badge: myListings.length },
    { key: 'add-listing', label: 'Add Listing', icon: <HousePlus className="h-4 w-4" /> },
    { key: 'pending-review', label: 'Pending Review', icon: <Clock3 className="h-4 w-4" />, badge: listingsByStatus.pending.length },
    { key: 'approved-listings', label: 'Approved Listings', icon: <ShieldCheck className="h-4 w-4" />, badge: listingsByStatus.approved.length },
    { key: 'rejected-listings', label: 'Rejected Listings', icon: <TriangleAlert className="h-4 w-4" />, badge: listingsByStatus.rejected.length },
    { key: 'bookings', label: 'Bookings', icon: <BedDouble className="h-4 w-4" />, badge: totalBookings },
    { key: 'earnings', label: 'Earnings', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(createEmptyForm());
    setFormError('');
    setSection('add-listing');
  }

  function openEditForm(listing: HostListing) {
    setEditingId(listing.id);
    setForm(mapListingToForm(listing));
    setFormError('');
    setSection('add-listing');
  }

  function handleDestinationChange(destinationId: string) {
    const destination = destinations.find((item) => item.id === destinationId);
    setForm((prev) => ({
      ...prev,
      destinationId,
      location: destination ? `${destination.name}, ${destination.country}` : prev.location,
    }));
  }

  function validateForm(state: ListingFormState) {
    const errors: string[] = [];
    const cleanImages = state.images.map((image) => image.trim()).filter(Boolean);
    if (!state.name.trim()) errors.push('Title is required.');
    if (!state.location.trim()) errors.push('Location is required.');
    if (!state.address.trim()) errors.push('Address is required.');
    if (!state.description.trim()) errors.push('Description is required.');
    if (!cleanImages.length) errors.push('At least one image URL is required.');
    if (!parseCsv(state.amenities).length) errors.push('Add at least one amenity.');
    if (!(Number(state.pricePerNight) > 0)) errors.push('Price per night must be greater than 0.');
    if (!(Number(state.maxGuests) > 0)) errors.push('Guest capacity must be at least 1.');

    if (isHotelType(state.listingType)) {
      const stars = Number(state.stars);
      if (!(stars >= 1 && stars <= 5)) errors.push('Hotel/Resort listings must include stars from 1 to 5.');
    } else {
      if (!(Number(state.bedrooms) >= 1)) errors.push('Bedrooms must be at least 1 for rental listings.');
      if (!(Number(state.bathrooms) >= 1)) errors.push('Bathrooms must be at least 1 for rental listings.');
    }
    return errors;
  }

  function toPayload(state: ListingFormState) {
    const listingType = state.listingType;
    const category = inferCategory(listingType);
    const hotelCategory = isHotelType(listingType);
    const cleanImages = state.images.map((image) => image.trim()).filter(Boolean);

    return {
      name: state.name.trim(),
      type: category as HostListingCategory,
      listingType,
      destinationId: state.destinationId || 'custom-destination',
      location: state.location.trim(),
      address: state.address.trim(),
      description: state.description.trim(),
      pricePerNight: Number(state.pricePerNight),
      maxGuests: Number(state.maxGuests),
      bedrooms: hotelCategory ? undefined : Number(state.bedrooms || 0),
      bathrooms: hotelCategory ? undefined : Number(state.bathrooms || 0),
      stars: hotelCategory ? Number(state.stars || 0) : undefined,
      amenities: parseCsv(state.amenities),
      images: cleanImages,
      policies: state.policies.trim(),
      availabilityNotes: state.availabilityNotes.trim(),
      featuredTags: parseCsv(state.featuredTags),
      hotelType: hotelCategory ? toLabel(listingType).toLowerCase() : undefined,
      rentalType: hotelCategory ? undefined : toLabel(listingType).toLowerCase(),
    };
  }

  function handleSave(submitForReview: boolean) {
    const errors = validateForm(form);
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }
    setFormError('');
    const payload = toPayload(form);

    if (activeEdit) {
      updateHostListing(activeEdit.id, payload);
      if (submitForReview) {
        if (activeEdit.status === 'rejected') resubmitHostListing(activeEdit.id);
        else submitHostListing(activeEdit.id);
      }
    } else {
      addHostListing(payload, { submit: submitForReview });
    }

    setEditingId(null);
    setForm(createEmptyForm());
    setSection(submitForReview ? 'pending-review' : 'my-listings');
  }

  function updateImageField(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((image, imageIndex) => (imageIndex === index ? value : image)),
    }));
  }

  function addImageField() {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ''],
    }));
  }

  function removeImageField(index: number) {
    setForm((prev) => {
      const nextImages = prev.images.filter((_, imageIndex) => imageIndex !== index);
      return {
        ...prev,
        images: nextImages.length ? nextImages : [''],
      };
    });
  }

  function handleDelete(listing: HostListing) {
    const shouldDelete = window.confirm(`Delete listing ${listing.id}? This action cannot be undone.`);
    if (!shouldDelete) return;
    deleteHostListing(listing.id);
  }

  function handleDuplicate(listing: HostListing) {
    const newId = duplicateHostListing(listing.id);
    if (!newId) return;
    setSection('my-listings');
  }

  function renderListingCollection(listings: HostListing[], emptyTitle: string, emptyText: string) {
    if (!listings.length) {
      return (
        <div className={`travel-panel border border-dashed p-10 text-center ${isDarkTheme ? 'border-slate-700 bg-slate-900/60' : 'border-[#CFE0F0] bg-[#F8FBFF]'}`}>
          <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${isDarkTheme ? 'bg-slate-800 text-slate-400' : 'bg-[#EAF3FF] text-[#2563EB]'}`}>
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{emptyTitle}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
          <button
            onClick={openCreateForm}
            className="travel-primary-button mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Listing
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {listings.map((listing) => {
          const canEdit = listing.status === 'draft' || listing.status === 'rejected';
          const canSubmit = listing.status === 'draft';
          const canResubmit = listing.status === 'rejected';
          return (
            <article key={listing.id} className={`travel-panel border p-4 shadow-sm md:p-5 ${isDarkTheme ? 'border-slate-700 bg-slate-900/70' : 'border-[#D6E4F2] bg-white'}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-1 gap-4">
                  <div className={`h-24 w-28 shrink-0 overflow-hidden rounded-2xl ${isDarkTheme ? 'bg-slate-800' : 'bg-[#EAF3FF]'}`}>
                    {listing.images[0] ? (
                      <img src={listing.images[0]} alt={listing.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={listing.status} isDarkTheme={isDarkTheme} />
                      <span className="travel-badge bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                        {toLabel(listing.listingType)}
                      </span>
                      <span className={`travel-badge px-2.5 py-1 text-xs font-medium ${isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-[#EAF3FF] text-[#325A8C]'}`}>
                        {listing.id}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{listing.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing.location}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                      <span>{formatPrice(listing.pricePerNight)} / night</span>
                      <span>{listing.maxGuests} guests</span>
                      <span>Updated {formatDate(listing.updatedAt)}</span>
                    </div>
                    {listing.reviewNote && (
                      <p className={`mt-3 rounded-xl border px-3 py-2 text-xs ${isDarkTheme ? 'border-slate-700 bg-slate-800/70 text-slate-300' : 'border-[#D6E4F2] bg-[#F3F9FF] text-[#334155]'}`}>
                        <span className="font-semibold">Admin feedback:</span> {listing.reviewNote}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    onClick={() => setPreviewId(listing.id)}
                    className="travel-secondary-button inline-flex items-center gap-1.5 px-3.5 py-2 text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleDuplicate(listing)}
                    className="travel-secondary-button inline-flex items-center gap-1.5 px-3.5 py-2 text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => openEditForm(listing)}
                      className="travel-secondary-button inline-flex items-center gap-1.5 px-3.5 py-2 text-sm"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {canSubmit && (
                    <button
                      onClick={() => submitHostListing(listing.id)}
                      className="travel-primary-button inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold"
                    >
                      <Send className="h-4 w-4" />
                      Submit
                    </button>
                  )}
                  {canResubmit && (
                    <button
                      onClick={() => resubmitHostListing(listing.id)}
                      className="travel-primary-button inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold"
                    >
                      <Send className="h-4 w-4" />
                      Resubmit
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(listing)}
                    className="inline-flex items-center gap-1.5 rounded-[18px] border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function renderListingFilters() {
    return (
      <div className={`travel-panel border p-4 shadow-sm ${isDarkTheme ? 'border-slate-700 bg-slate-900/70' : 'border-[#D6E4F2] bg-[#F8FBFF]'}`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, id, location..."
              className="travel-input-field host-search-input w-full text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | ListingStatus)}>
            <SelectTrigger className="travel-select-trigger w-full text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="travel-select-content">
              <SelectItem className="travel-select-item" value="all">All statuses</SelectItem>
              <SelectItem className="travel-select-item" value="draft">Draft</SelectItem>
              <SelectItem className="travel-select-item" value="pending">Pending review</SelectItem>
              <SelectItem className="travel-select-item" value="approved">Approved</SelectItem>
              <SelectItem className="travel-select-item" value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | HostListingType)}>
            <SelectTrigger className="travel-select-trigger w-full text-sm">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="travel-select-content">
              <SelectItem className="travel-select-item" value="all">All types</SelectItem>
              {HOST_LISTING_TYPES.map((item) => (
                <SelectItem className="travel-select-item" key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
            <SelectTrigger className="travel-select-trigger w-full text-sm">
              <SelectValue placeholder="Newest first" />
            </SelectTrigger>
            <SelectContent className="travel-select-content">
              <SelectItem className="travel-select-item" value="newest">Newest first</SelectItem>
              <SelectItem className="travel-select-item" value="oldest">Oldest first</SelectItem>
              <SelectItem className="travel-select-item" value="status">Status priority</SelectItem>
              <SelectItem className="travel-select-item" value="price_low">Price low to high</SelectItem>
              <SelectItem className="travel-select-item" value="price_high">Price high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  function renderListingForm() {
    const editing = Boolean(activeEdit);
    const isHotel = isHotelType(form.listingType);

    return (
      <div className="space-y-4">
        <div className={isDarkTheme
          ? 'travel-panel border border-slate-700 bg-slate-900/70 p-6 shadow-sm'
          : 'travel-panel border border-[#CFE0F0] bg-[#F8FBFF] p-6 shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editing ? `Edit Listing ${activeEdit?.id}` : 'Add New Listing'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create a complete listing and submit it to admin review when ready.
              </p>
            </div>
            {activeEdit?.status && <StatusBadge status={activeEdit.status} isDarkTheme={isDarkTheme} />}
          </div>

          {formError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Title</label>
              <input
                className="travel-input-field w-full text-sm"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Sunrise Coastline Villa"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Listing Type</label>
              <Select
                value={form.listingType}
                onValueChange={(value) => setForm((prev) => ({ ...prev, listingType: value as HostListingType }))}
              >
                <SelectTrigger className="travel-select-trigger w-full text-sm">
                  <SelectValue placeholder="Select listing type" />
                </SelectTrigger>
                <SelectContent className="travel-select-content">
                  {HOST_LISTING_TYPES.map((item) => (
                    <SelectItem className="travel-select-item" key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Destination</label>
              <Select
                value={form.destinationId || CUSTOM_DESTINATION_VALUE}
                onValueChange={(value) => handleDestinationChange(value === CUSTOM_DESTINATION_VALUE ? '' : value)}
              >
                <SelectTrigger className="travel-select-trigger w-full text-sm">
                  <SelectValue placeholder="Custom / not listed" />
                </SelectTrigger>
                <SelectContent className="travel-select-content">
                  <SelectItem className="travel-select-item" value={CUSTOM_DESTINATION_VALUE}>Custom / not listed</SelectItem>
                  {destinations.map((destination) => (
                    <SelectItem className="travel-select-item" key={destination.id} value={destination.id}>
                      {destination.name}, {destination.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Location</label>
              <input
                className="travel-input-field w-full text-sm"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="Santorini, Greece"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Address</label>
            <input
              className="travel-input-field w-full text-sm"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="Street, number, district"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Price / Night</label>
              <input
                type="number"
                min={1}
                className="travel-input-field w-full text-sm"
                value={form.pricePerNight}
                onChange={(event) => setForm((prev) => ({ ...prev, pricePerNight: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Guests</label>
              <input
                type="number"
                min={1}
                className="travel-input-field w-full text-sm"
                value={form.maxGuests}
                onChange={(event) => setForm((prev) => ({ ...prev, maxGuests: event.target.value }))}
              />
            </div>
            {isHotel ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Stars</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="travel-input-field w-full text-sm"
                  value={form.stars}
                  onChange={(event) => setForm((prev) => ({ ...prev, stars: event.target.value }))}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bedrooms</label>
                  <input
                    type="number"
                    min={1}
                    className="travel-input-field w-full text-sm"
                    value={form.bedrooms}
                    onChange={(event) => setForm((prev) => ({ ...prev, bedrooms: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bathrooms</label>
                  <input
                    type="number"
                    min={1}
                    className="travel-input-field w-full text-sm"
                    value={form.bathrooms}
                    onChange={(event) => setForm((prev) => ({ ...prev, bathrooms: event.target.value }))}
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Description</label>
            <textarea
              rows={4}
              className="travel-input-field w-full text-sm"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe the guest experience and what makes your listing unique."
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Amenities (comma separated)</label>
              <input
                className="travel-input-field w-full text-sm"
                value={form.amenities}
                onChange={(event) => setForm((prev) => ({ ...prev, amenities: event.target.value }))}
                placeholder="WiFi, Pool, Breakfast"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Images URLs</label>
                <button
                  type="button"
                  onClick={addImageField}
                  className="travel-secondary-button inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add photo
                </button>
              </div>
              <div className="space-y-2">
                {form.images.map((imageUrl, index) => (
                  <div key={`image-field-${index}`} className="flex items-center gap-2">
                    <input
                      className="travel-input-field w-full text-sm"
                      value={imageUrl}
                      onChange={(event) => updateImageField(index, event.target.value)}
                      placeholder={`https://... (Photo ${index + 1})`}
                    />
                    {form.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Policies</label>
              <textarea
                rows={3}
                className="travel-input-field w-full text-sm"
                value={form.policies}
                onChange={(event) => setForm((prev) => ({ ...prev, policies: event.target.value }))}
                placeholder="Cancellation policy, quiet hours, pet policy..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Availability Notes</label>
              <textarea
                rows={3}
                className="travel-input-field w-full text-sm"
                value={form.availabilityNotes}
                onChange={(event) => setForm((prev) => ({ ...prev, availabilityNotes: event.target.value }))}
                placeholder="Seasonality and blocked dates."
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Featured tags (comma separated)</label>
            <input
              className="travel-input-field w-full text-sm"
              value={form.featuredTags}
              onChange={(event) => setForm((prev) => ({ ...prev, featuredTags: event.target.value }))}
              placeholder="Family Friendly, Luxury, Sea View"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleSave(false)}
              className="travel-secondary-button inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              <Edit3 className="h-4 w-4" />
              {editing ? 'Save Changes' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              className="travel-primary-button inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              <Send className="h-4 w-4" />
              {activeEdit?.status === 'rejected' ? 'Resubmit to Admin' : 'Submit for Approval'}
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(createEmptyForm());
                setFormError('');
                setSection('my-listings');
              }}
              className="travel-secondary-button inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderDashboard() {
    const dashboardSectionClass = isDarkTheme
      ? 'travel-panel border border-slate-700 bg-slate-900/70 p-5 shadow-sm'
      : 'travel-panel border border-[#D6E4F2] bg-[#F8FBFF] p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]';
    const secondaryActionClass = isDarkTheme
      ? 'travel-secondary-button flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold'
      : 'flex w-full items-center justify-center gap-2 rounded-xl border border-[#CFE0F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition hover:bg-[#EEF6FF]';

    return (
      <div className="space-y-5">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={isDarkTheme
            ? 'travel-panel border border-slate-700 bg-slate-900/70 p-5 shadow-sm'
            : 'travel-panel border border-[#BFD8FF] bg-gradient-to-br from-[#EEF4FF] to-[#E8F8FF] p-5 shadow-[0_10px_28px_rgba(14,116,144,0.09)]'}
          >
            <p className={`text-sm ${isDarkTheme ? 'text-slate-500 dark:text-slate-400' : 'text-[#1E3A8A]'}`}>Total listings</p>
            <p className={`mt-2 text-3xl font-black ${isDarkTheme ? 'text-slate-900 dark:text-slate-100' : 'text-[#0F172A]'}`}>{myListings.length}</p>
            <p className={`mt-1 text-xs ${isDarkTheme ? 'text-slate-500 dark:text-slate-400' : 'text-[#334155]'}`}>{listingsByStatus.approved.length} currently approved</p>
          </div>
          <div className={isDarkTheme
            ? 'travel-panel border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10'
            : 'travel-panel border border-[#FCD34D] bg-[#FFFBEB] p-5 shadow-[0_10px_24px_rgba(234,179,8,0.16)]'}
          >
            <p className={`text-sm ${isDarkTheme ? 'text-amber-700 dark:text-amber-300' : 'text-[#B45309]'}`}>Pending review</p>
            <p className={`mt-2 text-3xl font-black ${isDarkTheme ? 'text-amber-700 dark:text-amber-200' : 'text-[#B45309]'}`}>{listingsByStatus.pending.length}</p>
            <p className={`mt-1 text-xs ${isDarkTheme ? 'text-amber-700/80 dark:text-amber-300/80' : 'text-[#92400E]'}`}>Awaiting admin decision</p>
          </div>
          <div className={isDarkTheme
            ? 'travel-panel border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10'
            : 'travel-panel border border-[#86EFAC] bg-[#ECFDF5] p-5 shadow-[0_10px_24px_rgba(16,185,129,0.14)]'}
          >
            <p className={`text-sm ${isDarkTheme ? 'text-emerald-700 dark:text-emerald-300' : 'text-[#065F46]'}`}>Estimated earnings</p>
            <p className={`mt-2 text-3xl font-black ${isDarkTheme ? 'text-emerald-700 dark:text-emerald-200' : 'text-[#065F46]'}`}>{formatPrice(totalEarnings)}</p>
            <p className={`mt-1 text-xs ${isDarkTheme ? 'text-emerald-700/80 dark:text-emerald-300/80' : 'text-[#047857]'}`}>From total approved+booked inventory</p>
          </div>
          <div className={isDarkTheme
            ? 'travel-panel border border-sky-200 bg-sky-50 p-5 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/10'
            : 'travel-panel border border-[#7DD3FC] bg-[#EFF6FF] p-5 shadow-[0_10px_24px_rgba(14,165,233,0.14)]'}
          >
            <p className={`text-sm ${isDarkTheme ? 'text-sky-700 dark:text-sky-300' : 'text-[#0C4A6E]'}`}>Avg nightly rate</p>
            <p className={`mt-2 text-3xl font-black ${isDarkTheme ? 'text-sky-700 dark:text-sky-200' : 'text-[#0C4A6E]'}`}>{formatPrice(averageNightlyPrice)}</p>
            <p className={`mt-1 text-xs ${isDarkTheme ? 'text-sky-700/80 dark:text-sky-300/80' : 'text-[#075985]'}`}>{totalBookings} total bookings tracked</p>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <div className={`${dashboardSectionClass} xl:col-span-2`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className={`text-lg font-bold ${isDarkTheme ? 'text-slate-900 dark:text-slate-100' : 'text-[#0F172A]'}`}>Recent listing activity</h2>
              <button
                onClick={() => setSection('my-listings')}
                className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {(myListings.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)).map((listing) => (
                <div key={listing.id} className={isDarkTheme ? 'travel-panel border border-slate-700 bg-slate-800/70 p-3' : 'travel-panel border border-[#DCE8F5] bg-white p-3'}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${isDarkTheme ? 'text-slate-100' : 'text-[#0F172A]'}`}>{listing.name}</p>
                      <p className={`mt-0.5 text-xs ${isDarkTheme ? 'text-slate-300' : 'text-[#475569]'}`}>
                        {listing.id} · {toLabel(listing.listingType)} · Updated {formatDate(listing.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={listing.status} isDarkTheme={isDarkTheme} />
                  </div>
                </div>
              ))}
              {!myListings.length && (
                <p className={`rounded-2xl border border-dashed p-4 text-sm ${isDarkTheme ? 'border-slate-700 text-slate-400' : 'border-[#BFDBFE] text-[#325A8C]'}`}>
                  No listings yet. Add your first listing to start the host workflow.
                </p>
              )}
            </div>
          </div>

          <div className={dashboardSectionClass}>
            <h2 className={`text-lg font-bold ${isDarkTheme ? 'text-slate-900 dark:text-slate-100' : 'text-[#0F172A]'}`}>Quick actions</h2>
            <div className="mt-4 space-y-2.5">
              <button
                onClick={openCreateForm}
                className="travel-primary-button flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Listing
              </button>
              <button
                onClick={() => setSection('pending-review')}
                className={secondaryActionClass}
              >
                <Clock3 className="h-4 w-4" />
                Review Queue
              </button>
              <button
                onClick={() => setSection('rejected-listings')}
                className={secondaryActionClass}
              >
                <TriangleAlert className="h-4 w-4" />
                Fix Rejected Listings
              </button>
            </div>
            <div className={isDarkTheme
              ? 'travel-surface-secondary travel-summary-box mt-5 border p-4'
              : 'travel-panel travel-summary-box mt-5 border border-[#CFE0F0] bg-[#EEF6FF] p-4'}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkTheme ? 'text-slate-300' : 'text-[#1E3A8A]'}`}>Submission health</p>
              <div className={`mt-3 space-y-2 text-sm ${isDarkTheme ? 'text-slate-200' : 'text-[#334155]'}`}>
                <p>{listingsByStatus.draft.length} drafts ready to complete</p>
                <p>{listingsByStatus.pending.length} waiting for admin</p>
                <p>{listingsByStatus.rejected.length} need revision and resubmission</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderBookings() {
    return (
      <div className="space-y-4">
        <div className={isDarkTheme
          ? 'travel-panel border border-slate-700 bg-slate-900/70 p-5 shadow-sm'
          : 'travel-panel border border-[#CFE0F0] bg-[#F8FBFF] p-5 shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Bookings Summary</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Bookings are derived from listing records until dedicated reservations management is connected.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="travel-surface travel-panel border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total bookings</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{totalBookings}</p>
            </div>
            <div className="travel-surface travel-panel border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Pending revenue</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{formatPrice(pendingRevenue)}</p>
            </div>
            <div className="travel-surface travel-panel border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Approved listings</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{listingsByStatus.approved.length}</p>
            </div>
          </div>
        </div>

        <div className={isDarkTheme
          ? 'travel-panel border border-slate-700 bg-slate-900/70 p-5 shadow-sm'
          : 'travel-panel border border-[#CFE0F0] bg-[#F8FBFF] p-5 shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Listing performance</h3>
          <div className="mt-4 space-y-3">
            {myListings.map((listing) => (
              <div key={listing.id} className="travel-surface travel-panel border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{listing.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{listing.id}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                    <p>{listing.bookingsCount || 0} bookings</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{formatPrice((listing.bookingsCount || 0) * listing.pricePerNight)}</p>
                  </div>
                </div>
              </div>
            ))}
            {!myListings.length && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No listings yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderEarnings() {
    const sorted = myListings
      .slice()
      .sort((a, b) => ((b.earningsTotal || b.pricePerNight) - (a.earningsTotal || a.pricePerNight)))
      .slice(0, 6);
    return (
      <div className="space-y-4">
        <div className={isDarkTheme
          ? 'travel-panel border border-slate-700 bg-slate-900/70 p-5 shadow-sm'
          : 'travel-panel border border-[#CFE0F0] bg-[#F8FBFF] p-5 shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Earnings</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Revenue snapshot tied to listing performance and nightly rates.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="travel-surface travel-panel border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total projected</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{formatPrice(totalEarnings)}</p>
            </div>
            <div className="travel-surface travel-panel border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Average nightly</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{formatPrice(averageNightlyPrice)}</p>
            </div>
            <div className="travel-surface travel-panel border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Live inventory</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{listingsByStatus.approved.length}</p>
            </div>
          </div>
        </div>

        <div className={isDarkTheme
          ? 'travel-panel border border-slate-700 bg-slate-900/70 p-5 shadow-sm'
          : 'travel-panel border border-[#CFE0F0] bg-[#F8FBFF] p-5 shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Top earning listings</h3>
          <div className="mt-4 space-y-3">
            {sorted.map((listing) => {
              const estimated = listing.earningsTotal ?? listing.pricePerNight * (listing.bookingsCount || 0);
              return (
                <div key={listing.id} className="travel-surface travel-panel border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{listing.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{listing.id} · {toLabel(listing.listingType)}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatPrice(estimated)}</p>
                  </div>
                </div>
              );
            })}
            {!sorted.length && <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>}
          </div>
        </div>
      </div>
    );
  }

  function renderMessages() {
    return (
      <div className={isDarkTheme
        ? 'travel-panel border border-slate-700 bg-slate-900/70 p-6 shadow-sm'
        : 'travel-panel border border-[#CFE0F0] bg-[#F8FBFF] p-6 shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Messages & Support</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Host support inbox is ready for integration. This section will include admin feedback threads and support messages.
        </p>
        <div className="travel-surface-secondary travel-summary-box mt-5 border p-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Next integration targets</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>Threaded admin comments for listing reviews</li>
            <li>Real-time host support updates</li>
            <li>Notifications for status changes (approved/rejected)</li>
          </ul>
        </div>
      </div>
    );
  }

  function renderMainContent() {
    if (section === 'dashboard') return renderDashboard();
    if (section === 'add-listing') return renderListingForm();
    if (section === 'bookings') return renderBookings();
    if (section === 'earnings') return renderEarnings();
    if (section === 'messages') return renderMessages();

    const metadata: Record<string, { title: string; subtitle: string; emptyTitle: string; emptyText: string }> = {
      'my-listings': {
        title: 'My Listings',
        subtitle: 'Manage all your hotels, villas, apartments, houses, and other stays.',
        emptyTitle: 'No listings yet',
        emptyText: 'Create your first listing to start hosting.',
      },
      'pending-review': {
        title: 'Pending Review',
        subtitle: 'Listings submitted to admin and waiting for review.',
        emptyTitle: 'No pending listings',
        emptyText: 'Submitted listings will appear here while admin reviews them.',
      },
      'approved-listings': {
        title: 'Approved Listings',
        subtitle: 'Listings approved by admin and available as active inventory.',
        emptyTitle: 'No approved listings',
        emptyText: 'Approved listings will appear here once reviewed by admin.',
      },
      'rejected-listings': {
        title: 'Rejected Listings',
        subtitle: 'Listings that need changes before resubmission.',
        emptyTitle: 'No rejected listings',
        emptyText: 'Any rejected listing will show here with admin feedback.',
      },
    };

    const header = metadata[section];

    return (
      <div className="space-y-4">
        <div className={isDarkTheme
          ? 'travel-panel border border-slate-700 bg-slate-900/70 p-5 shadow-sm'
          : 'travel-panel border border-[#CFE0F0] bg-[#F8FBFF] p-5 shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{header.title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{header.subtitle}</p>
          {(section === 'my-listings' || section === 'pending-review' || section === 'approved-listings' || section === 'rejected-listings') && (
            <div className="mt-4 flex flex-wrap gap-2">
              {section === 'my-listings' && (
                <button
                  onClick={openCreateForm}
                  className="travel-primary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Add Listing
                </button>
              )}
              {section === 'rejected-listings' && (
                <button
                  onClick={openCreateForm}
                  className="travel-secondary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
                >
                  <Edit3 className="h-4 w-4" />
                  Add Revised Listing
                </button>
              )}
            </div>
          )}
        </div>

        {section === 'my-listings' && renderListingFilters()}
        {renderListingCollection(sectionListings, header.emptyTitle, header.emptyText)}
      </div>
    );
  }

  if (role !== 'host') {
    return (
      <div className={`host-dashboard ${isDarkTheme ? 'host-theme-dark' : 'host-theme-light'} min-h-screen bg-[var(--background)] pt-20`}>
        <div className="mx-auto max-w-xl px-4">
          <div className={isDarkTheme
            ? 'travel-panel border border-slate-700 bg-slate-900/70 p-10 text-center shadow-sm'
            : 'travel-panel border border-[#CFE0F0] bg-[#F8FBFF] p-10 text-center shadow-[0_10px_28px_rgba(14,116,144,0.08)]'}
          >
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-[#EAF3FF] text-[#2563EB]'}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{translateDynamic('Access Restricted')}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {translateDynamic('Switch to Host role in the navbar to access the Host Dashboard.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`host-dashboard ${isDarkTheme ? 'host-theme-dark' : 'host-theme-light'} min-h-screen bg-[var(--background)] pt-20`}>
      <div className="mx-auto max-w-[1500px] px-4 pb-10 sm:px-6">
        <header className={`travel-shell overflow-hidden border bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 shadow-sm ${isDarkTheme ? 'border-slate-700' : 'border-[#BFD8FF]'}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="travel-badge inline-flex items-center gap-2 bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                Host Portal
              </p>
              <h1 className="mt-2 text-3xl font-black text-white">Hosting Command Center</h1>
              <p className="mt-1 text-sm text-blue-50">
                Manage listings end-to-end from draft to admin approval, with unified hotel and rental workflow.
              </p>
            </div>
            <div className="travel-panel border border-white/30 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-blue-100">Host Account</p>
              <p className="mt-1 text-sm font-semibold text-white">{currentUser?.name || 'Host'}</p>
              <p className="text-xs text-blue-100">{currentUser?.id || '—'}</p>
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-5 xl:grid-cols-[280px,1fr]">
          <aside className="space-y-4">
            <div
              className={`host-nav-shell travel-panel border p-3 shadow-sm ${
                isDarkTheme ? 'border-slate-700 bg-slate-900/70' : 'border-[#CFE0F0] bg-[#F8FBFF]'
              }`}
            >
              <div className="mb-2 flex items-center gap-2 px-2 py-1">
                <ListFilter className={`h-4 w-4 ${isDarkTheme ? 'text-slate-500' : 'text-[#2563EB]'}`} />
                <p className={`text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-[#1E3A8A]'}`}>Host Menu</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSection(item.key)}
                    className={`host-nav-item flex w-full items-center justify-between rounded-[18px] px-3 py-2.5 text-sm font-semibold transition ${
                      section === item.key
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white'
                        : isDarkTheme
                          ? 'text-slate-200 hover:bg-slate-800'
                          : 'text-[#23406A] hover:bg-[#EAF3FF] hover:text-[#0F2747]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                    {typeof item.badge === 'number' && (
                      <span
                        className={`host-nav-badge travel-badge px-2 py-0.5 text-xs ${
                          section === item.key
                            ? 'bg-white/30 text-white'
                            : isDarkTheme
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-[#EAF3FF] text-[#325A8C]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              <div className={`mt-3 border-t pt-3 ${isDarkTheme ? 'border-slate-700' : 'border-[#D6E4F2]'}`}>
                <button
                  onClick={handleLogout}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-[14px] border px-3 py-2.5 text-sm font-semibold transition ${
                    isDarkTheme
                      ? 'border-slate-600 bg-slate-800 text-rose-300 hover:bg-slate-700'
                      : 'border-[#FBC8D1] bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <LogOut className="h-4 w-4" />
                  {logoutLabel}
                </button>
              </div>
            </div>
          </aside>

          <main>{renderMainContent()}</main>
        </div>
      </div>

      {previewListing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4" onClick={() => setPreviewId(null)}>
          <div
            className={`travel-shell max-h-[92vh] w-full max-w-4xl overflow-hidden border shadow-2xl ${isDarkTheme ? 'border-slate-700 bg-slate-900' : 'border-[#CFE0F0] bg-[#F8FBFF]'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b px-6 py-4 ${isDarkTheme ? 'border-slate-700' : 'border-[#D6E4F2]'}`}>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{previewListing.id}</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{previewListing.name}</h3>
              </div>
              <button
                onClick={() => setPreviewId(null)}
                className={`travel-icon-button flex h-9 w-9 items-center justify-center border ${isDarkTheme ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-[#D6E4F2] text-[#334155] hover:bg-[#EAF3FF]'}`}
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="app-modal-scroll max-h-[calc(92vh-84px)] overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
                <div className="space-y-4">
                  <div className={`h-56 overflow-hidden rounded-3xl ${isDarkTheme ? 'bg-slate-800' : 'bg-[#EAF3FF]'}`}>
                    {previewListing.images[0] ? (
                      <img src={previewListing.images[0]} alt={previewListing.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{previewListing.description}</p>
                </div>
                <div className="space-y-3">
                  <div className="travel-surface travel-panel border p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Overview</p>
                    <div className="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
                      <p>{toLabel(previewListing.listingType)}</p>
                      <p>{previewListing.location}</p>
                      <p>{formatPrice(previewListing.pricePerNight)} / night</p>
                      <p>{previewListing.maxGuests} guests</p>
                      {previewListing.stars ? (
                        <p className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400" />
                          {previewListing.stars} stars
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="travel-surface travel-panel border p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Amenities</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {previewListing.amenities.map((item) => (
                        <span key={item} className={`travel-badge px-2.5 py-1 text-xs ${isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-[#EAF3FF] text-[#325A8C]'}`}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  {previewListing.reviewNote && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      <span className="font-semibold">Admin note:</span> {previewListing.reviewNote}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
