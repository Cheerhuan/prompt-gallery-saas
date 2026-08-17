import json
import os

prompts_path = "/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json"
with open(prompts_path, "r", encoding="utf-8") as f:
    data = json.load(f)

new_prompts = [
    {
        "id": "558",
        "title": "Moody Cinematic Portrait",
        "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2004107821525422107/0.jpg",
        "full_prompt": "A cinematic portrait of a person is sitting in soft dramatic lighting. The face is partly lit with warm golden sunlight coming from the side, creating deep shadows and a moody atmosphere. The expression is thoughtful and dreamy, with the hand resting near the face. The background is softly blurred and dark, emphasizing the subject's face. Film grain effect, vintage aesthetic, soft focus, cozy and artistic mood.",
        "model": "GPT Image",
        "creator": "@saniaspeaks_",
        "tier": "free",
        "_source": "meigen.ai"
    },
    {
        "id": "559",
        "title": "Midjourney Style Reference",
        "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2008826024319139888/0.jpg",
        "full_prompt": "--sref 1088104093",
        "model": "Midjourney",
        "creator": "@michaelrabone",
        "tier": "free",
        "_source": "meigen.ai"
    },
    {
        "id": "560",
        "title": "Dreamy Fine-Art Garden Portrait",
        "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2009183590035411178/0.jpg",
        "full_prompt": "{\n\"Objective\": \"Create a dreamy fine-art portrait with a romantic, ethereal garden atmosphere\",\n\"PersonaDetails\": {\n\"Subject\": {\n\"Type\": \"Young woman\",\n\"Hair\": \"Short, softly tousled dark hair\",\n\"Expression\": \"Calm, introspective, slightly melancholic\",\n\"Gaze\": \"Looking gently toward the camera\",\n\"Wardrobe\": {\n\"Dress\": \"Muted teal floral dress with subtle vintage patterns\"\n}\n}\n},\n\"SceneDescription\": {\n\"Location\": \"Lush garden in full bloom\",\n\"EnvironmentDetails\": [\n\"Abundant flowering plants\",\n\"Soft greenery filling the frame\"\n],\n\"AtmosphericElements\": {\n\"FloatingPetals\": \"White and pale peach flower petals drifting through the air\",\n\"Motion\": \"Petals caught mid-motion by a gentle breeze\"\n}\n},\n\"Composition\": {\n\"Framing\": \"Waist-up fine-art portrait\",\n\"Balance\": \"Elegant, centered composition\",\n\"DepthOfField\": \"Shallow depth of field\",\n\"Background\": \"Softly blurred garden with creamy bokeh\"\n},\n\"LightingAndColor\": {\n\"Lighting\": \"Soft natural light under overcast sky\",\n\"ColorPalette\": [\n\"Muted greens\",\n\"Soft teals\",\n\"Pale peach and white accents\"\n],\n\"ColorGrading\": \"Painterly, desaturated, romantic tones\"\n},\n\"ArtDirection\": {\n\"Style\": \"Fine-art photography blended with cinematic realism\",\n\"Aesthetic\": \"Romantic, ethereal, timeless\",\n\"TextureQuality\": \"Ultra-detailed fabric and natural skin texture\"\n},\n\"PhotographyStyle\": {\n\"LensLook\": \"85mm lens perspective\",\n\"Genre\": \"Fine-art portrait photography\",\n\"ImageQuality\": \"High resolution, refined detail\",\n\"FocusStyle\": \"Soft yet precise subject focus\"\n},\n\"Mood\": {\n\"Tone\": \"Dreamy, reflective, poetic\",\n\"EmotionalFeel\": \"Gentle melancholy and quiet beauty\"\n},\n\"NegativePrompt\": [\n\"harsh lighting\",\n\"modern fashion editorial\",\n\"oversaturated colors\",\n\"busy background\",\n\"plastic skin\",\n\"cartoon\",\n\"anime\"\n],\n\"ResponseFormat\": {\n\"Type\": \"Single image\",\n\"Orientation\": \"Portrait\",\n\"AspectRatio\": \"2:3\"\n}\n}",
        "model": "Nanobanana Pro",
        "creator": "@Taaruk_",
        "tier": "free",
        "_source": "meigen.ai"
    },
    {
        "id": "561",
        "title": "Vibrant Expressive Portrait",
        "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2009946159532662792/0.jpg",
        "full_prompt": "Vibrant expressive portrait of a man looking upwards with wonder, wearing oversized bright orange-red glasses (glass light colour full shade). The face is sketched in dynamic black strokes on a textured newspaper background, enriched with splashes of vivid blue and orange paint. The composition blends realism and abstract expressionism, evoking innocence, hope, and creativity. Take full face of the attached picture.",
        "model": "Nanobanana Pro",
        "creator": "@Sheldon056",
        "tier": "free",
        "_source": "meigen.ai"
    },
    {
        "id": "562",
        "title": "Whimsical Magical Realism Portrait",
        "image": "https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2011282431744336078/0.jpg",
        "full_prompt": "{\n\"Objective\": \"Create a heartwarming, whimsical portrait blending photorealistic realism with a tiny Pixar-style animated character\",\n\"PersonaDetails\": {\n\"PrimarySubject\": {\n\"Type\": \"Young girl\",\n\"Expression\": \"Bright, joyful smile\",\n\"Hair\": {\n\"Style\": \"Long light-brown hair\",\n\"Accessories\": \"Cute ribbon bows\"\n},\n\"Wardrobe\": {\n\"Outerwear\": \"Casual denim jacket\",\n\"Top\": \"Soft neutral-colored shirt\"\n}\n},\n\"SecondarySubject\": {\n\"Type\": \"Tiny 3D cartoon version of the girl\",\n\"Scale\": \"Miniature, held delicately between fingers\",\n\"Style\": \"Pixar-style 3D character\",\n\"Proportions\": \"Oversized expressive eyes, rounded features\",\n\"Hair\": \"Pigtails matching the real girl\",\n\"Wardrobe\": \"Denim outfit matching the real subject\",\n\"Pose\": \"Arms raised joyfully\"\n}\n},\n\"Composition\": {\n\"Framing\": \"Close-up to medium portrait\",\n\"Interaction\": \"Clear playful interaction between girl and miniature character\",\n\"DepthOfField\": \"Shallow depth of field\",\n\"Focus\": \"Ultra-sharp focus on both faces\"\n},\n\"LightingAndBackground\": {\n\"Lighting\": \"Warm natural daylight\",\n\"Background\": {\n\"Style\": \"Soft golden bokeh\",\n\"Mood\": \"Dreamy, magical\"\n}\n},\n\"ArtDirection\": {\n\"StyleFusion\": [\n\"Photorealistic child portrait photography\",\n\"Pixar-style 3D animated character\"\n],\n\"Aesthetic\": \"Magical realism with playful scale contrast\",\n\"TextureDetail\": \"Ultra-detailed skin, fabric, and 3D materials\"\n},\n\"MoodAndTone\": {\n\"Mood\": \"Heartwarming, joyful, whimsical\",\n\"EmotionalFeel\": \"Wonder, innocence, playful imagination\"\n},\n\"PhotographyStyle\": {\n\"Genre\": \"Cinematic lifestyle portrait photography\",\n\"LensFeel\": \"Portrait lens with creamy bokeh\",\n\"ImageQuality\": \"8K ultra-high realism\"\n},\n\"NegativePrompt\": [\n\"uncanny valley\",\n\"scary doll\",\n\"low-quality 3D\",\n\"harsh lighting\",\n\"oversaturated colors\",\n\"blurry focus\",\n\"flat expression\"\n],\n\"ResponseFormat\": {\n\"Type\": \"Single image\",\n\"Orientation\": \"Portrait\",\n\"AspectRatio\": \"2:3\"\n}\n}",
        "model": "Nanobanana Pro",
        "creator": "@Taaruk_",
        "tier": "free",
        "_source": "meigen.ai"
    }
]

data.extend(new_prompts)

with open(prompts_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
