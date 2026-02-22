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

  // New: Generic tag name normalization by removing all hyphens from any tag.
  fixedText = fixedText.replace(/(<\/?)([^>]+)(>)/g, (match, opening, tagName, closing) => {
    // This removes all hyphens from the captured tag name.
    const cleanedTagName = tagName.replace(/-/g, '');
    return `${opening}${cleanedTagName}${closing}`;
  });

  // 1. Ensure <thinking> tag exists at the beginning
  if (!fixedText.startsWith('<thinking>')) {
    fixedText = '<thinking></thinking>\n' + fixedText;
  }

  // 2. Define all valid top-level tags from the format requirements
  const topLevelTags = ['thinking', 'gametxt', '日记片段', '导演场记', '日记', '周刊', 'UpdateVariable'];

  // 3. Auto-close only the defined top-level tags
  for (const tagName of topLevelTags) {
    const startTag = `<${tagName}>`;
    const endTag = `</${tagName}>`;
    const startIndex = fixedText.indexOf(startTag);

    if (startIndex !== -1) {
      const endIndex = fixedText.indexOf(endTag, startIndex);

      if (endIndex === -1) {
        // Tag is opened but not closed. Let's find where it should end.
        let nextTagIndex = -1;
        for (const nextTag of topLevelTags) {
          const tempIndex = fixedText.indexOf(`<${nextTag}>`, startIndex + 1);
          if (tempIndex !== -1 && (nextTagIndex === -1 || tempIndex < nextTagIndex)) {
            nextTagIndex = tempIndex;
          }
        }

        if (nextTagIndex !== -1) {
          // Found the start of the next top-level tag. Insert the closing tag before it.
          const content = fixedText.substring(startIndex + startTag.length, nextTagIndex).trimEnd();
          fixedText =
            fixedText.substring(0, startIndex + startTag.length) + content + endTag + fixedText.substring(nextTagIndex);
        } else {
          // No other top-level tags after it, so close it at the end of the string.
          const content = fixedText.substring(startIndex + startTag.length).trimEnd();
          fixedText = fixedText.substring(0, startIndex + startTag.length) + content + endTag;
        }
      }
    }
  }

  // Post-processing step for the specific <UpdateVariable><Analysis> case
  const analysisBlockRegex = /<Analysis>[\s\S]*?<\/Analysis>/;
  const analysisMatch = fixedText.match(analysisBlockRegex);

  if (analysisMatch) {
    const analysisBlock = analysisMatch[0];
    const faultyPattern = `</UpdateVariable>${analysisBlock}`;

    if (fixedText.includes(faultyPattern)) {
      fixedText = fixedText.replace(faultyPattern, analysisBlock);
    }
  }

  // Final cleanup for specific, known AI formatting errors
  fixedText = fixedText.replace(/<可选化身><\/可选化身>/g, '');
  fixedText = fixedText.replace(/<化身><\/化身>/g, '');

  return fixedText;
}
