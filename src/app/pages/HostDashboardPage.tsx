import React, { useMemo, useState, useCallback } from 'react';
import { Calendar as CalendarIcon, DollarSign, Home, MapPin, Plus, Star, Users, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProgressiveImage } from '../components/ProgressiveImage';
import { Calendar } from '../components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type PropertyType = 'Hotel' | 'Apartment' | 'House' | 'Villa';

interface HostProperty {
  id: string;
  name: string;
  type: PropertyType;
  city: string;
  address: string;
  description: string;
  pricePerNight: number;
  rooms: number;
  maxGuests: number;
  amenities: string;
  images: string[];
  rating: number;
}

type BookingStatus = 'pending' | 'accepted' | 'rejected';

interface HostBooking {
  id: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  status: BookingStatus;
}

interface EarningsPoint {
  month: string;
  amount: number;
}

// ───────────────── Host Stats ─────────────────

interface HostStatsCardsProps {
  properties: HostProperty[];
  bookings: HostBooking[];
}

function HostStatsCards({ properties, bookings }: HostStatsCardsProps) {
  const totalProperties = properties.length;
  const activeBookings = bookings.filter(b => b.status === 'accepted' || b.status === 'pending').length;
  const totalEarnings = bookings
    .filter(b => b.status === 'accepted')
    .reduce((sum, b) => sum + b.total, 0);
  const avgRating =
    properties.length > 0
      ? properties.reduce((sum, p) => sum + p.rating, 0) / properties.length
      : 0;

  const cards = [
    {
      label: 'Total properties',
      value: totalProperties.toString(),
      icon: <Home size={20} />,
      accent: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Active bookings',
      value: activeBookings.toString(),
      icon: <CalendarIcon size={20} />,
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Total earnings',
      value: `$${totalEarnings.toLocaleString()}`,
      icon: <DollarSign size={20} />,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Average rating',
      value: avgRating ? avgRating.toFixed(2) : '–',
      icon: <Star size={20} className="text-amber-400" />,
      accent: 'from-violet-500 to-fuchsia-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <Card key={card.label} className="border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-gray-500">{card.label}</CardTitle>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-white`}>
              {card.icon}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-gray-900">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ───────────────── Property Form ─────────────────

interface HostPropertyFormProps {
  initial?: HostProperty | null;
  onSave: (property: Omit<HostProperty, 'id' | 'rating'> & { id?: string }) => void;
  onCancel: () => void;
}

function HostPropertyForm({ initial, onSave, onCancel }: HostPropertyFormProps) {
  const [form, setForm] = useState(() => ({
    id: initial?.id,
    name: initial?.name || '',
    type: (initial?.type || 'Apartment') as PropertyType,
    city: initial?.city || '',
    address: initial?.address || '',
    description: initial?.description || '',
    pricePerNight: initial?.pricePerNight?.toString() || '',
    rooms: initial?.rooms?.toString() || '',
    maxGuests: initial?.maxGuests?.toString() || '',
    amenities: initial?.amenities || '',
    images: initial?.images.join(', ') || '',
  }));

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.pricePerNight) return;

    const images =
      form.images
        .split(',')
        .map(s => s.trim())
        .filter(Boolean) || [];

    onSave({
      id: form.id,
      name: form.name,
      type: form.type,
      city: form.city,
      address: form.address,
      description: form.description,
      pricePerNight: Number(form.pricePerNight) || 0,
      rooms: Number(form.rooms) || 1,
      maxGuests: Number(form.maxGuests) || 1,
      amenities: form.amenities,
      images,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Property name</label>
          <Input
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="Ocean View Apartment"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Property type</label>
          <Select
            value={form.type}
            onValueChange={value => handleChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hotel">Hotel</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="House">House</SelectItem>
              <SelectItem value="Villa">Villa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Destination / City</label>
          <Input
            value={form.city}
            onChange={e => handleChange('city', e.target.value)}
            placeholder="Santorini, Greece"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Address</label>
          <Input
            value={form.address}
            onChange={e => handleChange('address', e.target.value)}
            placeholder="123 Caldera Street"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          placeholder="Describe your property, view, and unique features..."
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Price per night</label>
          <Input
            type="number"
            min={0}
            value={form.pricePerNight}
            onChange={e => handleChange('pricePerNight', e.target.value)}
            placeholder="200"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Rooms</label>
          <Input
            type="number"
            min={1}
            value={form.rooms}
            onChange={e => handleChange('rooms', e.target.value)}
            placeholder="2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Max guests</label>
          <Input
            type="number"
            min={1}
            value={form.maxGuests}
            onChange={e => handleChange('maxGuests', e.target.value)}
            placeholder="4"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Amenities</label>
        <Input
          value={form.amenities}
          onChange={e => handleChange('amenities', e.target.value)}
          placeholder="WiFi, Pool, Breakfast..."
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Image URLs (comma separated)</label>
        <Input
          value={form.images}
          onChange={e => handleChange('images', e.target.value)}
          placeholder="https://..., https://..."
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initial ? 'Save changes' : 'Add property'}
        </Button>
      </div>
    </form>
  );
}

// ───────────────── Property Card & Manager ─────────────────

interface HostPropertyCardProps {
  property: HostProperty;
  onEdit: () => void;
  onDelete: () => void;
}

function HostPropertyCard({ property, onEdit, onDelete }: HostPropertyCardProps) {
  const cover = property.images[0] || '/images/_site/hero-hotels.jpg';

  return (
    <Card className="border-gray-100 shadow-sm overflow-hidden">
      <div className="h-40 w-full overflow-hidden">
        <ProgressiveImage
          src={cover}
          alt={property.name}
          wrapperClassName="w-full h-full"
        />
      </div>
      <CardContent className="px-4 py-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 inline-flex items-center gap-1">
              <Home size={12} /> {property.type}
            </div>
            <h3 className="mt-2 font-semibold text-gray-900 text-sm line-clamp-2">{property.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={11} /> {property.city}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-black text-gray-900">${property.pricePerNight}</div>
            <div className="text-[11px] text-gray-400">per night</div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-gray-500">
            {property.rooms} rooms · up to {property.maxGuests} guests
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            {property.rating.toFixed(1)}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-1 text-xs" onClick={onEdit}>
            <Edit2 size={12} /> Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-1 text-xs text-red-600 border-red-100 hover:bg-red-50" onClick={onDelete}>
            <Trash2 size={12} /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface HostPropertyManagerProps {
  properties: HostProperty[];
  setProperties: React.Dispatch<React.SetStateAction<HostProperty[]>>;
}

function HostPropertyManager({ properties, setProperties }: HostPropertyManagerProps) {
  const [editing, setEditing] = useState<HostProperty | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data: Omit<HostProperty, 'id' | 'rating'> & { id?: string }) => {
    if (data.id) {
      setProperties(prev =>
        prev.map(p =>
          p.id === data.id
            ? { ...p, ...data }
            : p,
        ),
      );
    } else {
      const newProperty: HostProperty = {
        ...(data as HostProperty),
        id: `prop-${Date.now()}`,
        rating: 4.8,
      };
      setProperties(prev => [newProperty, ...prev]);
    }
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Your properties</h2>
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={14} /> Add property
        </Button>
      </div>

      {showForm && (
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">
              {editing ? 'Edit property' : 'Add new property'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <HostPropertyForm
              initial={editing}
              onSave={handleSave}
              onCancel={() => {
                setEditing(null);
                setShowForm(false);
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map(p => (
          <HostPropertyCard
            key={p.id}
            property={p}
            onEdit={() => {
              setEditing(p);
              setShowForm(true);
            }}
            onDelete={() => handleDelete(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ───────────────── Bookings, Calendar, Earnings ─────────────────

interface HostBookingsTableProps {
  bookings: HostBooking[];
  onUpdateStatus: (id: string, status: BookingStatus) => void;
}

function HostBookingsTable({ bookings, onUpdateStatus }: HostBookingsTableProps) {
  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold text-gray-900">Incoming bookings</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Guest</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map(b => (
              <TableRow key={b.id}>
                <TableCell className="px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-semibold flex items-center justify-center">
                      {b.guestName[0]}
                    </div>
                    <span className="text-sm text-gray-900">{b.guestName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-700">{b.propertyName}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {b.checkIn} → {b.checkOut}
                </TableCell>
                <TableCell className="text-sm font-semibold text-gray-900">
                  ${b.total.toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                    b.status === 'accepted'
                      ? 'bg-green-100 text-green-700'
                      : b.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {b.status === 'accepted' && <CheckCircle2 size={12} />}
                    {b.status === 'rejected' && <XCircle size={12} />}
                    {b.status === 'pending' && <ClockIcon />}
                    {b.status}
                  </span>
                </TableCell>
                <TableCell className="px-4 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                      disabled={b.status === 'accepted'}
                      onClick={() => onUpdateStatus(b.id, 'accepted')}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                      disabled={b.status === 'rejected'}
                      onClick={() => onUpdateStatus(b.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ClockIcon() {
  return <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />;
}

interface HostCalendarProps {
  bookings: HostBooking[];
}

function HostCalendar({ bookings }: HostCalendarProps) {
  const bookedRanges = bookings
    .filter(b => b.status === 'accepted')
    .map(b => ({
      from: new Date(b.checkIn),
      to: new Date(b.checkOut),
    }));

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="px-4 pt-4 pb-2 flex items-center justify-between">
        <CardTitle className="text-sm font-semibold text-gray-900">Calendar</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <Calendar
            mode="range"
            selected={bookedRanges[0]}
            numberOfMonths={1}
          />
          <div className="space-y-2 text-sm text-gray-600">
            <div className="font-semibold text-gray-900">Upcoming stays</div>
            {bookings.filter(b => b.status === 'accepted').map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{b.propertyName}</div>
                  <div className="text-xs text-gray-500">
                    {b.checkIn} → {b.checkOut} · {b.nights} nights
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {b.guestName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface HostEarningsChartProps {
  points: EarningsPoint[];
}

function HostEarningsChart({ points }: HostEarningsChartProps) {
  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold text-gray-900">Earnings overview</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, 'Earnings']} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#earningsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ───────────────── Main Page ─────────────────

export default function HostDashboardPage() {
  const { role, translateDynamic } = useApp();

  const [properties, setProperties] = useState<HostProperty[]>([
    {
      id: 'prop-1',
      name: 'Oia Sunset Loft',
      type: 'Apartment',
      city: 'Santorini, Greece',
      address: 'Caldera Street 12',
      description: 'Cliffside apartment with panoramic caldera views and private terrace.',
      pricePerNight: 280,
      rooms: 2,
      maxGuests: 4,
      amenities: 'WiFi, Pool, Breakfast, Air conditioning',
      images: ['/images/_site/hero-hotels.jpg'],
      rating: 4.9,
    },
    {
      id: 'prop-2',
      name: 'Ubud Jungle Villa',
      type: 'Villa',
      city: 'Ubud, Bali',
      address: 'Jungle Road 8',
      description: 'Private pool villa surrounded by rice terraces and tropical forest.',
      pricePerNight: 320,
      rooms: 3,
      maxGuests: 6,
      amenities: 'WiFi, Pool, Spa, Breakfast',
      images: ['/images/_site/hero-rentals.jpg'],
      rating: 4.8,
    },
  ]);

  const [bookings, setBookings] = useState<HostBooking[]>([
    {
      id: 'HB-1001',
      propertyId: 'prop-1',
      propertyName: 'Oia Sunset Loft',
      guestName: 'Emma Thompson',
      checkIn: '2026-04-15',
      checkOut: '2026-04-20',
      nights: 5,
      total: 1400,
      status: 'pending',
    },
    {
      id: 'HB-1002',
      propertyId: 'prop-2',
      propertyName: 'Ubud Jungle Villa',
      guestName: 'Lucas Martin',
      checkIn: '2026-05-01',
      checkOut: '2026-05-06',
      nights: 5,
      total: 1600,
      status: 'accepted',
    },
  ]);

  const earnings: EarningsPoint[] = useMemo(
    () => [
      { month: 'Nov', amount: 3200 },
      { month: 'Dec', amount: 4100 },
      { month: 'Jan', amount: 2900 },
      { month: 'Feb', amount: 3800 },
      { month: 'Mar', amount: 4600 },
    ],
    [],
  );

  const handleUpdateBookingStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, status }
          : b,
      ),
    );
  }, []);

  if (role !== 'host') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{translateDynamic('Access Restricted')}</h2>
          <p className="text-gray-500">
            {translateDynamic('Switch to Host role in the navbar to access the Host Dashboard.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Host Dashboard</h1>
            <p className="text-emerald-100 mt-1 text-sm">
              {translateDynamic('Manage your properties, bookings, and earnings in one place.')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-lime-300 rounded-full animate-pulse" />
            <span className="text-emerald-50 text-xs">
              {translateDynamic('Hosting status')}: {properties.length > 0 ? translateDynamic('Active') : translateDynamic('Getting started')}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <HostStatsCards properties={properties} bookings={bookings} />

        <HostPropertyManager properties={properties} setProperties={setProperties} />

        <div className="grid lg:grid-cols-2 gap-6">
          <HostBookingsTable bookings={bookings} onUpdateStatus={handleUpdateBookingStatus} />
          <HostCalendar bookings={bookings} />
        </div>

        <HostEarningsChart points={earnings} />
      </div>
    </div>
  );
}

