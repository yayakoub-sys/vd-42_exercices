import * as React from 'react';
import { AppState } from 'react-native';

import { View } from '@/components/ui';
import { PinPad } from '@/features/auth/pin-pad';
import { getAuthState, verifyPin } from '@/storage/authState';

/**
 * VERROU D'OUVERTURE — porté depuis BlueWallet `screen/UnlockWith.tsx`
 * (licence MIT, voir LICENSE-BLUEWALLET).
 *
 * Le donneur place le déverrouillage AU-DESSUS de toute l'application : tant
 * que le code n'est pas donné, rien du contenu n'est monté ni affiché. C'est
 * la bonne façon de faire — un verrou qui laisse voir l'écran derrière lui
 * n'est pas un verrou.
 *
 * POURQUOI CE COMPOSANT EXISTE
 * ----------------------------
 * L'écran d'inscription promet : « Ce code à 4 chiffres te servira à OUVRIR
 * EASYPAY et à confirmer tes paiements. » La confirmation de paiement est
 * désormais branchée ; l'ouverture ne l'était pas. La promesse est maintenant
 * tenue des deux côtés (ETAT.md § 9.3).
 *
 * RETIRÉ : la biométrie et le déchiffrement du coffre du donneur — EasyPay ne
 * garde pas de clés privées, et la biométrie demanderait une dépendance
 * native de plus.
 *
 * Le verrou se remet aussi quand l'application repasse en arrière-plan : sans
 * ça, un téléphone posé sur une table reste ouvert.
 */

/** En dessous, c'est un simple changement d'application : on ne reverrouille pas. */
const DELAI_REVERROUILLAGE_MS = 30_000;

export function AppLock({ children }: { children: React.ReactNode }) {
  const [codeExiste, setCodeExiste] = React.useState<boolean | undefined>();
  const [deverrouille, setDeverrouille] = React.useState(false);
  const partiDepuis = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    getAuthState().then(etat => setCodeExiste(etat.pinSet));
  }, []);

  React.useEffect(() => {
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'background' || etat === 'inactive') {
        partiDepuis.current = Date.now();
        return;
      }
      if (etat === 'active' && partiDepuis.current !== undefined) {
        const absence = Date.now() - partiDepuis.current;
        partiDepuis.current = undefined;
        if (absence > DELAI_REVERROUILLAGE_MS)
          setDeverrouille(false);
      }
    });
    return () => abonnement.remove();
  }, []);

  // Tant qu'on ne sait pas si un code existe, on n'affiche RIEN : afficher le
  // contenu puis le recouvrir laisserait entrevoir les montants.
  if (codeExiste === undefined) {
    return <View className="flex-1 bg-white dark:bg-black" />;
  }

  // Pas de code défini (inscription non terminée) : rien à verrouiller.
  if (!codeExiste || deverrouille) {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <PinPad
        titre="EasyPay"
        sousTitre="Saisis ton code secret pour ouvrir l'application."
        onValider={async (code) => {
          const ok = await verifyPin(code);
          if (ok)
            setDeverrouille(true);
          return ok;
        }}
      />
    </View>
  );
}
