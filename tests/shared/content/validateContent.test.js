import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateGameContent,
  validateQuests,
  validateSkills,
  validateVendors,
} from '../../../shared/content/validateContent.js';
import { getQuestDef } from '../../../shared/quests.js';
import { getSkill, getSkillBar } from '../../../shared/skills.js';
import { getVendor } from '../../../shared/vendors.js';
import { getDefaultVendorStock } from '../../../shared/economy.js';

describe('validateGameContent', () => {
  it('validates bundled JSON content packs', () => {
    const result = validateGameContent();
    assert.equal(result.ok, true, result.errors.join('; '));
  });

  it('rejects invalid quest definitions', () => {
    const result = validateQuests({
      bad: { id: 'other', title: 'Bad' },
    });
    assert.ok(result.length > 0);
  });

  it('rejects skill bars referencing unknown skills', () => {
    const result = validateSkills({
      skillSlotCount: 2,
      skills: { cleave: { id: 'cleave', type: 'melee_aoe', damageStat: 'str', classes: ['warrior'] } },
      classSkillBars: { warrior: ['missing', null] },
    });
    assert.ok(result.some((msg) => msg.includes('unknown skill')));
  });

  it('rejects empty vendor stock', () => {
    const result = validateVendors({ vendors: { a: { id: 'a', name: 'A' } }, stock: [] });
    assert.ok(result.some((msg) => msg.includes('stock')));
  });
});

describe('content pack wiring', () => {
  it('loads quest defs from JSON', () => {
    assert.equal(getQuestDef('goblin-menace')?.title, 'Goblin Menace');
  });

  it('loads skills from JSON', () => {
    assert.equal(getSkill('fireball')?.name, 'Fireball');
    assert.equal(getSkillBar('mage').filter(Boolean).length, 2);
  });

  it('loads vendors and stock from JSON', () => {
    assert.equal(getVendor('merchant-brok')?.name, 'Brok');
    assert.ok(getDefaultVendorStock().some((row) => row.templateKey === 'health_potion'));
  });
});
