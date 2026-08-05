import ar from '@/translations/ar.json';
import en from '@/translations/en.json';
import fr from '@/translations/fr.json';

/**
 * EasyPay s'adresse d'abord au marché ivoirien : le FRANÇAIS est la langue
 * de référence, pas l'anglais.
 *
 * Le modèle de départ (Obytes) livrait anglais + arabe. C'est ce qui
 * expliquait les « Language », « Theme » et « System » restés en anglais
 * dans les paramètres (ETAT.md § 9.4) : il n'existait tout simplement pas
 * de traduction française.
 */
export const resources = {
  fr: {
    translation: fr,
  },
  en: {
    translation: en,
  },
  ar: {
    translation: ar,
  },
};

export type Language = keyof typeof resources;
