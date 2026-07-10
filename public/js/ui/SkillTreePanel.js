import { SKILLS, getSkillResourceCost } from '/shared/skills.js';
import { SKILL_HOTKEY_COUNT } from './SkillBar.js';

export class SkillTreePanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.onLearn = null;
    this.onSetSlot = null;
    this.onRespec = null;
    this.onPauseChange = null;
    this.onRequestCanvasFocus = null;
    this.townFeaturesEnabled = false;
    this.currentPlayer = null;
    this.selectedSlot = null;
    this.paused = false;
    this.lastRenderKey = '';
    this.statusMessage = '';
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="skilltree-inner">
        <h2 class="skilltree-title">Skill Tree</h2>
        <p class="skilltree-summary" id="skilltree-summary"></p>
        <p class="skilltree-points" id="skilltree-points"></p>
        <p class="skilltree-status hidden" id="skilltree-status" aria-live="polite"></p>
        <section class="skilltree-builds" id="skilltree-builds" aria-label="Build presets"></section>
        <section class="skilltree-nodes" id="skilltree-nodes" aria-label="Skills"></section>
        <section class="skilltree-bar-section" aria-label="Skill bar">
          <h3 class="skilltree-section-label">Hotbar (keys 1–7)</h3>
          <div class="skilltree-bar" id="skilltree-bar"></div>
          <p class="skilltree-bar-hint">Click a slot, then click an unlocked skill to assign.</p>
        </section>
        <div class="skilltree-actions">
          <button type="button" class="skilltree-respec-btn" id="skilltree-respec">Respec (town)</button>
          <button type="button" class="skilltree-close" id="skilltree-close">Close</button>
        </div>
      </div>
    `;

    this.summaryEl = this.root.querySelector('#skilltree-summary');
    this.pointsEl = this.root.querySelector('#skilltree-points');
    this.statusEl = this.root.querySelector('#skilltree-status');
    this.buildsEl = this.root.querySelector('#skilltree-builds');
    this.nodesEl = this.root.querySelector('#skilltree-nodes');
    this.barEl = this.root.querySelector('#skilltree-bar');
    this.respecBtn = this.root.querySelector('#skilltree-respec');

    this.root.querySelector('#skilltree-close').addEventListener('click', () => this.hide());
    this.respecBtn.addEventListener('click', () => this.onRespec?.());

    this.nodesEl.addEventListener('click', (e) => {
      const learnBtn = e.target.closest('[data-action="learn"]');
      if (learnBtn) {
        e.preventDefault();
        e.stopPropagation();
        const skillId = learnBtn.dataset.skillId;
        if (skillId) this.handleLearn(skillId);
        return;
      }

      const node = e.target.closest('.skilltree-node--unlocked');
      if (node && this.selectedSlot != null) {
        e.preventDefault();
        this.onSetSlot?.(this.selectedSlot, node.dataset.skillId);
      }
    });

    this.buildsEl.addEventListener('click', (e) => {
      const card = e.target.closest('.skilltree-build-card');
      if (!card) return;
      const buildId = card.dataset.build;
      const builds = this.currentPlayer?.skillBuilds ?? {};
      const build = builds[buildId];
      if (!build?.skills) return;
      for (const el of this.nodesEl.querySelectorAll('.skilltree-node')) {
        el.classList.toggle('skilltree-node--build', build.skills.includes(el.dataset.skillId));
      }
    });
  }

  handleLearn(skillId) {
    const skill = SKILLS[skillId];
    this.setStatus(skill ? `Learning ${skill.name}...` : 'Learning skill...');
    this.onLearn?.(skillId);
  }

  setStatus(message) {
    this.statusMessage = message ?? '';
    if (!this.statusEl) return;
    if (!this.statusMessage) {
      this.statusEl.textContent = '';
      this.statusEl.classList.add('hidden');
      return;
    }
    this.statusEl.textContent = this.statusMessage;
    this.statusEl.classList.remove('hidden');
  }

  getRenderKey(player) {
    return JSON.stringify({
      level: player.level,
      skillPoints: player.skillPoints,
      gold: player.gold,
      unlockedSkills: player.unlockedSkills,
      skillBarSlots: player.skillBarSlots,
      skillTree: player.skillTree,
      skillBuilds: player.skillBuilds,
      respecGoldCost: player.respecGoldCost,
      townFeaturesEnabled: this.townFeaturesEnabled,
      selectedSlot: this.selectedSlot,
    });
  }

  shouldRender(player) {
    const key = this.getRenderKey(player);
    if (key === this.lastRenderKey) return false;
    this.lastRenderKey = key;
    return true;
  }

  isVisible() {
    return !this.root.classList.contains('hidden');
  }

  isPaused() {
    return this.paused;
  }

  update(player, options = {}) {
    if (!player) return;

    const prevUnlocked = JSON.stringify(this.currentPlayer?.unlockedSkills ?? []);
    this.currentPlayer = player;
    this.townFeaturesEnabled = !!options.townFeaturesEnabled;
    if (!this.isVisible()) return;

    const nextUnlocked = JSON.stringify(player.unlockedSkills ?? []);
    if (prevUnlocked !== nextUnlocked && this.statusMessage.startsWith('Learning')) {
      this.setStatus('');
    }

    if (this.shouldRender(player)) {
      this.render(player);
    }
  }

  open(player, options = {}) {
    this.currentPlayer = player;
    this.townFeaturesEnabled = !!options.townFeaturesEnabled;
    this.selectedSlot = null;
    this.lastRenderKey = '';
    this.setStatus('');
    this.render(player);
    this.lastRenderKey = this.getRenderKey(player);
    this.root.classList.remove('hidden');
    this.setPaused(true);
  }

  hide() {
    this.root.classList.add('hidden');
    this.selectedSlot = null;
    this.lastRenderKey = '';
    this.setStatus('');
    this.setPaused(false);
    const active = document.activeElement;
    if (active && this.root.contains(active)) active.blur();
    this.onRequestCanvasFocus?.();
  }

  setPaused(paused) {
    this.paused = paused;
    this.onPauseChange?.(paused);
  }

  render(player) {
    const points = player.skillPoints ?? 0;
    const gold = player.gold ?? 0;
    const cost = player.respecGoldCost ?? 0;

    this.summaryEl.textContent = `Level ${player.level ?? 1} · ${gold} gold`;
    this.pointsEl.textContent = `Skill points to spend: ${points}`;

    this.renderBuilds(player);
    this.renderNodes(player);
    this.renderBar(player);

    this.respecBtn.disabled = !this.townFeaturesEnabled;
    this.respecBtn.textContent = this.townFeaturesEnabled
      ? `Respec (${cost} gold)`
      : 'Respec (town only)';
  }

  renderBuilds(player) {
    const builds = player.skillBuilds ?? {};
    const entries = Object.entries(builds);
    if (entries.length === 0) {
      this.buildsEl.innerHTML = '';
      return;
    }

    this.buildsEl.innerHTML = `
      <h3 class="skilltree-section-label">Builds</h3>
      <div class="skilltree-build-list">
        ${entries
          .map(([id, build]) => {
            const skills = (build.skills ?? [])
              .map((skillId) => SKILLS[skillId]?.name ?? skillId)
              .join(' · ');
            return `
              <div class="skilltree-build-card" data-build="${id}">
                <span class="skilltree-build-name">${build.name}</span>
                <span class="skilltree-build-desc">${build.description ?? skills}</span>
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    this.lastBuildHighlight = null;
  }

  renderNodes(player) {
    const tree = player.skillTree ?? {};
    const unlocked = new Set(player.unlockedSkills ?? []);
    const byTier = new Map();

    for (const [skillId, node] of Object.entries(tree)) {
      const tier = node.tier ?? 1;
      if (!byTier.has(tier)) byTier.set(tier, []);
      byTier.get(tier).push({ skillId, node });
    }

    const tiers = [...byTier.keys()].sort((a, b) => a - b);
    this.nodesEl.innerHTML = tiers
      .map((tier) => {
        const nodes = byTier.get(tier) ?? [];
        return `
          <div class="skilltree-tier">
            <h3 class="skilltree-section-label">Tier ${tier}</h3>
            <div class="skilltree-tier-nodes">
              ${nodes.map(({ skillId, node }) => this.renderNode(skillId, node, unlocked, player)).join('')}
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderNode(skillId, node, unlocked, player) {
    const skill = SKILLS[skillId];
    if (!skill) return '';

    const isUnlocked = unlocked.has(skillId);
    const canLearn = this.canLearnLocally(skillId, node, unlocked, player);
    const resource = getSkillResourceCost(skill);
    const reqText =
      (node.requires ?? []).length > 0
        ? `Requires: ${node.requires.map((id) => SKILLS[id]?.name ?? id).join(', ')}`
        : '';

    return `
      <div class="skilltree-node${isUnlocked ? ' skilltree-node--unlocked' : ''}${canLearn ? ' skilltree-node--available' : ''}"
           data-skill-id="${skillId}">
        <span class="skilltree-node-icon">${skill.icon}</span>
        <div class="skilltree-node-body">
          <span class="skilltree-node-name">${skill.name}</span>
          ${
            skill.description
              ? `<span class="skilltree-node-desc">${skill.description}</span>`
              : ''
          }
          <span class="skilltree-node-meta">${node.cost ?? 1} pt · ${resource.amount} ${resource.unit}</span>
          ${reqText ? `<span class="skilltree-node-req">${reqText}</span>` : ''}
        </div>
        ${
          isUnlocked
            ? '<span class="skilltree-node-badge">Learned</span>'
            : canLearn
              ? `<button type="button" class="skilltree-learn-btn" data-action="learn" data-skill-id="${skillId}">Learn</button>`
              : '<span class="skilltree-node-badge skilltree-node-badge--locked">Locked</span>'
        }
      </div>
    `;
  }

  canLearnLocally(skillId, node, unlocked, player) {
    if (unlocked.has(skillId)) return false;
    if ((player.skillPoints ?? 0) < (node.cost ?? 1)) return false;
    for (const req of node.requires ?? []) {
      if (!unlocked.has(req)) return false;
    }
    return true;
  }

  renderBar(player) {
    const slots = player.skillBarSlots ?? player.skillBar?.map((s) => s?.id ?? null) ?? [];
    this.barEl.innerHTML = '';

    for (let i = 0; i < SKILL_HOTKEY_COUNT; i++) {
      const skillId = slots[i] ?? null;
      const skill = skillId ? SKILLS[skillId] : null;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `skilltree-bar-slot${this.selectedSlot === i ? ' skilltree-bar-slot--selected' : ''}`;
      btn.dataset.slot = String(i);
      btn.innerHTML = skill
        ? `<span class="skilltree-bar-key">${i + 1}</span><span class="skilltree-bar-icon">${skill.icon}</span><span class="skilltree-bar-name">${skill.name}</span>`
        : `<span class="skilltree-bar-key">${i + 1}</span><span class="skilltree-bar-empty">Empty</span>`;
      btn.addEventListener('click', () => {
        this.selectedSlot = this.selectedSlot === i ? null : i;
        this.lastRenderKey = '';
        this.renderBar(player);
        this.lastRenderKey = this.getRenderKey(player);
      });
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.onSetSlot?.(i, null);
      });
      this.barEl.appendChild(btn);
    }
  }
}
