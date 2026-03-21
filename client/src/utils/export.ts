import type { DivinationRecord } from '../types';

export const exportToJSON = (data: any, filename = 'export.json') => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportRecordsToJSON = (records: DivinationRecord[]) => {
  const filename = `六爻记录_${new Date().toISOString().split('T')[0]}.json`;
  exportToJSON(records, filename);
};

export const exportRecordToJSON = (record: DivinationRecord) => {
  const dateLabel = new Date(record.timestamp).toLocaleDateString('zh-CN').replace(/\//g, '-');
  const filename = `六爻_${record.benGua.name}_${dateLabel}.json`;
  exportToJSON(record, filename);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
};

export const shareRecord = (record: DivinationRecord): string => {
  const yaoNames = ['上', '五', '四', '三', '二', '初'];
  const lines = record.benGua.lines
    .slice()
    .reverse()
    .map((line, index) => {
      const symbol = line === 1 ? '━━━' : '━ ━';
      const change = record.benGua.changes[5 - index] ? ' 动' : '';
      return `${yaoNames[index]}爻 ${symbol}${change}`;
    })
    .join('\n');

  const analysisSnippet = record.aiAnalysis
    ? `\nAI 解卦：\n${record.aiAnalysis.substring(0, 200)}${record.aiAnalysis.length > 200 ? '...' : ''}\n`
    : '';

  return [
    `【六爻卦象】${record.benGua.name}${record.bianGua ? ` → ${record.bianGua.name}` : ''}`,
    '',
    `占问：${record.question}`,
    `时间：${new Date(record.timestamp).toLocaleString('zh-CN')}`,
    '',
    '本卦：',
    lines,
    analysisSnippet.trim(),
    '---',
    '来自：六爻排盘系统',
  ]
    .filter(Boolean)
    .join('\n');
};
