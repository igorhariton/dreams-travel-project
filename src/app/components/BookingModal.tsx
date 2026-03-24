import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { format, startOfToday } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar, CheckCircle, CreditCard, Star, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ListingDetailsItem } from './ListingDetailsModal';
import { Calendar as BookingCalendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ListingDetailsItem | null;
}

const PRICE_CALENDAR: Record<string, number> = {
  '2026-03-01': 1.2, '2026-03-07': 1.0, '2026-03-14': 0.9, '2026-03-21': 1.1,
  '2026-04-01': 1.3, '2026-04-10': 1.5, '2026-04-15': 1.4, '2026-04-20': 1.2,
  '2026-05-01': 1.1, '2026-05-10': 0.95, '2026-05-20': 1.0,
  '2026-06-01': 1.4, '2026-06-15': 1.6, '2026-06-25': 1.5,
  '2026-07-01': 1.8, '2026-07-15': 2.0, '2026-07-20': 1.9,
  '2026-08-01': 1.9, '2026-08-10': 2.1, '2026-08-20': 1.8,
  '2026-09-01': 1.3, '2026-09-15': 1.1,
};

const DEFAULT_FORM = {
  step: 1 as 1 | 2,
  checkIn: '',
  checkOut: '',
  guests: 2,
  name: '',
  email: '',
  phone: '',
  special: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
  confirmed: false,
};

function toDateValue(value: string) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

function toInputValue(date?: Date) {
  return date ? format(date, 'yyyy-MM-dd') : '';
}

function toDisplayValue(value: string, placeholder: string) {
  const date = toDateValue(value);
  return date ? format(date, 'MMM d, yyyy') : placeholder;
}

