import fs from 'fs';
import path from 'path';

const PROMPTS_FILE = '/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json';

const newPromptsRaw = [
  {
    "title": "逆光美背·女性情緒写真",
    "image": "https://images.meigen.ai/tweets/2058131948904599860/0.jpg",
    "full_prompt": "请生成一张竖版高质感女性情绪写真，主题为「逆光美背·女性情绪写真」。\n\n核心要求：\n画面的绝对重点是“美背”，通过露背结构、肩颈线条、肩胛骨、脊柱中线、腰背曲线和逆光轮廓来呈现女性美。不是普通女性写真，也不是普通穿搭图，背部必须是主视觉核心，脸只作为辅助。\n\n人物设定：\n成年女性，真实自然，气质可为温柔、清冷、慵懒、文艺、轻熟或安静。人物不要网红脸，不要塑料感，不要夸张妆容。可侧脸、回眸、低头或闭眼，但正脸不是重点。\n\n姿态要求：\n姿态必须服务于背部展示，例如背对镜头微微回头、侧身站立、侧坐、抬手整理头发、低头蜷身、斜倚窗边、半躺回眸、披衣下滑等。动作自然，不要僵硬摆拍，不要正面直视镜头。\n\n露背结构：\n必须有明确的露背设计，可为低背长裙、吊带裙、露背礼服、针织外套滑落、薄纱披肩、浴袍半披、宽松衬衫滑肩、丝质罩衫半落等。重点表现肩线、肩胛骨、背中线、腰背收束和布料与肌肤之间的高级过渡。\n\n服装与材质：\n服装选择轻柔、垂坠、带有透光感和褶皱感的材质，如薄纱、真丝、针织、棉麻、细闪纱、浴袍质地、软垂感长裙。布料要参与构图，形成半遮半露、滑落、包裹、垂挂的层次，但不能厚重。\n\n场景：\n场景为卧室、窗边、床上、白墙房间、民宿、酒店房间、木质空间或复古公寓。背景简洁克制，少量床品、窗帘、木椅、花束、地板等元素即可，不能喧宾夺主。\n\n光线要求：\n采用自然光或柔和暖光，以逆光、侧逆光、窗边光为主。重点是让光打到背部，勾出肩颈边缘、肩胛骨轮廓、腰线和发丝高光。可使用晨光、黄昏金光、柔雾散射光或冷白窗光，但背部受光状态必须成立。\n\n构图：\n竖版构图，画幅可为 9:16、3:4 或 4:5。人物是绝对主角，视觉重心放在背部、肩颈和腰背曲线上。可采用半身、七分身、近景或全身，但不要让场景抢走主体。\n\n氛围：\n整体氛围安静、柔软、私密、克制、高级，像真实摄影师拍摄的电影感情绪写真。重点不是直白性感，而是通过“美背 + 逆光 + 柔软布料 + 自然姿态”表达女性美。\n\n画质要求：\n真实摄影感、电影感、柔雾胶片感、细腻肤色、真实皮肤质感、浅景深、轻微颗粒感、画面通透自然。不要 AI 塑料感，不要 CG 感，不要错误手指，不要肢体畸形，不要低俗色情化表达，不要文字、水印、Logo、边框。\n\n最终效果：\n一张以“美背”为主视觉核心的高完成度女性情绪写真，通过露背结构、肩颈背部线条、柔光逆光和柔软布料来呈现克制而高级的女性美。",
    "model": "GPT Image",
    "creator": "Larus Canus",
    "tier": "free",
    "_source": "meigen.ai"
  },
  {
    "title": "Golden Morn Viral FMCG Poster Campaign",
    "image": "https://images.meigen.ai/tweets/2054144847787799020/0.jpg",
    "full_prompt": "ACT AS: A senior global FMCG creative director, Luxury Breakfast Food Stylist, Premium Commercial Product Photographer, Typography Designer, and Modern Brand Advertiser. \n\nCore Objective: To create a viral, premium FMCG (Fast-Moving Consumer Goods) poster that feels fresh, healthy, energetic, and appetizing, avoiding \"cinematic fantasy\" or \"dark luxury\" in favor of modern, family-friendly commercial realism.\n\nTypography: Large, bold typeface with rounded lowercase letters, modern geometric sans-serif font system, minimal supporting text, clear typography hierarchy for emerging brands, soft, rounded commercial lettering, large-scale typography treatment hidden behind objects. Occupies 40–60% of the composition; sits behind and around the product.\n\nProduct & Food Styling: A hyper-realistic bowl of creamy Golden Morn cereal in the foreground. Supporting Ingredients: Sliced bananas, maize grains, soybeans, oats, honey drizzle, and milk splashes. Textures: Focus on creamy swirls, glossy milk highlights, honey reflections, and soft steam glow. Packaging: Must include authentic blue-and-yellow Golden Morn packaging.\n\nLighting & Color Palette: Bright commercial studio lighting; warm morning glow with creamy highlights. Primary: Golden yellow, creamy beige, fresh sky blue, honey gold. Accents: Soft white and natural grain tones.\n\nTechnical Requirements: Aspect Ratio 4:5, Ultra HD, 8K, Hyper-detailed food textures. Billboard-ready, luxury Instagram advertisement quality.",
    "model": "GPT Image",
    "creator": "jey_jey_Japa",
    "tier": "free",
    "_source": "meigen.ai"
  },
  {
    "title": "Trident Fresh & Hubba Bubba Big Surreal Ads",
    "image": "https://images.meigen.ai/tweets/2056420428793737339/0.jpg",
    "full_prompt": "Concept 1: Trident \"Fresh\". Core Idea: \"YOUR BREATH OPENS WORLDS.\" Layout: Large rounded rectangle background in Trident signature blue-white gradient. Typography: Giant, bold, ultra-cropped text \"FRESH\" sitting behind the subject. Subject: A young woman mid-exhale, eyes closed, slight smile. Surreal Elements: Arctic tundra landscape and glacier-white mountains materializing from vapor, tiny polar bears walking along breath trails, ice crystals and mint leaves crystallizing into snowflakes.\n\nConcept 2: Hubba Bubba \"Big\". Core Idea: \"THE BUBBLE IS YOUR UNIVERSE.\" Layout: Oversized rounded block in electric pink. Typography: Fat, bubbly, inflated 3D letterforms for the word \"BIG\" with a shiny bubble-gum texture. Subject: A kid/teen blowing a giant bubble. Surreal Elements: A translucent pink bubble containing an entire galaxy with nebula swirls, tiny planets orbiting within the bubble skin and a floating astronaut.\n\nTechnical: 4:5 vertical premium poster, 8K, bold commercial layout x surreal realism, cinematic depth of field.",
    "model": "GPT Image",
    "creator": "Diplomeme",
    "tier": "free",
    "_source": "meigen.ai"
  },
  {
    "title": "Modern Minimalist Food Advertising",
    "image": "https://images.meigen.ai/tweets/2057779197985378623/0.jpg",
    "full_prompt": "[Matcha Latte] STYLE & ART DIRECTION: Modern minimalist food advertising aesthetics, Swiss-style advertising composition, premium restaurant social media branding, editorial design for an FMCG campaign, visuals for startup food brands, Pinterest-style food poster aesthetics, playful geometric advertising structure, modern in-app branding style, minimalist luxury restaurant marketing. MAIN OBJECT: Hyper-realistic food hero placed in the center of the composition, striking premium food photography design, floating or suspended presentation, realistic glossy textures, detailing of fresh ingredients, mouth-watering commercial presentation, studio-quality dish rendering, premium restaurant advertising campaign atmosphere. LAYOUT & COMPOSITION: Maintain the EXACT composition structure as sampled: large, rounded organic cream background centered on a vibrant full-color backdrop, large, lowercase type placed behind the protagonist and the hero's food object positioned in the center, overlapping, small branding/navigation strip aligned at the top, short editorial text block positioned on the left, floating rounded ingredient or flavor labels in the UI aligned vertically on the right, minimal decorative micro-icons, clean asymmetrical spacing, large breakout room, premium minimalist style hierarchy, social media poster composition. Typography: Large, bold typeface with rounded lowercase letters, modern geometric sans-serif font system, minimal supporting text, clear typography hierarchy for emerging brands, soft, rounded commercial lettering, large-scale typography treatment hidden behind objects. DEPTH AND LIGHT: Soft premium studio lighting, high-quality food highlights, realistic soft shadows, subtle glossy reflections, cinematic commercial lighting, highly detailed texture rendering, high-quality depth separation. ADDITIONAL DESIGN DETAILS: Rounded pill-shaped labels, small plus icons, minimal floating elements in the UI, app-like composition, fresh ingredient garnish, soft shadow blending, modern food delivery branding system, clean visuals, minimal geometric balance. COLOR PALETTE: [PRIMARY BRAND COLOR], cream/off-white, warm accent tones, high-contrast food colors, minimal black typography accents, a modern premium commercial palette. Quality: Ultra-high resolution, Behance-level food ad quality, 8k commercial rendering, Pinterest-style restaurant ad campaign design, premium FMCG branding aesthetics, professional art direction, high-quality editorial food poster.",
    "model": "GPT Image",
    "creator": "SimplyAnnisa",
    "tier": "free",
    "_source": "meigen.ai"
  },
  {
    "title": "Urban Graffiti Fashion Campaign (Elsa & Olaf)",
    "image": "https://images.meigen.ai/tweets/2056433260981629292/0.jpg",
    "full_prompt": "A high-end, luxury streetwear editorial campaign reimagining Disney's Elsa and Olaf as modern fashion icons. \n\nHero Subject System: Elsa (Primary Model) in full-body editorial pose with a powerful runway presence, wearing luxury oversized layered streetwear with futuristic textures (frosted fabrics, crystal surfaces) in icy blue, white, and silver. Olaf (Secondary Mascot) reimagined as a cute-but-fashionable streetwear mascot with minimalist snow-inspired design, plush aesthetic, wearing urban accessories (sneakers, scarf, jacket), refined and stylized, not cartoonish.\n\nVisual & Technical Systems: Typography consists of oversized icy graffiti with spray paint frost effects, frozen brush lettering, and crystal tags. Color Palette: Dominant icy electric blue, supporting white, silver, frost gray, and soft neon ice highlights. Lighting: Cool-toned studio lighting, glossy icy highlights, and cinematic contrast. Layering: Foreground (snow particles/ice dust) -> Midground (Elsa & Olaf) -> Background (Graffiti typography/frozen gradient wall). Layout: Minimal editorial style with large negative space and clean luxury spacing.",
    "model": "GPT Image",
    "creator": "ShamiWeb3",
    "tier": "free",
    "_source": "meigen.ai"
  }
];

try {
  const data = JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf8'));
  let maxId = 0;
  data.forEach(p => {
    const idNum = parseInt(p.id);
    if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
  });

  const updated = [...data];
  newPromptsRaw.forEach((p, index) => {
    updated.push({
      ...p,
      id: (maxId + index + 1).toString()
    });
  });

  fs.writeFileSync(PROMPTS_FILE, JSON.stringify(updated, null, 2));
  console.log(`Successfully added ${newPromptsRaw.length} prompts starting from ID ${maxId + 1}.`);
} catch (e) {
  console.error('Error updating prompts.json:', e);
  process.exit(1);
}
