/**
 * Galmudug Times – Global Header Functions
 * Weather widget, date display, search toggle, mobile nav
 */

// ═══════════════════════════════
//  Weather Widget
// ═══════════════════════════════
const GT_CITIES = [
    { name: 'Mogadishu',  lat: 2.0469,   lon: 45.3182 },
    { name: 'Galkayo',    lat: 6.7750,   lon: 47.4320 },
    { name: 'Bosaso',     lat: 11.2840,  lon: 49.1816 },
    { name: 'Kismayo',    lat: -0.3580,  lon: 42.5454 },
    { name: 'Baidoa',     lat: 3.1100,   lon: 43.6490 },
    { name: 'Hargeisa',   lat: 9.5608,   lon: 44.0650 },
    { name: 'Garowe',     lat: 8.4054,   lon: 48.4844 },
    { name: 'Berbera',    lat: 10.4396,  lon: 45.0170 },
    { name: 'Balanbal',   lat: 5.0000,   lon: 46.9000 }
];

const _WX_CACHE_KEY = 'gt_weather_data';
let _weatherData = {};
let _cityIndex   = 0;

// Restore cached weather immediately so first render shows real data
(function _restoreWeatherCache() {
    try {
        const raw = sessionStorage.getItem(_WX_CACHE_KEY);
        if (raw) _weatherData = JSON.parse(raw);
    } catch (_) {}
})();

function _weatherIcon(code) {
    if (code === 0)   return '<i class="fas fa-sun"></i>';
    if (code <= 2)    return '<i class="fas fa-cloud-sun"></i>';
    if (code <= 3)    return '<i class="fas fa-cloud"></i>';
    if (code <= 49)   return '<i class="fas fa-smog"></i>';
    if (code <= 67)   return '<i class="fas fa-cloud-rain"></i>';
    if (code <= 77)   return '<i class="fas fa-snowflake"></i>';
    if (code <= 82)   return '<i class="fas fa-cloud-showers-heavy"></i>';
    return '<i class="fas fa-bolt"></i>';
}

