"""Rebuild slime/skeleton/wyrmling/golem as pure binary evolution trees (like human).

Each race: 32 forms (T0 1 -> T1 1 -> T2 2 -> T3 4 -> T4 8 -> T5 16 pinnacles).
All 15 existing form ids per race are REUSED (placed in the new tree) so existing saves
keep resolving; 17 new ids are added. Stats scale by tier from each form's role
(primary/secondary/tertiary stat); skills are drawn from the role's escalating pool.
"""
import json
from collections import deque

SKILLS = {s['id'] for s in json.load(open('data/skills.json', encoding='utf-8'))}

# tier -> statBonus template given (primary, secondary, tertiary) stat keys.
# `variant` distinguishes the two siblings of a branch: variant 1 swaps the primary/secondary
# emphasis so the two children of one parent are a REAL choice, not a renamed duplicate.
def stats_for(tier, pri, sec, ter, variant=0):
    if variant == 1:
        pri, sec = sec, pri  # the "B" sibling leans on the other stat
    if tier == 0:
        return {}
    if tier == 1:
        return {sec: 2, pri: 1, ter: 1}
    if tier == 2:
        return {pri: 3, sec: 2}
    if tier == 3:
        return {pri: 4, sec: 3}
    if tier == 4:
        return {pri: 5, sec: 3, ter: 2}
    # T5 pinnacle: big spread
    d = {pri: 8, sec: 5, ter: 4}
    d['LUCK'] = d.get('LUCK', 0) + 2
    return d

# role -> (primary, secondary, tertiary, escalating skill pool weak->strong)
# A form at tier t (2..5) grants pool[t-2 : t]  (2 skills); T5 also gets sovereign_form.
ROLES = {
    # --- slime ---
    'acid':    ('INT', 'VIT', 'WIS', ['acid_spit', 'caustic_spray', 'acid_deluge', 'dissolving_touch', 'necro_toxin', 'plague_mist']),
    'crystal': ('VIT', 'WIS', 'INT', ['gelatinous_body', 'elastic_shield', 'primordial_ooze_shield', 'adamant_plating', 'obsidian_carapace', 'void_barrier']),
    'venom':   ('INT', 'WIS', 'VIT', ['toxic_cloud', 'plague_mist', 'necro_toxin', 'decay_curse', 'soul_gaze', 'dissolving_touch']),
    'mirror':  ('WIS', 'INT', 'VIT', ['mana_sense', 'mana_control', 'mana_shield', 'mana_mastery', 'void_barrier', 'spatial_rift']),
    # --- skeleton ---
    'bonewar': ('STR', 'VIT', 'AGI', ['sword_slash', 'blade_dance', 'shattering_strike', 'bone_armor', 'bone_fortress', 'battle_cry']),
    'archer':  ('AGI', 'STR', 'LUCK', ['bone_arrow', 'arrow_barrage', 'piercing_gaze', 'heavy_gaze', 'apex_predator', 'reaper_edge']),
    'necro':   ('INT', 'WIS', 'VIT', ['shadow_bolt', 'decay_curse', 'soul_gaze', 'unholy_heart', 'rend_soul_gaze', 'domination_gaze']),
    'dark':    ('STR', 'INT', 'VIT', ['shadow_bolt', 'reaper_edge', 'decay_curse', 'undying_husk', 'soul_gaze', 'domination_gaze']),
    # --- wyrmling ---
    'flame':   ('STR', 'INT', 'VIT', ['dragon_claw', 'fire_breath', 'dragon_slash', 'scorching_breath', 'dragon_heart', 'magma_fist']),
    'magma':   ('STR', 'VIT', 'INT', ['magma_fist', 'fire_lance', 'heavy_slam', 'scorching_breath', 'dragon_scale', 'dragon_heart']),
    'storm':   ('INT', 'AGI', 'WIS', ['spark', 'gale_cut', 'lightning_strike', 'wind_blade', 'spatial_rift', 'dragon_heart']),
    'shadow':  ('INT', 'AGI', 'LUCK', ['shadow_bolt', 'void_step', 'decay_curse', 'spatial_rift', 'domination_gaze', 'soul_gaze']),
    # --- golem ---
    'iron':    ('VIT', 'STR', 'WIS', ['toughness', 'stone_skin', 'iron_plating', 'shield_wall', 'obsidian_carapace', 'bastion']),
    'magmag':  ('STR', 'VIT', 'INT', ['stone_spike', 'magma_fist', 'earth_pillar', 'heavy_slam', 'crystal_heart', 'unyielding_core']),
    'arcaneg': ('INT', 'VIT', 'WIS', ['stone_spike', 'earth_pillar', 'mana_shield', 'spatial_rift', 'crystal_heart', 'void_barrier']),
    'crystalg':('VIT', 'WIS', 'INT', ['stone_skin', 'crystal_heart', 'iron_plating', 'obsidian_carapace', 'unyielding_core', 'void_barrier']),
    # --- spider (poison/web/stealth/carapace/eyes — the icon race) ---
    'sp_venom':   ('INT', 'WIS', 'VIT', ['venom_bite', 'lethal_venom', 'necro_toxin', 'toxic_cloud', 'decay_curse', 'soul_gaze']),
    'sp_web':     ('AGI', 'INT', 'LUCK', ['silk_thread', 'web_trap', 'cutting_wire', 'spatial_web', 'snare_field', 'binding_silk']),
    'sp_blade':   ('STR', 'AGI', 'VIT', ['sharp_claw', 'scythe_limb', 'reaper_edge', 'rend', 'maul', 'blade_dance']),
    'sp_stealth': ('AGI', 'LUCK', 'INT', ['pounce', 'ambush_strike', 'stealth', 'silent_step', 'phantom_presence', 'lethal_lunge']),
    'sp_carapace':('VIT', 'STR', 'WIS', ['chitin_hide', 'carapace', 'hardened_shell', 'adamant_plating', 'obsidian_carapace', 'carapace_lord']),
    'sp_horror':  ('VIT', 'INT', 'LUCK', ['hp_regen', 'regeneration', 'undying_will', 'undying_husk', 'regenerative_core', 'phase_body']),
}

