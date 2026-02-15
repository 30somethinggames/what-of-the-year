import { Stack } from "expo-router";

import { Home } from "screens/home";

export default function Index() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Home />
    </>
  );
}
