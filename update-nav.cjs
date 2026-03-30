const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/app/data/articles.db');

db.serialize(() => {
  // Hide all current categories from nav
  db.run('UPDATE categories SET show_in_nav=0');
  
  // Create regional categories for main nav
  const navCategories = [
    {name: 'Somalia', slug: 'somalia', color: '#1e90ff', order: 1},
    {name: 'Somaliland', slug: 'somaliland', color: '#27ae60', order: 2},
    {name: 'Galmudug', slug: 'galmudug', color: '#d63031', order: 3},
    {name: 'Puntland', slug: 'puntland', color: '#8e44ad', order: 4},
    {name: 'Jubaland', slug: 'jubaland', color: '#f39c12', order: 5},
    {name: 'Caalamka', slug: 'caalamka', color: '#00b894', order: 6}
  ];
  
  navCategories.forEach(c => {
    db.run(`INSERT INTO categories (name, slug, color, show_in_nav, nav_order) 
            VALUES (?, ?, ?, 1, ?) 
            ON CONFLICT(slug) DO UPDATE SET 
            name=excluded.name, color=excluded.color, show_in_nav=1, nav_order=excluded.nav_order`,
      [c.name, c.slug, c.color, c.order]);
  });
  
  // Map old articles from old categories to new ones
  // Politics, World, Business -> Somalia (general news)
  db.run("UPDATE articles SET category_id = (SELECT id FROM categories WHERE slug='somalia') WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('politics','world','business'))");
  
  // Technology -> Caalamka (World/Tech)
  db.run("UPDATE articles SET category_id = (SELECT id FROM categories WHERE slug='caalamka') WHERE category_id IN (SELECT id FROM categories WHERE slug='technology')");
  
  // Opinion, Culture, Analysis -> stay but mapped to regional
  db.run("UPDATE articles SET category_id = (SELECT id FROM categories WHERE slug='galmudug') WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('opinion','culture','analysis'))");
  
  setTimeout(() => {
    db.all('SELECT name, slug FROM categories WHERE show_in_nav=1 ORDER BY nav_order', (e, r) => {
      console.log('New Nav Menu:', r.map(x => x.name).join(' | '));
      db.all('SELECT COUNT(*) as count FROM articles', (e2, r2) => {
        console.log('Total articles:', r2[0].count);
        db.close();
      });
    });
  }, 500);
});
