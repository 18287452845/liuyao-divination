import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { divinationApi } from '../utils/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import type { Gender, BaZi } from '../types';

type DivinationMethod = 'time' | 'number' | 'manual' | 'input';

const DivinationPage: React.FC = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<DivinationMethod>('time');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // 命主信息
  const [gender, setGender] = useState<Gender>('未知');
  const [showBazi, setShowBazi] = useState(false);
  const [bazi, setBazi] = useState<BaZi>({
    year: '',
    month: '',
    day: '',
    hour: ''
  });

  // 数字起卦
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [num3, setNum3] = useState('');

  // 手动摇卦
  const [yaoResults, setYaoResults] = useState<number[]>([]);
  const [shaking, setShaking] = useState(false);

  // 手动输入卦象
  const [inputLines, setInputLines] = useState<(0 | 1)[]>([1, 1, 1, 1, 1, 1]); // 默认全阳
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
          num1: parseInt(num1),
          num2: parseInt(num2),
          num3: parseInt(num3)
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
          changes: inputChanges
        };
      }

      const result = await divinationApi.createDivination({
        method,
        question,
        gender,
        bazi: showBazi && (bazi.year || bazi.month || bazi.day || bazi.hour) ? bazi : undefined,
        data
      });

      toast.success('起卦成功！');

      // 跳转到排盘页面
      setTimeout(() => {
        navigate(`/paidian/${result.id}`);
      }, 500);
    } catch (error) {
      console.error('起卦失败:', error);
      toast.error('起卦失败，请重试');
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

    // 模拟摇卦动画
    setTimeout(async () => {
      try {
        const result = await divinationApi.simulateShake();
        setYaoResults([...yaoResults, result.result]);
        toast.success(`第 ${yaoResults.length + 1} 爻：${yaoNameMap[result.result]}`);
      } catch (error) {
        console.error('摇卦失败:', error);
        toast.error('摇卦失败，请重试');
      } finally {
        setShaking(false);
      }
    }, 500);
  };

  const resetManual = () => {
    setYaoResults([]);
  };

  const yaoNameMap: { [key: number]: string } = {
    6: '老阴（变）',
    7: '少阳',
    8: '少阴',
    9: '老阳（变）'
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">六爻起卦</h1>

      {/* 占问事项 */}
      <div className="card mb-6">
        <label className="block text-lg font-semibold mb-2 text-gray-700">
          占问事项
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="请输入您要占问的事项..."
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          rows={3}
        />
      </div>

      {/* 命主信息 */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">命主信息（可选）</h2>

        {/* 性别选择 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-gray-600">
            性别
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setGender('男')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                gender === '男'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              男
            </button>
            <button
              onClick={() => setGender('女')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                gender === '女'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              女
            </button>
            <button
              onClick={() => setGender('未知')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                gender === '未知'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              未知
            </button>
          </div>
        </div>

        {/* 八字输入开关 */}
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showBazi}
              onChange={(e) => setShowBazi(e.target.checked)}
              className="w-5 h-5 text-primary focus:ring-primary rounded"
            />
            <span className="ml-2 text-sm font-semibold text-gray-700">
              填写命主八字（更准确）
            </span>
          </label>
        </div>

        {/* 八字输入 */}
        {showBazi && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">
                年柱
              </label>
              <input
                type="text"
                value={bazi.year}
                onChange={(e) => setBazi({ ...bazi, year: e.target.value })}
                placeholder="如:辛未"
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
                maxLength={4}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">
                月柱
              </label>
              <input
                type="text"
                value={bazi.month}
                onChange={(e) => setBazi({ ...bazi, month: e.target.value })}
                placeholder="如:庚寅"
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
                maxLength={4}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">
                日柱
              </label>
              <input
                type="text"
                value={bazi.day}
                onChange={(e) => setBazi({ ...bazi, day: e.target.value })}
                placeholder="如:己亥"
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
                maxLength={4}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">
                时柱
              </label>
              <input
                type="text"
                value={bazi.hour}
                onChange={(e) => setBazi({ ...bazi, hour: e.target.value })}
                placeholder="如:戊辰"
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
                maxLength={4}
              />
            </div>
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs text-gray-500">
                💡 提示：八字由天干地支组成，如"辛未年 庚寅月 己亥日 戊辰时"。不清楚可留空，AI会根据起卦时间推算。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 起卦方法选择 */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">选择起卦方法</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setMethod('time')}
            className={`py-3 px-6 rounded-lg font-semibold transition-all ${
              method === 'time'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            时间起卦
          </button>
          <button
            onClick={() => setMethod('number')}
            className={`py-3 px-6 rounded-lg font-semibold transition-all ${
              method === 'number'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            数字起卦
          </button>
          <button
            onClick={() => setMethod('manual')}
            className={`py-3 px-6 rounded-lg font-semibold transition-all ${
              method === 'manual'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            手动摇卦
          </button>
          <button
            onClick={() => setMethod('input')}
            className={`py-3 px-6 rounded-lg font-semibold transition-all ${
              method === 'input'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            手动输入
          </button>
        </div>

        {/* 时间起卦说明 */}
        {method === 'time' && (
          <div className="text-gray-600">
            <p>使用当前时间（农历年月日时）自动起卦。</p>
            <p className="mt-2 text-sm">直接点击"开始起卦"即可。</p>
          </div>
        )}

        {/* 数字起卦输入 */}
        {method === 'number' && (
          <div>
            <p className="text-gray-600 mb-4">请输入三个正整数（可以是任意数字）：</p>
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

        {/* 手动摇卦 */}
        {method === 'manual' && (
          <div>
            <p className="text-gray-600 mb-4">
              模拟摇卦：需要进行六次摇卦（从下往上）
            </p>
            <div className="mb-4">
              <button
                onClick={handleShake}
                disabled={shaking || yaoResults.length >= 6}
                className={`btn-primary ${
                  shaking || yaoResults.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {shaking ? '摇卦中...' : `第 ${yaoResults.length + 1} 次摇卦`}
              </button>
              {yaoResults.length > 0 && (
                <button
                  onClick={resetManual}
                  className="ml-4 btn-secondary"
                >
                  重新摇卦
                </button>
              )}
            </div>

            {/* 显示摇卦结果 */}
            {yaoResults.length > 0 && (
              <div className="space-y-2">
                {yaoResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-semibold">第 {index + 1} 爻：</span>
                    <span className="text-primary">{yaoNameMap[result]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 手动输入卦象 */}
        {method === 'input' && (
          <div>
            <p className="text-gray-600 mb-4">
              手动输入卦象：从下往上依次输入每一爻的阴阳和是否为动爻
            </p>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1, 0].map((index) => {
                const yaoNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                  >
                    <span className="font-semibold text-gray-700 w-16">
                      {yaoNames[index]}:
                    </span>
                    <div className="flex-1 flex gap-4">
                      {/* 阴阳选择 */}
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
                          阳爻 —
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
                          阴爻 - -
                        </button>
                      </div>
                      {/* 动爻选择 */}
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
                          <span className="ml-2 text-gray-700 font-medium">
                            动爻 ○
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-amber-50 border-l-4 border-accent rounded-r">
              <p className="text-sm text-gray-600">
                <strong>说明：</strong>从下往上依次为初爻、二爻、三爻、四爻、五爻、上爻。
                阳爻用一条长线表示(—)，阴爻用两条短线表示(- -)。
                勾选"动爻"表示该爻为老阴或老阳，会变化成相反的爻。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 开始起卦按钮 */}
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`btn-primary text-xl px-12 py-4 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? '起卦中...' : '开始起卦'}
        </button>
      </div>
    </div>
    </>
  );
};

export default DivinationPage;
