import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Replace, GitBranch, Play, Grid, Settings, RefreshCw,
  ArrowUp, ArrowDown, Download, Check, ChevronRight, Code, Loader2,
  CaseSensitive, WholeWord, Regex, ChevronDown
} from 'lucide-react';
import { FileSystemItem } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useLayout } from '../contexts/LayoutContext';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useModal } from '../contexts/ModalContext';
import { showAlert } from '../hooks/useDialog';
import { useTranslation } from '../hooks/useTranslation';

export default React.memo(function SidebarPanels() {
  const { language, settings, setSettings, theme, setTheme } = useSettings();
  const t = useTranslation('sidebarPanels');
  const { activeSidebarTab } = useLayout();
  const { files, setFiles, activeFile, handleFileSelect, handleRun, handleCreateVirtualFile, setTerminalLines } = useFileSystem();
  const { setSettingsModalOpen } = useModal();

  // ==========================================
  // 1. GLOBAL SEARCH STATE
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ path: string, line: number, text: string, colStart: number, colEnd: number }>>([]);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [replaceMode, setReplaceMode] = useState(false);

  const buildSearchRegex = (query: string): RegExp | null => {
    if (!query) return null;
    try {
      let pattern = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const flags = caseSensitive ? 'g' : 'gi';
      return new RegExp(pattern, flags);
    } catch {
      return null;
    }
  };

  const searchFilesRecursively = (items: FileSystemItem[], regex: RegExp): Array<{ path: string, line: number, text: string, colStart: number, colEnd: number }> => {
    const list: Array<{ path: string, line: number, text: string, colStart: number, colEnd: number }> = [];
    for (const item of items) {
      if (item.isFolder && item.children) {
        list.push(...searchFilesRecursively(item.children, regex));
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
  };

  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      const doSearch = async () => {
        if (window.electronAPI?.searchFiles) {
          // Desktop mode: disk-based search
          const raw = await window.electronAPI.searchFiles({ query: searchQuery, caseSensitive, wholeWord, useRegex });
          setSearchResults(raw);
          const grouped: Record<string, boolean> = {};
          raw.forEach(r => { grouped[r.path] = true; });
          setExpandedFiles(grouped);
        } else {
          // Web mode: in-memory search
          const regex = buildSearchRegex(searchQuery);
          if (!regex) { setSearchResults([]); return; }
          const results = searchFilesRecursively(files, regex);
          setSearchResults(results);
          const grouped: Record<string, boolean> = {};
          results.forEach(r => { grouped[r.path] = true; });
          setExpandedFiles(grouped);
        }
      };
      doSearch();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, files, caseSensitive, wholeWord, useRegex]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, Array<{ path: string, line: number, text: string, colStart: number, colEnd: number }>> = {};
    for (const r of searchResults) {
      if (!groups[r.path]) groups[r.path] = [];
      groups[r.path].push(r);
    }
    return groups;
  }, [searchResults]);

  const handleSearchClick = (path: string, line: number) => {
    handleFileSelect(path);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bdcode-goto-line', { detail: { line } }));
    }, 100);
  };

  const highlightMatch = (text: string, colStart: number, colEnd: number) => {
    return (
      <span>
        <span>{text.substring(0, colStart)}</span>
        <span style={{ background: 'rgba(234, 179, 8, 0.3)', color: 'var(--text-primary)', borderRadius: '2px', padding: '0 1px' }}>{text.substring(colStart, colEnd)}</span>
        <span>{text.substring(colEnd)}</span>
      </span>
    );
  };

  const handleReplaceAll = async () => {
    if (!searchQuery || searchResults.length === 0) return;

    if (window.electronAPI?.replaceInFiles) {
      // Desktop mode: disk-based replace
      const res = await window.electronAPI.replaceInFiles({ query: searchQuery, replacement: replaceQuery, caseSensitive, wholeWord, useRegex });
      setTerminalLines(prev => [...prev, { text: `[Replace]: Replaced ${res.totalReplacements} occurrence(s) of '${searchQuery}' with '${replaceQuery}'`, type: 'output' }]);
      setSearchQuery('');
      setReplaceQuery('');
      // Re-trigger search
      setSearchResults([]);
    } else {
      // Web mode: in-memory replace
      const regex = buildSearchRegex(searchQuery);
      if (!regex) return;
      let totalReplacements = 0;

      const updateFiles = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.isFolder && item.children) {
            return { ...item, children: updateFiles(item.children) };
          }
          if (!item.isFolder && item.content) {
            regex.lastIndex = 0;
            if (regex.test(item.content)) {
              regex.lastIndex = 0;
              const matches = item.content.match(regex);
              totalReplacements += matches ? matches.length : 0;
              regex.lastIndex = 0;
              const newContent = item.content.replace(regex, replaceQuery);
              if (window.electronAPI) {
                window.electronAPI.writeFile(item.path, newContent).catch(() => {});
              }
              return { ...item, content: newContent, modified: true };
            }
          }
          return item;
        });
      };
      setFiles(prev => updateFiles(prev));
      setTerminalLines(prev => [...prev, { text: `[Replace]: Replaced ${totalReplacements} occurrence(s) of '${searchQuery}' with '${replaceQuery}'`, type: 'output' }]);
      setSearchQuery('');
      setReplaceQuery('');
    }
  };

  const toggleFileExpand = (path: string) => {
    setExpandedFiles(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // ==========================================
  // 2. GIT / SOURCE CONTROL STATE
  // ==========================================
  const [gitState, setGitState] = useState<{ isRepo: boolean, branch: string, files: Array<{ file: string, status: string }> }>({
    isRepo: false, branch: 'main', files: []
  });
  const [commitMsg, setCommitMsg] = useState('');
  const [gitLoading, setGitLoading] = useState(false);

  const fetchGitStatus = async () => {
    if (window.electronAPI) {
      setGitLoading(true);
      try {
        const status = await window.electronAPI.gitStatus();
        setGitState(status);
      } catch (e) { console.error('Error fetching git status:', e); }
      finally { setGitLoading(false); }
    } else {
      setGitState({ isRepo: false, branch: '', files: [] });
    }
  };

  useEffect(() => {
    if (activeSidebarTab === 'source_control') fetchGitStatus();
  }, [activeSidebarTab]);

  const handleGitInit = async () => {
    if (window.electronAPI) {
      setGitLoading(true);
      await window.electronAPI.gitCmd('init');
      await fetchGitStatus();
      setTerminalLines(prev => [...prev, { text: '[Git]: Initialized empty Git repository.', type: 'output' }]);
    } else { showAlert('Git init requires the desktop app.'); }
  };

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    if (window.electronAPI) {
      setGitLoading(true);
      const res = await window.electronAPI.gitCommit(commitMsg.trim());
      setTerminalLines(prev => [
        ...prev,
        { text: `git commit -m "${commitMsg.trim()}"`, type: 'input' },
        { text: res.stdout || res.stderr || (res.success ? 'Commit successful.' : 'Commit failed.'), type: 'output' }
      ]);
      setCommitMsg('');
      await fetchGitStatus();
    } else {
      showAlert(`Git operations require the desktop app. Commit message: "${commitMsg}"`);
      setCommitMsg('');
      setGitState(prev => ({ ...prev, files: [] }));
    }
  };

  const handlePush = async () => {
    if (window.electronAPI) {
      setGitLoading(true);
      setTerminalLines(prev => [...prev, { text: `git push origin ${gitState.branch}`, type: 'input' }]);
      const res = await window.electronAPI.gitCmd('push');
      setTerminalLines(prev => [...prev, { text: res.stdout || res.stderr || 'Already up-to-date.', type: 'output' }]);
      setGitLoading(false);
    } else { showAlert('Git push requires the desktop app.'); }
  };

  const handlePull = async () => {
    if (window.electronAPI) {
      setGitLoading(true);
      setTerminalLines(prev => [...prev, { text: `git pull origin ${gitState.branch}`, type: 'input' }]);
      const res = await window.electronAPI.gitCmd('pull');
      setTerminalLines(prev => [...prev, { text: res.stdout || res.stderr || 'Already up-to-date.', type: 'output' }]);
      setGitLoading(false);
    } else { showAlert('Git pull requires the desktop app.'); }
  };

  // ==========================================
  // 3. EXTENSIONS STATE
  // ==========================================
  const [installedExtensions, setInstalledExtensions] = useState([
    { id: 'bengali-spell', name: 'Bangla Code Spellchecker', desc: 'কোড এডিটরে বাংলা বানান সংশোধক এক্সটেনশন।', enabled: true, logo: Grid }
  ]);
  const [availableExtensions, setAvailableExtensions] = useState([
    { id: 'php-run', name: 'PHP Compiler Runner', desc: 'এডিটর থেকেই PHP সার্ভার ও কোড সচল করা।', installing: false, installed: false, logo: Play },
    { id: 'cpp-pack', name: 'C/C++ Extension Pack', desc: 'সি/সি++ কোডিং এবং সরাসরি কম্পাইল সাপোর্ট।', installing: false, installed: false, logo: Code },
    { id: 'sql-db', name: 'SQL Database Explorer', desc: 'লোকাল ডাটাবেস 브라우저 ও কুয়েরি রানার প্যানেল।', installing: false, installed: false, logo: Settings }
  ]);

  const handleInstallExt = (id: string) => {
    setAvailableExtensions(prev => prev.map(ext => ext.id === id ? { ...ext, installing: true } : ext));
    setTimeout(() => {
      setAvailableExtensions(prev => prev.map(ext => ext.id === id ? { ...ext, installing: false, installed: true } : ext));
      const extItem = availableExtensions.find(ext => ext.id === id);
      if (extItem) {
        setInstalledExtensions(prev => [...prev, { id: extItem.id, name: extItem.name, desc: extItem.desc, enabled: true, logo: extItem.logo }]);
      }
    }, 1800);
  };

  // ==========================================
  // 4. DOCUMENTATION HELP MANUALS
  // ==========================================
  const docManuals = [
    {
      id: 'coding-guide',
      title: language === 'bn' ? '১. বাংলা কোডিং নির্দেশিকা' : '1. Bengali Coding Guidelines',
      content: `# বাংলা কোডিং নির্দেশিকা (Bengali Coding Guidelines)\\n\\nবাংলাদেশ সরকারের অফিসিয়াল তথ্য প্রযুক্তি প্রকল্পে বাংলা লেখার ক্ষেত্রে নিম্নলিখিত নিয়মাবলী অনুসরণ করতে হবে:\\n\\n## অক্ষর এনকোডিং:\\n- সর্বদা **UTF-8** এনকোডিং ব্যবহার করুন।\\n- ফন্ট পরিবার হিসেবে **'Noto Sans Bengali'** অগ্রাধিকার পাবে।\\n\\n## ডাটাবেস সংযোগ:\\n- ডাটাসমূহ ইউনিকোড এনকোডেড সংরক্ষণে collation \\\\\\"utf8mb4_unicode_ci\\\\\\" সেট করুন।`
    },
    {
      id: 'security-guide',
      title: language === 'bn' ? '২. সরকারি নিরাপত্তা নির্দেশিকা' : '2. Government Security Directives',
      content: `# সরকারি নিরাপত্তা নির্দেশিকা (Government Security Guidelines)\\n\\nসাইবার নিরাপত্তা নিশ্চিতে কোড লেখার সময়ে নিচের সতর্কতা অবলম্বন করুন:\\n\\n## চেক লিস্ট:\\n- ফর্ম ইনপুটে অবশ্যই স্যানিটাইজেশন নিশ্চিত করবেন। SQL injection এড়াতে Prepared Statements ব্যবহার বাধ্যতামূলক।\\n- লোকাল পাসওয়ার্ড ও এপিআই কী কোনো অবস্থাতেই পাবলিক গিটহাবে পুশ করবেন না。`
    },
    {
      id: 'publish-guide',
      title: language === 'bn' ? '৩. ক্লাউড ডিপ্লয়মেন্ট গাইড' : '3. Cloud Deployment Directives',
      content: `# ক্লাউড ডিপ্লয়মেন্ট নির্দেশিকা (Cloud Deployment Guidelines)\\n\\nপ্রকল্প সফলভাবে তৈরি হলে সরকারি সার্ভারে প্রকাশ করার ধাপসমূহ:\\n\\n১. টুলবার থেকে **\\"প্রকল্প প্রকাশ করুন\\"** বাটনে ক্লিক করুন।\\n২. SSL কানেকশন সিকিউর হলে স্বয়ংক্রিয়ভাবে প্যাকেজ জেনারেট হবে。\\n৩. সফল হলে ডিপ্লয়মেন্ট লিংক প্রদর্শন করা হবে।`
    }
  ];

  const handleDocOpen = (id: string) => {
    const doc = docManuals.find(d => d.id === id);
    if (doc) handleCreateVirtualFile(`docs/${doc.id}.md`, `${doc.id}.md`, doc.content);
  };

  // ==========================================
  // 5. FEEDBACK (uses GitHub Issues link)
  // ==========================================

  return (
    <div role="complementary" aria-label={t('searchTitle')} style={{
      width: '100%', height: '100%', background: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column', userSelect: 'none', overflowY: 'auto'
    }} className="sidebar-panels-wrapper">

      {/* SEARCH TAB */}
      {activeSidebarTab === 'search' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={headerStyle}>{t('searchTitle')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
              <input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} aria-label={t('searchPlaceholder')} style={inputSearchStyle} />
            </div>
            <div style={{ display: 'flex', gap: '2px', padding: '2px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <button onClick={() => setCaseSensitive(!caseSensitive)} title="Match Case" style={{ ...toggleBtnStyle, background: caseSensitive ? 'var(--gov-green)' : 'transparent', color: caseSensitive ? '#fff' : 'var(--text-muted)' }}><CaseSensitive size={13} /></button>
              <button onClick={() => setWholeWord(!wholeWord)} title="Match Whole Word" style={{ ...toggleBtnStyle, background: wholeWord ? 'var(--gov-green)' : 'transparent', color: wholeWord ? '#fff' : 'var(--text-muted)' }}><WholeWord size={13} /></button>
              <button onClick={() => setUseRegex(!useRegex)} title="Use Regular Expression" style={{ ...toggleBtnStyle, background: useRegex ? 'var(--gov-green)' : 'transparent', color: useRegex ? '#fff' : 'var(--text-muted)' }}><Regex size={13} /></button>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Replace size={14} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
              <input type="text" placeholder={t('replacePlaceholder')} value={replaceQuery} onChange={e => setReplaceQuery(e.target.value)} aria-label={t('replacePlaceholder')} style={inputSearchStyle} />
              {searchQuery && searchResults.length > 0 && <button onClick={handleReplaceAll} aria-label={t('replaceAllLabel')} style={{ position: 'absolute', right: '6px', fontSize: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '2px 4px', borderRadius: '2px', fontWeight: 'bold' }}>All</button>}
            </div>
          </div>
          {searchQuery && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 0' }}>
              {searchResults.length > 0 ? `${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'} in ${Object.keys(groupedResults).length} ${Object.keys(groupedResults).length === 1 ? 'file' : 'files'}` : ''}
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {Object.entries(groupedResults).map(([filePath, results]) => (
              <div key={filePath} style={{ marginBottom: '4px' }}>
                <div onClick={() => toggleFileExpand(filePath)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', cursor: 'pointer', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', transition: 'background 0.15s' }} className="search-file-header">
                  {expandedFiles[filePath] !== false ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filePath.split('/').pop()}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '10px', flexShrink: 0 }}>{filePath}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--gov-green)', fontSize: '10px', flexShrink: 0 }}>{results.length}</span>
                </div>
                {expandedFiles[filePath] !== false && results.map((item, idx) => (
                  <div key={idx} onClick={() => handleSearchClick(item.path, item.line)} style={{ padding: '3px 8px 3px 24px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', transition: 'background 0.15s', display: 'flex', gap: '8px', alignItems: 'baseline' }} className="search-result-item">
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0, minWidth: '24px', textAlign: 'right' }}>{item.line}</span>
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{highlightMatch(item.text, item.colStart, item.colEnd)}</span>
                  </div>
                ))}
              </div>
            ))}
            {searchQuery && searchResults.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '20px' }}>{t('noResults')}</div>}
          </div>
        </div>
      )}

      {/* SOURCE CONTROL GIT TAB */}
      {activeSidebarTab === 'source_control' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={headerStyle}>{t('gitTitle')}</h3>
            <button onClick={fetchGitStatus} disabled={gitLoading} aria-label={t('gitStatus')} style={{ padding: '4px', opacity: gitLoading ? 0.5 : 1 }} className="refresh-btn">
              <RefreshCw size={14} className={gitLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          {!gitState.isRepo ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{t('notRepo')}</p>
              <button onClick={handleGitInit} style={{ background: 'var(--gov-green)', color: 'white', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GitBranch size={13} /><span>{t('gitInit')}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <GitBranch size={14} color="var(--gov-green)" /><span>{gitState.branch}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input type="text" placeholder={t('commitPlaceholder')} value={commitMsg} onChange={e => setCommitMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCommit(); }} aria-label={t('commitPlaceholder')} style={{ fontSize: '11px', padding: '6px' }} />
                <button onClick={handleCommit} disabled={!commitMsg.trim() || gitLoading} style={{ background: commitMsg.trim() ? 'var(--gov-green)' : 'var(--border-color)', color: 'white', padding: '6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>{t('commitBtn')}</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button onClick={handlePull} style={secondaryPanelBtnStyle}><ArrowDown size={13} /><span>Pull</span></button>
                <button onClick={handlePush} style={secondaryPanelBtnStyle}><ArrowUp size={13} /><span>Push</span></button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('changes')} ({gitState.files.length})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  {gitState.files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '11.5px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file}</span>
                      <span style={{ fontWeight: 'bold', color: f.status === 'M' ? 'var(--warning-color)' : 'var(--success-color)', fontSize: '10px' }}>{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RUN & DEBUG TAB */}
      {activeSidebarTab === 'run' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={headerStyle}>{t('runDebug')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={handleRun} style={{ background: 'var(--gov-green)', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="run-panel-action">
              <Play size={15} fill="white" /><span>{t('runActive')}</span>
            </button>

          </div>
          <div style={{ marginTop: '10px' }}>
            <h4 style={subHeaderStyle}>{t('variablesInspector')}</h4>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', padding: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>env:</strong> {settings.nodeEnv}</div>
              <div><strong>activeFile:</strong> {activeFile || 'null'}</div>
              <div><strong>platform:</strong> {navigator.platform}</div>
              <div><strong>host:</strong> {window.location.host || 'localhost'}</div>
            </div>
          </div>
        </div>
      )}

      {/* EXTENSIONS TAB */}
      {activeSidebarTab === 'extensions' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={headerStyle}>{t('extensionsTitle')}</h3>
          <div>
            <h4 style={subHeaderStyle}>{t('installed')} ({installedExtensions.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {installedExtensions.map((ext) => {
                const ExtLogo = ext.logo;
                return (
                  <div key={ext.id} style={extCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={extLogoStyle}><ExtLogo size={16} color="var(--gov-green)" /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{ext.name}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ext.desc}</span>
                      </div>
                    </div>
                    <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success-color)', fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>
                      <Check size={12} /><span>Active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h4 style={subHeaderStyle}>{t('recommended')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {availableExtensions.map((ext) => {
                const ExtLogo = ext.logo;
                return (
                  <div key={ext.id} style={extCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={extLogoStyle}><ExtLogo size={16} color="var(--text-secondary)" /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{ext.name}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ext.desc}</span>
                      </div>
                    </div>
                    {!ext.installed && (
                      <button onClick={() => handleInstallExt(ext.id)} disabled={ext.installing} style={{ alignSelf: 'flex-end', background: 'var(--gov-green)', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {ext.installing ? <><Loader2 size={11} className="animate-spin" /><span>{t('installing')}</span></> : <><Download size={11} /><span>{t('install')}</span></>}
                      </button>
                    )}
                    {ext.installed && (
                      <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success-color)', fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>
                        <Check size={12} /><span>Installed</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTATION TAB */}
      {activeSidebarTab === 'documentation' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={headerStyle}>{t('docsTitle')}</h3>
          <div
            onClick={() => window.open('https://github.com/beingniloy/bdcode', '_blank')}
            style={{
              padding: '12px', borderRadius: '6px', background: 'rgba(22, 163, 74, 0.08)',
              border: '1px solid rgba(22, 163, 74, 0.3)', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: '4px',
              transition: 'background 0.2s',
            }}
            className="doc-nav-item"
          >
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gov-green-dark)' }}>{t('docsRepo')}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{t('docsRepoDesc')}</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('docsManuals')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {docManuals.map((doc) => (
              <div key={doc.id} onClick={() => handleDocOpen(doc.id)} style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s, background 0.2s' }} className="doc-nav-item">
                <span>{doc.title}</span>
                <ChevronRight size={14} className="doc-chevron" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS SHORTCUTS TAB */}
      {activeSidebarTab === 'settings' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={headerStyle}>{t('settingsTitle')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={() => { const newTheme = theme === 'light' ? 'dark' : 'light'; setTheme(newTheme); setSettings(prev => ({ ...prev, colorTheme: newTheme })); }} style={shortcutBtnStyle}>
              <span>{t('themeToggle')}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{theme === 'light' ? '☀️ Light' : '🌙 Dark'}</span>
            </button>
            <button onClick={() => setSettings(prev => ({ ...prev, minimap: !prev.minimap }))} style={shortcutBtnStyle}>
              <span>{t('minimapToggle')}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{settings.minimap ? 'On' : 'Off'}</span>
            </button>
            <button onClick={() => setSettings(prev => ({ ...prev, autoSave: !prev.autoSave }))} style={shortcutBtnStyle}>
              <span>{t('autosaveToggle')}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{settings.autoSave ? 'On' : 'Off'}</span>
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setSettings(prev => ({ ...prev, fontSize: Math.max(10, prev.fontSize - 1) }))} style={{ ...shortcutBtnStyle, flex: 1, justifyContent: 'center' }}><span>{t('fontSizeDecrease')}</span></button>
              <button onClick={() => setSettings(prev => ({ ...prev, fontSize: Math.min(30, prev.fontSize + 1) }))} style={{ ...shortcutBtnStyle, flex: 1, justifyContent: 'center' }}><span>{t('fontSizeIncrease')}</span></button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '-8px' }}>{settings.fontSize}px</div>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 0' }} />
            <button onClick={() => setSettingsModalOpen(true)} style={{ ...shortcutBtnStyle, background: 'rgba(22, 106, 78, 0.08)', border: '1px solid rgba(22, 106, 78, 0.3)', color: 'var(--gov-green-dark)', fontWeight: 'bold', justifyContent: 'center' }}><span>{t('openAdvanced')}</span></button>
          </div>
        </div>
      )}

      {/* FEEDBACK TAB */}
      {activeSidebarTab === 'feedback' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={headerStyle}>{t('feedbackTitle')}</h3>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
            <p style={{ margin: 0 }}>
              {t('feedbackDescription')}
            </p>
            <button onClick={() => window.open('https://github.com/beingniloy/bdcode/issues', '_blank')} style={{ background: 'var(--gov-green)', color: 'white', padding: '10px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px', transition: 'background 0.2s' }} className="github-feedback-btn">
              <span>{t('githubFeedback')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ── Shared styles ──
const headerStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '4px' };
const subHeaderStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' };
const inputSearchStyle: React.CSSProperties = { width: '100%', padding: '6px 8px 6px 28px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '12px', outline: 'none' };
const secondaryPanelBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' };
const extCardStyle: React.CSSProperties = { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' };
const extLogoStyle: React.CSSProperties = { width: '28px', height: '28px', borderRadius: '4px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', flexShrink: 0 };
const shortcutBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid transparent', fontSize: '11.5px', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s' };
const toggleBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '3px', border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' };
