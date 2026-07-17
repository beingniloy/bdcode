import { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, File, FolderOpen, Terminal, Monitor, Sun, Search, Command, GitBranch, Puzzle, BookOpen, MessageSquare, Cloud, Sliders, Keyboard } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useModal } from '../../contexts/ModalContext';
import { useTranslation } from '../../hooks/useTranslation';
import { overlayStyle, modalStyle, kbdHintStyle } from './shared';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  icon: React.ReactNode;
  handler: () => void;
}

export function CommandPalette({ onClose }: { onClose?: () => void }) {
  const { setCommandPaletteOpen, setKeybindingsModalOpen, setSettingsModalOpen, setPublishModalOpen } = useModal();
  const { handleSave, handleSaveAll, handleNewFile, handleNewFolder, handleOpenFolder, handleRun } = useFileSystem();
  const { sidebarOpen, setSidebarOpen, rightSidebarOpen, setRightSidebarOpen, setBottomPanelOpen, setActiveSidebarTab } = useLayout();
  const { theme, setTheme, setSettings, getShortcut } = useSettings();
  const close = onClose || (() => setCommandPaletteOpen(false));
  const t = useTranslation('commandPalette');

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useCallback((el: HTMLInputElement | null) => {
    el?.focus();
  }, []);

  const commands: CommandItem[] = useMemo(() => [
    // File
    { id: 'save', label: t('save'), shortcut: getShortcut('save'), category: t('file'), icon: <Save size={14} />, handler: () => { handleSave(); close(); } },
    { id: 'saveAll', label: t('saveAll'), shortcut: getShortcut('saveAll'), category: t('file'), icon: <Save size={14} />, handler: () => { handleSaveAll(); close(); } },
    { id: 'newFile', label: t('newFile'), shortcut: getShortcut('newFile'), category: t('file'), icon: <File size={14} />, handler: () => { handleNewFile(); close(); } },
    { id: 'newFolder', label: t('newFolder'), shortcut: getShortcut('newFolder'), category: t('file'), icon: <FolderOpen size={14} />, handler: () => { handleNewFolder(); close(); } },
    { id: 'openFolder', label: t('openFolder'), shortcut: getShortcut('openFolder'), category: t('file'), icon: <FolderOpen size={14} />, handler: () => { handleOpenFolder(); close(); } },
    // View
    { id: 'toggleTerminal', label: t('toggleTerminal'), shortcut: getShortcut('toggleTerminal'), category: t('view'), icon: <Terminal size={14} />, handler: () => { setBottomPanelOpen(prev => !prev); close(); } },
    { id: 'toggleSidebar', label: t('toggleSidebar'), shortcut: getShortcut('toggleSidebar'), category: t('view'), icon: <Monitor size={14} />, handler: () => { setSidebarOpen(!sidebarOpen); close(); } },
    { id: 'toggleRightSidebar', label: t('toggleRightSidebar'), shortcut: getShortcut('toggleRightSidebar'), category: t('view'), icon: <Monitor size={14} />, handler: () => { setRightSidebarOpen(!rightSidebarOpen); close(); } },
    { id: 'toggleTheme', label: t('toggleTheme'), shortcut: getShortcut('toggleTheme'), category: t('view'), icon: <Sun size={14} />, handler: () => { const newTheme = theme === 'light' ? 'dark' : 'light'; setTheme(newTheme); setSettings(prev => ({ ...prev, colorTheme: newTheme })); close(); } },
    // Navigate
    { id: 'searchFiles', label: t('searchFiles'), shortcut: getShortcut('searchFiles'), category: t('navigate'), icon: <Search size={14} />, handler: () => { setActiveSidebarTab('search'); setSidebarOpen(true); close(); } },
    { id: 'commandPalette', label: 'Command Palette', shortcut: getShortcut('commandPalette'), category: t('navigate'), icon: <Command size={14} />, handler: () => { close(); setTimeout(() => setCommandPaletteOpen(true), 50); } },
    { id: 'sourceControl', label: t('sourceControl'), shortcut: getShortcut('sourceControl'), category: t('navigate'), icon: <GitBranch size={14} />, handler: () => { setActiveSidebarTab('source_control'); setSidebarOpen(true); close(); } },
    { id: 'extensions', label: t('extensions'), shortcut: getShortcut('extensions'), category: t('navigate'), icon: <Puzzle size={14} />, handler: () => { setActiveSidebarTab('extensions'); setSidebarOpen(true); close(); } },
    { id: 'documentation', label: t('documentation'), shortcut: getShortcut('documentation'), category: t('navigate'), icon: <BookOpen size={14} />, handler: () => { setActiveSidebarTab('documentation'); setSidebarOpen(true); close(); } },
    { id: 'feedback', label: t('feedback'), shortcut: getShortcut('feedback'), category: t('navigate'), icon: <MessageSquare size={14} />, handler: () => { setActiveSidebarTab('feedback'); setSidebarOpen(true); close(); } },
    // Project
    { id: 'runFile', label: t('runFile'), shortcut: getShortcut('runFile'), category: t('project'), icon: <Command size={14} />, handler: () => { handleRun(); close(); } },
    { id: 'publishProject', label: t('publishProject'), shortcut: getShortcut('publishProject'), category: t('project'), icon: <Cloud size={14} />, handler: () => { setPublishModalOpen(true); close(); } },
    // Tools
    { id: 'openSettings', label: t('openSettings'), shortcut: getShortcut('openSettings'), category: t('tools'), icon: <Sliders size={14} />, handler: () => { setSettingsModalOpen(true); close(); } },
    { id: 'openKeybindings', label: t('openKeybindings'), shortcut: getShortcut('openKeybindings'), category: t('tools'), icon: <Keyboard size={14} />, handler: () => { setKeybindingsModalOpen(true); close(); } },
  ], [t, getShortcut, handleSave, handleSaveAll, handleNewFile, handleNewFolder, handleOpenFolder, handleRun, setPublishModalOpen, setSettingsModalOpen, sidebarOpen, setSidebarOpen, rightSidebarOpen, setRightSidebarOpen, setBottomPanelOpen, setActiveSidebarTab, setKeybindingsModalOpen, setCommandPaletteOpen, theme, setTheme, setSettings, close]);

  // Fuzzy match: score based on prefix match > substring match > character-by-character
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands
      .map(cmd => {
        const label = cmd.label.toLowerCase();
        const cat = cmd.category.toLowerCase();
        const shortcut = (cmd.shortcut || '').toLowerCase();
        const searchText = `${cat} ${label} ${shortcut}`;

        // Prefix match (highest score)
        if (label.startsWith(q)) return { cmd, score: 100 };
        // Category prefix match
        if (cat.startsWith(q)) return { cmd, score: 80 };
        // Shortcut match
        if (shortcut.includes(q)) return { cmd, score: 70 };
        // Substring match
        if (label.includes(q)) return { cmd, score: 60 };
        if (cat.includes(q)) return { cmd, score: 50 };
        // Character-by-character fuzzy match
        let qi = 0;
        for (let i = 0; i < searchText.length && qi < q.length; i++) {
          if (searchText[i] === q[qi]) qi++;
        }
        if (qi === q.length) return { cmd, score: 30 };
        return null;
      })
      .filter((x): x is { cmd: CommandItem; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .map(x => x.cmd);
  }, [query, commands]);

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].handler();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }, [filtered, selectedIndex, close]);

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: { category: string; items: CommandItem[] }[] = [];
    const map = new Map<string, CommandItem[]>();
    for (const cmd of filtered) {
      if (!map.has(cmd.category)) map.set(cmd.category, []);
      map.get(cmd.category)!.push(cmd);
    }
    for (const [category, items] of map) {
      groups.push({ category, items });
    }
    return groups;
  }, [filtered]);

  return (
    <div style={overlayStyle} onClick={close}>
      <div
        style={{
          ...modalStyle,
          width: '520px',
          maxHeight: '440px',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateY(-20%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}>
          <Command size={16} style={{ color: 'var(--gov-green)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t('placeholder')}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Results list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {grouped.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '24px' }}>
              {t('noResults')}
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.category}>
                <div style={{
                  padding: '6px 14px 4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.5px',
                }}>
                  {group.category}
                </div>
                {group.items.map((cmd) => {
                  const globalIdx = filtered.indexOf(cmd);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => cmd.handler()}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        color: 'var(--text-primary)',
                        background: isSelected ? 'var(--accent-color)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      className={isSelected ? 'command-palette-selected' : ''}
                    >
                      <span style={{ color: isSelected ? 'white' : 'var(--text-secondary)', flexShrink: 0, display: 'flex' }}>
                        {cmd.icon}
                      </span>
                      <span style={{ flex: 1, color: isSelected ? 'white' : 'var(--text-primary)' }}>
                        {cmd.label}
                      </span>
                      {cmd.shortcut && (
                        <kbd style={{
                          fontSize: '10px',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          background: isSelected ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)',
                          color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                          border: isSelected ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border-color)',
                          fontFamily: 'inherit',
                          flexShrink: 0,
                        }}>
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '6px 14px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          display: 'flex',
          gap: '14px',
          background: 'var(--bg-secondary)',
        }}>
          <span><kbd style={kbdHintStyle}>↑↓</kbd> Navigate</span>
          <span><kbd style={kbdHintStyle}>↵</kbd> Select</span>
          <span><kbd style={kbdHintStyle}>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
