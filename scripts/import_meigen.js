const fs = require('fs');
const path = '/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const newPrompts = [
  {
    id: (data.length + 1).toString(),
    title: 'Stylized 3D Character Identity Preservation',
    image: 'https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2020837883549298730/0.jpg',
    full_prompt: `Use a user-uploaded image as the source and convert the person into a stylized 3D character while preserving identity, facial structure, pose, hairstyle, clothing, and overall composition exactly as shown in the photo. The result should clearly resemble the real person. The visual style is a stylized 3D character with a soft minimal cartoon 3D aesthetic, inspired by Pixar-like visuals but more minimal, toy-figure renders, and clean product-style character design. Skin should appear as smooth matte plastic with a soft, uniform texture and gentle subsurface scattering. Lighting should be clean and controlled, similar to a studio softbox setup, with very soft shadows, low contrast, and subtle highlights. The background should be a solid [BACKGROUND COLOR] with no gradient. The camera should feel front-facing with a medium close-up framing, similar to a 50mm lens, with no distortion. Output quality should be high resolution with clean edges, no noise, strong style consistency, and a clearly non-photorealistic finish.`,
    model: 'NanoBanana Pro',
    creator: '@TechieBySA',
    tier: 'free',
    _source: 'meigen.ai'
  },
  {
    id: (data.length + 2).toString(),
    title: 'Premium Logo Materialization - Embossed Relief',
    image: 'https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/2045580765136920938/0.jpg',
    full_prompt: `The logo does not exist as a separate standing object placed on a surface. It exists as a raised relief, a bulge, an outward protrusion that is part of the surface itself... the logo must read as PUSHED OUTWARD FROM the surface, rising toward the viewer, proud and raised. Use a structured, multi-phase approach to guide the AI through the technical requirements of CGI and brand identity. Phase 1: Surface & Atmosphere: Creates a unified physical plane. Phase 2: The Emboss: Bas-relief style: The entire filled silhouette rises as one solid mass (like a coin). Geometry: Convex/domed top face with smooth beveled walls. Phase 3: Lighting: Key Light from 10-11 o'clock, Fill Light from lower-right. Phase 4: Typography: minimal lockup at the bottom. Ray Tracing enabled, Depth of Field none, maximum anti-aliasing.`,
    model: 'NanoBanana Pro',
    creator: '@AmirMushich',
    tier: 'free',
    _source: 'meigen.ai'
  }
];
data.push(...newPrompts);
fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Successfully added 2 prompts');
