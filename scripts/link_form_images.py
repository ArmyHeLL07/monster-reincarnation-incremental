"""Scan data/forms/<formId>.png and set `image` on the matching evolution form in evolutions.json.
Run this after dropping new form portraits into data/forms/. Idempotent."""
import json, os
forms_dir = 'data/forms'
ev = json.load(open('data/evolutions.json', encoding='utf-8'))
have = {f[:-4] for f in os.listdir(forms_dir) if f.endswith('.png')}
n = 0
for f in ev:
    img = f"forms/{f['id']}.png"
    if f['id'] in have:
        if f.get('image') != img:
            f['image'] = img; n += 1
    elif 'image' in f:
        # image file removed → drop the stale link
        del f['image']; n += 1
json.dump(ev, open('data/evolutions.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'{len(have)} form görseli bulundu, {n} form image alanı güncellendi.')
