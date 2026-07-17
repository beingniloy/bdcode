import { useEffect, useMemo } from 'react';
import { PublishModal, SettingsModal, CommandPalette, KeybindingsModal } from './components/modals';
import TitleBar from './components/TitleBar';
import Toolbar from './components/Toolbar';
import ActivityBar from './components/ActivityBar';
import ExplorerSidebar from './components/ExplorerSidebar';
import SidebarPanels from './components/SidebarPanels';
import EditorArea from './components/EditorArea';
import BottomPanel from './components/BottomPanel';
import RightSidebar from './components/RightSidebar';
import StatusBar from './components/StatusBar';
import Footer from './components/Footer';
import ConfirmDialog from './components/ConfirmDialog';
import { useLayout } from './contexts/LayoutContext';
import { useFileSystem } from './contexts/FileSystemContext';
import { useModal } from './contexts/ModalContext';
import { useSettings } from './contexts/SettingsContext';
import { useKeybindingHandler } from './hooks/useKeybindingHandler';
import type { CommandDefinition } from './types';

export default function App() {
  const { footerCollapsed } = useLayout();
  const { sidebarOpen, sidebarWidth, rightSidebarOpen, rightSidebarWidth, bottomPanelOpen, bottomPanelHeight, startResizing, resetSize, resizing, activeSidebarTab, setActiveSidebarTab, setSidebarOpen, setRightSidebarOpen, setBottomPanelOpen } = useLayout();
  const {
    publishModalOpen, settingsModalOpen, setSettingsModalOpen,
    commandPaletteOpen, setCommandPaletteOpen,
    keybindingsModalOpen, setKeybindingsModalOpen,
    setPublishModalOpen,
  } = useModal();
  const {
    handleSave, handleSaveAll, handleNewFile, handleNewFolder,
    handleOpenFolder, handleRun,
    handleUndo, handleRedo, undoStackDepths,
  } = useFileSystem();
  const { theme, setTheme, settings, setSettings } = useSettings();
  const sidebarOnRight = settings.sidebarPosition === 'right';

  // ── Security settings effects ───────────────────────────────────
  useEffect(() => {
    if (settings.offlineMode) {
      // Block outgoing network requests when offline mode is enabled
      const originalFetch = window.fetch;
      window.fetch = (...args) => {
        console.warn('[Security] Network request blocked (offline mode):', args[0]);
        return Promise.reject(new Error('Offline mode: network requests are blocked'));
      };
      return () => { window.fetch = originalFetch; };
    }
  }, [settings.offlineMode]);

  useEffect(() => {
    if (settings.blockTelemetry) {
      // Block common analytics scripts by preventing their execution
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLScriptElement) {
              const src = node.src || '';
              if (src.includes('analytics') || src.includes('telemetry') || src.includes('gtag') || src.includes('fbq')) {
                node.type = 'text/blocked';
                node.remove();
                console.warn('[Security] Telemetry script blocked:', src);
              }
            }
          }
        }
      });
      observer.observe(document.head, { childList: true });
      observer.observe(document.body, { childList: true });
      return () => observer.disconnect();
    }
  }, [settings.blockTelemetry]);

  // ── Command definitions with default shortcuts ─────────────────
  const commands: CommandDefinition[] = useMemo(() => [
    { id: 'save', label: 'Save Current File', category: 'File', defaultKeys: 'Ctrl+S', handler: handleSave },
    { id: 'saveAll', label: 'Save All Files', category: 'File', defaultKeys: 'Ctrl+Shift+S', handler: handleSaveAll },
    { id: 'undo', label: 'Undo', category: 'Edit', defaultKeys: 'Ctrl+Z', handler: handleUndo },
    { id: 'redo', label: 'Redo', category: 'Edit', defaultKeys: 'Ctrl+Shift+Z', handler: handleRedo },
    { id: 'newFile', label: 'Create New File', category: 'File', defaultKeys: 'Ctrl+N', handler: handleNewFile, when: '!inputFocus' },
    { id: 'newFolder', label: 'Create New Folder', category: 'File', defaultKeys: '', handler: handleNewFolder },
    { id: 'openFolder', label: 'Open Folder', category: 'File', defaultKeys: '', handler: handleOpenFolder },
    { id: 'toggleTerminal', label: 'Toggle Terminal', category: 'View', defaultKeys: 'Ctrl+`', handler: () => setBottomPanelOpen(prev => !prev), when: '!inputFocus' },
    { id: 'toggleSidebar', label: 'Toggle Sidebar', category: 'View', defaultKeys: 'Ctrl+B', handler: () => setSidebarOpen(prev => !prev), when: '!inputFocus' },
    { id: 'toggleRightSidebar', label: 'Toggle Right Sidebar', category: 'View', defaultKeys: '', handler: () => setRightSidebarOpen(prev => !prev), when: '!inputFocus' },
    {
      id: 'toggleTheme', label: 'Toggle Theme', category: 'View', defaultKeys: '',
      handler: () => { const newTheme = theme === 'light' ? 'dark' : 'light'; setTheme(newTheme); setSettings(prev => ({ ...prev, colorTheme: newTheme })); },
    },
    { id: 'searchFiles', label: 'Search Files', category: 'Navigate', defaultKeys: 'Ctrl+Shift+F', handler: () => { setActiveSidebarTab('search'); setSidebarOpen(true); }, when: '!inputFocus' },
    { id: 'commandPalette', label: 'Command Palette', category: 'Navigate', defaultKeys: 'Ctrl+Shift+P', handler: () => setCommandPaletteOpen(true), when: '!inputFocus' },
    { id: 'openSettings', label: 'Open Settings', category: 'Tools', defaultKeys: 'Ctrl+,', handler: () => setSettingsModalOpen(true), when: '!inputFocus' },
    { id: 'openKeybindings', label: 'Open Keyboard Shortcuts', category: 'Tools', defaultKeys: 'Ctrl+K Ctrl+S', handler: () => setKeybindingsModalOpen(true), when: '!inputFocus' },
    { id: 'runFile', label: 'Run Active File', category: 'Project', defaultKeys: '', handler: handleRun },
    { id: 'publishProject', label: 'Publish Project', category: 'Project', defaultKeys: '', handler: () => setPublishModalOpen(true) },
  ], [handleSave, handleSaveAll, handleUndo, handleRedo, handleNewFile, handleNewFolder, handleOpenFolder, handleRun, setPublishModalOpen, setSettingsModalOpen, setCommandPaletteOpen, setKeybindingsModalOpen, setBottomPanelOpen, setSidebarOpen, setActiveSidebarTab, theme, setTheme, setSettings]);

  // ── Global keyboard shortcut handler via command registry ───────
  const handleKeyDown = useKeybindingHandler(commands);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  return (
    <div
      className="app-container"
      style={{
        '--footer-height': footerCollapsed ? '0px' : '80px',
      } as React.CSSProperties}
    >
      <TitleBar />
      <Toolbar />

      <div className="workbench">
        <ActivityBar />
        {!sidebarOnRight && sidebarOpen && (
          <div style={{ width: `${sidebarWidth}px`, height: '100%', display: 'flex', position: 'relative' }}>
            {activeSidebarTab === 'explorer' ? (
              <ExplorerSidebar />
            ) : (
              <SidebarPanels />
            )}
            {/* VS Code style resize handle with invisible wider hit area */}
            <div
              className={`resize-handle ${resizing === 'left' ? 'active' : ''}`}
              onMouseDown={(e) => startResizing('left', e)}
              onDoubleClick={() => resetSize('left')}
            />
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <EditorArea />
          </div>
          {bottomPanelOpen && (
            <div style={{ height: `${bottomPanelHeight}px`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div
                className={`resize-handle-row ${resizing === 'bottom' ? 'active' : ''}`}
                onMouseDown={(e) => startResizing('bottom', e)}
                onDoubleClick={() => resetSize('bottom')}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <BottomPanel />
              </div>
            </div>
          )}
        </div>

        {sidebarOnRight && sidebarOpen && (
          <div style={{ width: `${sidebarWidth}px`, height: '100%', display: 'flex', position: 'relative' }}>
            <div
              className={`resize-handle ${resizing === 'left' ? 'active' : ''}`}
              onMouseDown={(e) => startResizing('left', e)}
              onDoubleClick={() => resetSize('left')}
            />
            {activeSidebarTab === 'explorer' ? (
              <ExplorerSidebar />
            ) : (
              <SidebarPanels />
            )}
          </div>
        )}

        {rightSidebarOpen && (
          <div style={{ width: `${rightSidebarWidth}px`, height: '100%', display: 'flex', position: 'relative' }}>
            <div
              className={`resize-handle right-sidebar-handle ${resizing === 'right' ? 'active' : ''}`}
              onMouseDown={(e) => startResizing('right', e)}
              onDoubleClick={() => resetSize('right')}
            />
            <RightSidebar />
          </div>
        )}
      </div>

      {settings.statusBarVisible && <StatusBar />}
      <Footer />

      {publishModalOpen && <PublishModal />}
      {settingsModalOpen && <SettingsModal />}
      {commandPaletteOpen && <CommandPalette />}
      {keybindingsModalOpen && <KeybindingsModal />}
      <ConfirmDialog />
    </div>
  );
}
