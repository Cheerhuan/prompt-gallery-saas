const fs = require('fs');
const path = '/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const newEntries = [
  {
    "id": "476",
    "title": "Grungy analog photo Late 90s/early 2000s style, of the 'Arctic Avenger' Terrorist ch...",
    "image": "https://image.lexica.art/full_jpg/41df0c49-e1e9-490e-b2c9-9a0dd4567771",
    "full_prompt": "Grungy analog photo Late 90s/early 2000s style, of the 'Arctic Avenger' Terrorist character model from Counter-Strike 1.6. He's sitting hunched in an old office chair behind a cluttered desk dominated by a bulky glowing crt monitor in a dimly lit messy room.",
    "model": "Aperture",
    "creator": "",
    "tags": [],
    "_source": "lexica.art",
    "_lexica_id": "f6b338a7-e5a3-4188-beb8-a00a5ab95497"
  },
  {
    "id": "477",
    "title": "Cinematic film still of an adult beautiful woman. Please ensure this is a mind blowing artwork.",
    "image": "https://image.lexica.art/full_jpg/ccb1b914-a29a-40ec-a462-6c96aeb0c0a5",
    "full_prompt": "Cinematic film still of an adult beautiful woman. Please ensure this is a mind blowing artwork.",
    "model": "Aperture",
    "creator": "",
    "tags": [],
    "_source": "lexica.art",
    "_lexica_id": "5a81ac2c-5d93-454d-a7b2-566ffacd579f"
  },
  {
    "id": "478",
    "title": "A portrait of a Minion (from Despicable Me & Minions) as Donald Trump",
    "image": "https://image.lexica.art/full_jpg/fb5823b2-ff8f-4ab5-a35a-0585395fca9a",
    "full_prompt": "A portrait of a Minion (from Despicable Me & Minions) as Donald Trump",
    "model": "Aperture",
    "creator": "",
    "tags": [],
    "_source": "lexica.art",
    "_lexica_id": "b9578678-c9db-4c5d-9d0d-afdfc79646ae"
  }
];

data.push(...newEntries);
fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Successfully imported 3 prompts');
