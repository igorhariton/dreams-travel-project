import React, { useId } from 'react';

interface BrandIconProps {
  className?: string;
}

export function BrandIcon({ className = 'h-10 w-10' }: BrandIconProps) {
  const id = useId().replace(/:/g, '');
  const backgroundId = `brand-bg-${id}`;
  const seaId = `brand-sea-${id}`;
  const islandId = `brand-island-${id}`;
  const waveId = `brand-wave-${id}`;
  const glowId = `brand-glow-${id}`;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="TravelDreams"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={backgroundId} x1="8" y1="9" x2="57" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3F2D9B" />
          <stop offset="0.34" stopColor="#D94C91" />
          <stop offset="0.63" stopColor="#FF8A5B" />
          <stop offset="0.86" stopColor="#FFD98A" />
          <stop offset="1" stopColor="#EEF7FF" />
        </linearGradient>
        <linearGradient id={seaId} x1="21" y1="43" x2="61" y2="61" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset="0.47" stopColor="#07A9D6" />
          <stop offset="1" stopColor="#0B62A7" />
        </linearGradient>
        <linearGradient id={islandId} x1="7" y1="54" x2="35" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#073B78" />
          <stop offset="0.6" stopColor="#063E82" />
          <stop offset="1" stopColor="#0A5BA7" />
        </linearGradient>
        <linearGradient id={waveId} x1="19" y1="43" x2="48" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.66" stopColor="#F8FFFF" />
          <stop offset="1" stopColor="#D9F7FF" />
        </linearGradient>
        <filter id={glowId} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.2" />
        </filter>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="14" fill={`url(#${backgroundId})`} filter={`url(#${glowId})`} />
      <circle cx="43.4" cy="36.4" r="5.6" fill="#FFFDF8" opacity="0.96" />

      <path
        d="M17 42.3C19.4 26.7 33.7 17.1 48 20.2C56.2 22 61 28.3 59.4 37"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.1"
        strokeLinecap="round"
        opacity="0.96"
      />

      <path
        d="M4 49.1C9.8 43.5 16.6 38.4 25.5 36.4C31.5 35 38.6 36.1 45.2 38.5C36.3 38.9 27.1 39.7 19.2 43.3C12.4 46.4 7.8 51.5 5.7 58.2C4.6 55.7 4 52.7 4 49.1Z"
        fill={`url(#${islandId})`}
      />
      <path
        d="M27.6 41.6C37.4 40.8 47.5 40 60 35.9V46C55 49.2 49.8 50.4 43.3 50.2C50.4 52.2 53.9 55.2 54.6 60H16.3C19.3 50.9 22.9 44.4 27.6 41.6Z"
        fill={`url(#${seaId})`}
      />
      <path
        d="M25 42C32.4 39.9 41.1 40.1 50.4 39.3C41.5 41.3 32 41.9 27 45.5C22.6 48.8 23.3 53.2 31.5 54C23.7 56.1 14.5 52.7 14.3 47.9C14.2 45.5 18.1 43.9 25 42Z"
        fill={`url(#${waveId})`}
      />
      <path
        d="M26.5 44.9C33 42.9 41.3 42.5 52.3 40.8C42.8 43.3 32.7 43.5 28.1 47.1C25.5 49.2 27 51.6 33.1 52.1C40.3 52.7 47.6 53.5 51.6 60H46.3C42.5 56.9 38.4 56.6 31.8 56.5C23.9 56.4 19.8 53.1 21.9 49.1C22.7 47.6 24.3 46.2 26.5 44.9Z"
        fill="#FFFFFF"
      />

      <path
        d="M24.2 38.8C27.1 31.2 30.9 25 35.8 20.3C33.4 23.6 30.8 29.5 28.9 36.2C27.4 41.2 24.7 43.7 20.5 44.6C20.8 42.6 22 40.8 24.2 38.8Z"
        fill="#083F83"
      />
      <path d="M34.7 22.9C30.3 18.8 24.3 18.2 20 22.7C25 21 29.3 21.9 34.7 22.9Z" fill="#083F83" />
      <path d="M35.5 22.2C35 15.9 31.6 12.5 26.8 12.7C30.1 15.5 32.4 18.3 35.5 22.2Z" fill="#083F83" />
      <path d="M36.2 22.4C41.1 18.9 47 19 51.4 23.5C46.7 22.2 42.2 22.5 36.2 22.4Z" fill="#083F83" />
      <path d="M35.8 23.2C42 24.8 45.4 28.4 45.5 34.3C42.8 30.4 39.6 27.6 35.8 23.2Z" fill="#083F83" />
      <path d="M35 22.8C29 24.3 25.4 27.7 24.8 33.3C28 29.6 31.1 26.9 35 22.8Z" fill="#083F83" />

      <path d="M46.3 30.8C47.9 29.4 49.9 29.4 51.6 30.9C53 29.6 54.7 29.4 56.2 30.6" stroke="#083F83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
