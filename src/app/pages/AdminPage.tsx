import React, { useState } from 'react';
import { Users, Hotel, CalendarCheck, DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, MoreHorizontal, Search, Plus, Edit2, Trash2, Eye, Star, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const revenueData = [
  { month: 'Oct', revenue: 48200, bookings: 142 },
  { month: 'Nov', revenue: 52100, bookings: 168 },
  { month: 'Dec', revenue: 67400, bookings: 210 },
  { month: 'Jan', revenue: 44800, bookings: 135 },
  { month: 'Feb', revenue: 59200, bookings: 178 },
  { month: 'Mar', revenue: 71600, bookings: 224 },
];

const topDestinations = [
  { name: 'Santorini', bookings: 342, revenue: 128400, trend: 'up' },
  { name: 'Bali', bookings: 298, revenue: 65560, trend: 'up' },
  { name: 'Paris', bookings: 256, revenue: 75520, trend: 'down' },
  { name: 'Maldives', bookings: 147, revenue: 124950, trend: 'up' },
  { name: 'Tokyo', bookings: 189, revenue: 33075, trend: 'up' },
];

const recentBookings = [
  { id: '#TRV-1042', guest: 'Emma Thompson', destination: 'Santorini', hotel: 'Oia Sunset Palace', checkIn: '2026-04-15', nights: 5, total: 1900, status: 'confirmed' },
  { id: '#TRV-1041', guest: 'Lucas Martin', destination: 'Bali', hotel: 'Ubud Jungle Resort', checkIn: '2026-04-18', nights: 7, total: 1540, status: 'pending' },
  { id: '#TRV-1040', guest: 'Sofia Andersen', destination: 'Maldives', hotel: 'Overwater Paradise', checkIn: '2026-05-01', nights: 6, total: 5100, status: 'confirmed' },
  { id: '#TRV-1039', guest: 'James Wilson', destination: 'Paris', hotel: 'Le Marais Boutique', checkIn: '2026-04-20', nights: 4, total: 1180, status: 'cancelled' },
  { id: '#TRV-1038', guest: 'Yuki Tanaka', destination: 'Tokyo', hotel: 'Shinjuku Grand', checkIn: '2026-04-22', nights: 8, total: 1400, status: 'confirmed' },
];

const users = [
  { id: 1, name: 'Emma Thompson', email: 'emma@example.com', role: 'user', bookings: 8, spent: 12400, joined: '2024-03-15', status: 'active' },
  { id: 2, name: 'Marco Rossi', email: 'marco@example.com', role: 'host', bookings: 0, spent: 0, joined: '2024-01-20', status: 'active', properties: 3 },
  { id: 3, name: 'Sophie Dubois', email: 'sophie@example.com', role: 'user', bookings: 12, spent: 18700, joined: '2023-11-05', status: 'active' },
  { id: 4, name: 'Kenji Yamamoto', email: 'kenji@example.com', role: 'host', bookings: 0, spent: 0, joined: '2024-02-14', status: 'active', properties: 2 },
  { id: 5, name: 'Ana Ionescu', email: 'ana@example.com', role: 'user', bookings: 3, spent: 4200, joined: '2024-06-01', status: 'inactive' },
];

const statusConfig = {
  confirmed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
  pending: { color: 'bg-amber-100 text-amber-700', icon: <Clock size={12} /> },
  cancelled: { color: 'bg-red-100 text-red-700', icon: <AlertCircle size={12} /> },
};

const roleConfig = {
  user: 'bg-blue-100 text-blue-700',
  host: 'bg-green-100 text-green-700',
  admin: 'bg-purple-100 text-purple-700',
};

export default function AdminPage() {
  const { t, role } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'users' | 'properties'>('overview');
  const [searchUsers, setSearchUsers] = useState('');

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-500">Switch to Admin role to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: t('admin.users'), value: '12,840', change: '+8.2%', up: true, icon: <Users size={22} />, color: 'from-blue-500 to-indigo-600' },
    { label: t('admin.hotels'), value: '284', change: '+12 new', up: true, icon: <Hotel size={22} />, color: 'from-purple-500 to-pink-600' },
    { label: t('admin.bookings'), value: '1,057', change: '+24.1%', up: true, icon: <CalendarCheck size={22} />, color: 'from-emerald-500 to-teal-600' },
    { label: t('admin.revenue'), value: '$343,300', change: '+18.7%', up: true, icon: <DollarSign size={22} />, color: 'from-amber-500 to-orange-600' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'users', label: 'Users' },
    { id: 'properties', label: 'Properties' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white">{t('admin.title')}</h1>
              <p className="text-gray-400 mt-1">Platform overview and management</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-300 text-sm">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>{s.icon}</div>
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${s.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {s.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {s.change}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-900">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-5">Monthly Revenue</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-5">Monthly Bookings</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => [v, 'Bookings']} />
                    <Bar dataKey="bookings" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Destinations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-5">Top Performing Destinations</h3>
              <div className="space-y-3">
                {topDestinations.map((dest, i) => (
                  <div key={dest.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full text-white text-sm font-bold flex items-center justify-center">{i + 1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{dest.name}</div>
                      <div className="text-xs text-gray-400">{dest.bookings} bookings</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${dest.revenue.toLocaleString()}</div>
                      <div className={`flex items-center gap-1 text-xs justify-end ${dest.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {dest.trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {dest.trend === 'up' ? 'Trending ↑' : 'Declining ↓'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">All Bookings</h2>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                <Plus size={15} /> New Booking
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-80">
                  <Search size={15} className="text-gray-400" />
                  <input type="text" placeholder="Search bookings..." className="bg-transparent outline-none text-sm text-gray-700 w-full" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">Booking ID</th>
                      <th className="text-left px-5 py-3">Guest</th>
                      <th className="text-left px-5 py-3">Destination</th>
                      <th className="text-left px-5 py-3">Check-In</th>
                      <th className="text-left px-5 py-3">Nights</th>
                      <th className="text-left px-5 py-3">Total</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentBookings.map(booking => {
                      const sc = statusConfig[booking.status as keyof typeof statusConfig];
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 text-sm font-mono font-medium text-blue-600">{booking.id}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full text-white text-xs font-bold flex items-center justify-center">{booking.guest[0]}</div>
                              <span className="text-sm font-medium text-gray-900">{booking.guest}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">{booking.destination}</td>
                          <td className="px-5 py-4 text-sm text-gray-600">{booking.checkIn}</td>
                          <td className="px-5 py-4 text-sm text-gray-600">{booking.nights}</td>
                          <td className="px-5 py-4 text-sm font-bold text-gray-900">${booking.total.toLocaleString()}</td>
                          <td className="px-5 py-4">
                            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${sc.color}`}>
                              {sc.icon} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"><Eye size={14} /></button>
                              <button className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"><Edit2 size={14} /></button>
                              <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                <Plus size={15} /> Add User
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-80">
                  <Search size={15} className="text-gray-400" />
                  <input type="text" placeholder="Search users..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)}
                    className="bg-transparent outline-none text-sm text-gray-700 w-full" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">User</th>
                      <th className="text-left px-5 py-3">Role</th>
                      <th className="text-left px-5 py-3">Bookings</th>
                      <th className="text-left px-5 py-3">Total Spent</th>
                      <th className="text-left px-5 py-3">Joined</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.filter(u => u.name.toLowerCase().includes(searchUsers.toLowerCase()) || u.email.toLowerCase().includes(searchUsers.toLowerCase())).map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full text-white text-sm font-bold flex items-center justify-center">{user.name[0]}</div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleConfig[user.role as keyof typeof roleConfig]}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            {user.role === 'host' && user.properties && ` (${user.properties} props)`}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{user.bookings}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">${user.spent.toLocaleString()}</td>
                        <td className="px-5 py-4 text-sm text-gray-400">{user.joined}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {user.status === 'active' ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"><Eye size={14} /></button>
                            <button className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"><Edit2 size={14} /></button>
                            <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Properties */}
        {activeTab === 'properties' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Properties & Hotels</h2>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                <Plus size={15} /> Add Property
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { name: 'Oia Sunset Palace', location: 'Santorini', type: 'Hotel', status: 'active', bookings: 42, revenue: 31920, rating: 4.9 },
                { name: 'Caldera View Cave Suite', location: 'Santorini', type: 'Rental', status: 'active', bookings: 28, revenue: 7840, rating: 4.9 },
                { name: 'Ubud Jungle Resort', location: 'Bali', type: 'Hotel', status: 'active', bookings: 56, revenue: 12320, rating: 4.8 },
                { name: 'Tuscan Hilltop Villa', location: 'Tuscany', type: 'Rental', status: 'maintenance', bookings: 18, revenue: 8100, rating: 4.8 },
                { name: 'Overwater Paradise Resort', location: 'Maldives', type: 'Hotel', status: 'active', bookings: 24, revenue: 20400, rating: 4.95 },
                { name: 'Le Marais Boutique', location: 'Paris', type: 'Hotel', status: 'active', bookings: 38, revenue: 11210, rating: 4.7 },
              ].map((prop, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${prop.type === 'Hotel' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{prop.type}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${prop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {prop.status === 'active' ? '● Active' : '⚠ Maintenance'}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{prop.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-3"><MapPin size={10} />{prop.location}</p>
                  <div className="grid grid-cols-3 gap-3 text-center py-3 border-y border-gray-100">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{prop.bookings}</div>
                      <div className="text-xs text-gray-400">Bookings</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">${(prop.revenue / 1000).toFixed(1)}k</div>
                      <div className="text-xs text-gray-400">Revenue</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm flex items-center justify-center gap-0.5"><Star size={11} className="text-amber-400 fill-amber-400" />{prop.rating}</div>
                      <div className="text-xs text-gray-400">Rating</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"><Edit2 size={12} /> Edit</button>
                    <button className="flex-1 py-2 bg-blue-50 rounded-xl text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"><Eye size={12} /> View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}