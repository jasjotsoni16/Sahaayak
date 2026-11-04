import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { navFor } from '../nav/navConfig';
import TopBar from './TopBar';
import BottomTabs from './BottomTabs';

export default function AppShell({ children }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (loading) return <div className="min-h-screen bg-page" />;
  if (!user) return <>{children}</>; // public pages (login, signup) have no chrome

  const { primary, more } = navFor(user.role);
  const handleLogout = () => { logout(); navigate('/login'); };
  const fullBleed = pathname.startsWith('/map');

  return (
    <div className="min-h-screen bg-page pb-20 md:pb-0">
      <TopBar user={user} primary={primary} more={more} onLogout={handleLogout} />
      {fullBleed ? <main>{children}</main> : <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>}
      <BottomTabs primary={primary} more={more} onLogout={handleLogout} />
    </div>
  );
}
