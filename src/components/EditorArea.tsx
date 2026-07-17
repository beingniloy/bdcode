import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
import type { OnMount } from '@monaco-editor/react';
import { X, FileCode, Home, FilePlus, FolderPlus, FolderOpen, Copy, Scissors, Clipboard, Save, SaveAll, RefreshCw, Settings, Undo, Redo, Search, Braces, BookOpen, FileDown, CopyPlus } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useModal } from '../contexts/ModalContext';
import { useLayout } from '../contexts/LayoutContext';
import { findFileInTree, getFileIconColor, getEditorLanguage } from '../utils';
import { useTranslation } from '../hooks/useTranslation';
import { useContextMenu } from '../hooks/useContextMenu';
import ContextMenu from './ContextMenu';

export default React.memo(function EditorArea() {
  const { theme, settings, setCursorLine, setCursorCol } = useSettings();
  const { files, openTabs, activeFile, handleTabSelect, handleTabClose, handleContentChange, handleNewFile, handleNewFolder, handleOpenFolder, handleSave, handleSaveAll, handleFileSelect } = useFileSystem();
  const { setSettingsModalOpen, setCommandPaletteOpen } = useModal();
  const { setBottomPanelOpen, sidebarOpen, setSidebarOpen, setActiveSidebarTab } = useLayout();
  const t = useTranslation('editor');

  const [editorTheme, setEditorTheme] = useState('vs-light');
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<string[]>([]);
  const { menu, menuRef, showMenu, hideMenu } = useContextMenu();
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setEditorTheme(theme === 'light' ? 'light' : 'vs-dark');
  }, [theme]);

  // Listen for "Go to Line" events from StatusBar
  useEffect(() => {
    const handler = (e: Event) => {
      const line = (e as CustomEvent).detail?.line;
      if (line && editorRef.current) {
        editorRef.current.revealLineInCenter(line);
        editorRef.current.setPosition({ lineNumber: line, column: 1 });
        editorRef.current.focus();
      }
    };
    window.addEventListener('bdcode-goto-line', handler);
    return () => window.removeEventListener('bdcode-goto-line', handler);
  }, []);

  const activeItem = activeFile && activeFile !== 'welcome' ? findFileInTree(files, activeFile) : null;

  const handleEditorDidMount: OnMount = useCallback((editor: any) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorLine(e.position.lineNumber);
      setCursorCol(e.position.column);
    });
  }, [setCursorLine, setCursorCol]);

  const getRelativePath = (fullPath: string) => {
    const parts = fullPath.split('/');
    return parts.length > 1 ? parts.slice(1).join('/') : fullPath;
  };

  const handleTabContextMenu = (e: React.MouseEvent, tabPath: string, _tabName: string) => {
    const isWelcome = tabPath === 'welcome';
    const isDirty = openTabs.find(t => t.path === tabPath)?.isDirty;

    showMenu(e, [
      { label: t('close'), icon: <X size={14} />, action: () => handleTabClose(tabPath) },
      { label: 'Close Others', icon: <X size={14} />, action: () => { openTabs.forEach(t => { if (t.path !== tabPath) handleTabClose(t.path); }); } },
      { label: 'Close All', icon: <X size={14} />, action: () => { openTabs.forEach(t => handleTabClose(t.path)); } },
      { label: 'Close Saved', icon: <X size={14} />, action: () => { openTabs.forEach(t => { if (!t.isDirty) handleTabClose(t.path); }); }, disabled: openTabs.every(t => t.isDirty || t.path === 'welcome') },
      { divider: true, label: '' },
      ...(!isWelcome ? [
        { label: 'Save', icon: <Save size={14} />, shortcut: 'Ctrl+S', action: handleSave, disabled: !isDirty },
        { label: 'Save All', icon: <SaveAll size={14} />, shortcut: 'Ctrl+Shift+S', action: handleSaveAll },
        { label: 'Save As...', icon: <FileDown size={14} />, shortcut: 'Ctrl+Shift+S', action: () => { handleSave(); } },
        { divider: true, label: '' },
      ] : []),
      { label: 'Copy Path', icon: <CopyPlus size={14} />, action: () => navigator.clipboard?.writeText(tabPath) },
      { label: 'Copy Relative Path', icon: <CopyPlus size={14} />, action: () => navigator.clipboard?.writeText(getRelativePath(tabPath)) },
      { divider: true, label: '' },
      { label: 'Reopen Closed', icon: <RefreshCw size={14} />, action: () => { if (recentlyClosedTabs.length > 0) { const path = recentlyClosedTabs[recentlyClosedTabs.length - 1]; handleFileSelect(path); setRecentlyClosedTabs(prev => prev.slice(0, -1)); } } },
    ]);
  };

  const triggerMonacoAction = (actionId: string) => {
    if (editorRef.current) {
      editorRef.current.trigger('contextMenu', actionId, null);
    }
  };

  const handleEditorAreaContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.editor-tab')) return;
    showMenu(e, [
      { label: 'Undo', icon: <Undo size={14} />, shortcut: 'Ctrl+Z', action: () => triggerMonacoAction('undo') },
      { label: 'Redo', icon: <Redo size={14} />, shortcut: 'Ctrl+Y', action: () => triggerMonacoAction('redo') },
      { divider: true, label: '' },
      { label: 'Cut', icon: <Scissors size={14} />, shortcut: 'Ctrl+X', action: () => triggerMonacoAction('editor.action.clipboardCutAction') },
      { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', action: () => triggerMonacoAction('editor.action.clipboardCopyAction') },
      { label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (editorRef.current) {
            const selection = editorRef.current.getSelection();
            const id = { major: 1, minor: 1 };
            const op = { identifier: id, range: selection, text, forceMoveMarkers: true };
            editorRef.current.executeEdits('contextMenu', [op]);
          }
        } catch {}
      }},
      { divider: true, label: '' },
      { label: 'Find', icon: <Search size={14} />, shortcut: 'Ctrl+F', action: () => triggerMonacoAction('actions.find') },
      { label: 'Replace', icon: <RefreshCw size={14} />, shortcut: 'Ctrl+H', action: () => triggerMonacoAction('editor.action.startFindReplaceAction') },
      { divider: true, label: '' },
      { label: 'Save', icon: <Save size={14} />, shortcut: 'Ctrl+S', action: handleSave, disabled: !activeFile || activeFile === 'welcome' },
      { label: 'Save All', icon: <SaveAll size={14} />, shortcut: 'Ctrl+Shift+S', action: handleSaveAll },
      { divider: true, label: '' },
      { label: 'Command Palette', icon: <Settings size={14} />, shortcut: 'Ctrl+Shift+P', action: () => setCommandPaletteOpen(true) },
      { label: 'Open Settings', icon: <Settings size={14} />, shortcut: 'Ctrl+,', action: () => setSettingsModalOpen(true) },
      { divider: true, label: '' },
      { label: 'New File', icon: <FilePlus size={14} />, shortcut: 'Ctrl+N', action: handleNewFile },
      { label: 'New Folder', icon: <FolderPlus size={14} />, action: handleNewFolder },
      { label: 'Open Folder', icon: <FolderOpen size={14} />, action: handleOpenFolder },
      { divider: true, label: '' },
      { label: 'Toggle Terminal', icon: <Braces size={14} />, shortcut: 'Ctrl+`', action: () => setBottomPanelOpen(prev => !prev) },
      { label: 'Toggle Sidebar', icon: <BookOpen size={14} />, shortcut: 'Ctrl+B', action: () => setSidebarOpen(!sidebarOpen) },
      { label: 'Search Files', icon: <Search size={14} />, shortcut: 'Ctrl+Shift+F', action: () => { setActiveSidebarTab('search'); setSidebarOpen(true); } },
      { divider: true, label: '' },
    ]);
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Tabs Bar */}
      {openTabs.length > 0 && (
        <div style={{ height: '35px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px', overflowX: 'auto', userSelect: 'none' }} className="tabs-bar-container">
          <div style={{ display: 'flex', height: '100%' }} role="tablist" aria-label={t('editorTabs')}>
            {openTabs.map((tab) => {
              const isActive = activeFile === tab.path;
              const isDirty = tab.isDirty;
              const isWelcomeTab = tab.path === 'welcome';
              return (
                <div
                  key={tab.path}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={0}
                  aria-label={isWelcomeTab ? t('welcome') : tab.name}
                  onClick={() => handleTabSelect(tab.path)}
                  onContextMenu={(e) => handleTabContextMenu(e, tab.path, tab.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', height: '100%', background: isActive ? 'var(--bg-primary)' : 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', borderTop: isActive ? '2px solid var(--gov-green)' : 'none', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s', position: 'relative' }}
                  className={`editor-tab ${isActive ? 'active' : ''}`}
                >
                  {isWelcomeTab ? <Home size={13} color="var(--gov-green)" /> : <FileCode size={13} color={getFileIconColor(tab.name)} />}
                  <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{isWelcomeTab ? t('welcome') : tab.name}</span>
                  {isDirty ? (
                    <div onClick={(e) => { e.stopPropagation(); handleTabClose(tab.path); }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} className="tab-dirty-indicator" />
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleTabClose(tab.path); }} aria-label={`${t('close')} ${isWelcomeTab ? t('welcome') : tab.name}`} style={{ padding: '2px', borderRadius: '2px', opacity: isActive ? 0.9 : 0.4 }} className="tab-close-btn"><X size={12} /></button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }} onContextMenu={handleEditorAreaContextMenu}>
        {activeFile === 'welcome' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '10% 15%', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflowY: 'auto' }} className="welcome-screen">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <img src="images/gov-logo.svg" alt="Bangladesh Govt Seal" style={{ width: '68px', height: '68px' }} />
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--gov-green)', margin: 0, letterSpacing: '-0.5px' }}>{t('title')}</h1>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>{t('subtitle')}</p>
              </div>
            </div>
            <div style={{ width: '100%', maxWidth: '320px', marginTop: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '14px', color: 'var(--text-primary)' }}>{t('start')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={handleNewFile} className="welcome-link-btn"><FilePlus size={16} /><span>{t('newFile')}</span></button>
                <button onClick={handleNewFolder} className="welcome-link-btn"><FolderPlus size={16} /><span>{t('newFolder')}</span></button>
                <button onClick={handleOpenFolder} className="welcome-link-btn"><FolderOpen size={16} /><span>{t('openFolder')}</span></button>
              </div>
            </div>
          </div>
        ) : activeItem ? (
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading editor...</div>}>
                <MonacoEditor
                  height="100%"
                  language={getEditorLanguage(activeItem.name)}
                  theme={editorTheme}
                  value={activeItem.content || ''}
                  onChange={(value) => handleContentChange(activeItem.path, value || '')}
                  onMount={handleEditorDidMount}
                  options={{
                    fontSize: settings.fontSize,
                    fontFamily: `'${settings.fontFamily}', monospace`,
                    tabSize: settings.tabSize,
                    wordWrap: settings.wordWrap,
                    minimap: { enabled: settings.minimap },
                    bracketPairColorization: { enabled: settings.bracketColorization },
                    renderWhitespace: settings.renderWhitespace,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    cursorBlinking: 'smooth',
                    scrollbar: { vertical: 'visible', horizontal: 'visible' }
                  }}
                />
              </Suspense>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', flexDirection: 'column', gap: '12px' }}>
            <svg width="60" height="60" viewBox="0 0 100 100" opacity="0.3">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="4 4" />
              <path d="M30,40 L70,40 M30,55 L70,55 M30,70 L50,70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span>{t('noFile')}</span>
          </div>
        )}
      </div>

      {menu.visible && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={hideMenu}
          menuRef={menuRef as React.RefObject<HTMLDivElement>}
        />
      )}
    </div>
  );
});
