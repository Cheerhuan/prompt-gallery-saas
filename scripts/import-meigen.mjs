import fs from 'fs';
const data = JSON.parse(fs.readFileSync('src/data/prompts.json', 'utf8'));
const newPrompts = [
  {
    "id": "550",
    "title": "Collectible Figure Style Poster",
    "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2066087016362881078/0.jpg",
    "full_prompt": "Create a 4:5 vertical poster of a character inside a premium packaging box. Character: East Asian female, aged 20–26, \"Sweet but Cool\" (甜酷) aesthetic, high ponytail, voluminous hair. Outfit: All-black ensemble consisting of slim-fit cropped tank top, black leather short jacket draped over shoulders, high-waisted black leather mini skirt, black short socks with platform boots. Structure: Character centered in a transparent blister pack with realistic plastic reflections and high-gloss edges. Layout Elements: Vertical brand info bar (left), \"Limited Edition\" label (top), accessory compartments (right) containing mini shoulder bag, sunglasses, purple perfume bottle, pink-purple lip gloss, powder compact, photocard/smartphone, and extra boots. Color Palette: Lavender Purple + Black + Silver-White. Lighting: Commercial studio lighting; bright, clean, with sharp reflections on the plastic and leather. Include text: COLLECTIBLE FIGURE, DREAM MUSE COLLECTION, LIMITED EDITION, 1/7 SCALE, STYLE TAG: Sweet but Cool, Confident, Unstoppable.",
    "model": "Midjourney / DALL-E",
    "creator": "@liyue_ai",
    "tier": "free",
    "_source": "meigen.ai"
  },
  {
    "id": "551",
    "title": "Premium UGC-style Advertising Poster",
    "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2068736795827646513/0.jpg",
    "full_prompt": "Create a premium UGC-style advertising poster for [Product] by [Brand]. Use the product as the clear hero of the image and preserve the product shape, packaging, logo, label, colors, proportions, and readable text with strong visual accuracy. Design the image as a powerful commercial poster with a bold editorial feel and a high-impact visual hook. The scene should feel like a real viral UGC moment elevated into a luxury campaign. Show a human hand naturally interacting with the product in a dynamic action moment such as grabbing it, tossing it, spraying it, opening it, pouring it, unboxing it, or pushing it toward the camera. Capture the exact split second of action with strong cinematic tension and scroll-stopping energy. Add product-related action effects that enhance the visual hook, such as frozen splashes, flying particles, dust bursts, liquid trails, mist, shattered texture bursts, energetic motion blur, glow accents, or floating ingredients. Dramatic editorial lighting, clean rim light, realistic reflections, crisp focus, shallow depth of field, premium contrast, cinematic color grading, and a refined luxury commercial finish. Include one strong advertising slogan made of exactly 3 words: \"[Slogan]\". Composition: vertical poster, 4:5 or 9:16, dynamic close-up or medium-close framing.",
    "model": "Midjourney / DALL-E 3",
    "creator": "@aziz4ai",
    "tier": "free",
    "_source": "meigen.ai"
  },
  {
    "id": "552",
    "title": "3D Collectible Travel Poster",
    "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2068719600326611247/0.jpg",
    "full_prompt": "Create a premium collectible travel poster, Theme: [Place Name]. The man from the attached country-style photo takes a funny selfie with his smartphone, sitting on the bottom edge of a large Polaroid photo frame, with one leg hanging outside the frame, creating a playful 3D popping effect. Inside the Polaroid photo frame: A cozy room / travel scene inspired by place. Authentic elements of culture, architecture, food, nature, crafts and local lifestyle. Warm, inviting lighting. Rich narrative details. Character dressed in modern fashion inspired by the color and identity of the country. Happy facial expression, large expressive eyes, carefully styled hair. For Beyond the Polaroid: Premium soft gradient background using Thai-inspired colors, elegant monochrome hand-drawn drawings and icons, attractions related to traveling around the country, flora and fauna, cultural symbols, local food, transport, maps and decorative motifs. Clean composition with lots of negative space. Typography: Large and stylishly handwritten name of the country at the top, a small national flag next to the name, a short slogan of the country at the bottom, and an inspiring handwritten quote. High-quality 3D illustration, Collectible poster design, Soft cinematic lighting, Detailed textures, Vertical poster format (4:5), Aspect ratio 3:4.",
    "model": "Midjourney / DALL-E",
    "creator": "@im_shahid7",
    "tier": "free",
    "_source": "meigen.ai"
  },
  {
    "id": "553",
    "title": "Hyper-realistic Sports Editorial Portrait",
    "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2069235139889033262/0.jpg",
    "full_prompt": "Ultra-realistic full-body photograph of a young woman, captured from a high-angle viewpoint in a 3/4 left perspective. Her body and face are oriented toward the left while she gently looks back at the camera with a warm, natural expression. Holding an official FIFA World Cup 2026 soccer ball at waist height with both hands. Outfit: official Argentina national football team jersey with 3 stars, a light blue and white scarf wrapped around her neck, a short white pleated skirt, white knee-high socks, and dark brown loafers. Every fabric displays realistic textures, folds, stitching, and physically accurate materials. Background: pure white studio backdrop designed in a stylish scrapbook-inspired composition, featuring hand-drawn sky-blue doodles such as soccer balls, stars, hearts, a spiral notebook, a perspective view of a football stadium, a trophy, and an emblem. Large handwritten words including “ARGENTINA”, “VAMOS!”, and “CHAMPIONS” distributed around the subject. Vertical 9:16 framing. Style: ultra-realistic professional photography, editorial sports fashion shoot, luxury magazine aesthetic, lifelike facial details, natural skin pores, cinematic yet soft lighting, high dynamic range, premium DSLR quality, photorealistic textures, 8K resolution.",
    "model": "Midjourney / DALL-E",
    "creator": "@SimplyAnnisa",
    "tier": "free",
    "_source": "meigen.ai"
  },
  {
    "id": "554",
    "title": "Airy Minimalist Information Visual",
    "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2068271400591470667/0.jpg",
    "full_prompt": "围绕具体主题内容生成一张明亮、清透、带空气感的信息视觉：画面核心不是清晰写实主体，而是把主题意象溶解成柔焦色雾与细长下坠的流动色痕，形成像被光拉伸、被水汽晕开的背景场；主体色块集中在中部形成朦胧记忆点，边缘逐渐化开，局部保留少量更鲜明的色点作为视觉停顿。整体层级由大面积高明度洁净底场、柔和半透明主题色、少量明快强调色和清晰白色信息文字构成，色彩从主题自身的季节、材质、情绪与语义中提取并分配角色：底色负责通风感和洁净明度，主体色负责柔和情绪，强调色只在关键位置点亮，文字色保持干净高对比；保持高明度、低杂质、适度饱和、轻快温柔的情绪，不做浑浊、陈旧或灰暗处理。排版使用优雅高反差衬线字作为主标题，字号极大、贴近画面边界，中文信息以较细的宋体气质穿插，形成大字压场与小字呼吸的节奏；可加入旋转阅读的侧边信息、细线花形符号、极细手绘曲线和椭圆描边标签，让文字像花艺展览海报一样既是信息也是图形。画面质感应有轻微纸面颗粒、柔光扩散和透明层次，所有元素保持留白、秩序与春日般清亮的呼吸感。",
    "model": "Midjourney / DALL-E",
    "creator": "@xiaoxiaodong01",
    "tier": "free",
    "_source": "meigen.ai"
  }
];
data.push(...newPrompts);
fs.writeFileSync('src/data/prompts.json', JSON.stringify(data, null, 2));
