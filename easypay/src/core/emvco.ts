/**
 * Parseur générique du format EMVCo "Merchant-Presented QR Code".
 * C'est un standard ouvert et documenté (pas un secret Orange/Wave) :
 * https://www.emvco.com/processes/merchant-presented-qr-codes/
 *
 * Le contenu est une suite de blocs "TLV" : Tag (2 chiffres) + Length (2 chiffres) + Value.
 * Ex: "5802CI" => tag 58, longueur 2, valeur "CI" (pays).
 */

export interface EmvcoTag {
  tag: string;
  value: string;
  /** Sous-blocs, uniquement pour les tags "template" (26 à 51, 62). */
  children?: EmvcoTag[];
}

const TEMPLATE_TAG_RANGE = { min: 26, max: 51 };
const ADDITIONAL_DATA_TAG = '62';

function isTemplateTag(tag: string): boolean {
  const numeric = Number(tag);
  return (numeric >= TEMPLATE_TAG_RANGE.min && numeric <= TEMPLATE_TAG_RANGE.max) || tag === ADDITIONAL_DATA_TAG;
}

/** Découpe une chaîne EMVCo en blocs Tag/Length/Value, un niveau à la fois. */
export function parseTlv(data: string): EmvcoTag[] {
  const tags: EmvcoTag[] = [];
  let cursor = 0;

  while (cursor < data.length) {
    if (cursor + 4 > data.length) {
      // Reste trop court pour contenir un tag+longueur valides : on arrête proprement.
      break;
    }
    const tag = data.slice(cursor, cursor + 2);
    const lengthStr = data.slice(cursor + 2, cursor + 4);
    const length = Number(lengthStr);
    if (!/^\d{2}$/.test(tag) || Number.isNaN(length)) {
      break;
    }
    const valueStart = cursor + 4;
    const value = data.slice(valueStart, valueStart + length);
    const entry: EmvcoTag = { tag, value };
    if (isTemplateTag(tag)) {
      entry.children = parseTlv(value);
    }
    tags.push(entry);
    cursor = valueStart + length;
  }

  return tags;
}

function findTag(tags: EmvcoTag[], tag: string): EmvcoTag | undefined {
  return tags.find((t) => t.tag === tag);
}

export interface EmvcoPayment {
  raw: string;
  tags: EmvcoTag[];
  payloadFormatIndicator?: string;
  merchantName?: string;
  merchantCity?: string;
  countryCode?: string;
  currency?: string;
  amount?: string;
  /** Identifiants (GUID) trouvés dans les blocs marchands 26-51, utiles pour reconnaître l'opérateur. */
  merchantAccountGuids: string[];
}

/**
 * Vérifie qu'une chaîne ressemble à un QR de paiement EMVCo valide
 * (elle doit au minimum commencer par le tag 00 "Payload Format Indicator").
 */
export function looksLikeEmvco(raw: string): boolean {
  return /^00\d{2}/.test(raw);
}

/** Codes ISO 4217 les plus utiles pour l'Afrique de l'Ouest francophone. */
const CURRENCY_CODES: Record<string, string> = {
  '952': 'FCFA', // XOF
};

/** Transforme un montant EMVCo brut ("1500") en texte lisible ("1 500 FCFA"). */
export function formatEmvcoAmount(amount?: string, currencyCode?: string): string | undefined {
  if (!amount) return undefined;
  const numeric = Number(amount);
  // toLocaleString('fr-FR') insère une espace fine insécable (U+202F) entre les
  // milliers ; certaines polices Android l'affichent mal, on la remplace par
  // une espace normale pour un rendu fiable sur tous les téléphones.
  const formattedNumber = Number.isFinite(numeric)
    ? numeric.toLocaleString('fr-FR').replace(/ /g, ' ')
    : amount;
  const unit = currencyCode ? CURRENCY_CODES[currencyCode] : undefined;
  return unit ? `${formattedNumber} ${unit}` : formattedNumber;
}

export function parseEmvcoPayment(raw: string): EmvcoPayment {
  const tags = parseTlv(raw);

  const merchantAccountGuids: string[] = [];
  for (const tag of tags) {
    const numeric = Number(tag.tag);
    if (numeric >= TEMPLATE_TAG_RANGE.min && numeric <= TEMPLATE_TAG_RANGE.max && tag.children) {
      const guid = findTag(tag.children, '00');
      if (guid) merchantAccountGuids.push(guid.value);
    }
  }

  return {
    raw,
    tags,
    payloadFormatIndicator: findTag(tags, '00')?.value,
    merchantName: findTag(tags, '59')?.value,
    merchantCity: findTag(tags, '60')?.value,
    countryCode: findTag(tags, '58')?.value,
    currency: findTag(tags, '53')?.value,
    amount: findTag(tags, '54')?.value,
    merchantAccountGuids,
  };
}
