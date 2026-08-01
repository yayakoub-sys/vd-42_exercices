import * as React from 'react';
import { Switch } from 'react-native';

import { colors, FocusAwareStatusBar, Text, View } from '@/components/ui';

function Row({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 py-4 dark:border-neutral-700">
      <Text className="flex-1 pr-4 text-base">{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary[800] }} />
    </View>
  );
}

export default function NotificationsScreen() {
  const [paymentConfirmations, setPaymentConfirmations] = React.useState(true);
  const [newWallets, setNewWallets] = React.useState(true);
  const [news, setNews] = React.useState(false);

  return (
    <View className="flex-1 bg-white px-4 pt-4 dark:bg-black">
      <FocusAwareStatusBar />
      <Row
        label="Confirmations de paiement"
        value={paymentConfirmations}
        onValueChange={setPaymentConfirmations}
      />
      <Row
        label="Nouveaux portefeuilles liés"
        value={newWallets}
        onValueChange={setNewWallets}
      />
      <Row label="Actualités EasyPay" value={news} onValueChange={setNews} />
    </View>
  );
}
