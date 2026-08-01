import { useRouter } from 'expo-router';
import * as React from 'react';

import { Button, FocusAwareStatusBar, Input, SafeAreaView, Text, View } from '@/components/ui';
import { getKycProfile, saveKycInfo } from '@/storage/kycState';

export default function EditProfileScreen() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [birthDate, setBirthDate] = React.useState('');
  const [idDocumentType, setIdDocumentType] = React.useState('CNI');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    getKycProfile().then((profile) => {
      setFullName(profile.fullName ?? '');
      setBirthDate(profile.birthDate ?? '');
      setIdDocumentType(profile.idDocumentType ?? 'CNI');
    });
  }, []);

  const onSave = async () => {
    if (!fullName.trim() || !birthDate.trim()) {
      setError('Remplis au moins ton nom et ta date de naissance.');
      return;
    }
    setError('');
    setLoading(true);
    await saveKycInfo({ fullName, birthDate, idDocumentType });
    setLoading(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Input
        label="Nom complet"
        placeholder="Ex : Aya Koffi"
        value={fullName}
        onChangeText={setFullName}
        testID="account-edit-fullname-input"
      />
      <Input
        label="Date de naissance"
        placeholder="JJ/MM/AAAA"
        keyboardType="number-pad"
        value={birthDate}
        onChangeText={setBirthDate}
        testID="account-edit-birthdate-input"
      />
      {error
        ? (
            <Text className="mb-2 text-sm text-danger-600">{error}</Text>
          )
        : null}
      <SafeAreaView className="mt-auto w-full">
        <Button
          label="Enregistrer"
          onPress={onSave}
          loading={loading}
          testID="account-edit-save-button"
        />
      </SafeAreaView>
    </View>
  );
}
