import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bath, BedDouble, Building2, Home, MapPin, ShieldCheck, Star, Users, X } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import { useApp } from '../context/AppContext';

export interface ListingDetailsItem {
  id: string;
  kind: 'hotel' | 'rental';
  name: string;
  location: string;
  images: string[];
  rating: number;
  reviews: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
  typeLabel: string;
  stars?: number;
  host?: string;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
}

interface ListingDetailsModalProps {
  isOpen: boolean;
  item: ListingDetailsItem | null;
  onClose: () => void;
  onReserve: () => void;
}

export function ListingDetailsModal({ isOpen, item, onClose, onReserve }: ListingDetailsModalProps) {
  const { t, translateDynamic, formatPrice } = useApp();

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

  if (!item) return null;

  const detailCards = item.kind === 'hotel'
    ? [
        { icon: <Building2 size={16} />, label: translateDynamic('Property Type'), value: translateDynamic(item.typeLabel) },
        { icon: <Star size={16} />, label: translateDynamic('Star Rating'), value: `${item.stars || 0}★` },
        { icon: <ShieldCheck size={16} />, label: translateDynamic('Guest Reviews'), value: `${item.reviews.toLocaleString()} ${t('common.reviews')}` },
      ]
    : [
        { icon: <BedDouble size={16} />, label: translateDynamic('Bedrooms'), value: `${item.bedrooms || 0}` },
        { icon: <Bath size={16} />, label: translateDynamic('Bathrooms'), value: `${item.bathrooms || 0}` },
        { icon: <Users size={16} />, label: translateDynamic('Max Guests'), value: `${item.maxGuests || 1}` },
      ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[95] overflow-hidden p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <div className="flex h-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              className="travel-shell relative flex max-h-[min(92vh,920px)] w-full max-w-5xl flex-col overflow-hidden border border-[#D9E2EC] bg-[#FFFFFF] shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-[#111827] dark:shadow-[0_20px_50px_rgba(2,6,23,0.42)]"
            >
              <div className="shrink-0 border-b border-[#D9E2EC] bg-gradient-to-r from-[#EEF4FA] via-[#F1F5F9] to-[#FFFFFF] px-6 py-5 text-[#0F172A] dark:border-slate-700 dark:from-[#0b1220] dark:via-[#0f172a] dark:to-[#111827] dark:text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`travel-badge px-3 py-1 text-xs font-semibold ${item.kind === 'hotel' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>
                        {translateDynamic(item.kind === 'hotel' ? 'Hotel' : 'Rental')}
                      </span>
                      <span className="travel-badge bg-[#EEF4FA] px-3 py-1 text-xs font-medium text-[#475569] dark:bg-white/10 dark:text-slate-200">
                        {translateDynamic(item.typeLabel)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-[#0F172A] dark:text-white">{item.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#475569] dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <strong className="text-[#0F172A] dark:text-white">{item.rating}</strong>
                        {`(${item.reviews.toLocaleString()} ${t('common.reviews')})`}
                      </span>
                    </div>
                  </div>
                  <button onClick={onClose} className="rounded-full p-2 text-[#64748B] transition-colors hover:bg-[#EEF4FA] hover:text-[#0F172A] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="app-modal-scroll flex-1 overflow-y-auto bg-gradient-to-b from-[#F8FAFC] to-white px-6 py-6 dark:from-[#111827] dark:to-[#111827]">
                <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
                  <div className="space-y-6">
                    <div className="travel-panel overflow-hidden border border-[#D9E2EC] bg-[#F1F5F9] shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-[#1f2937] dark:shadow-none">
                      <ImageCarousel images={item.images} className="h-[320px] md:h-[420px]" />
                    </div>

                    <section className="travel-panel border border-[#D9E2EC] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-[#1f2937] dark:shadow-none">
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-50">{translateDynamic('About this stay')}</h3>
                      <p className="mt-3 leading-7 text-[#475569] dark:text-slate-300">{translateDynamic(item.description)}</p>
                    </section>

                    <section className="travel-panel border border-[#D9E2EC] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-[#1f2937] dark:shadow-none">
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-50">{translateDynamic('Amenities')}</h3>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {item.amenities.map((amenity) => (
                          <span key={amenity} className="travel-badge bg-[#F1F5F9] px-3 py-2 text-sm font-medium text-[#475569] dark:bg-[#243144] dark:text-slate-200">
                            {translateDynamic(amenity)}
                          </span>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section className="travel-panel border border-[#D9E2EC] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#EEF4FA] p-6 text-[#0F172A] shadow-[0_14px_32px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:from-[#111827] dark:via-[#0f172a] dark:to-[#111827] dark:text-white dark:shadow-none">
                      <p className="text-sm uppercase tracking-[0.18em] text-[#475569] dark:text-cyan-200">{translateDynamic('Reserve this stay')}</p>
                      <div className="mt-3 text-4xl font-black text-[#0F172A] dark:text-white">{formatPrice(item.pricePerNight)}</div>
                      <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{t('common.per_night')}</p>
                      <button
                        onClick={onReserve}
                        className="travel-primary-button mt-6 w-full py-3.5 text-sm font-semibold transition-all"
                      >
                        {translateDynamic('Reserve')}
                      </button>
                      <p className="mt-3 text-xs text-[#64748B] dark:text-slate-400">{translateDynamic('Choose your dates and guests first, then continue to secure payment.')}</p>
                    </section>

                    <section className="travel-panel border border-[#D9E2EC] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-[#1f2937] dark:shadow-none">
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-50">{translateDynamic('Property details')}</h3>
                      <div className="mt-4 space-y-3">
                        {detailCards.map((detail) => (
                          <div key={detail.label} className="travel-panel flex items-center justify-between border border-[#D9E2EC] bg-[#F1F5F9] px-4 py-3 dark:border-slate-700 dark:bg-[#243144]">
                            <span className="flex items-center gap-2 text-sm font-medium text-[#475569] dark:text-slate-300">
                              {detail.icon}
                              {detail.label}
                            </span>
                            <span className="text-sm font-semibold text-[#0F172A] dark:text-slate-50">{detail.value}</span>
                          </div>
                        ))}
                        {item.host && (
                          <div className="travel-panel flex items-center justify-between border border-[#D9E2EC] bg-[#F1F5F9] px-4 py-3 dark:border-slate-700 dark:bg-[#243144]">
                            <span className="flex items-center gap-2 text-sm font-medium text-[#475569] dark:text-slate-300">
                              <Home size={16} />
                              {translateDynamic('Host')}
                            </span>
                            <span className="text-sm font-semibold text-[#0F172A] dark:text-slate-50">{translateDynamic(item.host)}</span>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
