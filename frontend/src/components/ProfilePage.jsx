import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import API from '../api';
import SavingsGoalCard from './SavingsGoalCard';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { Input, Select } from '../ui/Field';


const schemes = [
  {
    id: 'eshram',
    name: 'e-Shram',
    image: 'https://www.uxdt.nic.in/wp-content/uploads/2024/07/e-shram-e-shram-01.jpg?x86456',
    applyUrl: 'https://eshram.gov.in/',
  },
  {
    id: 'pmjay',
    name: 'PM Jan Arogya Yojana',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTM14i34pZNJ6lGEyd34mVLqMlE2j73Xrhgeg&s',
    applyUrl: 'https://pmjay.gov.in/',
  },
  {
    id: 'pmsym',
    name: 'Maan-dhan (PM-SYM)',
    image: 'https://media.umangapp.in/app/ico/service/maandhan.png',
    applyUrl: 'https://maandhan.in/',
  },
];

const LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી' },
];

const getExperienceTag = (dateJoined, dateLeft) => {
    const start = new Date(dateJoined);
    const end = dateLeft ? new Date(dateLeft) : new Date();

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
        return 'Daily Wage';
    } else if (diffDays > 30 && diffDays <= 90) {
        return 'Contract';
    } else {
        return 'Long Term';
    }
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, loading: languageLoading } = useLanguage();
  const userLocal = JSON.parse(localStorage.getItem('user'));
  const [user, setUser] = useState(null);
  const { user: authUser, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUserProfile = async () => {
    if (!userLocal) return window.location.href = '/login';
    try {
      const res = await API.get('/users/profile');
      console.log('Profile data from backend:', res.data);
      setUser(res.data);
      setForm(res.data);
    } catch (err) {
      setError('Failed to load profile');
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSave = async () => {
    try {
      const res = await API.put('/users/profile', form);
      setUser(res.data);
      setEditing(false);
    } catch {
      setError('Failed to update profile');
    }
  };
  const handleLanguage = async e => {
    const newLanguage = e.target.value;
    setError('');
    setSuccess('');
    
    try {
      // Update language in context (this will also update i18n and localStorage)
      await changeLanguage(newLanguage);
      
      // Update user state to reflect the change
      setUser(u => ({ ...u, language: newLanguage }));
      
      setSuccess(t('profile.languageUpdated') || 'Language updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update language:', error);
      setError(t('profile.languageUpdateError') || 'Failed to update language');
    }
  };
  const handleNotifications = async () => {
    try {
      const res = await API.put('/users/profile/notifications', { notifications: !user.notifications });
      setUser(u => ({ ...u, notifications: res.data.notifications }));
    } catch {
      setError('Failed to update notifications');
    }
  };

  if (!user) return <div className="py-16 text-center text-muted">{t('common.loading', { defaultValue: 'Loading…' })}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xl font-semibold text-primary">{user.name[0]}</div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-ink">{user.name}</h1>
            <p className="text-sm text-muted">{user.phone_number}</p>
          </div>
          <Badge tone="warning">★ {user.avgRating ? user.avgRating.toFixed(1) : 'N/A'}</Badge>
        </div>

        {editing ? (
          <div className="mt-5 space-y-4">
            <Input label={t('common.name', { defaultValue: 'Full name' })} name="name" value={form.name} onChange={handleChange} />
            <Input label={t('common.city', { defaultValue: 'City' })} name="location" value={form.location} onChange={handleChange} />
            <Input label={t('common.address', { defaultValue: 'Address' })} name="address" value={form.address || ''} onChange={handleChange} />
            <Input label={t('common.email', { defaultValue: 'Email' })} name="email" type="email" value={form.email || ''} onChange={handleChange} />
            <div className="flex gap-2">
              <Button onClick={handleSave}>{t('common.save', { defaultValue: 'Save' })}</Button>
              <Button variant="secondary" onClick={() => { setForm(user); setEditing(false); }}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
            </div>
          </div>
        ) : (
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">{t('common.address', { defaultValue: 'Address' })}</dt>
              <dd className="text-ink">{user.address ? user.address : t('profile.notSet', { defaultValue: 'Not set' })}</dd>
            </div>
            {user.email && (
              <div>
                <dt className="text-muted">{t('common.email', { defaultValue: 'Email' })}</dt>
                <dd className="text-ink">{user.email}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>{t('common.edit', { defaultValue: 'Edit' })}</Button>
            </div>
          </dl>
        )}
      </Card>

      {error && <p role="alert" className="rounded-lg bg-danger-tint px-4 py-3 text-sm text-danger">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-success-tint px-4 py-3 text-sm text-success">{success}</p>}

      <Card title={t('common.settings', { defaultValue: 'Settings' })}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <span className="text-ink">{t('notifications.title', { defaultValue: 'Notifications' })}</span>
          <button
            type="button" role="switch" aria-checked={!!user.notifications} onClick={handleNotifications}
            aria-label={t('notifications.title', { defaultValue: 'Notifications' })}
            className={`flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${user.notifications ? 'bg-primary' : 'bg-line'}`}
          >
            <span className={`h-5 w-5 rounded-full bg-surface shadow transition-transform ${user.notifications ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <Select
          label={`${t('common.language', { defaultValue: 'Language' })} / ${t('profile.selectLanguage', { defaultValue: 'भाषा चुनें' })}`}
          name="language" value={user.language || currentLanguage} onChange={handleLanguage} disabled={languageLoading}
          hint={t('profile.languageChangeNote', { defaultValue: 'Website language will change immediately' })}
        >
          {LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.nativeName} ({lang.label})</option>)}
        </Select>
      </Card>

      <Card title={t('profile.ratings', { defaultValue: 'Ratings' })}>
        <div className="flex items-center gap-2">
          <Badge tone="warning">★ {user.avgRating ? user.avgRating.toFixed(1) : 'N/A'}</Badge>
          <span className="text-sm text-muted">({user.reviewCount || 0} {t('profile.reviews', { defaultValue: 'reviews' })})</span>
        </div>
        {user.false_accusation_count > 0 && (
          <p className="mt-2 text-sm text-danger">{t('profile.falseAccusations', { defaultValue: 'False accusations' })}: {user.false_accusation_count}</p>
        )}
        {user.abuse_true_count > 0 && (
          <p className="mt-1 text-sm text-danger">{t('profile.abuseConfirmed', { defaultValue: 'Abuse confirmed' })}: {user.abuse_true_count}</p>
        )}
      </Card>

      {(user.role === 'seeker' || user.role === 'investor') && (
        <SavingsGoalCard
          initialGoal={user.monthlySavings || 0}
          onSaved={(goal) => {
            // keep the signed-in user in step, or the dashboard keeps asking for a goal until a reload
            setUser((u) => ({ ...u, monthlySavings: goal }));
            if (authUser) updateUser({ ...authUser, monthlySavings: goal });
          }}
        />
      )}

      {user.role === 'seeker' && (
        <Card title={t('profile.workExperience', { defaultValue: 'Work experience' })}>
          {user.experiences && user.experiences.length > 0 ? (
            <ul className="divide-y divide-line">
              {user.experiences.map((exp) => (
                <li key={exp._id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{exp.job_id ? exp.job_id.title : exp.job_description}</span>
                    <Badge tone="success">{getExperienceTag(exp.date_joined, exp.date_left)}</Badge>
                  </div>
                  <p className="text-sm text-muted">
                    {new Date(exp.date_joined).toLocaleDateString()} – {exp.date_left ? new Date(exp.date_left).toLocaleDateString() : t('profile.present', { defaultValue: 'Present' })}
                  </p>
                  {exp.description && <p className="mt-1 text-sm text-ink">{exp.description}</p>}
                  {exp.location && <p className="text-sm text-muted">{t('common.location', { defaultValue: 'Location' })}: {exp.location}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('profile.noWorkExperience', { defaultValue: 'No work experience added yet.' })} />
          )}
        </Card>
      )}

      {user.role === 'seeker' && (
        <Card title={t('government_schemes', { defaultValue: 'Government schemes' })}>
          <ul className="space-y-3">
            {schemes.map((scheme) => (
              <li key={scheme.id} className="flex items-center gap-4 rounded-xl border border-line p-3">
                <img src={scheme.image} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-page object-cover" />
                <span className="min-w-0 flex-1 font-medium text-ink">{scheme.name}</span>
                <Button size="sm" variant="secondary" onClick={() => window.open(scheme.applyUrl, '_blank')}>{t('apply', { defaultValue: 'Apply' })}</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
