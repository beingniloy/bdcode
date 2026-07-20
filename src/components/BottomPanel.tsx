import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Trash2, X, AlertTriangle, Info, XCircle, Copy, Clipboard, Maximize2, Minimize2 } from 'lucide-react';
import { FileSystemItem } from '../types';
import { useLayout } from '../contexts/LayoutContext';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';
import XTerminal from './XTerminal';
import { useContextMenu } from '../hooks/useContextMenu';
import ContextMenu from './ContextMenu';

interface ProblemItem {
  file: string;
  path: string;
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export default React.memo(function BottomPanel() {
  const { setBottomPanelOpen } = useLayout();
  const onClose = useCallback(() => setBottomPanelOpen(false), [setBottomPanelOpen]);
  const t = useTranslation('bottomPanel');
  const { files, terminalLines, setTerminalLines, handleFileSelect } = useFileSystem();
  const { settings } = useSettings();
  const { language } = settings;

  const [activeTab, setActiveTab] = useState<'terminal' | 'problems' | 'output' | 'debug'>('terminal');
  const [platform, setPlatform] = useState<'win32' | 'darwin' | 'linux'>('win32');

  // Debug REPL
  const [debugLines, setDebugLines] = useState<Array<{ text: string; type: 'input' | 'output' | 'error' }>>([
    { text: '// Bangladesh Code JavaScript REPL â€“ type any expression and press Enter', type: 'output' },
  ]);
  const [debugInput, setDebugInput] = useState('');
  const debugEndRef = useRef<HTMLDivElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  const shellLabel = settings.terminalShell === 'powershell.exe' ? 'PowerShell' : settings.terminalShell === 'cmd.exe' ? 'CMD' : platform === 'win32' ? 'PowerShell' : platform === 'darwin' ? 'zsh' : 'bash';

  const { menu, menuRef, showMenu, hideMenu } = useContextMenu();

  // Performance Cache: Map each immutable FileSystemItem reference to its static analysis problem details
  // Avoids re-scanning unmodified files, dramatically improving responsiveness.
  const problemsCache = useMemo(() => new WeakMap<FileSystemItem, ProblemItem[]>(), []);

  // Static analysis scanner
  const problems = useMemo(() => {
    const list: ProblemItem[] = [];
    const scan = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.isFolder && item.children) {
          scan(item.children);
          continue;
        }
        if (!item.isFolder) {
          // Check WeakMap cache first
          const cached = problemsCache.get(item);
          if (cached) {
            list.push(...cached);
            continue;
          }

          const fileProblems: ProblemItem[] = [];
          if (item.content) {
            item.content.split('\n').forEach((lineText, idx) => {
              if (lineText.includes('TODO')) {
                fileProblems.push({ file: item.name, path: item.path, line: idx + 1, message: lineText.substring(lineText.indexOf('TODO')).replace(/^TODO:?\s*/, '') || 'TODO item', severity: 'info' });
              }
              if (/\{\s*\}/.test(lineText) && !lineText.includes('=>') && !lineText.includes('const')) {
                fileProblems.push({ file: item.name, path: item.path, line: idx + 1, message: 'Empty block detected', severity: 'warning' });
              }
              if (lineText.includes('console.log')) {
                fileProblems.push({ file: item.name, path: item.path, line: idx + 1, message: 'Remove console.log before production', severity: 'warning' });
              }
            });
          }

          problemsCache.set(item, fileProblems);
          list.push(...fileProblems);
        }
      }
    };
    scan(files);
    return list;
  }, [files, problemsCache]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getPlatform().then(p => setPlatform(p));
    }
  }, []);

  useEffect(() => {
    debugEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [debugLines]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [terminalLines]);

  const handleDebugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expr = debugInput.trim();
    if (!expr) return;
    const newLines = [...debugLines, { text: `> ${expr}`, type: 'input' as const }];
    try {
      let result: unknown;
      if (settings.sandboxEnabled) {
        const sandboxFn = new Function('fetch', 'XMLHttpRequest', 'WebSocket', `return (${expr})`);
        result = sandboxFn(
          () => { throw new Error('[Sandbox] fetch is disabled'); },
          { open: () => {}, send: () => {} },
          function() { throw new Error('[Sandbox] WebSocket is disabled'); }
        );
      } else {
        // eslint-disable-next-line no-new-func
        result = new Function(`return (${expr})`)();
      }
      const output = result === undefined ? 'undefined' : result === null ? 'null' : typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      setDebugLines([...newLines, { text: output, type: 'output' as const }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setDebugLines([...newLines, { text: message, type: 'error' as const }]);
    }
    setDebugInput('');
  };

  const panelTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center',
    fontSize: '12px', color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    borderBottom: active ? '1px solid var(--text-primary)' : '1px solid transparent',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', gap: '6px', background: 'transparent',
  });

  const handleTerminalContextMenu = (e: React.MouseEvent) => {
    showMenu(e, [
      { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', action: async () => {
        try { const sel = document.getSelection()?.toString(); if (sel) await navigator.clipboard.writeText(sel); } catch {}
      }},
      { label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: async () => {
        try { const text = await navigator.clipboard.readText(); if (text && window.electronAPI) window.electronAPI.sendTerminalInput(text); } catch {}
      }},
      { divider: true, label: '' },
      { label: t('clear'), icon: <Trash2 size={14} />, action: () => setTerminalLines([]) },
      { divider: true, label: '' },
      { label: 'Maximize Panel', icon: <Maximize2 size={14} />, action: () => { document.documentElement.style.setProperty('--bottom-panel-height', '80vh'); setBottomPanelOpen(true); } },
      { label: 'Minimize Panel', icon: <Minimize2 size={14} />, action: () => setBottomPanelOpen(false) },
      { divider: true, label: '' },
      { label: t('closePanel'), icon: <X size={14} />, action: onClose },
    ]);
  };

  const handleDebugContextMenu = (e: React.MouseEvent) => {
    showMenu(e, [
      { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', action: async () => {
        try { const sel = document.getSelection()?.toString(); if (sel) await navigator.clipboard.writeText(sel); } catch {}
      }},
      { label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: async () => {
        try { const text = await navigator.clipboard.readText(); if (text) setDebugInput(prev => prev + text); } catch {}
      }},
      { divider: true, label: '' },
      { label: t('clear'), icon: <Trash2 size={14} />, action: () => setDebugLines([
        { text: '// Bangladesh Code JavaScript REPL â€“ type any expression and press Enter', type: 'output' },
      ]) },
      { divider: true, label: '' },
      { label: 'Maximize Panel', icon: <Maximize2 size={14} />, action: () => { document.documentElement.style.setProperty('--bottom-panel-height', '80vh'); setBottomPanelOpen(true); } },
      { label: 'Minimize Panel', icon: <Minimize2 size={14} />, action: () => setBottomPanelOpen(false) },
      { divider: true, label: '' },
      { label: t('closePanel'), icon: <X size={14} />, action: onClose },
    ]);
  };

  const handleTabContextMenu = (e: React.MouseEvent, tab: string) => {
    const tabLabel = tab === 'terminal' ? t('terminal') : tab === 'problems' ? t('problems') : tab === 'output' ? t('output') : t('debug');
    showMenu(e, [
      { label: `Close ${tabLabel}`, icon: <X size={14} />, action: onClose },
      { divider: true, label: '' },
      ...(!['terminal', 'debug'].includes(tab) ? [] : [
        { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', action: async () => {
          try { const sel = document.getSelection()?.toString(); if (sel) await navigator.clipboard.writeText(sel); } catch {}
        }},
        { label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              if (tab === 'terminal' && window.electronAPI) window.electronAPI.sendTerminalInput(text);
              else if (tab === 'debug') setDebugInput(prev => prev + text);
            }
          } catch {}
        }},
        { divider: true, label: '' },
        ...(tab === 'terminal' ? [
          { label: t('clear'), icon: <Trash2 size={14} />, action: () => setTerminalLines([]) },
        ] : [
          { label: t('clear'), icon: <Trash2 size={14} />, action: () => setDebugLines([{ text: '// Bangladesh Code JavaScript REPL â€“ type any expression and press Enter', type: 'output' }]) },
        ]),
      ]),
    ]);
  };

  return (
    <div role="region" aria-label={t('terminal')} style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: '36px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', userSelect: 'none', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }} role="tablist">
          {(['terminal', 'problems', 'output', 'debug'] as const).map(tab => (
            <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} onContextMenu={(e) => handleTabContextMenu(e, tab)} style={panelTabStyle(activeTab === tab)}>
              {tab === 'terminal' && t('terminal')}
              {tab === 'problems' && <>{t('problems')} {problems.length > 0 && <span style={{ background: problems.some(p => p.severity === 'error') ? 'var(--gov-red)' : '#e8a000', color: 'white', borderRadius: '10px', padding: '0 5px', fontSize: '10px', fontWeight: 'bold' }}>{problems.length}</span>}</>}
              {tab === 'output' && t('output')}
              {tab === 'debug' && t('debug')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 6px' }}>
          {activeTab === 'terminal' && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '0 8px' }}>{shellLabel}</span>}
          {activeTab === 'debug' && (
            <button onClick={() => setDebugLines([])} title={t('clear')} style={{ padding: '4px' }} className="panel-btn" aria-label={t('clear')}><Trash2 size={13} /></button>
          )}
          <button onClick={onClose} title={t('closePanel')} style={{ padding: '4px' }} className="panel-btn" aria-label={t('closePanel')}><X size={13} /></button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: '100%', height: '100%', display: activeTab === 'terminal' ? 'block' : 'none' }} onContextMenu={handleTerminalContextMenu}>
          <XTerminal visible={activeTab === 'terminal'} terminalFontSize={settings.terminalFontSize} terminalCursorStyle={settings.terminalCursorStyle} fontFamily={settings.fontFamily} terminalShell={settings.terminalShell} />
        </div>

        {activeTab === 'problems' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px', boxSizing: 'border-box' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 10px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('problemsHeading')}</p>
            {problems.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', padding: '8px 0' }}><Info size={14} />{t('noProblems')}</div>
            ) : (
              problems.map((p, i) => (
                <div key={i} onClick={() => { handleFileSelect(p.path); }} title={`${p.file}:${p.line} â€“ ${p.message}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '5px 8px', marginBottom: '2px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }} className="problem-item">
                  {p.severity === 'error' && <XCircle size={14} style={{ marginTop: '1px', flexShrink: 0 }} color="var(--gov-red)" />}
                  {p.severity === 'warning' && <AlertTriangle size={14} style={{ marginTop: '1px', flexShrink: 0 }} color="#e8a000" />}
                  {p.severity === 'info' && <Info size={14} style={{ marginTop: '1px', flexShrink: 0 }} color="var(--gov-green)" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.message}</span>
                    <span style={{ marginLeft: '8px', opacity: 0.6 }}>{p.file}:{p.line}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e', color: '#cccccc', fontFamily: `"${settings.fontFamily}", "Consolas", monospace`, fontSize: '12px', lineHeight: '1.6' }}>
            {activeTab === 'output' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <button onClick={() => setTerminalLines([])} title={t('clear')} style={{ padding: '2px 6px', fontSize: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trash2 size={11} /><span>{t('clear')}</span>
                </button>
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {terminalLines.length > 0 ? terminalLines.map((line, i) => (
                <div key={i} style={{ color: line.type === 'error' ? '#f44747' : line.type === 'input' ? '#9cdcfe' : line.type === 'system' ? '#6a9955' : '#cccccc', whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '1px 0' }}>{line.text}</div>
              )) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
                  {language === 'bn' ? 'কোনো আউটপুট নেই — ফাইল চালানো বা কমান্ড চালানো হলে এখানে দেখা যাবে।' : 'No output yet — run a file or command to see results here.'}
                </div>
              )}
              <div ref={outputEndRef} />
            </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e', fontFamily: `"${settings.fontFamily}", "Consolas", monospace`, fontSize: '12px', lineHeight: '1.6' }} onContextMenu={handleDebugContextMenu}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {debugLines.map((l, i) => (
                <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: l.type === 'error' ? '#f44747' : l.type === 'input' ? '#9cdcfe' : '#cccccc', padding: '1px 0' }}>{l.text}</div>
              ))}
              <div ref={debugEndRef} />
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px', background: '#1e1e1e' }}>
              <form onSubmit={handleDebugSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#6a9955', fontWeight: 'bold' }}>&gt;</span>
                <input type="text" value={debugInput} onChange={e => setDebugInput(e.target.value)} placeholder={t('debugPlaceholder')} spellCheck={false} autoComplete="off" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#cccccc', fontFamily: 'inherit', fontSize: 'inherit', caretColor: 'white', padding: 0 }} />
              </form>
            </div>
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
