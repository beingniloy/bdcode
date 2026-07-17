import { useState, useCallback, useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action?: () => void | Promise<void>;
  divider?: boolean;
  disabled?: boolean;
  danger?: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const showMenu = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;
    const padding = 8;

    let x = clientX;
    let y = clientY;

    requestAnimationFrame(() => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        if (x + rect.width > window.innerWidth - padding) {
          x = window.innerWidth - rect.width - padding;
        }
        if (y + rect.height > window.innerHeight - padding) {
          y = window.innerHeight - rect.height - padding;
        }
      }
      setMenu({ visible: true, x, y, items });
    });

    setMenu({ visible: true, x: clientX, y: clientY, items });
  }, []);

  const hideMenu = useCallback(() => {
    setMenu(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    if (!menu.visible) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideMenu();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideMenu();
    };

    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleEscape, true);
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [menu.visible, hideMenu]);

  return { menu, menuRef, showMenu, hideMenu };
}
