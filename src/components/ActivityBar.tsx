import React, { useCallback } from 'react';
import { 
  Folder, 
  Search, 
  GitBranch, 
  Play, 
  Grid, 
  BookOpen, 
  Settings, 
  MessageSquare 
} from 'lucide-react';
import { ActiveSidebarTab } from '../types';
import { useLayout } from '../contexts/LayoutContext';
import { useTranslation } from '../hooks/useTranslation';

export default React.memo(function ActivityBar() {
  const t = useTranslation('activityBar');
  const { activeSidebarTab, setActiveSidebarTab, sidebarOpen, setSidebarOpen } = useLayout();

  const items = [
    { id: 'explorer' as ActiveSidebarTab, icon: Folder, key: 'explorer' as const },
    { id: 'search' as ActiveSidebarTab, icon: Search, key: 'search' as const },
    { id: 'source_control' as ActiveSidebarTab, icon: GitBranch, key: 'sourceControl' as const },
    { id: 'run' as ActiveSidebarTab, icon: Play, key: 'run' as const },
    { id: 'extensions' as ActiveSidebarTab, icon: Grid, key: 'extensions' as const },
    { id: 'documentation' as ActiveSidebarTab, icon: BookOpen, key: 'documentation' as const },
    { id: 'settings' as ActiveSidebarTab, icon: Settings, key: 'settings' as const },
    { id: 'feedback' as ActiveSidebarTab, icon: MessageSquare, key: 'feedback' as const }
  ];

  const handleTabClick = useCallback((tabId: ActiveSidebarTab) => {
    if (activeSidebarTab === tabId && sidebarOpen) {
      setSidebarOpen(false);
    } else {
      setActiveSidebarTab(tabId);
      setSidebarOpen(true);
    }
  }, [activeSidebarTab, sidebarOpen, setSidebarOpen, setActiveSidebarTab]);

  const renderItem = (item: typeof items[0], isActive: boolean) => {
    const Icon = item.icon;
    const label = t(item.key);
    return (
      <div
        key={item.id}
        role="tab"
        aria-selected={isActive}
        tabIndex={0}
        aria-label={label}
        onClick={() => handleTabClick(item.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTabClick(item.id); } }}
        style={{
          position: 'relative', width: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '10px 0',
          cursor: 'pointer', opacity: isActive ? 1 : 0.65,
          color: isActive ? 'white' : 'var(--activity-bar-text)',
          background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
          transition: 'all 0.2s', textAlign: 'center'
        }}
        className="activity-item"
      >
        {isActive && (
          <div style={{ position: 'absolute', left: 0, top: '15%', height: '70%', width: '3px', backgroundColor: 'var(--success-color)' }} />
        )}
        <Icon size={20} style={{ marginBottom: '4px' }} />
        <span style={{
          fontSize: '9px', fontWeight: isActive ? 'bold' : 'normal',
          letterSpacing: '-0.3px', padding: '0 2px', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'
        }}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="activity-bar" role="navigation" aria-label={t('sidebarNav')} style={{
      width: '76px', background: 'var(--activity-bar-bg)', color: 'var(--activity-bar-text)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '10px 0', userSelect: 'none',
      borderRight: '1px solid var(--border-color)', height: '100%'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '4px' }}>
        {items.slice(0, 6).map(item => renderItem(item, activeSidebarTab === item.id && sidebarOpen))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '4px' }}>
        {items.slice(6).map(item => renderItem(item, activeSidebarTab === item.id && sidebarOpen))}
      </div>
    </div>
  );
});
