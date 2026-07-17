import React, { useState, useCallback } from 'react';
import { Globe, Sun, Moon, ChevronDown, Minus, Square, X, BookOpen, Keyboard, Heart } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useLayout } from '../contexts/LayoutContext';
import { useModal } from '../contexts/ModalContext';
import { showConfirm } from '../hooks/useDialog';
import { useTranslation } from '../hooks/useTranslation';

export default React.memo(function TitleBar() {
  const { setLanguage, theme, setTheme } = useSettings();
  const { setActiveSidebarTab, setSidebarOpen } = useLayout();
  const { setKeybindingsModalOpen } = useModal();
  const t = useTranslation('titleBar');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const handleMinimize = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.windowControl('minimize');
    }
  }, []);

  const handleMaximize = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.windowControl('maximize');
    }
  }, []);

  const handleClose = useCallback(async () => {
    if (window.electronAPI) {
      window.electronAPI.windowControl('close');
    } else {
      if (await showConfirm(t('confirmClose'))) {
        window.close();
      }
    }
  }, [t]);

  const handleOpenDocs = useCallback(() => {
    setActiveSidebarTab('documentation');
    setSidebarOpen(true);
  }, [setActiveSidebarTab, setSidebarOpen]);

  const handleOpenKeybindings = useCallback(() => {
    setKeybindingsModalOpen(true);
  }, [setKeybindingsModalOpen]);

  return (
    <div className="title-bar" style={{
      height: 'var(--title-bar-height)',
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      userSelect: 'none',
      zIndex: 50,
      WebkitAppRegion: 'drag'
    } as React.CSSProperties}>
      <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <img src="images/gov-logo.svg" alt="Bangladesh Govt Seal" style={{ width: '34px', height: '34px', cursor: 'pointer' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--gov-green)', lineHeight: '1.2' }}>{t('title')}</span>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{t('subtitle')}</span>
        </div>
      </div>

      <nav aria-label="Main navigation" className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '6px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Portal — external link to official gov portal */}
        <a href="https://bangladesh.gov.bd" target="_blank" rel="noreferrer" style={navBtnStyle} className="nav-portal-btn">
          <Globe size={13} color="var(--gov-green)" />
          <span>{t('portal')}</span>
        </a>

        {/* Docs — opens documentation sidebar panel */}
        <button onClick={handleOpenDocs} style={navBtnStyle} className="hover-link" data-tooltip={t('docsTooltip')}>
          <BookOpen size={13} color="var(--gov-green)" />
          <span>{t('docs')}</span>
        </button>

        {/* Help — opens keyboard shortcuts modal */}
        <button onClick={handleOpenKeybindings} style={navBtnStyle} className="hover-link" data-tooltip={t('helpTooltip')}>
          <Keyboard size={13} color="var(--gov-green)" />
          <span>{t('help')}</span>
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <a
          href="https://www.niloy.io/sponsor"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px',
            borderRadius: '4px', border: '1px solid #e74c3c',
            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            color: '#fff', fontSize: '11px', fontWeight: 600,
            textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 1px 4px rgba(231,76,60,0.3)',
          }}
          className="sponsor-btn"
        >
          <Heart size={13} fill="#fff" />
          <span>Sponsor</span>
        </a>

        <div className="relative">
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            aria-haspopup="true"
            aria-expanded={langDropdownOpen}
            aria-label={t('selectLang')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px' }}
          >
            <span>{t('lang')}</span>
            <ChevronDown size={12} />
          </button>

          {langDropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '4px',
              background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
              borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '100px'
            }}>
              <button
                onClick={() => { setLanguage('bn'); setLangDropdownOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '11px', borderBottom: '1px solid var(--border-color)' }}
                className="dropdown-item"
              >{t('bangla')}</button>
              <button
                onClick={() => { setLanguage('en'); setLangDropdownOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '11px' }}
                className="dropdown-item"
              >{t('english')}</button>
            </div>
          )}
        </div>

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={t('toggleTheme')}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          data-tooltip={t('changeTheme')}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '10px', gap: '2px' }}>
          <button onClick={handleMinimize} style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="win-btn" aria-label={t('minimize')}><Minus size={14} /></button>
          <button onClick={handleMaximize} style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="win-btn" aria-label={t('maximize')}><Square size={12} /></button>
          <button onClick={handleClose} style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="win-btn win-close" aria-label={t('closeWindow')}><X size={14} /></button>
        </div>
      </div>
    </div>
  );
});

const navBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  fontSize: '11px',
  fontWeight: 500,
  padding: '5px 10px',
  borderRadius: '4px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  transition: 'all 0.2s',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
