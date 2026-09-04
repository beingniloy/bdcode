import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper function simulating sequential save logic (current implementation)
async function sequentialSaveAll(
  openTabs: Array<{ isDirty: boolean; path: string }>,
  findContent: (path: string) => string | undefined,
  writeFile: (path: string, content: string) => Promise<void>
) {
  for (const tab of openTabs) {
    if (tab.isDirty && tab.path !== 'welcome' && !tab.path.startsWith('docs/')) {
      const content = findContent(tab.path);
      if (content !== undefined) {
        await writeFile(tab.path, content);
      }
    }
  }
}

// Helper function simulating parallel save logic (optimized implementation)
async function parallelSaveAll(
  openTabs: Array<{ isDirty: boolean; path: string }>,
  findContent: (path: string) => string | undefined,
  writeFile: (path: string, content: string) => Promise<void>
) {
  const savePromises: Promise<void>[] = [];
  for (const tab of openTabs) {
    if (tab.isDirty && tab.path !== 'welcome' && !tab.path.startsWith('docs/')) {
      const content = findContent(tab.path);
      if (content !== undefined) {
        savePromises.push(writeFile(tab.path, content));
      }
    }
  }
  await Promise.all(savePromises);
}

describe('handleSaveAll Performance & Logic Benchmark', () => {
  it('should correctly save all dirty files in parallel', async () => {
    const savedFiles: Record<string, string> = {};
    const tabs = [
      { isDirty: true, path: 'file1.js' },
      { isDirty: false, path: 'file2.js' },
      { isDirty: true, path: 'welcome' },
      { isDirty: true, path: 'docs/readme.md' },
      { isDirty: true, path: 'file3.js' },
    ];

    const filesContent: Record<string, string> = {
      'file1.js': 'console.log(1);',
      'file2.js': 'console.log(2);',
      'file3.js': 'console.log(3);',
    };

    const mockWriteFile = async (path: string, content: string) => {
      savedFiles[path] = content;
    };

    await parallelSaveAll(tabs, (path) => filesContent[path], mockWriteFile);

    assert.deepEqual(savedFiles, {
      'file1.js': 'console.log(1);',
      'file3.js': 'console.log(3);',
    });
  });

  it('benchmark sequential vs parallel file writes', async () => {
    const fileCount = 20;
    const writeDelayMs = 10; // Simulate 10ms I/O latency per write call

    const mockWriteFileWithDelay = async (_path: string, _content: string) => {
      await new Promise(resolve => setTimeout(resolve, writeDelayMs));
    };

    const tabs = Array.from({ length: fileCount }, (_, i) => ({
      isDirty: true,
      path: `file_${i}.txt`,
    }));

    const mockFindContent = (path: string) => `content for ${path}`;

    // Measure Sequential
    const startSequential = performance.now();
    await sequentialSaveAll(tabs, mockFindContent, mockWriteFileWithDelay);
    const durationSequential = performance.now() - startSequential;

    // Measure Parallel
    const startParallel = performance.now();
    await parallelSaveAll(tabs, mockFindContent, mockWriteFileWithDelay);
    const durationParallel = performance.now() - startParallel;

    console.log(`[Benchmark] ${fileCount} files with ${writeDelayMs}ms delay each:`);
    console.log(`  Sequential duration: ${durationSequential.toFixed(2)} ms`);
    console.log(`  Parallel duration:   ${durationParallel.toFixed(2)} ms`);
    console.log(`  Speedup:             ${(durationSequential / durationParallel).toFixed(2)}x`);

    // Parallel should be significantly faster (e.g., ~10-20ms total vs ~200ms total)
    assert.ok(
      durationParallel < durationSequential,
      `Parallel duration (${durationParallel}ms) should be faster than sequential duration (${durationSequential}ms)`
    );
  });
});
