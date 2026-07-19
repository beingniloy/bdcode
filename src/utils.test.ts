import test from 'node:test';
import assert from 'node:assert';
import { getFileIconColor } from './utils.ts';

test('getFileIconColor - Standard Extensions', () => {
  assert.strictEqual(getFileIconColor('index.html'), '#e34f26');
  assert.strictEqual(getFileIconColor('style.css'), '#0284c7');
  assert.strictEqual(getFileIconColor('app.js'), '#eab308');
  assert.strictEqual(getFileIconColor('api.php'), '#8b5cf6');
  assert.strictEqual(getFileIconColor('config.json'), '#f97316');
  assert.strictEqual(getFileIconColor('README.md'), '#3b82f6');
  assert.strictEqual(getFileIconColor('image.png'), '#10b981');
  assert.strictEqual(getFileIconColor('photo.jpg'), '#10b981');
  assert.strictEqual(getFileIconColor('banner.jpeg'), '#10b981');
});

test('getFileIconColor - Case Insensitivity', () => {
  assert.strictEqual(getFileIconColor('index.HTML'), '#e34f26');
  assert.strictEqual(getFileIconColor('style.CSS'), '#0284c7');
  assert.strictEqual(getFileIconColor('APP.JS'), '#eab308');
  assert.strictEqual(getFileIconColor('api.Php'), '#8b5cf6');
  assert.strictEqual(getFileIconColor('config.JSON'), '#f97316');
  assert.strictEqual(getFileIconColor('README.MD'), '#3b82f6');
  assert.strictEqual(getFileIconColor('IMAGE.PNG'), '#10b981');
});

test('getFileIconColor - Multiple Dots', () => {
  assert.strictEqual(getFileIconColor('test.spec.js'), '#eab308');
  assert.strictEqual(getFileIconColor('my.config.json'), '#f97316');
  assert.strictEqual(getFileIconColor('archive.tar.gz'), 'var(--text-secondary)');
});

test('getFileIconColor - No Extension', () => {
  assert.strictEqual(getFileIconColor('LICENSE'), 'var(--text-secondary)');
  assert.strictEqual(getFileIconColor('Dockerfile'), 'var(--text-secondary)');
  assert.strictEqual(getFileIconColor('Makefile'), 'var(--text-secondary)');
});

test('getFileIconColor - Edge cases: leading, trailing dots, empty/whitespace inputs', () => {
  // Dotfiles with no additional dot should be treated as no extension (e.g. .gitignore)
  assert.strictEqual(getFileIconColor('.gitignore'), 'var(--text-secondary)');
  assert.strictEqual(getFileIconColor('.env'), 'var(--text-secondary)');

  // Dotfiles with extension should match the extension
  assert.strictEqual(getFileIconColor('.eslintrc.json'), '#f97316');

  // Trailing dot
  assert.strictEqual(getFileIconColor('filename.'), 'var(--text-secondary)');

  // Empty inputs or spaces
  assert.strictEqual(getFileIconColor(''), 'var(--text-secondary)');
  assert.strictEqual(getFileIconColor('   '), 'var(--text-secondary)');
  assert.strictEqual(getFileIconColor(' . '), 'var(--text-secondary)');
});

test('getFileIconColor - Unknown Extensions', () => {
  assert.strictEqual(getFileIconColor('app.ts'), 'var(--text-secondary)');
  assert.strictEqual(getFileIconColor('style.scss'), 'var(--text-secondary)');
  assert.strictEqual(getFileIconColor('document.pdf'), 'var(--text-secondary)');
});
