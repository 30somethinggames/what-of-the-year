import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

import { WebContainer } from "components/web-container";
import { DEFAULT_STALE_TIME } from "queries/utils";
import { ThemeProvider } from "utils/theme";

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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WebContainer>
          <Stack
            screenOptions={{
              headerBackButtonDisplayMode: "minimal",
              headerShadowVisible: false,
              headerStyle: { backgroundColor: "#f1efea" },
            }}
          />
        </WebContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
