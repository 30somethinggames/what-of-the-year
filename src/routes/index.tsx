import { createFileRoute } from "@tanstack/react-router";

import { Home } from "screens/home";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <div className="flex h-full w-full max-w-140 flex-col overflow-x-hidden bg-white-100 shadow-md">
      <Home />
    </div>
  );
}
