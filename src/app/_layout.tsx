import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getInitialURL, parse } from "expo-linking";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { WebContainer } from "components/web-container";
import { TOPIC_KEY } from "constants/topics";
import { STALE_TIME } from "queries/utils";
import { ThemeProvider } from "utils/theme";

const VALID_TOPICS = new Set<string>(Object.values(TOPIC_KEY));

// Prevent splash screen from auto-hiding until app is ready
SplashScreen.preventAutoHideAsync().catch((e) => {
  // oxlint-disable-next-line no-console
  console.warn("Failed to prevent splash screen auto-hide:", e);
});

/**
 * when users come from invite link we determine the theme
 */
async function getTopicFromURL(): Promise<TOPIC_KEY | undefined> {
  const url = await getInitialURL();
  if (!url) return undefined;
  const { path } = parse(url);
  const topic = path?.split("/")[0];
  return topic && VALID_TOPICS.has(topic) ? (topic as TOPIC_KEY) : undefined;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: STALE_TIME,
    },
  },
});

export default function Root() {
  useReactQueryDevTools(queryClient);
  const [initialTheme, setInitialTheme] = useState<TOPIC_KEY | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepare() {
      try {
        const topic = await getTopicFromURL();
        if (isMounted) {
          setInitialTheme(topic);
        }
      } catch (e) {
        // oxlint-disable-next-line no-console
        console.warn("Failed to get initial URL:", e);
      } finally {
        if (isMounted) {
          try {
            await SplashScreen.hideAsync();
          } catch (e) {
            // oxlint-disable-next-line no-console
            console.warn("Failed to hide splash screen:", e);
          }
          setIsReady(true);
        }
      }
    }

    prepare();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialTheme={initialTheme}>
        <WebContainer>
          <Stack
            screenOptions={{
              headerBackButtonDisplayMode: "minimal",
              headerShadowVisible: false,
            }}
          />
        </WebContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
