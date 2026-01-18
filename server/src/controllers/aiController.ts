import { Request, Response } from 'express';
import axios from 'axios';
import { Lunar } from 'lunar-javascript';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export const analyzeGua = async (req: Request, res: Response) => {
  try {
    const { benGua, bianGua, decoration, question, gender, bazi, timestamp } = req.body;

    // 检查API Key是否配置
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.trim() === '') {
      console.error('DeepSeek API Key未配置');
      return res.status(500).json({
        error: 'DeepSeek API Key未配置，请联系管理员配置API Key后再使用AI分析功能'
      });
    }

    // 构建解卦prompt
    const prompt = buildAnalysisPrompt(benGua, bianGua, decoration, question, gender, bazi, timestamp);

    // 设置响应头为流式传输
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 调用DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位精通《增删卜易》和《卜筮正宗》的六爻大师，擅长解卦断事。

【核心断卦原则】
1. **月建为提纲，日辰为主宰** - 判断用神旺衰的首要标准
   - 月建决定五行旺相休囚死的基本状态
   - 日辰可以生扶、克制爻位，是最重要的判断依据
   - 月建日辰为外应之神，不上卦而临卦

2. **动则变化，静则守常** - 重点分析动爻
   - 动爻代表事态的变化和发展，主动意
   - 静爻代表事物的稳定状态，主安静
   - 动爻可以生克冲合其他爻位
   - 独发易成，乱动难就

3. **用神为核心**
   - 用神发动，事必有成；用神受克，难遂所愿
   - 原神发动，用神有救；忌神发动，用神受伤
   - 用神旺相有气，吉事必成；用神休囚无力，凶事难免
   - 用神两现，须看旺衰；用神伏藏，待飞神受制或出现

4. **空亡之爻，有而若无**
   - 空亡的爻，如同虚设，待出空方可应验
   - 旬空逢冲则实，空而不空（如戌亥空，逢辰巳冲则实）
   - 用神空亡，事难成就；忌神空亡，反为吉兆
   - 动爻化空，事将落空；静爻逢空，待时而动

5. **旺衰决定吉凶**
   - 旺相之爻有力，可成事；休囚之爻无力，难有作为
   - 死绝之爻凶险，主败；得月建日辰生扶者，虽休囚亦有气
   - 月破日破之爻，凶上加凶；旬空月破，事必落空

【用神取用原则】
测婚姻：男测以妻财为用神，女测以官鬼为用神
测求财：以妻财为用神
测功名：以官鬼为用神
测子孙：以子孙为用神
测父母：以父母为用神
测兄弟朋友：以兄弟为用神
测疾病：以官鬼为病症，子孙为医药
测出行：以世爻为自己，应爻为目的地
测官讼：以官鬼为对方，世爻为自己

【原神忌神仇神】
- **原神**：生用神者为原神，原神旺相，用神有源
- **忌神**：克用神者为忌神，忌神发动，用神受伤
- **仇神**：克制原神者为仇神，仇神发动，原神受制
- 原神发动化回头克，反不能生用神
- 忌神发动化回头克，反不能克用神

【动爻化爻要诀】
- 化进神者吉，主事态向好；化退神者凶，主力量减弱
- 化回头生者，锦上添花；化回头克者，事成反败
- 化回头冲者，主散破；化六合者，主和合
- 化空化墓者，事必落空或受阻
- 化进化退以十二长生论：长生、沐浴、冠带、临官、帝旺为进；衰、病、死、墓、绝为退

【六神含义】
- **青龙**：主喜庆、财喜、吉祥，临财爻主得财，临子孙主添丁
- **朱雀**：主文书、口舌、信息，临官鬼主官讼，临兄弟主争吵
- **勾陈**：主田土、牵连、迟滞，临财爻主土地财，临官鬼主拖延
- **螣蛇**：主虚惊、怪异、缠绕，临官鬼主虚惊，临妻财主虚财
- **白虎**：主凶伤、病症、孝服，临官鬼主疾病伤灾，临兄弟主争斗
- **玄武**：主暗昧、盗贼、酒色，临财爻主暗财或失财，临官鬼主小人

【世应关系】
- 世为自己，应为他人、对方、目的地
- 世应相生相合，事易成就；世应相冲相克，多有阻碍
- 世克应，我胜他；应克世，他胜我
- 世旺应衰，我强他弱；应旺世衰，他强我弱
- 世应比和，平起平坐，势均力敌

【卦象吉凶】
- 卦逢六合，谋事易成，婚姻和美
- 卦逢六冲，散失分离，谋事难成
- 卦得生扶拱合，百事皆吉
- 卦遇刑冲克害，诸事不利
- 进神卦主事进，退神卦主事退
- 反吟卦主反复，伏吟卦主呻吟

【断卦步骤】
第一步：确定用神（根据占问事项取用神）
第二步：查看用神旺衰（月建日辰生克、动静、空亡、旺相休囚死）
第三步：分析原神、忌神、仇神的状态和作用（发动与否，旺衰如何）
第四步：看动爻变化（化进化退、化回头生克、化空化墓）
第五步：综合世应关系（世应生克、旺衰对比）
第六步：参看六神含义（吉凶祸福之征兆）
第七步：分析卦象总体（卦名、卦德、六冲六合等）
第八步：综合判断吉凶，给出结论和建议

【重要口诀】
"有动先看动，无动看用神"
"用神旺相有气，虽遇凶而不凶；用神休囚无力，纵逢吉而不吉"
"月建乃万卜之提纲，日辰为六爻之主宰"
"卦中无用神，须寻伏神；伏神得出，事方可成"
"独发易成，乱动难就"
"动化回头生，锦上添花；动化回头克，雪上加霜"

【输出格式要求】
- 使用Markdown格式，包含标题、列表、加粗、斜体等
- 重点内容使用**加粗**标记
- 使用表情符号增加可读性（如✅❌⚠️🎯💫等）
- 语言通俗易懂，深入浅出
- 专业术语需给出解释
- 结论明确，建议具体可行

【禁止事项】
- 禁止在回答末尾添加任何免责声明或AI署名
- 禁止输出类似"以上内容由XX生成"、"仅供参考"等声明
- 直接给出专业分析内容，无需说明内容来源

请严格按照以上理论进行分析，给出专业准确的断卦结果。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );

    // 转发流式响应
    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
          } else {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    });

    response.data.on('end', () => {
      res.end();
    });

    response.data.on('error', (error: Error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: '解卦过程出错' })}\n\n`);
      res.end();
    });

  } catch (error: any) {
    console.error('AI解卦错误:', error.message);
    res.status(500).json({ error: 'AI解卦失败，请检查API配置' });
  }
};

function buildAnalysisPrompt(
  benGua: any,
  bianGua: any,
  decoration: any,
  question: string,
  gender?: string,
  bazi?: any,
  timestamp?: number
): string {
  const { lines, changes, trigrams, name } = benGua;
  const { earthBranches, sixRelatives, fiveElements, heavenlyStems, sixSpirits, shiYing } = decoration;

  // 获取干支时间
  const date = timestamp ? new Date(timestamp) : new Date();
  const lunar = Lunar.fromDate(date);
  const yearGanZhi = lunar.getYearInGanZhi();
  const monthGanZhi = lunar.getMonthInGanZhi();
  const dayGanZhi = lunar.getDayInGanZhi();
  const hourGanZhi = lunar.getTimeInGanZhi();

  let prompt = `# 六爻解卦分析\n\n`;

  // 起卦时间信息
  prompt += `## ⏰ 起卦时间\n`;
  prompt += `**干支历**: ${yearGanZhi}年 ${monthGanZhi}月 ${dayGanZhi}日 ${hourGanZhi}时\n`;
  prompt += `**公历**: ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}\n\n`;

  // 命主信息
  if (gender || bazi) {
    prompt += `## 👤 命主信息\n`;
    if (gender) {
      prompt += `**性别**: ${gender}\n`;
    }
    if (bazi) {
      prompt += `**八字**: `;
      const baziParts = [];
      if (bazi.year) baziParts.push(`${bazi.year}年`);
      if (bazi.month) baziParts.push(`${bazi.month}月`);
      if (bazi.day) baziParts.push(`${bazi.day}日`);
      if (bazi.hour) baziParts.push(`${bazi.hour}时`);
      if (baziParts.length > 0) {
        prompt += baziParts.join(' ') + '\n';
      } else {
        prompt += '未提供\n';
      }
    }
    prompt += `\n`;
  }

  prompt += `## 📋 占问事项\n${question}\n\n`;

  prompt += `## 🎴 本卦：${name}\n`;
  prompt += `**上卦**：${trigrams.upper}  **下卦**：${trigrams.lower}\n\n`;

  prompt += `### 卦象详情\n\n`;
  prompt += `| 爻位 | 阴阳 | 六神 | 纳甲 | 地支 | 五行 | 六亲 | 旺衰 | 标记 |\n`;
  prompt += `|------|------|------|------|------|------|------|------|------|\n`;

  for (let i = 5; i >= 0; i--) {
    const yaoName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i];
    const yaoType = lines[i] === 1 ? '━━' : '━  ━';
    const changeMark = changes[i] ? '○' : '';
    const shiYingMark = shiYing[0] === i ? '世' : (shiYing[1] === i ? '应' : '');
    const kongWangMark = decoration.kongWangYao.includes(i) ? '空' : '';
    const marks = [changeMark, shiYingMark, kongWangMark].filter(m => m).join(' ');

    // 旺衰状态
    const yaoState = decoration.yaoStates[i];
    let wangShuai = yaoState.state;
    if (yaoState.isKongWang) {
      wangShuai += '(空亡)';
    } else if (yaoState.isProspered && yaoState.isDayHelped) {
      wangShuai += '(月日生扶)';
    } else if (yaoState.isProspered) {
      wangShuai += '(月建生旺)';
    } else if (yaoState.isDayHelped) {
      wangShuai += '(日辰帮扶)';
    }

    prompt += `| ${yaoName} | ${yaoType} | ${sixSpirits[i]} | ${heavenlyStems[i]} | ${earthBranches[i]} | ${fiveElements[i]} | ${sixRelatives[i]} | ${wangShuai} | ${marks || '-'} |\n`;
  }
  prompt += `\n`;

  // 月建、日辰、空亡信息
  prompt += `### ⏰ 断卦要素\n\n`;
  prompt += `- **月建**：${decoration.monthConstruction}（${decoration.monthBranch}月令）\n`;
  prompt += `- **日辰**：${decoration.dayGanZhi}\n`;
  prompt += `- **空亡**：${decoration.kongWang[0]}、${decoration.kongWang[1]}空\n`;
  if (decoration.kongWangYao.length > 0) {
    const kongYaoNames = decoration.kongWangYao.map((i: number) => ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i]);
    prompt += `- **落空亡的爻**：${kongYaoNames.join('、')}\n`;
  } else {
    prompt += `- **落空亡的爻**：无\n`;
  }
  prompt += `\n`;
  prompt += `> **重要提示**：根据《增删卜易》，"月建乃万卜之提纲，日辰为六爻之主宰"。月建和日辰决定了爻位的旺衰，这是断卦的根本依据。空亡之爻，有而若无，待出空方可应验。\n\n`;

  // 动爻化爻分析
  if (decoration.changeAnalyses && decoration.changeAnalyses.length > 0) {
    prompt += `### ⚡ 动爻化爻分析\n\n`;
    decoration.changeAnalyses.forEach((analysis: any) => {
      const yaoName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][analysis.position];
      const goodBadMark = analysis.isGood ? '✅ 吉' : '⚠️ 需注意';
      prompt += `**${yaoName}动**（${analysis.changeType}）${goodBadMark}\n`;
      prompt += `- ${analysis.description}\n\n`;
    });
    prompt += `> **化爻要义**：化进神者吉，主事态向好；化退神者凶，主力量减弱。化回头生者，锦上添花；化回头克者，事成反败。\n\n`;
  } else {
    prompt += `### ⚡ 动爻情况\n\n`;
    prompt += `本卦无动爻，为静卦，事态稳定，不易变化。\n\n`;
  }

  // 爻位关系分析（六合六冲三合）
  if (decoration.yaoRelations && decoration.yaoRelations.length > 0) {
    prompt += `### 🔗 爻位关系分析\n\n`;
    const liuHeRelations = decoration.yaoRelations.filter((r: any) => r.type === '六合');
    const liuChongRelations = decoration.yaoRelations.filter((r: any) => r.type === '六冲');
    const sanHeRelations = decoration.yaoRelations.filter((r: any) => r.type === '三合');

    if (liuHeRelations.length > 0) {
      prompt += `**六合关系** ✅\n`;
      liuHeRelations.forEach((rel: any) => {
        prompt += `- ${rel.description}\n`;
        prompt += `  - ${rel.effect}\n`;
      });
      prompt += `\n`;
    }

    if (liuChongRelations.length > 0) {
      prompt += `**六冲关系** ⚠️\n`;
      liuChongRelations.forEach((rel: any) => {
        prompt += `- ${rel.description}\n`;
        prompt += `  - ${rel.effect}\n`;
      });
      prompt += `\n`;
    }

    if (sanHeRelations.length > 0) {
      prompt += `**三合成局** 💫\n`;
      sanHeRelations.forEach((rel: any) => {
        prompt += `- ${rel.description}\n`;
        prompt += `  - ${rel.effect}\n`;
      });
      prompt += `\n`;
    }

    prompt += `> **关系要义**：六合主和合缠绵，吉；六冲主散破冲突，凶；三合成局，力量强大，吉。这些关系影响爻位之间的相互作用。\n\n`;
  }

  // 伏神分析
  if (decoration.fuShens && decoration.fuShens.length > 0) {
    prompt += `### 👻 伏神飞神分析\n\n`;
    decoration.fuShens.forEach((fuShen: any) => {
      const yaoName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][fuShen.fuPosition];
      const canComeOutMark = fuShen.canComeOut ? '✅ 可出' : '⚠️ 难出';
      prompt += `**${fuShen.sixRelative}** ${canComeOutMark}\n`;
      prompt += `- ${fuShen.description}\n`;
      prompt += `- 飞伏关系：${fuShen.relation}\n`;
      if (fuShen.relation === '飞来生伏' || fuShen.relation === '伏去克飞' || fuShen.relation === '比和') {
        prompt += `- 伏神有力，待飞神受制或伏神得日月生旺时，可以出现发挥作用\n`;
      } else {
        prompt += `- 伏神受制，难以出现，需待飞神入墓、逢空或受克时方能出现\n`;
      }
      prompt += `\n`;
    });
    prompt += `> **伏神要义**：用神不上卦时，需寻伏神。飞来生伏、伏去克飞、飞伏比和，伏神有力易出；飞来克伏、伏去生飞，伏神难出。\n\n`;
  }

  if (bianGua) {
    prompt += `## 🔄 变卦：${bianGua.name}\n`;
    prompt += `**上卦**：${bianGua.trigrams.upper}  **下卦**：${bianGua.trigrams.lower}\n\n`;
  }

  prompt += `---\n\n`;
  prompt += `## 📊 详细断卦分析\n\n`;
  prompt += `请严格按照六爻断卦理论，进行系统完整的解卦分析：\n\n`;

  // 如果有命主信息，加入特别说明
  if (gender || bazi) {
    prompt += `**特别说明**：本次占卜包含命主信息，请结合命主的性别`;
    if (bazi) {
      prompt += `和八字命理`;
    }
    prompt += `进行更精准的分析。\n\n`;
  }

  prompt += `### 1. 🎯 卦象总体解读\n`;
  prompt += `- 分析本卦的整体含义和象征（卦名、卦辞、卦德）\n`;
  prompt += `- 说明卦象在当前占问中的意义\n`;
  prompt += `- 判断卦象是否为六冲卦、六合卦、游魂卦、归魂卦等特殊卦象\n`;
  if (gender || bazi) {
    prompt += `- 结合命主信息，说明对命主的特殊影响\n`;
  }
  prompt += `\n`;

  prompt += `### 2. 🎪 用神分析（核心重点）\n`;
  prompt += `- **确定用神**：根据占问事项明确指出用神是哪一爻\n`;
  if (gender) {
    prompt += `- **性别因素**：命主为${gender}，说明用神取用的特殊性\n`;
  }
  prompt += `- **用神旺衰**：\n`;
  prompt += `  - 月建对用神的影响（旺/相/休/囚/死）\n`;
  prompt += `  - 日辰对用神的影响（生扶/克制/比和）\n`;
  prompt += `  - 用神是否发动\n`;
  prompt += `  - 用神是否空亡（如空亡，何时出空）\n`;
  prompt += `  - 用神是否得其他爻生扶\n`;
  prompt += `- **原神分析**：指出原神是哪一爻，原神的旺衰状态，是否发动\n`;
  prompt += `- **忌神分析**：指出忌神是哪一爻，忌神的旺衰状态，是否发动\n`;
  prompt += `- **仇神分析**（如有）：指出仇神是哪一爻，仇神的作用\n`;
  prompt += `- **用神综合判断**：根据用神、原神、忌神的综合状态，做出吉凶初判\n\n`;

  prompt += `### 3. ⚡ 动爻及化爻影响\n`;
  if (decoration.changeAnalyses && decoration.changeAnalyses.length > 0) {
    prompt += `- **动爻分析**：\n`;
    prompt += `  - 指出哪些爻发动，发动的爻是什么六亲\n`;
    prompt += `  - 分析动爻对用神的影响（生扶、克制、合、冲）\n`;
    prompt += `  - 动爻是否为用神、原神、忌神\n`;
    prompt += `- **化爻分析**：\n`;
    prompt += `  - 详细分析每个动爻的变化（化进、化退、化回头生、化回头克等）\n`;
    prompt += `  - 化爻对原爻的影响（增强、减弱、反制）\n`;
    prompt += `  - 化爻对用神的最终影响\n`;
    prompt += `- **变卦趋势**：分析变卦后的整体趋势，事态如何发展\n\n`;
  } else {
    prompt += `- 本卦无动爻，为静卦\n`;
    prompt += `- 分析静卦的特点：事态稳定，不易变化，以现状论断\n`;
    prompt += `- 静卦重点看用神旺衰和月日生克\n\n`;
  }

  prompt += `### 4. ⚖️ 世应关系分析\n`;
  prompt += `- 指出世爻和应爻的位置及六亲属性\n`;
  prompt += `- 分析世应的旺衰对比（谁强谁弱）\n`;
  prompt += `- 分析世应的生克关系（相生、相克、相冲、相合、比和）\n`;
  prompt += `- 根据占问事项，说明世应关系的具体含义\n`;
  prompt += `- 世应关系对事情成败的影响\n\n`;

  prompt += `### 5. 🐉 六神象义参考\n`;
  prompt += `- 分析用神所临六神的象征意义\n`;
  prompt += `- 分析世爻、应爻所临六神的含义\n`;
  prompt += `- 分析动爻所临六神的吉凶暗示\n`;
  prompt += `- 六神与六亲结合，推断事情的性质和特点\n\n`;

  prompt += `### 6. 🕐 月日时空影响\n`;
  prompt += `- **月建影响**：${decoration.monthConstruction}（${decoration.monthBranch}月令），分析当令五行对卦中各爻的影响\n`;
  prompt += `- **日辰影响**：${decoration.dayGanZhi}，分析日辰对用神、原神、忌神的生克制化\n`;
  prompt += `- **起卦时间**：${yearGanZhi}年${monthGanZhi}月${dayGanZhi}日${hourGanZhi}时，分析时空背景\n`;
  if (decoration.kongWangYao.length > 0) {
    const kongYaoNames = decoration.kongWangYao.map((i: number) => ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i]);
    prompt += `- **空亡影响**：${kongYaoNames.join('、')}落空亡，分析空亡对这些爻的影响，何时出空（下一旬或逢冲）\n`;
  } else {
    prompt += `- **空亡情况**：卦中无爻落空亡\n`;
  }
  if (bazi) {
    prompt += `- **八字呼应**：结合命主八字，分析与卦象的呼应关系\n`;
  }
  prompt += `\n`;

  prompt += `### 7. 💡 综合判断与建议\n`;
  prompt += `- **吉凶判断**：给出明确的吉凶结论（成/败/吉/凶/半吉半凶等）\n`;
  prompt += `- **成功概率**：根据用神旺衰和卦象综合，给出事情成功的可能性\n`;
  prompt += `- **应期推断**（如适用）：推测事情可能应验的时间（年月日）\n`;
  prompt += `- **具体建议**：\n`;
  prompt += `  - 针对当前卦象，给出趋吉避凶的建议\n`;
  prompt += `  - 提供具体可行的行动方案\n`;
  if (gender) {
    prompt += `  - 针对${gender}性命主的特别建议\n`;
  }
  prompt += `  - 需要注意的时间节点或事项\n`;
  prompt += `- **总结陈词**：用一段话总结整个断卦结果\n\n`;

  prompt += `---\n\n`;
  prompt += `**分析要求**：\n`;
  prompt += `1. 必须明确指出用神是哪一爻，不能模糊其词\n`;
  prompt += `2. 用神分析要详细具体，包含旺衰、月日生克、空亡、发动等所有要素\n`;
  prompt += `3. 原神、忌神必须明确指出，并分析其状态和作用\n`;
  prompt += `4. 动爻化爻的分析要结合十二长生和五行生克，不能泛泛而谈\n`;
  prompt += `5. 结论必须明确，建议必须具体可行\n`;
  prompt += `6. 使用Markdown格式，重点内容**加粗**，适当使用表情符号（✅❌⚠️🎯💫⭐📌等）\n`;
  prompt += `7. 语言通俗易懂，专业术语给出解释\n`;
  if (gender || bazi) {
    prompt += `8. **重要**：务必充分考虑命主的性别${bazi ? '和八字信息' : ''}，给出更有针对性的分析\n`;
  }
  prompt += `\n`;
  prompt += `请现在开始详细的断卦分析：\n`;

  return prompt;
}
