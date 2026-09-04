import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FileSystemItem } from './types';
import { buildSearchRegex, searchFilesRecursively } from './utils';

// Baseline implementation for comparison
function oldSearchFilesRecursively(items: FileSystemItem[], regex: RegExp): Array<{ path: string, line: number, text: string, colStart: number, colEnd: number }> {
  const list: Array<{ path: string, line: number, text: string, colStart: number, colEnd: number }> = [];
  for (const item of items) {
    if (item.isFolder && item.children) {
      list.push(...oldSearchFilesRecursively(item.children, regex));
    } else if (!item.isFolder && item.content) {
      const lines = item.content.split('\n');
      lines.forEach((lineText, idx) => {
        regex.lastIndex = 0;
        const match = regex.exec(lineText);
        if (match) {
          list.push({ path: item.path, line: idx + 1, text: lineText.trim(), colStart: match.index, colEnd: match.index + match[0].length });
        }
      });
    }
  }
  return list;
}

function generateMockFiles(fileCount: number, linesPerFile: number): FileSystemItem[] {
  const files: FileSystemItem[] = [];
  for (let f = 0; f < fileCount; f++) {
    const lines: string[] = [];
    const hasTarget = f % 20 === 0; // 5% of files match
    for (let l = 0; l < linesPerFile; l++) {
      if (hasTarget && l === 250) {
        lines.push(`const searchTarget = "found_me_${f}"; // match line`);
      } else {
        lines.push(`const variable_${l} = "some regular code line that goes on for a bit ${l}";`);
      }
    }
    files.push({
      name: `file_${f}.ts`,
      path: `src/components/file_${f}.ts`,
      isFolder: false,
      content: lines.join('\n')
    });
  }
  return [
    {
      name: 'src',
      path: 'src',
      isFolder: true,
      children: files
    }
  ];
}

describe('buildSearchRegex', () => {
  it('returns null for empty query', () => {
    assert.equal(buildSearchRegex(''), null);
  });

  it('escapes special regex characters when useRegex is false', () => {
    const regex = buildSearchRegex('foo.bar(test)?');
    assert.ok(regex);
    assert.equal(regex.test('foo.bar(test)?'), true);
    assert.equal(regex.test('fooXbar(test)?'), false);
  });

  it('handles regex query when useRegex is true', () => {
    const regex = buildSearchRegex('foo\\d+', { useRegex: true });
    assert.ok(regex);
    assert.equal(regex.test('foo123'), true);
    assert.equal(regex.test('fooABC'), false);
  });

  it('handles whole word search', () => {
    const regex = buildSearchRegex('cat', { wholeWord: true });
    assert.ok(regex);
    assert.equal(regex.test('the cat sat'), true);
    assert.equal(regex.test('concatenate'), false);
  });

  it('returns null for invalid regex string when useRegex is true', () => {
    const regex = buildSearchRegex('[invalid(', { useRegex: true });
    assert.equal(regex, null);
  });
});

describe('searchFilesRecursively', () => {
  it('should return identical results as old implementation across nested tree', () => {
    const mockTree = generateMockFiles(30, 100);
    const queryRegex = buildSearchRegex('searchTarget');
    assert.ok(queryRegex);

    const oldResults = oldSearchFilesRecursively(mockTree, queryRegex);
    const newResults = searchFilesRecursively(mockTree, queryRegex);

    assert.deepEqual(newResults, oldResults);
  });

  it('handles line anchors (^ and $) correctly in regex searches', () => {
    const tree: FileSystemItem[] = [
      {
        name: 'app.ts',
        path: 'app.ts',
        isFolder: false,
        content: '// first line\nimport { foo } from "bar";\nconst val = 1;'
      }
    ];
    const regex = buildSearchRegex('^import', { useRegex: true });
    assert.ok(regex);

    const oldResults = oldSearchFilesRecursively(tree, regex);
    const newResults = searchFilesRecursively(tree, regex);

    assert.equal(newResults.length, 1);
    assert.equal(newResults[0].line, 2);
    assert.deepEqual(newResults, oldResults);
  });

  it('handles empty content and items without errors', () => {
    const emptyTree: FileSystemItem[] = [
      { name: 'empty.txt', path: 'empty.txt', isFolder: false, content: '' },
      { name: 'folder', path: 'folder', isFolder: true, children: [] }
    ];
    const regex = buildSearchRegex('test');
    assert.ok(regex);
    const results = searchFilesRecursively(emptyTree, regex);
    assert.deepEqual(results, []);
  });

  it('measures search performance gain', () => {
    const fileCount = 100;
    const linesPerFile = 500; // 50,000 lines total
    const mockTree = generateMockFiles(fileCount, linesPerFile);
    const queryRegex = buildSearchRegex('searchTarget');
    assert.ok(queryRegex);
    const iterations = 50;

    // Warmup
    oldSearchFilesRecursively(mockTree, queryRegex);
    searchFilesRecursively(mockTree, queryRegex);

    // Benchmark Old
    const startOld = performance.now();
    for (let i = 0; i < iterations; i++) {
      oldSearchFilesRecursively(mockTree, queryRegex);
    }
    const durationOld = performance.now() - startOld;

    // Benchmark New
    const startNew = performance.now();
    for (let i = 0; i < iterations; i++) {
      searchFilesRecursively(mockTree, queryRegex);
    }
    const durationNew = performance.now() - startNew;

    console.log(`\n==================================================`);
    console.log(`SEARCH BENCHMARK RESULTS (50 iterations over ${fileCount * linesPerFile} lines across ${fileCount} files):`);
    console.log(`Old Implementation : ${durationOld.toFixed(2)} ms (${(durationOld / iterations).toFixed(2)} ms/search)`);
    console.log(`New Implementation : ${durationNew.toFixed(2)} ms (${(durationNew / iterations).toFixed(2)} ms/search)`);
    const speedup = (durationOld / durationNew).toFixed(2);
    console.log(`Speedup            : ${speedup}x faster (${(((durationOld - durationNew) / durationOld) * 100).toFixed(1)}% time saved)`);
    console.log(`==================================================\n`);

    // Verify results are consistent
    const resultsOld = oldSearchFilesRecursively(mockTree, queryRegex);
    const resultsNew = searchFilesRecursively(mockTree, queryRegex);
    assert.deepEqual(resultsNew, resultsOld);
  });
});
