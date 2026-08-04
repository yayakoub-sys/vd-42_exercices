const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: './src/global.css',
});

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
