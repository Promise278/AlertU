const STORAGE_KEY = 'alertu-saved-incidents'

export function getSavedIncidentIds(): string[] {
  const saved = localStorage.getItem(STORAGE_KEY)

  return saved ? JSON.parse(saved) : []
}

export function toggleSavedIncident(id: string): string[] {
  const savedIds = getSavedIncidentIds()

  const updatedIds = savedIds.includes(id)
    ? savedIds.filter((savedId) => savedId !== id)
    : [...savedIds, id]

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds))

  return updatedIds
}