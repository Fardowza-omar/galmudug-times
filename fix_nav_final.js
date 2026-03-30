import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('/home/app/data/articles.db');
db.run('UPDATE categories SET show_in_nav=0 WHERE id IN (206,208,210,213)', function(err) {
  if (err) { console.error('UPDATE error:', err); process.exit(1); }
  console.log('Updated rows:', this.changes);
  db.all('SELECT id,name,show_in_nav FROM categories WHERE show_in_nav=1', (err2, rows) => {
    if (err2) { console.error('SELECT error:', err2); process.exit(1); }
    console.log('Nav categories now:', JSON.stringify(rows));
    db.close();
  });
});