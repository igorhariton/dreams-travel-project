import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, MapPin, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { BookingItem, BookingStatus } from '../types/booking';
import { formatBookingLabel, resolveBookingLocale } from '../utils/bookingDate';

type BookingFilter = 'all' | BookingStatus;

const statusClassMap: Record<BookingStatus, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
};

function formatBookingPrice(booking: BookingItem, locale: string) {
  const amount = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.max(0, booking.price));
  if (booking.currency === 'lei') return `${amount} ${booking.currency}`;
  if (booking.currency === '₽') return `${amount}${booking.currency}`;
  if (booking.currency.length <= 3) return `${booking.currency}${amount}`;
  return `${amount} ${booking.currency}`;
}

function statusKey(status: BookingStatus) {
  return status === 'confirmed' ? 'my_bookings.status.confirmed' : 'my_bookings.status.pending';
}

function typeKey(type: BookingItem['type']) {
  if (type === 'hotel') return 'my_bookings.type.hotel';
  if (type === 'rental') return 'my_bookings.type.rental';
  return 'my_bookings.type.destination';
}

export default function MyBookingsPage() {
  const { bookings, removeBooking, getBookingStats, language, t, translateDynamic, theme } = useApp();
  const [filter, setFilter] = useState<BookingFilter>('all');
  const isDark = theme === 'dark';

  const locale = resolveBookingLocale(language);
  const stats = getBookingStats();

  const filteredBookings = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter)),
    [bookings, filter],
  );

  const filterCounts = {
    all: bookings.length,
    confirmed: stats.confirmed,
    pending: stats.pending,
  };

  return (
    <div className={`min-h-screen pt-16 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      <div className="relative overflow-hidden px-6 py-10 md:py-12">
        <div className={`absolute inset-0 ${isDark ? 'bg-linear-to-br from-slate-900 via-slate-900 to-cyan-950' : 'bg-linear-to-br from-[#E0F2FE] via-[#EEF4FF] to-[#F8FAFC]'}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_48%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-300">
            <ShoppingBag size={14} />
            {t('my_bookings.badge')}
          </div>
          <h1 className={`mt-4 text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('my_bookings.title')}</h1>
          <p className={`mt-2 max-w-2xl text-sm md:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t('my_bookings.subtitle')}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-14 pt-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#D9E2EC] bg-white'}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('my_bookings.stats.total')}
            </p>
            <p className={`mt-3 text-3xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats.total}</p>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#D9E2EC] bg-white'}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('my_bookings.stats.confirmed')}
            </p>
            <p className="mt-3 text-3xl font-black text-emerald-500">{stats.confirmed}</p>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#D9E2EC] bg-white'}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('my_bookings.stats.pending')}
            </p>
            <p className="mt-3 text-3xl font-black text-amber-500">{stats.pending}</p>
          </div>
        </div>

        {bookings.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-2">
            {(['all', 'confirmed', 'pending'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                  filter === value
                    ? 'border-cyan-500 bg-cyan-500 text-white shadow-md'
                    : isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {value === 'all' ? t('my_bookings.filter.all') : t(statusKey(value))}
                <span className={`rounded-full px-2 py-0.5 text-xs ${filter === value ? 'bg-white/25 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  {filterCounts[value]}
                </span>
              </button>
            ))}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className={`mt-8 rounded-3xl border px-8 py-16 text-center shadow-sm ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#D9E2EC] bg-white'}`}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
              <CalendarClock size={28} />
            </div>
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('my_bookings.empty.title')}</h2>
            <p className={`mx-auto mt-2 max-w-md text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('my_bookings.empty.subtitle')}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/hotels"
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t('my_bookings.empty.explore_hotels')} <ArrowRight size={16} />
              </Link>
              <Link
                to="/rentals"
                className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t('my_bookings.empty.explore_rentals')}
              </Link>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className={`mt-8 rounded-2xl border px-6 py-10 text-center ${isDark ? 'border-slate-800 bg-slate-900/70 text-slate-300' : 'border-[#D9E2EC] bg-white text-slate-600'}`}>
            {t('my_bookings.empty.filtered')}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <AnimatePresence>
              {filteredBookings.map((booking) => (
                <motion.article
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#D9E2EC] bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                    <img
                      src={booking.image}
                      alt={booking.title}
                      className="h-28 w-full rounded-xl object-cover ring-1 ring-black/5 sm:h-24 sm:w-36"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className={`truncate text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{booking.title}</h3>
                          <div className={`mt-1 flex items-center gap-1.5 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            <MapPin size={13} />
                            <span className="truncate">{translateDynamic(booking.location)}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassMap[booking.status]}`}>
                          {booking.status === 'confirmed' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                          {t(statusKey(booking.status))}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                          {t(typeKey(booking.type))}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
                          {formatBookingPrice(booking, locale)}
                        </span>
                      </div>

                      <div className={`mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
                        <div className="flex items-center gap-1.5">
                          <CalendarClock size={14} />
                          <span>{formatBookingLabel(booking.bookedAt, language, { includeTime: true, prefix: t('my_bookings.booked_on') })}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBooking(booking.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            isDark
                              ? 'bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                          }`}
                        >
                          <Trash2 size={13} />
                          {t('my_bookings.cancel')}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
