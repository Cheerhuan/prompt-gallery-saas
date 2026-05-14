const SUBMISSIONS_KEY = 'prompt-gallery-submissions'

interface Submission {
  id: string
  title: string
  image: string
  full_prompt: string
  model: string
  submitted_at: string
}

/** Get prompts submitted by the current user (client-only) */
export function getSubmissions(): Submission[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Add a new submission to localStorage */
export function addSubmission(submission: Omit<Submission, 'id' | 'submitted_at'>): void {
  const subs = getSubmissions()
  const newSub: Submission = {
    ...submission,
    id: 'sub-' + Date.now(),
    submitted_at: new Date().toISOString(),
  }
  subs.unshift(newSub)
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs))
  window.dispatchEvent(new CustomEvent('submissions-change'))
}
