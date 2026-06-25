(function() {
  const ADMIN_PWD_KEY = 'pls-admin-password';
  const SESSION_KEY = 'pls-admin-session';
  const ORDERS_KEY = 'pls-orders';
  const COUPONS_KEY = 'pls-coupons';
  const PRODUCTS_KEY = 'pls-products';

  let adminProducts = [];

  function getDefaultPassword() { return 'Poster895Lab$'; }

  function getAdminPassword() {
    return localStorage.getItem(ADMIN_PWD_KEY) || getDefaultPassword();
  }

  function setAdminPassword(pwd) {
    localStorage.setItem(ADMIN_PWD_KEY, pwd);
  }

  function isAdminLoggedIn() {
    return localStorage.getItem(SESSION_KEY) === 'true';
  }

  function setAdminSession(loggedIn) {
    if (loggedIn) localStorage.setItem(SESSION_KEY, 'true');
    else localStorage.removeItem(SESSION_KEY);
  }

  function getOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
    catch { return []; }
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function getCouponsData() {
    try { return JSON.parse(localStorage.getItem(COUPONS_KEY) || '[]'); }
    catch { return []; }
  }

  function saveCouponsData(coupons) {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  }

  function loadAdminProducts() {
    adminProducts = [];
    try {
      adminProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    } catch {}
    return adminProducts;
  }

  function saveAdminProducts(prods) {
    adminProducts = prods;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));
  }

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function init() {
    if (isAdminLoggedIn()) {
      showDashboard();
    }
    document.getElementById('adminApp').addEventListener('click', handleClick);
    document.getElementById('adminApp').addEventListener('change', handleChange);
    document.getElementById('adminApp').addEventListener('input', handleInput);
  }

  function handleClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    switch (action) {
      case 'login': doLogin(); break;
      case 'logout': doLogout(); break;
      case 'nav': showTab(target.dataset.adminTab); break;
      case 'save-product': saveProduct(); break;
      case 'cancel-product': hideProductForm(); break;
      case 'edit-product': editProduct(target.dataset.pid); break;
      case 'delete-product': deleteProduct(target.dataset.pid); break;
      case 'add-product': openProductForm(null); break;
      case 'clear-products': clearAllProducts(); break;
      case 'save-coupon': saveCoupon(); break;
      case 'cancel-coupon': hideCouponForm(); break;
      case 'delete-coupon': deleteCoupon(target.dataset.code); break;
      case 'add-coupon': openCouponForm(); break;
    }
  }

  function handleChange(e) {
    if (e.target.matches('.admin-status-select')) {
      const orderId = e.target.dataset.orderId;
      const newStatus = e.target.value;
      const orders = getOrders();
      const order = orders.find(o => o.id === orderId);
      if (order) {
        order.status = newStatus;
        saveOrders(orders);
        updateHeaderStats();
        const ordersTab = document.getElementById('adminTabOrders');
        const dashTab = document.getElementById('adminTabDashboard');
        if (ordersTab && !ordersTab.hidden) renderOrders();
        if (dashTab && !dashTab.hidden) renderDashboard();
      }
    }
    if (e.target.matches('#adminOrderStatusFilter')) {
      renderOrders();
    }
    if (e.target.matches('#adminOrderSearch')) {
      renderOrders();
    }
    if (e.target.matches('#adminProductSearch') || e.target.matches('#adminProductCategoryFilter')) {
      renderProducts();
    }
  }

  function handleInput(e) {
    if (e.target.matches('#adminOrderSearch')) {
      renderOrders();
    }
    if (e.target.matches('#adminProductSearch')) {
      renderProducts();
    }
  }

  function doLogin() {
    const pwd = document.getElementById('adminPassword').value.trim();
    if (pwd === getAdminPassword()) {
      setAdminSession(true);
      showDashboard();
      document.getElementById('adminLoginError').hidden = true;
      document.getElementById('adminPassword').value = '';
    } else {
      document.getElementById('adminLoginError').hidden = false;
    }
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !document.getElementById('adminDashboard').hidden) return;
    if (e.key === 'Enter' && !document.getElementById('adminLogin').hidden) {
      doLogin();
    }
  });

  function doLogout() {
    setAdminSession(false);
    document.getElementById('adminDashboard').hidden = true;
    document.getElementById('adminLogin').hidden = false;
  }

  function showTab(tabName) {
    $$('.admin-tab').forEach(tab => tab.hidden = true);
    const cap = tabName.charAt(0).toUpperCase() + tabName.slice(1);
    const target = document.getElementById('adminTab' + cap);
    if (target) target.hidden = false;
    if (tabName === 'dashboard') renderDashboard();
    else if (tabName === 'orders') renderOrders();
    else if (tabName === 'products') renderProducts();
    else if (tabName === 'coupons') renderCoupons();
    else if (tabName === 'analytics') renderAnalytics();
  }

  document.querySelectorAll('[data-admin-tab]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      $$('.admin-nav-btn').forEach(function(b) {
        b.classList.toggle('is-active', b.dataset.adminTab === this.dataset.adminTab);
      }, this);
      showTab(this.dataset.adminTab);
    });
  });

  function showDashboard() {
    document.getElementById('adminLogin').hidden = true;
    document.getElementById('adminDashboard').hidden = false;
    updateHeaderStats();
    renderDashboard();
  }

  function updateHeaderStats() {
    const orders = getOrders();
    const total = orders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
    document.getElementById('adminStatsHeader').textContent = orders.length + ' orders \u00B7 EGP ' + total;
  }

  function renderDashboard() {
    const orders = getOrders();
    const totalRevenue = orders.filter(function(o) { return o.status !== 'cancelled'; }).reduce(function(s, o) { return s + (o.total || 0); }, 0);
    const pendingCount = orders.filter(function(o) { return o.status === 'pending'; }).length;
    const allProducts = getAllMergedProducts();

    document.getElementById('statTotalOrders').textContent = orders.length;
    document.getElementById('statTotalRevenue').textContent = 'EGP ' + totalRevenue;
    document.getElementById('statPendingOrders').textContent = pendingCount;
    document.getElementById('statProductsCount').textContent = allProducts.length;

    const recent = orders.slice(-5).reverse();
    const table = document.getElementById('adminRecentOrders');
    if (!table) return;
    if (!recent.length) {
      table.innerHTML = '<p class="empty-state">No orders yet</p>';
      return;
    }
    table.innerHTML = createOrdersTable(recent);
  }

  function renderOrders() {
    const orders = getOrders();
    const filter = document.getElementById('adminOrderStatusFilter').value;
    const search = document.getElementById('adminOrderSearch').value.toLowerCase().trim();

    var filtered = orders;
    if (filter !== 'all') filtered = filtered.filter(function(o) { return o.status === filter; });
    if (search) {
      filtered = filtered.filter(function(o) {
        return (o.customerName || '').toLowerCase().includes(search) ||
               (o.customerPhone || '').toLowerCase().includes(search) ||
               (o.id || '').toLowerCase().includes(search);
      });
    }
    filtered.reverse();

    const container = document.getElementById('adminOrdersList');
    if (!filtered.length) {
      container.innerHTML = '<p class="empty-state">No orders match your filters</p>';
      return;
    }
    container.innerHTML = createOrdersTable(filtered, true);
  }

  function createOrdersTable(orders, showDetails) {
    var statusColors = {
      pending: 'var(--warm)',
      confirmed: 'var(--accent)',
      processing: '#4a9eff',
      shipped: '#9b59b6',
      delivered: 'var(--accent-strong)',
      cancelled: 'var(--danger)'
    };

    var rows = orders.map(function(o) {
      var date = new Date(o.date).toLocaleDateString('en-EG', { day: '2-digit', month: 'short', year: 'numeric' });
      var statusOpts = ['pending','confirmed','processing','shipped','delivered','cancelled'].map(function(s) {
        return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>';
      }).join('');
      var itemsHtml = '';
      if (showDetails && o.items && o.items.length) {
        itemsHtml = o.items.map(function(item) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)">' +
            '<img src="' + (item.image || '../assets/poster-lab-logo.png') + '" alt="" style="width:32px;height:42px;object-fit:cover;border-radius:4px">' +
            '<span style="flex:1">' + (item.productName || item.name || 'Product') + '</span>' +
            '<span style="color:var(--muted);font-size:0.8rem">x' + (item.quantity || 1) + '</span>' +
            '<span style="font-weight:700">EGP ' + (item.total || item.price || 0) + '</span>' +
            '</div>';
        }).join('');
      }
      return '<tr class="admin-order-row">' +
        '<td><strong>' + (o.id || 'N/A') + '</strong></td>' +
        '<td>' + date + '</td>' +
        '<td>' + (o.customerName || 'N/A') + '<br><small style="color:var(--muted)">' + (o.customerPhone || '') + '</small></td>' +
        '<td>' + (o.items ? o.items.length : 0) + '</td>' +
        '<td><strong>EGP ' + (o.total || 0) + '</strong></td>' +
        '<td style="font-size:0.85rem">' + (o.paymentMethod || '').substring(0, 20) + '</td>' +
        '<td><span style="color:' + (statusColors[o.status] || 'var(--muted)') + ';font-weight:900">' + (o.status || 'pending') + '</span></td>' +
        '<td><select class="admin-status-select" data-order-id="' + o.id + '">' + statusOpts + '</select></td>' +
        '</tr>' +
        (showDetails && o.items && o.items.length ? '<tr class="admin-order-details"><td colspan="8"><div style="padding:8px 0">' + itemsHtml + '</div></td></tr>' : '');
    }).join('');

    return '<table class="admin-table"><thead><tr>' +
      '<th>Order ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function getAllMergedProducts() {
    var hardcoded = typeof products !== 'undefined' && Array.isArray(products) ? products : [];
    var custom = loadAdminProducts();
    var merged = hardcoded.slice();
    custom.forEach(function(cp) {
      if (cp._deleted) {
        var idx = merged.findIndex(function(m) { return m.id === cp.id; });
        if (idx >= 0) merged.splice(idx, 1);
        return;
      }
      var idx = merged.findIndex(function(m) { return m.id === cp.id; });
      if (idx >= 0) merged[idx] = cp;
      else merged.push(cp);
    });
    return merged;
  }

  function getDefaultProductsForAdmin() {
    if (typeof products !== 'undefined' && Array.isArray(products)) return products;
    return [];
  }

  function renderProducts() {
    var allProducts = getAllMergedProducts();
    var search = (document.getElementById('adminProductSearch').value || '').toLowerCase().trim();
    var catFilter = document.getElementById('adminProductCategoryFilter').value;

    var filtered = allProducts;
    if (catFilter !== 'all') filtered = filtered.filter(function(p) { return p.category === catFilter; });
    if (search) {
      filtered = filtered.filter(function(p) {
        return (p.id || '').toLowerCase().includes(search) ||
               (p.name || '').toLowerCase().includes(search) ||
               (p.nameAr || '').toLowerCase().includes(search);
      });
    }

    var container = document.getElementById('adminProductsList');
    var countEl = document.getElementById('adminProductsCount');
    if (countEl) countEl.textContent = '(' + filtered.length + '/' + allProducts.length + ')';

    if (!filtered.length) {
      container.innerHTML = '<p class="empty-state">No products match your filters</p>';
      return;
    }

    var rows = filtered.map(function(p) {
      var imgSrc = p.image || '../assets/poster-lab-logo.png';
      if (imgSrc.startsWith('data:')) imgSrc = '../assets/poster-lab-logo.png';
      return '<tr>' +
        '<td style="width:50px"><img src="' + imgSrc + '" alt="" style="width:40px;height:54px;object-fit:cover;border-radius:4px" onerror="this.src=\'../assets/poster-lab-logo.png\'"></td>' +
        '<td><code>' + p.id + '</code></td>' +
        '<td><strong>' + p.name + '</strong></td>' +
        '<td>' + (p.category || '-') + '</td>' +
        '<td>EGP ' + (p.basePrice || 0) + '</td>' +
        '<td style="font-size:0.8rem">' + Object.keys(p.sizes || {}).join(', ') + '</td>' +
        '<td>' +
        '<button class="admin-edit-btn secondary-button" data-action="edit-product" data-pid="' + p.id + '">Edit</button> ' +
        '<button class="admin-delete-btn secondary-button" data-action="delete-product" data-pid="' + p.id + '" style="border-color:var(--danger);color:var(--danger)">Delete</button>' +
        '</td></tr>';
    }).join('');
    container.innerHTML = '<table class="admin-table"><thead><tr><th></th><th>ID</th><th>Name</th><th>Category</th><th>Base Price</th><th>Sizes</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function openProductForm(product) {
    var form = document.getElementById('adminProductForm');
    form.hidden = false;
    document.getElementById('adminProductFormTitle').textContent = product ? 'Edit Product' : 'Add Product';
    document.getElementById('apId').value = product ? product.id : '';
    document.getElementById('apId').readOnly = !!product;
    document.getElementById('apName').value = product ? product.name : '';
    document.getElementById('apNameAr').value = product ? (product.nameAr || '') : '';
    document.getElementById('apCategory').value = product ? product.category : 'cars';
    document.getElementById('apTag').value = product ? (product.tag || '') : '';
    document.getElementById('apTagAr').value = product ? (product.tagAr || '') : '';
    document.getElementById('apImage').value = product ? (product.image || '') : '';
    document.getElementById('apBasePrice').value = product ? (product.basePrice || '') : '';
    var sizesStr = product && product.sizes ? Object.entries(product.sizes).map(function(e) { return e[0] + '=' + e[1]; }).join(', ') : '20x30=50, 30x40=60, 40x50=70, 50x70=90';
    document.getElementById('apSizes').value = sizesStr;
    document.getElementById('apFrames').value = product && product.frames ? product.frames.join(', ') : 'None, Black, White';
    document.getElementById('apDescription').value = product ? (product.description || '') : '';
    document.getElementById('apDescriptionAr').value = product ? (product.descriptionAr || '') : '';
    var preview = document.getElementById('apImagePreview');
    if (preview) preview.src = (product && product.image) ? product.image : '../assets/poster-lab-logo.png';
    form.scrollIntoView({ behavior: 'smooth' });
  }

  function hideProductForm() {
    document.getElementById('adminProductForm').hidden = true;
  }

  function editProduct(pid) {
    var all = getAllMergedProducts();
    var p = all.find(function(x) { return x.id === pid; });
    if (p) openProductForm(p);
  }

  function deleteProduct(pid) {
    if (!confirm('Delete product "' + pid + '"? This cannot be undone.')) return;
    var hardcoded = getDefaultProductsForAdmin();
    var isHardcoded = hardcoded.some(function(h) { return h.id === pid; });
    if (isHardcoded) {
      var custom = loadAdminProducts();
      var without = custom.filter(function(c) { return c.id !== pid; });
      var marked = without.slice();
      marked.push({ id: pid, _deleted: true });
      saveAdminProducts(marked);
    } else {
      var custom2 = loadAdminProducts();
      saveAdminProducts(custom2.filter(function(c) { return c.id !== pid; }));
    }
    renderProducts();
  }

  function clearAllProducts() {
    if (!confirm('Delete ALL products? This will remove all custom-added products and reset hardcoded ones. This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? All custom products will be permanently deleted.')) return;
    saveAdminProducts([]);
    renderProducts();
  }

  function saveProduct() {
    var id = document.getElementById('apId').value.trim();
    var name = document.getElementById('apName').value.trim();
    if (!id || !name) {
      alert('Product ID and Name are required.');
      return;
    }
    var nameAr = document.getElementById('apNameAr').value.trim();
    var category = document.getElementById('apCategory').value;
    var tag = document.getElementById('apTag').value.trim();
    var tagAr = document.getElementById('apTagAr').value.trim();
    var image = document.getElementById('apImage').value.trim();
    var basePrice = parseFloat(document.getElementById('apBasePrice').value) || 0;
    var sizesStr = document.getElementById('apSizes').value.trim();
    var framesStr = document.getElementById('apFrames').value.trim();
    var desc = document.getElementById('apDescription').value.trim();
    var descAr = document.getElementById('apDescriptionAr').value.trim();

    var sizes = { '20x30': basePrice, '30x40': basePrice + 10, '40x50': basePrice + 20, '50x70': basePrice + 40 };
    if (sizesStr) {
      var parsed = {};
      sizesStr.split(',').forEach(function(part) {
        var kv = part.trim().split('=');
        if (kv.length === 2) parsed[kv[0].trim()] = parseFloat(kv[1].trim()) || basePrice;
      });
      if (Object.keys(parsed).length) sizes = parsed;
    }

    var frames = ['None', 'Black', 'White'];
    if (framesStr) {
      var parsedFrames = framesStr.split(',').map(function(f) { return f.trim(); }).filter(Boolean);
      if (parsedFrames.length) frames = parsedFrames;
    }

    var productData = {
      id: id, name: name, nameAr: nameAr, category: category, tag: tag, tagAr: tagAr, image: image,
      basePrice: basePrice,
      gallery: [image],
      sizes: sizes,
      frames: frames,
      description: desc, descriptionAr: descAr
    };

    var custom = loadAdminProducts();
    var idx = custom.findIndex(function(c) { return c.id === id; });
    if (idx >= 0) custom[idx] = productData;
    else custom.push(productData);
    saveAdminProducts(custom);
    document.getElementById('adminProductForm').hidden = true;
    renderProducts();
  }

  function renderCoupons() {
    var coupons = getCouponsData();
    var container = document.getElementById('adminCouponsList');
    if (!coupons.length) {
      container.innerHTML = '<p class="empty-state">No coupons yet</p>';
      return;
    }
    var rows = coupons.map(function(c) {
      return '<tr>' +
        '<td><strong>' + c.code + '</strong></td>' +
        '<td>' + c.type + '</td>' +
        '<td>' + (c.type === 'percent' ? c.value + '%' : 'EGP ' + c.value) + '</td>' +
        '<td>EGP ' + (c.minOrder || 0) + '</td>' +
        '<td>' + (c.uses || 0) + '</td>' +
        '<td>' + (c.maxUses || '\u221E') + '</td>' +
        '<td><button class="admin-delete-coupon secondary-button" data-action="delete-coupon" data-code="' + c.code + '" style="border-color:var(--danger);color:var(--danger)">Delete</button></td>' +
        '</tr>';
    }).join('');
    container.innerHTML = '<table class="admin-table"><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Max</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function openCouponForm() {
    var form = document.getElementById('adminCouponForm');
    form.hidden = false;
    document.getElementById('acCode').value = '';
    document.getElementById('acValue').value = '';
    document.getElementById('acMinOrder').value = '0';
    document.getElementById('acMaxUses').value = '100';
  }

  function hideCouponForm() {
    document.getElementById('adminCouponForm').hidden = true;
  }

  function saveCoupon() {
    var code = document.getElementById('acCode').value.trim().toUpperCase();
    var type = document.getElementById('acType').value;
    var value = parseFloat(document.getElementById('acValue').value) || 0;
    var minOrder = parseFloat(document.getElementById('acMinOrder').value) || 0;
    var maxUses = parseInt(document.getElementById('acMaxUses').value) || 100;
    if (!code || !value) { alert('Code and value required.'); return; }
    var coupons = getCouponsData();
    if (coupons.find(function(c) { return c.code === code; })) { alert('Coupon code already exists.'); return; }
    coupons.push({ code: code, type: type, value: value, minOrder: minOrder, maxUses: maxUses, uses: 0 });
    saveCouponsData(coupons);
    document.getElementById('adminCouponForm').hidden = true;
    renderCoupons();
  }

  function deleteCoupon(code) {
    if (!confirm('Delete coupon "' + code + '"?')) return;
    var c = getCouponsData();
    saveCouponsData(c.filter(function(x) { return x.code !== code; }));
    renderCoupons();
  }

  function renderAnalytics() {
    var orders = getOrders();
    var delivered = orders.filter(function(o) { return o.status === 'delivered' || o.status === 'shipped'; });
    var completed = orders.filter(function(o) { return o.status === 'delivered'; });
    var allProducts = getAllMergedProducts();

    var avgOrder = delivered.length ? delivered.reduce(function(s, o) { return s + (o.total || 0); }, 0) / delivered.length : 0;
    document.getElementById('analyticsAvgOrder').textContent = 'EGP ' + Math.round(avgOrder);

    var itemCounts = {};
    delivered.forEach(function(o) {
      (o.items || []).forEach(function(item) {
        var pid = item.productId || item.id;
        itemCounts[pid] = (itemCounts[pid] || 0) + (item.quantity || 1);
      });
    });
    var topEntries = Object.entries(itemCounts).sort(function(a, b) { return b[1] - a[1]; });
    var topProduct = topEntries.length ? topEntries[0][0] : '-';
    var topProductName = allProducts.find(function(p) { return p.id === topProduct; })?.name || topProduct;
    document.getElementById('analyticsTopProduct').textContent = topProductName;

    var codOrders = orders.filter(function(o) { return o.paymentMethod && o.paymentMethod.includes('Cash'); }).length;
    var codRate = orders.length ? Math.round((codOrders / orders.length) * 100) : 0;
    document.getElementById('analyticsConversion').textContent = codRate + '%';

    var customerPhones = [...new Set(orders.filter(function(o) { return o.customerPhone; }).map(function(o) { return o.customerPhone; }))];
    var repeatCustomers = customerPhones.filter(function(phone) { return orders.filter(function(o) { return o.customerPhone === phone; }).length > 1; }).length;
    var repeatRate = customerPhones.length ? Math.round((repeatCustomers / customerPhones.length) * 100) : 0;
    document.getElementById('analyticsRepeatRate').textContent = repeatRate + '%';

    var monthlyData = {};
    orders.forEach(function(o) {
      var d = new Date(o.date);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      monthlyData[key] = (monthlyData[key] || 0) + (o.total || 0);
    });
    var sortedMonths = Object.keys(monthlyData).sort();
    var chart = document.getElementById('analyticsChart');
    if (!sortedMonths.length) {
      chart.innerHTML = '<p class="empty-state">No sales data yet</p>';
    } else {
      var maxVal = Math.max.apply(null, Object.values(monthlyData));
      chart.innerHTML = '<div class="chart-bars">' + sortedMonths.map(function(m) {
        var val = monthlyData[m];
        var h = maxVal ? (val / maxVal) * 100 : 0;
        var label = m.split('-')[1] + '/' + m.split('-')[0].slice(2);
        return '<div class="chart-bar-wrap" title="EGP ' + val + '"><div class="chart-bar" style="height:' + h + '%"></div><span class="chart-label">' + label + '</span></div>';
      }).join('') + '</div>';
    }

    var popularContainer = document.getElementById('analyticsPopularProducts');
    if (!topEntries.length) {
      popularContainer.innerHTML = '<p class="empty-state">No product data yet</p>';
    } else {
      popularContainer.innerHTML = '<table class="admin-table"><thead><tr><th>#</th><th>Product</th><th>Orders</th></tr></thead><tbody>' +
        topEntries.slice(0, 10).map(function(entry, i) {
          var prod = allProducts.find(function(p) { return p.id === entry[0]; });
          return '<tr><td>' + (i + 1) + '</td><td><strong>' + (prod ? prod.name : entry[0]) + '</strong></td><td>' + entry[1] + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
