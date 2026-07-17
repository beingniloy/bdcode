import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { EditorSettings, Language, Theme, KeybindingsMap } from '../types';

interface SettingsContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  settings: EditorSettings;
  setSettings: React.Dispatch<React.SetStateAction<EditorSettings>>;
  cursorLine: number;
  cursorCol: number;
  setCursorLine: (line: number) => void;
  setCursorCol: (col: number) => void;
  gitBranch: string;
  setGitBranch: (branch: string) => void;
  getActiveLanguageName: (activeFile: string | null) => string;
  // Keybindings
  userKeybindings: KeybindingsMap;
  getShortcut: (commandId: string) => string;
  setKeybinding: (commandId: string, keys: string) => void;
  resetKeybinding: (commandId: string) => void;
  resetAllKeybindings: () => void;
  getConflicts: () => Array<{ shortcut: string; commands: string[] }>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const defaultSettings: EditorSettings = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  tabSize: 4,
  wordWrap: 'on',
  minimap: true,
  autoSave: false,
  bracketColorization: true,
  renderWhitespace: 'none',
  iconTheme: 'default-gov',
  colorTheme: getSystemTheme(),
  sidebarPosition: 'left',
  statusBarVisible: true,
  offlineMode: false,
  sandboxEnabled: false,
  blockTelemetry: true,
  sslCheck: true,
  terminalFontSize: 12,
  terminalShell: navigator.userAgent.includes('Win') ? 'powershell.exe' : navigator.userAgent.includes('Mac') ? 'zsh' : 'bash',
  terminalCursorStyle: 'block',
  autoPublish: false,
  nodeEnv: 'development',
  agencyCode: navigator.userAgent.includes('Win') ? 'GOV-BD-WIN' : navigator.userAgent.includes('Mac') ? 'GOV-BD-MAC' : 'GOV-BD-LNX'
};

// Default keybindings for all commands
const DEFAULT_KEYBINDINGS: KeybindingsMap = {
  save: 'Ctrl+S',
  saveAll: 'Ctrl+Shift+S',
  newFile: 'Ctrl+N',
  newFolder: '',
  openFolder: '',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Shift+Z',
  toggleTerminal: 'Ctrl+`',
  toggleSidebar: 'Ctrl+B',
  toggleRightSidebar: '',
  toggleTheme: '',
  searchFiles: 'Ctrl+Shift+F',
  sourceControl: '',
  extensions: '',
  documentation: '',
  feedback: '',
  runFile: '',
  publishProject: '',
  openSettings: 'Ctrl+,',
  commandPalette: 'Ctrl+Shift+P',
};

const STORAGE_KEY = 'bdcode-keybindings';
const SETTINGS_STORAGE_KEY = 'bdcode-settings';
const LANGUAGE_STORAGE_KEY = 'bdcode-language';

function getSystemTheme(): Theme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function loadLanguage(): Language {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === 'bn' || raw === 'en') return raw;
  } catch {}
  return 'bn';
}

function loadUserKeybindings(): KeybindingsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch {}
  return {};
}

function saveUserKeybindings(bindings: KeybindingsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {}
}

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...defaultSettings, ...parsed };
      }
    }
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(loadLanguage);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = loadSettings();
    return (saved.colorTheme as Theme) || getSystemTheme();
  });
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [gitBranch, setGitBranch] = useState<string>('main');
  const [userKeybindings, setUserKeybindings] = useState<KeybindingsMap>(loadUserKeybindings);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch {}
  }, []);

  // Sync language to <html>
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Sync theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync theme to settings (one-way: UI → settings)
  useEffect(() => {
    setSettings(prev => {
      if (prev.colorTheme === theme) return prev;
      return { ...prev, colorTheme: theme };
    });
  }, [theme]);

  // Reverse sync: settings.colorTheme → theme (when changed from settings modal)
  useEffect(() => {
    if (settings.colorTheme !== theme) {
      setTheme(settings.colorTheme);
    }
  }, [settings.colorTheme]);

  // Persist settings to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Fetch git branch on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.gitStatus().then(status => {
        if (status.isRepo) {
          setGitBranch(status.branch);
        }
      });
    }
  }, []);

  const getActiveLanguageName = useCallback((activeFile: string | null): string => {
    if (!activeFile) return 'HTML';
    if (activeFile === 'welcome') return 'HTML';
    const ext = activeFile.split('.').pop()?.toLowerCase();
    if (ext === 'js') return 'JavaScript';
    if (ext === 'css') return 'CSS';
    if (ext === 'html') return 'HTML';
    if (ext === 'php') return 'PHP';
    if (ext === 'json') return 'JSON';
    if (ext === 'md') return 'Markdown';
    return ext?.toUpperCase() || 'Text';
  }, []);

  // Resolve shortcut: user override or default
  const getShortcut = useCallback((commandId: string): string => {
    return userKeybindings[commandId] ?? DEFAULT_KEYBINDINGS[commandId] ?? '';
  }, [userKeybindings]);

  // Set a user keybinding override
  const setKeybinding = useCallback((commandId: string, keys: string) => {
    setUserKeybindings(prev => {
      const next = { ...prev };
      const trimmed = keys.trim();
      if (!trimmed || trimmed === (DEFAULT_KEYBINDINGS[commandId] ?? '')) {
        delete next[commandId];
      } else {
        next[commandId] = trimmed;
      }
      saveUserKeybindings(next);
      return next;
    });
  }, []);

  // Reset a single keybinding to default
  const resetKeybinding = useCallback((commandId: string) => {
    setUserKeybindings(prev => {
      const next = { ...prev };
      delete next[commandId];
      saveUserKeybindings(next);
      return next;
    });
  }, []);

  // Reset all keybindings to defaults
  const resetAllKeybindings = useCallback(() => {
    setUserKeybindings({});
    saveUserKeybindings({});
  }, []);

  // Find all shortcut conflicts
  const getConflicts = useCallback((): Array<{ shortcut: string; commands: string[] }> => {
    const allBindings: Record<string, string[]> = {};
    
    // Gather all resolved shortcuts
    const allIds = Object.keys(DEFAULT_KEYBINDINGS);
    for (const id of allIds) {
      const shortcut = getShortcut(id);
      if (!shortcut) continue;
      if (!allBindings[shortcut]) allBindings[shortcut] = [];
      allBindings[shortcut].push(id);
    }
    
    return Object.entries(allBindings)
      .filter(([, cmds]) => cmds.length > 1)
      .map(([shortcut, commands]) => ({ shortcut, commands }));
  }, [getShortcut]);

  return (
    <SettingsContext.Provider value={{
      language,
      setLanguage,
      theme,
      setTheme,
      settings,
      setSettings,
      cursorLine,
      cursorCol,
      setCursorLine,
      setCursorCol,
      gitBranch,
      setGitBranch,
      getActiveLanguageName,
      userKeybindings,
      getShortcut,
      setKeybinding,
      resetKeybinding,
      resetAllKeybindings,
      getConflicts,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
