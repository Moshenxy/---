/**
 * Safely gets an element by its ID.
 * @param id The ID of the element.
 * @returns The element or null if not found.
 */
export function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * A simple utility to set the text content of an element.
 * @param id The ID of the element.
 * @param value The text content to set.
 */
export function setText(id: string, value: string | number) {
  const el = getElement(id);
  if (el) {
    el.textContent = String(value);
  }
}
