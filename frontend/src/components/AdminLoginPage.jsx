import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import AuthLayout from './AuthLayout';
import { Input } from '../ui/Field';
import Button from '../ui/Button';

export default function AdminLoginPage() {
  const [phone_number, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/admin/login', { phone_number, password });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user._id);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin login"
      subtitle="For Sahaayak administrators."
      footer={<Link to="/login" className="font-medium text-primary hover:underline">Back to the regular login</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Admin phone number" name="phone_number" value={phone_number} onChange={(e) => setPhoneNumber(e.target.value)} required autoComplete="username" />
        <Input label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>{loading ? 'Logging in…' : 'Log in as admin'}</Button>
      </form>
    </AuthLayout>
  );
}
