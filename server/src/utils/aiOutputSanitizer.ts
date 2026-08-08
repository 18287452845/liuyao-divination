const GENERATED_DISCLAIMER_MARKERS = [
  '以上内容由',
  '以上分析由',
  '本内容由',
  '本分析由',
  '仅供娱乐参考',
  '命理分析虽有趣',
  '愿你在人生的旅途中',
];

const STREAM_OUTPUT_GUARD_LENGTH = 96;

function findGeneratedDisclaimerIndex(content: string) {
  return GENERATED_DISCLAIMER_MARKERS.reduce((earliest, marker) => {
    const index = content.indexOf(marker);
    return index >= 0 && (earliest < 0 || index < earliest) ? index : earliest;
  }, -1);
}

function cleanOutputPrefix(content: string) {
  return content
    .replace(/(?:\r?\n\s*(?:---|\*\*\*)\s*)+$/g, '')
    .trimEnd();
}

export function stripGeneratedDisclaimer(content: string) {
  const markerIndex = findGeneratedDisclaimerIndex(content);
  return markerIndex < 0 ? content : cleanOutputPrefix(content.slice(0, markerIndex));
}

export function createAiOutputStreamFilter() {
  let pending = '';
  let blocked = false;

  return {
    push(content: string) {
      if (blocked || !content) return '';

      pending += content;
      const markerIndex = findGeneratedDisclaimerIndex(pending);
      if (markerIndex >= 0) {
        blocked = true;
        const safeContent = cleanOutputPrefix(pending.slice(0, markerIndex));
        pending = '';
        return safeContent;
      }

      if (pending.length <= STREAM_OUTPUT_GUARD_LENGTH) return '';

      const splitIndex = pending.length - STREAM_OUTPUT_GUARD_LENGTH;
      const safeContent = pending.slice(0, splitIndex);
      pending = pending.slice(splitIndex);
      return safeContent;
    },
    flush() {
      if (blocked) return '';

      const safeContent = stripGeneratedDisclaimer(pending);
      pending = '';
      return safeContent;
    },
  };
}
