/**
 * Identifiants (GUID) officiels des opérateurs à l'intérieur d'un QR EMVCo.
 *
 * Ces GUID existent forcément (c'est comme ça que fonctionne le standard EMVCo),
 * mais je n'ai pas pu les vérifier sur un vrai QR Orange Money ou MTN Momo
 * ivoirien (je n'en ai pas eu un sous la main). Dès qu'on scanne un vrai QR,
 * l'appli affiche le GUID trouvé (voir écran résultat, mode "QR non reconnu") :
 * il suffira de le copier ici pour que la reconnaissance devienne fiable à 100 %,
 * au lieu de reposer sur la recherche du mot "orange" dans le nom du marchand.
 */
export const KNOWN_MERCHANT_GUIDS: Record<string, string> = {
  // 'A000000XXXXXX': 'orange_money',
};