async function _fetchAllWeather() {
    for (const city of GT_CITIES) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=auto`;
            const r   = await fetch(url);
            const d   = await r.json();
            _weatherData[city.name] = {
                temp: Math.round(d.current.temperature_2m),
                code: d.current.weather_code
            };
        } catch (_) { /* keep retrying other cities */ }
    }
    // Persist to sessionStorage so next page load shows real data instantly
    try { sessionStorage.setItem(_WX_CACHE_KEY, JSON.stringify(_weatherData)); } catch (_) {}
}

function _rotateWeather() {
    const iconEl = document.getElementById('wtIcon');
    const tempEl = document.getElementById('wtTemp');
    const cityEl = document.getElementById('wtCity');
    if (!iconEl || !tempEl || !cityEl) return;

    const city = GT_CITIES[_cityIndex];
    const d    = _weatherData[city.name];

    iconEl.innerHTML = d ? _weatherIcon(d.code) : '<i class="fas fa-sun"></i>';
    tempEl.textContent = d ? d.temp + '\u00b0C' : '--\u00b0C';
    cityEl.textContent = city.name;

    // Fade animation
    const widget = document.getElementById('weatherWidget');
    if (widget) {
        widget.classList.remove('wt-fade');
        void widget.offsetWidth; // reflow
        widget.classList.add('wt-fade');
    }

    _cityIndex = (_cityIndex + 1) % GT_CITIES.length;
}

// ═══════════════════════════════
//  Date Display
// ═══════════════════════════════
function _setTopbarDate() {
    const el = document.getElementById('topbarDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric'
    });
}

// ═══════════════════════════════
//  Dark Theme Toggle
// ═══════════════════════════════
function _applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById('gtThemeToggle');
    if (btn) btn.innerHTML = dark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
}

function toggleGTTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = !isDark;
    _applyTheme(next);
    try { localStorage.setItem('gt_theme', next ? 'dark' : 'light'); } catch (_) {}
}

// Apply saved theme immediately (before DOMContentLoaded to avoid flash)
(function _initTheme() {
    try {
        const saved = localStorage.getItem('gt_theme');
        if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
})();

// ═══════════════════════════════
//  Search Toggle
// ═══════════════════════════════
function toggleGTSearch() {
    const bar = document.getElementById('gtSearchExpand');
    const inp = document.getElementById('searchInput');
    if (!bar) return;
    const open = bar.style.display === 'none' || bar.style.display === '';
    bar.style.display = open ? 'block' : 'none';
    if (open && inp) { inp.focus(); inp.value = ''; }
    // Hide results when closing
    if (!open) {
        const res = document.getElementById('searchResults');
        if (res) res.style.display = 'none';
    }
}

// ═══════════════════════════════
//  Mobile Nav Toggle
// ═══════════════════════════════
function toggleGTMobileNav() {
    const nav = document.querySelector('.gt-nav');
    if (nav) nav.classList.toggle('open');
}

// ═══════════════════════════════
//  Utility
// ═══════════════════════════════
function _escHtml(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════
//  Default doSearch (used on pages
//  that don't define their own)
// ═══════════════════════════════
window.doSearch = window.doSearch || function doSearch() {
    const q   = (document.getElementById('searchInput')?.value || '').trim();
    const box = document.getElementById('searchResults');
    if (!box) return;
    if (!q) { box.style.display = 'none'; return; }

    box.style.display = 'block';
    box.innerHTML = '<div class="gt-search-results-inner"><p style="font-family:Inter,sans-serif;font-size:.85rem;color:#999;padding:.5rem 0;">Searching…</p></div>';

    fetch('/api/search?q=' + encodeURIComponent(q))
        .then(r => r.json())
        .then(results => {
            if (!results.length) {
                box.innerHTML = `<div class="gt-search-results-inner"><p class="gt-sr-count">No results for "${_escHtml(q)}"</p></div>`;
                return;
            }
            const items = results.map(a =>
                `<div class="gt-sr-item">
                    <span class="gt-sr-cat" style="background:${_escHtml(a.category_color || '#8B0000')}">${_escHtml(a.category_name || 'News')}</span>
                    <a class="gt-sr-title" href="/article?id=${encodeURIComponent(a.id)}&slug=${encodeURIComponent(a.slug)}">${_escHtml(a.title)}</a>
                </div>`
            ).join('');
            box.innerHTML = `<div class="gt-search-results-inner">
                <p class="gt-sr-count">${results.length} result${results.length > 1 ? 's' : ''} for "${_escHtml(q)}"</p>
                ${items}
                <button class="gt-sr-close" onclick="document.getElementById('searchResults').style.display='none'">Close results ✕</button>
            </div>`;
        })
        .catch(() => {
            box.innerHTML = '<div class="gt-search-results-inner"><p style="color:#c41e3a;font-family:Inter,sans-serif;font-size:.85rem;">Search failed — is the server running?</p></div>';
        });
};

// ═══════════════════════════════
//  Init
// ═══════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    _setTopbarDate();
    _applyTheme(document.documentElement.getAttribute('data-theme') === 'dark');

    // Start weather rotation immediately (cache gives real values on refresh)
    // then refresh data from API in the background and keep rotating
    _rotateWeather();
    const _wxInterval = setInterval(_rotateWeather, 4000);
    _fetchAllWeather(); // background refresh — no await, won't block rotation

    // Close mobile nav when a link is clicked
    document.querySelectorAll('.gt-nav .nav-item').forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.querySelector('.gt-nav');
            if (nav) nav.classList.remove('open');
        });
    });

    // Mark active nav link
    const path = window.location.pathname.toLowerCase();
    document.querySelectorAll('.gt-nav .nav-item').forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (!href || href === '#') return;
        const isHome    = href === '/' && (path === '/' || path === '/index' || path.endsWith('index.html'));
        const isSection = href !== '/' && path.includes(href.split('?')[0].replace('.html','').replace('/',''));
        if (isHome || isSection) link.classList.add('nav-active');
    });
});
