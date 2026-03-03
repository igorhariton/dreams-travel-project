import React, { useState } from 'react';
import { X, Star, CheckCircle, Calendar, Users, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    name: string;
    location: string;
    pricePerNight: number;
    rating: number;
    image: string;
  } | null;
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

export function BookingModal({ isOpen, onClose, item }: BookingModalProps) {
  const { t, translateDynamic, formatPrice, getCurrencySymbol, getPriceWithoutFormat } = useApp();
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [special, setSpecial] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!item) return null;

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 3;

  const multiplier = checkIn ? (PRICE_CALENDAR[checkIn] || 1.0) : 1.0;
  const basePrice = Math.round(item.pricePerNight * multiplier);
  const pricePerNight = getPriceWithoutFormat(basePrice);
  const subtotal = pricePerNight * nights;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;
  
  // Helper to format price with currency
  const formatPriceDisplay = (price: number): string => {
    const symbol = getCurrencySymbol();
    if (t('common.per_night').includes('lei')) {
      // Romanian format: number lei
      return `${price} ${symbol}`;
    } else if (symbol === '₽') {
      // Russian format: number₽
      return `${price}${symbol}`;
    }
    // Default US format: $number
    return `${symbol}${price}`;
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onClose();
      setConfirmed(false);
      setStep(1);
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {confirmed ? (
              <div className="flex flex-col items-center justify-center py-16 px-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('booking.success')}</h2>
                <p className="text-gray-500 text-center">{translateDynamic('Your booking for')} <strong>{item.name}</strong> {translateDynamic('has been confirmed. A confirmation email will be sent shortly.')}</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('booking.title')}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{translateDynamic('Step')} {step} {translateDynamic('of')} 2</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Property preview */}
                <div className="flex gap-4 p-6 bg-gray-50">
                  <img src={item.image} alt={item.name} className="w-24 h-20 object-cover rounded-xl" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.location}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-lg font-bold text-gray-900">{formatPriceDisplay(pricePerNight)}</div>
                    <div className="text-xs text-gray-500">{t('common.per_night')}</div>
                    {multiplier !== 1.0 && (
                      <div className={`text-xs mt-1 font-medium ${multiplier > 1 ? 'text-red-500' : 'text-green-500'}`}>
                        {multiplier > 1 ? `🔥 ${translateDynamic('Peak season')}` : `✨ ${translateDynamic('Off-season deal')}`}
                      </div>
                    )}
                  </div>
                </div>

                {step === 1 && (
                  <div className="p-6 space-y-6">
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                          <Calendar size={14} /> {t('hero.checkin')}
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={e => setCheckIn(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                          <Calendar size={14} /> {t('hero.checkout')}
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={e => setCheckOut(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                        <Users size={14} /> {t('hero.guests')}
                      </label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 font-bold">-</button>
                        <span className="w-8 text-center font-semibold">{guests}</span>
                        <button onClick={() => setGuests(Math.min(12, guests + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 font-bold">+</button>
                        <span className="text-sm text-gray-500">{t('common.guests')}</span>
                      </div>
                    </div>

                    {/* Price summary */}
                    <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{formatPriceDisplay(pricePerNight)} × {nights} {t('common.nights')}</span>
                        <span className="font-medium">{formatPriceDisplay(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{translateDynamic('Taxes & fees (12%)')}</span>
                        <span className="font-medium">{formatPriceDisplay(taxes)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-blue-200">
                        <span>{t('common.total')}</span>
                        <span>{formatPriceDisplay(total)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                    >
                      {translateDynamic('Continue to Details')} →
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('booking.name')}</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={translateDynamic('John Doe')}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('booking.email')}</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={translateDynamic('john@example.com')}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('booking.phone')}</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder={translateDynamic('+1 234 567 8900')}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('booking.special')}</label>
                      <textarea
                        value={special}
                        onChange={e => setSpecial(e.target.value)}
                        placeholder={translateDynamic('Late check-in, dietary requirements...')}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                      />
                    </div>

                    {/* Payment mock */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{translateDynamic('Payment Details')}</span>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder={translateDynamic('Card number: **** **** **** 4242')}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder={translateDynamic('MM / YY')}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                          />
                          <input
                            type="text"
                            placeholder={translateDynamic('CVC')}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                      >
                        ← {t('common.cancel')}
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} /> {t('common.confirm')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
