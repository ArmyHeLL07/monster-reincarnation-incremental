const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const combatFile = path.join(projectRoot, 'packages/client/src/game/combat.ts');
const content = fs.readFileSync(combatFile, 'utf8');

const terms = [
  'stun', 'petrify', 'freeze', 'immunity', 'immune', 'poison', 'acid', 'resistance', 'resist'
];

const lines = content.split('\n');
const matches = [];

lines.forEach((line, idx) => {
  terms.forEach(term => {
    if (line.toLowerCase().includes(term.toLowerCase())) {
      matches.push({ lineNum: idx + 1, term, content: line.trim() });
    }
  });
});

console.log(`Found ${matches.length} matches in combat.ts:`);
matches.forEach(m => {
  console.log(`- Line ${m.lineNum} (Term: "${m.term}"): ${m.content}`);
});
