import { useAuthActions } from "@convex-dev/auth/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { Loading } from "components/states/loading";
import { useConvexAuth } from "convex/react";

export const Route = createFileRoute("/$topic")({
  component: TopicLayout,
});

function TopicLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) signIn("anonymous");
  }, [isAuthenticated, isLoading]);

  const { topic } = Route.useParams();

  if (!isAuthenticated) return <Loading />;

  return (
    <div className="flex flex-1 flex-col" data-topic={topic}>
      <Outlet />
    </div>
  );
}
