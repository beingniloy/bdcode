import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function getRealPath(targetPath: string): string {
  try {
    return fs.realpathSync(targetPath);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const parent = path.dirname(targetPath);
      if (parent === targetPath) {
        return targetPath;
      }
      const realParent = getRealPath(parent);
      return path.join(realParent, path.basename(targetPath));
    }
    throw err;
  }
}

function safePath(relPath: string, workspaceRoot: string): string {
  const fullPath = path.isAbsolute(relPath) ? relPath : path.join(workspaceRoot, relPath);
  const resolved = getRealPath(fullPath);
  const rootResolved = getRealPath(workspaceRoot);
  const rootWithSep = rootResolved.endsWith(path.sep) ? rootResolved : rootResolved + path.sep;
  if (!resolved.startsWith(rootWithSep) && resolved !== rootResolved) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

describe('safePath with symlink resolution', () => {
  let tmpDir: string;
  let workspaceRoot: string;
  let outsideDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bdcode-safepath-test-'));
    workspaceRoot = path.join(tmpDir, 'workspace');
    outsideDir = path.join(tmpDir, 'outside');

    fs.mkdirSync(workspaceRoot, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });

    fs.mkdirSync(path.join(workspaceRoot, 'subdir'), { recursive: true });
    fs.writeFileSync(path.join(workspaceRoot, 'file1.txt'), 'workspace file 1');
    fs.writeFileSync(path.join(workspaceRoot, 'subdir', 'file2.txt'), 'workspace file 2');

    fs.writeFileSync(path.join(outsideDir, 'secret.txt'), 'outside secret data');

    // Create symlinks (if platform supports symlinks)
    try {
      fs.symlinkSync(path.join(outsideDir, 'secret.txt'), path.join(workspaceRoot, 'symlink_file.txt'));
      fs.symlinkSync(outsideDir, path.join(workspaceRoot, 'symlink_dir'));
      fs.symlinkSync(path.join(workspaceRoot, 'subdir'), path.join(workspaceRoot, 'symlink_inside_dir'));
    } catch (e) {
      // Symlinks might require elevated privileges on Windows, handle gracefully
    }
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('allows access to valid files inside the workspace root', () => {
    const res1 = safePath('file1.txt', workspaceRoot);
    assert.ok(res1.endsWith('file1.txt'));

    const res2 = safePath('subdir/file2.txt', workspaceRoot);
    assert.ok(res2.endsWith(path.join('subdir', 'file2.txt')));
  });

  it('allows creating non-existent files inside a valid workspace directory', () => {
    const res = safePath('subdir/new_file.txt', workspaceRoot);
    assert.ok(res.endsWith(path.join('subdir', 'new_file.txt')));
  });

  it('blocks path traversal using relative parent directories (..)', () => {
    assert.throws(
      () => safePath('../outside/secret.txt', workspaceRoot),
      /Path traversal detected/
    );
  });

  it('blocks path traversal using absolute paths outside workspace', () => {
    assert.throws(
      () => safePath(path.join(outsideDir, 'secret.txt'), workspaceRoot),
      /Path traversal detected/
    );
  });

  it('blocks path traversal through symbolic links pointing to files outside workspace', () => {
    const symlinkPath = path.join(workspaceRoot, 'symlink_file.txt');
    if (fs.existsSync(symlinkPath)) {
      assert.throws(
        () => safePath('symlink_file.txt', workspaceRoot),
        /Path traversal detected/
      );
    }
  });

  it('blocks path traversal through symbolic links pointing to directories outside workspace', () => {
    const symlinkDir = path.join(workspaceRoot, 'symlink_dir');
    if (fs.existsSync(symlinkDir)) {
      assert.throws(
        () => safePath('symlink_dir/secret.txt', workspaceRoot),
        /Path traversal detected/
      );

      // Also block non-existent target files inside outside symlinked directory
      assert.throws(
        () => safePath('symlink_dir/non_existent.txt', workspaceRoot),
        /Path traversal detected/
      );
    }
  });

  it('allows symbolic links pointing to directories inside workspace', () => {
    const symlinkInside = path.join(workspaceRoot, 'symlink_inside_dir');
    if (fs.existsSync(symlinkInside)) {
      const res = safePath('symlink_inside_dir/file2.txt', workspaceRoot);
      assert.ok(res.endsWith(path.join('subdir', 'file2.txt')));
    }
  });
});
