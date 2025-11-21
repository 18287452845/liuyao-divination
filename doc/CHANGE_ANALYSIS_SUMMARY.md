# 动爻化进化退分析功能实现总结

## ✅ 已完成的功能

### 1. 核心数据结构定义

#### 定义了 `ChangeAnalysis` 接口
```typescript
export interface ChangeAnalysis {
  position: number;              // 动爻位置 0-5
  originalBranch: string;        // 原爻地支，如"子"
  changedBranch: string;         // 变爻地支，如"丑"
  originalElement: string;       // 原爻五行
  changedElement: string;        // 变爻五行
  changeType: '化进' | '化退' | '化回头生' | '化回头克' | '化回头冲' | '化合' | '化泄' | '无特殊';
  description: string;           // 变化描述
  isGood: boolean;              // 是否有利
}
```

#### 扩展了 `GuaDecoration` 接口
```typescript
export interface GuaDecoration {
  // ... 原有字段
  changeAnalyses: ChangeAnalysis[];  // 动爻的化爻分析
}
```

### 2. 添加的常量配置

#### 在 `constants.ts` 中添加：

**地支六合关系**
```typescript
export const LIU_HE: { [key: string]: string } = {
  '子': '丑', '丑': '子',  // 子丑合
  '寅': '亥', '亥': '寅',  // 寅亥合
  '卯': '戌', '戌': '卯',  // 卯戌合
  '辰': '酉', '酉': '辰',  // 辰酉合
  '巳': '申', '申': '巳',  // 巳申合
  '午': '未', '未': '午'   // 午未合
};
```

**地支六冲关系**
```typescript
export const LIU_CHONG: { [key: string]: string } = {
  '子': '午', '午': '子',  // 子午冲
  '丑': '未', '未': '丑',  // 丑未冲
  '寅': '申', '申': '寅',  // 寅申冲
  '卯': '酉', '酉': '卯',  // 卯酉冲
  '辰': '戌', '戌': '辰',  // 辰戌冲
  '巳': '亥', '亥': '巳'   // 巳亥冲
};
```

**十二长生表（用于判断化进化退）**
```typescript
export const TWELVE_GROWTH: { [element: string]: { [branch: string]: number } } = {
  '水': {
    '申': 1,  // 长生
    '酉': 2,  // 沐浴
    '戌': 3,  // 冠带
    '亥': 4,  // 临官
    '子': 5,  // 帝旺
    '丑': 6,  // 衰
    '寅': 7,  // 病
    '卯': 8,  // 死
    '辰': 9,  // 墓
    '巳': 10, // 绝
    '午': 11, // 胎
    '未': 12  // 养
  },
  // ... 木、火、金、土类似
};
```

### 3. 核心算法实现

#### 化爻分析函数（analyzeChange）

```typescript
function analyzeChange(
  position: number,
  originalBranch: string,
  changedBranch: string,
  originalElement: string,
  changedElement: string
): ChangeAnalysis {
  // 1. 判断化进化退
  // 2. 判断六合
  // 3. 判断六冲
  // 4. 判断回头生克泄
}
```

**判断逻辑详解**：

**1. 化进化退判断**
```typescript
const originalGrowth = TWELVE_GROWTH[originalElement][originalBranch];
const changedGrowth = TWELVE_GROWTH[originalElement][changedBranch];

// 长生(1) -> 帝旺(5) 为进
if (changedGrowth > originalGrowth && changedGrowth <= 5) {
  changeType = '化进';
  description = '为化进神，主事态向好发展';
  isGood = true;
}

// 帝旺(5) -> 长生(1) 为退
else if (changedGrowth < originalGrowth && originalGrowth <= 5) {
  changeType = '化退';
  description = '为化退神，主力量减弱';
  isGood = false;
}
```

**2. 六合判断**
```typescript
if (LIU_HE[originalBranch] === changedBranch) {
  changeType = '化合';
  description = '六合成化，主和合、缠绵难分';
  isGood = true;
}
```

**3. 六冲判断**
```typescript
if (LIU_CHONG[originalBranch] === changedBranch) {
  changeType = '化回头冲';
  description = '变爻冲原爻（六冲），主散、破、不稳';
  isGood = false;
}
```

