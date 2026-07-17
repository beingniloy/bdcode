import { useState } from 'react';
import { 
  FilePlus, 
  FolderOpen, 
  Save, 
  Copy, 
  CloudUpload, 
  Bug, 
  Boxes, 
  Settings, 
  ChevronDown, 
  User 
} from 'lucide-react';
import { useLayout } from '../contexts/LayoutContext';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useModal } from '../contexts/ModalContext';
import { useTranslation } from '../hooks/useTranslation';

export default function Toolbar() {
  const t = useTranslation('toolbar');
  const { setActiveSidebarTab, setSidebarOpen } = useLayout();
  const { handleNewFile, handleOpenFolder, handleSave, handleSaveAll } = useFileSystem();
  const { setPublishModalOpen } = useModal();
  const { setSettingsModalOpen } = useModal();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const onBugReport = () => window.open('https://github.com/beingniloy/bdcode/issues', '_blank');
  const onToggleExtensions = () => { setActiveSidebarTab('extensions'); setSidebarOpen(true); };

  return (
    <div className="toolbar" style={{
      height: 'var(--toolbar-height)',
      background: 'var(--gov-green)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      userSelect: 'none',
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={handleNewFile} className="toolbar-action-btn"><FilePlus size={16} /><span>{t('newFile')}</span></button>
        <button onClick={handleOpenFolder} className="toolbar-action-btn"><FolderOpen size={16} /><span>{t('openFile')}</span></button>
        <button onClick={handleSave} className="toolbar-action-btn"><Save size={16} /><span>{t('save')}</span></button>
        <button onClick={handleSaveAll} className="toolbar-action-btn"><Copy size={16} /><span>{t('saveAll')}</span></button>
        <button onClick={() => setPublishModalOpen(true)} className="toolbar-action-btn publish-btn-glow"><CloudUpload size={16} /><span>{t('publish')}</span></button>
        <button onClick={onBugReport} className="toolbar-action-btn"><Bug size={16} /><span>{t('bugReport')}</span></button>
        <button onClick={onToggleExtensions} className="toolbar-action-btn"><Boxes size={16} /><span>{t('extensions')}</span></button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="relative">
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            role="button"
            tabIndex={0}
            aria-haspopup="true"
            aria-expanded={profileDropdownOpen}
            aria-label={t('profileMenu')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)' }}
            className="profile-box"
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.2' }}>{t('userName')}</span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', lineHeight: '1' }}>{t('userRole')}</span>
            </div>
            <ChevronDown size={14} style={{ opacity: 0.8 }} />
          </div>

          {profileDropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '6px',
              background: 'var(--bg-primary)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '160px'
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {t('loggedInId')}
              </div>
              <button onClick={() => { setSettingsModalOpen(true); setProfileDropdownOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px' }} className="profile-dropdown-item">
                {t('myProfile')}
              </button>
              <button onClick={() => { if (confirm(t('loggingOut'))) { setProfileDropdownOpen(false); } }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: 'var(--danger-color)' }} className="profile-dropdown-item">
                {t('logout')}
              </button>
            </div>
          )}
        </div>

        <button onClick={() => setSettingsModalOpen(true)} aria-label={t('settings')}
          style={{ padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="toolbar-btn" data-tooltip={t('settings')}>
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
