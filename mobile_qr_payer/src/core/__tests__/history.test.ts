import { buildHistoryEntry } from '../history';
import { buildSampleEmvcoQr } from './fixtures';

describe('buildHistoryEntry', () => {
  it('associe un lien Wave au bon opérateur, sans marchand/montant EMVCo', () => {
    const raw = 'https://pay.wave.com/m/M_ci_ABC123/c/ci';
    const entry = buildHistoryEntry({ raw });
    expect(entry.providerId).toBe('wave');
    expect(entry.providerLabel).toBe('Wave');
    expect(entry.raw).toBe(raw);
    expect(entry.merchantName).toBeUndefined();
    expect(entry.amount).toBeUndefined();
  });

  it('reprend le marchand et le montant formaté pour un QR EMVCo Orange Money', () => {
    const raw = buildSampleEmvcoQr('ORANGE MONEY KIOSK');
    const entry = buildHistoryEntry({ raw });
    expect(entry.providerId).toBe('orange_money');
    expect(entry.merchantName).toBe('ORANGE MONEY KIOSK');
    expect(entry.amount).toBe('1 500 FCFA');
  });

  it("marque 'unknown' un texte qui n'est reconnu par aucun opérateur", () => {
    const entry = buildHistoryEntry({ raw: 'bonjour le monde' });
    expect(entry.providerId).toBe('unknown');
    expect(entry.providerLabel).toBe('QR non reconnu');
  });

  it('donne un identifiant différent à chaque appel', () => {
    const a = buildHistoryEntry({ raw: 'bonjour' });
    const b = buildHistoryEntry({ raw: 'bonjour' });
    expect(a.id).not.toBe(b.id);
  });
});
