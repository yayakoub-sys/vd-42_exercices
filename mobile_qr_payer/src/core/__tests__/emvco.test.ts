import { formatEmvcoAmount, looksLikeEmvco, parseEmvcoPayment, parseTlv } from '../emvco';
import { buildSampleEmvcoQr, tlv } from './fixtures';

describe('parseTlv', () => {
  it('découpe correctement des blocs simples', () => {
    const tags = parseTlv(tlv('00', '01') + tlv('58', 'CI'));
    expect(tags).toEqual([
      { tag: '00', value: '01' },
      { tag: '58', value: 'CI' },
    ]);
  });

  it('découpe récursivement les templates marchands (tags 26-51)', () => {
    const inner = tlv('00', 'A000000001') + tlv('01', 'MERCHANT123');
    const tags = parseTlv(tlv('26', inner));
    expect(tags[0].tag).toBe('26');
    expect(tags[0].children).toEqual([
      { tag: '00', value: 'A000000001' },
      { tag: '01', value: 'MERCHANT123' },
    ]);
  });

  it("ne plante pas sur une chaîne tronquée ou invalide", () => {
    expect(() => parseTlv('abc')).not.toThrow();
    expect(parseTlv('abc')).toEqual([]);
  });
});

describe('looksLikeEmvco', () => {
  it('reconnaît un payload EMVCo valide', () => {
    expect(looksLikeEmvco(buildSampleEmvcoQr('BOUTIQUE'))).toBe(true);
  });

  it('rejette un lien Wave', () => {
    expect(looksLikeEmvco('https://pay.wave.com/m/M_ci_abc/c/ci')).toBe(false);
  });

  it('rejette du texte quelconque', () => {
    expect(looksLikeEmvco('bonjour le monde')).toBe(false);
  });
});

describe('parseEmvcoPayment', () => {
  it('extrait marchand, ville, pays, devise et montant', () => {
    const payment = parseEmvcoPayment(buildSampleEmvcoQr('ARTISAN KOUAME'));
    expect(payment.merchantName).toBe('ARTISAN KOUAME');
    expect(payment.merchantCity).toBe('ABIDJAN');
    expect(payment.countryCode).toBe('CI');
    expect(payment.currency).toBe('952');
    expect(payment.amount).toBe('1500');
  });

  it('remonte les GUID des blocs marchands (tags 26-51)', () => {
    const payment = parseEmvcoPayment(buildSampleEmvcoQr('BOUTIQUE'));
    expect(payment.merchantAccountGuids).toEqual(['A000000001']);
  });
});

describe('formatEmvcoAmount', () => {
  it('convertit le code devise 952 en FCFA', () => {
    expect(formatEmvcoAmount('1500', '952')).toBe('1 500 FCFA');
  });

  it("laisse le montant brut si la devise n'est pas connue", () => {
    expect(formatEmvcoAmount('1500', '840')).toBe('1 500');
  });

  it('renvoie undefined si aucun montant', () => {
    expect(formatEmvcoAmount(undefined, '952')).toBeUndefined();
  });
});
