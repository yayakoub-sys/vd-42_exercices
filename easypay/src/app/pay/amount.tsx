import { useRouter } from 'expo-router';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appliquerTouche, NumericKeypad } from '@/components/numeric-keypad';
import { formatAmount } from '@/components/transaction-format';
import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { computeCommission } from '@/core/wallet-engine/mockBackend';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

/**
 * SAISIE DU MONTANT — portée depuis BlueWallet `components/AmountInput.tsx`
 * (licence MIT, voir LICENSE-BLUEWALLET).
 *
 * Le montant s'écrit EN TRÈS GROS au centre, et le pavé reste sous les yeux.
 * Le clavier système recouvrait la moitié de l'écran et cachait justement le
 * montant qu'on tapait.
 *
 * GREFFÉ : la commission est annoncée AVANT de continuer, pas découverte au
 * récapitulatif. Un utilisateur qui découvre des frais après coup se sent
 * piégé, même quand les frais sont justes.
 */
export default function AmountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAmount = usePaymentDraftStore(s => s.setAmount);
  const [saisie, setSaisie] = React.useState('');

  const montant = Number(saisie || '0');
  const commission = montant > 0 ? computeCommission(montant) : 0;

  function continuer() {
    if (montant <= 0)
      return;
    setAmount(montant);
    router.push('/pay/choose-source');
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />

      <View style={{ paddingTop: insets.top + 8 }} className="px-5">
        <Text className="text-2xl font-bold">Combien veux-tu payer ?</Text>
        <Text className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
          Ce QR ne précise pas de montant.
        </Text>
      </View>

      {/* Le montant, en tres gros, toujours visible. */}
      <View className="flex-1 items-center justify-center px-5">
        <View className="flex-row items-baseline">
          <Text
            className={`text-[56px] leading-[60px] font-bold ${
              montant > 0 ? '' : 'text-neutral-300 dark:text-neutral-700'
            }`}
          >
            {montant > 0 ? formatAmount(montant) : '0'}
          </Text>
          <Text className="ml-3 text-2xl font-semibold text-neutral-500 dark:text-neutral-400">
            FCFA
          </Text>
        </View>

        <Text className="mt-3 h-6 text-sm text-neutral-500 dark:text-neutral-400">
          {montant > 0
            ? `+ ${formatAmount(commission)} FCFA de commission · total ${formatAmount(montant + commission)}`
            : ''}
        </Text>
      </View>

      <View style={{ paddingBottom: insets.bottom + 12 }} className="px-5">
        <NumericKeypad onTouche={t => setSaisie(c => appliquerTouche(c, t))} />
        <Button
          label="Continuer"
          onPress={continuer}
          disabled={montant <= 0}
          className="mt-2"
          testID="amount-continue-button"
        />
      </View>
    </View>
  );
}
