import { CHARACTER_CLASSES } from '/shared/constants.js';
import { fetchAppVersion, formatVersionLabel } from '../appVersion.js';

export class CharacterSelect {
  constructor({ socketClient, onStart }) {
    this.socketClient = socketClient;
    this.onStart = onStart;
    this.characters = [];
    this.selectedName = null;
    this.selectedClass = null;
    this.mode = 'select';

    this.overlay = document.getElementById('character-select');
    this.versionEl = document.getElementById('app-version');
    this.selectView = document.getElementById('character-select-view');
    this.createView = document.getElementById('character-create-view');
    this.listEl = document.getElementById('character-list');
    this.emptyEl = document.getElementById('character-list-empty');
    this.classOptionsEl = document.getElementById('class-options');
    this.nameInput = document.getElementById('player-name');
    this.playBtn = document.getElementById('play-btn');
    this.deleteBtn = document.getElementById('delete-btn');
    this.createBtn = document.getElementById('create-btn');
    this.showCreateBtn = document.getElementById('show-create-btn');
    this.showSelectBtn = document.getElementById('show-select-btn');
    this.createSubmitBtn = document.getElementById('create-submit-btn');
    this.errorEl = document.getElementById('character-error');

    this.renderClassOptions();
    this.bindEvents();
    this.loadVersionLabel();
    this.socketClient.onCharacterCreated((data) => this.onCharacterCreated(data));
    this.socketClient.onCharactersChanged(() => this.refreshCharacters());
    this.refreshCharacters();
  }

  bindEvents() {
    this.showCreateBtn.addEventListener('click', () => this.setMode('create'));
    this.showSelectBtn.addEventListener('click', () => this.setMode('select'));
    this.playBtn.addEventListener('click', () => this.handlePlay());
    this.deleteBtn.addEventListener('click', () => this.handleDelete());
    this.createSubmitBtn.addEventListener('click', () => this.handleCreate());
    this.createBtn.addEventListener('click', () => this.setMode('create'));
  }

  async loadVersionLabel() {
    if (!this.versionEl) return;
    const version = await fetchAppVersion();
    this.versionEl.textContent = formatVersionLabel(version);
  }

  renderClassOptions() {
    this.classOptionsEl.innerHTML = '';

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

      this.classOptionsEl.appendChild(card);
    }
  }

  async refreshCharacters() {
    try {
      const res = await fetch('/api/characters');
      this.characters = res.ok ? await res.json() : [];
    } catch {
      this.characters = [];
    }

    this.renderCharacterList();
    if (this.characters.length === 0) {
      this.setMode('create');
    } else if (this.mode === 'select') {
      this.setMode('select');
    }
  }

  renderCharacterList() {
    this.listEl.innerHTML = '';
    const hasChars = this.characters.length > 0;

    this.emptyEl.classList.toggle('hidden', hasChars);
    this.playBtn.disabled = true;
    this.deleteBtn.disabled = true;
    this.selectedName = null;

    for (const char of this.characters) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'character-row';
      row.dataset.name = char.name;

      const cls = CHARACTER_CLASSES[char.characterClass];
      const swatch = document.createElement('span');
      swatch.className = 'character-row-swatch';
      swatch.style.background = cls?.color ?? '#888';

      const info = document.createElement('span');
      info.className = 'character-row-info';
      info.innerHTML = `<strong>${char.name}</strong><span>${cls?.label ?? char.characterClass} · Lv ${char.level}</span>`;

      row.appendChild(swatch);
      row.appendChild(info);
      row.addEventListener('click', () => this.selectCharacter(char.name, row));

      this.listEl.appendChild(row);
    }
  }

  selectCharacter(name, rowEl) {
    this.selectedName = name;
    this.listEl.querySelectorAll('.character-row').forEach((el) => el.classList.remove('selected'));
    rowEl.classList.add('selected');
    this.playBtn.disabled = false;
    this.deleteBtn.disabled = false;
    this.clearError();
  }

  selectClass(characterClass, cardEl) {
    this.selectedClass = characterClass;
    this.classOptionsEl.querySelectorAll('.class-card').forEach((el) => el.classList.remove('selected'));
    cardEl.classList.add('selected');
    this.createSubmitBtn.disabled = false;
    this.clearError();
  }

  setMode(mode) {
    this.mode = mode;
    this.clearError();
    this.selectView.classList.toggle('hidden', mode !== 'select');
    this.createView.classList.toggle('hidden', mode !== 'create');
    this.showCreateBtn.classList.toggle('hidden', mode === 'create');
    this.showSelectBtn.classList.toggle('hidden', mode !== 'create' || this.characters.length === 0);
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('hidden');
  }

  clearError() {
    this.errorEl.textContent = '';
    this.errorEl.classList.add('hidden');
  }

  handlePlay() {
    if (!this.selectedName) return;

    this.playBtn.disabled = true;
    this.clearError();

    this.socketClient
      .ensureConnected()
      .then(() => {
        this.nameInput.blur();
        this.overlay.classList.add('hidden');
        this.onStart({ name: this.selectedName });
        this.socketClient.sendJoin(this.selectedName);
      })
      .catch((err) => {
        this.showError(err.message ?? 'Could not connect to server');
      })
      .finally(() => {
        this.playBtn.disabled = !this.selectedName;
      });
  }

  /** Return from an active game session (disconnect, duplicate login, etc.). */
  returnToSelect(message = null) {
    this.overlay.classList.remove('hidden');
    this.setMode(this.characters.length > 0 ? 'select' : 'create');
    this.refreshCharacters();
    if (message) this.showError(message);
    else this.clearError();
  }

  handleCreate() {
    if (!this.selectedClass) return;

    const name = this.nameInput.value.trim();
    if (!name) {
      this.showError('Enter a character name');
      return;
    }

    this.createSubmitBtn.disabled = true;
    this.socketClient.createCharacter({ name, characterClass: this.selectedClass });
  }

  handleDelete() {
    if (!this.selectedName) return;
    if (!window.confirm(`Delete character "${this.selectedName}"? This cannot be undone.`)) return;

    this.socketClient.deleteCharacter({ name: this.selectedName });
  }

  onCharacterCreated({ name }) {
    this.clearError();
    this.createSubmitBtn.disabled = false;
    this.nameInput.value = '';
    this.selectedClass = null;
    this.classOptionsEl.querySelectorAll('.class-card').forEach((el) => el.classList.remove('selected'));
    this.createSubmitBtn.disabled = true;

    this.refreshCharacters().then(() => {
      this.setMode('select');
      const row = this.listEl.querySelector(`[data-name="${CSS.escape(name)}"]`);
      if (row) this.selectCharacter(name, row);
    });
  }
}
