const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const combatFile = path.join(projectRoot, 'packages/client/src/game/combat.ts');
const content = fs.readFileSync(combatFile, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  const l = line.toLowerCase();
  if (l.includes('stun') || l.includes('petrify') || l.includes('freeze')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