# Tier-3 "ultimate" skills granted at the T5 pinnacle, per role. Two entries = the two siblings
# (variant 0/1) get different ultimates, so reaching the apex is rewarding AND each apex is distinct.
ULTIMATE = {
    # slime
    'acid':    ['plague_fang', 'infernal_breath'],
    'crystal': ['fortress_body', 'titan_carapace'],
    'venom':   ['plague_fang', 'soul_devour_gaze'],
    'mirror':  ['dimension_collapse', 'null_field'],
    # skeleton
    'bonewar': ['cataclysm_strike', 'ossuary_bastion'],
    'archer':  ['arrow_storm', 'assassinate'],
    'necro':   ['death_scythe', 'soul_devour_gaze'],
    'dark':    ['nightmare_gaze', 'death_scythe'],
    # wyrmling
    'flame':   ['infernal_breath', 'meteor'],
    'magma':   ['cataclysm_strike', 'infernal_breath'],
    'storm':   ['thunderstorm', 'tempest_blade'],
    'shadow':  ['dimension_collapse', 'soul_devour_gaze'],
    # golem
    'iron':    ['fortress_body', 'aegis_eternal'],
    'magmag':  ['cataclysm_strike', 'meteor'],
    'arcaneg': ['dimension_collapse', 'null_field'],
    'crystalg':['titan_carapace', 'aegis_eternal'],
    # spider
    'sp_venom':   ['plague_fang', 'soul_devour_gaze'],
    'sp_web':     ['assassinate', 'tempest_blade'],
    'sp_blade':   ['death_scythe', 'cataclysm_strike'],
    'sp_stealth': ['assassinate', 'nightmare_gaze'],
    'sp_carapace':['titan_carapace', 'fortress_body'],
    'sp_horror':  ['deathless', 'eternal_regen'],
}

# 'shadow_drake'/'storm' skill ids that don't exist get filtered later; keep pools loose.

