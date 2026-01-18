/**
 * @file Character data processing utilities.
 * These are pure functions that do not depend on the store's state.
 */
import { get } from 'lodash';
import { Character } from '../types/character';

/**
 * Safely gets a value from a nested object, handling the common [value, "description"] format.
 */
export function safeGetValue(
  obj: any,
  path: string | (string | number)[],
  defaultValue: any = 'N/A',
  accessFirstElement: boolean = true,
): any {
  const value = get(obj, path, defaultValue);
  if (accessFirstElement && Array.isArray(value) && value.length > 0) {
    const firstEl = value[0];
    if (Array.isArray(firstEl) && firstEl.length === 1 && firstEl[0] === '$__META_EXTENSIBLE__$') {
      return Array.isArray(defaultValue) ? [] : defaultValue;
    }
    if (firstEl === '$__META_EXTENSIBLE__$') {
      return Array.isArray(defaultValue) ? [] : defaultValue;
    }
    return firstEl;
  }
  return value;
}

/**
 * Gets a character's data from the world state by their ID.
 */
export function getCharacterById(worldState: any, characterId: string): Character | null {
  if (!worldState || !characterId) return null;
  return get(worldState, `角色.${characterId}`, null);
}

/**
 * Finds a character's ID by their full name.
 * @param worldState The entire world state object.
 * @param fullName The full name to search for.
 * @returns The character ID or null if not found.
 */
export function getCharacterIdByName(worldState: any, fullName: string): string | null {
  if (!worldState || !fullName) return null;
  const allCharacters = get(worldState, '角色', {});
  for (const id in allCharacters) {
    if (Object.prototype.hasOwnProperty.call(allCharacters, id)) {
      const char = allCharacters[id];
      const charName = `${safeGetValue(char, '姓', '', true)}${safeGetValue(char, '名', '', true)}`;
      if (charName === fullName) {
        return id;
      }
    }
  }
  return null;
}
