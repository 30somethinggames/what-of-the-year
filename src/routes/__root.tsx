import { Outlet, createRootRoute, useParams } from "@tanstack/react-router";

import { ToastProvider } from "components/toast";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const params = useParams({ strict: false }) as { topic?: string };
  const topic = params.topic;

  return (
    <div className="flex h-full justify-center">
      <div
        className="relative flex h-full w-full max-w-107.5 flex-col overflow-x-hidden bg-white-100 shadow-md"
        data-topic={topic}
      >
        <ToastProvider>
          <Outlet />
        </ToastProvider>
      </div>
    </div>
  );
}
