/**
 * Dynamic navigation loader - fetches visible categories from the database
 * Admin panel controls which categories appear in nav and their order
 * Include this script and add id="dynamic-nav" to your <nav class="main-nav"> element
 */

// Detect current page slug from URL
function getCurrentSlug() {
    const path = window.location.pathname.toLowerCase();
    // Extract filename without .html
    const match = path.match(/([a-z0-9-]+)\.html/i);
    return match ? match[1] : null;
}

async function loadDynamicNav() {
    const navEl = document.getElementById('dynamic-nav');
    if (!navEl) return;

    // Check if this is a category page (has HOME link) or index page
    const isCategory = navEl.innerHTML.includes('index.html');
    const currentSlug = getCurrentSlug();

    try {
        // Fetch only categories marked as visible in nav, ordered by nav_order
        const res = await fetch('/api/categories/nav/visible?_t=' + Date.now());
        const categories = await res.json();

        // Start with HOME link if on category page
        let links = '';
        if (isCategory) {
            links += `<a href="index.html" class="nav-item">HOME</a>\n                `;
        }

        // Build nav links from API response (already sorted by nav_order)
        links += categories.map(cat => {
            // Use page_file if set, otherwise use generic category.html with slug parameter
            const page = cat.page_file || `category.html?cat=${cat.slug}`;
            const name = cat.name;
            const color = cat.color || '#000';
            
            // Add active style if this is the current page
            const isActive = (cat.slug === currentSlug) || (page.replace('.html', '') === currentSlug);
            const activeStyle = isActive ? ` style="color: ${color}; border-bottom: 2px solid ${color};"` : '';
            
            return `<a href="${page}" class="nav-item"${activeStyle}>${escNav(name).toUpperCase()}</a>`;
        }).join('\n                ');

        navEl.innerHTML = links;
    } catch (e) {
        console.error('Failed to load navigation:', e);
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
