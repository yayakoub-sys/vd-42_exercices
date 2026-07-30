import { MD3LightTheme } from 'react-native-paper';

/**
 * Couleurs de l'appli : le même bleu nuit/or que l'icône (voir assets/icon.png),
 * pour que l'interface et l'icône se ressemblent. Basé sur le thème par défaut
 * de React Native Paper (Material Design) — on ne change que l'essentiel.
 */
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2A1B54',
    onPrimary: '#FFFFFF',
    secondary: '#F5B942',
    onSecondary: '#1B1036',
  },
};
