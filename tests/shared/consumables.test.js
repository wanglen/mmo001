import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyConsumable, isConsumable, CONSUMABLE_KIND } from '../../shared/consumables.js';
import { createPotion, POTION_TEMPLATES, RARITY } from '../../shared/items.js';

describe('consumables', () => {
  const player = () => ({
    hp: 50,
    maxHp: 120,
    mp: 20,
    maxMp: 100,
    dead: false,
  });

  it('isConsumable detects potion items', () => {
    const potion = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    assert.equal(isConsumable(potion), true);
    assert.equal(isConsumable({ type: 'weapon' }), false);
  });

  it('applyConsumable restores hp up to max', () => {
    const p = player();
    const potion = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);

    const result = applyConsumable(p, potion);

    assert.equal(result.ok, true);
    assert.equal(result.kind, CONSUMABLE_KIND.HEALTH);
    assert.ok(result.restored > 0);
    assert.equal(p.hp, 100);
  });

  it('applyConsumable restores mp up to max', () => {
    const p = player();
    const potion = createPotion(POTION_TEMPLATES[1], RARITY.COMMON);

    const result = applyConsumable(p, potion);

    assert.equal(result.ok, true);
    assert.equal(result.kind, CONSUMABLE_KIND.MANA);
    assert.equal(p.mp, 65);
  });

  it('applyConsumable rejects use at full hp/mp', () => {
    const p = player();
    p.hp = p.maxHp;
    const health = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    assert.equal(applyConsumable(p, health).reason, 'full_hp');

    p.mp = p.maxMp;
    const mana = createPotion(POTION_TEMPLATES[1], RARITY.COMMON);
    assert.equal(applyConsumable(p, mana).reason, 'full_mp');
  });

  it('applyConsumable rejects dead players', () => {
    const p = player();
    p.dead = true;
    p.hp = 0;
    const potion = createPotion(POTION_TEMPLATES[0], RARITY.COMMON);
    assert.equal(applyConsumable(p, potion).reason, 'dead');
  });
});
