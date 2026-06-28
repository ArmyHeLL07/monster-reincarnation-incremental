const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const combatFile = path.join(projectRoot, 'packages/client/src/game/combat.ts');
const content = fs.readFileSync(combatFile, 'utf8');

const lines = content.split('\n');
const matches = [];

lines.forEach((line, idx) => {
  if (line.includes('mpCost') || line.includes('hpCost') || line.toLowerCase().includes('cost') || line.includes('state.mp')) {
    matches.push({ lineNum: idx + 1, content: line.trim() });
  }
});

console.log(`Found ${matches.length} matches in combat.ts:`);
matches.forEach(m => {
  console.log(`- Line ${m.lineNum}: ${m.content}`);
});
