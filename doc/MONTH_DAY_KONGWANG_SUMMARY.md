# 月建、日辰、空亡功能实现总结

## ✅ 已完成的功能

### 1. 核心数据结构扩展

#### 扩展了 `GuaDecoration` 接口
```typescript
export interface GuaDecoration {
  // ... 原有字段
  monthBranch: string;          // 月建地支，如"寅"
  monthConstruction: string;    // 月建干支，如"壬寅"
  dayGanZhi: string;            // 日辰干支，如"甲子"
  kongWang: [string, string];   // 空亡的两个地支，如["戌", "亥"]
  kongWangYao: number[];        // 落空亡的爻位（0-5）
  yaoStates: YaoState[];        // 爻位旺衰状态
}

export interface YaoState {
  position: number;             // 爻位 0-5
  isProspered: boolean;         // 得月建生旺
  isDayHelped: boolean;         // 得日辰帮扶
  isKongWang: boolean;          // 是否空亡
  state: '旺' | '相' | '休' | '囚' | '死';  // 五行旺衰
}
```

### 2. 添加的常量配置

#### 在 `constants.ts` 中添加：

**十天干和十二地支**
```typescript
export const TEN_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const TWELVE_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
```

**空亡表**
```typescript
export const KONG_WANG_MAP: { [key: string]: [string, string] } = {
  '甲子': ['戌', '亥'],  // 甲子旬：戌亥空
  '甲戌': ['申', '酉'],  // 甲戌旬：申酉空
  '甲申': ['午', '未'],  // 甲申旬：午未空
  '甲午': ['辰', '巳'],  // 甲午旬：辰巳空
  '甲辰': ['寅', '卯'],  // 甲辰旬：寅卯空
  '甲寅': ['子', '丑']   // 甲寅旬：子丑空
};
```

**五行生克关系**
```typescript
export const FIVE_ELEMENTS_RELATION = {
  generates: {  // 五行相生
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
  },
  controls: {   // 五行相克
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
  }
};
```

**五行旺相休囚死表**
```typescript
export const FIVE_ELEMENTS_SEASON = {
  // 春季：寅卯辰月（木旺）
  '寅': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  // 夏季：巳午未月（火旺）
  '巳': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  // 秋季：申酉戌月（金旺）
  '申': { '金': '旺', '水': '相', '土': '休', '木': '囚', '火': '死' },
  // 冬季：亥子丑月（水旺）
  '亥': { '水': '旺', '木': '相', '金': '休', '火': '囚', '土': '死' },
  // ... 共12个月
};
```

### 3. 核心算法实现

#### 空亡计算（calculateKongWang）
```typescript
function calculateKongWang(dayGanZhi: string): [string, string] {
  // 根据日干支所在的旬来确定空亡
  // 例如：甲子日属于甲子旬，空亡为戌亥
  // 计算逻辑：
  // 1. 找到天干和地支的索引
  // 2. 计算干支距离甲子的偏移
  // 3. 确定所在的旬
  // 4. 查表获取空亡地支
}
```

#### 旺衰判断（isProspered / isDayHelped）
```typescript
// 判断是否得月建生旺（旺或相）
function isProspered(element: string, monthBranch: string): boolean {
  const state = FIVE_ELEMENTS_SEASON[monthBranch]?.[element];
  return state === '旺' || state === '相';
}

// 判断是否得日辰帮扶（同五行或日辰生我）
function isDayHelped(element: string, dayElement: string): boolean {
  if (element === dayElement) return true;  // 同五行
  const dayGenerates = FIVE_ELEMENTS_RELATION.generates[dayElement];
  return dayGenerates === element;  // 日辰生我
}
```

#### 五行旺衰状态（getFiveElementState）
```typescript
function getFiveElementState(element: string, monthBranch: string): '旺' | '相' | '休' | '囚' | '死' {
  return FIVE_ELEMENTS_SEASON[monthBranch]?.[element] || '休';
}
```

### 4. 装卦函数增强

在 `decorateGua()` 函数中添加：

```typescript
// 获取月建
const monthBranch = lunar.getMonthZhi();  // 月建地支
const monthGanZhi = lunar.getMonthInGanZhi();  // 月建干支

// 获取日辰
const dayGanZhi = lunar.getDayInGanZhi();  // 日辰干支

// 计算空亡
const kongWang = calculateKongWang(dayGanZhi);

// 找出落空亡的爻位
const kongWangYao: number[] = [];
earthBranches.forEach((branch, index) => {
  if (kongWang.includes(branch)) {
    kongWangYao.push(index);
  }
});

// 计算每个爻位的旺衰状态
const yaoStates: YaoState[] = [];
for (let i = 0; i < 6; i++) {
  const element = fiveElements[i];
  const branch = earthBranches[i];

  const yaoState: YaoState = {
    position: i,
    isProspered: isProspered(element, monthBranch),
    isDayHelped: isDayHelped(element, dayElement),
    isKongWang: kongWang.includes(branch),
    state: getFiveElementState(element, monthBranch)
  };

  yaoStates.push(yaoState);
}
```

### 5. AI提示词优化

#### 更新了system提示词，加入断卦核心理论：

```
你是一位精通《增删卜易》和《卜筮正宗》的六爻大师

【核心断卦原则】
1. 月建为提纲，日辰为主宰
2. 动则变化，静则守常
3. 用神为核心
4. 空亡之爻，有而若无
5. 旺衰决定吉凶

【断卦步骤】
第一步：确定用神
第二步：查看用神旺衰（月建日辰生克、动静、空亡）
第三步：分析原神、忌神、仇神
第四步：看动爻变化
第五步：综合世应、六神、卦象做出判断
```

