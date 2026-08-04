/**
 * Bouchon JS de `react-native-keyboard-controller` pour Expo Go.
 * Le vrai module est natif. Ici : le fournisseur laisse passer ses enfants,
 * et la vue "qui remonte avec le clavier" devient un simple defilement.
 * Limite assumee : le clavier peut masquer un champ de saisie.
 *
 * Actif UNIQUEMENT quand EXPO_PUBLIC_GO=1 (voir metro.config.js).
 */
const React = require('react');
const { ScrollView, View } = require('react-native');

// Props propres au vrai module, que ScrollView ne comprend pas.
const OWN_PROPS = new Set([
  'bottomOffset',
  'extraKeyboardSpace',
  'disableScrollOnKeyboardHide',
  'enabled',
  'ScrollViewComponent',
  'snapToOffsets',
]);

function stripOwnProps(props) {
  const out = {};
  for (const key of Object.keys(props)) {
    if (!OWN_PROPS.has(key))
      out[key] = props[key];
  }
  return out;
}

const KeyboardAwareScrollView = React.forwardRef((props, ref) =>
  React.createElement(ScrollView, { ref, ...stripOwnProps(props) }));
KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

const passthrough = name => {
  const Component = React.forwardRef(({ children, ...rest }, ref) =>
    React.createElement(View, { ref, ...stripOwnProps(rest) }, children));
  Component.displayName = name;
  return Component;
};

const noopEvent = { height: 0, progress: 0, duration: 0, target: -1, type: 'default' };

module.exports = {
  KeyboardProvider: ({ children }) => children,
  KeyboardAwareScrollView,
  KeyboardAvoidingView: passthrough('KeyboardAvoidingView'),
  KeyboardStickyView: passthrough('KeyboardStickyView'),
  KeyboardToolbar: () => null,
  KeyboardGestureArea: passthrough('KeyboardGestureArea'),
  OverKeyboardView: passthrough('OverKeyboardView'),
  KeyboardController: {
    setInputMode: () => {},
    setDefaultMode: () => {},
    dismiss: () => Promise.resolve(),
    setFocusTo: () => {},
    isVisible: () => false,
    state: () => null,
  },
  KeyboardEvents: { addListener: () => ({ remove: () => {} }) },
  FocusedInputEvents: { addListener: () => ({ remove: () => {} }) },
  useKeyboardHandler: () => {},
  useKeyboardContext: () => ({ animated: {}, reanimated: {}, layout: {} }),
  useReanimatedKeyboardAnimation: () => ({ height: { value: 0 }, progress: { value: 0 } }),
  useKeyboardAnimation: () => ({ height: { value: 0 }, progress: { value: 0 } }),
  useKeyboardState: () => noopEvent,
  useFocusedInputHandler: () => {},
  useResizeMode: () => {},
  useGenericKeyboardHandler: () => {},
  AndroidSoftInputModes: {
    SOFT_INPUT_ADJUST_NOTHING: 48,
    SOFT_INPUT_ADJUST_PAN: 32,
    SOFT_INPUT_ADJUST_RESIZE: 16,
  },
};
