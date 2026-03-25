import { Outlet, createRootRoute, useParams } from "@tanstack/react-router";

import { ToastProvider } from "components/toast";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const params = useParams({ strict: false }) as { topic?: string };
  const topic = params.topic;

  return (
    <div className="flex h-full justify-center" data-topic={topic}>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </div>
  );
}
