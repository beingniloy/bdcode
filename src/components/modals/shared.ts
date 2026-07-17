import React from 'react';

// ── Shared style objects ────────────────────────────────────────

export const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
};

export const modalStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  overflow: 'hidden',
};

export const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 18px',
  borderBottom: '1px solid var(--border-color)',
};

export const closeBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  transition: 'background 0.2s',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 'bold',
  color: 'var(--text-secondary)',
  marginBottom: '4px',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 8px',
  borderRadius: '4px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  fontSize: '12px',
  color: 'var(--text-primary)',
  outline: 'none',
  marginTop: '2px',
};

export const secondaryBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '4px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  fontSize: '11px',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

export const sidebarBtnStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 12px',
  borderRadius: '4px',
  border: 'none',
  background: active ? 'var(--bg-dark-active)' : 'transparent',
  color: active ? 'var(--gov-green)' : 'var(--text-secondary)',
  fontSize: '11.5px',
  fontWeight: active ? 'bold' : 'normal',
  cursor: 'pointer',
  textAlign: 'left' as const,
  width: '100%',
  transition: 'all 0.15s',
});

export const kbdHintStyle: React.CSSProperties = {
  fontSize: '9px',
  padding: '1px 4px',
  borderRadius: '2px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  fontFamily: 'inherit',
  marginRight: '2px',
};
