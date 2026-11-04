import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { homeFor } from '../nav/navConfig';
import LanguageSelector from './LanguageSelector';
import { Icon } from '../ui/icons';
import { Reveal } from './home/Motion';
import { PhoneMockup, MiniMap, SkillArt, SalaryArt, ScoreRing, Waveform, IncomeBars, SkillBadges } from './home/Illustrations';

const LANGUAGE_NAMES = ['English', 'हिन्दी', 'ਪੰਜਾਬੀ', 'मराठी', 'தமிழ்', 'తెలుగు', 'മലയാളം', 'ಕನ್ನಡ', 'বাংলা', 'ગુજરાતી'];

// Links styled as buttons: real <a> elements, so they work without JavaScript and read as links.
const pill = 'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-all duration-200';
const btnPrimary = `${pill} bg-primary text-white shadow-[0_8px_24px_-6px_rgba(59,91,219,0.6)] hover:-translate-y-0.5 hover:bg-primary-hover`;
const btnLight = `${pill} bg-white text-ink hover:-translate-y-0.5 hover:bg-primary-tint`;
const btnGhostDark = `${pill} border border-white/20 text-white hover:bg-white/10`;

// The header is transparent over the dark hero and turns into a white bar once the page scrolls.
function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

const SectionHeading = ({ id, eyebrow, title, subtitle, center = false, dark = false }) => (
  <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
    {eyebrow && <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${dark ? 'text-[#9DB0FF]' : 'text-primary'}`}>{eyebrow}</p>}
    <h2 id={id} className={`mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-ink'}`}>{title}</h2>
    {subtitle && <p className={`mt-4 text-lg ${dark ? 'text-night-muted' : 'text-muted'}`}>{subtitle}</p>}
  </div>
);

export default function HomePage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const scrolled = useScrolled();

  if (loading) return <div className="min-h-screen bg-night" />;           // session still being checked
  if (user) return <Navigate to={homeFor(user.role)} replace />;           // signed in: straight to your own home

  const h = (key, defaultValue) => t(`home.${key}`, { defaultValue });
  const signIn = h('signIn', 'Sign in');
  const getStarted = h('getStarted', 'Get started');

  const workTypes = [
    ['jobs', h('catDelivery', 'Delivery')], ['skills', h('catCooking', 'Cooking')], ['tools', h('catConstruction', 'Construction')],
    ['flag', h('catSecurity', 'Security')], ['money', h('catDriving', 'Driving')], ['tools', h('catPlumbing', 'Plumbing')],
    ['chart', h('catElectrical', 'Electrical work')], ['skills', h('catPainting', 'Painting')], ['jobs', h('catWarehouse', 'Warehouse')],
    ['user', h('catWaiter', 'Waiters')], ['skills', h('catCleaning', 'Cleaning')], ['tools', h('catGardening', 'Gardening')],
  ];

  const stats = [
    ['10', h('statLanguages', 'Indian languages')],
    ['18', h('statWork', 'kinds of gig work')],
    ['₹0', h('statFree', 'to join as a worker')],
    ['3', h('statSteps', 'steps to verified income')],
  ];

  const steps = [
    { art: <MiniMap className="h-full" />, title: h('step1Title', 'Find work near you'), text: h('step1Text', 'See gig jobs on a map around you and apply in one tap.') },
    { art: <SkillArt />, title: h('step2Title', 'Build verified skills'), text: h('step2Text', 'Add your skills, upload your documents and take a short check, so employers can trust what you say.') },
    { art: <SalaryArt />, title: h('step3Title', 'Keep a salary record'), text: h('step3Text', 'Your employer records each payment and you confirm it. Confirmed income builds your credit profile.') },
  ];

  const audiences = [
    {
      icon: 'user', tone: 'from-primary to-[#6D8BFF]', title: h('seekers', 'Job seekers'), text: h('seekersText', 'Find steady work nearby and turn it into a record that opens doors.'),
      points: [h('seekersPoint1', 'Find gig jobs on a map near you'), h('seekersPoint2', 'Get your skills checked and verified'), h('seekersPoint3', 'Build a credit profile from confirmed salary')],
      cta: h('seekersCta', 'Join as a job seeker'),
    },
    {
      icon: 'jobs', tone: 'from-[#7C5CFF] to-[#A78BFA]', title: h('employers', 'Employers'), text: h('employersText', 'Hire reliable people quickly and keep everything on record.'),
      points: [h('employersPoint1', 'Post jobs and review applicants'), h('employersPoint2', 'Hire and keep a clear salary record'), h('employersPoint3', 'Rate workers and build your reputation')],
      cta: h('employersCta', 'Join as an employer'),
    },
    {
      icon: 'chart', tone: 'from-[#0EA5A4] to-[#5EEAD4]', title: h('investors', 'Investors'), text: h('investorsText', 'Back working people with data you can actually trust.'),
      points: [h('investorsPoint1', 'Browse investment opportunities'), h('investorsPoint2', 'Set up an investor profile'), h('investorsPoint3', 'Review loan requests from verified workers')],
      cta: h('investorsCta', 'Explore as an investor'),
    },
  ];

  const navLinks = [['#how', h('navHow', 'How it works')], ['#features', h('navFeatures', 'Features')], ['#who', h('navWho', "Who it's for")]];

  return (
    <div className="min-h-screen bg-page text-ink">
      {/* ---------- Header ---------- */}
      <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${scrolled ? 'border-b border-line bg-surface/85 backdrop-blur-xl' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px]">
          <Link to="/" className={`font-display text-xl font-extrabold tracking-tight ${scrolled ? 'text-primary' : 'text-white'}`}>Sahaayak</Link>
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${scrolled ? 'text-muted hover:text-ink' : 'text-white/75 hover:text-white'}`}>{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden lg:block"><LanguageSelector variant="compact" showLabel={false} size="small" tone={scrolled ? 'light' : 'dark'} /></div>
            <Link to="/login" className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${scrolled ? 'text-ink hover:bg-page' : 'text-white hover:bg-white/10'}`}>{signIn}</Link>
            <Link to="/signup" className={`hidden rounded-full px-5 py-2.5 text-sm font-semibold sm:inline-flex ${scrolled ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-white text-ink hover:bg-primary-tint'}`}>{getStarted}</Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden bg-night pb-20 pt-32 text-white sm:pb-28 sm:pt-40">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
                backgroundSize: '56px 56px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 100%)',
              }}
            />
            <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/40 blur-[120px]" />
            <div className="absolute right-[-10%] top-1/3 h-[420px] w-[420px] rounded-full bg-[#7C5CFF]/30 blur-[120px]" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-night" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 lg:grid-cols-[1.35fr_0.65fr] lg:gap-8">
            <div className="text-center lg:text-left">
              <Reveal>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/85 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-[#4ADE80] shadow-[0_0_12px_#4ADE80]" />
                  {h('eyebrow', 'Built for gig and daily-wage workers')}
                </p>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="mt-6 font-display text-[2.5rem] font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-[3.4rem] xl:text-[3.75rem]">
                  <span className="block">{h('titleA', 'Work you can find')}</span>{' '}
                  <span className="block bg-gradient-to-r from-[#9DB0FF] via-[#B9A6FF] to-[#7DD3FC] bg-clip-text pb-1 text-transparent">{h('titleB', 'Income you can prove')}</span>
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-night-muted lg:mx-0">
                  {h('subtitle', 'Sahaayak connects you with gig jobs near you, verifies your skills, and turns your salary records into a credit profile you can use to get loans.')}
                </p>
              </Reveal>
              <Reveal delay={0.24}>
                <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
                  <Link to="/signup" className={btnPrimary}>{getStarted}<span aria-hidden="true">→</span></Link>
                  <Link to="/login" className={btnGhostDark}>{signIn}</Link>
                </div>
              </Reveal>
              <Reveal delay={0.32}>
                <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-white/70 lg:justify-start">
                  {[h('factLanguages', '10 Indian languages'), h('factVoice', 'Voice assistant'), h('factFree', 'Free to join')].map((f) => (
                    <li key={f} className="flex items-center gap-2"><span aria-hidden="true" className="text-[#4ADE80]">✓</span>{f}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.2}><PhoneMockup /></Reveal>
          </div>
        </section>

        {/* ---------- Kinds of work (scrolling strip) ---------- */}
        <section aria-labelledby="work-title" className="border-b border-line bg-surface py-10">
          <h2 id="work-title" className="px-4 text-center text-sm font-medium text-muted">{h('workStrip', 'Made for the people who keep our cities running')}</h2>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <div className="flex w-max animate-marquee gap-3 pr-3">
              {[0, 1].map((copy) => (
                <ul key={copy} aria-hidden={copy === 1 ? 'true' : undefined} className="flex gap-3">
                  {workTypes.map(([icon, label]) => (
                    <li key={label} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-page px-4 py-2 text-sm font-medium text-ink">
                      <span className="text-primary"><Icon name={icon} size={16} /></span>{label}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Numbers ---------- */}
        <section aria-label={h('statsLabel', 'Sahaayak in numbers')} className="mx-auto max-w-6xl px-4 py-16">
          <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map(([value, label], i) => (
              <Reveal key={label} delay={i * 0.06} className="rounded-3xl border border-line bg-surface p-6 text-center">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                  <span className="bg-gradient-to-br from-primary to-[#7C5CFF] bg-clip-text text-transparent">{value}</span>
                </dd>
                <dd aria-hidden="true" className="mt-2 text-sm text-muted">{label}</dd>
              </Reveal>
            ))}
          </dl>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how" aria-labelledby="how-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:py-24">
          <SectionHeading id="how-title" eyebrow={h('howEyebrow', 'Simple by design')} title={h('howTitle', 'How it works')}
            subtitle={h('howSubtitle', 'Three steps from looking for work to being trusted with credit.')} />
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.1} className="group flex flex-col rounded-3xl border border-line bg-surface p-6 transition-shadow hover:shadow-overlay">
                <div className="flex h-52 flex-col justify-center rounded-2xl bg-gradient-to-br from-[#F1F4FF] to-[#F6F2FF] p-4">{s.art}</div>
                <span className="mt-6 font-display text-sm font-bold text-primary">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ---------- Features (bento) ---------- */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-24 bg-surface py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading id="features-title" eyebrow={h('featuresEyebrow', 'Everything in one place')} title={h('featuresTitle', 'One app for work, skills and money')}
              subtitle={h('featuresSubtitle', 'No paperwork, no middlemen. Just the tools a working person actually needs.')} />

            <div className="mt-14 grid gap-5 md:grid-cols-6">
              <Reveal className="relative flex flex-col overflow-hidden rounded-3xl border border-line bg-page p-6 md:col-span-4 md:row-span-2">
                <h3 className="font-display text-xl font-bold">{h('f1Title', 'Jobs on a map')}</h3>
                <p className="mt-1 max-w-sm text-muted">{h('f1Text', 'Nearby gig work, sorted by distance, with pay shown up front.')}</p>
                <MiniMap className="mt-6 min-h-[16rem] flex-1" />
              </Reveal>

              <Reveal delay={0.05} className="flex flex-col justify-between rounded-3xl bg-night p-6 text-white md:col-span-2">
                <div>
                  <h3 className="font-display text-xl font-bold">{h('f4Title', 'Credit score')}</h3>
                  <p className="mt-1 text-sm text-night-muted">{h('f4Text', 'A score built from your work, ratings and savings.')}</p>
                </div>
                <div className="mt-6 flex items-center gap-4"><ScoreRing score={74} size={92} stroke={9} light /><p className="text-sm text-night-muted">{h('f4Note', 'Grows every time an employer pays you on record.')}</p></div>
              </Reveal>

              <Reveal delay={0.1} className="rounded-3xl border border-line bg-page p-6 md:col-span-2">
                <h3 className="font-display text-xl font-bold">{h('f3Title', 'Salary records')}</h3>
                <p className="mt-1 text-sm text-muted">{h('f3Text', 'Simple, confirmed proof of income.')}</p>
                <div className="mt-5"><IncomeBars /></div>
              </Reveal>

              <Reveal className="rounded-3xl border border-line bg-page p-6 md:col-span-2">
                <h3 className="font-display text-xl font-bold">{h('f2Title', 'Skill checks')}</h3>
                <p className="mt-1 text-sm text-muted">{h('f2Text', 'Short assessments and document verification.')}</p>
                <div className="mt-5"><SkillBadges /></div>
              </Reveal>

              <Reveal delay={0.05} className="rounded-3xl border border-line bg-page p-6 md:col-span-2">
                <h3 className="font-display text-xl font-bold">{h('voiceTitle', 'Voice assistant')}</h3>
                <p className="mt-1 text-sm text-muted">{h('voiceText', 'Ask for jobs or check your salary by speaking.')}</p>
                <div className="mt-6 flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_24px_-6px_rgba(59,91,219,0.6)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                  </span>
                  <Waveform />
                </div>
              </Reveal>

              <Reveal delay={0.1} className="rounded-3xl border border-line bg-page p-6 md:col-span-2">
                <h3 className="font-display text-xl font-bold">{h('f5Title', 'Loans and tools')}</h3>
                <p className="mt-1 text-sm text-muted">{h('f5Text', 'Loan amounts that fit your income, and tools you can borrow for work.')}</p>
                <div aria-hidden="true" className="mt-5 space-y-2">
                  <div className="rounded-xl bg-surface px-3.5 py-2.5 shadow-card"><p className="text-xs text-muted">Suggested loan</p><p className="font-display text-lg font-bold text-ink">₹25,000</p></div>
                  <div className="flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5 text-sm shadow-card"><span className="text-ink">Drill machine</span><span className="text-muted">₹50 / day</span></div>
                </div>
              </Reveal>

              <Reveal delay={0.05} className="rounded-3xl border border-line bg-gradient-to-br from-[#F1F4FF] to-[#F6F2FF] p-6 md:col-span-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-sm">
                    <h3 className="font-display text-xl font-bold">{h('langTitle', 'Speaks your language')}</h3>
                    <p className="mt-1 text-sm text-muted">{h('langText', 'Use Sahaayak in the language you are most comfortable with.')}</p>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {LANGUAGE_NAMES.map((name) => <li key={name} className="rounded-full border border-white bg-white/80 px-4 py-1.5 text-sm font-medium text-ink shadow-card">{name}</li>)}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- Who it is for ---------- */}
        <section id="who" aria-labelledby="who-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:py-24">
          <SectionHeading id="who-title" eyebrow={h('whoEyebrow', 'For everyone in the chain')} title={h('whoTitle', 'Who it is for')} center />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {audiences.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.1} className="flex flex-col rounded-3xl border border-line bg-surface p-7 transition-shadow hover:shadow-overlay">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${a.tone} text-white shadow-card`}><Icon name={a.icon} /></span>
                <h3 className="mt-5 font-display text-2xl font-bold text-ink">{a.title}</h3>
                <p className="mt-2 text-muted">{a.text}</p>
                <ul className="mt-5 flex-1 space-y-3">
                  {a.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] text-ink">
                      <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-tint text-xs text-success">✓</span>{p}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-7 inline-flex items-center gap-1 font-semibold text-primary hover:gap-2 transition-all">{a.cta}<span aria-hidden="true">→</span></Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Closing call to action ---------- */}
        <section aria-label={getStarted} className="px-4 pb-20 sm:pb-28">
          <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-night px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/45 blur-[100px]" />
              <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#7C5CFF]/40 blur-[100px]" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{h('ctaTitle', 'Ready to get started?')}</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-night-muted">{h('ctaText', 'Create a free account in about a minute.')}</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link to="/signup" className={btnLight}>{h('createAccount', 'Create your account')}</Link>
                <Link to="/login" className={btnGhostDark}>{signIn}</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-xl font-extrabold text-primary">Sahaayak</p>
            <p className="mt-3 max-w-sm text-sm text-muted">{h('footerTagline', 'Work, skills and credit in one place, for India\'s gig and daily-wage workers.')}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{h('footerProduct', 'Product')}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {navLinks.map(([href, label]) => <li key={href}><a href={href} className="text-muted hover:text-ink">{label}</a></li>)}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{h('footerAccount', 'Account')}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/login" className="text-muted hover:text-ink">{signIn}</Link></li>
              <li><Link to="/signup" className="text-muted hover:text-ink">{h('footerCreate', 'Create an account')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-muted">© {new Date().getFullYear()} Sahaayak</p>
        </div>
      </footer>
    </div>
  );
}
