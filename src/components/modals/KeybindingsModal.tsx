import { useState, useMemo, useCallback } from 'react';
import { X, Search, File, Eye, Command, Sliders, RotateCcw, AlertTriangle, Keyboard } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useModal } from '../../contexts/ModalContext';
import { showConfirm } from '../../hooks/useDialog';
import { useTranslation } from '../../hooks/useTranslation';
import { eventToShortcut } from '../../utils';
import { overlayStyle, modalStyle, kbdHintStyle } from './shared';
import COMMANDS, { getCommandLabel } from '../../commands';

interface BindingRow {
  id: string;
  label: string;
  category: string;
  keys: string;
  isCustom: boolean;
  icon: React.ReactNode;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  File: <File size={14} />,
  View: <Eye size={14} />,
  Navigate: <Search size={14} />,
  Tools: <Sliders size={14} />,
  Project: <Command size={14} />,
};

export function KeybindingsModal({ onClose }: { onClose?: () => void }) {
  const { setKeybindingsModalOpen } = useModal();
  const { getShortcut, userKeybindings, setKeybinding, resetKeybinding, resetAllKeybindings, getConflicts } = useSettings();
  const close = onClose || (() => setKeybindingsModalOpen(false));
  const t = useTranslation('keybindingsModal');

  const [searchQuery, setSearchQuery] = useState('');
  const [recordingId, setRecordingId] = useState<string | null>(null);

  // Build rows from the shared COMMANDS registry instead of a separate COMMAND_LABELS
  const allRows: BindingRow[] = useMemo(() => {
    return COMMANDS.map(cmd => ({
      id: cmd.id,
      label: cmd.label,
      category: cmd.category,
      keys: getShortcut(cmd.id),
      isCustom: cmd.id in userKeybindings,
      icon: CATEGORY_ICONS[cmd.category] || <Command size={14} />,
    }));
  }, [getShortcut, userKeybindings]);

  // Filter by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return allRows;
    const q = searchQuery.toLowerCase();
    return allRows.filter(r =>
      r.label.toLowerCase().includes(q) ||
      r.keys.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }, [allRows, searchQuery]);

  // Group by category
  const groupedRows = useMemo(() => {
    const groups: { category: string; rows: BindingRow[] }[] = [];
    const map = new Map<string, BindingRow[]>();
    for (const row of filteredRows) {
      if (!map.has(row.category)) map.set(row.category, []);
      map.get(row.category)!.push(row);
    }
    for (const [category, rows] of map) {
      groups.push({ category, rows });
    }
    return groups;
  }, [filteredRows]);

  // Get conflicts
  const conflicts = useMemo(() => getConflicts(), [getConflicts, userKeybindings]);

  // Handle recording a new shortcut
  const startRecording = useCallback((id: string) => {
    setRecordingId(id);
  }, []);

  const handleKeydownInRecording = useCallback((e: React.KeyboardEvent) => {
    if (!recordingId) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setRecordingId(null);
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setKeybinding(recordingId, '');
      setRecordingId(null);
      return;
    }

    const shortcut = eventToShortcut(e);
    if (shortcut) {
      setKeybinding(recordingId, shortcut);
      setRecordingId(null);
    }
  }, [recordingId, setKeybinding]);

  const handleResetAll = useCallback(async () => {
    if (await showConfirm(t('resetAllConfirm'))) {
      resetAllKeybindings();
    }
  }, [resetAllKeybindings, t]);

  // Focus search input on mount
  const searchRef = useCallback((el: HTMLInputElement | null) => {
    el?.focus();
  }, []);

  return (
    <div style={overlayStyle} onClick={close}>
      <div
        style={{ ...modalStyle, width: '680px', maxHeight: '620px', display: 'flex', flexDirection: 'column' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header with search ── */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-secondary)',
        }}>
          <Keyboard size={16} style={{ color: 'var(--gov-green)', flexShrink: 0 }} />
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)', flexShrink: 0 }}>
            {t('title')}
          </span>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              ref={searchRef}
              type="text"
              placeholder={t('placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px 5px 26px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filteredRows.length} item{filteredRows.length !== 1 ? 's' : ''}
          </span>
          <button onClick={close} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} aria-label="Close"><X size={16} /></button>
        </div>

        {/* ── Conflict warnings ── */}
        {conflicts.length > 0 && (
          <div style={{
            padding: '8px 18px',
            background: 'rgba(255, 152, 0, 0.08)',
            borderBottom: '1px solid rgba(255, 152, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', color: 'var(--warning-color)' }}>
              <AlertTriangle size={13} />
              <span>{t('conflict')}</span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{t('conflictDesc')}</div>
            {conflicts.map(c => (
              <div key={c.shortcut} style={{ fontSize: '10.5px', color: 'var(--warning-color)', paddingLeft: '20px' }}>
                <kbd style={{ ...kbdHintStyle, background: 'rgba(255,152,0,0.15)', border: '1px solid rgba(255,152,0,0.3)', color: 'var(--warning-color)' }}>{c.shortcut}</kbd>
                {' → '}
                {c.commands.map(id => getCommandLabel(id)).join(', ')}
              </div>
            ))}
          </div>
        )}

        {/* ── Column headers ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 60px',
          padding: '6px 18px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          fontSize: '10px',
          fontWeight: 'bold',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          <span>Command</span>
          <span>Shortcut</span>
          <span style={{ textAlign: 'right' }}></span>
        </div>

        {/* ── Scrollable results ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {groupedRows.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '32px' }}>
              {t('noResults')}
            </div>
          ) : (
            groupedRows.map(group => (
              <div key={group.category}>
                <div style={{
                  padding: '8px 18px 4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: 'var(--gov-green)',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {CATEGORY_ICONS[group.category]}
                  {group.category}
                </div>
                {group.rows.map(row => {
                  const isRecording = recordingId === row.id;
                  const isConflict = conflicts.some(c =>
                    c.commands.includes(row.id) && c.shortcut === row.keys
                  );

                  return (
                    <div
                      key={row.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 140px 60px',
                        alignItems: 'center',
                        padding: '5px 18px',
                        fontSize: '12px',
                        borderBottom: '1px solid var(--border-color)',
                        background: isRecording ? 'rgba(22, 106, 78, 0.05)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      className="keybinding-row"
                    >
                      {/* Command name */}
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {row.label}
                      </span>

                      {/* Shortcut — click to record */}
                      <div
                        onClick={() => !isRecording && startRecording(row.id)}
                        onKeyDown={isRecording ? handleKeydownInRecording : undefined}
                        tabIndex={0}
                        title={isRecording ? t('pressKeys') : row.isCustom ? `${t('custom')}: ${row.keys}` : t('clickToChange')}
                        style={{
                          cursor: 'pointer',
                          justifySelf: 'start',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: isRecording
                            ? '2px solid var(--accent-color)'
                            : isConflict
                            ? '1px solid rgba(255,152,0,0.5)'
                            : '1px solid var(--border-color)',
                          background: isRecording
                            ? 'var(--accent-color)'
                            : isConflict
                            ? 'rgba(255,152,0,0.08)'
                            : row.isCustom
                            ? 'rgba(22, 106, 78, 0.08)'
                            : 'var(--bg-secondary)',
                          color: isRecording
                            ? 'white'
                            : isConflict
                            ? 'var(--warning-color)'
                            : 'var(--text-primary)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          transition: 'all 0.15s',
                          outline: 'none',
                          minWidth: '60px',
                          textAlign: 'center',
                        }}
                        className="keybinding-shortcut"
                      >
                        {isRecording ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ animation: 'pulse 1s infinite' }}>⌨</span>
                            {t('pressKeys')}
                          </span>
                        ) : row.keys ? (
                          row.keys
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                        )}
                      </div>

                      {/* Reset button */}
                      <div style={{ justifySelf: 'end' }}>
                        {row.isCustom && (
                          <button
                            onClick={() => resetKeybinding(row.id)}
                            title={t('reset')}
                            style={{
                              padding: '3px 6px',
                              borderRadius: '3px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: 0.6,
                              transition: 'opacity 0.15s',
                            }}
                            className="keybinding-reset-btn"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '8px 18px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          fontSize: '10px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><kbd style={kbdHintStyle}>Click</kbd> shortcut to change</span>
            <span><kbd style={kbdHintStyle}>Esc</kbd> cancel recording</span>
            <span><kbd style={kbdHintStyle}>⌫</kbd> remove binding</span>
          </div>
          <button
            onClick={handleResetAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--danger-color)',
              fontSize: '10.5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            className="keybinding-reset-all-btn"
          >
            <RotateCcw size={12} />
            {t('resetAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
