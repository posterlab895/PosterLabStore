/* ── Admin Extras Controller ──
   Poster Lab Store Admin Extras:
   - Skips adding duplicate Store button (retains existing "← Store")
   - Adds "Reset Orders (0)" button to Dashboard & Orders tab (clears Local + Firestore)
*/
(function () {
  'use strict';

  var ORDERS_KEY = 'pls-orders';

  function getLocalOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    } catch (_) {
      return [];
    }
  }

  function getOrderCount() {
    return getLocalOrders().length;
  }

  function updateResetButtonsText() {
    var count = getOrderCount();
    var btns = document.querySelectorAll('.admin-reset-orders-btn');
    btns.forEach(function (b) {
      b.textContent = '🗑️ Reset Orders (' + count + ')';
    });
  }

  function ensureStoreButton() {
    var headerRight = document.querySelector('.admin-header-right');
    if (!headerRight) return;

    // Check if a store button already exists
    var existingStoreBtn = headerRight.querySelector('a[href*="index.html"], a[data-store-link]');
    if (existingStoreBtn) {
      // Already has store button — skip adding duplicate
      return;
    }

    var storeLink = document.createElement('a');
    storeLink.className = 'secondary-button';
    storeLink.setAttribute('data-store-link', '');
    storeLink.style.textDecoration = 'none';
    storeLink.style.display = 'inline-flex';
    storeLink.style.alignItems = 'center';
    storeLink.style.gap = '6px';
    storeLink.style.fontSize = '0.85rem';
    storeLink.innerHTML = '<span>←</span> <span>Store</span>';

    if (typeof getStoreHomeUrl === 'function') {
      storeLink.href = getStoreHomeUrl();
    } else {
      storeLink.href = '../index.html';
    }

    var logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      headerRight.insertBefore(storeLink, logoutBtn);
    } else {
      headerRight.appendChild(storeLink);
    }
  }

  async function handleResetOrders() {
    var count = getOrderCount();
    var msg = count === 0
      ? 'Orders list is currently empty (0 orders). Do you want to run clean-up anyway?'
      : '⚠️ DANGER: Are you sure you want to delete ALL ' + count + ' orders?\n\nThis will permanently delete all orders from both local storage and the Firestore database.\nThis action cannot be undone!';

    if (!window.confirm(msg)) return;

    var btn = document.querySelector('.admin-reset-orders-btn');
    if (btn) btn.disabled = true;

    // 1. Reset Local Storage
    localStorage.setItem(ORDERS_KEY, '[]');

    // 2. Delete all orders from Firestore if accessible
    var firestoreCleared = false;
    try {
      var db = null;
      if (typeof ensureFirebaseReady === 'function') {
        db = await ensureFirebaseReady(3500);
      } else if (typeof getFirebaseDb === 'function') {
        db = getFirebaseDb();
      }

      if (db) {
        var snap = await db.collection('orders').get();
        if (!snap.empty) {
          var batch = db.batch ? db.batch() : null;
          if (batch) {
            snap.forEach(function (doc) {
              batch.delete(doc.ref);
            });
            await batch.commit();
          } else {
            var delPromises = [];
            snap.forEach(function (doc) {
              delPromises.push(doc.ref.delete());
            });
            await Promise.all(delPromises);
          }
          firestoreCleared = true;
        }
      }
    } catch (e) {
      console.warn('[Admin Extras] Firestore delete error (local storage was cleared):', e);
    }

    // 3. Update UI
    updateResetButtonsText();

    var statOrders = document.getElementById('statTotalOrders');
    if (statOrders) statOrders.textContent = '0';
    var statPending = document.getElementById('statPendingOrders');
    if (statPending) statPending.textContent = '0';
    var statRevenue = document.getElementById('statTotalRevenue');
    if (statRevenue) statRevenue.textContent = 'EGP 0';
    var statsHeader = document.getElementById('adminStatsHeader');
    if (statsHeader) statsHeader.textContent = '0 orders · EGP 0';

    var recentOrders = document.getElementById('adminRecentOrders');
    if (recentOrders) {
      recentOrders.innerHTML = '<p class="admin-empty-table" style="padding:20px;text-align:center;color:var(--muted)">No orders yet.</p>';
    }
    var ordersList = document.getElementById('adminOrdersList');
    if (ordersList) {
      ordersList.innerHTML = '<p class="admin-empty-table" style="padding:30px;text-align:center;color:var(--muted)">No orders found.</p>';
    }

    var successMsg = firestoreCleared
      ? 'All orders have been permanently reset to 0 (Local & Firestore).'
      : 'All orders have been reset to 0.';

    if (typeof showAdminToast === 'function') {
      showAdminToast(successMsg, 'success', 8000);
    } else {
      window.alert(successMsg);
    }

    if (btn) btn.disabled = false;
  }

  function injectResetButtons() {
    var count = getOrderCount();

    // 1. In Dashboard Quick Actions
    var quickActions = document.querySelector('#adminTabDashboard .admin-quick-actions');
    if (quickActions && !quickActions.querySelector('.admin-reset-orders-btn')) {
      var dashBtn = document.createElement('button');
      dashBtn.type = 'button';
      dashBtn.className = 'secondary-link admin-reset-orders-btn';
      dashBtn.style.color = 'var(--danger, #ff6f61)';
      dashBtn.style.borderColor = 'var(--danger, #ff6f61)';
      dashBtn.style.cursor = 'pointer';
      dashBtn.style.fontWeight = '700';
      dashBtn.style.fontSize = '0.9rem';
      dashBtn.textContent = '🗑️ Reset Orders (' + count + ')';
      dashBtn.addEventListener('click', handleResetOrders);
      quickActions.appendChild(dashBtn);
    }

    // 2. In Orders Tab Filter Bar
    var orderFilters = document.querySelector('#adminTabOrders .admin-order-filters');
    if (orderFilters && !orderFilters.querySelector('.admin-reset-orders-btn')) {
      var ordersBtn = document.createElement('button');
      ordersBtn.type = 'button';
      ordersBtn.className = 'secondary-button admin-reset-orders-btn';
      ordersBtn.style.color = 'var(--danger, #ff6f61)';
      ordersBtn.style.borderColor = 'var(--danger, #ff6f61)';
      ordersBtn.style.cursor = 'pointer';
      ordersBtn.style.fontWeight = '700';
      ordersBtn.style.fontSize = '0.85rem';
      ordersBtn.style.whiteSpace = 'nowrap';
      ordersBtn.textContent = '🗑️ Reset Orders (' + count + ')';
      ordersBtn.addEventListener('click', handleResetOrders);
      orderFilters.appendChild(ordersBtn);
    }
  }

  function init() {
    ensureStoreButton();
    injectResetButtons();
    updateResetButtonsText();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('storage', updateResetButtonsText);
  window.addEventListener('load', init);
  setInterval(updateResetButtonsText, 2000);
})();
