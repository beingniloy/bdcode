import React from 'react';
import type { ContextMenuItem } from '../hooks/useContextMenu';

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

export default React.memo(function ContextMenu({ x, y, items, onClose, menuRef }: Props) {
  const handleItemClick = async (item: ContextMenuItem) => {
    if (item.disabled || item.divider) return;
    // Close menu first so dialogs (delete confirm, rename prompt) aren't blocked by the menu's z-index
    onClose();
    const result = item.action?.() as unknown;
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      await result;
    }
  };

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 99999,
    minWidth: '200px',
    maxWidth: '280px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)',
    padding: '4px 0',
    fontFamily: 'var(--font-primary)',
    fontSize: '12px',
    color: 'var(--text-primary)',
    userSelect: 'none',
    animation: 'ctx-menu-fade-in 0.1s ease-out',
  };

  return (
    <div ref={menuRef} style={menuStyle} className="context-menu" role="menu">
      {items.map((item, idx) => {
        if (item.divider) {
          return (
            <div
              key={`div-${idx}`}
              style={{
                height: '1px',
                background: 'var(--border-color)',
                margin: '4px 8px',
              }}
            />
          );
        }

        const itemStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '5px 12px 5px 10px',
          cursor: item.disabled ? 'default' : 'pointer',
          color: item.danger ? 'var(--gov-red)' : item.disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          opacity: item.disabled ? 0.5 : 1,
          transition: 'background 0.08s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        };

        return (
          <div
            key={`${item.label}-${idx}`}
            role="menuitem"
            style={itemStyle}
            className="context-menu-item"
            onMouseEnter={(e) => {
              if (!item.disabled) {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-color)';
                (e.currentTarget as HTMLDivElement).style.color = '#fff';
                const shortcut = e.currentTarget.querySelector('.ctx-shortcut') as HTMLElement;
                if (shortcut) shortcut.style.color = 'rgba(255,255,255,0.8)';
                const chevron = e.currentTarget.querySelector('.ctx-chevron') as HTMLElement;
                if (chevron) chevron.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              (e.currentTarget as HTMLDivElement).style.color = item.danger ? 'var(--gov-red)' : item.disabled ? 'var(--text-muted)' : 'var(--text-primary)';
              const shortcut = e.currentTarget.querySelector('.ctx-shortcut') as HTMLElement;
              if (shortcut) shortcut.style.color = 'var(--text-muted)';
              const chevron = e.currentTarget.querySelector('.ctx-chevron') as HTMLElement;
              if (chevron) chevron.style.color = 'var(--text-secondary)';
            }}
            onClick={() => handleItemClick(item)}
          >
            {item.icon && (
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: '16px', justifyContent: 'center' }}>
                {item.icon}
              </span>
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            {item.shortcut && (
              <span className="ctx-shortcut" style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '16px', flexShrink: 0 }}>
                {item.shortcut}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});
