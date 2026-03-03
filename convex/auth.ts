import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";

import { query } from "./_generated/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Anonymous],
});

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.auth.getUserIdentity();
  },
});
