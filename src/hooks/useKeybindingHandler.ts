import { useCallback } from 'react';
import { CommandDefinition } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { eventToShortcut, isInputElement } from '../utils';

/**
 * Hook that manages a registry of commands and produces a global keydown handler.
 *
 * Usage in App.tsx:
 *
 *   const commands: CommandDefinition[] = [
 *     { id: 'save', label: 'Save', category: 'File', defaultKeys: 'Ctrl+S', handler: handleSave },
 *     ...
 *   ];
 *   const handleKeyDown = useKeybindingHandler(commands);
 *
 * The hook reads resolved shortcuts (user overrides) from SettingsContext,
 * so commands always fire with the user's configured key.
 */
export function useKeybindingHandler(
  commands: CommandDefinition[]
): (e: KeyboardEvent) => void {
  const { getShortcut } = useSettings();

  return useCallback(
    (e: KeyboardEvent) => {
      const shortcut = eventToShortcut(e);
      const isInput = isInputElement(e);

      for (const cmd of commands) {
        const resolvedKeys = getShortcut(cmd.id);
        if (!resolvedKeys) continue;

        // Normalise the resolved shortcut for comparison
        const normalisedKeys = resolvedKeys.replace(/\s+/g, '');
        if (shortcut !== normalisedKeys) continue;

        // Check 'when' condition
        if (cmd.when === '!inputFocus' && isInput) continue;

        e.preventDefault();
        e.stopPropagation();
        cmd.handler();
        return;
      }
    },
    [commands, getShortcut]
  );
}
