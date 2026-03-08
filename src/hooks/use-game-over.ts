import { SessionStatus } from "convex/constants";
import { router } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";

import type { Session } from "db/types";

interface Args {
  isHost: boolean;
  session: Session | null;
}
/**
 * Navigate non-host players home when host ends the game
 */
export function useGameOver({ isHost, session }: Args) {
  useEffect(() => {
    if (!isHost && session?.status === SessionStatus.ENDED) {
      router.replace("/");
      Alert.alert("Game Over", "The host ended the game.");
    }
  }, [session?.status, isHost]);
}
