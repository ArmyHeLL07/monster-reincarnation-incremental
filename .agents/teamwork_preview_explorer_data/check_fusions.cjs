const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const fusionsFile = path.join(projectRoot, 'data/fusion_rules.json');
const content = fs.readFileSync(fusionsFile, 'utf8');
const fusions = JSON.parse(content);

console.log('Structure keys:', Object.keys(fusions));
if (Array.isArray(fusions)) {
  console.log('It is an array');
} else {
  console.log('It is an object');
}

// Let's print the first few entries/keys
const keys = Object.keys(fusions);
console.log('First 5 keys:', keys.slice(0, 5));
keys.slice(0, 5).forEach(k => {
  console.log(`${k}:`, JSON.stringify(fusions[k]));
});

// Search for any GDD skills
const searchSkills = [
  'sovereign_cocoon', 'blood_silk_nest', 'golden_touch', 'void_ingestion', 'raise_dead',
  'draconic_sovereignty', 'unmovable_core', 'guardian_angel', 'blood_well',
  'demonic_obliteration', 'primal_shred', 'primal_rage', 'bleeding_carnage'
];

const matches = [];
Object.keys(fusions).forEach(k => {
  const rule = fusions[k];
  // Check if rule is string or object
  const valStr = JSON.stringify(rule);
  searchSkills.forEach(s => {
    if (k === s || valStr.toLowerCase().includes(s.toLowerCase())) {
      matches.push({ key: k, value: rule, matched: s });
    }
  });
});

console.log(`\nFound ${matches.length} matches in fusion rules:`);
matches.forEach(m => {
  console.log(`- Key: "${m.key}" (Matched: "${m.matched}"):`, m.value);
});
