import { useState } from "react";

import { Header } from "components/header";
import { SettingsButton } from "components/settings-button";
import { Sidebar } from "components/sidebar";
import type { SessionID } from "db/types";

interface Props {
  title: string;
  sessionId: SessionID;
}

export function GameHeader({ title, sessionId }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        sessionId={sessionId}
        handleClose={() => setSidebarOpen(false)}
      />

      <div className="flex items-baseline justify-between px-md py-md">
        <SettingsButton onClick={() => setSidebarOpen(true)} />
        <Header title={title} />
        <div className="w-10" />
      </div>
    </>
  );
}
