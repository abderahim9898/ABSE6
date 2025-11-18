import { useState, useCallback } from 'react';
import { Language } from '@/lib/translations';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('fr');

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'fr' : 'en');
  }, []);

  return { language, setLanguage, toggleLanguage };
};
