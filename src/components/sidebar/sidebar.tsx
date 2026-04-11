import { AnimatePresence, motion } from "framer-motion";

import { SidebarContent, type SidebarContentProps } from "./sidebar-content";

interface Props extends SidebarContentProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen, handleClose, sessionId, topic, year }: Props) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black-100/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-white-100 shadow-lg"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <SidebarContent
              sessionId={sessionId}
              topic={topic}
              year={year}
              handleClose={handleClose}
            />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
