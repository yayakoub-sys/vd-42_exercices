import type { EmvcoPayment } from '../emvco';

/** Ce que le lecteur a compris du QR code, avant de savoir quel opérateur c'est. */
export type ScannedQr = {
  /** Texte brut tel que lu par la caméra. */
  raw: string;
  /** Rempli seulement si le QR est un paiement EMVCo (Orange Money et beaucoup d'autres). */
  emvco?: EmvcoPayment;
};

export type ProviderAction
  = | {
    type: 'deeplink';
    /** Lien à essayer en premier pour terminer le paiement dans l'appli officielle. */
    url: string;
    /** Autres liens à essayer si le premier ne s'ouvre pas (schémas non confirmés). */
    fallbackUrls?: string[];
    /** Confiance dans le fait que ce lien fonctionnera réellement (voir README). */
    confidence: 'confirmed' | 'best_effort';
    /** Où proposer de télécharger l'appli si elle n'est pas installée / si rien ne s'ouvre. */
    storeFallback?: { android?: string; ios?: string };
  }
  | {
    type: 'unsupported';
    reason: string;
  };

export type PaymentProvider = {
  /** Identifiant technique stable, ex: "wave". */
  id: string;
  /** Nom affiché à l'utilisateur, ex: "Wave". */
  label: string;
  /** Couleur d'accent pour l'écran de résultat. */
  color: string;
  /** Renvoie true si ce QR appartient à cet opérateur. */
  detect: (qr: ScannedQr) => boolean;
  /** Calcule quoi faire une fois l'opérateur reconnu. */
  getAction: (qr: ScannedQr) => ProviderAction;
};
