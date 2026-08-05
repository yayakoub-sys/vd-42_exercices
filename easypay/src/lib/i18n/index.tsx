/* eslint-disable react-refresh/only-export-components */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import { resources } from './resources';
import { getLanguage } from './utils';

export * from './utils';

/**
 * EasyPay est une application ivoirienne : le français est la langue de
 * référence, et le repli quand la langue du téléphone est inconnue.
 *
 * Avant, le repli était l'anglais : un téléphone réglé en portugais ou en
 * espagnol affichait EasyPay en anglais. C'est aussi pour ça que des libellés
 * anglais traînaient dans les paramètres (ETAT.md § 9.4).
 */
i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage() || getLocales()[0]?.languageTag,
  fallbackLng: 'fr',
  compatibilityJSON: 'v4', // Updated to v4 for i18next compatibility

  // allows integrating dynamic values into translations.
  interpolation: {
    escapeValue: false, // escape passed in values to avoid XSS injections
  },
});

// Is it a RTL language?
export const isRTL: boolean = i18n.dir() === 'rtl';

I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

export default i18n;
