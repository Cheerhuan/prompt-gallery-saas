const fs = require('fs');
const path = '/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json';

try {
  let content = fs.readFileSync(path, 'utf8').trim();
  
  // The file seems to contain multiple JSON arrays concatenated together.
  // We only care about the first one.
  const firstBracketOpen = content.indexOf('[');
  const firstBracketClose = content.indexOf(']');
  
  if (firstBracketOpen === -1 || firstBracketClose === -1) {
    throw new Error('Invalid JSON structure in prompts.json');
  }
  
  const jsonPart = content.substring(firstBracketOpen, firstBracketClose + 1);
  const json = JSON.parse(jsonPart);
  
  const newEntries = [
    {
      "id": (json.length + 1).toString(),
      "title": "Blurry iPhone selfie photo of Elon Musk & Trump",
      "full_prompt": "An extremely unremarkable, blurry iPhone selfie photo with no proper framing or focus — a badly timed, accidental-looking snapshot. The photo has mild motion blur and harsh uneven lighting from a flickering ceiling lamp. The camera angle is awkward and tilted like the phone was slipping from someone’s hand mid-shot. In the scene: Elon Musk sits slouched on a worn-out couch covered in random blankets wearing an oversized t-shirt with a ketchup stain playing a dusty old xbox 360 controller with intense focus. next to him trump is half-asleep wrapped in a giant burrito blanket drooling slightly onto a tv remote. the room is cluttered with empty pizza boxes laundry piles and a few knocked-over cans of monster energy drink. the overall mood is extremely mundane chaotic and mildly depressing in an oddly humorous way.",
      "image": "https://image.lexica.art/full_jpg/bcfe9dff-5c42-46dc-be67-9a992049f589",
      "creator": "",
      "model": "Aperture",
      "tags": [],
      "_source": "lexica.art",
      "_lexica_id": "b87efff9-0bdc-4df0-bf76-1554e50e8c33"
    },
    {
      "id": (json.length + 2).toString(),
      "title": "Presidential Portrait of Cookie Monster",
      "full_prompt": "Presidential portrait photo of cookie monster in the oval office, he is holding up a signed piece of paper which reads 'no tariffs on cookies from china' in a large text is is the central part of the frame, in his other hand he is holding a cookie",
      "image": "https://image.lexica.art/full_jpg/68be023e-441b-470f-a5d3-ae14018c49ff",
      "creator": "",
      "model": "Aperture",
      "tags": [],
      "_source": "lexica.art",
      "_lexica_id": "72e046cf-2d66-4b64-9e11-010880412912"
    },
    {
      "id": (json.length + 3).toString(),
      "title": "Silver KITH jacket in Tokyo",
      "full_prompt": "Silver kith jacket, american flag patch, futurist, shot in tokyo at night, shot on leica, fashion portrait, by kith, lots of people in the background. crowded photo, motion blur",
      "image": "https://image.lexica.art/full_jpg/8f1714ab-9997-4a15-b409-d55cd3d7915e",
      "creator": "",
      "model": "Aperture",
      "tags": [],
      "_source": "lexica.art",
      "_lexica_id": "91ba29fe-0ea7-4105-9bb5-926720e37f64"
    }
  ];

  const merged = json.concat(newEntries);
  fs.writeFileSync(path, JSON.stringify(merged, null, 2));
  console.log('Successfully merged ' + newEntries.length + ' prompts.');
} catch (e) {
  console.error('Merge failed:', e);
  process.exit(1);
}
