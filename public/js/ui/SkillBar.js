import { getAvailableMp, getAvailableHpForSkills, getSkillResourceCost, getSkillHpCost } from '/shared/skills.js';
import { getMaxSummonSlots } from '/shared/summons.js';
import { CONSUMABLE_KIND, countPotionsByKind, canQuickUsePotion } from '/shared/consumables.js';
import { buildItemIconSvg } from './itemIconSvg.js';

/** Skill hotkeys 1–7; potions on 8 (HP) and 9 (MP). */
export const SKILL_HOTKEY_COUNT = 7;

export class SkillBar {
  constructor(rootEl) {
    this.root = rootEl;
    this.skillSlots = [];
    this.potionSlots = {};

    this.skillsEl = document.createElement('div');
    this.skillsEl.className = 'skill-bar-skills';
    this.root.appendChild(this.skillsEl);

    this.dividerEl = document.createElement('div');
    this.dividerEl.className = 'skill-bar-divider';
    this.dividerEl.setAttribute('aria-hidden', 'true');
    this.root.appendChild(this.dividerEl);

    this.potionsEl = document.createElement('div');
    this.potionsEl.className = 'skill-bar-potions';
    this.root.appendChild(this.potionsEl);

    this.thrallEl = document.createElement('div');
    this.thrallEl.className = 'skill-bar-thralls hidden';
    this.thrallEl.setAttribute('aria-live', 'polite');
    this.root.appendChild(this.thrallEl);

    for (let i = 0; i < SKILL_HOTKEY_COUNT; i++) {
      const slot = this.createSlot('skill-slot', String(i + 1));
      this.skillsEl.appendChild(slot);
      this.skillSlots.push(slot);
    }

    for (const [key, kind] of [
      ['8', CONSUMABLE_KIND.HEALTH],
      ['9', CONSUMABLE_KIND.MANA],
    ]) {
      const slot = this.createSlot('skill-slot potion-slot', key);
      slot.dataset.potionKind = kind;
      slot.querySelector('.skill-icon').innerHTML = buildItemIconSvg(
        kind === CONSUMABLE_KIND.HEALTH ? 'health_potion' : 'mana_potion'
      );
      slot.querySelector('.skill-icon').classList.add('skill-icon--svg');
      this.potionsEl.appendChild(slot);
      this.potionSlots[kind] = slot;
    }
  }

  createSlot(className, hotkey) {
    const slot = document.createElement('div');
    slot.className = `${className} empty`;
    slot.innerHTML = `
      <span class="skill-key">${hotkey}</span>
      <span class="skill-icon"></span>
      <span class="skill-mp"></span>
      <span class="potion-count hidden"></span>
      <span class="skill-cooldown-text"></span>
      <div class="skill-cooldown"></div>
    `;
    return slot;
  }

  update(player, worldState = null) {
    if (!player) return;

    this.updateSkillSlots(player);
    this.updatePotionSlots(player);
    this.updateThrallHud(player, worldState);
  }

  updateThrallHud(player, worldState) {
    if (player.characterClass !== 'necromancer') {
      this.thrallEl.classList.add('hidden');
      this.thrallEl.textContent = '';
      return;
    }

    const summons = (worldState?.monsters ?? []).filter(
      (m) => m.isSummon && m.ownerId === player.id && m.hp > 0
    );
    const used = summons.reduce((sum, s) => sum + (s.slotCost ?? 1), 0);
    const max = getMaxSummonSlots(player.level ?? 1);
    this.thrallEl.classList.remove('hidden');
    this.thrallEl.textContent = `Thralls ${used}/${max}`;
    this.thrallEl.title = 'Active blood thrall slots';
  }

