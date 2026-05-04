import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts';
import { useI18n } from '../context';
import { BrandIcon } from './components/BrandIcon';

const HomePage = lazy(() => import('../pages/HomePage'));
const DestinationsPage = lazy(() => import('../pages/DestinationsPage'));
const HotelsPage = lazy(() => import('../pages/HotelsPage'));
const RentalsPage = lazy(() => import('../pages/RentalsPage'));
const PlannerPage = lazy(() => import('../pages/PlannerPage'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const MyBookingsPage = lazy(() => import('../pages/MyBookingsPage'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const HostDashboardPage = lazy(() => import('../pages/HostDashboardPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));

// Only prefetch a small set of common routes on fast connections.
function prefetchAllPages() {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  }).connection;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const cpuThreads = navigator.hardwareConcurrency || 4;
  const shouldPrefetch =
    !connection?.saveData &&
    !['slow-2g', '2g', '3g'].includes(connection?.effectiveType || '') &&
    deviceMemory >= 4 &&
    cpuThreads >= 4;
  if (!shouldPrefetch) return;

  const pages = [
    () => import('../pages/DestinationsPage'),
    () => import('../pages/PlannerPage'),
    () => import('./components/map/TripMap'),
  ];

  if ('requestIdleCallback' in window) {
    let i = 0;
    const loadNext = () => {
      if (i >= pages.length) return;
      pages[i++]();
      requestIdleCallback(loadNext);
    };
    setTimeout(() => requestIdleCallback(loadNext), 4000);
  } else {
    pages.forEach((load, i) => setTimeout(load, 4000 + i * 900));
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    prefetchAllPages();
  } else {
    window.addEventListener('load', prefetchAllPages, { once: true });
  }
}

function PageLoader() {
  const { translateDynamic } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <BrandIcon className="h-12 w-12 animate-pulse" />
        <div className="text-gray-400 text-sm">{translateDynamic('Loading...')}</div>
      </div>
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/register',
    element: (
      <SuspenseWrapper>
        <RegisterPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <HomePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'destinations',
        element: (
          <SuspenseWrapper>
            <DestinationsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'hotels',
        element: (
          <SuspenseWrapper>
            <HotelsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'rentals',
        element: (
          <SuspenseWrapper>
            <RentalsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'planner',
        element: (
          <SuspenseWrapper>
            <PlannerPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'favorites',
        element: (
          <SuspenseWrapper>
            <FavoritesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'my-bookings',
        element: (
          <SuspenseWrapper>
            <MyBookingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'chat',
        element: (
          <SuspenseWrapper>
            <ChatPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin',
        element: (
          <SuspenseWrapper>
            <AdminPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'host-dashboard',
        element: (
          <SuspenseWrapper>
            <HostDashboardPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);

