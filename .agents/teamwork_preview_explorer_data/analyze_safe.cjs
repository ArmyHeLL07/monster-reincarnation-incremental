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

console.log('Races present in races.json:');
const raceIds = races.map(r => r.id);
console.log(raceIds.join(', '));

console.log('\nChecking localization for races:');
races.forEach(r => {
  console.log(`- ${r.id}: locKey=${r.locKey}, translatedName="${enI18n[r.locKey] || 'MISSING'}"`);
});

console.log('\nForm counts by raceId in evolutions.json:');
const counts = {};
evolutions.forEach(e => {
  counts[e.raceId] = (counts[e.raceId] || 0) + 1;
});
console.log(counts);

// For each of the 8 specification races: Spider, Slime, Skeleton, Wyrmling, Golem, Human, Demon, Beastkin
// Let's check which races in JSON correspond to them.
// Spec: Spider -> spider (or arachnid?)
// Spec: Slime -> slime
// Spec: Skeleton -> skeleton
// Spec: Wyrmling -> wyrmling
// Spec: Golem -> golem
// Spec: Human -> human
// Spec: Demon -> fiend? (fiend is in races.json, or demon?)
// Spec: Beastkin -> beastman? (beastman is in races.json, or beastkin?)

console.log('\n--- Details of forms for each race ---');
const targetRaces = ['spider', 'slime', 'skeleton', 'wyrmling', 'golem', 'human', 'beastman', 'fiend', 'vampire', 'lycan', 'celestial'];

targetRaces.forEach(raceId => {
  const raceEvos = evolutions.filter(e => e.raceId === raceId);
  console.log(`\n=== Race: ${raceId} (Total Forms: ${raceEvos.length}) ===`);
  // Group by tierReq
  const byTierReq = {};
  raceEvos.forEach(e => {
    const tr = e.tierReq !== undefined ? e.tierReq : 'undefined';
    if (!byTierReq[tr]) byTierReq[tr] = [];
    byTierReq[tr].push(e.id);
  });
  Object.keys(byTierReq).sort((a, b) => {
    if (a === 'undefined') return 1;
    if (b === 'undefined') return -1;
    return parseInt(a) - parseInt(b);
  }).forEach(tr => {
    console.log(`  tierReq = ${tr}: ${byTierReq[tr].join(', ')}`);
  });
});
