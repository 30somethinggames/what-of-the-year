import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getLinkingURL, parse } from "expo-linking";
import { Stack } from "expo-router";

import { WebContainer } from "components/web-container";
import { TOPIC_KEY } from "constants/topics";
import { STALE_TIME } from "queries/utils";
import { ThemeProvider } from "utils/theme";

const VALID_TOPICS = new Set<string>(Object.values(TOPIC_KEY));

function getTopicFromURL(): TOPIC_KEY | undefined {
  const url = getLinkingURL();
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialTheme={getTopicFromURL()}>
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
