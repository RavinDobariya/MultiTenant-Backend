import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ConfirmTone = "danger" | "default";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const value = useMemo<ConfirmContextValue>(
    () => ({
      confirm(options) {
        return new Promise<boolean>((resolve) => {
          setRequest({
            ...options,
            resolve,
          });
        });
      },
    }),
    []
  );

  function handleClose(confirmed: boolean) {
    if (!request) return;
    request.resolve(confirmed);
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {request ? (
        <div className="confirm-overlay" role="presentation" onClick={() => handleClose(false)}>
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="confirm-title">{request.title}</h2>
            <p id="confirm-description">{request.description}</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="doc-detail-btn secondary"
                onClick={() => handleClose(false)}
              >
                {request.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                className={`doc-detail-btn ${
                  request.tone === "danger" ? "danger" : "primary"
                }`}
                onClick={() => handleClose(true)}
              >
                {request.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
