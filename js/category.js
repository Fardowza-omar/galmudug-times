/**
 * Shared dynamic loader for category pages.
 * Include this script and call: initCategoryPage('politics', '#d63031')
 */

function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadTicker() {
    try {
        const res = await fetch('/api/breaking-news');
        const items = await res.json();
        if (items.length) {
            const el = document.getElementById('tickerText');
            if (el) el.textContent = items.map(i => i.title).join('  |  ');
        }
    } catch (e) {}
}

function catSpan(name, color) {
    return `<span style="display:inline-block;background:${color};color:#fff;padding:.3rem .6rem;font-family:'Inter',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.5rem;">${esc(name)}</span>`;
}

async function initCategoryPage(slug, color) {
    loadTicker();

    try {
        // Add cache-busting to always get fresh data
        const res = await fetch(`/api/articles/featured/latest?_t=${Date.now()}`);
        let articles = await res.json();

        // Filter by category if we have a slug
        if (slug) {
            const catRes = await fetch(`/api/categories/${slug}?_t=${Date.now()}`);
            if (catRes.ok) {
                const cat = await catRes.json();
                articles = articles.filter(a => a.category_id === cat.id);
            }
        }

        if (!articles.length) {
            const heroEl = document.getElementById('dynamic-hero');
            if (heroEl) heroEl.innerHTML = '<p style="color:#999;padding:2rem 0;">No articles in this category yet.</p>';
            const gridEl = document.getElementById('dynamic-grid');
            if (gridEl) gridEl.innerHTML = '';
            return;
        }

        // Hero
        const hero = articles[0];
        const heroEl = document.getElementById('dynamic-hero');
        if (heroEl) {
            const desc = hero.description || (hero.content || '').substring(0, 200).replace(/<[^>]*>/g, '');
            heroEl.innerHTML = `
                <div class="story-header">
                    ${catSpan(hero.category_name || slug, hero.category_color || color)}
                    <a href="/article?id=${hero.id}&slug=${encodeURIComponent(hero.slug)}" style="text-decoration:none;color:inherit;">
                        <h2 class="story-headline">${esc(hero.title)}</h2>
                    </a>
                    <p class="story-description">${esc(desc)}${desc.length >= 200 ? '...' : ''}</p>
                </div>
                <div class="story-byline">
                    <span class="author-name">By ${esc(hero.author)}</span>
                    <span class="publish-date">${fmtDate(hero.published_at)}</span>
                </div>
                ${hero.featured_image
                    ? `<figure class="story-image"><img src="${esc(hero.featured_image)}" alt="${esc(hero.title)}" style="width:100%;height:auto;"><figcaption>${esc(hero.title)}</figcaption></figure>`
                    : `<figure class="story-image"><div class="image-placeholder"></div></figure>`}`;
        }

        // Sidebar article 1
        if (articles.length > 1) {
            const s1 = articles[1];
            const s1el = document.getElementById('dynamic-sidebar-1');
            if (s1el) {
                const d = s1.description || (s1.content || '').substring(0, 100).replace(/<[^>]*>/g, '');
                s1el.innerHTML = `
                    ${catSpan(s1.category_name || slug, s1.category_color || color)}
                    <h3 class="story-headline"><a href="/article?id=${s1.id}&slug=${encodeURIComponent(s1.slug)}" style="text-decoration:none;color:inherit;">${esc(s1.title)}</a></h3>
                    <p class="story-description">${esc(d)}${d.length >= 100 ? '...' : ''}</p>
                    <div class="story-byline"><span class="author-name">By ${esc(s1.author)}</span><span class="publish-date">${fmtDate(s1.published_at)}</span></div>`;
            }
        }

        // Sidebar article 2
        if (articles.length > 2) {
            const s2 = articles[2];
            const s2el = document.getElementById('dynamic-sidebar-2');
            if (s2el) {
                const d = s2.description || (s2.content || '').substring(0, 100).replace(/<[^>]*>/g, '');
                s2el.innerHTML = `
                    ${catSpan(s2.category_name || slug, s2.category_color || color)}
                    <h3 class="story-headline"><a href="/article?id=${s2.id}&slug=${encodeURIComponent(s2.slug)}" style="text-decoration:none;color:inherit;">${esc(s2.title)}</a></h3>
                    <p class="story-description">${esc(d)}${d.length >= 100 ? '...' : ''}</p>
                    <div class="story-byline"><span class="author-name">By ${esc(s2.author)}</span><span class="publish-date">${fmtDate(s2.published_at)}</span></div>`;
            }
        }

        // Secondary grid
        const gridEl = document.getElementById('dynamic-grid');
        if (gridEl) {
            const secondary = articles.slice(3);
            if (secondary.length) {
                gridEl.innerHTML = secondary.map(a => {
                    const d = a.description || (a.content || '').substring(0, 120).replace(/<[^>]*>/g, '');
                    return `<article class="story story-secondary">
                        ${catSpan(a.category_name || slug, a.category_color || color)}
                        <h3 class="story-headline"><a href="/article?id=${a.id}&slug=${encodeURIComponent(a.slug)}" style="text-decoration:none;color:inherit;">${esc(a.title)}</a></h3>
                        <div class="story-byline"><span class="author-name">By ${esc(a.author)}</span><span class="publish-date">${fmtDate(a.published_at)}</span></div>
                        <p class="story-description">${esc(d)}${d.length >= 120 ? '...' : ''}</p>
                    </article>`;
                }).join('');
            } else {
                gridEl.innerHTML = '<p style="color:#999;grid-column:1/-1;padding:2rem 0;">No more articles available.</p>';
            }
        }
    } catch (e) {
        console.error('Error loading category articles:', e);
    }
}
