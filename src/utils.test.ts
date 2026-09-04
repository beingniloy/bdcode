import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getFilePaths, updateFileContentInTree } from './utils';
import { FileSystemItem } from './types';

describe('updateFileContentInTree', () => {
  it('should update content and modified state of a file at the root level', () => {
    const items: FileSystemItem[] = [
      {
        name: 'index.js',
        path: 'index.js',
        isFolder: false,
        content: 'console.log("hello");',
        modified: false,
      },
      {
        name: 'styles.css',
        path: 'styles.css',
        isFolder: false,
        content: 'body { color: red; }',
        modified: false,
      },
    ];

    const result = updateFileContentInTree(items, 'index.js', 'console.log("world");', true);

    // Verify index.js is updated
    assert.equal(result[0].content, 'console.log("world");');
    assert.equal(result[0].modified, true);

    // Verify other elements are not modified
    assert.deepEqual(result[1], items[1]);
  });

  it('should update content and modified state of a nested file deep within a folder hierarchy', () => {
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
              {
                name: 'Button.tsx',
                path: 'src/components/Button.tsx',
                isFolder: false,
                content: 'export const Button = () => null;',
                modified: false,
              }
            ]
          },
          {
            name: 'index.tsx',
            path: 'src/index.tsx',
            isFolder: false,
            content: 'import "./index.css";',
            modified: false,
          }
        ]
      }
    ];

    const result = updateFileContentInTree(items, 'src/components/Button.tsx', 'export const Button = () => <button />;', true);

    const buttonFile = result[0].children?.[0].children?.[0];
    assert.ok(buttonFile);
    assert.equal(buttonFile.content, 'export const Button = () => <button />;');
    assert.equal(buttonFile.modified, true);

    // Verify the rest of the tree is untouched
    const indexFile = result[0].children?.[1];
    assert.deepEqual(indexFile, items[0].children?.[1]);
  });

  it('should return unchanged tree if target path does not exist', () => {
    const items: FileSystemItem[] = [
      {
        name: 'index.js',
        path: 'index.js',
        isFolder: false,
        content: 'console.log("hello");',
        modified: false,
      }
    ];

    const result = updateFileContentInTree(items, 'non-existent.js', 'new content', true);
    assert.deepEqual(result, items);
  });

  it('should handle an empty items array', () => {
    const result = updateFileContentInTree([], 'index.js', 'new content', true);
    assert.deepEqual(result, []);
  });

  it('should handle tree items with undefined children gracefully', () => {
    const items: FileSystemItem[] = [
      {
        name: 'folder',
        path: 'folder',
        isFolder: true,
        children: undefined
      }
    ];

    const result = updateFileContentInTree(items, 'folder/file.js', 'content', true);
    assert.deepEqual(result, items);
  });
});

describe('getFilePaths', () => {
  it('should return an empty array when given an empty items array', () => {
    const result = getFilePaths([]);
    assert.deepEqual(result, []);
  });

  it('should return file paths for flat files at the root level', () => {
    const items: FileSystemItem[] = [
      { name: 'index.html', path: 'index.html', isFolder: false },
      { name: 'style.css', path: 'style.css', isFolder: false },
    ];

    const result = getFilePaths(items);
    assert.deepEqual(result, ['index.html', 'style.css']);
  });

  it('should return file paths recursively for nested folders', () => {
    const items: FileSystemItem[] = [
      { name: 'README.md', path: 'README.md', isFolder: false },
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [
          { name: 'App.tsx', path: 'src/App.tsx', isFolder: false },
          {
            name: 'components',
            path: 'src/components',
            isFolder: true,
            children: [
              { name: 'Header.tsx', path: 'src/components/Header.tsx', isFolder: false },
            ],
          },
        ],
      },
    ];

    const result = getFilePaths(items);
    assert.deepEqual(result, ['README.md', 'src/App.tsx', 'src/components/Header.tsx']);
  });

  it('should handle folders with empty or undefined children', () => {
    const items: FileSystemItem[] = [
      { name: 'emptyFolder', path: 'emptyFolder', isFolder: true, children: [] },
      { name: 'undefinedChildrenFolder', path: 'undefinedChildrenFolder', isFolder: true, children: undefined },
      { name: 'file.js', path: 'file.js', isFolder: false },
    ];

    const result = getFilePaths(items);
    assert.deepEqual(result, ['file.js']);
  });

  it('should prepend currentDir prefix when provided', () => {
    const items: FileSystemItem[] = [
      { name: 'main.ts', path: 'main.ts', isFolder: false },
      {
        name: 'utils',
        path: 'utils',
        isFolder: true,
        children: [
          { name: 'helper.ts', path: 'utils/helper.ts', isFolder: false },
        ],
      },
    ];

    const result = getFilePaths(items, 'root/');
    assert.deepEqual(result, ['root/main.ts', 'root/utils/helper.ts']);
  });
});
