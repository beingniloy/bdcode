import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { updateFileContentInTree, analyzeFileProblems, analyzeWorkspaceProblems } from './utils';
import { FileSystemItem, ProblemItem } from './types';

describe('analyzeFileProblems and analyzeWorkspaceProblems', () => {
  it('should detect TODO, FIXME, empty blocks, and console.log in file content', () => {
    const fileItem: FileSystemItem = {
      name: 'test.js',
      path: 'src/test.js',
      isFolder: false,
      content: [
        '// TODO: implement feature',
        '// FIXME: fix memory leak',
        'function empty() { }',
        'console.log("hello");',
        'const arrow = () => {};', // Should not trigger empty block rule because of =>
      ].join('\n'),
    };

    const problems = analyzeFileProblems(fileItem);
    assert.equal(problems.length, 4);

    const todo = problems.find(p => p.message === 'implement feature');
    assert.ok(todo);
    assert.equal(todo.severity, 'info');

    const fixme = problems.find(p => p.message === 'fix memory leak');
    assert.ok(fixme);
    assert.equal(fixme.severity, 'warning');

    const emptyBlock = problems.find(p => p.message === 'Empty block detected');
    assert.ok(emptyBlock);
    assert.equal(emptyBlock.line, 3);

    const consoleLog = problems.find(p => p.message === 'Remove console.log before production');
    assert.ok(consoleLog);
    assert.equal(consoleLog.line, 4);
  });

  it('should analyze workspace tree and compute total problem counts', () => {
    const workspace: FileSystemItem[] = [
      {
        name: 'src',
        path: 'src',
        isFolder: true,
        children: [
          {
            name: 'a.js',
            path: 'src/a.js',
            isFolder: false,
            content: 'console.log("a");\n// TODO: task a',
          },
          {
            name: 'b.js',
            path: 'src/b.js',
            isFolder: false,
            content: '// FIXME: urgent bug',
          },
        ],
      },
    ];

    const result = analyzeWorkspaceProblems(workspace);
    assert.equal(result.problems.length, 3);
    assert.equal(result.counts.errors, 0);
    assert.equal(result.counts.warnings, 2); // console.log warning + FIXME warning
  });

  it('should leverage WeakMap cache to avoid re-analyzing unchanged files', () => {
    const file1: FileSystemItem = {
      name: 'cached.js',
      path: 'cached.js',
      isFolder: false,
      content: 'console.log("cached");',
    };

    const cache = new WeakMap<FileSystemItem, ProblemItem[]>();

    // First scan populates cache
    const firstResult = analyzeWorkspaceProblems([file1], cache);
    assert.equal(firstResult.problems.length, 1);
    assert.ok(cache.has(file1));

    // Manually set a mock cached value to verify cache hit
    cache.set(file1, [
      { file: 'cached.js', path: 'cached.js', line: 1, message: 'Mocked Cache', severity: 'error' },
    ]);

    // Second scan should read from cache
    const secondResult = analyzeWorkspaceProblems([file1], cache);
    assert.equal(secondResult.problems.length, 1);
    assert.equal(secondResult.problems[0].message, 'Mocked Cache');
    assert.equal(secondResult.counts.errors, 1);
  });
});

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
