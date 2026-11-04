import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../api';
import { homeFor } from '../nav/navConfig';
import AuthLayout from './AuthLayout';
import { Input, Select } from '../ui/Field';
import Button from '../ui/Button';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ phone_number: '', password: '', role: 'seeker' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/users/login', form);
      
      // Store in localStorage for backward compatibility
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('userId', res.data.user._id);
      
      // Use AuthContext login method
      login(res.data.user, res.data.token);
      
      // Every role lands on its own dashboard
      navigate(homeFor(res.data.user.role));
    } catch (err) {
      setError(err.response?.data?.error || t('auth.loginError') || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.login', { defaultValue: 'Log in' })}
      subtitle={t('auth.aiPoweredAssistant', { defaultValue: 'Your work assistant' })}
      footer={(
        <>
          <p>
            {t('auth.dontHaveAccount', { defaultValue: "Don't have an account?" })}{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">{t('auth.signUp', { defaultValue: 'Sign up' })}</Link>
          </p>
          <p className="mt-2">
            {t('auth.areYouAdmin', { defaultValue: 'Are you an admin?' })}{' '}
            <Link to="/admin/login" className="font-medium text-primary hover:underline">{t('auth.adminLogin', { defaultValue: 'Admin login' })}</Link>
          </p>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('auth.phoneNumber', { defaultValue: 'Mobile number' })} name="phone_number" value={form.phone_number}
          onChange={handleChange} required inputMode="numeric" autoComplete="tel" maxLength={10} pattern="[0-9]{10}" />
        <Input label={t('auth.password', { defaultValue: 'Password' })} name="password" type="password" value={form.password}
          onChange={handleChange} required autoComplete="current-password" />
        <Select label={t('auth.role', { defaultValue: 'I am a' })} name="role" value={form.role} onChange={handleChange}>
          <option value="seeker">{t('auth.seeker', { defaultValue: 'Job seeker' })}</option>
          <option value="provider">{t('auth.provider', { defaultValue: 'Employer' })}</option>
        </Select>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          {loading ? t('auth.loggingIn', { defaultValue: 'Logging in…' }) : t('auth.login', { defaultValue: 'Log in' })}
        </Button>
      </form>
    </AuthLayout>
  );
}
