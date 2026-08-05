import { buildSampleEmvcoQr } from '../../__tests__/fixtures';
import { genericEmvcoProvider } from '../genericEmvco';
import { orangeMoneyProvider } from '../orangeMoney';
import { resolveProvider } from '../registry';
import { waveProvider } from '../wave';

describe('resolveProvider', () => {
  it('reconnaît un QR marchand Wave', () => {
    const provider = resolveProvider({ raw: 'https://pay.wave.com/m/M_ci_ABC123/c/ci' });
    expect(provider).toBe(waveProvider);
  });

  it('reconnaît aussi les liens wave.com sans sous-domaine pay.', () => {
    const provider = resolveProvider({ raw: 'https://wave.com/pay/xyz' });
    expect(provider).toBe(waveProvider);
  });

  it('reconnaît un QR EMVCo dont le marchand mentionne Orange', () => {
    const provider = resolveProvider({ raw: buildSampleEmvcoQr('ORANGE MONEY KIOSK PLATEAU') });
    expect(provider).toBe(orangeMoneyProvider);
  });

  it('retombe sur le fournisseur générique pour un EMVCo non identifié', () => {
    const provider = resolveProvider({ raw: buildSampleEmvcoQr('BOUTIQUE KOUAME') });
    expect(provider).toBe(genericEmvcoProvider);
  });

  it('ne reconnaît rien pour un texte qui n\'est ni un lien Wave ni un paiement EMVCo', () => {
    const provider = resolveProvider({ raw: 'bonjour le monde' });
    expect(provider).toBeUndefined();
  });
});

describe('waveProvider.getAction', () => {
  it('ouvre directement le lien Wave, avec une confiance confirmée', () => {
    const raw = 'https://pay.wave.com/m/M_ci_ABC123/c/ci';
    const action = waveProvider.getAction({ raw });
    expect(action).toEqual({ type: 'deeplink', url: raw, confidence: 'confirmed' });
  });
});

describe('orangeMoneyProvider.getAction', () => {
  it('propose un lien best-effort avec un repli vers le store', () => {
    const action = orangeMoneyProvider.getAction({ raw: buildSampleEmvcoQr('ORANGE MONEY') });
    expect(action.type).toBe('deeplink');
    if (action.type === 'deeplink') {
      expect(action.confidence).toBe('best_effort');
      expect(action.storeFallback?.android).toContain('play.google.com');
    }
  });
});
