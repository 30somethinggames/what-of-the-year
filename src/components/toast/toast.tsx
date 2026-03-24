import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import type { ToastVariant } from "./toast-provider";

const DISMISS_MS = 3000;
const TOAST_GAP = 8;
const TOAST_HEIGHT = 56;
const TOP_INSET = 16;

const ACCENT_COLORS: Record<ToastVariant, string> = {
  info: "var(--color-blue-100)",
  success: "var(--color-green-100)",
  error: "var(--color-red-100)",
};

interface Props {
  id: string;
  message: string;
  variant: ToastVariant;
  index: number;
  onRemove: (id: string) => void;
}

export function Toast({ id, message, variant, index, onRemove }: Props) {
  const [dismissing, setDismissing] = useState(false);
  const targetTop = TOP_INSET + TOAST_GAP + index * (TOAST_HEIGHT + TOAST_GAP);

  useEffect(() => {
    const timeout = setTimeout(() => setDismissing(true), DISMISS_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={dismissing ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 60, stiffness: 400 }}
      onAnimationComplete={() => {
        if (dismissing) onRemove(id);
      }}
      className="pointer-events-auto absolute left-md right-md flex min-h-14 flex-row items-center rounded-lg bg-white-200 shadow-md"
      style={{
        top: targetTop,
        borderLeftWidth: 4,
        borderLeftColor: ACCENT_COLORS[variant],
      }}
    >
      <span className="flex-1 px-md py-md font-medium text-md text-black-100">{message}</span>
    </motion.div>
  );
}