  updateSkillSlots(player) {
    for (let i = 0; i < SKILL_HOTKEY_COUNT; i++) {
      const skill = player.skillBar?.[i];
      const slot = this.skillSlots[i];
      const icon = slot.querySelector('.skill-icon');
      const mp = slot.querySelector('.skill-mp');
      const cd = slot.querySelector('.skill-cooldown');
      const cdText = slot.querySelector('.skill-cooldown-text');

      icon.classList.remove('skill-icon--svg');
      icon.textContent = '';

      if (!skill) {
        slot.className = 'skill-slot empty';
        slot.removeAttribute('title');
        slot.setAttribute('aria-label', `Skill slot ${i + 1}, empty`);
        mp.textContent = '';
        mp.classList.remove('skill-mp--hp');
        cd.style.height = '0%';
        cdText.textContent = '';
        continue;
      }

      const resource = getSkillResourceCost(skill);
      slot.className = 'skill-slot';
      icon.textContent = skill.icon;
      mp.textContent = `${resource.amount}`;
      if (resource.unit === 'HP') {
        mp.classList.add('skill-mp--hp');
      } else {
        mp.classList.remove('skill-mp--hp');
      }
      slot.title = `${skill.name} — ${resource.amount} ${resource.unit}`;
      slot.setAttribute(
        'aria-label',
        `${skill.name}, ${resource.amount} ${resource.unit}, key ${i + 1}`
      );

      const remaining = player.skillCooldowns?.[skill.id] ?? 0;
      const ratio = skill.cooldownMs > 0 ? remaining / skill.cooldownMs : 0;

      if (remaining > 0) {
        slot.classList.add('on-cooldown');
        slot.classList.remove('ready');
        cd.style.height = `${Math.min(100, ratio * 100)}%`;
        cdText.textContent = (remaining / 1000).toFixed(1);
      } else {
        slot.classList.remove('on-cooldown');
        slot.classList.add('ready');
        cd.style.height = '0%';
        cdText.textContent = '';
      }

      const hpCost = getSkillHpCost(skill);
      const lackingHp = hpCost > 0 && getAvailableHpForSkills(player) < hpCost;
      const lackingMp = (skill.mpCost ?? 0) > 0 && getAvailableMp(player) < skill.mpCost;
      if (lackingHp || lackingMp) {
        slot.classList.add('no-mp');
      } else {
        slot.classList.remove('no-mp');
      }
    }
  }

  updatePotionSlots(player) {
    const inventory = player.inventory ?? [];

    for (const kind of [CONSUMABLE_KIND.HEALTH, CONSUMABLE_KIND.MANA]) {
      const slot = this.potionSlots[kind];
      const countEl = slot.querySelector('.potion-count');
      const hotkey = kind === CONSUMABLE_KIND.HEALTH ? '8' : '9';
      const label = kind === CONSUMABLE_KIND.HEALTH ? 'Health potion' : 'Mana potion';
      const count = countPotionsByKind(inventory, kind);
      const quick = canQuickUsePotion(player, kind);

      slot.classList.remove('empty', 'ready', 'unavailable', 'no-stock');

      if (count === 0) {
        slot.classList.add('no-stock', 'unavailable');
        countEl.textContent = '';
        countEl.classList.add('hidden');
        slot.title = `${label} — none in bag`;
        slot.setAttribute('aria-label', `${label}, none in bag, key ${hotkey}`);
        continue;
      }

      if (!quick.ok && (quick.reason === 'full_hp' || quick.reason === 'full_mp')) {
        slot.classList.add('unavailable');
        slot.title = `${label} — ${quick.reason === 'full_hp' ? 'HP full' : 'MP full'}`;
      } else {
        slot.classList.add('ready');
        slot.title = `${label}${count > 1 ? ` ×${count}` : ''}`;
      }

      slot.setAttribute('aria-label', `${label}, ${count} in bag, key ${hotkey}`);

      if (count > 1) {
        countEl.textContent = String(count);
        countEl.classList.remove('hidden');
      } else {
        countEl.textContent = '';
        countEl.classList.add('hidden');
      }
    }
  }
}
