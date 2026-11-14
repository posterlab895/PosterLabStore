/* ── Admin Access Controller ──
   Poster Lab Store: Session Management & Single Admin Controller
   Authorized for: posterlab895@gmail.com
*/
(function () {
  'use strict';

  var REQUIRED_EMAIL = 'posterlab895@gmail.com';
  var SESSION_KEY = 'pls-admin-session';
  var EMAIL_KEY = 'pls-admin-email';

  function getAdminPanelUrl() {
    var origin = window.location.origin;
    var p = window.location.pathname;
    if (window.location.hostname.includes('github.io')) {
      var parts = p.split('/').filter(Boolean);
      var repo = (parts.length > 0 && parts[0].toLowerCase() === 'posterlabstore') ? parts[0] : 'PosterLabStore';
      return origin + '/' + repo + '/admin/panel.html';
    }
    if (p.includes('/admin/')) return 'panel.html';
    return 'admin/panel.html';
  }

  function isAdminUser() {
    try {
      // 1. If script.js has already evaluated isPosterLabAdmin, respect it directly
      if (typeof window !== 'undefined' && typeof window.isPosterLabAdmin === 'function') {
        return window.isPosterLabAdmin();
      }
      // 2. Only active logged-in user in store matching REQUIRED_EMAIL is admin
      var user = (typeof window !== 'undefined' && window.state && window.state.user) ? window.state.user : null;
      if (!user) {
        var rawSession = localStorage.getItem('pls-session');
        if (rawSession) {
          try { user = JSON.parse(rawSession); } catch (_) {}
        }
      }
      if (!user || !user.email) {
        return false;
      }
      return user.email.toLowerCase().trim() === REQUIRED_EMAIL;
    } catch (_) {}
    return false;
  }

  function syncAdminSession(isAdmin) {
    try {
      if (isAdmin) {
        localStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(EMAIL_KEY, REQUIRED_EMAIL);
      } else {
        // If current visitor is a guest or non-admin, remove any stale admin keys
        // so that the admin panel icon and admin access are never leaked to guests
        var user = (typeof window !== 'undefined' && window.state && window.state.user) ? window.state.user : null;
        if (!user || (user.email && user.email.toLowerCase().trim() !== REQUIRED_EMAIL)) {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(EMAIL_KEY);
        }
      }
    } catch (_) {}
  }

  function renderGearButton(isAdmin) {
    // The storefront header admin icon (.header-admin-link) is exclusively managed by script.js
    // to avoid displaying 2 settings/admin panel icons next to the account icon.
    // Ensure any stale #adminGearBtn is removed from the DOM.
    var gearBtn = document.getElementById('adminGearBtn');
    if (gearBtn) gearBtn.remove();
  }

  function renderMenuEntry(isAdmin) {
    // Mobile navigation drawer already includes the Admin Panel link via script.js renderNavMenu.
    // Ensure any separate .nav-admin-entry is cleaned up to prevent duplicate menu entries.
    var existingLink = document.querySelector('.nav-admin-entry');
    if (existingLink) existingLink.remove();
  }

  function updateAdminUI() {
    var isAdmin = isAdminUser();
    syncAdminSession(isAdmin);
    renderGearButton(isAdmin);
    renderMenuEntry(isAdmin);
    if (typeof window !== 'undefined' && typeof window.updateHeaderAdminButton === 'function') {
      window.updateHeaderAdminButton();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAdminUI);
  } else {
    updateAdminUI();
  }

  window.addEventListener('storage', updateAdminUI);
  window.addEventListener('load', updateAdminUI);
  window.addEventListener('firebase-ready', updateAdminUI);

  window.updateAdminAccessUI = updateAdminUI;
  window.isAdminUser = isAdminUser;
})();
