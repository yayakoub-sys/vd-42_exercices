import { looksLikeEmvco, parseEmvcoPayment } from '../emvco';
import type { PaymentProvider, ProviderAction, ScannedQr } from './types';

/**
 * Filet de sécurité : si le QR est un paiement EMVCo valide mais qu'aucun
 * opérateur précis n'a été reconnu (MTN Momo, Moov Money, agrégateur...),
 * on l'affiche quand même intelligemment plutôt que de dire "je ne connais pas".
 * Ce provider doit toujours être placé en dernier dans le registre.
 */
export const genericEmvcoProvider: PaymentProvider = {
  id: 'emvco_generic',
  label: 'Paiement (opérateur non identifié)',
  color: '#6B7280',

  detect(qr: ScannedQr): boolean {
    if (!qr.emvco && looksLikeEmvco(qr.raw)) {
      qr.emvco = parseEmvcoPayment(qr.raw);
    }
    return Boolean(qr.emvco);
  },

  getAction(_qr: ScannedQr): ProviderAction {
    return {
      type: 'unsupported',
      reason:
        "Ce QR suit le format standard de paiement, mais je ne sais pas encore à quel opérateur il appartient.",
    };
  },
};
