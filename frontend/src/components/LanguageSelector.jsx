import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

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

const LanguageSelector = ({ 
  variant = 'dropdown', 
  showLabel = true, 
  className = '',
  size = 'medium',
  tone = 'light', // 'dark' for use on dark backgrounds (the home page hero)
}) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, loading } = useLanguage();

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
    if (newLanguage !== currentLanguage) {
      await changeLanguage(newLanguage);
    }
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-3 py-2 text-base',
    large: 'px-4 py-3 text-lg'
  };

  const toneClasses = tone === 'dark'
    ? 'border border-white/20 rounded-full bg-white/10 text-white hover:bg-white/15'
    : 'border border-gray-300 rounded-lg bg-white';
  const baseClasses = `
    ${toneClasses}
    focus:ring-2 focus:ring-primary focus:border-primary 
    cursor-pointer transition-colors
    ${sizeClasses[size]}
    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        {showLabel && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.language') || 'Language'}
          </label>
        )}
        <div className="relative">
          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            disabled={loading}
            className={baseClasses}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.label})
              </option>
            ))}
          </select>
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage);
    return (
      <div className="relative">
        <select
          value={currentLanguage}
          onChange={handleLanguageChange}
          disabled={loading}
          className={`${baseClasses} appearance-none pr-8`}
          title={t('profile.selectLanguage') || 'Select Language'}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code} className="text-ink">
              {lang.nativeName}
            </option>
          ))}
        </select>
        {loading ? (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className={`w-4 h-4 ${tone === 'dark' ? 'text-white/70' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // Button variant with modal (for future enhancement)
  return (
    <button
      onClick={() => {/* Could open a modal with language options */}}
      disabled={loading}
      className={`${baseClasses} flex items-center space-x-2`}
      title={t('profile.selectLanguage') || 'Select Language'}
    >
      <span>🌐</span>
      <span>{LANGUAGES.find(lang => lang.code === currentLanguage)?.nativeName || 'English'}</span>
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
      )}
    </button>
  );
};

export default LanguageSelector;