import React from 'react';
import { Icon } from '../../ui/icons';
import { Float } from './Motion';

// Decorative pictures of the product for the home page. Everything here is aria-hidden: the
// real information is in the surrounding text, these only show what the app looks like.

export function ScoreRing({ score = 62, size = 76, stroke = 8, light = false }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={light ? 'rgba(255,255,255,.15)' : '#E3E6EC'} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#scoreGradient)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <defs>
        <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B5BDB" /><stop offset="100%" stopColor="#7C5CFF" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.3} fontWeight="700" fill={light ? '#fff' : '#1D2433'}>{score}</text>
    </svg>
  );
}

// A stylised street map with job pins around "you".
export function MiniMap({ className = '' }) {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden rounded-2xl bg-[#EEF1F8] ${className}`}>
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect x="250" y="20" width="110" height="70" rx="14" fill="#DCEFE3" />
        <rect x="30" y="150" width="90" height="60" rx="14" fill="#DCEFE3" />
        <path d="M-10 120 H410" stroke="#fff" strokeWidth="16" />
        <path d="M150 -10 V250" stroke="#fff" strokeWidth="14" />
        <path d="M-10 40 L410 200" stroke="#fff" strokeWidth="10" />
        <path d="M300 -10 V250" stroke="#fff" strokeWidth="9" />
        <path d="M-10 190 H410" stroke="#fff" strokeWidth="7" />
      </svg>
      {[['24%', '30%'], ['70%', '62%'], ['82%', '24%'], ['40%', '78%']].map(([left, top], i) => (
        <span key={i} className="absolute -translate-x-1/2 -translate-y-full" style={{ left, top }}>
          <svg width="26" height="32" viewBox="0 0 26 32"><path d="M13 31s11-10.2 11-18A11 11 0 0 0 2 13c0 7.8 11 18 11 18z" fill="#3B5BDB" /><circle cx="13" cy="13" r="4.5" fill="#fff" /></svg>
        </span>
      ))}
      <span className="absolute left-[48%] top-[48%] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-primary/25" />
        <span className="relative block h-4 w-4 rounded-full border-[3px] border-white bg-primary shadow" />
      </span>
      <span className="absolute bottom-3 left-3 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink shadow-card">4 jobs within 2 km</span>
    </div>
  );
}

