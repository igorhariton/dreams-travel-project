import React, { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useApp } from '../context/AppContext';

export function Layout() {
  const location = useLocation();
  const isFirstLoad = location.key === 'default';
  const isChatRoute = location.pathname.startsWith('/chat');
  const { apiStatusMessage, clearApiStatusMessage } = useApp();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {apiStatusMessage && (
        <div className="relative z-20 border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-900">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
            <p className="text-sm font-medium">{apiStatusMessage}</p>
            <button
              type="button"
              onClick={clearApiStatusMessage}
              className="rounded-md px-2 py-0.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              aria-label="Dismiss API status"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <main className="flex-1 relative overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="h-full"
            initial={isFirstLoad ? false : { opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isChatRoute && <Footer />}
    </div>
  );
}
