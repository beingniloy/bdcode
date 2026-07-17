import { useState, useEffect, useCallback } from 'react';

export type DialogState =
  | { type: null }
  | { type: 'alert'; message: string; onOk: () => void }
  | { type: 'confirm'; message: string; onOk: () => void; onCancel: () => void }
  | { type: 'prompt'; message: string; defaultValue?: string; onOk: (value: string) => void; onCancel: () => void };

let globalSetDialog: React.Dispatch<React.SetStateAction<DialogState>> | null = null;

export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    if (globalSetDialog) {
      globalSetDialog({ type: 'alert', message, onOk: resolve });
    } else {
      alert(message);
      resolve();
    }
  });
}

export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (globalSetDialog) {
      globalSetDialog({
        type: 'confirm',
        message,
        onOk: () => resolve(true),
        onCancel: () => resolve(false)
      });
    } else {
      resolve(confirm(message));
    }
  });
}

export function showPrompt(message: string, defaultValue?: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (globalSetDialog) {
      globalSetDialog({
        type: 'prompt',
        message,
        defaultValue,
        onOk: (value) => resolve(value),
        onCancel: () => resolve(null)
      });
    } else {
      const result = prompt(message, defaultValue);
      resolve(result);
    }
  });
}

export function useDialog() {
  const [dialog, setDialog] = useState<DialogState>({ type: null });

  useEffect(() => {
    if (!globalSetDialog) {
      globalSetDialog = setDialog;
    }
    return () => {
      // Only clear the global reference if this is the current one
      if (globalSetDialog === setDialog) {
        globalSetDialog = null;
      }
    };
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ type: null });
  }, []);

  return { dialog, closeDialog };
}
