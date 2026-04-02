import React, { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  const location = useLocation();
  const isFirstLoad = location.key === 'default';
  const isChatRoute = location.pathname.startsWith('/chat');

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
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
