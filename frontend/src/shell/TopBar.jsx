import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import NotificationBell from '../components/NotificationBell';
import { homeFor } from '../nav/navConfig';

function Dropdown({ renderButton, align = 'right', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {renderButton({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div role="menu" onClick={() => setOpen(false)}
          className={`absolute z-50 mt-2 min-w-[11rem] rounded-xl border border-line bg-surface p-1 shadow-overlay ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {children}
        </div>
      )}
    </div>
  );
}

const menuItem = 'block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-page';
const pill = (active) => `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-primary-tint text-primary' : 'text-muted hover:text-ink'}`;

export default function TopBar({ user, primary, more, onLogout }) {
  const { t } = useTranslation();
  const label = (i) => t(i.key, { defaultValue: i.label });
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link to={homeFor(user.role)} className="text-lg font-bold tracking-tight text-primary">Sahaayak</Link>

        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {primary.map((i) => <NavLink key={i.to} to={i.to} className={({ isActive }) => pill(isActive)}>{label(i)}</NavLink>)}
          {more.length > 0 && (
            <Dropdown align="left" renderButton={({ open, toggle }) => (
              <button type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={open} className={pill(open)}>
                {t('navigation.more', { defaultValue: 'More' })} <span aria-hidden="true">▾</span>
              </button>
            )}>
              {more.map((i) => <Link key={i.to} to={i.to} role="menuitem" className={menuItem}>{label(i)}</Link>)}
            </Dropdown>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block"><LanguageSelector variant="compact" showLabel={false} size="small" /></div>
          <NotificationBell />
          <Dropdown renderButton={({ open, toggle }) => (
            <button type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={open} aria-label={user.name}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint font-semibold text-primary">
              {(user.name || '?').charAt(0).toUpperCase()}
            </button>
          )}>
            <Link to="/profile" role="menuitem" className={menuItem}>{t('navigation.profile', { defaultValue: 'Profile' })}</Link>
            <button type="button" role="menuitem" onClick={onLogout} className={menuItem}>{t('navigation.logout', { defaultValue: 'Log out' })}</button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
