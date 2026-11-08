(function () {
  'use strict';

  const SESSION_KEY    = 'pls-admin-session';
  const EMAIL_KEY      = 'pls-admin-email';
  const REQUIRED_EMAIL = 'posterlab895@gmail.com';

  // Synchronous session check — runs BEFORE DOMContentLoaded
  const sessionActive = localStorage.getItem(SESSION_KEY) === 'true';
  const sessionEmail = (localStorage.getItem(EMAIL_KEY) || '').toLowerCase().trim();
  if (!sessionActive || sessionEmail !== REQUIRED_EMAIL) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(EMAIL_KEY);
    window.location.replace('login.html');
    return;
  }

  const ORDERS_KEY   = 'pls-orders';
  const COUPONS_KEY  = 'pls-coupons';
  const PRODUCTS_KEY = 'pls-products';

  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => (p || document).querySelectorAll(s);

  function log() { if (console) console.log('[Admin]', ...arguments); }
  function err() { if (console) console.error('[Admin]', ...arguments); }

  function safeJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }

  function getOrders() { return safeJSON(ORDERS_KEY, []); }
  function saveOrders(o) { localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

  function getCoupons() { return safeJSON(COUPONS_KEY, []); }
  function saveCoupons(c) { localStorage.setItem(COUPONS_KEY, JSON.stringify(c)); }

  let _cachedAllProducts = null;
  function invalidateProductsCache() { _cachedAllProducts = null; }

  function getAdminProducts() { return safeJSON(PRODUCTS_KEY, []); }
  function saveAdminProducts(p) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(p));
    invalidateProductsCache();
  }

  function allProducts() {
    if (_cachedAllProducts) return _cachedAllProducts;
    const hard = (typeof window.products !== 'undefined' && Array.isArray(window.products))
      ? window.products
      : ((typeof products !== 'undefined' && Array.isArray(products)) ? products : []);
    const custom = getAdminProducts();
    const map = new Map();
    for (let i = 0; i < hard.length; i++) {
      const p = hard[i];
      map.set(p.id, p);
    }
    for (let i = 0; i < custom.length; i++) {
      const cp = custom[i];
      if (cp._deleted) {
        map.delete(cp.id);
      } else {
        map.set(cp.id, cp);
      }
    }
    _cachedAllProducts = Array.from(map.values());
    return _cachedAllProducts;
  }

  /* ── 15-Second Floating Admin Toast System ── */
  function showAdminToast(message, type = 'success', duration = 15000) {
    let container = document.getElementById('adminToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      container.className = 'admin-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'admin-toast admin-toast-' + type;
    const icon = type === 'danger' ? '⚠️' : type === 'info' ? 'ℹ️' : '✓';
    toast.innerHTML = `
      <span class="admin-toast-icon">${icon}</span>
      <span class="admin-toast-text">${message}</span>
      <button class="admin-toast-close" type="button" aria-label="Close">✕</button>
      <span class="admin-toast-progress" style="animation-duration: ${duration}ms"></span>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      toast.classList.remove('show');
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 250);
    };

    toast.querySelector('.admin-toast-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });
    toast.addEventListener('click', dismiss);

    timer = setTimeout(dismiss, duration);
  }

  function getCategories() {
    const cats = new Set();
    allProducts().forEach(p => { if (p.category) cats.add(p.category); });
    const order = ['custom', 'football', 'cars', 'clubs', 'anime', 'movie', 'album', 'quotes', 'islamic', 'art', 'gym', 'girls', 'games', 'cities', 'nba', 'meemes', 'pharaonic', 'rap', 'jordan'];
    return [...cats].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }

  const STATUS_COLORS = {
    pending:     'var(--warm)',
    confirmed:   'var(--accent)',
    processing:  '#4a9eff',
    shipped:     '#9b59b6',
    delivered:   'var(--accent-strong)',
    cancelled:   'var(--danger)',
  };
  const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  function statusSelect(current, orderId) {
    return `<select class="admin-status-select" data-order-id="${orderId}">${
      STATUS_OPTIONS.map(s => `<option value="${s}"${s === current ? ' selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')
    }</select>`;
  }

  function money(n) { return 'EGP ' + (Math.round(n) || 0); }

  
  /* ── Self-Contained Admin Firestore Database Integration ── */
  async function saveProductToFirestore(product) {
    try {
      let db = typeof ensureFirebaseReady === 'function' ? await ensureFirebaseReady(3000) : null;
      if (!db && typeof getFirebaseDb === 'function') db = getFirebaseDb();
      if (!db) return false;
      const clean = { ...product };
      delete clean._searchCache;
      await db.collection('products').doc(product.id).set(clean, { merge: true });
      log('Product saved to Firestore:', product.id);
      return true;
    } catch (e) {
      err('Firestore save product error:', e);
      return false;
    }
  }

  async function deleteProductFromFirestore(pid) {
    try {
      let db = typeof ensureFirebaseReady === 'function' ? await ensureFirebaseReady(3000) : null;
      if (!db && typeof getFirebaseDb === 'function') db = getFirebaseDb();
      if (!db) return false;
      await db.collection('products').doc(pid).delete();
      log('Product deleted from Firestore:', pid);
      return true;
    } catch (e) {
      err('Firestore delete product error:', e);
      return false;
    }
  }

  async function syncProductsFromFirestore(force = false) {
    try {
      let db = typeof ensureFirebaseReady === 'function' ? await ensureFirebaseReady(4000) : null;
      if (!db && typeof getFirebaseDb === 'function') db = getFirebaseDb();
      if (!db) return 0;
      const snap = await db.collection('products').get();
      if (snap.empty) return 0;
      const remote = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d && d.id) remote.push(d);
      });
      const local = getAdminProducts();
      const localMap = new Map();
      local.forEach(p => localMap.set(p.id, p));
      let changed = false;
      remote.forEach(rp => {
        const lp = localMap.get(rp.id);
        if (!lp || JSON.stringify(lp) !== JSON.stringify(rp)) {
          localMap.set(rp.id, rp);
          changed = true;
        }
      });
      if (changed) {
        saveAdminProducts(Array.from(localMap.values()));
        log('Products synced from Firestore:', remote.length);
      }
      return remote.length;
    } catch (e) {
      err('Firestore sync products error:', e);
      return 0;
    }
  }

  async function saveCouponToFirestore(coupon) {
    try {
      let db = typeof ensureFirebaseReady === 'function' ? await ensureFirebaseReady(3000) : null;
      if (!db && typeof getFirebaseDb === 'function') db = getFirebaseDb();
      if (!db) return false;
      await db.collection('coupons').doc(coupon.code.toUpperCase()).set(coupon, { merge: true });
      log('Coupon saved to Firestore:', coupon.code);
      return true;
    } catch (e) {
      err('Firestore save coupon error:', e);
      return false;
    }
  }

  async function deleteCouponFromFirestore(code) {
    try {
      let db = typeof ensureFirebaseReady === 'function' ? await ensureFirebaseReady(3000) : null;
      if (!db && typeof getFirebaseDb === 'function') db = getFirebaseDb();
      if (!db) return false;
      await db.collection('coupons').doc(code.toUpperCase()).delete();
      log('Coupon deleted from Firestore:', code);
      return true;
    } catch (e) {
      err('Firestore delete coupon error:', e);
      return false;
    }
  }

  async function syncCouponsFromFirestore(force = false) {
    try {
      let db = typeof ensureFirebaseReady === 'function' ? await ensureFirebaseReady(4000) : null;
      if (!db && typeof getFirebaseDb === 'function') db = getFirebaseDb();
      if (!db) return 0;
      const snap = await db.collection('coupons').get();
      if (snap.empty) return 0;
      const remote = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d && d.code) remote.push(d);
      });
      const local = getCoupons();
      const localMap = new Map();
      local.forEach(c => localMap.set(c.code.toUpperCase(), c));
      let changed = false;
      remote.forEach(rc => {
        const code = rc.code.toUpperCase();
        const lc = localMap.get(code);
        if (!lc || JSON.stringify(lc) !== JSON.stringify(rc)) {
          localMap.set(code, rc);
          changed = true;
        }
      });
      if (changed) {
        saveCoupons(Array.from(localMap.values()));
        log('Coupons synced from Firestore:', remote.length);
      }
      return remote.length;
    } catch (e) {
      err('Firestore sync coupons error:', e);
      return 0;
    }
  }

  // Expose to window for admin panel actions
  window.saveProductToFirestore = saveProductToFirestore;
  window.deleteProductFromFirestore = deleteProductFromFirestore;
  window.syncProductsFromFirestore = syncProductsFromFirestore;
  window.saveCouponToFirestore = saveCouponToFirestore;
  window.deleteCouponFromFirestore = deleteCouponFromFirestore;
  window.syncCouponsFromFirestore = syncCouponsFromFirestore;

  /* ── Firestore sync ── */
  let _syncing = false;

  function syncOrdersFromFirestore() {
    return new Promise(async (resolve) => {
      try {
        let db = null;
        if (typeof ensureFirebaseReady === 'function') {
          db = await ensureFirebaseReady(6000);
        } else if (typeof getFirebaseDb === 'function') {
          db = getFirebaseDb();
        }
        if (!db) {
          log('Firestore db not available yet for orders sync');
          resolve(false);
          return;
        }
        let snap;
        try {
          snap = await db.collection('orders').orderBy('date', 'desc').get();
        } catch (queryErr) {
          log('orderBy date query failed, falling back to simple get:', queryErr.message);
          snap = await db.collection('orders').get();
        }
        const local = getOrders();
        const localMap = {};
        local.forEach(o => { localMap[o.id] = o; });
        let changed = false;
        snap.forEach(doc => {
          const data = doc.data();
          if (!data || !data.id) return;
          if (!localMap[data.id]) {
            local.push(data);
            localMap[data.id] = data;
            changed = true;
          } else if (data.status && localMap[data.id].status !== data.status) {
            localMap[data.id].status = data.status;
            changed = true;
          }
        });
        local.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
        if (changed) saveOrders(local);
        log('Orders synced successfully:', local.length);
        resolve(true);
      } catch (e) {
        err('Firestore orders sync error:', e);
        resolve(false);
      }
    });
  }

  function updateOrderInFirestore(orderId, updates) {
    return new Promise(async (resolve) => {
      try {
        let db = null;
        if (typeof ensureFirebaseReady === 'function') {
          db = await ensureFirebaseReady(6000);
        } else if (typeof getFirebaseDb === 'function') {
          db = getFirebaseDb();
        }
        if (!db) { resolve(false); return; }
        await db.collection('orders').doc(orderId).update(updates);
        resolve(true);
      } catch (e) {
        err('Firestore update error:', e);
        resolve(false);
      }
    });
  }

  function updateStats() {
    const orders = getOrders();
    const total = orders.reduce((s, o) => s + (o.total || 0), 0);
    const el = $('#adminStatsHeader');
    if (el) el.textContent = orders.length + ' orders · ' + money(total);
  }

  function renderDashboard() {
    const orders = getOrders();
    const active = orders.filter(o => o.status !== 'cancelled');
    const revenue = active.reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const prods = allProducts();
    if ($('#statTotalOrders')) $('#statTotalOrders').textContent = orders.length;
    if ($('#statTotalRevenue')) $('#statTotalRevenue').textContent = money(revenue);
    if ($('#statPendingOrders')) $('#statPendingOrders').textContent = pending;
    if ($('#statProductsCount')) $('#statProductsCount').textContent = prods.length;
    const recent = orders.slice(-5).reverse();
    const wrap = $('#adminRecentOrders');
    if (wrap) {
      if (!recent.length) { wrap.innerHTML = '<p class="empty-state">No orders yet</p>'; }
      else { wrap.innerHTML = ordersTable(recent); }
    }
    updateStats();
  }

  function renderOrders() {
    const orders = getOrders();
    const filterEl = $('#adminOrderStatusFilter');
    const filter = filterEl ? filterEl.value : 'all';
    const searchEl = $('#adminOrderSearch');
    const search = searchEl ? searchEl.value.toLowerCase().trim() : '';
    let list = orders;
    if (filter !== 'all') list = list.filter(o => o.status === filter);
    if (search) list = list.filter(o =>
      (o.customerName || '').toLowerCase().includes(search) ||
      (o.customerPhone || '').includes(search) ||
      (o.id || '').toLowerCase().includes(search)
    );
    list = [...list].reverse();
    const wrap = $('#adminOrdersList');
    if (!wrap) return;
    if (!list.length) { wrap.innerHTML = '<p class="empty-state">No orders match</p>'; return; }
    wrap.innerHTML = ordersTable(list, true);
  }

  function ordersTable(orders, detail) {
    return `<table class="admin-table"><thead><tr>
      <th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th>
    </tr></thead><tbody>${orders.map(o => {
      const d = new Date(o.date);
      const dateStr = d.toLocaleDateString('en-EG', { day: '2-digit', month: 'short', year: 'numeric' });
      const itemsHtml = (detail && o.items && o.items.length)
        ? o.items.map(item => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)">
            <img src="${typeof productImageUrl === 'function' ? productImageUrl(item.image || '../assets/poster-lab-logo.webp') : (item.image || '../assets/poster-lab-logo.webp')}" alt="" style="width:32px;height:42px;object-fit:cover;border-radius:4px" onerror="this.src='../assets/poster-lab-logo.webp'">
            <span style="flex:1">${item.productName || item.name || 'Product'}</span>
            <span style="color:var(--muted);font-size:0.8rem">×${item.quantity || 1}</span>
            <span style="font-weight:700">${money(item.total || item.price || 0)}</span>
          </div>`).join('')
        : '';
      return `<tr class="admin-order-row">
        <td><strong>${o.id || '—'}</strong></td>
        <td>${dateStr}</td>
        <td>${o.customerName || '—'}<br><small style="color:var(--muted)">${o.customerPhone || ''}</small></td>
        <td>${o.items ? o.items.length : 0}</td>
        <td><strong>${money(o.total || 0)}</strong>${o.appliedCoupon ? `<div style="margin-top:3px"><span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:4px;background:rgba(217,76,61,0.12);color:var(--danger);font-size:0.75rem;font-weight:700">🏷️ ${typeof o.appliedCoupon === 'object' ? o.appliedCoupon.code : o.appliedCoupon} (-${money(o.discount || 0)})</span></div>` : ''}</td>
        <td style="font-size:0.85rem">${(o.paymentMethod || '').substring(0, 24)}</td>
        <td><span style="color:${STATUS_COLORS[o.status] || 'var(--muted)'};font-weight:900">${o.status || 'pending'}</span></td>
        <td>${statusSelect(o.status, o.id)}</td>
      </tr>${itemsHtml ? `<tr class="admin-order-details"><td colspan="8"><div style="padding:8px 0">${itemsHtml}</div></td></tr>` : ''}`;
    }).join('')}</tbody></table>`;
  }

  const productPagination = { page: 1, pageSize: 30, totalPages: 1 };

  function renderProducts() {
    const all = allProducts();
    const searchEl = $('#adminProductSearch');
    const search = searchEl ? (searchEl.value || '').toLowerCase().trim() : '';
    const catEl = $('#adminProductCategoryFilter');
    const cat = catEl ? catEl.value : 'all';
    let list = all;
    if (cat !== 'all') list = list.filter(p => p.category === cat);
    if (search) list = list.filter(p =>
      (p.id && p.id.toLowerCase().includes(search)) ||
      (p.name && p.name.toLowerCase().includes(search)) ||
      (p.nameAr && p.nameAr.toLowerCase().includes(search)) ||
      (p.tag && p.tag.toLowerCase().includes(search)) ||
      (p.tagAr && p.tagAr.toLowerCase().includes(search))
    );
    const cnt = $('#adminProductsCount');
    if (cnt) cnt.textContent = `(${list.length}/${all.length})`;
    const wrap = $('#adminProductsList');
    if (!wrap) return;
    if (!list.length) { wrap.innerHTML = '<p class="empty-state">No products match</p>'; return; }

    const total = list.length;
    productPagination.totalPages = Math.max(1, Math.ceil(total / productPagination.pageSize));
    if (productPagination.page > productPagination.totalPages) productPagination.page = productPagination.totalPages;
    if (productPagination.page < 1) productPagination.page = 1;

    const startIdx = (productPagination.page - 1) * productPagination.pageSize;
    const pageItems = list.slice(startIdx, startIdx + productPagination.pageSize);

    let html = `<table class="admin-table"><thead><tr>
      <th></th><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Sizes</th><th>Frames</th><th>Actions</th>
    </tr></thead><tbody>`;

    html += pageItems.map(p => {
      const img = p.image || '../assets/poster-lab-logo.webp';
      const imgSrc = typeof productImageUrl === 'function' ? productImageUrl(img) : img;
      return `<tr>
        <td style="width:50px"><img src="${imgSrc}" alt="" style="width:40px;height:54px;object-fit:cover;border-radius:6px" onerror="this.src='../assets/poster-lab-logo.webp'"></td>
        <td><code>${p.id}</code></td>
        <td><strong>${p.name || ''}</strong>${p.nameAr ? `<br><small style="color:var(--muted)">${p.nameAr}</small>` : ''}</td>
        <td><span style="display:inline-block;padding:2px 8px;border-radius:999px;background:var(--surface-2);font-size:0.75rem;font-weight:700">${p.category || '—'}</span></td>
        <td style="font-weight:700">${money(p.basePrice || 0)}</td>
        <td style="font-size:0.8rem">${Object.keys(p.sizes || {}).join(', ')}</td>
        <td style="font-size:0.8rem">${(p.frames || []).join(', ')}</td>
        <td>
          <button class="admin-edit-btn secondary-button" data-cmd="edit-product" data-pid="${p.id}">Edit</button>
          <button class="secondary-button" data-cmd="clone-product" data-pid="${p.id}">Clone</button>
          <button class="admin-delete-btn secondary-button" data-cmd="delete-product" data-pid="${p.id}" style="border-color:var(--danger);color:var(--danger)">Delete</button>
        </td>
      </tr>`;
    }).join('');

    html += '</tbody></table>';

    if (productPagination.totalPages > 1) {
      html += `<div class="admin-pagination">
        <span class="admin-pagination-info">Showing ${startIdx + 1}–${Math.min(startIdx + productPagination.pageSize, total)} of ${total} products</span>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="admin-pagination-btn" data-page-action="first" ${productPagination.page === 1 ? 'disabled' : ''}>« First</button>
          <button class="admin-pagination-btn" data-page-action="prev" ${productPagination.page === 1 ? 'disabled' : ''}>‹ Prev</button>
          <span style="font-size:0.85rem;font-weight:800;padding:0 8px;color:var(--text-strong)">Page ${productPagination.page} / ${productPagination.totalPages}</span>
          <button class="admin-pagination-btn" data-page-action="next" ${productPagination.page === productPagination.totalPages ? 'disabled' : ''}>Next ›</button>
          <button class="admin-pagination-btn" data-page-action="last" ${productPagination.page === productPagination.totalPages ? 'disabled' : ''}>Last »</button>
        </div>
      </div>`;
    }

    wrap.innerHTML = html;
  }

  function rebuildCategoryFilter() {
    const sel = $('#adminProductCategoryFilter');
    if (!sel) return;
    const cats = getCategories();
    const current = sel.value;
    sel.innerHTML = '<option value="all">All categories</option>' + cats.map(c => `<option value="${c}"${c === current ? ' selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('');
  }

  function renderCoupons() {
    const list = getCoupons();
    const wrap = $('#adminCouponsList');
    if (!wrap) return;
    if (!list.length) { wrap.innerHTML = '<p class="empty-state">No coupons yet. Click "+ Add Coupon" to create one.</p>'; return; }
    wrap.innerHTML = `<table class="admin-table"><thead><tr>
      <th>Code</th><th>Type</th><th>Value</th><th>Min&nbsp;Order</th><th>Used</th><th>Max</th><th>Status</th><th>Actions</th>
    </tr></thead><tbody>${list.map(c => {
      const uses = c.uses || 0;
      const max = c.maxUses || 0;
      const isMaxed = max > 0 && uses >= max;
      const statusBadge = isMaxed
        ? '<span style="color:var(--danger);font-weight:700">● Maxed Out</span>'
        : '<span style="color:var(--accent);font-weight:700">● Active</span>';
      const recentUsers = (c.usedBy && c.usedBy.length)
        ? `<div style="font-size:0.75rem;color:var(--muted);margin-top:4px">${c.usedBy.slice(-2).map(u => (u.customerName || 'Customer') + ' (' + (u.orderId || '') + ')').join(', ')}</div>`
        : '';
      return `<tr>
        <td><strong style="letter-spacing:0.04em">${c.code}</strong></td>
        <td>${c.type === 'percent' ? 'Percentage' : 'Fixed'}</td>
        <td><strong style="color:var(--accent)">${c.type === 'percent' ? c.value + '%' : money(c.value)}</strong></td>
        <td>${money(c.minOrder || 0)}</td>
        <td><strong style="color:${isMaxed ? 'var(--danger)' : 'var(--text-strong)'}">${uses}</strong>${recentUsers}</td>
        <td>${max > 0 ? max : '∞'}</td>
        <td>${statusBadge}</td>
        <td><button class="secondary-button" data-cmd="delete-coupon" data-code="${c.code}" style="border-color:var(--danger);color:var(--danger)">Delete</button></td>
      </tr>`;
    }).join('')}</tbody></table>`;
  }

  function renderAnalytics() {
    const orders = getOrders();
    const delivered = orders.filter(o => o.status === 'delivered' || o.status === 'shipped');
    const all = allProducts();
    const avg = delivered.length ? delivered.reduce((s, o) => s + (o.total || 0), 0) / delivered.length : 0;
    if ($('#analyticsAvgOrder')) $('#analyticsAvgOrder').textContent = money(Math.round(avg));
    const counts = {};
    delivered.forEach(o => (o.items || []).forEach(item => {
      const pid = item.productId || item.id;
      counts[pid] = (counts[pid] || 0) + (item.quantity || 1);
    }));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topId = sorted.length ? sorted[0][0] : null;
    const topName = topId ? (all.find(p => p.id === topId)?.name || topId) : '—';
    if ($('#analyticsTopProduct')) $('#analyticsTopProduct').textContent = topName;
    const cod = orders.filter(o => o.paymentMethod && o.paymentMethod.includes('Cash')).length;
    if ($('#analyticsConversion')) $('#analyticsConversion').textContent = orders.length ? Math.round((cod / orders.length) * 100) + '%' : '0%';
    const phones = [...new Set(orders.filter(o => o.customerPhone).map(o => o.customerPhone))];
    const repeat = phones.filter(ph => orders.filter(o => o.customerPhone === ph).length > 1).length;
    if ($('#analyticsRepeatRate')) $('#analyticsRepeatRate').textContent = phones.length ? Math.round((repeat / phones.length) * 100) + '%' : '0%';
    const monthly = {};
    orders.forEach(o => {
      const d = new Date(o.date);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      monthly[key] = (monthly[key] || 0) + (o.total || 0);
    });
    const months = Object.keys(monthly).sort();
    const chart = $('#analyticsChart');
    if (chart) {
      if (!months.length) { chart.innerHTML = '<p class="empty-state">No sales data yet</p>'; }
      else {
        const max = Math.max(...Object.values(monthly));
        chart.innerHTML = `<div class="chart-bars">${months.map(m => {
          const val = monthly[m];
          const h = max ? (val / max) * 100 : 0;
          const label = m.split('-')[1] + '/' + m.slice(2, 4);
          return `<div class="chart-bar-wrap" title="${money(val)}"><div class="chart-bar" style="height:${h}%"></div><span class="chart-label">${label}</span></div>`;
        }).join('')}</div>`;
      }
    }
    const pop = $('#analyticsPopularProducts');
    if (pop) {
      if (!sorted.length) { pop.innerHTML = '<p class="empty-state">No data yet</p>'; }
      else {
        pop.innerHTML = `<table class="admin-table"><thead><tr><th>#</th><th>Product</th><th>Orders</th></tr></thead><tbody>${
          sorted.slice(0, 10).map((e, i) => {
            const prod = all.find(p => p.id === e[0]);
            return `<tr><td>${i + 1}</td><td><strong>${prod ? prod.name : e[0]}</strong></td><td>${e[1]}</td></tr>`;
          }).join('')
        }</tbody></table>`;
      }
    }
  }

  function showTab(name) {
    $$('.admin-tab').forEach(t => t.hidden = true);
    const el = $('#adminTab' + name[0].toUpperCase() + name.slice(1));
    if (el) el.hidden = false;
    switch (name) {
      case 'dashboard': renderDashboard(); break;
      case 'orders':    renderOrders();    break;
      case 'products':  renderProducts();  break;
      case 'coupons':   renderCoupons();   break;
      case 'analytics': renderAnalytics(); break;
    }
  }

    function doLogout() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(EMAIL_KEY);
      localStorage.removeItem('pls-session');
      if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().catch(() => {});
      }
    } catch (_) {}
    window.location.replace('login.html?logout=1');
  }

  function openProductForm(product) {
    const modal = $('#adminProductModal');
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#adminProductFormTitle').textContent = product ? 'Edit Product' : 'Add Product';
    $('#apId').value = product ? product.id : '';
    $('#apId').readOnly = !!product;
    $('#apName').value = product ? product.name : '';
    $('#apNameAr').value = product ? (product.nameAr || '') : '';
    $('#apCategory').value = product ? product.category : 'custom';
    rebuildCategoryDropdown();
    $('#apTag').value = product ? (product.tag || '') : '';
    $('#apTagAr').value = product ? (product.tagAr || '') : '';
    $('#apImage').value = product ? (product.image || '') : '';
    $('#apBasePrice').value = product ? (product.basePrice || '') : '';
    $('#apQuantity').value = product && product.quantity != null ? product.quantity : '';
    const sizes = product && product.sizes ? Object.entries(product.sizes).map(e => e[0] + '=' + e[1]).join(', ') : '20x30=60, 30x40=80, 40x50=250, 50x70=300';
    $('#apSizes').value = sizes;
    $('#apFrames').value = product && product.frames ? product.frames.join(', ') : 'None, Black, White';
    $('#apDescription').value = product ? (product.description || '') : '';
    $('#apDescriptionAr').value = product ? (product.descriptionAr || '') : '';
    const preview = $('#apImagePreview');
    if (preview) {
      const imgSrc = product && product.image ? product.image : '../assets/poster-lab-logo.webp';
      preview.src = (typeof productImageUrl === 'function') ? productImageUrl(imgSrc) : imgSrc;
    }
  }

  function rebuildCategoryDropdown() {
    const sel = $('#apCategory');
    if (!sel) return;
    const current = sel.value;
    const existing = new Set();
    allProducts().forEach(p => { if (p.category) existing.add(p.category); });
    const allCats = ['custom', 'football', 'cars', 'clubs', 'album', 'movie', 'anime', 'quotes', 'islamic', 'art', 'gym', 'girls', 'games', 'cities', 'nba', 'meemes', 'pharaonic', 'rap', 'jordan'];
    const cats = [...new Set([...allCats, ...existing])];
    sel.innerHTML = cats.map(c => `<option value="${c}"${c === current ? ' selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('');
  }

  function hideProductForm() {
    const modal = $('#adminProductModal');
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
  }

  function handleImageUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      $('#apImage').value = dataUrl;
      $('#apImagePreview').src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function saveProduct() {
    const id = $('#apId').value.trim();
    const name = $('#apName').value.trim();
    if (!id || !name) { alert('Product ID and Name are required.'); return; }
    const sizesStr = $('#apSizes').value.trim();
    let sizes = { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 };
    if (sizesStr) {
      const p = {};
      sizesStr.split(',').forEach(part => {
        const kv = part.trim().split('=');
        if (kv.length === 2) p[kv[0].trim()] = parseFloat(kv[1].trim()) || 0;
      });
      if (Object.keys(p).length) sizes = p;
    }
    const framesStr = $('#apFrames').value.trim();
    let frames = ['None', 'Black', 'White'];
    if (framesStr) {
      const pf = framesStr.split(',').map(f => f.trim()).filter(Boolean);
      if (pf.length) frames = pf;
    }
    const qtyVal = $('#apQuantity').value.trim();
    const productData = {
      id, name,
      nameAr: $('#apNameAr').value.trim(),
      category: $('#apCategory').value,
      tag: $('#apTag').value.trim(),
      tagAr: $('#apTagAr').value.trim(),
      image: $('#apImage').value.trim(),
      basePrice: parseFloat($('#apBasePrice').value) || 0,
      quantity: qtyVal !== '' ? parseInt(qtyVal, 10) : undefined,
      gallery: [$('#apImage').value.trim()],
      sizes, frames,
      description: $('#apDescription').value.trim(),
      descriptionAr: $('#apDescriptionAr').value.trim(),
    };
    const custom = getAdminProducts();
    const idx = custom.findIndex(c => c.id === id);
    if (idx >= 0) custom[idx] = productData;
    else custom.push(productData);
    saveAdminProducts(custom);
    if (typeof window.saveProductToFirestore === 'function') {
      window.saveProductToFirestore(productData);
    }
    hideProductForm();
    rebuildCategoryFilter();
    renderProducts();
    showAdminToast('✓ Product "' + name + '" saved successfully! (15s)', 'success', 15000);
  }

  function editProduct(pid) {
    const found = allProducts().find(x => x.id === pid);
    if (found) openProductForm(found);
  }

  function cloneProduct(pid) {
    const found = allProducts().find(x => x.id === pid);
    if (!found) return;
    const clone = { ...found, id: found.id + '-copy' };
    openProductForm(clone);
  }

  function deleteProduct(pid) {
    if (!confirm('Delete "' + pid + '"? This cannot be undone.')) return;
    const hard = (typeof window.products !== 'undefined' && Array.isArray(window.products)) ? window.products : [];
    const isHard = hard.some(h => h.id === pid);
    if (isHard) {
      const c = getAdminProducts();
      const without = c.filter(x => x.id !== pid);
      without.push({ id: pid, _deleted: true });
      saveAdminProducts(without);
    } else {
      saveAdminProducts(getAdminProducts().filter(x => x.id !== pid));
    }
    if (typeof window.deleteProductFromFirestore === 'function') {
      window.deleteProductFromFirestore(pid);
    }
    rebuildCategoryFilter();
    renderProducts();
    showAdminToast('✓ Product "' + pid + '" deleted successfully! (15s)', 'info', 15000);
  }

  function clearAllProducts() {
    if (!confirm('Delete ALL custom products?')) return;
    if (!confirm('Are you absolutely sure?')) return;
    saveAdminProducts([]);
    rebuildCategoryFilter();
    renderProducts();
  }

  function openCouponForm() {
    const form = $('#adminCouponForm');
    form.hidden = false;
    $('#acCode').value = '';
    $('#acValue').value = '';
    $('#acMinOrder').value = '0';
    $('#acMaxUses').value = '100';
  }
  function hideCouponForm() { $('#adminCouponForm').hidden = true; }

  function saveCoupon() {
    const code = $('#acCode').value.trim().toUpperCase();
    const type = $('#acType').value;
    const value = parseFloat($('#acValue').value) || 0;
    const minOrder = parseFloat($('#acMinOrder').value) || 0;
    const maxUses = parseInt($('#acMaxUses').value) || 100;
    if (!code || !value) { alert('Code and value required.'); return; }
    const list = getCoupons();
    if (list.find(c => c.code === code)) { alert('Coupon code already exists.'); return; }
    const coupon = { code, type, value, minOrder, maxUses, uses: 0, usedBy: [] };
    list.push(coupon);
    saveCoupons(list);
    if (typeof window.saveCouponToFirestore === 'function') {
      window.saveCouponToFirestore(coupon);
    }
    hideCouponForm();
    renderCoupons();
    showAdminToast('✓ Coupon "' + code + '" saved successfully! (15s)', 'success', 15000);
  }

  function deleteCoupon(code) {
    if (!confirm('Delete coupon "' + code + '"?')) return;
    saveCoupons(getCoupons().filter(x => x.code !== code));
    if (typeof window.deleteCouponFromFirestore === 'function') {
      window.deleteCouponFromFirestore(code);
    }
    renderCoupons();
  }

  /* ── Background auto-sync ── */
  async function syncAllFromFirestore(force = false) {
    if (_syncing) return;
    _syncing = true;
    const badge = $('#adminSyncBadge');
    if (badge) {
      badge.innerHTML = '<span style="color:var(--warm)">↻ Syncing...</span>';
    }
    try {
      const [ordersOk] = await Promise.all([
        syncOrdersFromFirestore(),
        window.syncProductsFromFirestore ? window.syncProductsFromFirestore(force) : Promise.resolve(0),
        window.syncCouponsFromFirestore ? window.syncCouponsFromFirestore(force) : Promise.resolve(0)
      ]);
      const dbReady = typeof isFirebaseReady === 'function' ? isFirebaseReady() : Boolean(typeof getFirebaseDb === 'function' && getFirebaseDb());
      
      // Refresh current tab
      const active = $('.admin-nav-btn.is-active');
      if (active && active.dataset.adminTab) showTab(active.dataset.adminTab);
      
      if (badge) {
        if (dbReady || ordersOk) {
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          badge.innerHTML = `<span style="color:var(--accent);font-weight:700">● Online (${time})</span>`;
        } else {
          badge.innerHTML = `<span style="color:var(--warm);cursor:pointer;font-weight:600" data-cmd="sync-all" title="Using local data. Click to reconnect.">⚠ Local Mode</span>`;
        }
      }
    } catch (e) {
      err('Auto-sync error:', e);
      if (badge) {
        badge.innerHTML = `<span style="color:var(--danger);cursor:pointer;font-weight:600" data-cmd="sync-all" title="Sync failed. Click to retry.">⚠ Offline (Retry)</span>`;
      }
    }
    _syncing = false;
  }

  let _syncTimer = null;
  function startAutoSync() {
    stopAutoSync();
    syncAllFromFirestore(false);
    _syncTimer = setInterval(() => syncAllFromFirestore(false), 45000);
  }
  function stopAutoSync() { if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null; } }

  function handleClick(e) {
    const pageBtn = e.target.closest('[data-page-action]');
    if (pageBtn) {
      const action = pageBtn.dataset.pageAction;
      if (action === 'first') productPagination.page = 1;
      else if (action === 'prev') productPagination.page = Math.max(1, productPagination.page - 1);
      else if (action === 'next') productPagination.page = Math.min(productPagination.totalPages || 1, productPagination.page + 1);
      else if (action === 'last') productPagination.page = productPagination.totalPages || 1;
      renderProducts();
      return;
    }

    const btn = e.target.closest('[data-cmd]');
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    log('click', cmd, btn.dataset);
    switch (cmd) {
      case 'logout':         doLogout();         break;
      case 'add-product':    openProductForm(null); break;
      case 'save-product':   saveProduct();      break;
      case 'cancel-product': hideProductForm();   break;
      case 'edit-product':   editProduct(btn.dataset.pid); break;
      case 'clone-product':  cloneProduct(btn.dataset.pid); break;
      case 'delete-product': deleteProduct(btn.dataset.pid); break;
      case 'clear-products': clearAllProducts(); break;
      case 'add-coupon':     openCouponForm();   break;
      case 'save-coupon':    saveCoupon();       break;
      case 'cancel-coupon':  hideCouponForm();   break;
      case 'delete-coupon':  deleteCoupon(btn.dataset.code); break;
      case 'sync-all':       syncAllFromFirestore(true); break;
    }
  }

  function handleChange(e) {
    if (e.target.matches('.admin-status-select')) {
      const id = e.target.dataset.orderId;
      const status = e.target.value;
      const orders = getOrders();
      const order = orders.find(o => o.id === id);
      if (order) {
        order.status = status;
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({ status, date: new Date().toISOString(), by: 'admin' });
        saveOrders(orders);
        updateOrderInFirestore(id, { status, statusHistory: order.statusHistory });
        updateStats();
        if ($('#adminTabOrders') && !$('#adminTabOrders').hidden) renderOrders();
        if ($('#adminTabDashboard') && !$('#adminTabDashboard').hidden) renderDashboard();
        showAdminToast('✓ Order ' + id + ' status updated to "' + status + '"! (15s)', 'success', 15000);
      }
    }
    if (e.target.matches('#adminOrderStatusFilter') || e.target.matches('#adminOrderSearch')) renderOrders();
    if (e.target.matches('#adminProductSearch') || e.target.matches('#adminProductCategoryFilter')) renderProducts();
    if (e.target.matches('#apImageUpload')) {
      const file = e.target.files[0];
      if (file) handleImageUpload(file);
      e.target.value = '';
    }
  }

  /* ── Modal overlay click & keyboard ── */
  function handleModalClick(e) {
    const modal = $('#adminProductModal');
    if (!modal || modal.hidden) return;
    if (e.target === modal) hideProductForm();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      const modal = $('#adminProductModal');
      if (modal && !modal.hidden) hideProductForm();
    }
    if (e.key === 'Enter') {
      const modal = $('#adminProductModal');
      if (modal && !modal.hidden && e.target.closest('.admin-modal')) {
        if (e.target.tagName === 'TEXTAREA') return;
        const saveBtn = modal.querySelector('[data-cmd="save-product"]');
        if (saveBtn && !e.target.closest('button')) { e.preventDefault(); saveBtn.click(); }
      }
    }
  }

  let _adminSearchTimer = null;
  function handleInput(e) {
    if (e.target.matches('#adminOrderSearch')) {
      clearTimeout(_adminSearchTimer);
      _adminSearchTimer = setTimeout(renderOrders, 150);
    }
    if (e.target.matches('#adminProductSearch')) {
      clearTimeout(_adminSearchTimer);
      _adminSearchTimer = setTimeout(() => {
        productPagination.page = 1;
        renderProducts();
      }, 150);
    }
  }

  function handleNavClick(e) {
    const btn = e.target.closest('[data-admin-tab]');
    if (!btn) return;
    $$('.admin-nav-btn').forEach(b => b.classList.toggle('is-active', b === btn));
    showTab(btn.dataset.adminTab);
  }

  function updateAdminThemeUI() {
    const theme = localStorage.getItem('poster-lab-theme') || 'light';
    document.documentElement.dataset.theme = theme;
    const icon = $('#adminThemeIcon');
    if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀';
  }

  function toggleAdminTheme() {
    const cur = localStorage.getItem('poster-lab-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem('poster-lab-theme', next);
    updateAdminThemeUI();
  }

  function init() {
    log('init');
    try {
      updateAdminThemeUI();
      rebuildCategoryFilter();
      showTab('dashboard');

      // Wire theme toggle
      const themeBtn = $('#adminThemeToggle');
      if (themeBtn) themeBtn.addEventListener('click', toggleAdminTheme);

      // Start sync
      syncAllFromFirestore(true);
      startAutoSync();

      const app = $('#adminApp');
      if (app) {
        app.addEventListener('click', handleClick);
        app.addEventListener('change', handleChange);
        app.addEventListener('input', handleInput);
        app.addEventListener('click', handleNavClick);
        app.addEventListener('click', handleModalClick);
        document.addEventListener('keydown', handleKeydown);
      }
      const logoutBtn = $('#adminLogoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
      
      // Image path input → update preview live
      const apImage = $('#apImage');
      const apPreview = $('#apImagePreview');
      if (apImage && apPreview) {
        apImage.addEventListener('input', function() {
          apPreview.src = this.value || '../assets/poster-lab-logo.webp';
        });
        apPreview.addEventListener('click', function() {
          const upload = $('#apImageUpload');
          if (upload) upload.click();
        });
      }
      log('ready');
    } catch (e) { err('init error', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



// Store home navigation from admin panel with absolute canonical resolution
document.addEventListener('click', (e) => {
  const storeLink = e.target.closest('a[href*="index.html"], .admin-brand-link, .admin-back-link, [data-store-link]');
  if (storeLink) {
    e.preventDefault();
    if (typeof getStoreHomeUrl === 'function') {
      window.location.href = getStoreHomeUrl();
    } else {
      const p = window.location.pathname;
      if (window.location.hostname.includes('github.io')) {
        const parts = p.split('/').filter(Boolean);
        const repo = (parts.length > 0 && parts[0].toLowerCase() === 'posterlabstore') ? parts[0] : 'PosterLabStore';
        window.location.href = window.location.origin + '/' + repo + '/index.html';
      } else if (p.includes('/admin/')) {
        window.location.href = p.substring(0, p.indexOf('/admin/')) + '/index.html';
      } else {
        window.location.href = '../index.html';
      }
    }
  }
});
