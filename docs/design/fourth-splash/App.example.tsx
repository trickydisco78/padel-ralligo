// Example root file. With Expo Router this is app/_layout.tsx; without it, App.tsx.
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold, useFonts } from '@expo-google-fonts/outfit';
import { AnimatedSplash } from './AnimatedSplash';

// Keep the native splash (plain pink, see SPLASH-SETUP.md) up until our animated one is on screen.
// Call this in global scope, not inside a component.
SplashScreen.preventAutoHideAsync();

export default function Root() {
  const [fontsLoaded] = useFonts({ Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold });
  const [dataReady, setDataReady] = useState(false); // your real loading: session, first request...
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Replace with real work, e.g. restore the signed-in user and fetch the first screen's data.
    const id = setTimeout(() => setDataReady(true), 500);
    return () => clearTimeout(id);
  }, []);

  // The animated splash is on screen, so the native one can go.
  const hideNative = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  const onFinish = useCallback(() => setSplashDone(true), []);

  if (!fontsLoaded) return null; // native splash is still showing

  return (
    <View style={{ flex: 1 }}>
      {/* <Stack /> or <NavigationContainer>...</NavigationContainer> */}
      {!splashDone && <AnimatedSplash ready={dataReady} onShown={hideNative} onFinish={onFinish} />}
    </View>
  );
}
