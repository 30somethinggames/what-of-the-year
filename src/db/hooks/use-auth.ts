import { useMutation } from "@tanstack/react-query";
import { signInAnonymously } from "firebase/auth";

import { auth } from "db/config";

export function useAuth() {
  return useMutation({
    mutationFn: async () => {
      if (!auth.currentUser) await signInAnonymously(auth);
      if (!auth.currentUser) throw new Error("Failed to sign in");
      return auth.currentUser;
    },
  });
}
