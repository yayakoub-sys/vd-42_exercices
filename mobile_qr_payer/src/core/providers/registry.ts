import type { PaymentProvider, ScannedQr } from './types';
import { waveProvider } from './wave';
import { orangeMoneyProvider } from './orangeMoney';
import { genericEmvcoProvider } from './genericEmvco';

/**
 * Point unique où on ajoute un nouvel opérateur (MTN Momo, Moov Money, un
 * agrégateur avec vraie API de débit, etc.). L'ordre compte : le premier
 * provider dont `detect()` répond "oui" gagne. `genericEmvcoProvider` doit
 * toujours rester en dernier : c'est le filet de sécurité.
 */
export const providerRegistry: PaymentProvider[] = [waveProvider, orangeMoneyProvider, genericEmvcoProvider];

export function resolveProvider(qr: ScannedQr): PaymentProvider | undefined {
  return providerRegistry.find((provider) => provider.detect(qr));
}
