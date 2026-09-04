import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import COMMANDS, { getCommand, groupByCategory, getCommandLabel } from './commands';

describe('COMMANDS list', () => {
  it('should contain unique command IDs', () => {
    const ids = COMMANDS.map(cmd => cmd.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size);
  });

  it('should have required properties for every command definition', () => {
    assert.ok(COMMANDS.length > 0);
    for (const cmd of COMMANDS) {
      assert.ok(typeof cmd.id === 'string' && cmd.id.length > 0);
      assert.ok(typeof cmd.label === 'string' && cmd.label.length > 0);
      assert.ok(typeof cmd.category === 'string' && cmd.category.length > 0);
      assert.ok(typeof cmd.defaultKeys === 'string');
      assert.ok(cmd.icon !== undefined);
    }
  });
});

describe('getCommand', () => {
  it('should return command definition when valid ID is provided', () => {
    const cmd = getCommand('save');
    assert.ok(cmd);
    assert.equal(cmd?.id, 'save');
    assert.equal(cmd?.label, 'Save Current File');
    assert.equal(cmd?.category, 'File');
  });

  it('should return undefined when non-existent ID is provided', () => {
    const cmd = getCommand('invalidCommandId');
    assert.equal(cmd, undefined);
  });
});

describe('groupByCategory', () => {
  it('should group all commands by category preserving category order', () => {
    const groups = groupByCategory();

    // Verify all commands across groups equal total COMMANDS count
    const totalGroupedCommands = groups.reduce((acc, g) => acc + g.commands.length, 0);
    assert.equal(totalGroupedCommands, COMMANDS.length);

    // Verify order of categories corresponds to first appearance in COMMANDS
    const expectedCategoriesInOrder: string[] = [];
    for (const cmd of COMMANDS) {
      if (!expectedCategoriesInOrder.includes(cmd.category)) {
        expectedCategoriesInOrder.push(cmd.category);
      }
    }

    const actualCategoriesInOrder = groups.map(g => g.category);
    assert.deepEqual(actualCategoriesInOrder, expectedCategoriesInOrder);

    // Check individual items in groups match COMMANDS for that category
    for (const group of groups) {
      const expectedCmds = COMMANDS.filter(c => c.category === group.category);
      assert.deepEqual(group.commands, expectedCmds);
    }
  });
});

describe('getCommandLabel', () => {
  it('should return display label for existing command ID', () => {
    assert.equal(getCommandLabel('save'), 'Save Current File');
    assert.equal(getCommandLabel('openSettings'), 'Open Settings');
  });

  it('should return input ID if command is not found', () => {
    assert.equal(getCommandLabel('unknown.command'), 'unknown.command');
  });
});
