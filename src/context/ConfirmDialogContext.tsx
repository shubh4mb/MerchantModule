// context/ConfirmDialogContext.tsx
import React, { createContext, useContext, useState,  } from "react";
import type { ReactNode } from "react";
import ConfirmDialog from "../components/utils/popup/ConfirmDialog";

// ✅ Define the context value type
interface ConfirmDialogContextType {
  openConfirm: (options: {
    title?: string;
    message?: string;
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
  }) => void;
  closeConfirm: () => void;
}

// ✅ Create the context
const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

// ✅ Custom hook
export const useConfirmDialog = (): ConfirmDialogContextType => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider");
  }
  return context;
};

// ✅ Define props type for the provider
interface ConfirmDialogProviderProps {
  children: ReactNode;
}

// ✅ Provider component
export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null as (() => void) | null,
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    confirmColor: "green",
  });

  const openConfirm = ({
    title = "Confirm Action",
    message = "Are you sure?",
    onConfirm,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirmColor = "green",
  }: {
    title?: string;
    message?: string;
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
  }) => {
    setDialog({
      isOpen: true,
      title,
      message,
      onConfirm: onConfirm || null,
      confirmLabel,
      cancelLabel,
      confirmColor,
    });
  };

  const closeConfirm = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (typeof dialog.onConfirm === "function") dialog.onConfirm();
    closeConfirm();
  };

  return (
    <ConfirmDialogContext.Provider value={{ openConfirm, closeConfirm }}>
      {children}
      {dialog.isOpen && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          confirmColor={dialog.confirmColor}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
};
