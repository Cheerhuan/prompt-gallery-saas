const LIKES_KEY = 'prompt-gallery-likes'

/** Get the Set of prompt IDs liked by the current user (client-only) */
export function getLikes(): (string | number)[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LIKES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Check if a specific prompt is liked */
export function isLiked(id: string | number): boolean {
  return getLikes().map(String).includes(String(id))
}

/** Toggle like on a prompt. Returns the new liked state. */
export function toggleLike(id: string | number, userId?: string | null): boolean {
  const ids = getLikes().map(String)
  const sid = String(id)
  let newIds: string[]
  let nowLiked: boolean

  if (ids.includes(sid)) {
    newIds = ids.filter(i => i !== sid)
    nowLiked = false
  } else {
    newIds = [sid, ...ids]
    nowLiked = true
  }

  localStorage.setItem(LIKES_KEY, JSON.stringify(newIds))

  // Dispatch custom event so other components can react
  window.dispatchEvent(
    new CustomEvent('likes-change', {
      detail: { id: sid, liked: nowLiked, userId },
    })
  )

  // Track via Plausible
  window.plausible?.('LikePrompt', { props: { id: sid } })

  return nowLiked
}

/** Get total likes count for a specific prompt (from localStorage) */
export function getLikesCount(id: string | number): number {
  // In the SSG version, "total likes" = how many times this user has liked it
  // (stored per-device via localStorage). In production with Supabase,
  // this would come from a DB query.
  return isLiked(id) ? 1 : 0
}
