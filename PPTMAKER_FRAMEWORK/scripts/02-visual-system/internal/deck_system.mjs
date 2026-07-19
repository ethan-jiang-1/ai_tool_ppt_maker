import { existsSync, readFileSync } from 'node:fs';

/**
 * Load deck-wide textual rules from deck_system.txt (Stage 1 + style-master).
 * @param {string} filePath
 * @returns {string|null} file text with trailing newline, or null if absent
 */
export function loadDeckSystem(filePath) {
  try {
    if (existsSync(filePath)) {
      return readFileSync(filePath, 'utf-8').trim() + '\n';
    }
  } catch {
    // inaccessible — treat as absent
  }
  return null;
}
