import * as React from 'react';
import { Alert } from 'react-native';

import { Button, FocusAwareStatusBar, Input, ScrollView, Text, View } from '@/components/ui';

export default function SupportScreen() {
  const [message, setMessage] = React.useState('');

  const onSend = () => {
    if (!message.trim()) {
      Alert.alert('Message vide', 'Décris ton problème avant d\'envoyer.');
      return;
    }
    setMessage('');
    Alert.alert('Message envoyé', 'Merci, notre équipe te répondra rapidement.');
  };

  return (
    <ScrollView>
      <View className="flex-1 px-4 pt-4">
        <FocusAwareStatusBar />

        <View className="rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Email</Text>
          <Text className="mt-1 text-base font-medium">support@easypay.ci</Text>
          <Text className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Téléphone</Text>
          <Text className="mt-1 text-base font-medium">+225 27 20 00 00 00</Text>
        </View>

        <View className="mt-4">
          <Input
            label="Décris ton problème"
            placeholder="Explique-nous ce qui ne va pas..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            testID="support-message-input"
          />
        </View>

        <Button label="Envoyer" onPress={onSend} testID="support-send-button" />
      </View>
    </ScrollView>
  );
}
