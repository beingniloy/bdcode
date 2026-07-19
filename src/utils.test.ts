import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { updateFileContentInTree } from './utils';
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
