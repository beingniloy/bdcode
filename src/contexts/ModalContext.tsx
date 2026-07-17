import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextValue {
  publishModalOpen: boolean;
  setPublishModalOpen: (open: boolean) => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  keybindingsModalOpen: boolean;
  setKeybindingsModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [keybindingsModalOpen, setKeybindingsModalOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        publishModalOpen,
        setPublishModalOpen,
        settingsModalOpen,
        setSettingsModalOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        keybindingsModalOpen,
        setKeybindingsModalOpen,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
