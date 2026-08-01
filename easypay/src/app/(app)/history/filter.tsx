import { useRouter } from 'expo-router';
import * as React from 'react';

import { Button, ScrollView, Text, TouchableOpacity, View } from '@/components/ui';
import { OPERATOR_LIST } from '@/core/wallet-engine/operators';
import type { OperatorId } from '@/core/wallet-engine/types';

type StatusFilter = 'all' | 'success' | 'failed';
type OperatorFilter = 'all' | OperatorId;

function ChoiceChip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={
        isSelected
          ? 'mb-3 mr-3 rounded-full bg-primary-800 px-4 py-2'
          : 'mb-3 mr-3 rounded-full border border-neutral-300 px-4 py-2 dark:border-neutral-600'
      }
    >
      <Text className={isSelected ? 'text-sm font-semibold text-white' : 'text-sm font-semibold'}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function HistoryFilterScreen() {
  const router = useRouter();
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [operator, setOperator] = React.useState<OperatorFilter>('all');

  return (
    <View className="flex-1 bg-white px-4 pt-4 dark:bg-black">
      <Text className="mb-2 text-lg font-bold">Statut</Text>
      <View className="mb-6 flex-row flex-wrap">
        <ChoiceChip label="Tous" isSelected={status === 'all'} onPress={() => setStatus('all')} />
        <ChoiceChip label="Réussis" isSelected={status === 'success'} onPress={() => setStatus('success')} />
        <ChoiceChip label="Échoués" isSelected={status === 'failed'} onPress={() => setStatus('failed')} />
      </View>

      <Text className="mb-2 text-lg font-bold">Opérateur source</Text>
      <ScrollView className="mb-6">
        <View className="flex-row flex-wrap">
          <ChoiceChip label="Tous" isSelected={operator === 'all'} onPress={() => setOperator('all')} />
          {OPERATOR_LIST.map((op) => (
            <ChoiceChip
              key={op.id}
              label={op.label}
              isSelected={operator === op.id}
              onPress={() => setOperator(op.id)}
            />
          ))}
        </View>
      </ScrollView>

      <Button label="Appliquer" onPress={() => router.back()} />
    </View>
  );
}
