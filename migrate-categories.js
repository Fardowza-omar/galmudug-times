/**
 * Migration script: Update categories to Somali language
 * Run with: node migrate-categories.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'articles.db');
const db = new sqlite3.Database(dbPath);

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

db.serialize(() => {
  // Hide old categories
  console.log('Hiding old English categories:');
  oldSlugs.forEach(slug => {
    db.run('UPDATE categories SET show_in_nav = 0 WHERE slug = ?', [slug], function(err) {
      if (!err && this.changes > 0) {
        console.log(`  Hidden: ${slug}`);
      }
    });
  });

  // Insert new Somali categories
  console.log('\nAdding Somali categories:');
  newCategories.forEach(cat => {
    db.run(`
      INSERT INTO categories (name, slug, color, show_in_nav, nav_order)
      VALUES (?, ?, ?, 1, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        color = excluded.color,
        show_in_nav = 1,
        nav_order = excluded.nav_order
    `, [cat.name, cat.slug, cat.color, cat.order], function(err) {
      if (err) console.log(`  Error: ${cat.name} - ${err.message}`);
      else console.log(`  + ${cat.name} (${cat.slug})`);
    });
  });

  // Wait a bit then show current nav
  setTimeout(() => {
    db.all('SELECT name, slug FROM categories WHERE show_in_nav = 1 ORDER BY nav_order', (err, rows) => {
      console.log('\n--- Navigation Menu ---');
      if (rows) {
        rows.forEach((c, i) => console.log(`  ${i+1}. ${c.name}`));
      }
      console.log('\n[OK] Migration complete!');
      db.close();
    });
  }, 500);
});
