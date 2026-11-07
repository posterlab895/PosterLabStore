/* ============================================================
   Store-side admin access
   - recognises the store owner account (posterlab895@gmail.com)
   - adds a settings-gear button next to the account icon
   - adds an "Admin panel" entry inside the slide-out menu
   - lets the owner sign in with the admin credentials on the
     normal account form and unlocks the admin panel
   Loaded AFTER script.min.js so it can decorate / wrap the app.
   ============================================================ */
(function () {
  'use strict';

  var ADMIN_EMAIL = 'posterlab895@gmail.com';
  var ADMIN_PASSWORD = 'Poster895Lab$';
  var SESSION_KEY = 'pls-session';
  var ADMIN_SESSION_KEY = 'pls-admin-session';
  var PANEL_URL = 'admin/panel.html';

  var GEAR_SVG =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="3"/>' +
    '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' +
    '</svg>';

  function readSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isAdminEmail(email) {
    return String(email || '').toLowerCase().trim() === ADMIN_EMAIL;
  }

  function isAdminSession() {
    var session = readSession();
    return !!(session && isAdminEmail(session.email));
  }

  function rememberAdminAccess() {
    if (!isAdminSession()) return;
    try { localStorage.setItem(ADMIN_SESSION_KEY, 'true'); } catch (e) { /* ignore */ }
  }

  /* ── Header gear button (next to the account icon) ── */
  function syncHeaderGear() {
    var admin = isAdminSession();
    var actions = document.querySelectorAll('.header-actions');
    for (var i = 0; i < actions.length; i++) {
      var bar = actions[i];
      var gear = bar.querySelector('[data-admin-gear]');
      if (admin && !gear) {
        gear = document.createElement('a');
        gear.className = 'account-button is-logged-in admin-gear-button';
        gear.href = PANEL_URL;
        gear.setAttribute('data-admin-gear', '');
        gear.setAttribute('aria-label', 'Open admin panel');
        gear.setAttribute('title', 'Admin panel');
        gear.innerHTML = GEAR_SVG;
        var account = bar.querySelector('[data-account-btn]');
        if (account) bar.insertBefore(gear, account);
        else bar.appendChild(gear);
      } else if (!admin && gear) {
        gear.parentNode.removeChild(gear);
      }
    }
  }

  /* ── "Admin panel" entry inside the slide-out menu ── */
  function addNavAdminLink() {
    if (!isAdminSession()) return;
    var body = document.querySelector('[data-nav-body]');
    if (!body || body.querySelector('[data-admin-nav]')) return;
    var link = document.createElement('a');
    link.href = PANEL_URL;
    link.setAttribute('data-admin-nav', '');
    link.setAttribute('data-nav-close', '');
    link.textContent = '⚙️ Admin panel';
    link.style.color = 'var(--accent-strong)';
    link.style.fontWeight = '900';
    var divider = body.querySelector('.nav-divider');
    if (divider) body.insertBefore(link, divider);
    else body.appendChild(link);
  }

  function syncAdminUI() {
    rememberAdminAccess();
    syncHeaderGear();
    addNavAdminLink();
  }

  /* ── Admin credentials on the normal store login form ── */
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var btn = target.closest('#accountLoginBtn');
    if (!btn) return;

    var emailEl = document.getElementById('accountEmail');
    var pwdEl = document.getElementById('accountPassword');
    if (!emailEl || !pwdEl) return;

    var email = String(emailEl.value || '').trim().toLowerCase();
    var password = String(pwdEl.value || '').trim();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      /* Handle it here so the admin account works even if it was
         never created inside Firebase Authentication. */
      e.preventDefault();
      e.stopPropagation();
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          id: 'pls-admin',
          name: 'Poster Lab Admin',
          email: ADMIN_EMAIL,
          phone: '',
          deliveryAddress: '',
          addresses: []
        }));
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch (err) { /* private mode */ }
      var panel = document.querySelector('[data-account-panel]');
      if (panel) panel.remove();
      window.location.reload();
    }
  }, true);

  /* ── Keep the UI in sync when the app updates the account ── */
  function wrapAppFunctions() {
    var updateUserUI = window.updateUserUI;
    if (typeof updateUserUI === 'function' && !updateUserUI.__plsAdminWrapped) {
      var wrappedUpdate = function () {
        var result = updateUserUI.apply(this, arguments);
        try { syncAdminUI(); } catch (e) { /* ignore */ }
        return result;
      };
      wrappedUpdate.__plsAdminWrapped = true;
      window.updateUserUI = wrappedUpdate;
    }

    var logoutUser = window.logoutUser;
    if (typeof logoutUser === 'function' && !logoutUser.__plsAdminWrapped) {
      var wrappedLogout = function () {
        var session = readSession();
        if (session && isAdminEmail(session.email)) {
          try { localStorage.removeItem(ADMIN_SESSION_KEY); } catch (e) { /* ignore */ }
        }
        return logoutUser.apply(this, arguments);
      };
      wrappedLogout.__plsAdminWrapped = true;
      window.logoutUser = wrappedLogout;
    }
  }

  function watchNavBody() {
    var body = document.querySelector('[data-nav-body]');
    if (!body || !('MutationObserver' in window)) return;
    new MutationObserver(function () {
      try { addNavAdminLink(); } catch (e) { /* ignore */ }
    }).observe(body, { childList: true });
  }

  function init() {
    wrapAppFunctions();
    syncAdminUI();
    watchNavBody();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', function () {
    try { syncAdminUI(); } catch (e) { /* ignore */ }
  });
  window.addEventListener('storage', function () {
    try { syncAdminUI(); } catch (e) { /* ignore */ }
  });
})();
