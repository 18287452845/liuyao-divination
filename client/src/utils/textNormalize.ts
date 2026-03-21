const EXACT_TEXT_MAP: Record<string, string> = {
  '鐢?': '男',
  '濂?': '女',
  '鏈煡': '未知',
  '鍚夊': '吉多',
  '鍑跺': '凶多',
  '骞宠　': '平衡',
};

const FRAGMENT_TEXT_MAP: Array<[string, string]> = [
  ['鍏瓧', '八字'],
  ['鍒嗘瀽', '分析'],
  ['璇锋眰', '请求'],
  ['閿欒', '错误'],
  ['瑙ｆ瀽', '解析'],
  ['鍔犺浇', '加载'],
  ['澶辫触', '失败'],
  ['鎺掔洏', '排盘'],
  ['鐢ㄧ', '用神'],
  ['蹇岀', '忌神'],
  ['鍘熺', '原神'],
  ['浠囩', '仇神'],
  ['澶ц繍', '大运'],
  ['璧疯繍骞撮緞', '起运年龄'],
  ['褰撳墠', '当前'],
  ['绌轰骸', '空亡'],
  ['绁炵厼', '神煞'],
  ['鍦版敮', '地支'],
  ['浜旇', '五行'],
  ['骞存煴', '年柱'],
  ['鏈堟煴', '月柱'],
  ['鏃ユ煴', '日柱'],
  ['鏃舵煴', '时柱'],
  ['鍏悎', '六合'],
  ['涓夊悎', '三合'],
  ['鍏啿', '六冲'],
  ['涓夊垜', '三刑'],
  ['鐩稿', '相害'],
  ['鍚夌', '吉神'],
  ['鍑剁', '凶神'],
  ['姣旇偐', '比肩'],
  ['鍔储', '劫财'],
  ['椋熺', '食神'],
  ['浼ゅ畼', '伤官'],
  ['鍋忚储', '偏财'],
  ['姝ｈ储', '正财'],
  ['涓冩潃', '七杀'],
  ['姝ｅ畼', '正官'],
  ['鍋忓嵃', '偏印'],
  ['姝ｅ嵃', '正印'],
  ['璁板綍', '记录'],
  ['楠岃瘉', '验证'],
  ['鍒犻櫎', '删除'],
  ['鏇存柊', '更新'],
  ['鑾峰彇', '获取'],
  ['鐢ㄦ埛', '用户'],
  ['鐧诲綍', '登录'],
  ['浼氳瘽', '会话'],
  ['瀵嗛挜', '密钥'],
  ['鏉冮檺', '权限'],
  ['閭€璇风爜', '邀请码'],
  ['纭畾', '确定'],
  ['璇烽€夋嫨', '请选择'],
  ['鎬у埆', '性别'],
  ['鏈?', '木'],
  ['鐏?', '火'],
  ['鍦?', '土'],
  ['閲?', '金'],
  ['姘?', '水'],
];

export function normalizeLegacyText(value: string): string {
  if (!value) {
    return value;
  }

  let normalized = EXACT_TEXT_MAP[value] || value;

  for (const [legacyText, cleanText] of FRAGMENT_TEXT_MAP) {
    if (normalized.includes(legacyText)) {
      normalized = normalized.split(legacyText).join(cleanText);
    }
  }

  return normalized;
}

export function normalizeLegacyData<T>(value: T): T {
  if (typeof value === 'string') {
    return normalizeLegacyText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeLegacyData(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeLegacyData(item),
      ])
    ) as T;
  }

  return value;
}
