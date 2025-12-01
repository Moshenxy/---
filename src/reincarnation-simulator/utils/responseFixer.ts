/**
 * @file responseFixer.ts
 * @description Provides functions to ensure the integrity of AI-generated XML-like responses.
 */

/**
 * Ensures that the AI response string is well-formed according to the project's conventions.
 * 1. Prepends a `<thinking></thinking>` block if it's missing.
 * 2. Auto-closes any top-level tags that are not closed before the next tag begins.
 *
 * @param text The raw response string from the AI.
 * @returns A sanitized, more robust response string.
 */
export function ensureIntegrity(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let fixedText = text.trim();

  // 1. Ensure <thinking> tag exists at the beginning
  if (!fixedText.startsWith('<thinking>')) {
    fixedText = '<thinking></thinking>\n' + fixedText;
  }

  // 2. Auto-close other tags using a regex-based replacement
  // This regex finds a start tag, and captures all content until the next start tag or the end of the string.
  const blockRegex = /(<([a-zA-Z\u4e00-\u9fa5][^>\s/]*)(?:[^>]*)>)([\s\S]*?)(?=<[a-zA-Z\u4e00-\u9fa5][^>\s/]*>|$)/g;

  fixedText = fixedText.replace(blockRegex, (match, startTag, tagName, content) => {
    const closingTag = `</${tagName}>`;

    // Simple check if content already contains the closing tag.
    if (content.includes(closingTag)) {
      return match; // The block is already well-formed.
    }

    return `${startTag}${content.trimEnd()}${closingTag}`;
  });

  // Post-processing step for the specific <UpdateVariable><Analysis> case
  const analysisBlockRegex = /<Analysis>[\s\S]*?<\/Analysis>/;
  const analysisMatch = fixedText.match(analysisBlockRegex);

  if (analysisMatch) {
    const analysisBlock = analysisMatch[0];
    // This pattern specifically finds the incorrect sequence of a closing UpdateVariable
    // followed immediately by the full Analysis block.
    const faultyPattern = `</UpdateVariable>${analysisBlock}`;

    if (fixedText.includes(faultyPattern)) {
      // By replacing the entire faulty pattern with just the analysis block,
      // we effectively "move" the analysis block and "delete" the extra closing tag
      // in a single operation.
      fixedText = fixedText.replace(faultyPattern, analysisBlock);
    }
  }

  // Final cleanup for specific, known AI formatting errors
  // Handles <可选化身></可选化身>
  fixedText = fixedText.replace(/<可选化身><\/可选化身>/g, '');
  // Handles <化身></化身>
  fixedText = fixedText.replace(/<化身><\/化身>/g, '');

  return fixedText;
}
