(function () {
  'use strict';

  const ADMIN_PWD_KEY = 'pls-admin-password';
  const SESSION_KEY   = 'pls-admin-session';
  const DEFAULT_PWD   = 'Poster895Lab$';

  const $ = (s, p) => (p || document).querySelector(s);

  function getAdminPassword() { return localStorage.getItem(ADMIN_PWD_KEY) || DEFAULT_PWD; }
  function setSession(y) { y ? localStorage.setItem(SESSION_KEY, 'true') : localStorage.removeItem(SESSION_KEY); }

  function doLogin() {
    const pwd = $('#adminPassword').value.trim();
    if (pwd === getAdminPassword()) {
      setSession(true);
      window.location.href = 'panel.html';
    } else {
      $('#adminLoginError').hidden = false;
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') doLogin();
  }

  function init() {
    // Already logged in? Go straight to panel
    if (localStorage.getItem(SESSION_KEY) === 'true') {
      window.location.href = 'panel.html';
      return;
    }
    $('#adminLoginBtn').addEventListener('click', doLogin);
    document.addEventListener('keydown', handleKeydown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();