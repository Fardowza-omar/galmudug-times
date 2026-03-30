const fs = require('fs');
let content = fs.readFileSync('c:\\Users\\omara\\galmudug-times\\index.html', 'utf8');

// Fix corrupted UTF-8 sequences using hex codes
const fixes = [
  ['\u00e2\u20ac\u201d', '-'],      // em-dash corruption
  ['\u00e2\u201c\u20ac', '-'],      // box drawing corruption A
  ['\u00e2\u201c\u0090', ''],       // box drawing corruption B
  ['\u00c3\u00b0\u0178\u0152\u00a1\u00c3\u00af\u00c2\u00b8', '\u{1F321}'],   // thermometer
  ['\u00c2\u00b0', '\u00b0'],       // degree symbol
  ['\u00c2\u00b7', '\u00b7'],       // middle dot
  ['\u00e2\u20ac\u00a6', '...'],    // ellipsis
];

for (const [bad, good] of fixes) {
  content = content.split(bad).join(good);
}

// Clean up box drawing characters in comments (decorative only)
// The pattern is: â (U+00E2) + " (U+201C) + € (U+20AC of the previous conversion) 
content = content.replace(/[\u00e2][\u201c\u201d\u2019\u0192][\u20ac\u0090\u02c6\u2014]+/g, '');

fs.writeFileSync('c:\\Users\\omara\\galmudug-times\\index.html', content, 'utf8');
console.log('Encoding fixed!');
