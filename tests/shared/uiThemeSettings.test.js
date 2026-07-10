import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_UI_THEME,
  UI_THEME_IDS,
  UI_THEME_KEY,
  applyUiTheme,
  getUiThemeColors,
  isUiThemeId,
  loadUiTheme,
  parseUiTheme,
  saveUiTheme,
} from '../../shared/uiThemeSettings.js';

describe('uiThemeSettings', () => {
  it('defaults to darkfan', () => {
    assert.equal(DEFAULT_UI_THEME, 'darkfan');
    assert.equal(parseUiTheme(null), 'darkfan');
    assert.equal(parseUiTheme(''), 'darkfan');
    assert.equal(parseUiTheme('nope'), 'darkfan');
  });

  it('accepts known theme ids', () => {
    for (const id of UI_THEME_IDS) {
      assert.equal(isUiThemeId(id), true);
      assert.equal(parseUiTheme(id), id);
    }
  });

  it('parses JSON wrappers', () => {
    assert.equal(parseUiTheme('"isekai"'), 'isekai');
    assert.equal(parseUiTheme(JSON.stringify({ theme: 'shonen' })), 'shonen');
  });

  it('returns canvas palettes for every theme', () => {
    for (const id of UI_THEME_IDS) {
      const colors = getUiThemeColors(id);
      assert.ok(colors.lifeTop);
      assert.ok(colors.manaTop);
      assert.ok(colors.xpFillStart);
      assert.ok(colors.fontUi);
    }
  });

  it('persists and loads from storage', () => {
    /** @type {Record<string, string>} */
    const store = {};
    const storage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
    };

    saveUiTheme('jrpg', storage);
    assert.equal(store[UI_THEME_KEY], 'jrpg');
    assert.equal(loadUiTheme(storage), 'jrpg');

    const attrs = {};
    const documentElement = {
      setAttribute(name, value) {
        attrs[name] = value;
      },
    };
    const applied = applyUiTheme('isekai', { documentElement, storage });
    assert.equal(applied, 'isekai');
    assert.equal(attrs['data-ui-theme'], 'isekai');
    assert.equal(loadUiTheme(storage), 'isekai');
  });
});
