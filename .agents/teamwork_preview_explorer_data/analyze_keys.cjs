const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const enI18nPath = path.join(projectRoot, 'data/i18n/en.json');
const enI18n = JSON.parse(fs.readFileSync(enI18nPath, 'utf8'));

console.log('--- Race names in en.json ---');
Object.keys(enI18n).filter(k => k.startsWith('race.')).forEach(k => {
  console.log(`${k}: "${enI18n[k]}"`);
});

console.log('\n--- Checking specific signature mechanic skill descriptions or keys in en.json ---');
const searchSkills = [
  'sovereign_cocoon', 'blood_silk_nest', 'golden_touch', 'void_ingestion', 'raise_dead',
  'draconic_sovereignty', 'unmovable_core', 'guardian_angel', 'blood_well',
  'demonic_obliteration', 'primal_shred', 'primal_rage', 'bleeding_carnage'
];

searchSkills.forEach(s => {
  const nameKey = `skill.${s}.name`;
  const descKey = `skill.${s}.desc`;
  console.log(`- Skill: ${s}`);
  console.log(`  Name: "${enI18n[nameKey] || 'MISSING'}"`);
  console.log(`  Desc: "${enI18n[descKey] || 'MISSING'}"`);
});
