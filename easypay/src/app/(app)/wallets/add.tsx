import { useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';
import { couleurOperateur } from '@/components/ui/theme';
import { OPERATOR_LIST } from '@/core/wallet-engine/operators';

/**
 * CHOIX DE L'OPÉRATEUR — porté depuis BlueWallet `screen/wallets/Add.tsx`
 * (licence MIT, voir LICENSE-BLUEWALLET).
 *
 * Le donneur présente les types de portefeuille en grandes tuiles colorées,
 * pas en liste grise : la couleur est ce qui permet de reconnaître ce qu'on
 * choisit sans lire. Ici la couleur est celle de l'opérateur réel — Wave est
 * cyan, Orange Money est orange — donc l'utilisateur retrouve la couleur
 * qu'il connaît déjà de l'application d'origine.
 *
 * RETIRÉ : portefeuille Bitcoin / Lightning / multisig, import d'une phrase
 * de récupération, portefeuille en lecture seule.
 */
export default function AddWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View className="px-5 pb-6">
          <Text className="text-2xl font-bold">Quel compte veux-tu relier ?</Text>
          <Text className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
            Choisis l'opérateur mobile money que tu utilises. Tu pourras en
            relier plusieurs.
          </Text>
        </View>

        <View className="flex-row flex-wrap px-3">
          {OPERATOR_LIST.map((operateur) => {
            const { fond, texte } = couleurOperateur(operateur.id);
            return (
              <View key={operateur.id} className="w-1/2 p-2">
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/wallets/add-phone',
                      params: { operator: operateur.id },
                    })}
                  accessibilityRole="button"
                  accessibilityLabel={`Relier ${operateur.label}`}
                  className="h-[128px] justify-between overflow-hidden rounded-2xl p-4 active:opacity-80"
                  style={{ backgroundColor: fond }}
                >
                  <View
                    className="size-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
                  >
                    <Text style={{ color: texte, fontSize: 20, fontWeight: '700' }}>
                      {operateur.label.charAt(0)}
                    </Text>
                  </View>
                  <Text style={{ color: texte, fontSize: 17, fontWeight: '700' }} numberOfLines={2}>
                    {operateur.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
