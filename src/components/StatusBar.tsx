import React, { useCallback, useState, useEffect } from 'react';
import { GitBranch, AlertCircle, CheckCircle, Bell, Terminal, Settings, Search, Command, BookOpen, ChevronDown, ChevronUp, Download, RefreshCw, Hash } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useLayout } from '../contexts/LayoutContext';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useModal } from '../contexts/ModalContext';
import { useTranslation } from '../hooks/useTranslation';
import { showPrompt } from '../hooks/useDialog';
import { useContextMenu } from '../hooks/useContextMenu';
import ContextMenu from './ContextMenu';

export default React.memo(function StatusBar() {
  const { cursorLine, cursorCol, gitBranch, getActiveLanguageName, settings } = useSettings();
  const { bottomPanelOpen, setBottomPanelOpen, footerCollapsed, setFooterCollapsed, setActiveSidebarTab, setSidebarOpen } = useLayout();
  const { activeFile, problemsCount } = useFileSystem();
  const { setSettingsModalOpen, setCommandPaletteOpen } = useModal();
  const t = useTranslation('statusBar');
  const tFooter = useTranslation('footer');
  const activeLanguage = getActiveLanguageName(activeFile);
  const { errors: errorCount, warnings: warningCount } = problemsCount;
  const onToggleBottomPanel = useCallback(() => setBottomPanelOpen(!bottomPanelOpen), [setBottomPanelOpen, bottomPanelOpen]);
  const onToggleFooter = useCallback(() => setFooterCollapsed(!footerCollapsed), [setFooterCollapsed, footerCollapsed]);
  const eol = navigator.userAgent.includes('Win') ? 'CRLF' : 'LF';

  const [updateInfo, setUpdateInfo] = useState<{ version: string; releaseDate: string } | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsubs = [
      window.electronAPI.onUpdateAvailable((info) => {
        setUpdateInfo(info);
        setUpdateDownloaded(false);
      }),
      window.electronAPI.onUpdateDownloadProgress((progress) => {
        setDownloadProgress(Math.round(progress.percent));
      }),
      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateDownloaded(true);
        setDownloading(false);
      }),
      window.electronAPI.onUpdateNotAvailable(() => {
        setUpdateInfo(null);
      }),
    ];
    return () => { unsubs.forEach((unsub) => unsub()); };
  }, []);

  const handleDownloadUpdate = useCallback(async () => {
    if (!window.electronAPI) return;
    setDownloading(true);
    await window.electronAPI.downloadUpdate();
  }, []);

  const handleInstallUpdate = useCallback(() => {
    if (!window.electronAPI) return;
    window.electronAPI.installUpdate();
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.checkForUpdates();
    if (!result.updateAvailable) {
      setUpdateInfo(null);
    }
  }, []);

  const { menu, menuRef, showMenu, hideMenu } = useContextMenu();

  const handleStatusBarContextMenu = (e: React.MouseEvent) => {
    showMenu(e, [
      { label: 'Command Palette', icon: <Command size={14} />, shortcut: 'Ctrl+Shift+P', action: () => setCommandPaletteOpen(true) },
      { label: 'Open Settings', icon: <Settings size={14} />, shortcut: 'Ctrl+,', action: () => setSettingsModalOpen(true) },
      { divider: true, label: '' },
      { label: `Go to Line ${cursorLine}:${cursorCol}`, icon: <Hash size={14} />, action: async () => {
        const input = await showPrompt(`Go to line (current: ${cursorLine}:${cursorCol}):`, `${cursorLine}`);
        if (input) {
          const lineNum = parseInt(input, 10);
          if (!isNaN(lineNum) && lineNum > 0) {
            window.dispatchEvent(new CustomEvent('bdcode-goto-line', { detail: { line: lineNum } }));
          }
        }
      } },
      { divider: true, label: '' },
      { label: t('terminal'), icon: <Terminal size={14} />, action: onToggleBottomPanel },
      { label: footerCollapsed ? tFooter('expand') : tFooter('collapse'), icon: footerCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />, action: onToggleFooter },
      { label: 'Search Files', icon: <Search size={14} />, shortcut: 'Ctrl+Shift+F', action: () => { setActiveSidebarTab('search'); setSidebarOpen(true); } },
      { divider: true, label: '' },
      { label: 'Problems', icon: <AlertCircle size={14} />, action: () => { setBottomPanelOpen(true); } },
      { label: 'Explorer', icon: <BookOpen size={14} />, action: () => { setActiveSidebarTab('explorer'); setSidebarOpen(true); } },
      { divider: true, label: '' },
      { label: 'Notifications', icon: <Bell size={14} />, action: () => { setShowUpdatePopup(!showUpdatePopup); } },
    ]);
  };

  return (
    <div className="status-bar" style={{
      height: 'var(--status-bar-height)', background: 'var(--gov-green-dark)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', fontSize: '11px', userSelect: 'none', zIndex: 40, position: 'relative'
    }} onContextMenu={handleStatusBarContextMenu}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="status-item" aria-label={`Git branch: ${gitBranch}`}>
          <GitBranch size={13} /><span>{gitBranch}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="status-item" aria-label={`${errorCount + warningCount} ${t('problems')}`} onClick={() => setBottomPanelOpen(true)}>
          <AlertCircle size={13} color={(errorCount > 0) ? 'var(--gov-red)' : 'white'} />
          <span>{errorCount} ⚠️ {warningCount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={13} color="#4ade80" />
          <span>{errorCount + warningCount === 0 ? t('noProblems') : `${errorCount + warningCount} ${t('problems')}`}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>{t('line')} {cursorLine}, {t('col')} {cursorCol}</div>
        <div>{t('space')}: {settings.tabSize}</div>
        <div>UTF-8</div>
        <div>{eol}</div>
        <div style={{ textTransform: 'uppercase' }}>{activeLanguage}</div>
        <div>{t('locale')}</div>
        <div
          onClick={onToggleBottomPanel}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '2px 6px', borderRadius: '3px', background: bottomPanelOpen ? 'rgba(255,255,255,0.15)' : 'transparent', transition: 'background 0.2s' }}
          className="status-item" title={t('terminal')}
        >
          <Terminal size={13} /><span>{t('terminal')}</span>
        </div>
        <div
          onClick={onToggleFooter}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '2px 6px', borderRadius: '3px', background: footerCollapsed ? 'transparent' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }}
          className="status-item" title={footerCollapsed ? tFooter('expand') : tFooter('collapse')}
        >
          {footerCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span>{footerCollapsed ? tFooter('expand') : tFooter('collapse')}</span>
        </div>
        <div
          onClick={() => setShowUpdatePopup(!showUpdatePopup)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative', padding: '2px 6px', borderRadius: '3px' }}
          className="status-item"
          title={updateInfo ? `${t('updateAvailable')}: v${updateInfo.version}` : t('checkForUpdates')}
        >
          <Bell size={13} />
          {updateInfo && (
            <span style={{
              position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px',
              borderRadius: '50%', background: '#f59e0b', border: '1.5px solid var(--gov-green-dark)'
            }} />
          )}
        </div>

        {showUpdatePopup && (
          <div style={{
            position: 'absolute', bottom: '100%', right: '12px', marginBottom: '8px',
            background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
            borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            padding: '16px', minWidth: '280px', zIndex: 100, color: 'var(--text-primary)'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={14} /> {t('notifications')}
            </div>
            {updateDownloaded ? (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gov-green)', marginBottom: '10px', fontWeight: 500 }}>
                  {t('updateReady')}
                </div>
                <button onClick={handleInstallUpdate} style={{
                  width: '100%', padding: '8px', borderRadius: '4px', border: 'none',
                  background: 'var(--gov-green)', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                  <RefreshCw size={13} /> {t('restartAndUpdate')}
                </button>
              </div>
            ) : downloading ? (
              <div>
                <div style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  {t('downloading')}... {downloadProgress}%
                </div>
                <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${downloadProgress}%`, background: 'var(--gov-green)', transition: 'width 0.3s' }} />
                </div>
              </div>
            ) : updateInfo ? (
              <div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                  {t('newVersion')}: <strong>v{updateInfo.version}</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {t('downloadAndInstall')}
                </div>
                <button onClick={handleDownloadUpdate} style={{
                  width: '100%', padding: '8px', borderRadius: '4px', border: 'none',
                  background: 'var(--gov-green)', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                  <Download size={13} /> {t('download')}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {t('noUpdates')}
                </div>
                <button onClick={handleCheckUpdate} style={{
                  width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                  <RefreshCw size={13} /> {t('checkForUpdates')}
                </button>
              </div>
            )}
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
