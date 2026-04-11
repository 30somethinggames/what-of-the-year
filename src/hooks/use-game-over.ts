import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SessionStatus } from "convex/constants";
import type { Session } from "db/types";

interface Args {
  isHost: boolean;
  session: Session | null;
}

export function useGameOver({ isHost, session }: Args) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isHost && session?.status === SessionStatus.ENDED) {
      navigate({ to: "/", replace: true });
      window.alert("The host ended the game.");
    }
  }, [session?.status, isHost]);
}
