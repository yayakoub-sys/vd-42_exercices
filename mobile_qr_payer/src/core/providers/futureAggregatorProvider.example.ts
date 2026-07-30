/**
 * MODÈLE — pas branché tant qu'il n'y a pas de vrai contrat.
 *
 * Le jour où un agrégateur (celui qui détient les accords d'émission et les
 * API de prélèvement/débit) est choisi, on n'a PAS besoin de refaire l'appli :
 * il suffit de dupliquer ce fichier, remplir `callAggregatorApi`, et l'ajouter
 * dans `registry.ts`. Tout le reste (caméra, détection, écrans) ne change pas.
 *
 * Renommez ce fichier en `aggregator.ts` pour l'activer.
 */
import type { PaymentProvider, ProviderAction, ScannedQr } from './types';

async function callAggregatorApi(_qr: ScannedQr): Promise<{ success: boolean }> {
  // Exemple : appeler l'API de débit de l'agrégateur avec les identifiants
  // marchand/API key fournis dans le contrat, en passant les infos extraites
  // du QR (qr.emvco.amount, qr.emvco.merchantAccountGuids, etc.)
  throw new Error('Pas encore implémenté : brancher ici le vrai appel API une fois le contrat signé.');
}

export const futureAggregatorProvider: PaymentProvider = {
  id: 'aggregator',
  label: 'Paiement direct (via agrégateur)',
  color: '#111827',

  detect(_qr: ScannedQr): boolean {
    // Reconnaître ici les QR couverts par l'accord (souvent via leur GUID EMVCo).
    return false;
  },

  getAction(_qr: ScannedQr): ProviderAction {
    return {
      type: 'unsupported',
      reason: 'Fournisseur modèle, non activé.',
    };
  },
};

// Une fois prêt, remplacer `getAction` pour retourner un vrai résultat de débit
// (par exemple un nouveau type ProviderAction `{ type: 'api', run: callAggregatorApi }`
// à ajouter dans `types.ts`), et gérer ce cas dans `ResultScreen.tsx`.
