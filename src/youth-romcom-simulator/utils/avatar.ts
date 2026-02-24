/**
 * @file Avatar generation utility
 */
import { get } from 'lodash';
import { store } from '../store/state';

const a = 'a'.charCodeAt(0);
const z = 'z'.charCodeAt(0);
const A = 'A'.charCodeAt(0);
const Z = 'Z'.charCodeAt(0);

const COLORS = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
    '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6',
    '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'
];

function getBackgroundColor(name: string): string {
    if (!name || name.length === 0) {
        return COLORS[0];
    }
    const firstChar = name.charCodeAt(0);
    let colorIndex;

    if (firstChar >= a && firstChar <= z) {
        colorIndex = firstChar - a;
    } else if (firstChar >= A && firstChar <= Z) {
        colorIndex = firstChar - A;
    } else {
        colorIndex = 0;
    }
    return COLORS[colorIndex % COLORS.length];
}

/**
 * Generates an HTML string for a user avatar based on their name or a custom URL.
 * It first checks for a custom avatar URL in `worldState.角色头像[characterId]` or `worldState.角色[characterId].头像`.
 * If not found, it falls back to generating a colored initial.
 * @param name The name to generate the initial for.
 * @param characterId (Optional) The ID of the character to check for a custom avatar.
 * @returns An HTML string representing the avatar.
 */
export function getAvatar(name: string, characterId?: string): string {
    if (characterId) {
        // Correctly access the '角色头像' object, then the characterId key.
        const customAvatarUrl = get(store.worldState, ['角色头像', characterId], null) || get(store.worldState, ['角色', characterId, '头像'], null);
        if (customAvatarUrl && typeof customAvatarUrl === 'string') {
            return `<img src="${customAvatarUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
    }

    // Fallback to initial-based avatar
    if (!name) {
        return `<div style="background-color: ${COLORS[0]}; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; color: white; font-weight: bold;">?</div>`;
    }
    const initial = name.substring(0, 1).toUpperCase();
    const backgroundColor = getBackgroundColor(name);
    return `<div style="background-color: ${backgroundColor}; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; color: white; font-weight: bold;">${initial}</div>`;
}