export function BookingModal({ isOpen, onClose, item }: BookingModalProps) {
  const { t, translateDynamic, getCurrencySymbol, getPriceWithoutFormat } = useApp();
  const [step, setStep] = useState<1 | 2>(DEFAULT_FORM.step);
  const [checkIn, setCheckIn] = useState(DEFAULT_FORM.checkIn);
  const [checkOut, setCheckOut] = useState(DEFAULT_FORM.checkOut);
  const [guests, setGuests] = useState(DEFAULT_FORM.guests);
  const [name, setName] = useState(DEFAULT_FORM.name);
  const [email, setEmail] = useState(DEFAULT_FORM.email);
  const [phone, setPhone] = useState(DEFAULT_FORM.phone);
  const [special, setSpecial] = useState(DEFAULT_FORM.special);
  const [cardNumber, setCardNumber] = useState(DEFAULT_FORM.cardNumber);
  const [expiry, setExpiry] = useState(DEFAULT_FORM.expiry);
  const [cvc, setCvc] = useState(DEFAULT_FORM.cvc);
  const [confirmed, setConfirmed] = useState(DEFAULT_FORM.confirmed);
  const [openDateField, setOpenDateField] = useState<'checkIn' | 'checkOut' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(DEFAULT_FORM.step);
    setCheckIn(DEFAULT_FORM.checkIn);
    setCheckOut(DEFAULT_FORM.checkOut);
    setGuests(DEFAULT_FORM.guests);
    setName(DEFAULT_FORM.name);
    setEmail(DEFAULT_FORM.email);
    setPhone(DEFAULT_FORM.phone);
    setSpecial(DEFAULT_FORM.special);
    setCardNumber(DEFAULT_FORM.cardNumber);
    setExpiry(DEFAULT_FORM.expiry);
    setCvc(DEFAULT_FORM.cvc);
    setConfirmed(DEFAULT_FORM.confirmed);
    setOpenDateField(null);
  }, [isOpen, item?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverflow = documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.classList.add('modal-open');
    documentElement.classList.add('modal-open');
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.classList.remove('modal-open');
      documentElement.classList.remove('modal-open');
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  const pricing = useMemo(() => {
    if (!item) {
      return { nights: 0, multiplier: 1, pricePerNight: 0, subtotal: 0, taxes: 0, total: 0 };
    }

    const nights = checkIn && checkOut
      ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const multiplier = checkIn ? (PRICE_CALENDAR[checkIn] || 1.0) : 1.0;
    const basePrice = Math.round(item.pricePerNight * multiplier);
    const pricePerNight = getPriceWithoutFormat(basePrice);
    const subtotal = pricePerNight * nights;
    const taxes = Math.round(subtotal * 0.12);
    const total = subtotal + taxes;

    return { nights, multiplier, pricePerNight, subtotal, taxes, total };
  }, [checkIn, checkOut, getPriceWithoutFormat, item]);

  if (!item) return null;

  const formatPriceDisplay = (price: number): string => {
    const symbol = getCurrencySymbol();
    if (t('common.per_night').includes('lei')) return `${price} ${symbol}`;
    if (symbol === '₽') return `${price}${symbol}`;
    return `${symbol}${price}`;
  };

  const isReservationValid = Boolean(checkIn && checkOut && pricing.nights > 0);
  const isPaymentValid = Boolean(name.trim() && email.trim() && cardNumber.trim() && expiry.trim() && cvc.trim());
  const selectedRange: DateRange | undefined = {
    from: toDateValue(checkIn),
    to: toDateValue(checkOut),
  };
  const today = startOfToday();

  const handleConfirm = () => {
    if (!isPaymentValid) return;
    setConfirmed(true);
    window.setTimeout(() => {
      onClose();
      setConfirmed(false);
      setStep(1);
    }, 2200);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    const nextCheckIn = toInputValue(range?.from);
    const nextCheckOut = toInputValue(range?.to);

    setCheckIn(nextCheckIn);
    setCheckOut(nextCheckOut);

    if (range?.from && range?.to) {
      setOpenDateField(null);
    } else if (range?.from && !range?.to) {
      setOpenDateField('checkOut');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <div className="flex h-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="travel-shell relative flex max-h-[min(92vh,920px)] w-full max-w-5xl flex-col overflow-hidden border border-[#D9E2EC] bg-[#FFFFFF] shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-[#111827] dark:shadow-[0_20px_50px_rgba(2,6,23,0.42)]"
            >
              {confirmed ? (
                <div className="booking-modal-scroll flex min-h-[420px] flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-[#f8fafc] to-white px-8 py-16 text-center dark:from-[#111827] dark:to-[#111827]">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-inner dark:bg-emerald-500/15">
                    <CheckCircle size={40} className="text-emerald-600" />
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-950 dark:text-slate-50">{t('booking.success')}</h2>
                  <p className="max-w-md text-slate-600 dark:text-slate-300">
                    {translateDynamic('Your booking for')} <strong className="text-slate-900 dark:text-slate-50">{item.name}</strong> {translateDynamic('has been confirmed. A confirmation email will be sent shortly.')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="shrink-0 border-b border-[#D9E2EC] bg-gradient-to-r from-[#EEF4FA] via-[#F1F5F9] to-[#FFFFFF] px-6 py-5 text-[#0F172A] dark:border-slate-700 dark:from-[#0b1220] dark:via-[#0f172a] dark:to-[#111827] dark:text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold">{step === 1 ? translateDynamic('Reservation Details') : translateDynamic('Payment & Confirmation')}</h2>
                        <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{translateDynamic('Step')} {step} {translateDynamic('of')} 2</p>
                      </div>
                      <button onClick={onClose} className="rounded-full p-2 text-[#64748B] transition-colors hover:bg-[#EEF4FA] hover:text-[#0F172A] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="mt-4 flex gap-4 rounded-[1.25rem] border border-[#D9E2EC] bg-[#EEF4FA] p-4 dark:border-white/10 dark:bg-white/5">
                      <img src={item.images[0]} alt={item.name} className="h-20 w-24 rounded-xl object-cover ring-1 ring-[#D9E2EC] dark:ring-white/10" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-[#0F172A] dark:text-white">{item.name}</h3>
                        <p className="truncate text-sm text-[#475569] dark:text-slate-300">{item.location}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-[#0F172A] dark:text-white">{item.rating}</span>
                        </div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-lg font-bold text-[#0F172A] dark:text-white">{formatPriceDisplay(pricing.pricePerNight || item.pricePerNight)}</div>
                        <div className="text-xs text-[#64748B] dark:text-slate-300">{t('common.per_night')}</div>
                        {pricing.multiplier !== 1.0 && (
                          <div className={`mt-1 text-xs font-medium ${pricing.multiplier > 1 ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                            {pricing.multiplier > 1 ? `Peak season` : `Off-season deal`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="booking-modal-scroll flex-1 overflow-y-auto bg-gradient-to-b from-[#F8FAFC] to-white p-6 dark:from-[#111827] dark:to-[#111827]">
                    {step === 1 && (
                      <div className="w-full space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#475569] dark:text-slate-200">
                              <Calendar size={14} /> {t('hero.checkin')}
                            </label>
                            <Popover
                              open={openDateField === 'checkIn'}
                              onOpenChange={(open) => setOpenDateField(open ? 'checkIn' : null)}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className={`travel-input travel-date-input flex w-full items-center justify-between px-4 py-3 text-left text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50 ${
                                    openDateField === 'checkIn' ? 'border-[#60A5FA] ring-2 ring-[#60A5FA]/20 dark:border-[#3B82F6] dark:ring-[#3B82F6]/25' : ''
                                  }`}
                                >
                                  <span className={checkIn ? 'text-[#0F172A] dark:text-slate-50' : 'text-[#64748B] dark:text-slate-400'}>
                                    {toDisplayValue(checkIn, translateDynamic('Select check-in'))}
                                  </span>
                                  <Calendar size={16} className="text-[#64748B] dark:text-slate-400" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                portalled={false}
                                side="bottom"
                                align="start"
                                sideOffset={8}
                                collisionPadding={20}
                                className="travel-calendar-popover w-[340px] max-w-[calc(100vw-2.5rem)] p-4"
                              >
                                <BookingCalendar
                                  mode="range"
                                  numberOfMonths={1}
                                  selected={selectedRange}
                                  defaultMonth={selectedRange?.from ?? today}
                                  onSelect={handleRangeSelect}
                                  disabled={{ before: today }}
                                  className="w-full rounded-[20px] bg-transparent p-0"
                                />
                                <div className="travel-calendar-footer mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs text-[#64748B] dark:border-[#334155] dark:text-[#94A3B8]">
                                  <span>{translateDynamic('Choose your check-in date')}</span>
                                  {(checkIn || checkOut) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCheckIn('');
                                        setCheckOut('');
                                      }}
                                      className="travel-badge px-3 py-1 font-medium text-[#475569] transition-colors hover:bg-[#EFF6FF] dark:text-[#CBD5E1] dark:hover:bg-[#243144]"
                                    >
                                      {translateDynamic('Clear')}
                                    </button>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#475569] dark:text-slate-200">
                              <Calendar size={14} /> {t('hero.checkout')}
                            </label>
                            <Popover
                              open={openDateField === 'checkOut'}
                              onOpenChange={(open) => setOpenDateField(open ? 'checkOut' : null)}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className={`travel-input travel-date-input flex w-full items-center justify-between px-4 py-3 text-left text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50 ${
                                    openDateField === 'checkOut' ? 'border-[#60A5FA] ring-2 ring-[#60A5FA]/20 dark:border-[#3B82F6] dark:ring-[#3B82F6]/25' : ''
                                  }`}
                                >
                                  <span className={checkOut ? 'text-[#0F172A] dark:text-slate-50' : 'text-[#64748B] dark:text-slate-400'}>
                                    {toDisplayValue(checkOut, translateDynamic('Select check-out'))}
                                  </span>
                                  <Calendar size={16} className="text-[#64748B] dark:text-slate-400" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                portalled={false}
                                side="bottom"
                                align="end"
                                sideOffset={8}
                                collisionPadding={20}
                                className="travel-calendar-popover w-[340px] max-w-[calc(100vw-2.5rem)] p-4"
                              >
                                <BookingCalendar
                                  mode="range"
                                  numberOfMonths={1}
                                  selected={selectedRange}
                                  defaultMonth={selectedRange?.to ?? selectedRange?.from ?? today}
                                  onSelect={handleRangeSelect}
                                  disabled={{ before: today }}
                                  className="w-full rounded-[20px] bg-transparent p-0"
                                />
                                <div className="travel-calendar-footer mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs text-[#64748B] dark:border-[#334155] dark:text-[#94A3B8]">
                                  <span>{translateDynamic('Choose your check-out date')}</span>
                                  {(checkIn || checkOut) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCheckIn('');
                                        setCheckOut('');
                                      }}
                                      className="travel-badge px-3 py-1 font-medium text-[#475569] transition-colors hover:bg-[#EFF6FF] dark:text-[#CBD5E1] dark:hover:bg-[#243144]"
                                    >
                                      {translateDynamic('Clear')}
                                    </button>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#475569] dark:text-slate-200">
                            <Users size={14} /> {t('hero.guests')}
                          </label>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-100 dark:hover:bg-[#243144]">-</button>
                            <span className="w-8 text-center font-semibold text-slate-900 dark:text-slate-50">{guests}</span>
                            <button onClick={() => setGuests(Math.min(item.maxGuests || 12, guests + 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-100 dark:hover:bg-[#243144]">+</button>
                            <span className="text-sm text-[#64748B] dark:text-slate-400">{t('common.guests')}</span>
                          </div>
                        </div>

                        <div className="travel-summary-box border border-[#D9E2EC] bg-[#F1F5F9] p-4 dark:border-slate-700 dark:bg-[#1f2937]">
                          {isReservationValid ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-[#475569] dark:text-slate-300">{formatPriceDisplay(pricing.pricePerNight)} × {pricing.nights} {t('common.nights')}</span>
                                <span className="font-medium text-[#0F172A] dark:text-slate-50">{formatPriceDisplay(pricing.subtotal)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-[#475569] dark:text-slate-300">{translateDynamic('Taxes & fees (12%)')}</span>
                                <span className="font-medium text-[#0F172A] dark:text-slate-50">{formatPriceDisplay(pricing.taxes)}</span>
                              </div>
                              <div className="flex justify-between border-t border-[#E5E7EB] pt-2 font-bold text-[#0F172A] dark:border-slate-700 dark:text-slate-50">
                                <span>{t('common.total')}</span>
                                <span>{formatPriceDisplay(pricing.total)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-[#64748B] dark:text-slate-300">{translateDynamic('Select valid check-in and check-out dates to continue to payment.')}</p>
                          )}
                        </div>

                        <button
                          onClick={() => setStep(2)}
                          disabled={!isReservationValid}
                          className="travel-primary-button w-full py-3 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {translateDynamic('Continue to Payment')} →
                        </button>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-4">
                          <div className="travel-panel border border-[#D9E2EC] bg-[#F1F5F9] p-5 dark:border-slate-700 dark:bg-[#1f2937]">
                            <div className="mb-3 flex items-center gap-2">
                              <CreditCard size={16} className="text-[#475569] dark:text-slate-300" />
                              <span className="text-sm font-medium text-[#475569] dark:text-slate-200">{translateDynamic('Payment method')}</span>
                            </div>
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder={translateDynamic('Card number: **** **** **** 4242')}
                                className="travel-input w-full px-3 py-3 text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={expiry}
                                  onChange={(e) => setExpiry(e.target.value)}
                                  placeholder={translateDynamic('MM / YY')}
                                  className="travel-input w-full px-3 py-3 text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50"
                                />
                                <input
                                  type="text"
                                  value={cvc}
                                  onChange={(e) => setCvc(e.target.value)}
                                  placeholder={translateDynamic('CVC')}
                                  className="travel-input w-full px-3 py-3 text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#475569] dark:text-slate-200">{t('booking.name')}</label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={translateDynamic('John Doe')}
                              className="travel-input w-full px-3 py-3 text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#475569] dark:text-slate-200">{t('booking.email')}</label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={translateDynamic('john@example.com')}
                              className="travel-input w-full px-3 py-3 text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#475569] dark:text-slate-200">{t('booking.phone')}</label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder={translateDynamic('+1 234 567 8900')}
                              className="travel-input w-full px-3 py-3 text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#475569] dark:text-slate-200">{t('booking.special')}</label>
                            <textarea
                              value={special}
                              onChange={(e) => setSpecial(e.target.value)}
                              placeholder={translateDynamic('Late check-in, dietary requirements...')}
                              rows={4}
                              className="travel-input w-full resize-none px-3 py-3 text-sm focus:outline-none dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-50"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="travel-panel border border-[#D9E2EC] bg-[#F1F5F9] p-5 dark:border-slate-700 dark:bg-[#1f2937]">
                            <h3 className="text-base font-semibold text-[#0F172A] dark:text-slate-50">{translateDynamic('Booking summary')}</h3>
                            <div className="mt-4 space-y-3">
                              <div className="flex justify-between text-sm text-[#475569] dark:text-slate-300">
                                <span>{translateDynamic('Stay')}</span>
                                <span className="max-w-[220px] text-right font-medium text-[#0F172A] dark:text-slate-50">{item.name}</span>
                              </div>
                              <div className="flex justify-between text-sm text-[#475569] dark:text-slate-300">
                                <span>{translateDynamic('Dates')}</span>
                                <span className="font-medium text-[#0F172A] dark:text-slate-50">
                                  {checkIn && checkOut ? `${toDisplayValue(checkIn, '')} - ${toDisplayValue(checkOut, '')}` : '--'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm text-[#475569] dark:text-slate-300">
                                <span>{translateDynamic('Guests')}</span>
                                <span className="font-medium text-[#0F172A] dark:text-slate-50">{guests}</span>
                              </div>
                              <div className="flex justify-between text-sm text-[#475569] dark:text-slate-300">
                                <span>{translateDynamic('Nightly rate')}</span>
                                <span className="font-medium text-[#0F172A] dark:text-slate-50">{formatPriceDisplay(pricing.pricePerNight || item.pricePerNight)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="travel-summary-box border border-[#D9E2EC] bg-[#DCFCE7] p-5 dark:border-slate-700 dark:bg-[#243144]">
                            <div className="flex justify-between text-sm text-[#166534] dark:text-slate-300">
                              <span>{translateDynamic('Reservation total')}</span>
                              <span className="font-semibold text-[#166534] dark:text-slate-50">{formatPriceDisplay(pricing.total)}</span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => setStep(1)}
                              className="travel-secondary-button flex-1 py-3 font-medium transition-colors dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-200 dark:hover:bg-[#243144]"
                            >
                              ← {translateDynamic('Back to Reservation')}
                            </button>
                            <button
                              onClick={handleConfirm}
                              disabled={!isPaymentValid}
                              className="travel-primary-button flex flex-1 items-center justify-center gap-2 py-3 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle size={16} /> {t('common.confirm')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
