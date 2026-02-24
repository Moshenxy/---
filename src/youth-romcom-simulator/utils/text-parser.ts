export function parseGameText(text: string): string {
  if (!text) return '';

  return text
    .replace(/【【(.*?)】】/g, '<span class="text-system-highlight">$1</span>')
    .replace(/【(.*?)】/g, '<span class="text-scenery">$1</span>')
    .replace(/「(.*?)」/g, '<span class="text-dialogue">$1</span>')
    .replace(/\*(.*?)\*/g, '<span class="text-psychology">$1</span>');
}
