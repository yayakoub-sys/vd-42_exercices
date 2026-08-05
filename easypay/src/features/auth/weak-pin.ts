/**
 * Refus des codes secrets trop faibles.
 *
 * L'inscription acceptait n'importe quel code à 4 chiffres, y compris 0000 et
 * 1234 (ETAT.md § 9.4). Sur une application qui donne accès à de l'argent,
 * c'est le seul contrôle qui protège vraiment : un voleur de téléphone essaie
 * ces codes-là en premier, et il n'en essaie pas dix.
 *
 * On refuse trois familles, celles qui reviennent dans tous les relevés de
 * codes réellement utilisés :
 *   - les quatre chiffres identiques  (0000, 1111, …)
 *   - les suites, montantes ou descendantes  (1234, 4321, 0123, 9876…)
 *   - une courte liste de classiques  (1212, 2580 — la colonne du milieu,
 *     0007, 1004…)
 *
 * On ne va pas plus loin volontairement : trop de règles poussent les gens à
 * écrire leur code sur un papier, ce qui est pire.
 */

const CLASSIQUES = new Set([
  '1212',
  '2580',
  '0007',
  '1004',
  '2000',
  '2020',
  '1122',
  '6969',
  '1313',
  '4444',
]);

export type VerdictPin = { accepte: true } | { accepte: false; raison: string };

export function verifierForcePin(code: string): VerdictPin {
  if (!/^\d{4}$/.test(code)) {
    return { accepte: false, raison: 'Le code doit faire exactement 4 chiffres.' };
  }

  if (/^(\d)\1{3}$/.test(code)) {
    return {
      accepte: false,
      raison: 'Quatre fois le même chiffre, c\'est trop facile à deviner.',
    };
  }

  const chiffres = [...code].map(Number);
  const monte = chiffres.every((n, i) => i === 0 || n === (chiffres[i - 1] + 1) % 10);
  const descend = chiffres.every((n, i) => i === 0 || n === (chiffres[i - 1] + 9) % 10);
  if (monte || descend) {
    return {
      accepte: false,
      raison: 'Une suite de chiffres, c\'est le premier code qu\'on essaie.',
    };
  }

  if (CLASSIQUES.has(code)) {
    return {
      accepte: false,
      raison: 'Ce code est trop courant. Choisis-en un autre.',
    };
  }

  return { accepte: true };
}
