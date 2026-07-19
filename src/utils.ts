import { FileSystemItem } from './types';

export function findFileInTree(items: FileSystemItem[], path: string): FileSystemItem | null {
  for (const item of items) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findFileInTree(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

export function findFileByRelativePath(items: FileSystemItem[], targetPath: string): FileSystemItem | null {
  for (const item of items) {
    if (item.path === targetPath || item.name === targetPath) return item;
    if (item.children) {
      const found = findFileByRelativePath(item.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}

export function updateFileContentInTree(
  items: FileSystemItem[],
  path: string,
  newContent: string,
  modified: boolean
): FileSystemItem[] {
  return items.map((item) => {
    if (item.path === path) {
      return { ...item, content: newContent, modified };
    }
    if (item.children) {
      return {
        ...item,
        children: updateFileContentInTree(item.children, path, newContent, modified)
      };
    }
    return item;
  });
}

export function saveFileInTree(items: FileSystemItem[], path: string): FileSystemItem[] {
  return items.map((item) => {
    if (item.path === path) {
      return { ...item, modified: false };
    }
    if (item.children) {
      return {
        ...item,
        children: saveFileInTree(item.children, path)
      };
    }
    return item;
  });
}

export function deleteItemFromTree(items: FileSystemItem[], path: string): FileSystemItem[] {
  return items
    .filter(item => item.path !== path)
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: deleteItemFromTree(item.children, path)
        };
      }
      return item;
    });
}

/** Update all child paths to reflect a new parent path prefix */
export function updateChildPaths(items: FileSystemItem[], oldParentPath: string, newParentPath: string): FileSystemItem[] {
  return items.map(item => {
    const childNewPath = item.path.replace(oldParentPath + '/', newParentPath + '/');
    if (item.children) {
      return { ...item, path: childNewPath, children: updateChildPaths(item.children, oldParentPath, newParentPath) };
    }
    return { ...item, path: childNewPath };
  });
}

export function renameItemInTree(
  items: FileSystemItem[],
  path: string,
  newName: string
): FileSystemItem[] {
  return items.map(item => {
    if (item.path === path) {
      const parts = path.split('/');
      parts[parts.length - 1] = newName;
      const newPath = parts.join('/');
      const updated: FileSystemItem = { ...item, name: newName, path: newPath };
      if (item.children) {
        updated.children = updateChildPaths(item.children, path, newPath);
      }
      return updated;
    }
    if (item.children) {
      return {
        ...item,
        children: renameItemInTree(item.children, path, newName)
      };
    }
    return item;
  });
}

export function getFilePaths(items: FileSystemItem[], currentDir = ''): string[] {
  let list: string[] = [];
  for (const item of items) {
    if (item.isFolder) {
      list = [...list, ...getFilePaths(item.children || [], `${currentDir}${item.name}/`)];
    } else {
      list.push(`${currentDir}${item.name}`);
    }
  }
  return list;
}

export function getFileIconColor(fileName: string): string {
  if (!fileName) return 'var(--text-secondary)';

  const trimmed = fileName.trim();
  const lastDotIndex = trimmed.lastIndexOf('.');

  if (lastDotIndex <= 0 || lastDotIndex === trimmed.length - 1) {
    return 'var(--text-secondary)';
  }

  const ext = trimmed.slice(lastDotIndex + 1).toLowerCase();
  switch (ext) {
    case 'html': return '#e34f26';
    case 'css': return '#0284c7';
    case 'js': return '#eab308';
    case 'php': return '#8b5cf6';
    case 'json': return '#f97316';
    case 'md': return '#3b82f6';
    case 'png':
    case 'jpg':
    case 'jpeg': return '#10b981';
    default: return 'var(--text-secondary)';
  }
}

export function getEditorLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return 'html';
    case 'css': return 'css';
    case 'js': return 'javascript';
    case 'php': return 'php';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
}

/** Shared key map for normalising keyboard events into shortcut strings */
const KEY_SHORTCUT_MAP: Record<string, string> = {
  '`': '`', ',': ',', '.': '.', '/': '/', ';': ';',
  "'": "'", '[': '[', ']': ']', '\\': '\\', '-': '-', '=': '=',
  ' ': 'Space', 'Escape': 'Esc',
  'ArrowUp': 'Up', 'ArrowDown': 'Down', 'ArrowLeft': 'Left', 'ArrowRight': 'Right',
};

/**
 * Normalise a KeyboardEvent into a shortcut string like "Ctrl+Shift+S".
 * Accepts either native `KeyboardEvent` or React's synthetic event (they share key/ctrlKey/etc).
 *
 * Returns empty string for modifier-only presses (Ctrl alone, Shift alone, etc.)
 * so the keybinding recorder doesn't record incomplete chords.
 */
export function eventToShortcut(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');

  const key = KEY_SHORTCUT_MAP[e.key] || e.key;

  // Skip modifier-only presses
  if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') return '';

  if (key.length === 1) {
    parts.push(key.toUpperCase());
  } else {
    parts.push(key);
  }

  return parts.join('+');
}

/**
 * Check if the key event target is an input-like element where
 * keyboard shortcuts should typically be suppressed.
 */
export function isInputElement(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}
