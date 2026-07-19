import { describe, it, expect } from 'vitest';
import { findFileInTree } from './utils';
import { FileSystemItem } from './types';

describe('findFileInTree', () => {
  const mockTree: FileSystemItem[] = [
    {
      name: 'src',
      path: 'src',
      isFolder: true,
      children: [
        {
          name: 'utils.ts',
          path: 'src/utils.ts',
          isFolder: false,
          content: 'export function findFileInTree(...) {}',
        },
        {
          name: 'components',
          path: 'src/components',
          isFolder: true,
          children: [
            {
              name: 'Editor.tsx',
              path: 'src/components/Editor.tsx',
              isFolder: false,
              content: 'const Editor = () => {};',
            },
          ],
        },
      ],
    },
    {
      name: 'package.json',
      path: 'package.json',
      isFolder: false,
      content: '{"name": "bdcode"}',
    },
    {
      name: 'empty-folder',
      path: 'empty-folder',
      isFolder: true,
      children: [],
    },
  ];

  it('should return null when tree is empty', () => {
    expect(findFileInTree([], 'src/utils.ts')).toBeNull();
  });

  it('should find a file at the root level', () => {
    const result = findFileInTree(mockTree, 'package.json');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('package.json');
    expect(result?.isFolder).toBe(false);
  });

  it('should find a nested file', () => {
    const result = findFileInTree(mockTree, 'src/utils.ts');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('utils.ts');
    expect(result?.isFolder).toBe(false);
  });

  it('should find a deeply nested file', () => {
    const result = findFileInTree(mockTree, 'src/components/Editor.tsx');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Editor.tsx');
    expect(result?.isFolder).toBe(false);
  });

  it('should find a folder', () => {
    const result = findFileInTree(mockTree, 'src/components');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('components');
    expect(result?.isFolder).toBe(true);
  });

  it('should return null if file/folder path is not found', () => {
    const result = findFileInTree(mockTree, 'nonexistent-file.ts');
    expect(result).toBeNull();
  });

  it('should handle empty folders correctly', () => {
    const result = findFileInTree(mockTree, 'empty-folder');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('empty-folder');
    expect(result?.children).toEqual([]);
  });
});