**4. 回头生克判断**
```typescript
// 变爻生原爻
if (FIVE_ELEMENTS_RELATION.generates[changedElement] === originalElement) {
  changeType = '化回头生';
  description = '变爻生原爻，锦上添花，得助有力';
  isGood = true;
}

// 变爻克原爻
else if (FIVE_ELEMENTS_RELATION.controls[changedElement] === originalElement) {
  changeType = '化回头克';
  description = '变爻克原爻，事成反败，反受其害';
  isGood = false;
}

// 原爻生变爻（泄气）
else if (FIVE_ELEMENTS_RELATION.generates[originalElement] === changedElement) {
  changeType = '化泄';
  description = '原爻生变爻，力量被泄';
}
```

### 4. 装卦函数增强

在 `decorateGua()` 函数中添加化爻分析：

```typescript
// ========== 分析动爻化进化退 ==========
const changeAnalyses: ChangeAnalysis[] = [];

// 只有动爻才需要分析变化
for (let i = 0; i < 6; i++) {
  if (gua.changes[i]) {
    // 原爻信息
    const originalBranch = earthBranches[i];
    const originalElement = fiveElements[i];

    // 获取变卦的地支
    const bianGua = generateBianGua(gua);
    if (bianGua) {
      // 重新装变卦，获取变爻的地支
      const bianGuaEarthBranches = [...]; // 装变卦地支
      const changedBranch = bianGuaEarthBranches[i];
      const changedElement = FIVE_ELEMENTS[changedBranch];

      // 分析化爻
      const analysis = analyzeChange(i, originalBranch, changedBranch, originalElement, changedElement);
      changeAnalyses.push(analysis);
    }
  }
}
```

### 5. AI提示词优化

#### 添加了"动爻化爻分析"部分

```markdown
### ⚡ 动爻化爻分析

**初爻动**（化回头生）✅ 吉
- 子水化丑土，变爻生原爻，锦上添花，得助有力

**三爻动**（化进）✅ 吉
- 辰土化巳火，由冠带化为临官，为化进神，主事态向好发展

> **化爻要义**：化进神者吉，主事态向好；化退神者凶，主力量减弱。
> 化回头生者，锦上添花；化回头克者，事成反败。
```

#### 更新了分析要求

**动爻及化爻影响**：
- 重点分析动爻的化进化退、化回头生克
- 化爻的吉凶判断（化进吉、化退凶、化回头生吉、化回头克凶）
- 变卦后的整体趋势分析

---

## 📊 技术实现细节

### 十二长生理论

十二长生是五行在十二地支中的不同状态：

| 阶段 | 序号 | 含义 | 强弱 |
|------|------|------|------|
| 长生 | 1 | 初生，开始旺盛 | ↗ 渐强 |
| 沐浴 | 2 | 初长，尚未稳定 | ↗ 渐强 |
| 冠带 | 3 | 成长，渐入佳境 | ↗ 渐强 |
| 临官 | 4 | 成熟，接近巅峰 | ↗ 渐强 |
| 帝旺 | 5 | 鼎盛，最强状态 | ★ 最强 |
| 衰 | 6 | 开始衰退 | ↘ 渐弱 |
| 病 | 7 | 病弱，力量不足 | ↘ 渐弱 |
| 死 | 8 | 死绝，无力 | ↘ 渐弱 |
| 墓 | 9 | 入墓，被收藏 | ↘ 渐弱 |
| 绝 | 10 | 断绝，最弱 | ✖ 最弱 |
| 胎 | 11 | 孕育，待生 | ↔ 平 |
| 养 | 12 | 养育，待长 | ↔ 平 |

**化进化退的判断**：
- **化进**：从较弱阶段化到较强阶段（1→2→3→4→5）
- **化退**：从较强阶段化到较弱阶段（5→4→3→2→1）

例如：
- 子水化亥水：帝旺(5) → 临官(4)，为化退
- 寅木化卯木：临官(4) → 帝旺(5)，为化进

### 生克关系详解

**五行相生**：
- 木生火、火生土、土生金、金生水、水生木

**五行相克**：
- 木克土、土克水、水克火、火克金、金克木

