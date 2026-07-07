const TOKEN_KEY = 'mmo_auth_token';
const USERNAME_KEY = 'mmo_auth_username';

export class AuthManager {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    this.username = localStorage.getItem(USERNAME_KEY);
    this.overlay = document.getElementById('auth-overlay');
    this.loginView = document.getElementById('auth-login-view');
    this.registerView = document.getElementById('auth-register-view');
    this.errorEl = document.getElementById('auth-error');
    this.loginUsername = document.getElementById('auth-login-username');
    this.loginPassword = document.getElementById('auth-login-password');
    this.registerUsername = document.getElementById('auth-register-username');
    this.registerPassword = document.getElementById('auth-register-password');
    this.loginBtn = document.getElementById('auth-login-btn');
    this.registerBtn = document.getElementById('auth-register-btn');
    this.showRegisterBtn = document.getElementById('auth-show-register');
    this.showLoginBtn = document.getElementById('auth-show-login');
    this.logoutBtn = document.getElementById('auth-logout-btn');
    this.accountLabel = document.getElementById('auth-account-label');

    this.bindEvents();
    this.updateAccountLabel();
  }

  bindEvents() {
    this.loginBtn?.addEventListener('click', () => this.handleLogin());
    this.registerBtn?.addEventListener('click', () => this.handleRegister());
    this.showRegisterBtn?.addEventListener('click', () => this.setMode('register'));
    this.showLoginBtn?.addEventListener('click', () => this.setMode('login'));
    this.logoutBtn?.addEventListener('click', () => this.logout());

    for (const input of [this.loginPassword, this.registerPassword]) {
      input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (this.registerView?.classList.contains('hidden')) this.handleLogin();
          else this.handleRegister();
        }
      });
    }
  }

  isAuthenticated() {
    return !!this.token;
  }

  getToken() {
    return this.token;
  }

  getUsername() {
    return this.username;
  }

  updateAccountLabel() {
    if (!this.accountLabel) return;
    this.accountLabel.textContent = this.username ? `Signed in as ${this.username}` : '';
    this.logoutBtn?.classList.toggle('hidden', !this.username);
  }

  setMode(mode) {
    this.clearError();
    this.loginView?.classList.toggle('hidden', mode !== 'login');
    this.registerView?.classList.toggle('hidden', mode !== 'register');
  }

  show() {
    this.overlay?.classList.remove('hidden');
    this.setMode('login');
  }

  hide() {
    this.overlay?.classList.add('hidden');
    this.clearError();
  }

  showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('hidden');
  }

  clearError() {
    if (!this.errorEl) return;
    this.errorEl.textContent = '';
    this.errorEl.classList.add('hidden');
  }

  persistSession({ token, username }) {
    this.token = token;
    this.username = username;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
    this.updateAccountLabel();
  }

  logout() {
    this.token = null;
    this.username = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    this.updateAccountLabel();
    this.show();
    document.getElementById('character-select')?.classList.add('hidden');
    window.dispatchEvent(new CustomEvent('mmo:logout'));
  }

  async handleLogin() {
    const username = this.loginUsername?.value.trim();
    const password = this.loginPassword?.value ?? '';
    if (!username || !password) {
      this.showError('Enter username and password');
      return;
    }

    this.loginBtn.disabled = true;
    this.clearError();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        this.showError(data.error ?? 'Login failed');
        return;
      }

      this.persistSession(data);
      this.hide();
      window.dispatchEvent(new CustomEvent('mmo:authenticated', { detail: data }));
    } catch {
      this.showError('Could not reach server');
    } finally {
      this.loginBtn.disabled = false;
    }
  }

  async handleRegister() {
    const username = this.registerUsername?.value.trim();
    const password = this.registerPassword?.value ?? '';
    if (!username || !password) {
      this.showError('Enter username and password');
      return;
    }

    this.registerBtn.disabled = true;
    this.clearError();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        this.showError(data.error ?? 'Registration failed');
        return;
      }

      this.persistSession(data);
      this.hide();
      window.dispatchEvent(new CustomEvent('mmo:authenticated', { detail: data }));
    } catch {
      this.showError('Could not reach server');
    } finally {
      this.registerBtn.disabled = false;
    }
  }
}
