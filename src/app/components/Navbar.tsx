import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Globe, Heart, MessageCircle, Map, Menu, X, ChevronDown, User, Shield, Home } from 'lucide-react';
import { useApp, Language, UserRole } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { language, setLanguage, role, setRole, favorites, t } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: <Home size={16} /> },
    { to: '/destinations', label: t('nav.destinations'), icon: <Map size={16} /> },
    { to: '/hotels', label: t('nav.hotels') },
    { to: '/rentals', label: t('nav.rentals') },
    { to: '/planner', label: t('nav.planner') },
    { to: '/favorites', label: t('nav.favorites'), badge: favorites.length },
    { to: '/chat', label: t('nav.chat'), icon: <MessageCircle size={16} /> },
    { to: '/login', label: t('nav.signin'), icon: <User size={16} /> },
    ...(role === 'admin' ? [{ to: '/admin', label: t('nav.admin'), icon: <Shield size={16} /> }] : []),
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ro', label: 'Română', flag: '🇷🇴' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  const roles: { value: UserRole; label: string; color: string }[] = [
    { value: 'user', label: t('nav.role.user'), color: 'bg-blue-100 text-blue-700' },
    { value: 'host', label: t('nav.role.host'), color: 'bg-green-100 text-green-700' },
    { value: 'admin', label: t('nav.role.admin'), color: 'bg-purple-100 text-purple-700' },
  ];

  const currentRole = roles.find(r => r.value === role)!;
  const currentLang = languages.find(l => l.code === language)!;

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  // When we are on the Home page and the user is at the top, the navbar used to be
  // fully transparent (so you would see the hero background). A glass/solid navbar
  // keeps the menu readable regardless of the background.
  const onHome = location.pathname === '/';
  const darkNav = onHome && !scrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : darkNav
            ? 'bg-black/35 backdrop-blur-md'
            : 'bg-white/95 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
              <span className="text-white text-lg">✈</span>
            </div>
            <div className="hidden sm:block">
              <span className={`font-bold text-lg ${darkNav ? 'text-white' : 'text-gray-900'}`}>Travel</span>
              <span className="font-bold text-lg text-cyan-400">Dreams</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5
                  ${isActive(link.to)
                    ? (darkNav ? 'text-white bg-white/15' : 'text-cyan-500 bg-cyan-50')
                    : scrolled
                      ? 'text-gray-700 hover:text-cyan-500 hover:bg-gray-50'
                      : darkNav
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-gray-700 hover:text-cyan-500 hover:bg-gray-50'
                  }`}
              >
                {link.label}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Role switcher */}
            <div className="relative">
              <button
                onClick={() => { setRoleOpen(!roleOpen); setLangOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${currentRole.color} border-transparent`}
              >
                <User size={14} />
                {currentRole.label}
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {roleOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    {roles.map(r => (
                      <button
                        key={r.value}
                        onClick={() => { setRole(r.value); setRoleOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${role === r.value ? 'bg-gray-50' : ''}`}
                      >
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${r.color}`}>{r.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setRoleOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  scrolled
                    ? 'text-gray-700 hover:bg-gray-100'
                    : darkNav
                      ? 'text-white/90 hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Globe size={14} />
                {currentLang.flag} {currentLang.code.toUpperCase()}
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${language === lang.code ? 'bg-cyan-50 text-cyan-600 font-medium' : 'text-gray-700'}`}
                      >
                        <span>{lang.flag}</span> {lang.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/favorites"
              className={`relative p-2 rounded-full transition-all ${
                scrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : darkNav
                    ? 'text-white/90 hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart size={20} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-gray-700' : darkNav ? 'text-white' : 'text-gray-700'}`}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.to) ? 'bg-cyan-50 text-cyan-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {link.label}
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{link.badge}</span>
                  )}
                </Link>
              ))}
              <div className="pt-2 border-t border-gray-100 flex gap-2 flex-wrap">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${language === lang.code ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {lang.flag} {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap pb-2">
                {roles.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${role === r.value ? 'ring-2 ring-cyan-500' : ''} ${r.color}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {(langOpen || roleOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setLangOpen(false); setRoleOpen(false); }} />
      )}
    </nav>
  );
}
