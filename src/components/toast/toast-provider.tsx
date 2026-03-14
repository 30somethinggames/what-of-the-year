import type { ReactNode } from "react";
import { createContext, useCallback, useMemo, useState } from "react";
import { View } from "react-native";

import { createStyles } from "utils/theme";

import { Toast } from "./toast";

export type ToastVariant = "info" | "success" | "error";

const MAX_TOASTS = 3;

let nextId = 0;

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export const ToastContext = createContext<{
  show: (_obj: { message: string; variant?: ToastVariant }) => void;
} | null>(null);

interface Props {
  children: ReactNode;
}

export function ToastProvider({ children }: Props) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback(
    ({ variant = "info", message }: { message: string; variant?: ToastVariant }) => {
      const id = String(nextId++);
      setToasts((prev) => [...prev.slice(-MAX_TOASTS + 1), { id, message, variant }]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);
  const s = useStyles();

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={s.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            id={toast.id}
            index={index}
            message={toast.message}
            variant={toast.variant}
            onRemove={remove}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const useStyles = createStyles(() => ({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
}));
