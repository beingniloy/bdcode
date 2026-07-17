import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { FileSystemItem, Tab, TerminalLine } from '../types';
import { showConfirm, showPrompt } from '../hooks/useDialog';
import { useSettings } from './SettingsContext';
import { useModal } from './ModalContext';
import {
  findFileInTree,
  updateFileContentInTree,
  saveFileInTree,
  deleteItemFromTree,
  renameItemInTree,
  updateChildPaths,
} from '../utils';
import initialFiles from '../demoData';

const initialTabs: Tab[] = [{ name: '\u09B8\u0CD7\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE', path: 'welcome', isDirty: false }];

interface ClipboardData {
  type: 'copy' | 'cut';
  path: string;
  name: string;
  content: string;
  isFolder?: boolean;
  children?: FileSystemItem[];
}

type UndoStack = Record<string, { past: string[]; future: string[] }>;

interface FileSystemContextValue {
  files: FileSystemItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileSystemItem[]>>;
  projectName: string;
  openTabs: Tab[];
  activeFile: string | null;
  terminalLines: TerminalLine[];
  setTerminalLines: React.Dispatch<React.SetStateAction<TerminalLine[]>>;
  problemsCount: { errors: number; warnings: number };
  clipboard: ClipboardData | null;
  handleFileSelect: (path: string) => Promise<void>;
  handleTabSelect: (path: string) => void;
  handleTabClose: (path: string) => void;
  handleContentChange: (path: string, newContent: string) => void;
  handleSave: () => Promise<void>;
  handleSaveAll: () => Promise<void>;
  handleOpenFolder: () => Promise<void>;
  handleNewFile: () => Promise<void>;
  handleNewFolder: () => Promise<void>;
  handleNewFileInFolder: (folderPath: string) => Promise<void>;
  handleNewFolderInFolder: (folderPath: string) => Promise<void>;
  handleDeleteFile: (path: string) => Promise<void>;
  handleRenameFile: (path: string) => Promise<void>;
  handleCopyFile: (path: string) => void;
  handleCutFile: (path: string) => void;
  handlePasteFile: (targetFolderPath?: string) => Promise<void>;
  handleRun: () => void;
  handleCreateVirtualFile: (path: string, name: string, content: string) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  undoStackDepths: { undo: number; redo: number };
}

const FileSystemContext = createContext<FileSystemContextValue | null>(null);

function resetModified(items: FileSystemItem[]): FileSystemItem[] {
  return items.map(item => {
    const res = { ...item, modified: false };
    if (res.children) res.children = resetModified(res.children);
    return res;
  });
}

