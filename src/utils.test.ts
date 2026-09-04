import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { updateFileContentInTree, renameItemInTree } from './utils';
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

describe('renameItemInTree', () => {
  it('should rename a root-level file', () => {
    const items: FileSystemItem[] = [
      {
        name: 'oldName.js',
        path: 'oldName.js',
        isFolder: false,
        content: 'console.log("hello");',
      },
      {
        name: 'other.js',
        path: 'other.js',
        isFolder: false,
      },
    ];

    const result = renameItemInTree(items, 'oldName.js', 'newName.js');

    assert.equal(result[0].name, 'newName.js');
    assert.equal(result[0].path, 'newName.js');
    assert.equal(result[0].content, 'console.log("hello");');
    assert.deepEqual(result[1], items[1]);
  });

  it('should rename a deeply nested file', () => {
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
              },
            ],
          },
        ],
      },
    ];

    const result = renameItemInTree(items, 'src/components/Button.tsx', 'CustomButton.tsx');

    const button = result[0].children?.[0].children?.[0];
    assert.ok(button);
    assert.equal(button.name, 'CustomButton.tsx');
    assert.equal(button.path, 'src/components/CustomButton.tsx');
  });

  it('should rename a folder and update paths for all descendant files and subfolders', () => {
    const items: FileSystemItem[] = [
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [
          {
            name: 'utils',
            path: 'src/utils',
            isFolder: true,
            children: [
              {
                name: 'helper.ts',
                path: 'src/utils/helper.ts',
                isFolder: false,
              },
            ],
          },
          {
            name: 'index.ts',
            path: 'src/index.ts',
            isFolder: false,
          },
        ],
      },
    ];

    const result = renameItemInTree(items, 'src/utils', 'helpers');

    const folder = result[0].children?.[0];
    assert.ok(folder);
    assert.equal(folder.name, 'helpers');
    assert.equal(folder.path, 'src/helpers');

    const childFile = folder.children?.[0];
    assert.ok(childFile);
    assert.equal(childFile.name, 'helper.ts');
    assert.equal(childFile.path, 'src/helpers/helper.ts');

    // Unaffected sibling item
    assert.deepEqual(result[0].children?.[1], items[0].children?.[1]);
  });

  it('should return unchanged tree if path does not exist', () => {
    const items: FileSystemItem[] = [
      {
        name: 'file.txt',
        path: 'file.txt',
        isFolder: false,
      },
    ];

    const result = renameItemInTree(items, 'non-existent.txt', 'new.txt');
    assert.deepEqual(result, items);
  });

  it('should handle an empty items array', () => {
    const result = renameItemInTree([], 'file.txt', 'new.txt');
    assert.deepEqual(result, []);
  });

  it('should handle items with undefined children gracefully', () => {
    const items: FileSystemItem[] = [
      {
        name: 'folder',
        path: 'folder',
        isFolder: true,
        children: undefined,
      },
    ];

    const result = renameItemInTree(items, 'folder/child.txt', 'renamed.txt');
    assert.deepEqual(result, items);
  });
});
