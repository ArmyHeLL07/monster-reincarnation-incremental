const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const stateFile = path.join(projectRoot, 'packages/client/src/game/state.ts');
const combatFile = path.join(projectRoot, 'packages/client/src/game/combat.ts');

function searchFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('armor') || line.includes('Armor')) {
      console.log(`${path.relative(projectRoot, file)}:${idx + 1}: ${line.trim()}`);
    }
  });
}

searchFile(stateFile);
searchFile(combatFile);
