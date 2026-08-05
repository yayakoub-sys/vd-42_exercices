/**
 * Contrôle de la date de naissance à l'inscription.
 *
 * Le champ était un TEXTE LIBRE : ni format, ni date réelle, ni âge minimum
 * (ETAT.md § 9.4). On pouvait s'inscrire avec « bonjour » comme date de
 * naissance, ou naître en 2050.
 *
 * Sur un produit financier, l'âge n'est pas un détail de formulaire :
 * l'ouverture d'un compte de paiement est réservée aux majeurs.
 */

const AGE_MINIMUM = 18;
const AGE_MAXIMUM_PLAUSIBLE = 120;

export type VerdictDate
  = | { valide: true; iso: string }
    | { valide: false; raison: string };

/** Met en forme au fil de la frappe : 15031990 → « 15/03/1990 ». */
export function formaterSaisieDate(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, '').slice(0, 8);
  if (chiffres.length <= 2)
    return chiffres;
  if (chiffres.length <= 4)
    return `${chiffres.slice(0, 2)}/${chiffres.slice(2)}`;
  return `${chiffres.slice(0, 2)}/${chiffres.slice(2, 4)}/${chiffres.slice(4)}`;
}

export function verifierDateNaissance(saisie: string): VerdictDate {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(saisie.trim());
  if (!m) {
    return { valide: false, raison: 'Écris la date comme ceci : JJ/MM/AAAA.' };
  }

  const jour = Number(m[1]);
  const mois = Number(m[2]);
  const annee = Number(m[3]);

  const date = new Date(annee, mois - 1, jour);
  // Une date comme le 31/02 « existe » en JavaScript : elle glisse au 3 mars.
  // On verifie donc que la date relue est bien celle qui a ete saisie.
  const reelle
    = date.getFullYear() === annee
      && date.getMonth() === mois - 1
      && date.getDate() === jour;
  if (!reelle) {
    return { valide: false, raison: 'Cette date n\'existe pas.' };
  }

  const aujourdhui = new Date();
  if (date > aujourdhui) {
    return { valide: false, raison: 'Cette date est dans le futur.' };
  }

  let age = aujourdhui.getFullYear() - annee;
  const anniversairePasse
    = aujourdhui.getMonth() > mois - 1
      || (aujourdhui.getMonth() === mois - 1 && aujourdhui.getDate() >= jour);
  if (!anniversairePasse)
    age -= 1;

  if (age < AGE_MINIMUM) {
    return {
      valide: false,
      raison: `Il faut avoir ${AGE_MINIMUM} ans pour ouvrir un compte EasyPay.`,
    };
  }
  if (age > AGE_MAXIMUM_PLAUSIBLE) {
    return { valide: false, raison: 'Vérifie l\'année : elle semble erronée.' };
  }

  const mm = String(mois).padStart(2, '0');
  const jj = String(jour).padStart(2, '0');
  return { valide: true, iso: `${annee}-${mm}-${jj}` };
}
