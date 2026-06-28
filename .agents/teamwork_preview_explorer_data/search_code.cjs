const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');

const searchTerms = [
  'hpCost'
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    if (f === 'node_modules' || f === '.git' || f === '.agents') return;
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const matches = [];

walkDir(projectRoot, filePath => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.json')) return;
  if (filePath.includes('analyze') || filePath.includes('search_code')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    searchTerms.forEach(term => {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        matches.push({
          file: path.relative(projectRoot, filePath),
          line: idx + 1,
          term: term,
          content: line.trim()
        });
      }
    });
  });
});

console.log(`Found ${matches.length} matches:`);
matches.forEach(m => {
  console.log(`- File: ${m.file}:${m.line} | Term: "${m.term}"`);
  console.log(`  Code: ${m.content}`);
});
