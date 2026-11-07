(function () {
  'use strict';

  const SESSION_KEY = 'pls-admin-session';

  // Synchronous session check — runs BEFORE DOMContentLoaded
  if (localStorage.getItem(SESSION_KEY) !== 'true') {
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

  /* ── Firestore sync ── */
  let _syncing = false;

  function syncOrdersFromFirestore() {
    return new Promise(async (resolve) => {
      try {
        if (typeof initFirebase === 'function') initFirebase();
        if (typeof getFirebaseDb !== 'function' || !getFirebaseDb()) { resolve(); return; }
        const db = getFirebaseDb();
        const snap = await db.collection('orders').orderBy('date', 'desc').get();
        const local = getOrders();
        const localMap = {};
        local.forEach(o => { localMap[o.id] = o; });
        let changed = false;
        snap.forEach(doc => {
          const data = doc.data();
          if (!localMap[data.id]) {
            local.push(data);
            localMap[data.id] = data;
            changed = true;
          } else if (data.status && localMap[data.id].status !== data.status) {
            localMap[data.id].status = data.status;
            changed = true;
          }
        });
        if (changed) saveOrders(local);
        log('Orders synced:', local.length);
      } catch (e) { err('Firestore orders sync error:', e); }
      resolve();
    });
  }

  function updateOrderInFirestore(orderId, updates) {
    return new Promise(async (resolve) => {
      try {
        if (typeof initFirebase === 'function') initFirebase();
        if (typeof getFirebaseDb !== 'function' || !getFirebaseDb()) { resolve(false); return; }
        const db = getFirebaseDb();
        await db.collection('orders').doc(orderId).update(updates);
        resolve(true);
      } catch (e) { err('Firestore update error:', e); resolve(false); }
    });
  }

  function getCoupons() { return safeJSON(COUPONS_KEY, []); }
  function saveCoupons(c) { localStorage.setItem(COUPONS_KEY, JSON.stringify(c)); }

  function getAdminProducts() { return safeJSON(PRODUCTS_KEY, []); }
  function saveAdminProducts(p) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(p)); }

  function allProducts() {
    const hard = (typeof window.products !== 'undefined' && Array.isArray(window.products)) ? window.products : [];
    const custom = getAdminProducts();
    const map = {};
    hard.forEach(p => { map[p.id] = { ...p }; });
    custom.forEach(cp => {
      if (cp._deleted) { delete map[cp.id]; return; }
      map[cp.id] = { ...cp };
    });
    return Object.values(map);
  }

  function getCategories() {
    const cats = new Set();
    allProducts().forEach(p => { if (p.category) cats.add(p.category); });
    const order = ['football', 'cars', 'clubs', 'movie', 'custom', 'abstract', 'paint'];
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

  function renderDashboard() {
    const orders = getOrders();
    const active = orders.filter(o => o.status !== 'cancelled');
    const revenue = active.reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const prods = allProducts();
    $('#statTotalOrders').textContent = orders.length;
    $('#statTotalRevenue').textContent = money(revenue);
    $('#statPendingOrders').textContent = pending;
    $('#statProductsCount').textContent = prods.length;
    const recent = orders.slice(-5).reverse();
    const wrap = $('#adminRecentOrders');
    if (!recent.length) { wrap.innerHTML = '<p class="empty-state">No orders yet</p>'; return; }
    wrap.innerHTML = ordersTable(recent);
    updateStats();
  }

  function renderOrders() {
    const orders = getOrders();
    const filter = $('#adminOrderStatusFilter').value;
    const search = $('#adminOrderSearch').value.toLowerCase().trim();
    let list = orders;
    if (filter !== 'all') list = list.filter(o => o.status === filter);
    if (search) list = list.filter(o =>
      (o.customerName || '').toLowerCase().includes(search) ||
      (o.customerPhone || '').includes(search) ||
      (o.id || '').toLowerCase().includes(search)
    );
    list = [...list].reverse();
    const wrap = $('#adminOrdersList');
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
        ? `<div style="padding:4px 0">${o.items.map(item => {
            const imgSrc = typeof window.productImageUrl === 'function' ? window.productImageUrl(item.image || '../assets/poster-lab-logo.png') : (item.image || '../assets/poster-lab-logo.png');
            const size = item.size || item.selectedSize || '—';
            const frame = item.frame || item.selectedFrame || 'None';
            const qty = item.quantity || 1;
            const price = item.total || item.price || 0;
            return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">
              <img src="${imgSrc}" alt="" style="width:40px;height:54px;object-fit:cover;border-radius:4px" onerror="this.src='../assets/poster-lab-logo.png'" loading="lazy">
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:0.9rem">${item.productName || item.name || 'Product'}</div>
                <div style="display:flex;gap:12px;font-size:0.78rem;color:var(--muted);margin-top:2px">
                  <span>Size: ${size}</span>
                  <span>Frame: ${frame}</span>
                  <span>Qty: ${qty}</span>
                </div>
              </div>
              <span style="font-weight:700;white-space:nowrap">${money(price)}</span>
            </div>`;
          }).join('')}</div>`
        : '';
      const customerInfo = `<strong>${o.customerName || '—'}</strong><br><small style="color:var(--muted)">${o.customerPhone || ''}${o.customerAddress ? '<br>' + o.customerAddress : ''}${o.deliveryAddress ? '<br>' + o.deliveryAddress : ''}${o.orderNote ? '<br><em>Note: ' + o.orderNote + '</em>' : ''}</small>`;
      return `<tr class="admin-order-row">
        <td><strong>${o.id || '—'}</strong></td>
        <td>${dateStr}</td>
        <td>${customerInfo}</td>
        <td>${o.items ? o.items.length : 0}</td>
        <td><strong>${money(o.total || 0)}</strong></td>
        <td style="font-size:0.85rem">${(o.paymentMethod || '').substring(0, 24)}</td>
        <td><span style="color:${STATUS_COLORS[o.status] || 'var(--muted)'};font-weight:900">${o.status || 'pending'}</span></td>
        <td>${statusSelect(o.status, o.id)}</td>
      </tr>${itemsHtml ? `<tr class="admin-order-details"><td colspan="8">${itemsHtml}</td></tr>` : ''}`;
    }).join('')}</tbody></table>`;
  }

  function renderProducts() {
    const all = allProducts();
    const search = ($('#adminProductSearch').value || '').toLowerCase().trim();
    const cat = $('#adminProductCategoryFilter').value;
    let list = all;
    if (cat !== 'all') list = list.filter(p => p.category === cat);
    if (search) list = list.filter(p =>
      (p.id || '').toLowerCase().includes(search) ||
      (p.name || '').toLowerCase().includes(search) ||
      (p.nameAr || '').toLowerCase().includes(search) ||
      (p.tag || '').toLowerCase().includes(search)
    );
    const cnt = $('#adminProductsCount');
    if (cnt) cnt.textContent = `(${list.length}/${all.length})`;
    const wrap = $('#adminProductsList');
    if (!list.length) { wrap.innerHTML = '<p class="empty-state">No products match</p>'; return; }
    wrap.innerHTML = `<table class="admin-table"><thead><tr>
      <th></th><th>ID</th><th>Name</th><th>Category</th><th>Tag</th><th>Price</th><th>Qty</th><th>Sizes</th><th>Frames</th><th>Actions</th>
    </tr></thead><tbody>${list.map(p => {
      const img = p.image || '../assets/poster-lab-logo.png';
      const sizesHtml = Object.entries(p.sizes || {}).map(e => `<span style="white-space:nowrap">${e[0]}: ${money(e[1])}</span>`).join(', ');
      const qty = p.quantity != null ? p.quantity : '';
      const qtyHtml = qty !== '' ? `<span style="${qty <= 0 ? 'color:var(--danger);font-weight:900' : ''}">${qty}</span>` : '<span style="color:var(--muted)">∞</span>';
      return `<tr>
        <td style="width:50px"><img src="${typeof productImageUrl === 'function' ? productImageUrl(img) : img}" alt="" style="width:40px;height:54px;object-fit:cover;border-radius:4px" onerror="this.src='../assets/poster-lab-logo.png'"></td>
        <td><code>${p.id}</code></td>
        <td><strong>${p.name || ''}</strong>${p.nameAr ? `<br><small style="color:var(--muted)">${p.nameAr}</small>` : ''}</td>
        <td>${p.category || '—'}</td>
        <td style="font-size:0.8rem">${p.tag || '—'}</td>
        <td>${money(p.basePrice || 0)}</td>
        <td style="text-align:center;font-weight:700">${qtyHtml}</td>
        <td style="font-size:0.8rem">${sizesHtml}</td>
        <td style="font-size:0.8rem">${(p.frames || []).join(', ')}</td>
        <td>
          <button class="admin-edit-btn secondary-button" data-cmd="edit-product" data-pid="${p.id}">Edit</button>
          <button class="secondary-button" data-cmd="clone-product" data-pid="${p.id}">Clone</button>
          <button class="admin-delete-btn secondary-button" data-cmd="delete-product" data-pid="${p.id}" style="border-color:var(--danger);color:var(--danger)">Delete</button>
        </td>
      </tr>`;
    }).join('')}</tbody></table>`;
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
    if (!list.length) { wrap.innerHTML = '<p class="empty-state">No coupons yet</p>'; return; }
    wrap.innerHTML = `<table class="admin-table"><thead><tr>
      <th>Code</th><th>Type</th><th>Value</th><th>Min&nbsp;Order</th><th>Uses</th><th>Max</th><th>Actions</th>
    </tr></thead><tbody>${list.map(c => `<tr>
      <td><strong>${c.code}</strong></td>
      <td>${c.type}</td>
      <td>${c.type === 'percent' ? c.value + '%' : money(c.value)}</td>
      <td>${money(c.minOrder || 0)}</td>
      <td>${c.uses || 0}</td>
      <td>${c.maxUses || '∞'}</td>
      <td><button class="secondary-button" data-cmd="delete-coupon" data-code="${c.code}" style="border-color:var(--danger);color:var(--danger)">Delete</button></td>
    </tr>`).join('')}</tbody></table>`;
  }

  function renderAnalytics() {
    const orders = getOrders();
    const delivered = orders.filter(o => o.status === 'delivered' || o.status === 'shipped');
    const all = allProducts();
    const avg = delivered.length ? delivered.reduce((s, o) => s + (o.total || 0), 0) / delivered.length : 0;
    $('#analyticsAvgOrder').textContent = money(Math.round(avg));
    const counts = {};
    delivered.forEach(o => (o.items || []).forEach(item => {
      const pid = item.productId || item.id;
      counts[pid] = (counts[pid] || 0) + (item.quantity || 1);
    }));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topId = sorted.length ? sorted[0][0] : null;
    const topName = topId ? (all.find(p => p.id === topId)?.name || topId) : '—';
    $('#analyticsTopProduct').textContent = topName;
    const cod = orders.filter(o => o.paymentMethod && o.paymentMethod.includes('Cash')).length;
    $('#analyticsConversion').textContent = orders.length ? Math.round((cod / orders.length) * 100) + '%' : '0%';
    const phones = [...new Set(orders.filter(o => o.customerPhone).map(o => o.customerPhone))];
    const repeat = phones.filter(ph => orders.filter(o => o.customerPhone === ph).length > 1).length;
    $('#analyticsRepeatRate').textContent = phones.length ? Math.round((repeat / phones.length) * 100) + '%' : '0%';
    const monthly = {};
    orders.forEach(o => {
      const d = new Date(o.date);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      monthly[key] = (monthly[key] || 0) + (o.total || 0);
    });
    const months = Object.keys(monthly).sort();
    const chart = $('#analyticsChart');
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
    const pop = $('#analyticsPopularProducts');
    if (!sorted.length) { pop.innerHTML = '<p class="empty-state">No data yet</p>'; return; }
    pop.innerHTML = `<table class="admin-table"><thead><tr><th>#</th><th>Product</th><th>Orders</th></tr></thead><tbody>${
      sorted.slice(0, 10).map((e, i) => {
        const prod = all.find(p => p.id === e[0]);
        return `<tr><td>${i + 1}</td><td><strong>${prod ? prod.name : e[0]}</strong></td><td>${e[1]}</td></tr>`;
      }).join('')
    }</tbody></table>`;
  }

  function updateStats() {
    const orders = getOrders();
    const total = orders.reduce((s, o) => s + (o.total || 0), 0);
    const el = $('#adminStatsHeader');
    if (el) el.textContent = orders.length + ' orders · ' + money(total);
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
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
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
    const sizes = product && product.sizes ? Object.entries(product.sizes).map(e => e[0] + '=' + e[1]).join(', ') : '20x30=60, 30x40=80, 40x50=100, 50x70=120';
    $('#apSizes').value = sizes;
    $('#apFrames').value = product && product.frames ? product.frames.join(', ') : 'None, Black, White';
    $('#apDescription').value = product ? (product.description || '') : '';
    $('#apDescriptionAr').value = product ? (product.descriptionAr || '') : '';
    const preview = $('#apImagePreview');
    if (preview) {
      const imgSrc = product && product.image ? product.image : '../assets/poster-lab-logo.png';
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
    let sizes = { '20x30': 60, '30x40': 80, '40x50': 100, '50x70': 120 };
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
    window.saveProductToFirestore(productData);
    hideProductForm();
    rebuildCategoryFilter();
    renderProducts();
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
    window.deleteProductFromFirestore(pid);
    rebuildCategoryFilter();
    renderProducts();
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
    const coupon = { code, type, value, minOrder, maxUses, uses: 0 };
    list.push(coupon);
    saveCoupons(list);
    window.saveCouponToFirestore(coupon);
    hideCouponForm();
    renderCoupons();
  }

  function deleteCoupon(code) {
    if (!confirm('Delete coupon "' + code + '"?')) return;
    saveCoupons(getCoupons().filter(x => x.code !== code));
    window.deleteCouponFromFirestore(code);
    renderCoupons();
  }

  /* ── Background auto-sync ── */
  async function syncAllFromFirestore() {
    if (_syncing) return;
    _syncing = true;
    try {
      await Promise.all([
        syncOrdersFromFirestore(),
        window.syncProductsFromFirestore ? window.syncProductsFromFirestore() : Promise.resolve(),
        window.syncCouponsFromFirestore ? window.syncCouponsFromFirestore() : Promise.resolve()
      ]);
      // Re-render current tab
      const active = $('.admin-nav-btn.is-active');
      if (active && active.dataset.adminTab) showTab(active.dataset.adminTab);
      const badge = $('#adminSyncBadge');
      if (badge) { badge.textContent = 'Synced'; badge.style.color = 'var(--accent-strong)'; }
    } catch (e) { err('Auto-sync error:', e); }
    _syncing = false;
  }

  let _syncTimer = null;
  function startAutoSync() {
    stopAutoSync();
    syncAllFromFirestore();
    _syncTimer = setInterval(syncAllFromFirestore, 60000);
  }
  function stopAutoSync() { if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null; } }

  function handleClick(e) {
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
      case 'sync-all':       syncAllFromFirestore(); break;
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

  function handleInput(e) {
    if (e.target.matches('#adminOrderSearch')) renderOrders();
    if (e.target.matches('#adminProductSearch')) renderProducts();
  }

  function handleNavClick(e) {
    const btn = e.target.closest('[data-admin-tab]');
    if (!btn) return;
    $$('.admin-nav-btn').forEach(b => b.classList.toggle('is-active', b === btn));
    showTab(btn.dataset.adminTab);
  }

  function init() {
    log('init');
    try {
      Promise.all([
        syncOrdersFromFirestore(),
        window.syncProductsFromFirestore ? window.syncProductsFromFirestore() : Promise.resolve(),
        window.syncCouponsFromFirestore ? window.syncCouponsFromFirestore() : Promise.resolve()
      ]).then(() => {
        rebuildCategoryFilter();
        showTab('dashboard');
        startAutoSync();
      });
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
          apPreview.src = this.value || '../assets/poster-lab-logo.png';
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