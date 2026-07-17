import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import { useSettings } from '../contexts/SettingsContext';

export default function ConfirmDialog() {
  const { dialog, closeDialog } = useDialog();
  const { language } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  const translations = {
    bn: {
      ok: 'ঠিক আছে',
      cancel: 'বাতিল',
      close: 'বন্ধ করুন',
      info: 'তথ্য',
      confirm: 'নিশ্চিতকরণ',
      input: 'ইনপুট',
    },
    en: {
      ok: 'OK',
      cancel: 'Cancel',
      close: 'Close',
      info: 'Info',
      confirm: 'Confirm',
      input: 'Input',
    }
  }[language];

  useEffect(() => {
    if (dialog.type === 'prompt') {
      setInputValue(dialog.defaultValue || '');
    }
  }, [dialog]);

  useEffect(() => {
    if (dialog.type === 'prompt' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [dialog]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (dialog.type === 'confirm' || dialog.type === 'prompt') {
        dialog.onCancel();
      } else if (dialog.type === 'alert') {
        dialog.onOk();
      }
      closeDialog();
    } else if (e.key === 'Enter') {
      if (dialog.type === 'alert') {
        dialog.onOk();
        closeDialog();
      } else if (dialog.type === 'prompt') {
        dialog.onOk(inputValue);
        closeDialog();
      } else if (dialog.type === 'confirm') {
        dialog.onOk();
        closeDialog();
      }
    }
  }, [dialog, closeDialog, inputValue]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (dialog.type === 'confirm' || dialog.type === 'prompt') {
        dialog.onCancel();
      } else if (dialog.type === 'alert') {
        dialog.onOk();
      }
      closeDialog();
    }
  };

  if (dialog.type === null) return null;

  const getIcon = () => {
    switch (dialog.type) {
      case 'alert':
        return <Info size={24} color="var(--gov-green, #006A4E)" />;
      case 'confirm':
        return <HelpCircle size={24} color="var(--gov-green, #006A4E)" />;
      case 'prompt':
        return <AlertTriangle size={24} color="var(--gov-green, #006A4E)" />;
      default:
        return null;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary, #ffffff)',
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '400px',
          width: '100%',
          overflow: 'hidden',
          border: '1px solid var(--border-color, #e5e7eb)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #e5e7eb)',
            background: 'var(--bg-secondary, #f9fafb)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getIcon()}
            <span
              id="dialog-title"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary, #111827)'
              }}
            >
              {dialog.type === 'alert'
                ? translations.info
                : dialog.type === 'confirm'
                ? translations.confirm
                : translations.input}
            </span>
          </div>
          <button
            onClick={() => {
              if (dialog.type === 'confirm' || dialog.type === 'prompt') {
                dialog.onCancel();
              } else {
                dialog.onOk();
              }
              closeDialog();
            }}
            aria-label={translations.close}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-muted, #9ca3af)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s, background 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary, #111827)';
              e.currentTarget.style.background = 'var(--border-color, #e5e7eb)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted, #9ca3af)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          <p
            style={{
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--text-secondary, #6b7280)',
              margin: '0 0 16px 0'
            }}
          >
            {dialog.message}
          </p>

          {dialog.type === 'prompt' && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--bg-secondary, #f9fafb)',
                fontSize: '13px',
                color: 'var(--text-primary, #111827)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--gov-green, #006A4E)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)';
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color, #e5e7eb)',
            background: 'var(--bg-secondary, #f9fafb)'
          }}
        >
          {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
            <button
              onClick={() => {
                dialog.onCancel();
                closeDialog();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-secondary, #6b7280)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary, #f9fafb)';
                e.currentTarget.style.borderColor = 'var(--text-muted, #9ca3af)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-primary, #ffffff)';
                e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)';
              }}
            >
              {translations.cancel}
            </button>
          )}
          <button
            onClick={() => {
              if (dialog.type === 'prompt') {
                dialog.onOk(inputValue);
              } else {
                dialog.onOk();
              }
              closeDialog();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--gov-green, #006A4E)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gov-green-dark, #005a42)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gov-green, #006A4E)';
            }}
          >
            {translations.ok}
          </button>
        </div>
      </div>
    </div>
  );
}
