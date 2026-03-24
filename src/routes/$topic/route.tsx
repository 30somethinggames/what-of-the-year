import { useAuthActions } from "@convex-dev/auth/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useEffect } from "react";

import { Loading } from "components/states/loading";

export const Route = createFileRoute("/$topic")({
  component: TopicLayout,
});

function TopicLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) signIn("anonymous");
  }, [isAuthenticated, isLoading]);

  if (!isAuthenticated) return <Loading />;

  return <Outlet />;
}
