import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, File, Folder, FolderOpen, FileCode, 
  Plus, FolderPlus, Trash2, Edit3, Copy, Scissors, Clipboard, 
  FilePlus, FolderPlus as FolderPlusIcon, RefreshCw, Eye, 
  FolderMinus, FolderClosed, CopyPlus, Hand
} from 'lucide-react';
import { FileSystemItem } from '../types';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useLayout } from '../contexts/LayoutContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';
import { useContextMenu } from '../hooks/useContextMenu';
import ContextMenu from './ContextMenu';

export default React.memo(function ExplorerSidebar() {
  const t = useTranslation('explorer');
  const { files, projectName, activeFile, handleFileSelect, handleNewFile, handleNewFolder, handleNewFileInFolder, handleNewFolderInFolder, handleDeleteFile, handleRenameFile, handleCopyFile, handleCutFile, handlePasteFile, clipboard } = useFileSystem();
  const { setActiveSidebarTab, setSidebarOpen } = useLayout();
  const { settings } = useSettings();

  const [myProjectCollapsed, setMyProjectCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'assets': true,
    'assets/css': true,
    'assets/js': true,
    'assets/images': true,
  });

  const { menu, menuRef, showMenu, hideMenu } = useContextMenu();

  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const expandAllFolders = (items: FileSystemItem[]) => {
    const newExpanded: Record<string, boolean> = {};
    const walk = (list: FileSystemItem[]) => {
      for (const item of list) {
        if (item.isFolder) {
          newExpanded[item.path] = true;
          if (item.children) walk(item.children);
        }
      }
    };
    walk(items);
    setExpandedFolders(newExpanded);
  };

  const collapseAllFolders = () => setExpandedFolders({});

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (settings.iconTheme === 'minimal') {
      return { icon: File, color: 'var(--text-secondary)' };
    }
    if (settings.iconTheme === 'vscode-flat') {
      switch (ext) {
        case 'html': return { icon: FileCode, color: '#e34f26' };
        case 'css': return { icon: FileCode, color: '#0284c7' };
        case 'js': return { icon: FileCode, color: '#eab308' };
        case 'php': return { icon: FileCode, color: '#8b5cf6' };
        case 'json': return { icon: FileCode, color: '#f97316' };
        case 'md': return { icon: File, color: '#3b82f6' };
        case 'png': case 'jpg': case 'jpeg': return { icon: File, color: '#10b981' };
        default: return { icon: File, color: 'var(--text-secondary)' };
      }
    }
    // default-gov theme
    switch (ext) {
      case 'html': return { icon: FileCode, color: '#e34f26' };
      case 'css': return { icon: FileCode, color: '#0284c7' };
      case 'js': return { icon: FileCode, color: '#eab308' };
      case 'php': return { icon: FileCode, color: '#8b5cf6' };
      case 'json': return { icon: FileCode, color: '#f97316' };
      case 'md': return { icon: File, color: '#3b82f6' };
      case 'png': case 'jpg': case 'jpeg': return { icon: File, color: '#10b981' };
      default: return { icon: File, color: 'var(--text-secondary)' };
    }
  };

  const handleFileContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    const isFolder = item.isFolder;
    const items = isFolder ? [
      { label: t('newFile'), icon: <FilePlus size={14} />, action: () => handleNewFileInFolder(item.path) },
      { label: t('newFolder'), icon: <FolderPlusIcon size={14} />, action: () => handleNewFolderInFolder(item.path) },
      { divider: true, label: '' },
      { label: 'Cut', icon: <Scissors size={14} />, shortcut: 'Ctrl+X', action: () => handleCutFile(item.path) },
      { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', action: () => handleCopyFile(item.path) },
      { label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: () => handlePasteFile(item.path), disabled: !clipboard },
      { divider: true, label: '' },
      { label: t('rename'), icon: <Edit3 size={14} />, shortcut: 'F2', action: () => handleRenameFile(item.path) },
      { label: t('delete'), icon: <Trash2 size={14} />, shortcut: 'Del', action: () => handleDeleteFile(item.path), danger: true },
      { divider: true, label: '' },
      { label: 'Copy Path', icon: <CopyPlus size={14} />, action: () => navigator.clipboard?.writeText(item.path) },
      { divider: true, label: '' },
      { label: 'Expand All', icon: <FolderOpen size={14} />, action: () => {
        const newExpanded: Record<string, boolean> = {};
        const walk = (list: FileSystemItem[]) => {
          for (const it of list) {
            if (it.isFolder) { newExpanded[it.path] = true; if (it.children) walk(it.children); }
          }
        };
        if (item.children) walk(item.children);
        setExpandedFolders(prev => ({ ...prev, ...newExpanded }));
      }},
      { label: 'Collapse All', icon: <FolderClosed size={14} />, action: () => {
        const toRemove = new Set<string>();
        const walk = (list: FileSystemItem[]) => {
          for (const it of list) {
            if (it.isFolder) { toRemove.add(it.path); if (it.children) walk(it.children); }
          }
        };
        if (item.children) walk(item.children);
        setExpandedFolders(prev => {
          const next = { ...prev };
          toRemove.forEach(p => delete next[p]);
          return next;
        });
      }},
      { divider: true, label: '' },
      { label: 'Refresh', icon: <RefreshCw size={14} />, action: () => setExpandedFolders(prev => ({ ...prev, [item.path]: true })) },
    ] : [
      { label: 'Open', icon: <Eye size={14} />, action: () => handleFileSelect(item.path) },
      { divider: true, label: '' },
      { label: 'Cut', icon: <Scissors size={14} />, shortcut: 'Ctrl+X', action: () => handleCutFile(item.path) },
      { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', action: () => handleCopyFile(item.path) },
      { divider: true, label: '' },
      { label: t('rename'), icon: <Edit3 size={14} />, shortcut: 'F2', action: () => handleRenameFile(item.path) },
      { label: t('delete'), icon: <Trash2 size={14} />, shortcut: 'Del', action: () => handleDeleteFile(item.path), danger: true },
      { divider: true, label: '' },
      { label: 'Copy Path', icon: <CopyPlus size={14} />, action: () => navigator.clipboard?.writeText(item.path) },
      { divider: true, label: '' },
      { label: 'Search in Explorer', icon: <Hand size={14} />, action: () => { setActiveSidebarTab('search'); setSidebarOpen(true); } },
    ];
    showMenu(e, items);
  };

  const handleExplorerContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tree-item')) return;
    showMenu(e, [
      { label: t('newFile'), icon: <FilePlus size={14} />, action: handleNewFile },
      { label: t('newFolder'), icon: <FolderPlusIcon size={14} />, action: handleNewFolder },
      { divider: true, label: '' },
      { label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: handlePasteFile, disabled: !clipboard },
      { divider: true, label: '' },
      { label: 'Expand All', icon: <FolderOpen size={14} />, action: () => expandAllFolders(files) },
      { label: 'Collapse All', icon: <FolderMinus size={14} />, action: collapseAllFolders },
      { divider: true, label: '' },
      { label: 'Refresh', icon: <RefreshCw size={14} />, action: () => setExpandedFolders({}) },
      { divider: true, label: '' },
      { label: 'Search in Explorer', icon: <Hand size={14} />, action: () => { setActiveSidebarTab('search'); setSidebarOpen(true); } },
    ]);
  };

  const renderTree = (items: FileSystemItem[], depth = 0): React.ReactNode => {
    return items.map((item) => {
      const isFolder = item.isFolder;
      const isExpanded = expandedFolders[item.path];
      const isSelected = activeFile === item.path;
      const paddingLeft = `${depth * 12 + 12}px`;

      if (isFolder) {
        return (
          <div key={item.path}>
            <div
              onClick={(e) => toggleFolder(item.path, e)}
              onContextMenu={(e) => handleFileContextMenu(e, item)}
              style={{
                display: 'flex', alignItems: 'center', padding: '6px 8px 6px ' + paddingLeft,
                cursor: 'pointer', gap: '6px', borderRadius: '4px', transition: 'background 0.2s',
              }}
              className="tree-item folder-item"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {isExpanded ? <FolderOpen size={16} color="#eab308" fill="#eab308" fillOpacity={0.2} /> : <Folder size={16} color="#eab308" fill="#eab308" fillOpacity={0.2} />}
              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div className="folder-children">{renderTree(item.children, depth + 1)}</div>
            )}
          </div>
        );
      } else {
        const { icon: FileIcon, color: iconColor } = getFileIcon(item.name);
        return (
          <div
            key={item.path}
            onClick={() => handleFileSelect(item.path)}
            onContextMenu={(e) => handleFileContextMenu(e, item)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 8px 6px ' + paddingLeft, cursor: 'pointer', borderRadius: '4px',
              background: isSelected ? 'var(--bg-dark-active)' : 'transparent',
              borderLeft: isSelected ? '2px solid var(--gov-green)' : 'none',
              transition: 'background 0.2s', gap: '6px'
            }}
            className={`tree-item file-item ${isSelected ? 'active-file' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
              <FileIcon size={15} color={iconColor} />
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontWeight: isSelected ? '600' : 'normal',
                color: isSelected ? 'var(--gov-green)' : 'var(--text-primary)'
              }}>{item.name}</span>
            </div>
            <div className="tree-actions" style={{ display: 'none', alignItems: 'center', gap: '4px' }}>
              <button onClick={(e) => { e.stopPropagation(); handleRenameFile(item.path); }} style={{ padding: '2px', color: 'var(--text-secondary)' }} title={t('rename')}><Edit3 size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(item.path); }} style={{ padding: '2px', color: 'var(--danger-color)' }} title={t('delete')}><Trash2 size={12} /></button>
            </div>
            {item.modified && <span style={{ color: 'var(--warning-color)', fontWeight: 'bold', fontSize: '11px', paddingRight: '4px' }} className="modified-dot">M</span>}
          </div>
        );
      }
    });
  };

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)', userSelect: 'none'
    }}>
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        <span>{t('explorer')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleNewFile} title={t('newFile')} style={{ padding: '2px' }} className="icon-btn"><Plus size={15} /></button>
          <button onClick={handleNewFolder} title={t('newFolder')} style={{ padding: '2px' }} className="icon-btn"><FolderPlus size={15} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div onClick={() => setMyProjectCollapsed(!myProjectCollapsed)}
          onContextMenu={handleExplorerContextMenu}
          style={{
            background: 'var(--bg-secondary)', padding: '6px 8px', display: 'flex', alignItems: 'center',
            cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)', gap: '4px'
          }}>
          {myProjectCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <span>{projectName}</span>
        </div>
        {!myProjectCollapsed && (
          <div 
            style={{ flex: 1, overflowY: 'auto', padding: '6px 4px' }}
            onContextMenu={handleExplorerContextMenu}
          >
            {renderTree(files)}
          </div>
        )}
      </div>

      {menu.visible && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={hideMenu}
          menuRef={menuRef as React.RefObject<HTMLDivElement>}
        />
      )}
    </div>
  );
});
