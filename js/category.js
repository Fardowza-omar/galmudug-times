/**
 * Category page: card-grid layout with featured top card + load-more grid.
 */
function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime(), mins = Math.floor(diff / 60000);
    if (mins < 2) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return new Date(d).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'});
}
function cleanTitle(raw) {
    if (!raw) return '';
    const cuts = [/\s+\d{4}\s+[Bb]y\s+/,/\s+[Bb]y\s+[A-Z\u00C0-\u024F][a-z]/,/\s+\d+\s*min/i];
    let t = raw.trim();
    for (const re of cuts) { const i = t.search(re); if (i > 20) { t = t.substring(0,i).trim(); break; } }
    return t;
}

async function loadTicker() {
    try {
        const res = await fetch('/api/breaking-news');
        const items = await res.json();
        if (items.length) {
            const el = document.getElementById('tickerText');
            if (el) {
                const text = items.map(i => i.title).join('   ·   ');
                el.textContent = text + '     ·     ' + text;
                requestAnimationFrame(() => {
                    const dur = Math.max(25, Math.round(el.scrollWidth / 2 / 70));
                    el.style.animationDuration = dur + 's';
                });
            }
        }
    } catch(e) {}
}

// State for load-more
let _catAllArticles = [];
let _catShown = 0;
const CAT_BATCH = 9;
let _catColor = '#d63031';

function renderCatCard(a, color) {
    const t = cleanTitle(a.title);
    const desc = (a.description || (a.content||'').replace(/<[^>]*>/g,'')).trim().substring(0,110);
    const img = a.featured_image
        ? `<img class="cat-card-img" src="${esc(a.featured_image)}" alt="${esc(t)}" loading="lazy">`
        : `<div class="cat-card-no-img" style="background:${esc(color)};"></div>`;
    return `<a href="/article?id=${esc(String(a.id))}&slug=${esc(a.slug)}" class="cat-card">
        ${img}
        <div class="cat-card-body">
            <span class="cat-card-cat" style="color:${esc(color)};">${esc((a.category_name||'News').toUpperCase())}</span>
            <span class="cat-card-title">${esc(t)}</span>
            ${desc ? `<span class="cat-card-desc">${esc(desc)}${desc.length>=110?'…':''}</span>` : ''}
            <span class="cat-card-meta">${esc(a.author||'Galmudug Times')} &middot; ${timeAgo(a.published_at)}</span>
        </div>
    </a>`;
}

function catLoadMore() {
    const grid = document.getElementById('cat-article-grid');
    if (!grid) return;
    const batch = _catAllArticles.slice(_catShown, _catShown + CAT_BATCH);
    if (!batch.length) return;
    grid.innerHTML += batch.map(a => renderCatCard(a, _catColor)).join('');
    _catShown += batch.length;
    const btn = document.getElementById('cat-load-more-btn');
    const wrap = document.getElementById('cat-load-more');
    if (_catShown >= _catAllArticles.length) {
        if (wrap) wrap.style.display = 'none';
    } else {
        if (btn) btn.disabled = false;
    }
}

async function initCategoryPage(slug, color) {
    _catColor = color || '#d63031';
    loadTicker();
    try {
        const res = await fetch(`/api/articles?category=${encodeURIComponent(slug)}&limit=60&_t=${Date.now()}`);
        const articles = await res.json();

        if (!articles.length) {
            const topEl = document.getElementById('cat-top-card');
            if (topEl) topEl.innerHTML = '<p style="color:#aaa;padding:2rem 0;font-family:Inter,sans-serif;">No articles in this category yet.</p>';
            return;
        }

        // ── Top featured card ────────────────────────────────────────
        const hero = articles[0];
        const heroTitle = cleanTitle(hero.title);
        const heroDesc = (hero.description || (hero.content||'').replace(/<[^>]*>/g,'')).trim().substring(0,220);
        const topEl = document.getElementById('cat-top-card');
        if (topEl) {
            const heroImg = hero.featured_image
                ? `<img class="cat-top-img" src="${esc(hero.featured_image)}" alt="${esc(heroTitle)}" loading="eager">`
                : `<div class="cat-top-img" style="background:${esc(color)};"></div>`;
            topEl.className = 'cat-top-card';
            topEl.innerHTML = `
                <div>${heroImg}</div>
                <div class="cat-top-body">
                    <span class="cat-top-cat" style="background:${esc(color)};">${esc((hero.category_name||slug).toUpperCase())}</span>
                    <a href="/article?id=${esc(String(hero.id))}&slug=${esc(hero.slug)}" class="cat-top-title">${esc(heroTitle)}</a>
                    ${heroDesc ? `<p class="cat-top-desc">${esc(heroDesc)}${heroDesc.length>=220?'…':''}</p>` : ''}
                    <span class="cat-top-meta">${esc(hero.author||'Galmudug Times')} &middot; ${timeAgo(hero.published_at)}</span>
                </div>`;
        }

        // ── Grid ─────────────────────────────────────────────────────
        _catAllArticles = articles.slice(1);
        _catShown = 0;

        const hdr = document.getElementById('cat-grid-hdr');
        const hdrTitle = document.getElementById('cat-grid-hdr-title');
        if (_catAllArticles.length > 0) {
            if (hdr) hdr.style.display = 'flex';
            if (hdrTitle) hdrTitle.textContent = 'MORE IN ' + (hero.category_name||slug).toUpperCase();
        }

        const grid = document.getElementById('cat-article-grid');
        if (grid) {
            const first = _catAllArticles.slice(0, CAT_BATCH);
            grid.innerHTML = first.map(a => renderCatCard(a, color)).join('');
            _catShown = first.length;
        }

        const wrap = document.getElementById('cat-load-more');
        if (wrap) wrap.style.display = _catAllArticles.length > CAT_BATCH ? 'block' : 'none';

    } catch(e) {
        console.error('Category load error:', e);
    }
}
