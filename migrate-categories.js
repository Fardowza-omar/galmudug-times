/**
 * Migration script: Update categories to Somali language
 * Run with: node migrate-categories.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'articles.db');
const db = new Database(dbPath);

console.log('Starting category migration to Somali...\n');

// New Somali categories
const newCategories = [
  { name: 'Wararka', slug: 'wararka', color: '#d63031', order: 1 },           // News
  { name: 'Galmudug', slug: 'galmudug', color: '#1e90ff', order: 2 },         // Local Galmudug news
  { name: 'Bulshada', slug: 'bulshada', color: '#27ae60', order: 3 },         // Community/Society
  { name: 'Caafimaadka', slug: 'caafimaadka', color: '#e74c3c', order: 4 },   // Health
  { name: 'Waxbarashada', slug: 'waxbarashada', color: '#8e44ad', order: 5 }, // Education
  { name: 'Dhaqaalaha', slug: 'dhaqaalaha', color: '#f39c12', order: 6 },     // Economy
  { name: 'Ciyaaraha', slug: 'ciyaaraha', color: '#00b894', order: 7 },       // Sports
  { name: 'Suugaanta', slug: 'suugaanta', color: '#6c5ce7', order: 8 }        // Culture/Arts
];

// Hide old English categories from nav
const oldSlugs = ['politics', 'world', 'business', 'technology', 'opinion', 'culture', 'analysis'];

try {
  // Hide old categories
  const hideStmt = db.prepare('UPDATE categories SET show_in_nav = 0 WHERE slug = ?');
  oldSlugs.forEach(slug => {
    const result = hideStmt.run(slug);
    if (result.changes > 0) {
      console.log(`  Hidden: ${slug}`);
    }
  });

  // Insert or update new Somali categories
  const insertStmt = db.prepare(`
    INSERT INTO categories (name, slug, color, show_in_nav, nav_order)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      color = excluded.color,
      show_in_nav = 1,
      nav_order = excluded.nav_order
  `);

  console.log('\nAdding Somali categories:');
  newCategories.forEach(cat => {
    insertStmt.run(cat.name, cat.slug, cat.color, cat.order);
    console.log(`  + ${cat.name} (${cat.slug})`);
  });

  // Show current nav categories
  const navCats = db.prepare('SELECT name, slug FROM categories WHERE show_in_nav = 1 ORDER BY nav_order').all();
  console.log('\n--- Navigation Menu ---');
  navCats.forEach((c, i) => console.log(`  ${i+1}. ${c.name}`));

  console.log('\n[OK] Migration complete!');
} catch (err) {
  console.error('[ERROR]', err.message);
  process.exit(1);
}

db.close();