# Each race: startStats, signature skills for the T1 gateway, and the tree.
# tree maps id -> (children_list, role). Root has 1 child; pinnacles have [].
RACES = {
    'slime': {
        'start': {'STR': 3, 'VIT': 7, 'AGI': 4, 'INT': 6, 'WIS': 5, 'LUCK': 5},
        'sig': ['acid_spit', 'gelatinous_body', 'hp_regen'],
        'root': 'slime_larva', 't1': 'ooze_spawn',
        'tree': {
            'slime_larva': (['ooze_spawn'], 'crystal'),
            'ooze_spawn': (['acid_ooze', 'crystalline_ooze'], 'acid'),
            'acid_ooze': (['toxic_ooze', 'corrosive_horror'], 'acid'),
            'crystalline_ooze': (['mirror_ooze', 'blob_slime'], 'crystal'),
            'toxic_ooze': (['plague_ooze', 'venom_ooze'], 'venom'),
            'corrosive_horror': (['dissolver_ooze', 'devourer_slime'], 'acid'),
            'mirror_ooze': (['prism_ooze', 'reflector_ooze'], 'mirror'),
            'blob_slime': (['diamond_ooze', 'shard_ooze'], 'crystal'),
            'plague_ooze': (['toxic_sovereign', 'plague_god'], 'venom'),
            'venom_ooze': (['venom_overlord', 'elder_ooze'], 'venom'),
            'dissolver_ooze': (['acid_god', 'void_ooze'], 'acid'),
            'devourer_slime': (['void_devourer', 'primordial_ooze'], 'acid'),
            'prism_ooze': (['crystal_god', 'primordial_god'], 'mirror'),
            'reflector_ooze': (['mirror_god', 'eternal_slime'], 'mirror'),
            'diamond_ooze': (['adamant_colossus', 'ancient_slime'], 'crystal'),
            'shard_ooze': (['slime_ascendant', 'slime_sovereign'], 'crystal'),
            'toxic_sovereign': ([], 'venom'), 'plague_god': ([], 'venom'),
            'venom_overlord': ([], 'venom'), 'elder_ooze': ([], 'acid'),
            'acid_god': ([], 'acid'), 'void_ooze': ([], 'mirror'),
            'void_devourer': ([], 'acid'), 'primordial_ooze': ([], 'crystal'),
            'crystal_god': ([], 'mirror'), 'primordial_god': ([], 'crystal'),
            'mirror_god': ([], 'mirror'), 'eternal_slime': ([], 'crystal'),
            'adamant_colossus': ([], 'crystal'), 'ancient_slime': ([], 'acid'),
            'slime_ascendant': ([], 'mirror'), 'slime_sovereign': ([], 'crystal'),
        },
    },
    'skeleton': {
        'start': {'STR': 6, 'VIT': 7, 'AGI': 4, 'INT': 5, 'WIS': 3, 'LUCK': 5},
        'sig': ['bone_arrow', 'undead_vigor', 'bone_armor'],
        'root': 'bone_rattle', 't1': 'risen_skeleton',
        'tree': {
            'bone_rattle': (['risen_skeleton'], 'bonewar'),
            'risen_skeleton': (['skeleton_warrior', 'skeleton_sorcerer'], 'bonewar'),
            'skeleton_warrior': (['bone_lord', 'bone_archer'], 'bonewar'),
            'skeleton_sorcerer': (['lich', 'shade_knight'], 'necro'),
            'bone_lord': (['bone_titan', 'dread_reaver'], 'bonewar'),
            'bone_archer': (['bone_sniper', 'bone_marksman'], 'archer'),
            'lich': (['ancient_lich', 'soul_reaper'], 'necro'),
            'shade_knight': (['death_knight', 'wraith_lord'], 'dark'),
            'bone_titan': (['undead_sovereign', 'bone_colossus'], 'bonewar'),
            'dread_reaver': (['death_incarnate', 'carnage_lord'], 'dark'),
            'bone_sniper': (['bone_artillery', 'death_archer_king'], 'archer'),
            'bone_marksman': (['soul_sniper', 'revenant_king'], 'archer'),
            'ancient_lich': (['death_sovereign', 'lich_god'], 'necro'),
            'soul_reaper': (['soul_sovereign_skel', 'reaper_god'], 'necro'),
            'death_knight': (['death_lord', 'doom_knight'], 'dark'),
            'wraith_lord': (['wraith_god', 'skeleton_sovereign'], 'dark'),
            'undead_sovereign': ([], 'bonewar'), 'bone_colossus': ([], 'bonewar'),
            'death_incarnate': ([], 'dark'), 'carnage_lord': ([], 'dark'),
            'bone_artillery': ([], 'archer'), 'death_archer_king': ([], 'archer'),
            'soul_sniper': ([], 'archer'), 'revenant_king': ([], 'archer'),
            'death_sovereign': ([], 'necro'), 'lich_god': ([], 'necro'),
            'soul_sovereign_skel': ([], 'necro'), 'reaper_god': ([], 'necro'),
            'death_lord': ([], 'dark'), 'doom_knight': ([], 'dark'),
            'wraith_god': ([], 'dark'), 'skeleton_sovereign': ([], 'dark'),
        },
    },
    'wyrmling': {
        'start': {'STR': 7, 'VIT': 5, 'AGI': 5, 'INT': 6, 'WIS': 4, 'LUCK': 4},
        'sig': ['dragon_claw', 'draconic_blood', 'fire_breath'],
        'root': 'wyrmling_hatch', 't1': 'young_drake',
        'tree': {
            'wyrmling_hatch': (['young_drake'], 'flame'),
            'young_drake': (['fire_wyrm', 'storm_drake'], 'flame'),
            'fire_wyrm': (['elder_drake', 'magma_drake'], 'flame'),
            'storm_drake': (['lightning_wyrm', 'shadow_drake'], 'storm'),
            'elder_drake': (['ancient_wyrm', 'inferno_wyrm'], 'flame'),
            'magma_drake': (['volcanic_dragon', 'cinder_wyrm'], 'magma'),
            'lightning_wyrm': (['storm_dragon', 'tempest_wyrm'], 'storm'),
            'shadow_drake': (['void_dragon', 'nightmare_drake'], 'shadow'),
            'ancient_wyrm': (['elder_dragon', 'dragon_sovereign'], 'flame'),
            'inferno_wyrm': (['flame_god_dragon', 'phoenix_wyrm'], 'flame'),
            'volcanic_dragon': (['magma_god', 'world_serpent'], 'magma'),
            'cinder_wyrm': (['ember_sovereign', 'ashfall_dragon'], 'magma'),
            'storm_dragon': (['thunder_god_dragon', 'cosmic_dragon'], 'storm'),
            'tempest_wyrm': (['storm_sovereign', 'gale_god'], 'storm'),
            'void_dragon': (['void_leviathan', 'void_god_dragon'], 'shadow'),
            'nightmare_drake': (['shadow_god_dragon', 'dragon_god'], 'shadow'),
            'elder_dragon': ([], 'flame'), 'dragon_sovereign': ([], 'flame'),
            'flame_god_dragon': ([], 'flame'), 'phoenix_wyrm': ([], 'flame'),
            'magma_god': ([], 'magma'), 'world_serpent': ([], 'magma'),
            'ember_sovereign': ([], 'magma'), 'ashfall_dragon': ([], 'magma'),
            'thunder_god_dragon': ([], 'storm'), 'cosmic_dragon': ([], 'storm'),
            'storm_sovereign': ([], 'storm'), 'gale_god': ([], 'storm'),
            'void_leviathan': ([], 'shadow'), 'void_god_dragon': ([], 'shadow'),
            'shadow_god_dragon': ([], 'shadow'), 'dragon_god': ([], 'shadow'),
        },
    },
    'golem': {
        'start': {'STR': 7, 'VIT': 9, 'AGI': 2, 'INT': 4, 'WIS': 4, 'LUCK': 4},
        'sig': ['stone_spike', 'stone_nature', 'toughness'],
        'root': 'pebble_golem', 't1': 'stone_golem',
        'tree': {
            'pebble_golem': (['stone_golem'], 'iron'),
            'stone_golem': (['iron_golem', 'lava_golem'], 'iron'),
            'iron_golem': (['crystal_golem', 'steel_golem'], 'iron'),
            'lava_golem': (['magma_colossus', 'obsidian_golem'], 'magmag'),
            'crystal_golem': (['arcane_golem', 'prism_golem'], 'crystalg'),
            'steel_golem': (['titan_golem', 'fortress_golem'], 'iron'),
            'magma_colossus': (['inferno_colossus', 'volcano_golem'], 'magmag'),
            'obsidian_golem': (['basalt_titan', 'onyx_colossus'], 'magmag'),
            'arcane_golem': (['void_golem', 'rune_colossus'], 'arcaneg'),
            'prism_golem': (['crystal_titan_golem', 'diamond_colossus'], 'crystalg'),
            'titan_golem': (['colossus_prime', 'world_golem'], 'iron'),
            'fortress_golem': (['bastion_colossus', 'ancient_golem'], 'iron'),
            'inferno_colossus': (['magma_god_golem', 'lava_sovereign'], 'magmag'),
            'volcano_golem': (['eternal_colossus', 'cinder_titan'], 'magmag'),
            'basalt_titan': (['obsidian_god', 'golem_ascendant'], 'crystalg'),
            'onyx_colossus': (['stone_sovereign', 'golem_sovereign'], 'crystalg'),
            'void_golem': ([], 'arcaneg'), 'rune_colossus': ([], 'arcaneg'),
            'crystal_titan_golem': ([], 'crystalg'), 'diamond_colossus': ([], 'crystalg'),
            'colossus_prime': ([], 'iron'), 'world_golem': ([], 'iron'),
            'bastion_colossus': ([], 'iron'), 'ancient_golem': ([], 'iron'),
            'magma_god_golem': ([], 'magmag'), 'lava_sovereign': ([], 'magmag'),
            'eternal_colossus': ([], 'magmag'), 'cinder_titan': ([], 'magmag'),
            'obsidian_god': ([], 'crystalg'), 'golem_ascendant': ([], 'crystalg'),
            'stone_sovereign': ([], 'crystalg'), 'golem_sovereign': ([], 'crystalg'),
        },
    },
    'spider': {
        # startStats intentionally NOT set — spider keeps the 5/5/5/5/5/5 baseline
        # ("örümcek dışında tüm ırkların statlarını ayarla" — earlier explicit instruction).
        'start': None,
        'sig': ['binding_silk', 'pounce', 'carapace'],
        'root': 'hatchling_spider', 't1': 'lesser_weaver',
        'tree': {
            'hatchling_spider': (['lesser_weaver'], 'sp_web'),
            'lesser_weaver': (['venom_weaver', 'shade_stalker'], 'sp_venom'),
            'venom_weaver': (['greater_weaver', 'dread_weaver'], 'sp_venom'),
            'shade_stalker': (['scythe_hunter', 'blade_weaver'], 'sp_stealth'),
            'greater_weaver': (['colossal_weaver', 'broodmother'], 'sp_web'),
            'dread_weaver': (['toxic_horror', 'plague_weaver'], 'sp_venom'),
            'scythe_hunter': (['phantom_stalker_sp', 'undying_horror'], 'sp_stealth'),
            'blade_weaver': (['carapace_lord_sp', 'blade_sovereign_sp'], 'sp_blade'),
            'colossal_weaver': (['web_lord', 'silk_god'], 'sp_web'),
            'broodmother': (['brood_sovereign', 'spider_queen'], 'sp_web'),
            'toxic_horror': (['venom_sovereign_sp', 'revenant_horror'], 'sp_venom'),
            'plague_weaver': (['plague_god_sp', 'abyssal_sovereign'], 'sp_venom'),
            'phantom_stalker_sp': (['shadow_sovereign_sp', 'nightmare_spider'], 'sp_stealth'),
            'undying_horror': (['eternal_horror', 'wraith_sovereign'], 'sp_horror'),
            'carapace_lord_sp': (['iron_arachnid', 'elder_sovereign'], 'sp_carapace'),
            'blade_sovereign_sp': (['scythe_sovereign', 'arachnid_sovereign'], 'sp_blade'),
            'web_lord': ([], 'sp_web'), 'silk_god': ([], 'sp_web'),
            'brood_sovereign': ([], 'sp_web'), 'spider_queen': ([], 'sp_web'),
            'venom_sovereign_sp': ([], 'sp_venom'), 'revenant_horror': ([], 'sp_horror'),
            'plague_god_sp': ([], 'sp_venom'), 'abyssal_sovereign': ([], 'sp_venom'),
            'shadow_sovereign_sp': ([], 'sp_stealth'), 'nightmare_spider': ([], 'sp_stealth'),
            'eternal_horror': ([], 'sp_horror'), 'wraith_sovereign': ([], 'sp_horror'),
            'iron_arachnid': ([], 'sp_carapace'), 'elder_sovereign': ([], 'sp_carapace'),
            'scythe_sovereign': ([], 'sp_blade'), 'arachnid_sovereign': ([], 'sp_blade'),
        },
    },
}


