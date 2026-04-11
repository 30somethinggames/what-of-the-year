import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useToast } from "components/toast";
import { SessionStatus } from "convex/constants";
import type { Session } from "db/types";

interface Args {
  isHost: boolean;
  session: Session | null;
}

export function useGameOver({ isHost, session }: Args) {
  const navigate = useNavigate();
  const { show } = useToast();

  useEffect(() => {
    if (!isHost && session?.status === SessionStatus.ENDED) {
      navigate({ to: "/", replace: true });
      show({ variant: "error", message: "The host ended the game." });
    }
  }, [session?.status, isHost]);
}
