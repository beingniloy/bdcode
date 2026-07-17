export interface FileSystemItem {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileSystemItem[];
  content?: string;
  modified?: boolean;
  language?: string;
}

export interface Tab {
  path: string;
  name: string;
  isDirty?: boolean;
}

export interface EditorSettings {
  // Text Editor
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'bounded';
  minimap: boolean;
  autoSave: boolean;
  bracketColorization: boolean;
  renderWhitespace: 'none' | 'boundary' | 'all';
  
  // Workbench
  iconTheme: string;
  colorTheme: 'light' | 'dark';
  sidebarPosition: 'left' | 'right';
  statusBarVisible: boolean;
  
  // Security
  offlineMode: boolean;
  sandboxEnabled: boolean;
  blockTelemetry: boolean;
  sslCheck: boolean;
  
  // Terminal
  terminalFontSize: number;
  terminalShell: string;
  terminalCursorStyle: 'block' | 'line' | 'underline';
  
  // Gov Cloud
  autoPublish: boolean;
  nodeEnv: 'development' | 'staging' | 'production';
  agencyCode: string;
}

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
}

export type Theme = 'light' | 'dark';
export type Language = 'bn' | 'en';

export interface Keybinding {
  command: string;
  keys: string;
  when?: string;
}

export type KeybindingsMap = Record<string, string>;

export interface CommandDefinition {
  id: string;
  label: string;
  category: string;
  defaultKeys: string;
  handler: () => void;
  when?: string;
}
export type ActiveSidebarTab = 
  | 'explorer' 
  | 'search' 
  | 'source_control' 
  | 'run' 
  | 'extensions' 
  | 'documentation' 
  | 'settings' 
  | 'feedback';

declare global {
  interface Window {
    electronAPI?: {
      readWorkspace: () => Promise<{ path: string; tree: FileSystemItem[] }>;
      readFile: (relPath: string) => Promise<string>;
      writeFile: (relPath: string, content: string) => Promise<boolean>;
      createFile: (relPath: string) => Promise<boolean>;
      createFolder: (relPath: string) => Promise<boolean>;
      deleteItem: (relPath: string) => Promise<boolean>;
      renameItem: (oldRelPath: string, newRelPath: string) => Promise<boolean>;
      
      // Desktop controls
      windowControl: (action: 'minimize' | 'maximize' | 'close') => Promise<void>;
      setTitle: (title: string) => void;
      selectFolder: () => Promise<{ path: string; tree: FileSystemItem[] } | null>;
      getPlatform: () => Promise<'win32' | 'darwin' | 'linux'>;
      sendTerminalInput: (text: string) => void;
      onTerminalData: (callback: (data: string) => void) => () => void;
      getTerminalHistory: () => Promise<string>;
      isPty: () => Promise<boolean>;
      restartShell: (shellPath?: string) => Promise<boolean>;

      // Auto-update
      checkForUpdates: () => Promise<{ updateAvailable: boolean; version: string | null; releaseDate: string | null; error?: string }>;
      downloadUpdate: () => Promise<boolean>;
      installUpdate: () => void;
      getAppVersion: () => Promise<string>;
      onUpdateAvailable: (callback: (info: { version: string; releaseDate: string }) => void) => () => void;
      onUpdateNotAvailable: (callback: () => void) => () => void;
      onUpdateDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      
      // Git
      gitStatus: () => Promise<{ isRepo: boolean; branch: string; files: Array<{ file: string; status: string }> }>;
      gitCmd: (cmdArgs: string) => Promise<{ success: boolean; stdout: string; stderr: string }>;
      gitCommit: (message: string) => Promise<{ success: boolean; stdout: string; stderr: string }>;

      // Disk-based search & replace
      searchFiles: (opts: { query: string; caseSensitive: boolean; wholeWord: boolean; useRegex: boolean }) => Promise<Array<{ path: string; line: number; text: string; colStart: number; colEnd: number }>>;
      replaceInFiles: (opts: { query: string; replacement: string; caseSensitive: boolean; wholeWord: boolean; useRegex: boolean }) => Promise<{ totalReplacements: number }>;
    };
  }
}
