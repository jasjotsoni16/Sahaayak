import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Icon } from '../ui/icons';

const tab = (active) => `flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? 'text-primary' : 'text-muted'}`;

export default function BottomTabs({ primary, more, onLogout }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [sheet, setSheet] = useState(false);
  const label = (i) => t(i.key, { defaultValue: i.label });
  const moreLabel = t('navigation.more', { defaultValue: 'More' });
  const moreActive = more.some((i) => pathname.startsWith(i.to));

  return (
    <>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="mx-auto flex max-w-lg">
          {primary.map((i) => (
            <li key={i.to} className="flex-1">
              <NavLink to={i.to} className={({ isActive }) => tab(isActive)}><Icon name={i.icon} />{label(i)}</NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" className={tab(moreActive)}>
              <Icon name="more" />{moreLabel}
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={sheet} onClose={() => setSheet(false)} title={moreLabel}>
        <ul>
          {more.map((i) => (
            <li key={i.to}>
              <Link to={i.to} onClick={() => setSheet(false)} className="flex min-h-[48px] items-center gap-3 rounded-lg px-3 text-ink hover:bg-page">
                <Icon name={i.icon} />{label(i)}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <LanguageSelector variant="compact" showLabel={false} size="small" />
          <Button variant="secondary" size="sm" onClick={() => { setSheet(false); onLogout(); }}>
            {t('navigation.logout', { defaultValue: 'Log out' })}
          </Button>
        </div>
      </Modal>
    </>
  );
}
