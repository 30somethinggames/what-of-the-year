import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { WebContainer } from "components/web-container";
import { DEFAULT_STALE_TIME } from "queries/constants";
import { palette } from "utils/theme";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: DEFAULT_STALE_TIME,
    },
  },
});

export default function Root() {
  useReactQueryDevTools(queryClient);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ConvexAuthProvider client={convex} storage={AsyncStorage}>
      <QueryClientProvider client={queryClient}>
        <WebContainer>
          <Stack
            screenOptions={{
              headerBackButtonDisplayMode: "minimal",
              headerShadowVisible: false,
              headerStyle: { backgroundColor: palette.white100 },
            }}
          >
            <Stack.Screen
              name="[topic]/[year]/[sessionId]/settings"
              options={{ presentation: "modal", headerShown: false }}
            />
          </Stack>
        </WebContainer>
      </QueryClientProvider>
    </ConvexAuthProvider>
  );
}
