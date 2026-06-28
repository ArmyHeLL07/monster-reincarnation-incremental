const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const racesPath = path.join(projectRoot, 'data/races.json');
const evolutionsPath = path.join(projectRoot, 'data/evolutions.json');
const skillsPath = path.join(projectRoot, 'data/skills.json');
const enI18nPath = path.join(projectRoot, 'data/i18n/en.json');

const races = JSON.parse(fs.readFileSync(racesPath, 'utf8'));
const evolutions = JSON.parse(fs.readFileSync(evolutionsPath, 'utf8'));
const skills = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
const enI18n = JSON.parse(fs.readFileSync(enI18nPath, 'utf8'));

console.log('--- Races in races.json ---');
races.forEach(r => {
  const name = enI18n[r.locKey] || r.locKey;
  console.log(`- ID: ${r.id}, Name: ${name}, Humanoid: ${!!r.humanoid}`);
});

// Map races by ID
const raceMap = {};
races.forEach(r => { raceMap[r.id] = r; });

// Group evolutions by race
const evosByRace = {};
evolutions.forEach(e => {
  if (!evosByRace[e.raceId]) {
    evosByRace[e.raceId] = [];
  }
  evosByRace[e.raceId].push(e);
});

console.log('\n--- Evolution forms count by race ---');
Object.keys(evosByRace).forEach(raceId => {
  console.log(`- ${raceId}: ${evosByRace[raceId].length} forms`);
});

// Let's trace paths from T1 to T10.
// A form is T1 if levelReq === 1 (or has no parent).
// Let's build parent-child maps.
Object.keys(evosByRace).forEach(raceId => {
  console.log(`\n=== Race: ${raceId} ===`);
  const raceEvos = evosByRace[raceId];
  const formMap = {};
  raceEvos.forEach(f => { formMap[f.id] = f; });
  
  // Find roots (forms that are not target of any evolvesTo within the same race)
  const isTarget = {};
  raceEvos.forEach(f => {
    (f.evolvesTo || []).forEach(childId => {
      isTarget[childId] = true;
    });
  });
  
  const roots = raceEvos.filter(f => !isTarget[f.id]);
  console.log(`Roots: ${roots.map(r => r.id).join(', ')}`);
  
  // Trace BFS/DFS depth for each form to see how many tiers there are.
  const depth = {};
  const queue = roots.map(r => ({ id: r.id, d: 1 }));
  roots.forEach(r => { depth[r.id] = 1; });
  
  while (queue.length > 0) {
    const { id, d } = queue.shift();
    const f = formMap[id];
    if (!f) continue;
    (f.evolvesTo || []).forEach(childId => {
      const child = formMap[childId];
      if (child && (!depth[childId] || depth[childId] < d + 1)) {
        depth[childId] = d + 1;
        queue.push({ id: childId, d: d + 1 });
      }
    });
  }
  
  // Group forms by depth (Tiers)
  const formsByTier = {};
  raceEvos.forEach(f => {
    const t = depth[f.id] || 'Unknown';
    if (!formsByTier[t]) formsByTier[t] = [];
    formsByTier[t].push(f);
  });
  
  Object.keys(formsByTier).sort((a,b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(a) - parseInt(b);
  }).forEach(tier => {
    console.log(`  Tier ${tier}:`);
    formsByTier[tier].forEach(f => {
      const name = enI18n[f.locKey] || f.locKey;
      const skillsGranted = (f.grantSkills || []).map(s => {
        const skillObj = skills.find(sk => sk.id === s);
        const sName = skillObj ? (enI18n[skillObj.locKeyName] || skillObj.locKeyName) : 'N/A';
        return `${s} (${sName})`;
      });
      console.log(`    - ${f.id} ("${name}"): tierReq=${f.tierReq}, levelReq=${f.levelReq}, grantSkills=[${skillsGranted.join(', ')}], evolvesTo=[${(f.evolvesTo || []).join(', ')}]`);
    });
  });
});
