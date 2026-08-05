import type { PaymentProvider, ProviderAction, ScannedQr } from './types';
import { looksLikeEmvco, parseEmvcoPayment } from '../emvco';
import { KNOWN_MERCHANT_GUIDS } from './knownGuids';

function matchesKnownGuid(qr: ScannedQr): boolean {
  if (!qr.emvco)
    return false;
  return qr.emvco.merchantAccountGuids.some(guid => KNOWN_MERCHANT_GUIDS[guid] === 'orange_money');
}

/**
 * Heuristique de secours tant qu'on n'a pas de GUID confirmé : Orange Money CI
 * encode ses QR marchands au format EMVCo standard (confirmé), et le nom du
 * marchand ou les données additionnelles mentionnent souvent "orange"/"om".
 * C'est une approximation, assumée comme telle (voir README).
 */
function matchesNameHeuristic(qr: ScannedQr): boolean {
  if (!qr.emvco)
    return false;
  const haystack = `${qr.emvco.merchantName ?? ''}`.toLowerCase();
  return haystack.includes('orange') || haystack.includes(' om ') || haystack.startsWith('om ');
}

export const orangeMoneyProvider: PaymentProvider = {
  id: 'orange_money',
  label: 'Orange Money',
  color: '#FF7900',

  detect(qr: ScannedQr): boolean {
    if (!qr.emvco && looksLikeEmvco(qr.raw)) {
      qr.emvco = parseEmvcoPayment(qr.raw);
    }
    return matchesKnownGuid(qr) || matchesNameHeuristic(qr);
  },

  getAction(_qr: ScannedQr): ProviderAction {
    return {
      type: 'deeplink',
      // Schémas candidats non confirmés : à vérifier avec un vrai téléphone.
      // Si aucun ne s'ouvre, on retombe sur la fiche de l'appli dans le store.
      url: 'orangemoney://pay',
      fallbackUrls: ['maxit://pay', 'orangemoneyci://pay'],
      confidence: 'best_effort',
      // Recherches génériques (pas un lien direct vers la fiche : je n'ai pas
      // pu vérifier l'identifiant exact de l'appli sur chaque store).
      storeFallback: {
        android: 'https://play.google.com/store/search?q=Orange%20Money%20CI&c=apps',
        ios: 'https://apps.apple.com/search?term=Orange%20Money%20CI',
      },
    };
  },
};
