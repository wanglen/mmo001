import { getAvailableMp } from '/shared/skills.js';

export class SkillBar {
  constructor(rootEl) {
    this.root = rootEl;
    this.slots = [];

    for (let i = 0; i < 8; i++) {
      const slot = document.createElement('div');
      slot.className = 'skill-slot empty';
      slot.innerHTML = `
        <span class="skill-key">${i + 1}</span>
        <span class="skill-icon"></span>
        <span class="skill-name"></span>
        <span class="skill-mp"></span>
        <div class="skill-cooldown"></div>
      `;
      this.root.appendChild(slot);
      this.slots.push(slot);
    }
  }

  update(player) {
    if (!player?.skillBar) return;

    for (let i = 0; i < 8; i++) {
      const skill = player.skillBar[i];
      const slot = this.slots[i];
      const icon = slot.querySelector('.skill-icon');
      const name = slot.querySelector('.skill-name');
      const mp = slot.querySelector('.skill-mp');
      const cd = slot.querySelector('.skill-cooldown');

      if (!skill) {
        slot.classList.add('empty');
        slot.classList.remove('ready', 'on-cooldown', 'no-mp');
        icon.textContent = '';
        name.textContent = '';
        mp.textContent = '';
        cd.style.height = '0%';
        continue;
      }

      slot.classList.remove('empty');
      icon.textContent = skill.icon;
      name.textContent = skill.name;
      mp.textContent = `${skill.mpCost} MP`;

      const remaining = player.skillCooldowns?.[skill.id] ?? 0;
      const ratio = skill.cooldownMs > 0 ? remaining / skill.cooldownMs : 0;

      if (remaining > 0) {
        slot.classList.add('on-cooldown');
        slot.classList.remove('ready');
        cd.style.height = `${Math.min(100, ratio * 100)}%`;
      } else {
        slot.classList.remove('on-cooldown');
        slot.classList.add('ready');
        cd.style.height = '0%';
      }

      if (getAvailableMp(player) < skill.mpCost) {
        slot.classList.add('no-mp');
      } else {
        slot.classList.remove('no-mp');
      }
    }
  }
}
