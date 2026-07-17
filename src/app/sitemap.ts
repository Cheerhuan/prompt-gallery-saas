import { MetadataRoute } from 'next'
import promptsData from '@/data/prompts.json'

export const dynamic = 'force-static'

const BASE_URL = 'https://cheerhuan.github.io/prompt-gallery-saas'

// Helper: parse _version like "2026-05-09-v3" → "2026-05-09" for valid lastmod
function parseLastModified(version: string | undefined): string | undefined {
  if (!version) return undefined
  // Version format: YYYY-MM-DD-* → extract date portion
  const match = version.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : undefined
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/trending`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/saved`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic prompt pages — all 92 prompts
  const promptPages: MetadataRoute.Sitemap = promptsData.map((prompt: { id: number | string; _version?: string }) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${BASE_URL}/prompt/${prompt.id}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }

    const lastMod = parseLastModified(prompt._version)
    if (lastMod) {
      entry.lastModified = lastMod
    }

    return entry
  })

  return [...staticPages, ...promptPages]
}
