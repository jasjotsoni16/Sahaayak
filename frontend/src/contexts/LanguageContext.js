import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, updateLanguage } from '../api';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  ];

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('selectedLanguage');
        
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const userResponse = await getCurrentUser();
            const userLanguage = userResponse.data.language;
            
            if (userLanguage && userLanguage !== savedLanguage) {
              setCurrentLanguage(userLanguage);
              i18n.changeLanguage(userLanguage);
              document.documentElement.lang = userLanguage;
              localStorage.setItem('selectedLanguage', userLanguage);
              return;
            }
          } catch (error) {
            console.log('Could not fetch user language preference:', error);
          }
        }
        
        const languageToUse = savedLanguage || 'en';
        setCurrentLanguage(languageToUse);
        i18n.changeLanguage(languageToUse);
        document.documentElement.lang = languageToUse;
        
      } catch (error) {
        console.error('Error initializing language:', error);
        setCurrentLanguage('en');
        i18n.changeLanguage('en');
        document.documentElement.lang = 'en';
      }
    };

    initializeLanguage();
  }, [i18n]);

  const changeLanguage = async (languageCode) => {
    setLoading(true);
    try {
      await i18n.changeLanguage(languageCode);
      document.documentElement.lang = languageCode;
      setCurrentLanguage(languageCode);
      
      localStorage.setItem('selectedLanguage', languageCode);
      
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await updateLanguage(languageCode);
          console.log('Language preference updated in profile');
        } catch (error) {
          console.error('Failed to update language in profile:', error);
        }
      }
      
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageName = (code) => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.nativeName : code;
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  const value = {
    currentLanguage,
    languages,
    changeLanguage,
    getLanguageName,
    getCurrentLanguage,
    loading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;