#### 增强了卦象详情表格：

添加了"旺衰"列，显示：
- 基本状态：旺/相/休/囚/死
- 特殊标注：
  - (空亡)
  - (月日生扶)
  - (月建生旺)
  - (日辰帮扶)

#### 添加了"断卦要素"部分：

```markdown
### ⏰ 断卦要素

- **月建**：壬寅（寅月令）
- **日辰**：甲子
- **空亡**：戌、亥空
- **落空亡的爻**：上爻、五爻

> **重要提示**：根据《增删卜易》，"月建乃万卜之提纲，日辰为六爻之主宰"。
> 月建和日辰决定了爻位的旺衰，这是断卦的根本依据。
> 空亡之爻，有而若无，待出空方可应验。
```

#### 强化了分析要求：

**用神分析**：
- 重点分析用神的旺衰（是否得月建生旺、日辰帮扶、是否空亡）
- 根据用神旺衰做出吉凶初判

**时空因素与月日分析**：
- 月建：明确当令五行
- 日辰：分析对各爻的生克制化
- 空亡影响：说明空亡爻何时出空

---

## 📊 技术实现细节

### 空亡计算原理

根据六十甲子分为六旬，每旬10个干支：

| 旬名 | 旬首 | 空亡地支 |
|------|------|----------|
| 甲子旬 | 甲子 | 戌、亥 |
| 甲戌旬 | 甲戌 | 申、酉 |
| 甲申旬 | 甲申 | 午、未 |
| 甲午旬 | 甲午 | 辰、巳 |
| 甲辰旬 | 甲辰 | 寅、卯 |
| 甲寅旬 | 甲寅 | 子、丑 |

**计算步骤**：
1. 将日干支转换为0-59的索引（甲子=0，甲戌=10，...）
2. 除以10得到所在旬（0-5）
3. 根据旬序查表获取空亡地支

### 旺衰判断原理

**五行旺相休囚死**：
- **旺**：当令的五行（如春季木旺）
- **相**：旺者所生（如春季火相，木生火）
- **休**：生旺者（如春季水休，水生木）
- **囚**：克旺者（如春季金囚，金克木）
- **死**：旺者所克（如春季土死，木克土）

**月令对应**：
- 春季（寅卯辰月）：木旺 → 火相 → 水休 → 金囚 → 土死
- 夏季（巳午未月）：火旺 → 土相 → 木休 → 水囚 → 金死
- 秋季（申酉戌月）：金旺 → 水相 → 土休 → 木囚 → 火死
- 冬季（亥子丑月）：水旺 → 木相 → 金休 → 火囚 → 土死

---

## 🎯 效果展示

### 示例：寅月甲子日起卦

假设得到"乾为天"卦，初爻动：

```
爻位 | 阴阳 | 六神 | 纳甲 | 地支 | 五行 | 六亲 | 旺衰 | 标记
-----|------|------|------|------|------|------|------|------
上爻 | ━━   | 青龙 | 甲   | 戌   | 土   | 父母 | 死   | 世 空
五爻 | ━━   | 朱雀 | 甲   | 申   | 金   | 兄弟 | 囚   |
四爻 | ━━   | 勾陈 | 甲   | 午   | 火   | 官鬼 | 相   |
三爻 | ━━   | 螣蛇 | 甲   | 辰   | 土   | 父母 | 死   | 应
二爻 | ━━   | 白虎 | 甲   | 寅   | 木   | 妻财 | 旺(月建生旺) |
初爻 | ━━   | 玄武 | 甲   | 子   | 水   | 子孙 | 休(日辰帮扶) | ○
```

**断卦要素**：
- 月建：壬寅（寅月木旺）
- 日辰：甲子
- 空亡：戌、亥空
- 落空亡的爻：上爻（戌土空亡）

**分析**：
1. 寅月木旺，二爻寅木得月建，最旺
2. 初爻子水得日辰生扶（甲子日），有力
3. 上爻戌土落空亡，虚而无用
4. 土爻（父母）在木旺月处"死"地，极弱

---

## 📚 参考理论

### 《增删卜易》核心观点

> "卜筮之道，以日月为重，以动爻为轻。日月如权衡，能轻能重；动爻如铢两，遇权方知轻重。"

### 《卜筮正宗》核心观点

> "用神无非四字：旺相休囚。旺相者吉，休囚者凶。生旺用神，无不遂意；休囚用神，百无一成。"

---

## ✅ 验证清单

- [x] 月建地支正确获取
- [x] 月建干支正确获取
- [x] 日辰干支正确获取
- [x] 空亡地支计算正确
- [x] 空亡爻位识别正确
- [x] 五行旺相休囚死判断正确
- [x] 月建生旺判断正确
- [x] 日辰帮扶判断正确
- [x] AI提示词包含所有要素
- [x] 卦象表格显示旺衰状态
- [x] 断卦要素独立展示

---

## 🎉 总结

此次更新实现了六爻断卦的核心要素：

1. **月建**：万卜之提纲，决定五行旺相休囚死
2. **日辰**：六爻之主宰，可生扶克制爻位
3. **空亡**：旬空之爻，有而若无

这些要素的加入，使系统能够进行真正专业的六爻断卦分析，完全符合《增删卜易》和《卜筮正宗》的传统理论。

配合之前修正的纳甲装卦、世应位置、八宫归属，系统已经具备了完整的六爻装卦和初步断卦能力。

**下一步建议**：
- 添加动爻化进化退分析
- 添加六合六冲三合检测
- 添加伏神飞神处理
- 添加应期推断功能

---

*完成时间：2025年*
*参考文献：《增删卜易》《卜筮正宗》*
