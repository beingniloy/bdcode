## 2026-07-17 - [Static Analysis Scan Cache]
**Learning:** Workspace static analysis recursively crawls all project files, performing regex and string scanning for warnings (e.g. empty blocks, `console.log`, TODO/FIXME). When typing, React's state is updated and the entire file tree is re-scanned repeatedly on every keystroke, which causes significant performance lag and blocking UI in large workspaces.
**Action:** Use a `WeakMap` to cache computed static analysis results per-item based on the immutable `FileSystemItem` object references. When React does an immutable update, unchanged files retain their reference and bypass re-scanning by using the cache, while only modified files (with new references) are re-evaluated. Old references are automatically garbage collected.

## 2026-07-18 - [Avoid Expensive Blob Instantiations in Loops]
**Learning:** Instantiating heavy modern Web API objects like `Blob` inside hot traversal loops to calculate the UTF-8 byte length of raw string content introduces massive GC and CPU performance overheads.
**Action:** Avoid calling `new Blob([item.content]).size` inside loops. Instead, initialize a single `TextEncoder` instance outside the loop/recursion or at the module level, and call `encoder.encode(content).length` to calculate raw byte sizes with substantially less allocation overhead (~1.93x faster performance and significantly improved memory/GC efficiency).

## 2026-07-19 - [File-level Regex Pre-filtering & Stateless Line Matching]
**Learning:** Performing `split('\n')` and resetting `regex.lastIndex = 0` on every single line of every file in the project during recursive file search causes massive CPU overhead and closure allocation.
**Action:** Pre-check full file content with `regex.test(item.content)` to skip `split('\n')` for non-matching files. In addition, derive a non-global `lineRegex` once outside the loop so `.exec()` calls on individual lines are stateless and do not require resetting `lastIndex` per line (~4.7x speedup, ~79% time saved).
