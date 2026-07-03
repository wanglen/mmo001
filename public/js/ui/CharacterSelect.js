import { CHARACTER_CLASSES } from '/shared/constants.js';

export class CharacterSelect {
  constructor({ onStart }) {
    this.onStart = onStart;
    this.selectedClass = null;

    this.overlay = document.getElementById('character-select');
    this.optionsEl = document.getElementById('class-options');
    this.nameInput = document.getElementById('player-name');
    this.startBtn = document.getElementById('start-btn');

    this.renderOptions();
    this.startBtn.addEventListener('click', () => this.handleStart());
  }

  renderOptions() {
    this.optionsEl.innerHTML = '';

    for (const [key, cls] of Object.entries(CHARACTER_CLASSES)) {
      const card = document.createElement('div');
      card.className = 'class-card';
      card.dataset.class = key;

      const preview = document.createElement('div');
      preview.className = 'class-preview';
      preview.style.background = cls.color;

      const label = document.createElement('span');
      label.textContent = cls.label;

      card.appendChild(preview);
      card.appendChild(label);
      card.addEventListener('click', () => this.selectClass(key, card));

      this.optionsEl.appendChild(card);
    }
  }

  selectClass(characterClass, cardEl) {
    this.selectedClass = characterClass;
    this.optionsEl.querySelectorAll('.class-card').forEach((el) => el.classList.remove('selected'));
    cardEl.classList.add('selected');
    this.startBtn.disabled = false;
  }

  handleStart() {
    if (!this.selectedClass) return;

    const name = this.nameInput.value.trim() || 'Hero';
    this.overlay.classList.add('hidden');
    this.onStart({ characterClass: this.selectedClass, name });
  }
}
