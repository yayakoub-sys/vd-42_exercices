const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: './src/global.css',
});

/**
 * Poste de developpement : 7,8 Go de memoire, 6 coeurs physiques (i5-10400T).
 *
 * Par defaut Metro lance un processus de compilation par coeur. Pendant qu'un
 * emulateur Android tourne (2 Go en memoire vive, 4 Go engages), la memoire
 * disponible tombe a zero et la machine se met a permuter sur le disque : la
 * compilation devient PLUS lente, et les requetes de l'application expirent
 * avant d'avoir recu le bundle.
 *
 * Mesure du 2026-08-04 : avec 3 processus, l'emulateur a ete tue par manque de
 * memoire DEUX FOIS de suite pendant la premiere compilation (rapports de
 * plantage a 18:59 et 19:19, `free_ram` a 427 Mo). Deux processus reduisent le
 * pic sans changer grand-chose au temps de compilation, qui est domine par le
 * cache disque.
 *
 * Le processeur n'est PAS le facteur limitant ici : il plafonne a 15 % au repos
 * et les 6 coeurs ne sont jamais satures. C'est la memoire qui manque.
 */
config.maxWorkers = 2;

/**
 * Mode "visite dans Expo Go" (EXPO_PUBLIC_GO=1).
 *
 * Expo Go ne contient pas les modules natifs ci-dessous. On les remplace par
 * des bouchons JS le temps d'une visite des ecrans. Sans cette variable
 * d'environnement, le projet se comporte exactement comme avant.
 */
const GO_SHIMS = {
  'react-native-mmkv': path.resolve(__dirname, 'shims/mmkv.js'),
  'react-native-keyboard-controller': path.resolve(__dirname, 'shims/keyboard-controller.js'),
  'react-native-restart': path.resolve(__dirname, 'shims/restart.js'),
};

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (process.env.EXPO_PUBLIC_GO === '1' && GO_SHIMS[moduleName]) {
    return { type: 'sourceFile', filePath: GO_SHIMS[moduleName] };
  }
  return previousResolveRequest
    ? previousResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