export function FileSystemProvider({ children }: { children: ReactNode }) {
  const { language, settings } = useSettings();
  const { setPublishModalOpen } = useModal();

  const [files, setFiles] = useState<FileSystemItem[]>(initialFiles);
  const [projectName, setProjectName] = useState<string>('\u0986\u09AE\u09BE\u09B0_\u09AA\u0CD7\u09B0\u0995\u09B2\u09CD\u09AA');
  const [openTabs, setOpenTabs] = useState<Tab[]>(initialTabs);
  const [activeFile, setActiveFile] = useState<string | null>('welcome');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { text: navigator.userAgent.includes('Win') ? 'Microsoft Windows [Version 10.0.22631.3447]' : navigator.userAgent.includes('Mac') ? 'macOS [zsh]' : 'Linux [bash]', type: 'system' },
    { text: navigator.userAgent.includes('Win') ? '(c) Microsoft Corporation. All rights reserved.' : '', type: 'system' },
    { text: '', type: 'system' },
    { text: navigator.userAgent.includes('Win') ? 'C:\\\u0986\u09AE\u09BE\u09B0_\u09AA\u0CD7\u09B0\u0995\u09B2\u09CD\u09AA> ' : '~/\u0986\u09AE\u09BE\u09B0_\u09AA\u0CD7\u09B0\u0995\u09B2\u09CD\u09AA$ ', type: 'system' },
  ]);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [undoHistory, setUndoHistory] = useState<UndoStack>({});

  const pushHistory = useCallback((path: string, oldContent: string) => {
    if (!path || path === 'welcome' || path.startsWith('docs/')) return;
    if (!oldContent) return;
    setUndoHistory(prev => {
      const entry = prev[path] || { past: [], future: [] };
      const lastPast = entry.past[entry.past.length - 1];
      if (lastPast === oldContent) return prev;
      return {
        ...prev,
        [path]: {
          past: [...entry.past.slice(-99), oldContent],
          future: [],
        },
      };
    });
  }, []);

  useEffect(() => {
    const appTitle = 'Bangladesh Code';
    let title: string;
    if (activeFile && activeFile !== 'welcome') {
      const fileName = activeFile.split('/').pop() || activeFile;
      title = `${fileName} - ${appTitle}`;
    } else {
      title = `${projectName} - ${appTitle}`;
    }
    document.title = title;
    if (window.electronAPI?.setTitle) {
      window.electronAPI.setTitle(title);
    }
  }, [activeFile, projectName]);

  const handleUndo = useCallback(() => {
    if (!activeFile || activeFile === 'welcome') return;
    const entry = undoHistory[activeFile];
    if (!entry || entry.past.length === 0) return;

    const newPast = [...entry.past];
    const prevContent = newPast.pop()!;

    const currentNode = findFileInTree(files, activeFile);
    const currentContent = currentNode?.content || '';

    setFiles(f => updateFileContentInTree(f, activeFile, prevContent, true));
    setOpenTabs(t => t.map(tab => tab.path === activeFile ? { ...tab, isDirty: true } : tab));
    setUndoHistory(prev => ({
      ...prev,
      [activeFile]: { past: newPast, future: [...(prev[activeFile]?.future || []), currentContent] },
    }));
  }, [activeFile, files, undoHistory]);

  const handleRedo = useCallback(() => {
    if (!activeFile || activeFile === 'welcome') return;
    const entry = undoHistory[activeFile];
    if (!entry || entry.future.length === 0) return;

    const newFuture = [...entry.future];
    const nextContent = newFuture.pop()!;

    const currentNode = findFileInTree(files, activeFile);
    const currentContent = currentNode?.content || '';

    setFiles(f => updateFileContentInTree(f, activeFile, nextContent, true));
    setOpenTabs(t => t.map(tab => tab.path === activeFile ? { ...tab, isDirty: true } : tab));
    setUndoHistory(prev => ({
      ...prev,
      [activeFile]: { past: [...(prev[activeFile]?.past || []), currentContent], future: newFuture },
    }));
  }, [activeFile, files, undoHistory]);

  const undoStackDepths = useMemo(() => {
    const entry = undoHistory[activeFile || ''];
    return { undo: entry?.past.length || 0, redo: entry?.future.length || 0 };
  }, [undoHistory, activeFile]);

  useEffect(() => {
    setOpenTabs(prev =>
      prev.map(tab =>
        tab.path === 'welcome'
          ? { ...tab, name: language === 'bn' ? '\u09B8\u0CD7\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE' : 'Welcome' }
          : tab
      )
    );
  }, [language]);

  const loadWorkspace = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.readWorkspace();
        if (Array.isArray(result)) {
          setFiles(result);
        } else {
          setFiles(result.tree);
          const folderName = result.path.split(/[/\\]/).pop() || '\u0986\u09AE\u09BE\u09B0_\u09AA\u0CD7\u09B0\u0995\u09B2\u09CD\u09AA';
          setProjectName(folderName);
        }
      } catch (err) {
        console.error('Error loading real workspace tree:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (window.electronAPI) {
      loadWorkspace();
    }
  }, [loadWorkspace]);

  const problemsCount = useMemo(() => {
    let errors = 0;
    let warnings = 0;

    const scan = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.isFolder && item.children) {
          scan(item.children);
        } else if (!item.isFolder && item.content) {
          const lines = item.content.split('\n');
          for (const lineText of lines) {
            if (/\{\s*\}/.test(lineText) && !lineText.includes('=>') && !lineText.includes('const')) {
              warnings++;
            }
            if (lineText.includes('console.log')) {
              warnings++;
            }
            if (lineText.includes('TODO')) {
              warnings++;
            }
            if (lineText.includes('FIXME')) {
              warnings++;
            }
          }
        }
      }
    };

    scan(files);
    return { errors, warnings };
  }, [files]);

  const handleFileSelect = useCallback(async (path: string) => {
    if (path === 'welcome') {
      setActiveFile('welcome');
      setOpenTabs(prev => {
        const exists = prev.some(t => t.path === 'welcome');
        if (!exists) {
          return [...prev, { name: language === 'bn' ? '\u09B8\u0CD7\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE' : 'Welcome', path: 'welcome', isDirty: false }];
        }
        return prev;
      });
      return;
    }

    setActiveFile(path);
    const fileName = path.split('/').pop() || path;

    if (path.startsWith('docs/')) {
      setOpenTabs(prev => {
        const exists = prev.some(t => t.path === path);
        if (!exists) {
          return [...prev, { name: fileName, path, isDirty: false }];
        }
        return prev;
      });
      return;
    }

    if (window.electronAPI) {
      try {
        const content = await window.electronAPI.readFile(path);
        setFiles(prev => updateFileContentInTree(prev, path, content, false));
        setOpenTabs(prev => {
          const exists = prev.some(t => t.path === path);
          if (!exists) {
            return [...prev, { name: fileName, path, isDirty: false }];
          }
          return prev;
        });
      } catch (err) {
        console.error('Error reading local file:', err);
      }
    } else {
      setOpenTabs(prev => {
        const exists = prev.some(t => t.path === path);
        if (!exists) {
          return [...prev, { name: fileName, path, isDirty: false }];
        }
        return prev;
      });
    }
  }, [language]);

  const handleTabSelect = useCallback((path: string) => {
    handleFileSelect(path);
  }, [handleFileSelect]);

  const handleTabClose = useCallback((path: string) => {
    setOpenTabs(prev => {
      const updated = prev.filter(t => t.path !== path);
      if (activeFile === path) {
        if (updated.length > 0) {
          setActiveFile(updated[updated.length - 1].path);
        } else {
          setActiveFile(null);
        }
      }
      return updated;
    });
  }, [activeFile]);

  const handleContentChange = useCallback((path: string, newContent: string) => {
    const oldNode = findFileInTree(files, path);
    const oldContent = oldNode?.content;
    if (oldContent !== undefined && oldContent !== newContent) {
      pushHistory(path, oldContent);
    }

    setFiles(prev => updateFileContentInTree(prev, path, newContent, true));
    setOpenTabs(prev =>
      prev.map(tab => (tab.path === path ? { ...tab, isDirty: true } : tab))
    );

    if (settings.autoSave && window.electronAPI && !path.startsWith('docs/')) {
      window.electronAPI.writeFile(path, newContent)
        .then(() => {
          setOpenTabs(prev => prev.map(tab => (tab.path === path ? { ...tab, isDirty: false } : tab)));
          setFiles(prev => updateFileContentInTree(prev, path, newContent, false));
        })
        .catch(err => console.error('Local Autosave failed:', err));
    }
  }, [files, pushHistory, settings.autoSave]);

  const handleSave = useCallback(async () => {
    if (!activeFile || activeFile === 'welcome' || activeFile.startsWith('docs/')) return;
    const fileNode = findFileInTree(files, activeFile);
    if (!fileNode) return;
    const content = fileNode.content || '';

    if (window.electronAPI) {
      try {
        await window.electronAPI.writeFile(activeFile, content);
        setFiles(prev => saveFileInTree(prev, activeFile));
        setOpenTabs(prev => prev.map(tab => (tab.path === activeFile ? { ...tab, isDirty: false } : tab)));
      } catch (err) {
        console.error('Error saving local file:', err);
      }
    } else {
      setFiles(prev => saveFileInTree(prev, activeFile));
      setOpenTabs(prev => prev.map(tab => (tab.path === activeFile ? { ...tab, isDirty: false } : tab)));
    }

    if (settings.autoPublish) {
      setPublishModalOpen(true);
    }
  }, [activeFile, files, settings.autoPublish, setPublishModalOpen]);

  const handleSaveAll = useCallback(async () => {
    if (window.electronAPI) {
      try {
        for (const tab of openTabs) {
          if (tab.isDirty && tab.path !== 'welcome' && !tab.path.startsWith('docs/')) {
            const fileNode = findFileInTree(files, tab.path);
            if (fileNode) {
              await window.electronAPI.writeFile(tab.path, fileNode.content || '');
            }
          }
        }
        setFiles(prev => resetModified(prev));
        setOpenTabs(prev => prev.map(tab => ({ ...tab, isDirty: false })));
      } catch (err) {
        console.error('Error saving all files:', err);
      }
    } else {
      setFiles(prev => resetModified(prev));
      setOpenTabs(prev => prev.map(tab => ({ ...tab, isDirty: false })));
    }
  }, [openTabs, files]);

  const handleOpenFolder = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.selectFolder();
        if (result) {
          setFiles(result.tree);
          const folderName = result.path.split(/[/\\]/).pop() || '\u0986\u09AE\u09BE\u09B0_\u09AA\u0CD7\u09B0\u0995\u09B2\u09CD\u09AA';
          setProjectName(folderName);
          setOpenTabs([]);
          setTerminalLines([]);

          const htmlExists = result.tree.some(item => item.name === 'index.html');
          if (htmlExists) {
            handleFileSelect('index.html');
          } else {
            const firstFile = result.tree.find(item => !item.isFolder);
            if (firstFile) {
              handleFileSelect(firstFile.path);
            } else {
              setActiveFile(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to open local directory:', err);
      }
    } else {
      handleNewFile();
    }
  }, [handleFileSelect]);

  const handleNewFile = useCallback(async () => {
    const defaultName = `new_file_${openTabs.length + 1}.html`;
    const fileName = await showPrompt(
      language === 'bn' ? '\u09A8\u09A4\u09C1\u09A8 \u09AB\u09BE\u0987\u09B2\u09C7\u09B0 \u09A8\u09BE\u09AE \u09A6\u09BF\u09A8:' : 'Enter new file name:',
      defaultName
    );
    if (!fileName) return;

    if (window.electronAPI) {
      try {
        await window.electronAPI.createFile(fileName);
        await loadWorkspace();
        await handleFileSelect(fileName);
      } catch (err) {
        console.error('Error creating real file:', err);
      }
    } else {
      const newItem: FileSystemItem = {
        name: fileName,
        path: fileName,
        isFolder: false,
        content: `<!-- ${fileName} -->\n`,
        modified: false,
      };
      setFiles(prev => [...prev, newItem]);
      handleFileSelect(fileName);
    }
  }, [language, openTabs.length, loadWorkspace, handleFileSelect]);

  const handleNewFolder = useCallback(async () => {
    const folderName = await showPrompt(
      language === 'bn' ? '\u09A8\u09A4\u09C1\u09A8 \u09AB\u09CB\u09B2\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09A8\u09BE\u09AE \u09A6\u09BF\u09A8:' : 'Enter new folder name:',
      'new_folder'
    );
    if (!folderName) return;

    if (window.electronAPI) {
      try {
        await window.electronAPI.createFolder(folderName);
        await loadWorkspace();
      } catch (err) {
        console.error('Error creating real folder:', err);
      }
    } else {
      const newItem: FileSystemItem = {
        name: folderName,
        path: folderName,
        isFolder: true,
        children: [],
        modified: false,
      };
      setFiles(prev => [...prev, newItem]);
    }
  }, [language, loadWorkspace]);

  const handleNewFileInFolder = useCallback(async (folderPath: string) => {
    const defaultName = `new_file_${openTabs.length + 1}.html`;
    const fileName = await showPrompt(
      language === 'bn' ? '\u09A8\u09A4\u09C1\u09A8 \u09AB\u09BE\u0987\u09B2\u09C7\u09B0 \u09A8\u09BE\u09AE \u09A6\u09BF\u09A8:' : 'Enter new file name:',
      defaultName
    );
    if (!fileName) return;

    const fullPath = `${folderPath}/${fileName}`;

    if (window.electronAPI) {
      try {
        await window.electronAPI.createFile(fullPath);
        await loadWorkspace();
        await handleFileSelect(fullPath);
      } catch (err) {
        console.error('Error creating file in folder:', err);
      }
    } else {
      const newItem: FileSystemItem = {
        name: fileName,
        path: fullPath,
        isFolder: false,
        content: `<!-- ${fileName} -->\n`,
        modified: false,
      };
      setFiles(prev => {
        const addToFolder = (items: FileSystemItem[]): FileSystemItem[] =>
          items.map(item => {
            if (item.path === folderPath && item.isFolder) {
              return { ...item, children: [...(item.children || []), newItem] };
            }
            if (item.children) {
              return { ...item, children: addToFolder(item.children) };
            }
            return item;
          });
        return addToFolder(prev);
      });
      handleFileSelect(fullPath);
    }
  }, [language, openTabs.length, loadWorkspace, handleFileSelect]);

  const handleNewFolderInFolder = useCallback(async (folderPath: string) => {
    const folderName = await showPrompt(
      language === 'bn' ? '\u09A8\u09A4\u09C1\u09A8 \u09AB\u09CB\u09B2\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09A8\u09BE\u09AE \u09A6\u09BF\u09A8:' : 'Enter new folder name:',
      'new_folder'
    );
    if (!folderName) return;

    const fullPath = `${folderPath}/${folderName}`;

    if (window.electronAPI) {
      try {
        await window.electronAPI.createFolder(fullPath);
        await loadWorkspace();
      } catch (err) {
        console.error('Error creating folder in folder:', err);
      }
    } else {
      const newItem: FileSystemItem = {
        name: folderName,
        path: fullPath,
        isFolder: true,
        children: [],
        modified: false,
      };
      setFiles(prev => {
        const addToFolder = (items: FileSystemItem[]): FileSystemItem[] =>
          items.map(item => {
            if (item.path === folderPath && item.isFolder) {
              return { ...item, children: [...(item.children || []), newItem] };
            }
            if (item.children) {
              return { ...item, children: addToFolder(item.children) };
            }
            return item;
          });
        return addToFolder(prev);
      });
    }
  }, [language, loadWorkspace]);

  const handleDeleteFile = useCallback(async (path: string) => {
    if (
      !(await showConfirm(
        language === 'bn'
          ? `\u0986\u09AA\u09A8\u09BF \u0995\u09BF '${path}' \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09A4\u09C7 \u099A\u09BE\u09A8?`
          : `Are you sure you want to delete '${path}'?`
      ))
    )
      return;

    if (window.electronAPI) {
      try {
        await window.electronAPI.deleteItem(path);
        await loadWorkspace();
        handleTabClose(path);
      } catch (err) {
        console.error('Error deleting real file:', err);
      }
    } else {
      setFiles(prev => deleteItemFromTree(prev, path));
      handleTabClose(path);
    }
  }, [language, loadWorkspace, handleTabClose]);

  const handleRenameFile = useCallback(async (path: string) => {
    const currentName = path.split('/').pop() || path;
    const newName = await showPrompt(
      language === 'bn' ? '\u09A8\u09A4\u09C1\u09A8 \u09A8\u09BE\u09AE \u09A6\u09BF\u09A8:' : 'Enter new name:',
      currentName
    );
    if (!newName) return;

    const parts = path.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');

    if (window.electronAPI) {
      try {
        await window.electronAPI.renameItem(path, newPath);
        await loadWorkspace();
        setOpenTabs(prev =>
          prev.map(tab => (tab.path === path ? { ...tab, name: newName, path: newPath } : tab))
        );
        if (activeFile === path) {
          setActiveFile(newPath);
        }
      } catch (err) {
        console.error('Error renaming item on disk:', err);
      }
    } else {
      setFiles(prev => renameItemInTree(prev, path, newName));
      setOpenTabs(prev =>
        prev.map(tab => (tab.path === path ? { ...tab, name: newName, path: newPath } : tab))
      );
      if (activeFile === path) {
        setActiveFile(newPath);
      }
    }
  }, [language, activeFile, loadWorkspace]);

  const handleRun = useCallback(() => {
    if (!activeFile || activeFile === 'welcome') return;
    const fileName = activeFile.split('/').pop() || activeFile;

    if (window.electronAPI) {
      if (settings.sandboxEnabled) {
        setTerminalLines(prev => [
          ...prev,
          { text: `[Sandbox]: Running "${fileName}" in restricted mode.`, type: 'system' },
        ]);
      }
      const runCmd = fileName.endsWith('.js')
        ? `node "${fileName}"`
        : fileName.endsWith('.php')
        ? `php "${fileName}"`
        : `echo "Running ${fileName}"`;
      window.electronAPI.sendTerminalInput(runCmd + '\r\n');
      return;
    }

    setTerminalLines(prev => [
      ...prev,
      { text: `C:\\\u0986\u09AE\u09BE\u09B0_\u09AA\u0CD7\u09B0\u0995\u09B2\u09CD\u09AA> run ${fileName}`, type: 'input' },
      { text: `[Run Mode]: Executing ${fileName}...${settings.sandboxEnabled ? ' (sandboxed)' : ''}`, type: 'system' },
    ]);

    if (fileName.endsWith('.js')) {
      setTerminalLines(prev => [
        ...prev,
        { text: `> node "${fileName}"`, type: 'input' },
        { text: '[Output]: Script executed successfully.', type: 'output' },
      ]);
    } else if (fileName.endsWith('.html')) {
      setTerminalLines(prev => [
        ...prev,
        { text: `[System]: Opening ${fileName} in browser preview...`, type: 'system' },
      ]);
    } else {
      setTerminalLines(prev => [
        ...prev,
        { text: `[System]: ${fileName} executed.`, type: 'output' },
      ]);
    }
  }, [activeFile, settings.sandboxEnabled]);

  const handleCreateVirtualFile = useCallback((path: string, name: string, content: string) => {
    const parts = path.split('/');
    if (parts.length > 1) {
      const folderName = parts[0];
      setFiles(prev => {
        const folderExists = prev.some(item => item.name === folderName);
        const updated = [...prev];
        if (!folderExists) {
          updated.push({
            name: folderName,
            path: folderName,
            isFolder: true,
            children: [],
          });
        }
        return updated.map(item => {
          if (item.name === folderName) {
            const fileExists = item.children?.some(c => c.name === name);
            if (!fileExists) {
              return {
                ...item,
                children: [
                  ...(item.children || []),
                  { name, path, isFolder: false, content, modified: false },
                ],
              };
            }
          }
          return item;
        });
      });
    } else {
      setFiles(prev => {
        const fileExists = prev.some(item => item.name === name);
        if (!fileExists) {
          return [...prev, { name, path, isFolder: false, content, modified: false }];
        }
        return prev;
      });
    }

    setTimeout(() => {
      handleFileSelect(path);
    }, 100);
  }, [handleFileSelect]);

  const handleCopyFile = useCallback((path: string) => {
    const fileNode = findFileInTree(files, path);
    if (fileNode) {
      setClipboard({ type: 'copy', path, name: fileNode.name, content: fileNode.content || '', isFolder: fileNode.isFolder, children: fileNode.children });
    }
  }, [files]);

  const handleCutFile = useCallback((path: string) => {
    const fileNode = findFileInTree(files, path);
    if (fileNode) {
      setClipboard({ type: 'cut', path, name: fileNode.name, content: fileNode.content || '', isFolder: fileNode.isFolder, children: fileNode.children });
    }
  }, [files]);

  const handlePasteFile = useCallback(async (targetFolderPath?: string) => {
    if (!clipboard) return;

    const newName = clipboard.name;
    const isDuplicate = targetFolderPath
      ? findFileInTree(files, targetFolderPath)?.children?.some(c => c.name === newName)
      : files.some(item => item.name === newName);

    const finalName = isDuplicate ? `copy_${newName}` : newName;
    const finalPath = targetFolderPath ? `${targetFolderPath}/${finalName}` : finalName;

    if (window.electronAPI) {
      try {
        if (clipboard.type === 'cut') {
          await window.electronAPI.renameItem(clipboard.path, finalPath);
          await loadWorkspace();
        } else {
          await window.electronAPI.createFile(finalPath);
          await window.electronAPI.writeFile(finalPath, clipboard.content);
          await loadWorkspace();
        }
      } catch (err) {
        console.error('Paste failed:', err);
      }
    } else {
      const updatedChildren = clipboard.children && clipboard.isFolder
        ? updateChildPaths(clipboard.children, clipboard.path, finalPath)
        : clipboard.children;

      const newItem: FileSystemItem = {
        name: finalName,
        path: finalPath,
        isFolder: clipboard.isFolder || false,
        content: clipboard.content,
        modified: false,
        children: updatedChildren,
      };

      setFiles(prev => {
        let tree = prev;
        if (clipboard.type === 'cut') {
          tree = deleteItemFromTree(tree, clipboard.path);
        }
        if (targetFolderPath) {
          const addToFolder = (items: FileSystemItem[]): FileSystemItem[] =>
            items.map(item => {
              if (item.path === targetFolderPath && item.isFolder) {
                return { ...item, children: [...(item.children || []), newItem] };
              }
              if (item.children) {
                return { ...item, children: addToFolder(item.children) };
              }
              return item;
            });
          return addToFolder(tree);
        } else {
          return [...tree, newItem];
        }
      });
    }

    if (clipboard.type === 'cut') {
      setClipboard(null);
    }
  }, [clipboard, files, activeFile, loadWorkspace]);

  return (
    <FileSystemContext.Provider
      value={{
        files,
        setFiles,
        projectName,
        openTabs,
        activeFile,

        terminalLines,
        setTerminalLines,
        problemsCount,
        clipboard,
        handleFileSelect,
        handleTabSelect,
        handleTabClose,
        handleContentChange,
        handleSave,
        handleSaveAll,
        handleOpenFolder,
        handleNewFile,
        handleNewFolder,
        handleNewFileInFolder,
        handleNewFolderInFolder,
        handleDeleteFile,
        handleRenameFile,
        handleCopyFile,
        handleCutFile,
        handlePasteFile,
        handleRun,
        handleCreateVirtualFile,
        handleUndo,
        handleRedo,
        undoStackDepths,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem(): FileSystemContextValue {
  const ctx = useContext(FileSystemContext);
  if (!ctx) throw new Error('useFileSystem must be used within FileSystemProvider');
  return ctx;
}
