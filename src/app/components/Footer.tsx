import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Footer() {
  const { t, translateDynamic, theme } = useApp();

  return (
    <footer className={`${theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-gray-900 text-gray-300'}`}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-lg">✈</span>
              </div>
              <span className="text-white font-bold text-lg">Travel<span className="text-cyan-400">Dreams</span></span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              {translateDynamic('Your ultimate travel companion for discovering breathtaking destinations, booking luxury stays, and crafting unforgettable journeys.')}
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Instagram size={18} />, href: '#' },
                { icon: <Twitter size={18} />, href: '#' },
                { icon: <Facebook size={18} />, href: '#' },
                { icon: <Youtube size={18} />, href: '#' },
              ].map((s, i) => (
                <a key={i} href={s.href} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-cyan-500 transition-colors text-gray-300 hover:text-white">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold mb-4">{translateDynamic('Explore')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/destinations', label: t('nav.destinations') },
                { to: '/hotels', label: t('nav.hotels') },
                { to: '/rentals', label: t('nav.rentals') },
                { to: '/planner', label: t('nav.planner') },
                { to: '/chat', label: t('nav.chat') },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-cyan-400 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Destinations */}
          <div>
            <h4 className="text-white font-semibold mb-4">{translateDynamic('Top Destinations')}</h4>
            <ul className="space-y-2 text-sm">
              {['Santorini, Greece', 'Bali, Indonesia', 'Paris, France', 'Maldives', 'Tokyo, Japan', 'Dubai, UAE'].map(dest => (
                <li key={dest}>
                  <Link to="/destinations" className="hover:text-cyan-400 transition-colors">{dest}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">{translateDynamic('Contact')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-cyan-400 shrink-0" />
                <span>hello@traveldreams.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-cyan-400 shrink-0" />
                <span>+1 (888) 123-4567</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>123 Explorer Avenue<br />San Francisco, CA 94102</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 TravelDreams. {translateDynamic('All rights reserved.')}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">{translateDynamic('Privacy Policy')}</a>
            <a href="#" className="hover:text-gray-300 transition-colors">{translateDynamic('Terms of Service')}</a>
            <a href="#" className="hover:text-gray-300 transition-colors">{translateDynamic('Cookie Policy')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