export function SkillArt() {
  return (
    <div aria-hidden="true" className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink">Cooking</span>
        <span className="rounded-full bg-success-tint px-2.5 py-0.5 text-xs font-semibold text-success">✓ Verified</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {['Aadhaar', 'Police check'].map((d) => (
          <div key={d} className="flex items-center gap-2 rounded-xl border border-line px-2.5 py-2 text-xs text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-tint text-primary"><Icon name="document" size={14} /></span>{d}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted"><span>Skill check</span><span className="font-semibold text-ink">9 / 10</span></div>
      <div className="mt-1.5 h-1.5 rounded-full bg-line"><div className="h-1.5 w-[90%] rounded-full bg-gradient-to-r from-primary to-[#7C5CFF]" /></div>
    </div>
  );
}

export function SalaryArt() {
  return (
    <div aria-hidden="true" className="space-y-2">
      <div className="flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5 text-sm shadow-card">
        <span className="text-ink">1 Oct · <b>₹15,000</b></span>
        <span className="rounded-full bg-success-tint px-2.5 py-0.5 text-xs font-semibold text-success">Confirmed</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5 text-sm shadow-card ring-2 ring-primary/20">
        <span className="text-ink">1 Nov · <b>₹15,000</b></span>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">Confirm</span>
      </div>
    </div>
  );
}

// Verified income per month: only confirmed salary counts, so the bars grow as payments are confirmed.
export function IncomeBars() {
  const months = [['Jun', 40], ['Jul', 55], ['Aug', 52], ['Sep', 70], ['Oct', 78], ['Nov', 92]];
  return (
    <div aria-hidden="true" className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-muted">Verified income</p>
        <p className="font-display text-sm font-bold text-ink">₹15,000<span className="font-sans text-xs font-normal text-muted"> / month</span></p>
      </div>
      <div className="mt-3 flex h-28 items-end gap-2">
        {months.map(([m, v], i) => (
          <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div className={`w-full rounded-md ${i === months.length - 1 ? 'bg-gradient-to-t from-primary to-[#7C5CFF]' : 'bg-primary-tint'}`} style={{ height: `${v}%` }} />
            <span className="text-[10px] text-muted">{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// A worker's skills with their verification state.
export function SkillBadges() {
  const skills = [['Cooking', 'verified'], ['Driving', 'verified'], ['Waiter', 'verified'], ['Plumbing', 'checking'], ['Painting', 'new']];
  const tone = { verified: 'bg-success-tint text-success', checking: 'bg-warning-tint text-warning', new: 'bg-page text-muted' };
  const mark = { verified: '✓', checking: '…', new: '+' };
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-2">
      {skills.map(([name, state]) => (
        <span key={name} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${tone[state]}`}><span>{mark[state]}</span>{name}</span>
      ))}
    </div>
  );
}

export function Waveform() {
  const bars = [8, 14, 22, 30, 18, 26, 36, 24, 14, 28, 34, 20, 12, 22, 16, 9];
  return (
    <div aria-hidden="true" className="flex h-12 items-center gap-1">
      {bars.map((h, i) => <span key={i} className="w-1.5 rounded-full bg-gradient-to-t from-primary to-[#7C5CFF]" style={{ height: h }} />)}
    </div>
  );
}

// The phone in the hero: a small, faithful picture of the seeker home screen.
function PhoneScreen() {
  return (
    <div className="relative h-[520px] overflow-hidden rounded-[34px] bg-page sm:h-[560px]">
      <div className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#05080F]" />
      <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-ink"><span>9:41</span><span>●●● ▮</span></div>
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted">Mohali</p>
            <p className="font-display text-lg font-bold text-ink">Hello, Asha</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary">A</span>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card">
          <ScoreRing score={62} size={58} stroke={7} />
          <div>
            <p className="text-[11px] text-muted">Credit score</p>
            <p className="text-sm font-semibold text-ink">Good progress</p>
            <p className="text-[11px] text-success">+6 this month</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-surface p-3 shadow-card">
          <p className="text-[11px] text-muted">Salary to confirm</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div>
              <p className="font-display text-base font-bold text-ink">₹1,200</p>
              <p className="text-[11px] text-muted">Sharma Canteen</p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white">Confirm</span>
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold text-ink">Jobs near you</p>
        {[['Wedding waiter', '₹800–1,200 / event', '1.2 km'], ['Car washer', '₹120–200 / car', '0.8 km'], ['Parcel packer', '₹500–650 / day', '2.1 km']].map(([title, pay, km]) => (
          <div key={title} className="mt-2 flex items-center justify-between rounded-xl bg-surface px-3 py-2.5 shadow-card">
            <div>
              <p className="text-[13px] font-semibold text-ink">{title}</p>
              <p className="text-[11px] text-muted">{pay}</p>
            </div>
            <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-semibold text-primary">{km}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-line bg-surface pb-4 pt-2 text-[10px] text-muted">
        {[['dashboard', 'Home', true], ['jobs', 'Jobs'], ['skills', 'Skills'], ['salary', 'Salary']].map(([icon, label, active]) => (
          <span key={label} className={`flex flex-col items-center gap-0.5 ${active ? 'text-primary' : ''}`}><Icon name={icon} size={18} />{label}</span>
        ))}
      </div>
    </div>
  );
}

function FloatingCard({ children, className = '' }) {
  return <div className={`rounded-2xl bg-surface/95 px-4 py-3 shadow-overlay ring-1 ring-black/5 backdrop-blur ${className}`}>{children}</div>;
}

export function PhoneMockup() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-[270px] sm:w-[290px]">
      <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-primary/40 via-[#7C5CFF]/30 to-transparent blur-3xl" />
      <div className="relative rounded-[46px] bg-[#05080F] p-2.5 shadow-[0_40px_100px_-20px_rgba(59,91,219,0.6)] ring-1 ring-white/15">
        <PhoneScreen />
      </div>

      {/* The right-hand cards need about 180px beside the phone, so they only appear on wide screens. */}
      <Float delay={0} className="absolute -right-[10rem] top-[1.5rem] hidden min-[1360px]:block">
        <FloatingCard className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-tint text-success">✓</span>
          <div><p className="text-sm font-semibold text-ink">₹1,200 confirmed</p><p className="text-xs text-muted">Salary · today</p></div>
        </FloatingCard>
      </Float>
      <Float delay={1.5} className="absolute -right-[11rem] top-[52%] hidden min-[1360px]:block">
        <FloatingCard className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-primary"><Icon name="jobs" size={18} /></span>
          <div><p className="text-sm font-semibold text-ink">New gig nearby</p><p className="text-xs text-muted">Delivery · 0.8 km</p></div>
        </FloatingCard>
      </Float>
      <Float delay={3} className="absolute -left-[10.5rem] top-[64%] hidden min-[1280px]:block">
        <FloatingCard className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-tint text-warning"><Icon name="skills" size={16} /></span>
          <p className="text-sm font-semibold text-ink">Cooking · verified</p>
        </FloatingCard>
      </Float>
    </div>
  );
}
