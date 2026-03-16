import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Globe, Heart, MessageCircle, Map, Menu, X, ChevronDown, User, Shield, Home } from 'lucide-react';
import { useApp, Language, UserRole } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { language, setLanguage, role, setRole, favorites, t, theme } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [activeTabRect, setActiveTabRect] = useState<{ x: number; width: number } | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const updateActiveTab = () => {
      if (navRef.current) {
        const activeLink = navRef.current.querySelector('a[data-active="true"]') as HTMLElement;
        if (activeLink) {
          const rect = activeLink.getBoundingClientRect();
          const navRect = navRef.current.getBoundingClientRect();
          setActiveTabRect({
            x: rect.left - navRect.left,
            width: rect.width,
          });
          return;
        }
      }

      setActiveTabRect(null);
    };

    const rafId = window.requestAnimationFrame(updateActiveTab);
    window.addEventListener('resize', updateActiveTab);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateActiveTab);
    };
  }, [location.pathname, language, role, favorites.length]);

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: <Home size={16} /> },
    { to: '/destinations', label: t('nav.destinations'), icon: <Map size={16} /> },
    { to: '/hotels', label: t('nav.hotels') },
    { to: '/rentals', label: t('nav.rentals') },
    { to: '/planner', label: t('nav.planner') },
    { to: '/favorites', label: t('nav.favorites'), badge: favorites.length },
    { to: '/chat', label: t('nav.chat'), icon: <MessageCircle size={16} /> },
    { to: '/login', label: t('nav.signin'), icon: <User size={16} /> },
    ...(role === 'host' ? [{ to: '/host-dashboard', label: t('nav.role.host'), icon: <Shield size={16} /> }] : []),
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

  // Get gradient based on theme for smooth transitions
  const getBubbleGradient = () => {
    if (theme === 'dark') {
      return 'linear-gradient(to right, rgb(6, 182, 212), rgb(14, 165, 233))';
    }
    return 'linear-gradient(to right, rgb(34, 211, 238), rgb(76, 195, 255))';
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
          ? theme === 'dark'
            ? 'bg-slate-900/95 backdrop-blur-md shadow-lg'
            : 'bg-white/95 backdrop-blur-md shadow-lg'
          : darkNav
            ? 'bg-black/35 backdrop-blur-md'
            : theme === 'dark'
              ? 'bg-slate-900/90 backdrop-blur-md shadow-sm'
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
              <span className={`font-bold text-lg ${darkNav ? 'text-white' : theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>Travel</span>
              <span className="font-bold text-lg text-cyan-400">Dreams</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 relative" ref={navRef}>
            {/* Morphing background */}
            {activeTabRect && (
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 h-10 rounded-lg pointer-events-none shadow-2xl z-0"
                layoutId="morphBackground"
                initial={false}
                animate={{
                  x: activeTabRect.x,
                  width: activeTabRect.width,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30,
                }}
                style={{
                  backgroundImage: getBubbleGradient(),
                  transition: 'background-image 0.5s ease-in-out',
                }}
              />
            )}
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                data-active={isActive(link.to)}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 z-10
                  ${isActive(link.to)
                    ? (darkNav ? 'text-white font-semibold' : 'text-white font-semibold')
                    : scrolled
                      ? theme === 'dark'
                        ? 'text-slate-300 hover:text-slate-100'
                        : 'text-gray-700 hover:text-gray-900'
                      : darkNav
                        ? 'text-white/90 hover:text-white'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:text-slate-100'
                          : 'text-gray-700 hover:text-gray-900'
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
                    className={`absolute right-0 top-full mt-2 w-40 rounded-xl shadow-xl border overflow-hidden z-50 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                  >
                    {roles.map(r => (
                      <button
                        key={r.value}
                        onClick={() => {
                          setRole(r.value);
                          setRoleOpen(false);
                          if (r.value === 'host') navigate('/host-dashboard');
                          else if (r.value === 'admin') navigate('/admin');
                          else navigate('/');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${theme === 'dark' ? `hover:bg-slate-700 ${role === r.value ? 'bg-slate-700' : ''}` : `hover:bg-gray-50 ${role === r.value ? 'bg-gray-50' : ''}`}`}
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
                    ? theme === 'dark'
                      ? 'text-slate-300 hover:bg-slate-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    : darkNav
                      ? 'text-white/90 hover:bg-white/10'
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-700'
                        : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Globe size={14} />
                <span className="text-lg">{currentLang.flag}</span>
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`absolute right-0 top-full mt-2 w-36 rounded-xl shadow-xl border overflow-hidden z-50 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                  >
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${theme === 'dark' ? `hover:bg-slate-700 ${language === lang.code ? 'bg-cyan-600/30 text-cyan-400 font-medium' : 'text-slate-300'}` : `hover:bg-gray-50 ${language === lang.code ? 'bg-cyan-50 text-cyan-600 font-medium' : 'text-gray-700'}`}`}
                      >
                        <span className="text-lg">{lang.flag}</span> 
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? theme === 'dark' ? 'text-slate-300' : 'text-gray-700' : darkNav ? 'text-white' : theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}
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
            className={`lg:hidden backdrop-blur-md border-t ${theme === 'dark' ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-100'}`}
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? `${isActive(link.to) ? 'bg-cyan-600/30 text-cyan-400' : 'text-slate-300 hover:bg-slate-700'}` : `${isActive(link.to) ? 'bg-cyan-50 text-cyan-600' : 'text-gray-700 hover:bg-gray-50'}`}`}
                >
                  {link.label}
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{link.badge}</span>
                  )}
                </Link>
              ))}
              <div className={`pt-2 border-t flex gap-2 flex-wrap ${theme === 'dark' ? 'border-slate-700' : 'border-gray-100'}`}>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${theme === 'dark' ? `${language === lang.code ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'}` : `${language === lang.code ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600'}`}`}
                  >
                    {lang.flag} {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap pb-2">
                {roles.map(r => (
                  <button
                    key={r.value}
                    onClick={() => {
                      setRole(r.value);
                      if (r.value === 'host') navigate('/host-dashboard');
                      else if (r.value === 'admin') navigate('/admin');
                      else navigate('/');
                    }}
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
