import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

function getAddonDir(): string {
  return dirname(fileURLToPath(import.meta.url))
}

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, join(getAddonDir(), 'manager.js')]
}

export function previewAnnotations(entry: string[] = []): string[] {
  return [...entry, join(getAddonDir(), 'preview.js')]
}
