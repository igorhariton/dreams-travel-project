import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';

export function ThemeToggle() {
  const { theme, toggleTheme, translateDynamic } = useApp();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-full transition-all duration-300"
      style={{
        backgroundColor: theme === 'light' ? '#f3f4f6' : '#334155',
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={theme === 'light' ? translateDynamic('Switch to dark mode') : translateDynamic('Switch to light mode')}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {theme === 'light' ? (
          <Sun
            size={20}
            className="text-amber-500"
            strokeWidth={2.5}
          />
        ) : (
          <Moon
            size={20}
            className="text-blue-300"
            strokeWidth={2.5}
          />
        )}
      </motion.div>

      {/* Animated background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={false}
        animate={{
          boxShadow: theme === 'light'
            ? '0 0 12px rgba(251, 191, 36, 0.15)'
            : '0 0 12px rgba(96, 165, 250, 0.25)',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
