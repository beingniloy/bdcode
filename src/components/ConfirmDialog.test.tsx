import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dialogTranslations, getDialogTitle } from './ConfirmDialog';

describe('ConfirmDialog translations and title mapping', () => {
  it('should return correct dialog titles in Bengali', () => {
    assert.equal(getDialogTitle('alert', 'bn'), 'তথ্য');
    assert.equal(getDialogTitle('confirm', 'bn'), 'নিশ্চিতকরণ');
    assert.equal(getDialogTitle('prompt', 'bn'), 'ইনপুট');
  });

  it('should return correct dialog titles in English', () => {
    assert.equal(getDialogTitle('alert', 'en'), 'Info');
    assert.equal(getDialogTitle('confirm', 'en'), 'Confirm');
    assert.equal(getDialogTitle('prompt', 'en'), 'Input');
  });

  it('should have consistent translation keys for bn and en', () => {
    const bnKeys = Object.keys(dialogTranslations.bn).sort();
    const enKeys = Object.keys(dialogTranslations.en).sort();
    assert.deepEqual(bnKeys, enKeys);
  });
});
