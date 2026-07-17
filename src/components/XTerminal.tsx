import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface XTerminalProps {
  /** Whether the terminal tab is currently visible */
  visible: boolean;
  /** Terminal settings from the settings context */
  terminalFontSize?: number;
  terminalCursorStyle?: 'block' | 'line' | 'underline';
  fontFamily?: string;
  terminalShell?: string;
}

/**
 * A real xterm.js terminal emulator â€“ same library VS Code uses.
 * Connects to the Electron shell process via IPC.
 */
export default function XTerminal({ visible, terminalFontSize = 14, terminalCursorStyle = 'block', fontFamily = 'Cascadia Code', terminalShell }: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);

  // â”€â”€ Bootstrap terminal once â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

    const term = new Terminal({
      // VS Code dark theme colours
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#aeafad',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
        selectionForeground: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      fontFamily: `"${fontFamily}", "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace`,
      fontSize: terminalFontSize,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: terminalCursorStyle === 'line' ? 'bar' : terminalCursorStyle,
      scrollback: 5000,
      allowProposedApi: true,
      convertEol: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);

    term.open(containerRef.current);
    fit.fit();

    termRef.current = term;
    fitRef.current = fit;

    // â”€â”€ Wire up IPC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (window.electronAPI) {
      // Shell â†’ xterm
      window.electronAPI.getTerminalHistory().then((history: string) => {
        if (history) term.write(history);
      });
      const unsub = window.electronAPI.onTerminalData((data: string) => {
        term.write(data);
      });

      // xterm â†’ shell (keystrokes)
      term.onData((data: string) => {
        window.electronAPI!.sendTerminalInput(data);
      });

      // Cleanup
      return () => {
        unsub();
        term.dispose();
        termRef.current = null;
        fitRef.current = null;
        initializedRef.current = false;
      };
    } else {
      // Web fallback â€“ just show a message
      term.writeln('Bangladesh Code Terminal (web preview mode)');
      term.writeln('Shell commands are only available in the desktop app.');
      return () => {
        term.dispose();
        termRef.current = null;
        fitRef.current = null;
        initializedRef.current = false;
      };
    }
  }, []);

  // â”€â”€ Re-fit when visibility or window size changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const doFit = useCallback(() => {
    if (fitRef.current && visible) {
      try {
        fitRef.current.fit();
      } catch { /* ignore if container not ready */ }
    }
  }, [visible]);

  useEffect(() => {
    doFit();
  }, [visible, doFit]);

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(doFit);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [doFit]);

  // Also re-fit when the container might have changed (panel resize etc.)
  useEffect(() => {
    if (!containerRef.current || !visible) return;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(doFit);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible, doFit]);

  // â”€â”€ Focus terminal when visible â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (visible && termRef.current) {
      termRef.current.focus();
    }
  }, [visible]);

  // â”€â”€ Restart shell when terminalShell setting changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (window.electronAPI && terminalShell) {
      window.electronAPI.restartShell(terminalShell);
    }
  }, [terminalShell]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#1e1e1e',
      }}
    />
  );
}
