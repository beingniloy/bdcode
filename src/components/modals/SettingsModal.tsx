import { useState, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { X, Search, Code, FormInput, Sliders, Shield, Terminal, Cloud, Monitor, Info, RefreshCw, Download, ExternalLink } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useModal } from '../../contexts/ModalContext';
import { showAlert, showConfirm } from '../../hooks/useDialog';
import { useTranslation } from '../../hooks/useTranslation';
import { overlayStyle, modalStyle, closeBtnStyle, secondaryBtnStyle, sidebarBtnStyle } from './shared';
import { SETTINGS_DEF, DEFAULT_SETTINGS } from '../../settingsDef';

type SettingsSection = 'editor' | 'workbench' | 'security' | 'terminal' | 'cloud' | 'about';

export function SettingsModal({ onClose }: { onClose?: () => void }) {
  const { language, settings, setSettings } = useSettings();
  const { setSettingsModalOpen } = useModal();
  const close = onClose || (() => setSettingsModalOpen(false));
  const t = useTranslation('settingsModal');
  const [activeSection, setActiveSection] = useState<SettingsSection>('editor');
  const [formData, setFormData] = useState({ ...settings });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(JSON.stringify(settings, null, 2));

  // About section state
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [updateInfo, setUpdateInfo] = useState<{ updateAvailable: boolean; version: string | null; releaseDate: string | null } | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => { setJsonText(JSON.stringify(formData, null, 2)); }, [formData]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(setAppVersion);
    }
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsubs = [
      window.electronAPI.onUpdateDownloadProgress((progress) => {
        setDownloadProgress(Math.round(progress.percent));
      }),
      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateDownloaded(true);
        setDownloading(false);
      }),
    ];
    return () => { unsubs.forEach((unsub) => unsub()); };
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    if (!window.electronAPI) return;
    setCheckingUpdate(true);
    const result = await window.electronAPI.checkForUpdates();
    setUpdateInfo(result);
    setCheckingUpdate(false);
  }, []);

  const handleDownloadUpdate = useCallback(async () => {
    if (!window.electronAPI) return;
    setDownloading(true);
    await window.electronAPI.downloadUpdate();
  }, []);

  const handleInstallUpdate = useCallback(() => {
    if (!window.electronAPI) return;
    window.electronAPI.installUpdate();
  }, []);

  const resolvedSettings = SETTINGS_DEF.map(def => ({
    ...def,
    label: language === 'bn' ? def.labelBn : def.labelEn,
    desc: language === 'bn' ? def.descBn : def.descEn,
  }));

  const filteredSettings = resolvedSettings.filter((item) => {
    const matchesSection = viewMode === 'ui' ? item.section === activeSection : true;
    const matchesSearch = searchQuery
      ? item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesSection && matchesSearch;
  });

  const handleValueChange = (id: string, val: any) => setFormData(prev => ({ ...prev, [id]: val }));

  const handleJsonEditorChange = (value: string | undefined) => {
    if (!value) return;
    setJsonText(value);
    try { const parsed = JSON.parse(value); setFormData(parsed); setJsonError(null); }
    catch (e) { setJsonError(t('invalidJson')); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonError) { showAlert(t('invalidJson')); return; }
    setSettings(formData as any);
    close();
  };

  const handleResetDefaults = async () => {
    if (await showConfirm(t('resetConfirm'))) {
      setFormData({ ...DEFAULT_SETTINGS });
      setJsonText(JSON.stringify(DEFAULT_SETTINGS, null, 2));
    }
  };

  const handleExportSettings = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'bdcode_settings.json'; link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          setFormData(parsed);
          showAlert(t('settingsImported'));
        } catch (err) { showAlert(t('invalidJson')); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, width: '900px', height: '620px', display: 'flex', flexDirection: 'column' }} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gov-green)', fontWeight: 'bold' }}>
            <Sliders size={18} /><span id="settings-modal-title" style={{ fontSize: '14px' }}>{t('title')}</span>
          </div>
          {viewMode === 'ui' && activeSection !== 'about' && (
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
              <input type="text" placeholder={t('search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '6px 10px 6px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontSize: '12px' }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeSection !== 'about' && (
              <button onClick={() => { setViewMode(viewMode === 'ui' ? 'json' : 'ui'); setJsonError(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 'bold', background: 'var(--bg-primary)' }} className="settings-toggle-btn">
                {viewMode === 'ui' ? <Code size={13} /> : <FormInput size={13} />}<span>{viewMode === 'ui' ? t('jsonView') : t('uiView')}</span>
              </button>
            )}
            <button onClick={close} style={closeBtnStyle} aria-label={t('close')}><X size={18} /></button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {viewMode === 'ui' && (
            <div style={{ width: '220px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '12px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button onClick={() => setActiveSection('editor')} style={sidebarBtnStyle(activeSection === 'editor')}><Code size={14} color="var(--gov-green)" /><span>{t('editor')}</span></button>
              <button onClick={() => setActiveSection('workbench')} style={sidebarBtnStyle(activeSection === 'workbench')}><Monitor size={14} color="var(--gov-green)" /><span>{t('workbench')}</span></button>
              <button onClick={() => setActiveSection('security')} style={sidebarBtnStyle(activeSection === 'security')}><Shield size={14} color="var(--gov-green)" /><span>{t('security')}</span></button>
              <button onClick={() => setActiveSection('terminal')} style={sidebarBtnStyle(activeSection === 'terminal')}><Terminal size={14} color="var(--gov-green)" /><span>{t('terminal')}</span></button>
              <button onClick={() => setActiveSection('cloud')} style={sidebarBtnStyle(activeSection === 'cloud')}><Cloud size={14} color="var(--gov-green)" /><span>{t('cloud')}</span></button>
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
              <button onClick={() => setActiveSection('about')} style={sidebarBtnStyle(activeSection === 'about')}><Info size={14} color="var(--gov-green)" /><span>{t('about')}</span></button>
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
            {activeSection === 'about' ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <img src="images/gov-logo.svg" alt="Bangladesh Code" style={{ width: '72px', height: '72px' }} />
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Bangladesh Code</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('aboutDescription')}</p>
                </div>

                <div style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('version')}:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>v{appVersion}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('license')}:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>MIT</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    {updateDownloaded ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--gov-green)', marginBottom: '10px', fontWeight: 500 }}>
                          {t('updateReady')}
                        </div>
                        <button onClick={handleInstallUpdate} style={{
                          padding: '8px 20px', borderRadius: '4px', border: 'none',
                          background: 'var(--gov-green)', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}>
                          <RefreshCw size={13} /> {t('restartAndUpdate')}
                        </button>
                      </div>
                    ) : downloading ? (
                      <div>
                        <div style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          {t('downloading')}... {downloadProgress}%
                        </div>
                        <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${downloadProgress}%`, background: 'var(--gov-green)', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    ) : updateInfo?.updateAvailable ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          {t('newVersionAvailable')}: <strong>v{updateInfo.version}</strong>
                        </div>
                        <button onClick={handleDownloadUpdate} style={{
                          padding: '8px 20px', borderRadius: '4px', border: 'none',
                          background: 'var(--gov-green)', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px'
                        }}>
                          <Download size={13} /> {t('download')}
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        {updateInfo && !updateInfo.updateAvailable && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                            {t('upToDate')}
                          </div>
                        )}
                        <button onClick={handleCheckUpdate} disabled={checkingUpdate} style={{
                          padding: '8px 20px', borderRadius: '4px', border: '1px solid var(--border-color)',
                          background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: checkingUpdate ? 0.6 : 1
                        }}>
                          <RefreshCw size={13} className={checkingUpdate ? 'spin' : ''} /> {checkingUpdate ? t('checking') : t('checkForUpdates')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <a href="https://github.com/beingniloy/bdcode" target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                  color: 'var(--gov-green)', textDecoration: 'none', fontWeight: 500
                }}>
                  <ExternalLink size={13} /> {t('viewOnGitHub')}
                </a>
              </div>
            ) : viewMode === 'ui' ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }} className="settings-form-scroll">
                {filteredSettings.map((item) => {
                  const currentVal = (formData as any)[item.id];
                  return (
                    <div key={item.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }} className="setting-row-item">
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.label}</label>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>{item.desc}</p>
                      {item.type === 'checkbox' && (
                        <label className="custom-checkbox-container" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', marginTop: '4px' }}>
                          <input type="checkbox" checked={!!currentVal} onChange={e => handleValueChange(item.id, e.target.checked)} />
                          <span className="checkmark"></span>
                        </label>
                      )}
                      {item.type === 'number' && <input type="number" min={item.min} max={item.max} value={currentVal || ''} onChange={e => handleValueChange(item.id, parseInt(e.target.value) || item.min)} style={{ maxWidth: '120px', padding: '6px' }} />}
                      {item.type === 'text' && <input type="text" value={currentVal || ''} onChange={e => handleValueChange(item.id, e.target.value)} style={{ maxWidth: '300px', padding: '6px' }} />}
                      {item.type === 'select' && (
                        <select value={currentVal || ''} onChange={e => handleValueChange(item.id, e.target.value)} style={{ maxWidth: '220px', padding: '6px' }}>
                          {item.options?.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}
                {filteredSettings.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '40px' }}>{t('noSettings')}</div>}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <MonacoEditor height="100%" language="json" value={jsonText} onChange={handleJsonEditorChange} options={{ fontSize: 12, tabSize: 2, minimap: { enabled: false }, automaticLayout: true }} />
                {jsonError && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 16px', background: 'var(--danger-color)', color: 'white', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 20 }}>
                    <Sliders size={14} /><span>{jsonError}</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeSection !== 'about' && (
                  <>
                    <button onClick={handleExportSettings} style={secondaryBtnStyle}>{t('export')}</button>
                    <button onClick={handleImportSettings} style={secondaryBtnStyle}>{t('import')}</button>
                    <button onClick={handleResetDefaults} style={{ ...secondaryBtnStyle, color: 'var(--danger-color)' }}>{t('reset')}</button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={close} style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>{t('close')}</button>
                {activeSection !== 'about' && (
                  <button onClick={handleSubmit} style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', background: 'var(--gov-green)', color: 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>{t('save')}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
