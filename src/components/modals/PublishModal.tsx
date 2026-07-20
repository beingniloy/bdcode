import { useState, useMemo, useCallback } from 'react';
import { X, Download, FileArchive, FolderTree, Folder, File, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { useModal } from '../../contexts/ModalContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';
import { overlayStyle, modalStyle, modalHeaderStyle, closeBtnStyle } from './shared';
import { FileSystemItem } from '../../types';

const EXCLUDED_BY_DEFAULT = ['node_modules', '.git', 'dist', 'build', '.env', '.env.local', '.env.development'];

interface FlatFile {
  name: string;
  path: string;
  isFolder: boolean;
  depth: number;
  included: boolean;
}

function flattenTree(items: FileSystemItem[], depth = 0): FlatFile[] {
  const result: FlatFile[] = [];
  for (const item of items) {
    const excluded = EXCLUDED_BY_DEFAULT.includes(item.name);
    result.push({
      name: item.name,
      path: item.path,
      isFolder: item.isFolder,
      depth,
      included: !excluded,
    });
    if (item.isFolder && item.children) {
      result.push(...flattenTree(item.children, depth + 1));
    }
  }
  return result;
}

function collectFiles(items: FileSystemItem[], includedPaths: Set<string>): { path: string; content: string }[] {
  const result: { path: string; content: string }[] = [];
  const walk = (nodes: FileSystemItem[]) => {
    for (const node of nodes) {
      if (node.isFolder) {
        if (node.children) walk(node.children);
      } else if (includedPaths.has(node.path)) {
        result.push({ path: node.path, content: node.content || '' });
      }
    }
  };
  walk(items);
  return result;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PublishModal({ onClose }: { onClose?: () => void }) {
  const { setPublishModalOpen } = useModal();
  const { files, projectName } = useFileSystem();
  const { settings } = useSettings();
  const t = useTranslation('publishModal');
  const close = onClose || (() => setPublishModalOpen(false));

  const flatFiles = useMemo(() => flattenTree(files), [files]);
  const [fileStates, setFileStates] = useState<FlatFile[]>(flatFiles);
  const [zipName, setZipName] = useState(`${projectName}.zip`);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{ count: number; size: string } | null>(null);

  const includedCount = useMemo(() => fileStates.filter(f => f.included).length, [fileStates]);

  const includedPaths = useMemo(() => {
    const included = new Set<string>();
    const stateMap = new Map(fileStates.map(f => [f.path, f.included]));

    const walk = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.isFolder) {
          if (stateMap.get(item.path) !== false && item.children) {
            walk(item.children);
          }
        } else if (stateMap.get(item.path) !== false) {
          included.add(item.path);
        }
      }
    };
    walk(files);
    return included;
  }, [files, fileStates]);

  const totalSize = useMemo(() => {
    let bytes = 0;
    const encoder = new TextEncoder();
    const walk = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.isFolder && item.children) {
          walk(item.children);
        } else if (!item.isFolder && includedPaths.has(item.path) && item.content) {
          bytes += encoder.encode(item.content).length;
        }
      }
    };
    walk(files);
    return formatSize(bytes);
  }, [files, includedPaths]);

  const toggleFile = useCallback((path: string) => {
    setFileStates(prev => prev.map(f => f.path === path ? { ...f, included: !f.included } : f));
  }, []);

  const selectAll = useCallback(() => {
    setFileStates(prev => prev.map(f => ({ ...f, included: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setFileStates(prev => prev.map(f => ({ ...f, included: false })));
  }, []);

  const handleDownload = useCallback(async () => {
    if (includedCount === 0) return;
    setDownloading(true);

    const zip = new JSZip();
    const filesToZip = collectFiles(files, includedPaths);
    for (const f of filesToZip) {
      zip.file(f.path, f.content);
    }

    // Embed deployment manifest with security/cloud settings
    const manifest = {
      app: 'Bangladesh Code',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      sslVerified: settings.sslCheck,
      nodeEnv: settings.nodeEnv,
      agencyCode: settings.agencyCode,
      sandboxEnabled: settings.sandboxEnabled,
      fileCount: filesToZip.length,
    };
    zip.file('bdcode-manifest.json', JSON.stringify(manifest, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadInfo({ count: filesToZip.length, size: formatSize(blob.size) });
    setDownloading(false);
    setDownloaded(true);
  }, [files, includedPaths, includedCount, zipName, settings.sslCheck, settings.nodeEnv, settings.agencyCode, settings.sandboxEnabled]);

  const includedByType = useMemo(() => {
    const included = fileStates.filter(f => f.included && !f.isFolder);
    const excluded = fileStates.filter(f => !f.included && !f.isFolder);
    return { included: included.length, excluded: excluded.length };
  }, [fileStates]);

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: '500px', width: '100%' }} role="dialog" aria-modal="true" aria-labelledby="publish-modal-title">
        <div style={modalHeaderStyle}>
          <h3 id="publish-modal-title" style={{ margin: 0, fontSize: '13px', color: 'var(--gov-green)' }}>
            {t('title')}
          </h3>
          <button onClick={close} style={closeBtnStyle} aria-label={t('close')}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflow: 'hidden' }}>
          {!downloaded ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderTree size={14} color="var(--gov-green)" />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{t('filePreview')}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({includedByType.included} / {includedByType.included + includedByType.excluded})</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={selectAll} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '3px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    {t('selectAll')}
                  </button>
                  <button onClick={deselectAll} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '3px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    {t('deselectAll')}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {t('excludeHint')}
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'auto', maxHeight: '200px', background: 'var(--bg-secondary)' }}>
                {fileStates.map((f) => (
                  <div
                    key={f.path}
                    onClick={() => toggleFile(f.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 8px',
                      paddingLeft: `${8 + f.depth * 16}px`,
                      fontSize: '11px',
                      color: f.included ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      opacity: f.included ? 1 : 0.6,
                      transition: 'all 0.1s',
                    }}
                  >
                    {f.included ? <CheckSquare size={12} color="var(--gov-green)" /> : <Square size={12} color="var(--text-muted)" />}
                    {f.isFolder ? <Folder size={12} color="var(--gov-green)" /> : <File size={12} color="var(--text-secondary)" />}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('zipName')}</label>
                <input
                  type="text"
                  value={zipName}
                  onChange={(e) => setZipName(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', background: settings.nodeEnv === 'production' ? 'rgba(22,163,74,0.15)' : settings.nodeEnv === 'staging' ? 'rgba(232,160,0,0.15)' : 'rgba(36,114,200,0.15)', color: settings.nodeEnv === 'production' ? 'var(--gov-green)' : settings.nodeEnv === 'staging' ? '#c88000' : '#2472c8', fontWeight: 'bold' }}>
                  {settings.nodeEnv === 'production' ? 'ðŸŸ¢' : settings.nodeEnv === 'staging' ? 'ðŸŸ¡' : 'ðŸ”µ'} {settings.nodeEnv}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', background: settings.sslCheck ? 'rgba(22,163,74,0.15)' : 'rgba(150,150,150,0.15)', color: settings.sslCheck ? 'var(--gov-green)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                  {settings.sslCheck ? 'ðŸ”’ SSL Verified' : 'ðŸ”“ SSL Open'}
                </span>
                <span>{t('agency')}: {settings.agencyCode}</span>
                <span>|</span>
                <span>{t('downloadSummary').replace('{count}', String(includedCount)).replace('{size}', totalSize)}</span>
              </div>

              {includedCount === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--danger-color)', fontWeight: 'bold' }}>
                  {t('noFiles')}
                </div>
              )}
            </>
          ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
              <CheckCircle2 size={40} color="var(--gov-green)" />
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gov-green-dark)' }}>{t('downloadComplete')}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('success')}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '4px' }}>
                  {t('downloadSummary').replace('{count}', String(downloadInfo?.count || 0)).replace('{size}', downloadInfo?.size || '0 B')}
                </span>
                <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '4px', background: settings.nodeEnv === 'production' ? 'rgba(22,163,74,0.15)' : settings.nodeEnv === 'staging' ? 'rgba(232,160,0,0.15)' : 'rgba(36,114,200,0.15)', color: settings.nodeEnv === 'production' ? 'var(--gov-green)' : settings.nodeEnv === 'staging' ? '#c88000' : '#2472c8', fontWeight: 'bold' }}>
                  {settings.nodeEnv}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '4px' }}>
                  {settings.agencyCode}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {!downloaded ? (
            <>
              <button onClick={close} style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}>
                {t('close')}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading || includedCount === 0}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  background: includedCount === 0 ? 'var(--bg-secondary)' : 'var(--gov-green)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: includedCount === 0 ? 'var(--text-muted)' : 'white',
                  cursor: includedCount === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                {downloading ? (
                  <>
                    <span className="animate-spin" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                    {t('downloading')}
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    {t('downloadBtn')}
                  </>
                )}
              </button>
            </>
          ) : (
            <button onClick={close} style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              background: 'var(--gov-green)',
              fontSize: '11px',
              fontWeight: 'bold',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <FileArchive size={14} />
              {t('close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
