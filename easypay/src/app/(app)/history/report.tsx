import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Alert } from 'react-native';

import { Button, Input, Text, View } from '@/components/ui';

export default function ReportTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = React.useState('');

  const onSend = React.useCallback(() => {
    Alert.alert('Merci', 'Ton signalement a été enregistré.');
    router.back();
  }, [router]);

  return (
    <View className="flex-1 bg-white px-4 pt-4 dark:bg-black">
      <Text className="mb-2 text-lg font-bold">Signaler un problème sur cette transaction</Text>
      <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        Décris ce qui n'a pas marché. On va regarder ça.
      </Text>
      <Input
        multiline
        numberOfLines={5}
        value={message}
        onChangeText={setMessage}
        placeholder="Explique ton problème ici..."
        style={{ height: 120, textAlignVertical: 'top' }}
        testID={`report-input-${id ?? ''}`}
      />
      <Button label="Envoyer" onPress={onSend} className="mt-4" />
    </View>
  );
}
