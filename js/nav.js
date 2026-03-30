/**
 * Dynamic navigation loader - fetches visible categories from the database
 * Admin panel controls which categories appear in nav and their order
 * Include this script and add id="dynamic-nav" to your <nav class="main-nav"> element
 */

// Detect current page slug from URL (supports both clean URLs and .html)
function getCurrentSlug() {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    // Match /pagename or /pagename.html
    const match = path.match(/\/([a-z0-9-]+)(\.html)?$/i);
    if (match) return match[1];
    if (path === '/' || path === '') return 'index';
    return null;
}

// Get the current ?cat= query param value
function getCurrentCatParam() {
    return new URLSearchParams(window.location.search).get('cat') || null;
}

function buildNavHTML(categories) {
    const currentSlug = getCurrentSlug();
    const currentCat  = getCurrentCatParam();

    let links = `<a href="/" class="nav-item${currentSlug === 'index' || !currentSlug ? ' nav-active' : ''}">Home</a>\n                `;

    links += categories.map(cat => {
        const page = cat.page_file ? cat.page_file.replace(/\.html(\?|$)/, (m, q) => q ? '?' : '') : `/category?cat=${cat.slug}`;
        const name = cat.name;
        const isActive = (cat.slug === currentSlug) ||
                         (currentSlug === 'category' && currentCat === cat.slug) ||
                         (cat.page_file && cat.page_file.replace(/\.html.*/, '') === currentSlug);
        const activeClass = isActive ? ' nav-active' : '';
        return `<a href="${page}" class="nav-item${activeClass}">${escNav(name)}</a>`;
    }).join('\n                ');

    links += `\n                <a href="/contact" class="nav-item${currentSlug === 'contact' ? ' nav-active' : ''}">Contact</a>`;
    return links;
}

async function loadDynamicNav() {
    const navEl = document.getElementById('dynamic-nav');
    if (!navEl) return;

    // Save the original server-rendered HTML as fallback
    const fallbackHTML = navEl.innerHTML;

    // ── Step 1: render from cache instantly (no flicker) ──────────────
    const CACHE_KEY = 'gt_nav_v5';
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.length > 0) navEl.innerHTML = buildNavHTML(parsed);
        } catch(e) { /* ignore bad cache */ }
    }

    // ── Step 2: fetch fresh data in background & update if changed ────
    try {
        const res = await fetch('/api/categories/nav/visible');
        const categories = await res.json();
        // Only replace nav if API returned actual categories
        if (categories.length > 0) {
            const fresh = JSON.stringify(categories);
            if (fresh !== cached) {
                sessionStorage.setItem(CACHE_KEY, fresh);
                navEl.innerHTML = buildNavHTML(categories);
            }
        }
        // If API returned empty, keep the fallback HTML as-is
    } catch (e) {
        // If fetch fails and we already rendered from cache, that's fine
        if (!cached) console.error('Failed to load navigation:', e);
    }
}

function escNav(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicNav);
} else {
    loadDynamicNav();
}
