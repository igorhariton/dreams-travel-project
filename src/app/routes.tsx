import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'));
const HotelsPage = lazy(() => import('./pages/HotelsPage'));
const RentalsPage = lazy(() => import('./pages/RentalsPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LoginPage = lazy(() => import('./pages/LoginPage_TravelDreams_v2'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center animate-pulse">
          <span className="text-white text-xl">✈</span>
        </div>
        <div className="text-gray-400 text-sm">Loading...</div>
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
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        element: <SuspenseWrapper><HomePage /></SuspenseWrapper>,
      },
      {
        path: 'destinations',
        element: <SuspenseWrapper><DestinationsPage /></SuspenseWrapper>,
      },
      {
        path: 'hotels',
        element: <SuspenseWrapper><HotelsPage /></SuspenseWrapper>,
      },
      {
        path: 'rentals',
        element: <SuspenseWrapper><RentalsPage /></SuspenseWrapper>,
      },
      {
        path: 'planner',
        element: <SuspenseWrapper><PlannerPage /></SuspenseWrapper>,
      },
      {
        path: 'favorites',
        element: <SuspenseWrapper><FavoritesPage /></SuspenseWrapper>,
      },
      {
        path: 'chat',
        element: <SuspenseWrapper><ChatPage /></SuspenseWrapper>,
      },
      {
        path: 'admin',
        element: <SuspenseWrapper><AdminPage /></SuspenseWrapper>,
      },
    ],
  },
]);