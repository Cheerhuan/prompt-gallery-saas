const fs = require('fs');
const promptsPath = '/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json';
const trackPath = '/Users/xiebinghuan/prompt-gallery-saas/scripts/.meigen-track.json';

try {
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  const track = JSON.parse(fs.readFileSync(trackPath, 'utf8'));

  const numericIds = prompts
    .map(p => parseInt(p.id))
    .filter(id => !isNaN(id));
  
  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  
  const newPrompts = [
    {
      "id": (maxId + 1).toString(),
      "title": "A Spiritual Journey of Hajj",
      "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2058571671569609020/0.jpg",
      "full_prompt": "This scene is a meticulously crafted, multi-layered paper-cut diorama presented within a decorative, dark-stained wooden frame, capturing the spiritual atmosphere and sacred journey of Hajj in breathtaking detail. Composition: A seamless split between a radiant daytime scene (Holy Kaaba and Grand Mosque of Mecca with pilgrims performing Tawaf) and an enchanting nighttime landscape (illuminated tents of Mina, rocky hills of Arafat under a crescent moon, and pathways to Muzdalifah). Foreground: A unified family of pilgrims in traditional white ihram and modest attire (father, mother, young son, daughter, and grandmother). Framing & Details: Islamic geometric motifs and hanging golden lanterns, palm leaves and desert flora in the upper corners, intricate Islamic arabesque carvings on the wooden frame. Lighting & Texture: Warm golden lighting, deep shadows, and richly textured paper layers to enhance the handcrafted effect. Typography: A stylized carved wooden plaque at the bottom center with the title: “A SPIRITUAL JOURNEY OF HAJJ” in a refined serif font.",
      "model": "GPT Image",
      "creator": "@yassalais",
      "tier": "free",
      "_source": "meigen.ai"
    },
    {
      "id": (maxId + 2).toString(),
      "title": "World-class Luxury Magazine Cover",
      "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2058866454187876616/0.jpg",
      "full_prompt": "A world-class luxury magazine cover, 4:5 ratio, featuring [BRAND/PRODUCT] as the cover star. The product floats center frame, lit like a fashion editorial — soft directional studio light with one dramatic color gel in [COLOR] casting a subtle wash. The masthead runs across the top in bold serif or condensed sans-serif typography, styled like Vogue, Time, or Esquire — replace the magazine name with the brand name in oversized letters. A bold cover line dominates the left or bottom third: one punchy headline about the product in large type, followed by 3–4 smaller teaser lines in thin elegant font mimicking real magazine callouts. Issue number, date, barcode, and price tag visible in small print. Background is a clean gradient or seamless studio paper in a tone that complements [COLOR]. The product has hyper-realistic texture and surface detail. Overall feel: if this product had its own magazine, this would be Issue 01. Shot on Hasselblad, photorealistic, print-ready quality.",
      "model": "GPT Image",
      "creator": "@TechieBySA",
      "tier": "free",
      "_source": "meigen.ai"
    }
  ];

  const updatedPrompts = [...prompts, ...newPrompts];
  fs.writeFileSync(promptsPath, JSON.stringify(updatedPrompts, null, 2));

  const newUsedIds = ['2058571671569609020', '2058866454187876616'];
  track.used = [...new Set([...track.used, ...newUsedIds])];
  fs.writeFileSync(trackPath, JSON.stringify(track, null, 2));

  console.log('Successfully updated prompts and track file.');
} catch (e) {
  console.error('Error:', e);
  process.exit(1);
}
