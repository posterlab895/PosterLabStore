const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../..');
const files = ['index.html', 'product.html', 'our-work.html', 'faq.html'];

console.log('Root Directory:', rootDir);
const results = {};

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const brandMatch = content.match(/<a[^>]*class=["'][^"']*brand[^"']*["'][^>]*href=["']([^"']*)["']/i);
  const brandHref = brandMatch ? brandMatch[1] : null;

  const scriptMatches = [...content.matchAll(/<script[^>]*src=["']([^"']*)["']/gi)].map(m => m[1]);

  results[file] = {
    brandTag: /<a[^>]*class=["'][^"']*brand/.test(content),
    brandHref,
    hamburger: /data-open-nav/.test(content),
    searchIcon: /data-search-icon/.test(content),
    themeToggle: /data-theme-toggle/.test(content),
    langToggle: /data-lang-toggle/.test(content),
    accountBtn: /data-account-btn/.test(content),
    cartBtn: /data-open-cart/.test(content),
    cartCount: /data-cart-count/.test(content),
    pendingBadge: /data-pending-count/.test(content),
    navDrawer: /data-nav-drawer/.test(content),
    navClose: /data-close-nav/.test(content),
    navBody: /data-nav-body/.test(content),
    cartDrawer: /data-cart-drawer/.test(content),
    cartClose: /data-close-cart/.test(content),
    clearCart: /data-clear-cart/.test(content),
    cartItems: /id=["']cartItems["']/.test(content),
    checkoutForm: /id=["']checkoutForm["']/.test(content),
    scripts: scriptMatches
  };
});

console.log(JSON.stringify(results, null, 2));