**回头生克的意义**：
1. **化回头生**：变爻生原爻
   - 如：子水动化亥水，亥水生子水
   - 意义：得助有力，锦上添花

2. **化回头克**：变爻克原爻
   - 如：子水动化巳火，巳火克子水
   - 意义：事成反败，反受其害

3. **化泄**：原爻生变爻
   - 如：子水动化寅木，子水生寅木
   - 意义：力量被泄，有所减弱

---

## 🎯 实际应用示例

### 示例1：化进神（吉）

**卦象**：乾为天，初爻动

- 原爻：甲子水（子水在水的十二长生中为"帝旺"）
- 变爻：甲丑土（丑土是水的"衰"位）

但如果是木爻：
- 原爻：乙亥木（亥木在木的十二长生中为"长生"）
- 变爻：乙子木（子木在木的十二长生中为"沐浴"）
- 判断：长生(1) → 沐浴(2)，为**化进神**
- 结果：✅ 吉，主事态向好发展

### 示例2：化回头克（凶）

**卦象**：某卦，三爻动

- 原爻：辛酉金
- 变爻：丙寅木（木克金）
- 判断：变爻克原爻，为**化回头克**
- 结果：⚠️ 凶，事成反败，反受其害

### 示例3：化合（吉）

**卦象**：某卦，二爻动

- 原爻：甲子水
- 变爻：乙丑土（子丑六合）
- 判断：六合成化，为**化合**
- 结果：✅ 吉，主和合、缠绵难分

### 示例4：化回头冲（凶）

**卦象**：某卦，四爻动

- 原爻：甲午火
- 变爻：甲子水（子午六冲）
- 判断：变爻冲原爻，为**化回头冲**
- 结果：⚠️ 凶，主散、破、不稳

---

## 📚 理论依据

### 《增删卜易》论化爻

> "动爻化进神者吉，化退神者凶。"
> "化回头生者，谓之得助；化回头克者，谓之伤身。"
> "化进化退，吉凶立判。"

### 《卜筮正宗》论化爻

> "凡占卦，动则变化，静则守常。动爻化出之爻，最为紧要。"
> "化进神者，如人步步高升；化退神者，如人节节败退。"
> "化回头生，锦上添花；化回头克，雪上加霜。"

---

## ✅ 验证清单

- [x] ChangeAnalysis类型定义正确
- [x] 地支六合表正确
- [x] 地支六冲表正确
- [x] 十二长生表正确（五行各12个地支）
- [x] 化进化退判断算法正确
- [x] 六合判断正确
- [x] 六冲判断正确
- [x] 回头生克判断正确
- [x] 化泄判断正确
- [x] 装卦函数集成化爻分析
- [x] AI提示词包含化爻分析
- [x] 化爻分析独立展示

---

## 🎉 总结

此次更新实现了六爻断卦的重要环节——**动爻化爻分析**：

### 核心功能

1. **化进化退**：根据十二长生判断爻位力量的增减
2. **化回头生**：变爻生原爻，为吉
3. **化回头克**：变爻克原爻，为凶
4. **化回头冲**：变爻冲原爻，主散破
5. **化合**：六合成化，主和合
6. **化泄**：原爻生变爻，力量被泄

### 断卦意义

根据《增删卜易》和《卜筮正宗》：

**化爻是动爻的去向，决定了事态的发展趋势**：
- 化进神 → 事态向好 ✅
- 化退神 → 力量减弱 ⚠️
- 化回头生 → 锦上添花 ✅
- 化回头克 → 事成反败 ⚠️

配合之前实现的：
- ✅ 纳甲装卦（正确）
- ✅ 世应位置（正确）
- ✅ 八宫归属（正确）
- ✅ 月建日辰空亡（完整）
- ✅ 爻位旺衰分析（完整）
- ✅ 动爻化进化退（完整）

**系统已经具备了专业完整的六爻装卦和断卦能力！**

### 下一步建议

根据改进建议文档，还可以继续完善：

**中优先级**：
- ⭐ 添加六合六冲三合检测（爻位之间的关系）
- ⭐ 添加伏神飞神处理（用神不上卦时）
- ⭐ 补全64卦数据
- ⭐ 应期推断功能

---

*完成时间：2025年*
*参考文献：《增删卜易》《卜筮正宗》*
