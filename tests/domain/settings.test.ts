import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsState, updateSettings } from '../../src/domain/settings';

test('createSettingsState applies defaults and overrides', () => {
  const settings = createSettingsState({ theme: 'dark' });
  assert.equal(settings.theme, 'dark');
  assert.equal(settings.locale, 'en');
  assert.equal(settings.analyticsEnabled, false);
});

test('updateSettings merges patches immutably', () => {
  const initial = createSettingsState();
  const updated = updateSettings(initial, { analyticsEnabled: true, locale: 'fr' });
  assert.equal(updated.analyticsEnabled, true);
  assert.equal(updated.locale, 'fr');
  assert.equal(initial.analyticsEnabled, false);
});
