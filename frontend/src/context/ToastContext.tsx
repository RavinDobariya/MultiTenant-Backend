import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastInput = {
  message: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  pushToast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toneIcon(tone: ToastTone) {
  if (tone === "success") return <CheckCircle2 size={18} />;
  if (tone === "error") return <TriangleAlert size={18} />;
  return <Info size={18} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast({ message, tone = "info" }) {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, message, tone }]);

        timeoutsRef.current[id] = window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
          delete timeoutsRef.current[id];
        }, 3200);
      },
    }),
    []
  );

  function dismissToast(id: string) {
    const timeoutId = timeoutsRef.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutsRef.current[id];
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.tone}`}>
            <div className="toast-icon">{toneIcon(toast.tone)}</div>
            <p>{toast.message}</p>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
