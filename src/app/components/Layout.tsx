import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="h-full"
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.985,
              clipPath: 'inset(7% 5% 7% 5% round 28px)',
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              clipPath: 'inset(0% 0% 0% 0% round 0px)',
            }}
            exit={{
              opacity: 0,
              y: -16,
              scale: 1.01,
              clipPath: 'inset(6% 4% 6% 4% round 24px)',
            }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
