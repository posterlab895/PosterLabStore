/* ── Admin Access Controller ──
   Poster Lab Store: Gear Icon, Nav Menu Entry & Session Management
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
      // 1. Check pls-session in localStorage (active user in store)
      var rawSession = localStorage.getItem('pls-session');
      if (rawSession) {
        var user = JSON.parse(rawSession);
        if (user && user.email && user.email.toLowerCase().trim() === REQUIRED_EMAIL) {
          return true;
        }
      }
      // 2. Check window.state.user
      if (typeof window !== 'undefined' && window.state && window.state.user && window.state.user.email) {
        if (window.state.user.email.toLowerCase().trim() === REQUIRED_EMAIL) {
          return true;
        }
      }
      // 3. Check Firebase Auth if available
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        var cur = firebase.auth().currentUser;
        if (cur.email && cur.email.toLowerCase().trim() === REQUIRED_EMAIL) {
          return true;
        }
      }
      // Note: We do NOT use pls-admin-session alone as the source of truth,
      // so logging out can never be prevented by a circular re-activation!
    } catch (_) {}
    return false;
  }

  function syncAdminSession(isAdmin) {
    try {
      if (isAdmin) {
        localStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(EMAIL_KEY, REQUIRED_EMAIL);
      } else {
        // If not actively authenticated as admin, clear admin tokens
        var rawSession = localStorage.getItem('pls-session');
        if (!rawSession) {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(EMAIL_KEY);
        } else {
          var user = JSON.parse(rawSession);
          if (!user || !user.email || user.email.toLowerCase().trim() !== REQUIRED_EMAIL) {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(EMAIL_KEY);
          }
        }
      }
    } catch (_) {}
  }

  function renderGearButton(isAdmin) {
    var gearBtn = document.getElementById('adminGearBtn');
    if (!isAdmin) {
      if (gearBtn) gearBtn.remove();
      return;
    }

    var targetContainer = document.querySelector('.header-actions');
    if (!targetContainer) return;

    var adminUrl = getAdminPanelUrl();

    if (!gearBtn) {
      gearBtn = document.createElement('a');
      gearBtn.id = 'adminGearBtn';
      gearBtn.className = 'header-admin-gear';
      gearBtn.href = adminUrl;
      gearBtn.setAttribute('aria-label', 'Admin panel');
      gearBtn.setAttribute('title', 'Admin panel');
      // Inline styles ensure the gear renders cleanly even without enhancements.css
      gearBtn.style.display = 'inline-flex';
      gearBtn.style.alignItems = 'center';
      gearBtn.style.justifyContent = 'center';
      gearBtn.style.width = '38px';
      gearBtn.style.height = '38px';
      gearBtn.style.borderRadius = '50%';
      gearBtn.style.background = 'var(--surface, #ffffff)';
      gearBtn.style.border = '1px solid var(--line, rgba(0,0,0,0.12))';
      gearBtn.style.color = 'var(--text-strong, #12110f)';
      gearBtn.style.fontSize = '1.15rem';
      gearBtn.style.textDecoration = 'none';
      gearBtn.style.cursor = 'pointer';
      gearBtn.style.transition = 'transform 180ms ease, background 180ms ease, border-color 180ms ease';
      gearBtn.style.flexShrink = '0';
      gearBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
      gearBtn.innerHTML = '<span style="transform:translateY(-1px);display:inline-block">⚙️</span>';

      gearBtn.addEventListener('mouseenter', function () {
        gearBtn.style.transform = 'scale(1.08) rotate(30deg)';
        gearBtn.style.borderColor = 'var(--accent, #0f9f85)';
      });
      gearBtn.addEventListener('mouseleave', function () {
        gearBtn.style.transform = 'scale(1) rotate(0deg)';
        gearBtn.style.borderColor = 'var(--line, rgba(0,0,0,0.12))';
      });

      var accountBtn = targetContainer.querySelector('[data-account-btn]');
      if (accountBtn) {
        targetContainer.insertBefore(gearBtn, accountBtn);
      } else {
        targetContainer.appendChild(gearBtn);
      }
    } else {
      gearBtn.href = adminUrl;
    }
  }

  function renderMenuEntry(isAdmin) {
    var navBody = document.querySelector('[data-nav-body]');
    var existingLink = document.querySelector('.nav-admin-entry');

    if (!isAdmin) {
      if (existingLink) existingLink.remove();
      return;
    }

    if (!navBody) return;

    var adminUrl = getAdminPanelUrl();

    if (!existingLink) {
      existingLink = document.createElement('a');
      existingLink.className = 'nav-admin-entry';
      existingLink.href = adminUrl;
      existingLink.setAttribute('data-nav-close', '');
      existingLink.style.display = 'flex';
      existingLink.style.alignItems = 'center';
      existingLink.style.gap = '10px';
      existingLink.style.padding = '10px 14px';
      existingLink.style.margin = '8px 0';
      existingLink.style.borderRadius = '10px';
      existingLink.style.background = 'var(--surface-2, rgba(37,99,235,0.08))';
      existingLink.style.border = '1px solid var(--accent, #0f9f85)';
      existingLink.style.color = 'var(--text-strong, #12110f)';
      existingLink.style.fontWeight = '700';
      existingLink.style.fontSize = '0.92rem';
      existingLink.style.textDecoration = 'none';
      existingLink.innerHTML = '<span>⚙️</span> <span>Admin panel</span> <span style="margin-inline-start:auto;font-size:0.75rem;padding:2px 8px;border-radius:999px;background:var(--accent,#0f9f85);color:#fff">Active</span>';

      // Insert before copyright or near bottom
      var lastLink = navBody.querySelector('a:last-of-type');
      if (lastLink) {
        navBody.insertBefore(existingLink, lastLink);
      } else {
        navBody.appendChild(existingLink);
      }
    } else {
      existingLink.href = adminUrl;
    }
  }

  function updateAdminUI() {
    var isAdmin = isAdminUser();
    syncAdminSession(isAdmin);
    renderGearButton(isAdmin);
    renderMenuEntry(isAdmin);
  }

  // Run on load and periodically
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAdminUI);
  } else {
    updateAdminUI();
  }

  window.addEventListener('storage', updateAdminUI);
  window.addEventListener('load', updateAdminUI);
  window.addEventListener('firebase-ready', updateAdminUI);

  // Poll lightly in case login modal completes without page reload
  setInterval(updateAdminUI, 1500);

  // Expose
  window.updateAdminAccessUI = updateAdminUI;
})();
