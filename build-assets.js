const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function build() {
  console.log('--- Building & Minifying Assets ---');

  // Simple, safe CSS minifier function
  function minifyCss(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
      .replace(/\s+/g, ' ')             // collapse whitespace
      .replace(/\s*([\{\}\:\;\,])\s*/g, '$1') // remove space around separators
      .replace(/\;(?=\})/g, '')         // remove trailing semicolons
      .trim();
  }

  // 1. Minify styles.css
  console.log('Minifying styles.css...');
  const stylesCss = fs.readFileSync('styles.css', 'utf8');
  const stylesMinCss = minifyCss(stylesCss);
  fs.writeFileSync('styles.min.css', stylesMinCss, 'utf8');
  fs.writeFileSync('admin/styles.min.css', stylesMinCss, 'utf8');
  fs.writeFileSync('admin/styles.css', stylesCss, 'utf8');
  console.log(`styles.min.css generated (${stylesMinCss.length} bytes)`);

  // 2. Minify admin.css
  console.log('Minifying admin.css...');
  const adminCss = fs.readFileSync('admin.css', 'utf8');
  const adminMinCss = minifyCss(adminCss);
  fs.writeFileSync('admin.min.css', adminMinCss, 'utf8');
  fs.writeFileSync('admin/admin.min.css', adminMinCss, 'utf8');
  fs.writeFileSync('admin/admin.css', adminCss, 'utf8');
  console.log(`admin.min.css generated (${adminMinCss.length} bytes)`);

  // 3. Minify script.js with Terser
  console.log('Minifying script.js with Terser...');
  const scriptJs = fs.readFileSync('script.js', 'utf8');
  try {
    const minifiedScript = await minify(scriptJs, {
      compress: {
        drop_console: false,
        drop_debugger: true,
        passes: 1
      },
      mangle: false, // Keep function names safe for global handlers
      format: {
        comments: false
      }
    });
    fs.writeFileSync('script.min.js', minifiedScript.code, 'utf8');
    console.log(`script.min.js generated (${minifiedScript.code.length} bytes)`);
  } catch (err) {
    console.error('Terser error on script.js:', err);
    process.exit(1);
  }

  // 4. Minify admin-panel.js with Terser
  console.log('Minifying admin-panel.js with Terser...');
  const adminPanelJs = fs.readFileSync('admin-panel.js', 'utf8');
  try {
    const minifiedAdminPanel = await minify(adminPanelJs, {
      compress: { passes: 1 },
      mangle: false,
      format: { comments: false }
    });
    fs.writeFileSync('admin-panel.min.js', minifiedAdminPanel.code, 'utf8');
    fs.writeFileSync('admin/admin-panel.min.js', minifiedAdminPanel.code, 'utf8');
    fs.writeFileSync('admin/admin-panel.js', adminPanelJs, 'utf8');
    console.log(`admin-panel.min.js generated (${minifiedAdminPanel.code.length} bytes)`);
  } catch (err) {
    console.error('Terser error on admin-panel.js:', err);
    process.exit(1);
  }

  // 5. Minify admin-login.js with Terser
  console.log('Minifying admin-login.js with Terser...');
  const adminLoginJs = fs.readFileSync('admin-login.js', 'utf8');
  try {
    const minifiedAdminLogin = await minify(adminLoginJs, {
      compress: { passes: 1 },
      mangle: false,
      format: { comments: false }
    });
    fs.writeFileSync('admin-login.min.js', minifiedAdminLogin.code, 'utf8');
    fs.writeFileSync('admin/admin-login.min.js', minifiedAdminLogin.code, 'utf8');
    fs.writeFileSync('admin/admin-login.js', adminLoginJs, 'utf8');
    console.log(`admin-login.min.js generated (${minifiedAdminLogin.code.length} bytes)`);
  } catch (err) {
    console.error('Terser error on admin-login.js:', err);
    process.exit(1);
  }

  // 6. Copy shared bundles to admin/
  fs.copyFileSync('products-bundle.min.js', 'admin/products-bundle.min.js');
  fs.copyFileSync('firebase-config.js', 'admin/firebase-config.js');
  if (fs.existsSync('assets/poster-lab-logo.webp')) {
    fs.copyFileSync('assets/poster-lab-logo.webp', 'admin/poster-lab-logo.webp');
  }
  console.log('Shared bundles and assets copied to admin/');

  console.log('--- Build Assets Complete Successfully ---');
}

build();
