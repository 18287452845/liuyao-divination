const GENERATED_DISCLAIMER_MARKERS = [
  '以上内容由',
  '以上分析由',
  '本内容由',
  '本分析由',
  '仅供娱乐参考',
  '命理分析虽有趣',
  '愿你在人生的旅途中',
];

export function stripGeneratedDisclaimer(content: string) {
  const markerIndex = GENERATED_DISCLAIMER_MARKERS.reduce((earliest, marker) => {
    const index = content.indexOf(marker);
    return index >= 0 && (earliest < 0 || index < earliest) ? index : earliest;
  }, -1);

  if (markerIndex < 0) return content;

  return content
    .slice(0, markerIndex)
    .replace(/(?:\r?\n\s*(?:---|\*\*\*)\s*)+$/g, '')
    .trimEnd();
}
