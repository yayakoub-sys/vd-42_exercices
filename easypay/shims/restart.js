/**
 * Bouchon JS de `react-native-restart` pour Expo Go.
 * Le vrai module relance l'application (code natif). Ici : sans effet.
 * Limite assumee : changer de langue ne relancera pas l'app toute seule.
 *
 * Actif UNIQUEMENT quand EXPO_PUBLIC_GO=1 (voir metro.config.js).
 */
const RNRestart = {
  restart: () => {},
  Restart: () => {},
};

module.exports = RNRestart;
module.exports.default = RNRestart;
