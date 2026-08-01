import * as React from 'react';

import { FocusAwareStatusBar, Pressable, ScrollView, Text, View } from '@/components/ui';

const FAQ = [
  {
    question: 'Comment lier un nouveau portefeuille ?',
    answer:
      'Va dans l\'onglet "Portefeuilles", appuie sur "+ Ajouter", choisis ton opérateur et entre le numéro à lier. C\'est tout.',
  },
  {
    question: 'Que faire si un paiement échoue ?',
    answer:
      'Vérifie ton solde chez ton opérateur puis réessaie. Si ça échoue encore, regarde le détail dans "Historique" ou contacte le support.',
  },
  {
    question: 'EasyPay garde-t-il mon argent ?',
    answer:
      'Non, EasyPay ne fait que transmettre ton paiement, il ne garde jamais ton argent.',
  },
  {
    question: 'Pourquoi EasyPay me demande-t-il une pièce d\'identité ?',
    answer:
      'C\'est pour vérifier que c\'est bien toi qui payes, afin de protéger ton compte contre les paiements frauduleux.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Pressable
      onPress={() => setOpen(o => !o)}
      className="border-b border-neutral-200 py-4 dark:border-neutral-700"
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 pr-4 text-base font-medium">{question}</Text>
        <Text className="text-neutral-400">{open ? '−' : '+'}</Text>
      </View>
      {open
        ? (
            <Text className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{answer}</Text>
          )
        : null}
    </Pressable>
  );
}

export default function HelpScreen() {
  return (
    <ScrollView>
      <View className="flex-1 px-4 pt-4">
        <FocusAwareStatusBar />
        {FAQ.map(item => (
          <FaqItem key={item.question} question={item.question} answer={item.answer} />
        ))}
      </View>
    </ScrollView>
  );
}
