import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homeFor } from '../nav/navConfig';
import API, { reverseGeocode } from '../api';
import PlaceSearch from './PlaceSearch';
import AuthLayout from './AuthLayout';
import { Input, Select } from '../ui/Field';
import Segmented from '../ui/Segmented';
import Button from '../ui/Button';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
  { code: 'gu', label: 'Gujarati' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone_number: '',
    password: '',
    language: 'en',
    role: 'seeker',
    company_name: '',
    company_type: '',
    gstin_number: '',
  });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationText, setLocationText] = useState('');
  const [place, setPlace] = useState(null); // { city, location } once a suggestion or "Auto" is used

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleLocationText = (text) => { setLocationText(text); setPlace(null); };
  const handlePlaceSelect = (p) => {
    setLocationText(p.city ? `${p.city}${p.state ? `, ${p.state}` : ''}` : p.label);
    setPlace({ city: p.city, location: { type: 'Point', coordinates: [p.lng, p.lat] } });
  };
  const handleLocation = () => {
    if (!navigator.geolocation) return setError('Your browser cannot share its location. Type your city instead.');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const location = { type: 'Point', coordinates: [longitude, latitude] };
        let city = null;
        try {
          const res = await reverseGeocode(latitude, longitude);
          city = res.data.place?.city || null;
        } catch { /* keep the coordinates even if the city lookup fails */ }
        setPlace({ city, location });
        setLocationText(city || 'My current location');
      },
      () => setError('Could not get your location. Type your city instead.')
    );
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // A picked suggestion or "Auto" gives exact coordinates; plain typed text is sent as the city
      // and the server looks it up (and never blocks signup if that lookup fails).
      const typed = locationText.trim();
      const city = (place && place.city) || typed || undefined;
      const location = place ? place.location : undefined;
      const res = await API.post('/users/signup', {
        ...form,
        city,
        location,
      });
      // Same session set-up as the login page, then a short welcome before the user's own dashboard.
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('userId', res.data.user._id);
      login(res.data.user, res.data.token);
      setStep(1);
      setTimeout(() => navigate(homeFor(res.data.user.role)), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 0 ? 'Create your account' : `Welcome, ${form.name}!`}
      subtitle={step === 0 ? 'It takes about a minute.' : 'Your account has been created. Taking you to the next step…'}
      footer={step === 0 && (
        <p>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link></p>
      )}
    >
      {step === 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Segmented
            label="I am a" value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))}
            options={[{ value: 'seeker', label: 'Job seeker' }, { value: 'provider', label: 'Employer' }]}
          />
          <Input label="Full name" name="name" value={form.name} onChange={handleChange} required autoComplete="name" />
          <Input label="Mobile number" name="phone_number" value={form.phone_number} onChange={handleChange} required
            inputMode="numeric" maxLength={10} pattern="[0-9]{10}" autoComplete="tel" />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required
            minLength={8} hint="At least 8 characters" autoComplete="new-password" />
          <Select label="Language" name="language" value={form.language} onChange={handleChange}>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </Select>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Location</label>
            <div className="flex gap-2">
              <PlaceSearch
                value={locationText} onTextChange={handleLocationText} onSelect={handlePlaceSelect}
                placeholder="Start typing your city or area"
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button variant="secondary" onClick={handleLocation}>Auto</Button>
            </div>
          </div>
          {form.role === 'provider' && (
            <>
              <Input label="Company name" name="company_name" value={form.company_name || ''} onChange={handleChange} required />
              <Select label="Company type" name="company_type" value={form.company_type || ''} onChange={handleChange} required>
                <option value="">Select company type</option>
                <option value="individual">Individual</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
                <option value="startup">Startup</option>
              </Select>
              <Input label="GSTIN number" name="gstin_number" value={form.gstin_number || ''} onChange={handleChange} required />
            </>
          )}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" fullWidth loading={loading}>Create account</Button>
        </form>
      )}
    </AuthLayout>
  );
}
