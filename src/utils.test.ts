import { describe, it, expect } from 'vitest';
import { deleteItemFromTree } from './utils';
import { FileSystemItem } from './types';

describe('deleteItemFromTree', () => {
  it('should return an empty list when tree is empty', () => {
    const items: FileSystemItem[] = [];
    const result = deleteItemFromTree(items, 'some-path');
    expect(result).toEqual([]);
  });

  it('should delete a file at the root level', () => {
    const items: FileSystemItem[] = [
      { name: 'file1.txt', path: 'file1.txt', isFolder: false },
      { name: 'file2.txt', path: 'file2.txt', isFolder: false },
    ];
    const result = deleteItemFromTree(items, 'file1.txt');
    expect(result).toEqual([
      { name: 'file2.txt', path: 'file2.txt', isFolder: false }
    ]);
  });

  it('should delete a folder and all its contents at the root level', () => {
    const items: FileSystemItem[] = [
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [
          { name: 'index.ts', path: 'src/index.ts', isFolder: false }
        ]
      },
      { name: 'README.md', path: 'README.md', isFolder: false },
    ];
    const result = deleteItemFromTree(items, 'src');
    expect(result).toEqual([
      { name: 'README.md', path: 'README.md', isFolder: false }
    ]);
  });

  it('should delete a nested file deep within the tree', () => {
    const items: FileSystemItem[] = [
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [
          {
            name: 'components',
            path: 'src/components',
            isFolder: true,
            children: [
              { name: 'Header.tsx', path: 'src/components/Header.tsx', isFolder: false },
              { name: 'Footer.tsx', path: 'src/components/Footer.tsx', isFolder: false }
            ]
          },
          { name: 'index.ts', path: 'src/index.ts', isFolder: false }
        ]
      },
      { name: 'package.json', path: 'package.json', isFolder: false }
    ];

    const result = deleteItemFromTree(items, 'src/components/Header.tsx');

    expect(result).toEqual([
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [
          {
            name: 'components',
            path: 'src/components',
            isFolder: true,
            children: [
              { name: 'Footer.tsx', path: 'src/components/Footer.tsx', isFolder: false }
            ]
          },
          { name: 'index.ts', path: 'src/index.ts', isFolder: false }
        ]
      },
      { name: 'package.json', path: 'package.json', isFolder: false }
    ]);
  });

  it('should return the original structure if the path does not exist', () => {
    const items: FileSystemItem[] = [
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [
          { name: 'index.ts', path: 'src/index.ts', isFolder: false }
        ]
      },
      { name: 'README.md', path: 'README.md', isFolder: false }
    ];
    const result = deleteItemFromTree(items, 'non-existent.txt');
    expect(result).toEqual(items);
  });

  it('should handle immutability correctly (should return a new array and clone parent structures that changed)', () => {
    const items: FileSystemItem[] = [
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [
          { name: 'index.ts', path: 'src/index.ts', isFolder: false },
          { name: 'utils.ts', path: 'src/utils.ts', isFolder: false }
        ]
      },
      { name: 'README.md', path: 'README.md', isFolder: false }
    ];

    const result = deleteItemFromTree(items, 'src/utils.ts');

    // Root list reference should change
    expect(result).not.toBe(items);
    // Modified folder object reference should change
    expect(result[0]).not.toBe(items[0]);
    // Modified folder's children array reference should change
    expect(result[0].children).not.toBe(items[0].children);
    // Unchanged item should maintain its reference (shallow copies of unaffected objects are standard in map)
    expect(result[1]).toBe(items[1]);
  });
});
