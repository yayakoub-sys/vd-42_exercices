import * as React from 'react';

/**
 * Exécute une action UNE SEULE FOIS, au premier montage.
 *
 * Pourquoi ce petit crochet existe : les écrans de résultat de paiement
 * doivent enregistrer la transaction exactement une fois. La façon rapide
 * d'y arriver est de mettre un tableau de dépendances vide et de désactiver
 * la règle `exhaustive-deps` — mais le compilateur React refuse alors
 * d'optimiser tout le composant, et une règle désactivée finit toujours par
 * masquer un vrai problème.
 *
 * Un verrou explicite dit la même chose, en le disant vraiment.
 */
export function useRunOnce(action: () => void): void {
  const dejaFait = React.useRef(false);
  const derniere = React.useRef(action);
  derniere.current = action;

  React.useEffect(() => {
    if (dejaFait.current)
      return;
    dejaFait.current = true;
    derniere.current();
  }, []);
}
