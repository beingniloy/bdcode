import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { ActiveSidebarTab } from '../types';

interface LayoutContextValue {
  activeSidebarTab: ActiveSidebarTab;
  setActiveSidebarTab: (tab: ActiveSidebarTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  bottomPanelOpen: boolean;
  setBottomPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  footerCollapsed: boolean;
  setFooterCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
  rightSidebarWidth: number;
  bottomPanelHeight: number;
  resizing: 'left' | 'right' | 'bottom' | null;
  startResizing: (dir: 'left' | 'right' | 'bottom', e: React.MouseEvent) => void;
  resetSize: (dir: 'left' | 'right' | 'bottom') => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

const DEFAULT_SIDEBAR_WIDTH = 260;
const DEFAULT_RIGHT_SIDEBAR_WIDTH = 280;
const DEFAULT_BOTTOM_PANEL_HEIGHT = 220;

// Width boundaries (like VS Code)
const MIN_SIDEBAR_WIDTH = 170;
const MAX_SIDEBAR_WIDTH = 500;
const MIN_RIGHT_SIDEBAR_WIDTH = 170;
const MAX_RIGHT_SIDEBAR_WIDTH = 500;
const MIN_BOTTOM_PANEL_HEIGHT = 80;
const MAX_BOTTOM_PANEL_HEIGHT = 600;

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [activeSidebarTab, setActiveSidebarTab] = useState<ActiveSidebarTab>('explorer');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [footerCollapsed, setFooterCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(DEFAULT_RIGHT_SIDEBAR_WIDTH);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(DEFAULT_BOTTOM_PANEL_HEIGHT);
  const [resizing, setResizing] = useState<'left' | 'right' | 'bottom' | null>(null);

  const initialPos = useRef(0);
  const initialSize = useRef(0);

  // Drag resizer layout — VS Code style
  const startResizing = useCallback((
    dir: 'left' | 'right' | 'bottom',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Record initial position and size for delta calculation
    if (dir === 'left') {
      initialPos.current = e.clientX;
      initialSize.current = sidebarWidth;
    } else if (dir === 'right') {
      initialPos.current = e.clientX;
      initialSize.current = rightSidebarWidth;
    } else if (dir === 'bottom') {
      initialPos.current = e.clientY;
      initialSize.current = bottomPanelHeight;
    }

    setResizing(dir);

    // Add global cursor and prevent text selection (like VS Code)
    document.body.style.cursor = dir === 'bottom' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    // Re-enable pointer events on the handle element itself
    // Actually we use a different approach: use a global overlay

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Calculate delta from initial position
      const delta = dir === 'left'
        ? moveEvent.clientX - initialPos.current
        : dir === 'right'
          ? initialPos.current - moveEvent.clientX
          : moveEvent.clientY - initialPos.current;

      let newSize: number;
      if (dir === 'left') {
        newSize = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, initialSize.current + delta));
        // Also account for the activity bar (76px offset)
        const actualWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, moveEvent.clientX - 76));
        setSidebarWidth(actualWidth);
      } else if (dir === 'right') {
        newSize = Math.max(MIN_RIGHT_SIDEBAR_WIDTH, Math.min(MAX_RIGHT_SIDEBAR_WIDTH, window.innerWidth - moveEvent.clientX));
        setRightSidebarWidth(newSize);
      } else if (dir === 'bottom') {
        newSize = Math.max(MIN_BOTTOM_PANEL_HEIGHT, Math.min(MAX_BOTTOM_PANEL_HEIGHT, initialSize.current + delta));
        setBottomPanelHeight(newSize);
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
      // Restore body styles
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth, rightSidebarWidth, bottomPanelHeight]);

  const resetSize = useCallback((dir: 'left' | 'right' | 'bottom') => {
    if (dir === 'left') setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    else if (dir === 'right') setRightSidebarWidth(DEFAULT_RIGHT_SIDEBAR_WIDTH);
    else if (dir === 'bottom') setBottomPanelHeight(DEFAULT_BOTTOM_PANEL_HEIGHT);
  }, []);

  return (
    <LayoutContext.Provider value={{
      activeSidebarTab,
      setActiveSidebarTab,
      sidebarOpen,
      setSidebarOpen,
      rightSidebarOpen,
      setRightSidebarOpen,
      bottomPanelOpen,
      setBottomPanelOpen,
      footerCollapsed,
      setFooterCollapsed,
      sidebarWidth,
      rightSidebarWidth,
      bottomPanelHeight,
      resizing,
      startResizing,
      resetSize,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider');
  return ctx;
}
