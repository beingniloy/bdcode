import { eventToShortcut } from './utils';

describe('eventToShortcut', () => {
  // 1. Single character keys without modifiers
  it('should normalise single lowercase character keys to uppercase', () => {
    const e = { key: 's' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('S');
  });

  it('should preserve single uppercase character keys as uppercase', () => {
    const e = { key: 'S' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('S');
  });

  it('should handle numeric keys correctly', () => {
    const e = { key: '5' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('5');
  });

  // 2. Single modifier combinations
  it('should add Ctrl prefix when ctrlKey is true', () => {
    const e = { ctrlKey: true, key: 's' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('Ctrl+S');
  });

  it('should add Ctrl prefix when metaKey is true (macOS equivalent)', () => {
    const e = { metaKey: true, key: 's' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('Ctrl+S');
  });

  it('should add Shift prefix when shiftKey is true', () => {
    const e = { shiftKey: true, key: 's' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('Shift+S');
  });

  it('should add Alt prefix when altKey is true', () => {
    const e = { altKey: true, key: 's' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('Alt+S');
  });

  // 3. Combined modifier combinations
  it('should handle Ctrl+Shift combinations', () => {
    const e = { ctrlKey: true, shiftKey: true, key: 's' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('Ctrl+Shift+S');
  });

  it('should handle Ctrl+Alt combinations', () => {
    const e = { ctrlKey: true, altKey: true, key: 'a' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('Ctrl+Alt+A');
  });

  it('should handle Ctrl+Shift+Alt combinations in the correct order', () => {
    const e = { ctrlKey: true, shiftKey: true, altKey: true, key: 'p' } as KeyboardEvent;
    expect(eventToShortcut(e)).toBe('Ctrl+Shift+Alt+P');
  });

  // 4. Mapped keys from KEY_SHORTCUT_MAP
  it('should map specific punctuation keys', () => {
    expect(eventToShortcut({ key: '`' } as KeyboardEvent)).toBe('`');
    expect(eventToShortcut({ key: ',' } as KeyboardEvent)).toBe(',');
    expect(eventToShortcut({ key: '.' } as KeyboardEvent)).toBe('.');
    expect(eventToShortcut({ key: '/' } as KeyboardEvent)).toBe('/');
    expect(eventToShortcut({ key: ';' } as KeyboardEvent)).toBe(';');
    expect(eventToShortcut({ key: "'" } as KeyboardEvent)).toBe("'");
    expect(eventToShortcut({ key: '[' } as KeyboardEvent)).toBe('[');
    expect(eventToShortcut({ key: ']' } as KeyboardEvent)).toBe(']');
    expect(eventToShortcut({ key: '\\' } as KeyboardEvent)).toBe('\\');
    expect(eventToShortcut({ key: '-' } as KeyboardEvent)).toBe('-');
    expect(eventToShortcut({ key: '=' } as KeyboardEvent)).toBe('=');
  });

  it('should map Space and Escape keys', () => {
    expect(eventToShortcut({ key: ' ' } as KeyboardEvent)).toBe('Space');
    expect(eventToShortcut({ key: 'Escape' } as KeyboardEvent)).toBe('Esc');
  });

  it('should map Arrow keys', () => {
    expect(eventToShortcut({ key: 'ArrowUp' } as KeyboardEvent)).toBe('Up');
    expect(eventToShortcut({ key: 'ArrowDown' } as KeyboardEvent)).toBe('Down');
    expect(eventToShortcut({ key: 'ArrowLeft' } as KeyboardEvent)).toBe('Left');
    expect(eventToShortcut({ key: 'ArrowRight' } as KeyboardEvent)).toBe('Right');
  });

  // 5. Modifier-only key presses
  it('should return empty string for modifier-only keys', () => {
    expect(eventToShortcut({ key: 'Control' } as KeyboardEvent)).toBe('');
    expect(eventToShortcut({ key: 'Shift' } as KeyboardEvent)).toBe('');
    expect(eventToShortcut({ key: 'Alt' } as KeyboardEvent)).toBe('');
    expect(eventToShortcut({ key: 'Meta' } as KeyboardEvent)).toBe('');
  });

  // 6. Multi-character keys not in the map
  it('should handle multi-character keys not present in the map', () => {
    expect(eventToShortcut({ key: 'Enter' } as KeyboardEvent)).toBe('Enter');
    expect(eventToShortcut({ key: 'Backspace' } as KeyboardEvent)).toBe('Backspace');
    expect(eventToShortcut({ key: 'F11' } as KeyboardEvent)).toBe('F11');
    expect(eventToShortcut({ ctrlKey: true, key: 'Tab' } as KeyboardEvent)).toBe('Ctrl+Tab');
  });
});
