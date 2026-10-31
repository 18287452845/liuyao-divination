import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { divinationApi } from '../utils/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import type { DivinationMethod, DivinationCategory, Gender, BaZi } from '../types';

const methodDescriptions: Record<DivinationMethod, { title: string; description: string }> = {
  time: {
    title: '时间起卦',
    description: '使用当前时间自动起卦，适合快速占问。',
  },
  number: {
    title: '数字起卦',
    description: '输入三个整数，根据数字组合生成卦象。',
  },
  manual: {
    title: '手动摇卦',
    description: '模拟投币摇卦，需要完成六次摇卦。',
  },
  input: {
    title: '手动输入',
    description: '适合已经知道卦象时，直接录入阴阳爻与动爻。',
  },
};

const yaoNameMap: Record<number, string> = {
  6: '老阴（动爻）',
  7: '少阳',
  8: '少阴',
  9: '老阳（动爻）',
};

const yaoPositionNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

const categoryOptions: Array<{ value: DivinationCategory; label: string; description: string }> = [
  { value: 'general', label: '泛问吉凶', description: '以世爻为主，兼看动爻与卦体。' },
  { value: 'wealth', label: '求财财运', description: '以妻财为用神，兼看子孙财源与兄弟劫财。' },
  { value: 'career', label: '事业功名', description: '以官鬼为用神，兼看父母文书。' },
  { value: 'relationship', label: '感情婚姻', description: '男占多取妻财，女占多取官鬼。' },
  { value: 'health', label: '疾病健康', description: '以官鬼为病症，子孙为医药解神。' },
  { value: 'exam', label: '考试文书', description: '以父母为用神，兼看官鬼名位。' },
  { value: 'lawsuit', label: '诉讼是非', description: '以官鬼为压力，世应分主客。' },
  { value: 'lost', label: '失物寻物', description: '以妻财为物，重点看伏神与应期。' },
  { value: 'travel', label: '出行行人', description: '以世应、动爻和归期为重点。' },
  { value: 'cooperation', label: '合作交易', description: '以世应关系为主，财爻看利益。' },
];

