import { ALLOCATABLE_STATS } from '/shared/stats.js';

const STAT_LABELS = {
  str: 'STR',
  dex: 'DEX',
  int: 'INT',
  vit: 'VIT',
};

export class LevelUpPanel {
  constructor(rootEl, flashEl) {
    this.root = rootEl;
    this.flashEl = flashEl;
    this.onAllocate = null;
    this.onPauseChange = null;
    this.onRequestCanvasFocus = null;
    /** @type {(() => void) | null} */
    this.onPlayLevelUpSound = null;
    /** @type {(() => void) | null} */
    this.onLevelUpParticles = null;
    this.lastLevel = 1;
    this.seededLevel = false;
    this.paused = false;
    this.currentPlayer = null;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="levelup-inner">
        <h2 class="levelup-title" id="levelup-title">Level Up!</h2>
        <p class="levelup-level" id="levelup-level"></p>
        <p class="levelup-summary" id="levelup-summary"></p>
        <p class="levelup-points" id="levelup-points"></p>
        <div class="levelup-current-stats" id="levelup-current-stats"></div>
        <div class="levelup-stats" id="levelup-stats"></div>
        <p class="levelup-hint" id="levelup-hint"></p>
        <button type="button" class="levelup-close" id="levelup-close">Continue</button>
      </div>
    `;

    this.titleEl = this.root.querySelector('#levelup-title');
    this.levelEl = this.root.querySelector('#levelup-level');
    this.summaryEl = this.root.querySelector('#levelup-summary');
    this.pointsEl = this.root.querySelector('#levelup-points');
    this.currentStatsEl = this.root.querySelector('#levelup-current-stats');
    this.statsEl = this.root.querySelector('#levelup-stats');
    this.hintEl = this.root.querySelector('#levelup-hint');

    this.root.querySelector('#levelup-close').addEventListener('click', () => this.hide());

    for (const stat of ALLOCATABLE_STATS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'levelup-stat-btn';
      btn.dataset.stat = stat;
      btn.textContent = `+ ${STAT_LABELS[stat]}`;
      btn.addEventListener('click', () => {
        if (this.onAllocate) this.onAllocate(stat);
      });
      this.statsEl.appendChild(btn);
    }
  }

  isPaused() {
    return this.paused;
  }

  isVisible() {
    return !this.root.classList.contains('hidden');
  }

  hasUnspentPoints() {
    return (this.currentPlayer?.statPoints ?? 0) > 0;
  }

  update(player) {
    if (!player) return;

    this.currentPlayer = player;

    if (!this.seededLevel) {
      this.seededLevel = true;
      this.lastLevel = player.level;
    } else {
      const leveledUp = player.level > this.lastLevel;
      if (leveledUp) {
        this.onLevelUp(player);
      }
      this.lastLevel = player.level;
    }

    if (this.isVisible()) {
      this.render(player);
    }
  }

  openForStatPoints(player) {
    const merged = { ...this.currentPlayer, ...player };
    const points = merged.statPoints ?? 0;
    this.show(merged, {
      title: points > 0 ? 'Stat Points' : 'Character Stats',
      message:
        points > 0
          ? `Spend your stat points (${points} remaining).`
          : 'No stat points to spend. Level up to earn more.',
    });
  }

  onLevelUp(player) {
    this.onPlayLevelUpSound?.();
    this.onLevelUpParticles?.();
    this.flash();
    this.show(player, {
      title: 'Level Up!',
      message: `You reached level ${player.level}!`,
    });
  }

  flash() {
    this.flashEl.classList.add('levelup-flash-active');
    this.root.classList.add('levelup-flash-active');
    setTimeout(() => {
      this.flashEl.classList.remove('levelup-flash-active');
      this.root.classList.remove('levelup-flash-active');
    }, 600);
  }

  render(player) {
    const points = player.statPoints ?? 0;
    const level = player.level ?? 1;
    const hp = Math.ceil(player.hp ?? 0);
    const maxHp = player.maxHp ?? 0;
    const mp = Math.ceil(player.mp ?? 0);
    const maxMp = player.maxMp ?? 0;

    this.summaryEl.textContent = `Level ${level} · HP ${hp}/${maxHp} · MP ${mp}/${maxMp}`;
    this.pointsEl.textContent = `Stat points: ${points} · Skill points: ${player.skillPoints ?? 0}`;
    this.hintEl.textContent =
      points > 0
        ? 'Spend stat points below, or press Continue. Press K for the skill tree.'
        : (player.skillPoints ?? 0) > 0
          ? 'You have skill points to spend — press K to open the skill tree.'
          : '';

    this.currentStatsEl.innerHTML = ALLOCATABLE_STATS.map(
      (stat) => `
        <div class="levelup-stat-readout">
          <span class="levelup-stat-readout-label">${STAT_LABELS[stat]}</span>
          <span class="levelup-stat-readout-value">${player[stat] ?? 0}</span>
        </div>
      `
    ).join('');

    for (const btn of this.statsEl.querySelectorAll('.levelup-stat-btn')) {
      const stat = btn.dataset.stat;
      btn.textContent = `+ ${STAT_LABELS[stat]}`;
      btn.disabled = points < 1;
    }
  }

  show(player, { title = 'Level Up!', message = '' } = {}) {
    this.currentPlayer = player;
    this.titleEl.textContent = title;
    this.levelEl.textContent = message;
    this.render(player);
    this.root.classList.remove('hidden');
    this.setPaused(true);
  }

  hide() {
    this.root.classList.add('hidden');
    this.setPaused(false);
    const active = document.activeElement;
    if (active && this.root.contains(active)) {
      active.blur();
    }
    if (this.onRequestCanvasFocus) this.onRequestCanvasFocus();
  }

  setPaused(paused) {
    this.paused = paused;
    if (this.onPauseChange) this.onPauseChange(paused);
  }
}
