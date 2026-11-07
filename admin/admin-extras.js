/* ============================================================
   Admin panel extras
   - "Store" button in the header that goes back to the shop
   - "Reset Orders" button that clears local + Firestore orders
     so the dashboard reads 0 orders
   Loaded after admin-panel.min.js.
   ============================================================ */
(function () {
  'use strict';

  var ORDERS_KEY = 'pls-orders';

  try {
    if (localStorage.getItem('pls-admin-session') !== 'true') return;
  } catch (e) {
    /* storage blocked (e.g. opened from file://) — do nothing */
    return;
  }

  function getDb() {
    try {
      if (typeof initFirebase === 'function') initFirebase();
      if (typeof getFirebaseDb === 'function') return getFirebaseDb();
    } catch (e) { /* ignore */ }
    return null;
  }

  /* ── Store (back to shop) button ── */
  function addStoreButton() {
    var right = document.querySelector('.admin-header-right');
    if (!right || right.querySelector('[data-store-btn]')) return;
    var link = document.createElement('a');
    link.className = 'secondary-button';
    link.href = '../index.html';
    link.setAttribute('data-store-btn', '');
    link.setAttribute('aria-label', 'Back to the store');
    link.textContent = '🏪 Store';
    link.style.textDecoration = 'none';
    link.style.display = 'inline-flex';
    link.style.alignItems = 'center';
    right.insertBefore(link, right.firstChild);
  }

  function makeResetButton(className, text) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute('data-reset-orders', '');
    btn.textContent = text;
    btn.style.borderColor = 'var(--danger)';
    btn.style.color = 'var(--danger)';
    btn.addEventListener('click', resetOrders);
    return btn;
  }

  function addResetButtons() {
    var header = document.querySelector('.admin-section-header');
    var ordersHeader = document.querySelector('#adminTabOrders .admin-section-header');
    if (ordersHeader && !ordersHeader.querySelector('[data-reset-orders]')) {
      ordersHeader.appendChild(makeResetButton('secondary-button', 'Reset Orders (0)'));
    }
    var quick = document.querySelector('#adminTabDashboard .admin-quick-actions');
    if (quick && !quick.querySelector('[data-reset-orders]')) {
      quick.appendChild(makeResetButton('secondary-link', 'Reset all orders (0)'));
    }
    if (!ordersHeader && header && !header.querySelector('[data-reset-orders]')) {
      header.appendChild(makeResetButton('secondary-button', 'Reset Orders (0)'));
    }
  }

  /* ── Delete every order from Firestore (chunked batches) ── */
  function deleteOrdersFromFirestore() {
    return new Promise(function (resolve) {
      var db = getDb();
      if (!db) { resolve({ ok: false, error: 'Firestore is not available' }); return; }
      db.collection('orders').get().then(function (snap) {
        var docs = [];
        snap.forEach(function (doc) { docs.push(doc); });
        if (!docs.length) { resolve({ ok: true, deleted: 0 }); return; }

        var batches = [];
        for (var i = 0; i < docs.length; i += 400) {
          var batch = db.batch();
          docs.slice(i, i + 400).forEach(function (doc) { batch.delete(doc.ref); });
          batches.push(batch.commit());
        }
        Promise.all(batches)
          .then(function () { resolve({ ok: true, deleted: docs.length }); })
          .catch(function (e) { resolve({ ok: false, error: (e && e.message) || 'delete failed' }); });
      }).catch(function (e) {
        resolve({ ok: false, error: (e && e.message) || 'could not read orders' });
      });
    });
  }

  function resetOrders() {
    if (!window.confirm('Delete ALL orders? This clears local and cloud orders and cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure? The order count will become 0.')) return;

    var buttons = document.querySelectorAll('[data-reset-orders]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.disabled = true;
      b.textContent = 'Resetting…';
    });

    deleteOrdersFromFirestore().then(function (result) {
      try { localStorage.removeItem(ORDERS_KEY); } catch (e) { /* ignore */ }

      if (!result.ok) {
        window.alert(
          'Local orders were cleared, but deleting cloud orders failed:\n' +
          result.error +
          '\n\nThey may return on the next sync. Check your Firestore rules/connection.'
        );
      } else {
        window.alert('Done — ' + result.deleted + ' order(s) deleted. The panel will show 0 orders.');
      }
      window.location.reload();
    });
  }

  function init() {
    addStoreButton();
    addResetButtons();

    var app = document.getElementById('adminApp');
    if (app && 'MutationObserver' in window) {
      new MutationObserver(function () {
        addStoreButton();
        addResetButtons();
      }).observe(app, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
