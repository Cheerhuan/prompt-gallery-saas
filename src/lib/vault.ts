const VAULT_KEY = 'prompt-gallery-vault';

export function getSavedIds(): (string | number)[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isSaved(id: string | number): boolean {
  return getSavedIds().includes(String(id));
}

export function toggleSave(id: string | number): boolean {
  const ids = getSavedIds().map(String);
  const sid = String(id);
  let newIds: string[];
  let nowSaved: boolean;

  if (ids.includes(sid)) {
    newIds = ids.filter(i => i !== sid);
    nowSaved = false;
  } else {
    newIds = [sid, ...ids];
    nowSaved = true;
  }

  localStorage.setItem(VAULT_KEY, JSON.stringify(newIds));
  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent('vault-change', { detail: { id: sid, saved: nowSaved } }));
  return nowSaved;
}
