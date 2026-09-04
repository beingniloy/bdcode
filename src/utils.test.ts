import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { updateFileContentInTree, eventToShortcut } from './utils';
import { FileSystemItem } from './types';

function mockKeyEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: '',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  } as KeyboardEvent;
}

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

describe('eventToShortcut', () => {
  it('should return empty string for modifier-only key presses', () => {
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Control', ctrlKey: true })), '');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Shift', shiftKey: true })), '');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Alt', altKey: true })), '');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Meta', metaKey: true })), '');
  });

  it('should format single keys without modifiers and capitalize single character keys', () => {
    assert.equal(eventToShortcut(mockKeyEvent({ key: 's' })), 'S');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'A' })), 'A');
    assert.equal(eventToShortcut(mockKeyEvent({ key: '1' })), '1');
  });

  it('should format single modifier combinations correctly', () => {
    assert.equal(eventToShortcut(mockKeyEvent({ key: 's', ctrlKey: true })), 'Ctrl+S');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 's', metaKey: true })), 'Ctrl+S');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'a', shiftKey: true })), 'Shift+A');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'b', altKey: true })), 'Alt+B');
  });

  it('should format multiple modifier combinations in Ctrl+Shift+Alt order', () => {
    assert.equal(
      eventToShortcut(mockKeyEvent({ key: 's', ctrlKey: true, shiftKey: true })),
      'Ctrl+Shift+S'
    );
    assert.equal(
      eventToShortcut(mockKeyEvent({ key: 'z', ctrlKey: true, altKey: true })),
      'Ctrl+Alt+Z'
    );
    assert.equal(
      eventToShortcut(mockKeyEvent({ key: 'p', metaKey: true, shiftKey: true, altKey: true })),
      'Ctrl+Shift+Alt+P'
    );
  });

  it('should map special keys using KEY_SHORTCUT_MAP', () => {
    assert.equal(eventToShortcut(mockKeyEvent({ key: ' ' })), 'Space');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Escape' })), 'Esc');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'ArrowUp' })), 'Up');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'ArrowDown' })), 'Down');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'ArrowLeft' })), 'Left');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'ArrowRight' })), 'Right');
    assert.equal(eventToShortcut(mockKeyEvent({ key: '/' })), '/');
    assert.equal(eventToShortcut(mockKeyEvent({ key: '-' })), '-');
    assert.equal(eventToShortcut(mockKeyEvent({ key: '=' })), '=');

    assert.equal(eventToShortcut(mockKeyEvent({ key: ' ', ctrlKey: true })), 'Ctrl+Space');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Escape', shiftKey: true })), 'Shift+Esc');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'ArrowUp', ctrlKey: true })), 'Ctrl+Up');
  });

  it('should handle unmapped multi-character keys without modifying their case', () => {
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Enter' })), 'Enter');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Tab' })), 'Tab');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Backspace' })), 'Backspace');
    assert.equal(eventToShortcut(mockKeyEvent({ key: 'F12' })), 'F12');

    assert.equal(eventToShortcut(mockKeyEvent({ key: 'Enter', ctrlKey: true })), 'Ctrl+Enter');
    assert.equal(
      eventToShortcut(mockKeyEvent({ key: 'F1', ctrlKey: true, shiftKey: true })),
      'Ctrl+Shift+F1'
    );
  });
});
