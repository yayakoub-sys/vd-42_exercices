import type { PaymentProvider, ProviderAction, ScannedQr } from './types';

/**
 * Les QR marchands Wave encodent directement un lien officiel de la forme
 * https://pay.wave.com/m/<ID_MARCHAND>/c/ci (confirmé sur des QR réels publiés par Wave).
 * Ce lien est un "lien universel" : le téléphone ouvre automatiquement l'appli Wave
 * si elle est installée, sinon la page web de paiement Wave. On peut donc l'ouvrir
 * tel quel, sans rien inventer.
 */
const WAVE_URL_PATTERN = /^https?:\/\/([\w-]+\.)*wave\.com\//i;

export const waveProvider: PaymentProvider = {
  id: 'wave',
  label: 'Wave',
  color: '#1DC8CD',

  detect(qr: ScannedQr): boolean {
    return WAVE_URL_PATTERN.test(qr.raw.trim());
  },

  getAction(qr: ScannedQr): ProviderAction {
    return {
      type: 'deeplink',
      url: qr.raw.trim(),
      confidence: 'confirmed',
    };
  },
};
