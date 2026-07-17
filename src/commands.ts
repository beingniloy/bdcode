import {
  Save, File, FolderOpen, Monitor, Sun, Search, Command,
  GitBranch, Puzzle, BookOpen, MessageSquare, Cloud, Sliders, Keyboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * A single source of truth for all commands in the application.
 *
 * Each entry declares:
 *  - id / label / category for display
 *  - defaultKeys for the keyboard shortcut
 *  - icon component for the command palette and keybindings table
 *  - handler will be injected by the consuming context (App.tsx / palette)
 */
export interface CommandDef {
  id: string;
  label: string;
  category: CommandCategory;
  defaultKeys: string;
  icon: LucideIcon;
  when?: '!inputFocus';
}

export type CommandCategory = 'File' | 'View' | 'Navigate' | 'Project' | 'Tools';

const COMMANDS: CommandDef[] = [
  // ── File ────────────────────────────────────────
  { id: 'save',             label: 'Save Current File',        category: 'File',     defaultKeys: 'Ctrl+S',         icon: Save },
  { id: 'saveAll',          label: 'Save All Files',           category: 'File',     defaultKeys: 'Ctrl+Shift+S',  icon: Save },
  { id: 'newFile',          label: 'Create New File',           category: 'File',     defaultKeys: 'Ctrl+N',         icon: File, when: '!inputFocus' },
  { id: 'newFolder',        label: 'Create New Folder',         category: 'File',     defaultKeys: '',               icon: FolderOpen },
  { id: 'openFolder',       label: 'Open Folder',              category: 'File',     defaultKeys: '',               icon: FolderOpen },

  // ── View ────────────────────────────────────────
  { id: 'toggleTerminal',   label: 'Toggle Terminal',          category: 'View',     defaultKeys: 'Ctrl+`',         icon: Monitor, when: '!inputFocus' },
  { id: 'toggleSidebar',    label: 'Toggle Sidebar',           category: 'View',     defaultKeys: 'Ctrl+B',         icon: Monitor, when: '!inputFocus' },
  { id: 'toggleRightSidebar', label: 'Toggle Right Sidebar',   category: 'View',     defaultKeys: '',               icon: Monitor },
  { id: 'toggleTheme',      label: 'Toggle Theme',             category: 'View',     defaultKeys: '',               icon: Sun },

  // ── Navigate ────────────────────────────────────
  { id: 'searchFiles',      label: 'Search Files',             category: 'Navigate', defaultKeys: 'Ctrl+Shift+F',   icon: Search, when: '!inputFocus' },
  { id: 'commandPalette',   label: 'Command Palette',          category: 'Navigate', defaultKeys: 'Ctrl+Shift+P',   icon: Command, when: '!inputFocus' },
  { id: 'sourceControl',    label: 'Source Control',           category: 'Navigate', defaultKeys: '',               icon: GitBranch },
  { id: 'extensions',       label: 'Extensions',               category: 'Navigate', defaultKeys: '',               icon: Puzzle },
  { id: 'documentation',    label: 'Documentation',            category: 'Navigate', defaultKeys: '',               icon: BookOpen },
  { id: 'feedback',         label: 'Feedback',                 category: 'Navigate', defaultKeys: '',               icon: MessageSquare },

  // ── Project ─────────────────────────────────────
  { id: 'runFile',          label: 'Run Active File',          category: 'Project',  defaultKeys: '',               icon: Command },
  { id: 'publishProject',   label: 'Publish Project',          category: 'Project',  defaultKeys: '',               icon: Cloud },

  // ── Tools ───────────────────────────────────────
  { id: 'openSettings',     label: 'Open Settings',            category: 'Tools',    defaultKeys: 'Ctrl+,',         icon: Sliders, when: '!inputFocus' },
  { id: 'openKeybindings',  label: 'Open Keyboard Shortcuts',  category: 'Tools',    defaultKeys: 'Ctrl+K Ctrl+S',  icon: Keyboard, when: '!inputFocus' },
];

export default COMMANDS;

/** Convenience: look up a command definition by id */
export function getCommand(id: string): CommandDef | undefined {
  return COMMANDS.find(c => c.id === id);
}

/** Convenience: group commands by category (preserving insertion order) */
export function groupByCategory(): { category: CommandCategory; commands: CommandDef[] }[] {
  const groups: { category: CommandCategory; commands: CommandDef[] }[] = [];
  const map = new Map<CommandCategory, CommandDef[]>();
  for (const cmd of COMMANDS) {
    if (!map.has(cmd.category)) map.set(cmd.category, []);
    map.get(cmd.category)!.push(cmd);
  }
  for (const [category, cmds] of map) {
    groups.push({ category, commands: cmds });
  }
  return groups;
}

/** Convenience: get the display label for a command (same as CommandDef.label but stringly-typed for KeybindingsModal) */
export function getCommandLabel(id: string): string {
  return COMMANDS.find(c => c.id === id)?.label ?? id;
}
