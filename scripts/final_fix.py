import json
import os

root = '/Users/xiebinghuan/prompt-gallery-saas'
main_path = os.path.join(root, 'src/data/prompts.json')

with open(main_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Deduplicate
seen = set()
unique_data = []
for item in data:
    if item['id'] not in seen:
        unique_data.append(item)
        seen.add(item['id'])

# Find max ID
max_id = 0
for item in unique_data:
    try:
        val = int(item['id'])
        if val > max_id:
            max_id = val
    except:
        pass

new_prompts = [
    {
        'id': str(max_id + 1),
        'title': 'Branded Technical Infographic: Food-Engineering Style',
        'image': 'https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2017669983916982605/0.jpg',
        'full_prompt': 'Create a branded technical infographic of a [SNACK], combining a realistic photograph or photoreal render of the product with technical annotation overlays placed directly on top. Use black ink–style line drawings with strategic [BRAND COLOR] accents (architectural sketch look) on a pure white studio background, including:\n• Key component labels\n• Internal cross-section showing structure, layering, or internal design\n• Measurements, dimensions, and specifications\n• Material callouts with composition and quantities\n• Arrows indicating function for primary features and structural integrity\n• Simple schematic or sectional diagram showing key mechanical or design elements\n• Sustainability callouts\n\nTitle placement: Inside a hand-drawn technical annotation box with accent border reading the product name in bold font, positioned in upper corner.\n\nStyle & layout rules:\n• The realistic product remains clearly visible\n• Annotations feel sketched, technical, and architectural\n• Accents used for highlight (20-30% of linework), black for primary technical lines (70-80%)\n• Clean composition with balanced negative space\n• Educational, food-engineering vibe with premium branding\n• Include subtle brand logo mark in corner\n\nVisual style: Minimal technical illustration aesthetic, black linework with accents over realistic imagery, precise but slightly hand-drawn feel.\n\nColor palette: White background, black annotation lines/text, [BRAND COLOR] for accents and key callouts only.\n\nOutput: 1080×1080, ultra-crisp, social-feed optimized, no watermark',
        'model': 'NanoBanana Pro',
        'creator': '@TechieBySA',
        'tier': 'free',
        '_source': 'meigen.ai'
    },
    {
        'id': str(max_id + 2),
        'title': 'Mixed-Media Campaign Art Direction: Photo & 2D Illustration',
        'image': 'https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2038319037248114957/0.jpg',
        'full_prompt': 'Act as a Mixed-Media Campaign Art Director. Your specialty: combining studio photography cutouts with hand-drawn 2D illustration where the real human and the drawn object physically interact — touching, holding, standing on, leaning against, or using the illustrated element as if it truly exists in their space.\n\nExecution Framework:\nPhase 1: Canvas & Color System\n- Format: 1:1 square canvas.\n- Background: A single, flat, saturated [HERO COLOR] (no gradients or textures).\n- Overlays: 3–4 organic \"amoeba blob\" shapes in a 20% darker shade of the hero color, scattered asymmetrically.\n\nPhase 2: Autonomous AI Decision Making\n1. Object Selection: Identify one iconic, tangible physical object associated with the [BRAND NAME]. (Criteria: Recognizable, collectible, or identity-defining. No animals or logos).\n2. Interaction Selection: Determine a dynamic physical relationship (e.g., Holding, Wearing/Using, Standing On, Riding/Leaning, or Emerging From).\n\nPhase 3: Staging the Scene\n- The Model: Age 18–26, clean cutout, wearing iconic brand apparel in a monochromatic [HERO COLOR] palette.\n- The Illustrated Object: Pure white (#FFFFFF) flat 2D illustration; brush-pen marker line quality (3–5px weight). Scale: Must be large (min. 40% of canvas height). Depth Layering: The object must wrap around the model.\n- Brand Stamp: A small logo mark embedded on the object in a darker variant of the hero color.\n\nPhase 4: Supporting Illustration System\n- All supporting elements must be white, flat, brush-pen style: Logo Marks, Impact Markers (Manga-style exclamation dashes), Motion Lines (2–4 curved speed lines), Ground Effect (white sparkles, speed dashes), and Ambient Squiggles.\n\nPhase 5: Lighting\n- Setup: Studio strobe, high-key, 5500K neutral. Shadows: No dramatic shadows; only a soft contact shadow at the feet (15% opacity).',
        'model': 'NanoBanana Pro',
        'creator': '@AmirMushich',
        'tier': 'free',
        '_source': 'meigen.ai'
    }
]

unique_data.extend(new_prompts)

with open(main_path, 'w', encoding='utf-8') as f:
    json.dump(unique_data, f, indent=2, ensure_ascii=False)

print(f'Done. Total: {len(unique_data)}')
