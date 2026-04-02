import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts';
import { useApp } from '../context';

const HomePage = lazy(() => import('../pages/HomePage'));
const DestinationsPage = lazy(() => import('../pages/DestinationsPage'));
const HotelsPage = lazy(() => import('../pages/HotelsPage'));
const RentalsPage = lazy(() => import('../pages/RentalsPage'));
const PlannerPage = lazy(() => import('../pages/PlannerPage'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const HostDashboardPage = lazy(() => import('../pages/HostDashboardPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));

// Only prefetch a small set of common routes on fast connections.
function prefetchAllPages() {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  const shouldPrefetch = !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType || '');
  if (!shouldPrefetch) return;

  const pages = [
    () => import('../pages/DestinationsPage'),
    () => import('../pages/HotelsPage'),
    () => import('../pages/RentalsPage'),
  ];

  if ('requestIdleCallback' in window) {
    let i = 0;
    const loadNext = () => {
      if (i >= pages.length) return;
      pages[i++]();
      requestIdleCallback(loadNext);
    };
    setTimeout(() => requestIdleCallback(loadNext), 2500);
  } else {
    pages.forEach((load, i) => setTimeout(load, 2500 + i * 500));
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
  const { translateDynamic } = useApp();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center animate-pulse">
          <span className="text-white text-xl">✈</span>
        </div>
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
    Component: AppLayout,
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
