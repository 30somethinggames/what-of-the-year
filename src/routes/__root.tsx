import { Outlet, createRootRoute } from "@tanstack/react-router";

import { ToastProvider } from "components/toast";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex h-full justify-center">
      <ToastProvider>
        <div className="flex h-full w-full max-w-140 flex-col overflow-x-hidden bg-white-100 shadow-md">
          <Outlet />
        </div>
      </ToastProvider>
    </div>
  );
}
