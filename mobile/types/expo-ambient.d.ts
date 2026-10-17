/**
 * Safe Expo ambient types for `tsc`.
 *
 * Do not reference `expo/types` wholesale: that pulls `react-native-web.d.ts`,
 * which augments `ViewStyle` / `TextStyle` as interfaces. In RN 0.87 those names
 * are type aliases (`____ViewStyle_Internal`), so the augmentation shadows the
 * real style types and breaks StyleProp assignability under TypeScript 6.
 *
 * `expo-env.d.ts` is generated/gitignored and may reintroduce `expo/types`;
 * keep this file in `tsconfig` `include` and omit `expo-env.d.ts`.
 */
/// <reference types="expo-modules-core/types" />
/// <reference types="expo/types/global" />
/// <reference types="expo/types/metro-require" />
