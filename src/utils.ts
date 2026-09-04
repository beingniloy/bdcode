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
  const ext = fileName.split('.').pop()?.toLowerCase();
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

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

export interface SearchResult {
  path: string;
  line: number;
  text: string;
  colStart: number;
  colEnd: number;
}

export function buildSearchRegex(query: string, options: SearchOptions = {}): RegExp | null {
  if (!query) return null;
  try {
    let pattern = options.useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (options.wholeWord) pattern = `\\b${pattern}\\b`;
    const flags = options.caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

/**
  * Optimized recursive file search across FileSystemItem tree.
  *
  * Performance Optimizations:
  * 1. File-level pre-filtering: `regex.test(item.content)` is run once per file before
  *    splitting the string into lines. If the file content does not match the regex,
  *    `split('\n')` and per-line matching are skipped completely.
  * 2. Non-global line regex: A non-global `lineRegex` is derived once outside the search loop.
  *    Calling `.exec()` on a non-global RegExp is stateless and does not mutate `lastIndex`,
  *    eliminating the overhead of resetting `regex.lastIndex = 0` on every single line.
  * 3. Index loop: Uses a standard indexed `for` loop over lines to avoid closure allocation
  *    per line.
  */
export function searchFilesRecursively(items: FileSystemItem[], regex: RegExp): SearchResult[] {
  // Ensure multiline 'm' flag is present for full content pre-filtering so line anchors (^ and $) match line boundaries
  const fileFlags = regex.flags.includes('m') ? regex.flags : regex.flags + 'm';
  const fileRegex = new RegExp(regex.source, fileFlags);

  // Derive non-global line regex once outside search loop so per-line matching is stateless
  const lineRegex = regex.global ? new RegExp(regex.source, regex.flags.replace('g', '')) : regex;

  return searchFilesRecursivelyInternal(items, fileRegex, lineRegex);
}

function searchFilesRecursivelyInternal(
  items: FileSystemItem[],
  fileRegex: RegExp,
  lineRegex: RegExp
): SearchResult[] {
  const list: SearchResult[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.isFolder && item.children) {
      list.push(...searchFilesRecursivelyInternal(item.children, fileRegex, lineRegex));
    } else if (!item.isFolder && item.content) {
      // Pre-filter check: reset lastIndex and test full file content first (with multiline 'm' flag)
      fileRegex.lastIndex = 0;
      if (!fileRegex.test(item.content)) {
        continue;
      }
      const lines = item.content.split('\n');
      for (let idx = 0; idx < lines.length; idx++) {
        const lineText = lines[idx];
        const match = lineRegex.exec(lineText);
        if (match) {
          list.push({
            path: item.path,
            line: idx + 1,
            text: lineText.trim(),
            colStart: match.index,
            colEnd: match.index + match[0].length
          });
        }
      }
    }
  }
  return list;
}
