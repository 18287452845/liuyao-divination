import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { divinationApi } from '../utils/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import type { DivinationMethod, Gender, BaZi } from '../types';

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

const DivinationPage: React.FC = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<DivinationMethod>('time');
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

        data = {
          num1: parseInt(num1, 10),
          num2: parseInt(num2, 10),
          num3: parseInt(num3, 10),
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
    if (yaoResults.length >= 6) {
      toast.info('已完成六次摇卦');
      return;
    }

    setShaking(true);

    setTimeout(async () => {
      try {
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
    }, 500);
  };

  const resetManual = () => {
    setYaoResults([]);
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">六爻起卦</h1>

        <div className="card mb-6">
          <label className="block text-lg font-semibold mb-2 text-gray-700">占问事项</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请输入您想占问的事情，例如：这次合作是否顺利？"
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
            rows={3}
          />
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">命主信息（可选）</h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-600">性别</label>
            <div className="flex gap-4">
              {(['男', '女', '未知'] as Gender[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setGender(item)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    gender === item
                      ? item === '男'
                        ? 'bg-blue-500 text-white'
                        : item === '女'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showBazi}
                onChange={(e) => setShowBazi(e.target.checked)}
                className="w-5 h-5 text-primary focus:ring-primary rounded"
              />
              <span className="ml-2 text-sm font-semibold text-gray-700">填写命主八字（可提高分析准确度）</span>
            </label>
          </div>

          {showBazi && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">年柱</label>
                <input
                  type="text"
                  value={bazi.year}
                  onChange={(e) => setBazi({ ...bazi, year: e.target.value })}
                  placeholder="如：辛未"
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
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
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
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
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
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
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
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
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">选择起卦方式</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(['time', 'number', 'manual', 'input'] as DivinationMethod[]).map((item) => (
              <button
                key={item}
                onClick={() => setMethod(item)}
                className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                  method === item ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {methodDescriptions[item].title}
              </button>
            ))}
          </div>

          <div className="mb-4 text-gray-600">
            <p>{methodDescriptions[method].description}</p>
          </div>

          {method === 'time' && (
            <p className="text-sm text-gray-500">直接点击下方“开始起卦”即可，系统会使用当前时间自动排盘。</p>
          )}

          {method === 'number' && (
            <div>
              <p className="text-gray-600 mb-4">请输入三个正整数：</p>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  value={num1}
                  onChange={(e) => setNum1(e.target.value)}
                  placeholder="第一个数字"
                  className="p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  min="1"
                />
                <input
                  type="number"
                  value={num2}
                  onChange={(e) => setNum2(e.target.value)}
                  placeholder="第二个数字"
                  className="p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  min="1"
                />
                <input
                  type="number"
                  value={num3}
                  onChange={(e) => setNum3(e.target.value)}
                  placeholder="第三个数字"
                  className="p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  min="1"
                />
              </div>
            </div>
          )}

          {method === 'manual' && (
            <div>
              <p className="text-gray-600 mb-4">请依次完成六次摇卦，系统会从下往上记录每一爻。</p>
              <div className="mb-4">
                <button
                  onClick={handleShake}
                  disabled={shaking || yaoResults.length >= 6}
                  className={`btn-primary ${shaking || yaoResults.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {shaking ? '摇卦中...' : `第 ${yaoResults.length + 1} 次摇卦`}
                </button>
                {yaoResults.length > 0 && (
                  <button onClick={resetManual} className="ml-4 btn-secondary">
                    重新摇卦
                  </button>
                )}
              </div>

              {yaoResults.length > 0 && (
                <div className="space-y-2">
                  {yaoResults.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                      <span className="font-semibold">{yaoPositionNames[index]}：</span>
                      <span className="text-primary">{yaoNameMap[result]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {method === 'input' && (
            <div>
              <p className="text-gray-600 mb-4">请从下往上设置每一爻的阴阳与是否为动爻。</p>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1, 0].map((index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
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
                          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
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
                          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
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
              <div className="mt-4 p-4 bg-amber-50 border-l-4 border-accent rounded-r text-sm text-gray-600">
                从下往上依次为初爻、二爻、三爻、四爻、五爻、上爻。勾选“动爻”表示该爻会变成相反的阴阳爻。
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`btn-primary text-xl px-12 py-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? '起卦中...' : '开始起卦'}
          </button>
        </div>
      </div>
    </>
  );
};

export default DivinationPage;
