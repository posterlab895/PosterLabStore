(function () {
  'use strict';

  const SESSION_KEY    = 'pls-admin-session';
  const EMAIL_KEY      = 'pls-admin-email';
  const REQUIRED_EMAIL = 'posterlab895@gmail.com';
  const DEFAULT_PWD    = 'Poster895Lab$';

  const $ = (s, p) => (p || document).querySelector(s);

  function isValidLogin(email, pwd) {
    if (!email || !pwd) return false;
    const cleanEmail = email.trim().toLowerCase();
    const cleanPwd = pwd.trim();
    if (cleanEmail !== REQUIRED_EMAIL) return false;
    return cleanPwd === DEFAULT_PWD || cleanPwd === 'Poster895Lab';
  }

  function setSession(y) {
    if (y) {
      localStorage.setItem(SESSION_KEY, 'true');
      localStorage.setItem(EMAIL_KEY, REQUIRED_EMAIL);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(EMAIL_KEY);
    }
  }

  function doLogin() {
    const emailInput = $('#adminEmail');
    const pwdInput = $('#adminPassword');
    const errEl = $('#adminLoginError');
    const email = emailInput ? emailInput.value : REQUIRED_EMAIL;
    const pwd = pwdInput ? pwdInput.value : '';

    if (isValidLogin(email, pwd)) {
      setSession(true);
      window.location.href = 'panel.html';
    } else {
      if (errEl) {
        errEl.hidden = false;
        if (email.trim().toLowerCase() !== REQUIRED_EMAIL) {
          errEl.textContent = 'Access restricted: Only ' + REQUIRED_EMAIL + ' can log in.';
        } else {
          errEl.textContent = 'Incorrect password.';
        }
      }
      if (pwdInput) {
        pwdInput.focus();
        pwdInput.select();
      }
    }
  }

  function togglePasswordVisibility() {
    const input = $('#adminPassword');
    const btn = $('#togglePasswordBtn');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.textContent = '🔒';
    } else {
      input.type = 'password';
      if (btn) btn.textContent = '👁';
    }
  }

  function updateThemeUI() {
    const theme = localStorage.getItem('poster-lab-theme') || 'light';
    document.documentElement.dataset.theme = theme;
    const icon = $('#themeToggleIcon');
    if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀';
  }

  function toggleTheme() {
    const cur = localStorage.getItem('poster-lab-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem('poster-lab-theme', next);
    updateThemeUI();
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') doLogin();
  }

  function init() {
    // If coming from an explicit logout action, clear all tokens and NEVER auto-redirect!
    if (window.location.search.includes('logout')) {
      setSession(false);
      try {
        localStorage.removeItem('pls-session');
        if (typeof firebase !== 'undefined' && firebase.auth) {
          firebase.auth().signOut().catch(() => {});
        }
      } catch (_) {}
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch (_) {}
    } else {
      // Only auto-redirect if an active valid session exists and NOT logging out
      const hasSession = localStorage.getItem(SESSION_KEY) === 'true';
      const sessionEmail = (localStorage.getItem(EMAIL_KEY) || '').toLowerCase().trim();
      if (hasSession && sessionEmail === REQUIRED_EMAIL) {
        window.location.href = 'panel.html';
        return;
      }
    }

    updateThemeUI();

    const loginBtn = $('#adminLoginBtn');
    if (loginBtn) loginBtn.addEventListener('click', doLogin);

    const toggleBtn = $('#togglePasswordBtn');
    if (toggleBtn) toggleBtn.addEventListener('click', togglePasswordVisibility);

    const themeBtn = $('#themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    document.addEventListener('keydown', handleKeydown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

document.addEventListener('click', function(e) {
  var backLink = e.target.closest('.admin-back-link, .admin-brand-link, [data-store-link]');
  if (backLink) {
    e.preventDefault();
    if (typeof getStoreHomeUrl === 'function') {
      window.location.href = getStoreHomeUrl();
    } else {
      var p = window.location.pathname;
      if (window.location.hostname.includes('github.io')) {
        var parts = p.split('/').filter(Boolean);
        var repo = (parts.length > 0 && parts[0].toLowerCase() === 'posterlabstore') ? parts[0] : 'PosterLabStore';
        window.location.href = window.location.origin + '/' + repo + '/index.html';
      } else {
        window.location.href = '../index.html';
      }
    }
  }
});
