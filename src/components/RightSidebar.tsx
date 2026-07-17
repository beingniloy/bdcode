import React, { useState, useCallback } from 'react';
import { ChevronRight, X, ShieldAlert, HelpCircle, BookOpen, FileLock2, AlertTriangle } from 'lucide-react';
import { useLayout } from '../contexts/LayoutContext';
import { useTranslation } from '../hooks/useTranslation';

export default React.memo(function RightSidebar() {
  const { setRightSidebarOpen, setActiveSidebarTab, setSidebarOpen } = useLayout();
  const onClose = useCallback(() => setRightSidebarOpen(false), [setRightSidebarOpen]);
  const t = useTranslation('rightSidebar');
  const [quickLinksOpen, setQuickLinksOpen] = useState(true);
  const [codeHelpOpen, setCodeHelpOpen] = useState(true);

  const quickLinks = [
    { name: t('nationalPortal'), url: 'https://bangladesh.gov.bd' },
    { name: t('digitalBd'), url: 'https://bangladesh.gov.bd' },
    { name: t('openData'), url: 'https://data.gov.bd' },
    { name: t('eGov'), url: 'https://www.bnda.gov.bd' },
    { name: t('innovation'), url: 'https://a2i.gov.bd' }
  ];

  const codeGuides = [
    { name: t('codeGuide'), icon: BookOpen, content: 'কোডিং নির্দেশিকা' },
    { name: t('securityGuide'), icon: FileLock2, content: 'নিরাপত্তা নির্দেশিকা' },
    { name: t('bestPractice'), icon: AlertTriangle, content: 'সেরা অনুশীলন' },
    { name: t('faq'), icon: HelpCircle, content: 'FAQ' }
  ];

  const handleGuideClick = (_name: string) => {
    setActiveSidebarTab('documentation');
    setSidebarOpen(true);
  };

  return (
    <div className="right-sidebar" style={{
      width: '100%', height: '100%', background: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column', userSelect: 'none', overflowY: 'auto',
    }}>
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontWeight: 'bold',
        fontSize: '12px',
        color: 'var(--text-primary)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle size={15} color="var(--gov-green)" />
          {t('title')}
        </span>
        <button onClick={onClose} style={{ padding: '2px' }} className="close-btn"><X size={15} /></button>
      </div>

      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div onClick={() => setQuickLinksOpen(!quickLinksOpen)} style={{ background: 'var(--bg-secondary)', padding: '8px 14px', fontWeight: 'bold', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{t('quickLinks')}</span>
          <ChevronRight size={14} style={{ transform: quickLinksOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
        {quickLinksOpen && (
          <div style={{ padding: '6px 0' }}>
            {quickLinks.map((link, index) => (
              <a key={index} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', fontSize: '12px', color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.2s' }} className="sidebar-link-item">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.name}</span>
                <ChevronRight size={14} className="link-arrow" style={{ opacity: 0.6 }} />
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div onClick={() => setCodeHelpOpen(!codeHelpOpen)} style={{ background: 'var(--bg-secondary)', padding: '8px 14px', fontWeight: 'bold', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{t('codeHelp')}</span>
          <ChevronRight size={14} style={{ transform: codeHelpOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
        {codeHelpOpen && (
          <div style={{ padding: '6px 0' }}>
            {codeGuides.map((guide, index) => {
              const GuideIcon = guide.icon;
              return (
                <div key={index} onClick={() => handleGuideClick(guide.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s' }} className="sidebar-link-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GuideIcon size={14} color="var(--text-secondary)" /><span>{guide.name}</span>
                  </div>
                  <ChevronRight size={14} className="link-arrow" style={{ opacity: 0.6 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.3)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><ShieldAlert size={16} /></div>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>{t('secAlertTitle')}</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{t('secAlertText')}</p>
          <a href="https://github.com/beingniloy/bdcode" target="_blank" rel="noreferrer" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--success-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }} className="security-link">
            <span>{t('details')}</span><span>&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
});