def bfs_tiers(tree, root):
    tier = {root: 0}
    q = deque([root])
    while q:
        n = q.popleft()
        for c in tree[n][0]:
            if c not in tier:
                tier[c] = tier[n] + 1
                q.append(c)
    return tier


def build_race(race, cfg):
    tree, root, t1 = cfg['tree'], cfg['root'], cfg['t1']
    tier = bfs_tiers(tree, root)
    # sibling variant: a form's index in its parent's children (0 = "A", 1 = "B").
    variant = {root: 0}
    for fid, (children, _role) in tree.items():
        for i, c in enumerate(children):
            variant[c] = i
    forms = []
    for fid, (children, role) in tree.items():
        t = tier[fid]
        v = variant.get(fid, 0)
        pri, sec, ter, pool = ROLES[role]
        sb = stats_for(t, pri, sec, ter, v)
        # skills
        if t == 0:
            skills = []
        elif fid == t1:
            skills = list(cfg['sig'])
        else:
            idx = t - 2  # T2->0 ... T5->3
            # variant B shifts the pool window by 1 so siblings learn different skills.
            win = min(idx + v, len(pool) - 2)
            skills = [s for s in pool[win:win + 2] if s in SKILLS]
            if t == 5:
                # Pinnacle: sovereign form + a variant-specific tier-3 ultimate + one pool skill.
                ult = ULTIMATE.get(role, [None, None])[v]
                ults = [ult] if ult in SKILLS else []
                skills = ['sovereign_form'] + ults + skills[:1]
        forms.append({
            'id': fid, 'raceId': race, 'locKey': f'form.{fid}.name',
            'evolvesTo': children, 'levelReq': 1 if t == 0 else 10,
            'statBonus': sb, 'grantSkills': skills,
        })
    return forms, tier


