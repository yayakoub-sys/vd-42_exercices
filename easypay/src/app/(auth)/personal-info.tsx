import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  Input,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { formaterSaisieDate, verifierDateNaissance } from '@/features/auth/birth-date';
import { saveKycInfo } from '@/storage/kycState';

const ID_DOCUMENT_TYPES = [
  { value: 'CNI', label: 'CNI' },
  { value: 'Passeport', label: 'Passeport' },
  { value: 'Attestation d\'identité', label: 'Attestation d\'identité' },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [birthDate, setBirthDate] = React.useState('');
  const [idDocumentType, setIdDocumentType] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onContinue = async () => {
    if (!fullName.trim() || !birthDate.trim() || !idDocumentType) {
      setError('Remplis tous les champs pour continuer.');
      return;
    }
    // La date etait un TEXTE LIBRE : ni format, ni date reelle, ni age minimum
    // (ETAT.md § 9.4). On pouvait naitre en 2050. Sur un produit financier,
    // l'age n'est pas un detail de formulaire.
    const verdict = verifierDateNaissance(birthDate);
    if (!verdict.valide) {
      setError(verdict.raison);
      return;
    }
    setError('');
    setLoading(true);
    await saveKycInfo({ fullName: fullName.trim(), birthDate, idDocumentType });
    setLoading(false);
    router.push('/(auth)/kyc-status');
  };

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mt-4 mb-2 text-2xl font-bold">
        Tes informations
      </Text>
      <Text className="mb-6 text-base text-gray-600 dark:text-neutral-400">
        On a besoin de ces informations pour vérifier que c'est bien toi.
      </Text>
      <Input
        label="Nom complet"
        placeholder="Ex : Aya Koffi"
        value={fullName}
        onChangeText={setFullName}
        testID="personal-info-fullname-input"
      />
      <Input
        label="Date de naissance"
        placeholder="JJ/MM/AAAA"
        keyboardType="number-pad"
        value={birthDate}
        // Met en forme au fil de la frappe : 15031990 devient 15/03/1990.
        onChangeText={v => setBirthDate(formaterSaisieDate(v))}
        maxLength={10}
        testID="personal-info-birthdate-input"
      />
      <Text className="text-grey-100 mb-2 text-lg dark:text-neutral-100">
        Type de pièce d'identité
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {ID_DOCUMENT_TYPES.map(doc => (
          <Pressable
            key={doc.value}
            onPress={() => setIdDocumentType(doc.value)}
            className={`rounded-xl border px-4 py-3 ${
              idDocumentType === doc.value
                ? 'border-primary-800 bg-primary-800 dark:border-primary-600 dark:bg-primary-600'
                : 'border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
            }`}
            testID={`personal-info-doc-${doc.value}`}
          >
            <Text
              className={
                idDocumentType === doc.value
                  ? 'font-medium text-white'
                  : 'font-medium text-black dark:text-white'
              }
            >
              {doc.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {error
        ? (
            <Text className="mb-2 text-sm text-danger-600">
              {error}
            </Text>
          )
        : null}
      <SafeAreaView className="mt-auto w-full">
        <Button
          label="Continuer"
          onPress={onContinue}
          loading={loading}
          testID="personal-info-continue-button"
        />
      </SafeAreaView>
    </View>
  );
}
