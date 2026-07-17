import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLayout } from '../contexts/LayoutContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';

export default React.memo(function Footer() {
  const t = useTranslation('footer');
  const { footerCollapsed: isCollapsed, setFooterCollapsed: setIsCollapsed } = useLayout();
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const year = new Date().getFullYear();

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="footer" style={{ height: 'var(--footer-height)', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '0 24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', userSelect: 'none', zIndex: 40, position: 'relative' }}>
      <button onClick={() => setIsCollapsed(true)} style={{ position: 'absolute', top: '4px', right: '8px', padding: '2px', color: 'var(--text-muted)' }} title={t('collapse')} className="collapse-trigger-btn"><ChevronDown size={14} /></button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <img src="images/qr-code.svg" alt="Support QR Code" style={{ width: '46px', height: '46px', background: 'white', padding: '2px', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '11.5px' }}>{t('gov')}</span>
          <span>{t('copyright', { year })}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{t('importantLinks')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="https://github.com/beingniloy/bdcode/blob/main/PRIVACY.md" target="_blank" rel="noreferrer" className="footer-link">{t('privacy')}</a><span>|</span>
          <a href="https://github.com/beingniloy/bdcode/blob/main/TERMS.md" target="_blank" rel="noreferrer" className="footer-link">{t('terms')}</a><span>|</span>
          <a href="https://github.com/beingniloy/bdcode#readme" target="_blank" rel="noreferrer" className="footer-link">{t('sitemap')}</a><span>|</span>
          <a href="https://github.com/beingniloy/bdcode/blob/main/ACCESSIBILITY.md" target="_blank" rel="noreferrer" className="footer-link">{t('accessibility')}</a>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{t('contact')}</span>
          <span>{t('email')}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--gov-green-light)' }}>{t('hotline')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
          <img src="images/digital-bd-logo.svg" alt="Digital Bangladesh Logo" style={{ width: '42px', height: '42px', marginRight: '8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', lineHeight: '1.2' }}>
            <span style={{ fontWeight: 'bold', color: isDark ? '#4ade80' : 'var(--gov-green-dark)', fontSize: '12px', letterSpacing: '-0.3px' }}>{t('digitalBdText')}</span>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{t('digitalBdSub')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