# Hidden easter-egg forms (Rimuru for slime, Kumoko for spider) live OUTSIDE the binary tree.
# They are preserved as-is, and their parent forms get the secret child re-linked after the rebuild.
SECRET_IDS = {'demon_slime', 'rimuru_tempest', 'demon_lord_rimuru', 'zoa_ele', 'ede_saine', 'arachne', 'zana_horowa'}
SECRET_LINKS = {  # tree form id -> secret child to re-append to its evolvesTo
    'ooze_spawn': 'demon_slime', 'devourer_slime': 'demon_slime',
    'venom_weaver': 'zoa_ele', 'greater_weaver': 'zoa_ele',
}


def main():
    evos = json.load(open('data/evolutions.json', encoding='utf-8'))
    target_races = set(RACES)
    # keep forms from races we are NOT rebuilding (human) AND the hidden easter-egg forms
    kept = [e for e in evos if e.get('raceId') not in target_races or e['id'] in SECRET_IDS]

    all_new = []
    problems = []
    for race, cfg in RACES.items():
        forms, tier = build_race(race, cfg)
        # validate: 32 forms, doubling, binary
        by_t = {}
        for f in forms:
            by_t.setdefault(tier[f['id']], []).append(f['id'])
        counts = {t: len(by_t[t]) for t in sorted(by_t)}
        if counts != {0: 1, 1: 1, 2: 2, 3: 4, 4: 8, 5: 16}:
            problems.append(f'{race}: tier counts {counts}')
        ids = {f['id'] for f in forms}
        for f in forms:
            kids = [c for c in f['evolvesTo']]
            for c in kids:
                if c not in ids:
                    problems.append(f'{race}: {f["id"]} -> missing child {c}')
            n = len(kids)
            t = tier[f['id']]
            expect = 1 if t == 0 else (0 if t == 5 else 2)
            if n != expect:
                problems.append(f'{race}: {f["id"]} has {n} children (expected {expect})')
            for sk in f['grantSkills']:
                if sk not in SKILLS:
                    problems.append(f'{race}: {f["id"]} grants unknown skill {sk}')
        # check all old ids reused (the hidden easter-egg forms live outside the tree by design)
        old = {e['id'] for e in evos if e.get('raceId') == race} - SECRET_IDS
        dropped = old - ids
        if dropped:
            problems.append(f'{race}: DROPPED old ids {sorted(dropped)}')
        all_new.extend(forms)

    if problems:
        print('VALIDATION PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit('Aborting: fix problems above.')

    # Re-link the hidden easter-egg forms to their tree parents (after binary validation).
    kept_ids = {e['id'] for e in kept}
    for f in all_new:
        child = SECRET_LINKS.get(f['id'])
        if child and child in kept_ids and child not in f['evolvesTo']:
            f['evolvesTo'].append(child)

    out = kept + all_new
    json.dump(out, open('data/evolutions.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'OK. Wrote {len(out)} forms total ({len(all_new)} across {len(RACES)} rebuilt races).')
    # also emit the set of all current form ids (for the i18n script)
    json.dump(sorted({f['id'] for f in all_new}), open('scripts/_rebuilt_ids.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