const DivinationPage: React.FC = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<DivinationMethod>('time');
  const [category, setCategory] = useState<DivinationCategory>('general');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [gender, setGender] = useState<Gender>('未知');
  const [showBazi, setShowBazi] = useState(false);
  const [bazi, setBazi] = useState<BaZi>({
    year: '',
    month: '',
    day: '',
    hour: '',
  });

  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [num3, setNum3] = useState('');

  const [yaoResults, setYaoResults] = useState<number[]>([]);
  const [shaking, setShaking] = useState(false);

  const [inputLines, setInputLines] = useState<(0 | 1)[]>([1, 1, 1, 1, 1, 1]);
  const [inputChanges, setInputChanges] = useState<boolean[]>([false, false, false, false, false, false]);

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.warning('请输入占问事项');
      return;
    }

    setLoading(true);

    try {
      let data: any = {};

      if (method === 'number') {
        if (!num1 || !num2 || !num3) {
          toast.warning('请输入三个数字');
          setLoading(false);
          return;
        }

        const numbers = [num1, num2, num3].map(Number);
        if (numbers.some(value => !Number.isSafeInteger(value) || value <= 0)) {
          toast.warning('请输入三个正整数');
          setLoading(false);
          return;
        }

        data = {
          num1: numbers[0],
          num2: numbers[1],
          num3: numbers[2],
        };
      } else if (method === 'manual') {
        if (yaoResults.length !== 6) {
          toast.warning('请完成六次摇卦');
          setLoading(false);
          return;
        }

        data = { yaoResults };
      } else if (method === 'input') {
        data = {
          lines: inputLines,
          changes: inputChanges,
        };
      }

      const result = await divinationApi.createDivination({
        method,
        category,
        question,
        gender,
        bazi: showBazi && (bazi.year || bazi.month || bazi.day || bazi.hour) ? bazi : undefined,
        data,
      });

      toast.success('起卦成功');

      setTimeout(() => {
        navigate(`/paidian/${result.id}`);
      }, 500);
    } catch (error) {
      console.error('起卦失败:', error);
      toast.error('起卦失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleShake = async () => {
    if (shaking) return;

    if (yaoResults.length >= 6) {
      toast.info('已完成六次摇卦');
      return;
    }

    setShaking(true);
    try {
      const animationTime = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 900;
      await new Promise(resolve => window.setTimeout(resolve, animationTime));
      const result = await divinationApi.simulateShake();
      const nextResults = [...yaoResults, result.result];
      setYaoResults(nextResults);
      toast.success(`第 ${nextResults.length} 爻：${yaoNameMap[result.result]}`);
    } catch (error) {
      console.error('摇卦失败:', error);
      toast.error('摇卦失败，请稍后重试');
    } finally {
      setShaking(false);
    }
  };

  const resetManual = () => {
    setYaoResults([]);
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <div className="divination-page mx-auto max-w-6xl">
        <header className="divination-header">
          <div>
            <p className="divination-eyebrow">LIUYAO · 六爻占问</p>
            <h1>起一卦，明一事</h1>
            <p className="divination-subtitle">静心写下所问，选择适合的方式开始排卦。</p>
          </div>
          <div className="divination-steps" aria-label="起卦流程">
            <span className="is-current"><b>01</b> 占问</span>
            <i aria-hidden="true" />
            <span><b>02</b> 起卦</span>
            <i aria-hidden="true" />
            <span><b>03</b> 排盘</span>
          </div>
        </header>

        <section className="divination-panel mb-5">
          <div className="divination-section-heading">
            <div>
              <span className="divination-section-index">01</span>
              <label htmlFor="divination-question">占问事项</label>
            </div>
            <span>一次一事，问题越清晰越好</span>
          </div>
          <textarea
            id="divination-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请输入您想占问的事情，例如：这次合作是否顺利？"
            className="divination-textarea"
            rows={2}
          />
        </section>

        <section className="divination-panel mb-5">
          <div className="divination-section-heading">
            <div>
              <span className="divination-section-index">02</span>
              <h2>占事类别</h2>
            </div>
            <span>已选：{categoryOptions.find(item => item.value === category)?.label}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {categoryOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                aria-pressed={category === item.value}
                className={`divination-category${category === item.value ? ' is-selected' : ''}`}
              >
                <span className="block font-semibold">{item.label}</span>
                <span className="block text-xs text-gray-500 mt-1">{item.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="divination-panel mb-5">
          <div className="divination-section-heading">
            <div>
              <span className="divination-section-index">03</span>
              <h2>命主信息</h2>
              <span className="divination-optional">选填</span>
            </div>
            <span>完善信息可供分析参考</span>
          </div>

          <div className="divination-gender-row">
            <label className="text-sm font-semibold text-gray-600">性别</label>
            <div className="divination-segmented">
              {(['男', '女', '未知'] as Gender[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGender(item)}
                  aria-pressed={gender === item}
                  className={gender === item ? 'is-selected' : ''}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showBazi}
                onChange={(e) => setShowBazi(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary rounded"
              />
              <span className="ml-2 text-sm font-semibold text-gray-700">补充命主八字</span>
              <span className="ml-2 text-xs text-gray-400">非必填</span>
            </label>
          </div>

          {showBazi && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">年柱</label>
                <input
                  type="text"
                  value={bazi.year}
                  onChange={(e) => setBazi({ ...bazi, year: e.target.value })}
                  placeholder="如：辛未"
                  className="divination-input text-sm"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">月柱</label>
                <input
                  type="text"
                  value={bazi.month}
                  onChange={(e) => setBazi({ ...bazi, month: e.target.value })}
                  placeholder="如：庚寅"
                  className="divination-input text-sm"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">日柱</label>
                <input
                  type="text"
                  value={bazi.day}
                  onChange={(e) => setBazi({ ...bazi, day: e.target.value })}
                  placeholder="如：己亥"
                  className="divination-input text-sm"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">时柱</label>
                <input
                  type="text"
                  value={bazi.hour}
                  onChange={(e) => setBazi({ ...bazi, hour: e.target.value })}
                  placeholder="如：戊辰"
                  className="divination-input text-sm"
                  maxLength={4}
                />
              </div>
              <div className="col-span-2 md:col-span-4">
                <p className="text-xs text-gray-500">
                  提示：八字由天干地支组成，例如“辛未年 庚寅月 己亥日 戊辰时”。如果不确定，可留空，系统仍会根据起卦时间进行分析。
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="divination-panel mb-5">
          <div className="divination-section-heading">
            <div>
              <span className="divination-section-index">04</span>
              <h2>起卦方式</h2>
            </div>
          </div>
          <div className="divination-method-tabs">
            {(['time', 'number', 'manual', 'input'] as DivinationMethod[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMethod(item)}
                aria-pressed={method === item}
                className={method === item ? 'is-selected' : ''}
              >
                {methodDescriptions[item].title}
              </button>
            ))}
          </div>

          <p className="divination-method-description">{methodDescriptions[method].description}</p>

          {method === 'time' && (
            <p className="method-hint">系统将按当前时间自动排盘。</p>
          )}

          {method === 'number' && (
            <div>
              <p className="method-hint mb-3">请输入三个正整数</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  value={num1}
                  onChange={(e) => setNum1(e.target.value)}
                  placeholder="上卦数"
                  className="divination-input"
                  min="1"
                />
                <input
                  type="number"
                  value={num2}
                  onChange={(e) => setNum2(e.target.value)}
                  placeholder="下卦数"
                  className="divination-input"
                  min="1"
                />
                <input
                  type="number"
                  value={num3}
                  onChange={(e) => setNum3(e.target.value)}
                  placeholder="动爻数"
                  className="divination-input"
                  min="1"
                />
              </div>
            </div>
          )}

          {method === 'manual' && (
            <div className="manual-casting">
              <div className="manual-casting__controls">
                <div className={`coin-stage${shaking ? ' is-tossing' : ''}`} aria-hidden="true">
                  <span className="casting-coin">易</span>
                  <span className="casting-coin">阴</span>
                  <span className="casting-coin">阳</span>
                </div>
                <p className="manual-casting__count" aria-live="polite">
                  已成 <strong>{yaoResults.length}</strong> / 6 爻
                </p>
                <p className="manual-casting__hint">从初爻开始，自下而上成卦</p>
                <button
                  type="button"
                  onClick={handleShake}
                  disabled={shaking || yaoResults.length >= 6}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shaking ? '铜钱起落中…' : yaoResults.length >= 6 ? '六爻已成' : `摇第 ${yaoResults.length + 1} 爻`}
                </button>
                {yaoResults.length > 0 && (
                  <button type="button" onClick={resetManual} disabled={shaking} className="manual-reset" title="清空已摇爻位">
                    重新开始
                  </button>
                )}
              </div>

              <div className="gua-preview" aria-label="六爻生成预览">
                {[5, 4, 3, 2, 1, 0].map((index) => {
                  const result = yaoResults[index];
                  const isNext = index === yaoResults.length && yaoResults.length < 6;
                  const isYin = result === 6 || result === 8;

                  return (
                    <div key={index} className={`gua-preview__row${isNext ? ' is-next' : ''}`}>
                      <span className="gua-preview__position">{yaoPositionNames[index]}</span>
                      <span className={`gua-preview__line${result === undefined ? ' is-empty' : isYin ? ' is-yin' : ' is-yang'}`} aria-hidden="true">
                        <i />
                        {isYin && <i />}
                      </span>
                      <span className="gua-preview__result">
                        {result === undefined ? (isNext ? (shaking ? '铜钱起落' : '待摇') : '待生成') : yaoNameMap[result]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {method === 'input' && (
            <div>
              <p className="method-hint mb-4">请从下往上设置每一爻的阴阳与是否为动爻。</p>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1, 0].map((index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="font-semibold text-gray-700 w-16">{yaoPositionNames[index]}</span>
                    <div className="flex-1 flex gap-4 flex-wrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newLines = [...inputLines];
                            newLines[index] = 1;
                            setInputLines(newLines as (0 | 1)[]);
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            inputLines[index] === 1
                              ? 'bg-primary text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          阳爻 ━━━
                        </button>
                        <button
                          onClick={() => {
                            const newLines = [...inputLines];
                            newLines[index] = 0;
                            setInputLines(newLines as (0 | 1)[]);
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            inputLines[index] === 0
                              ? 'bg-secondary text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          阴爻 ━ ━
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inputChanges[index]}
                            onChange={(e) => {
                              const newChanges = [...inputChanges];
                              newChanges[index] = e.target.checked;
                              setInputChanges(newChanges);
                            }}
                            className="w-5 h-5 text-primary focus:ring-primary rounded"
                          />
                          <span className="ml-2 text-gray-700 font-medium">动爻</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-emerald-50 border-l-4 border-secondary rounded-r text-sm text-gray-600">
                从下往上依次为初爻、二爻、三爻、四爻、五爻、上爻。勾选“动爻”表示该爻会变成相反的阴阳爻。
              </div>
            </div>
          )}
        </section>

        <div className="divination-submit">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (method === 'manual' && shaking)}
            className="btn-primary text-lg px-10 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '起卦中...' : '开始起卦'}
          </button>
        </div>
      </div>
    </>
  );
};

export default DivinationPage;
