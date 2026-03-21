import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import api from '../utils/api';
import { normalizeLegacyData } from '../utils/textNormalize';

type TabType = 'calendar' | 'branch' | 'yongshen' | 'gua';

const ToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const toast = useToast();

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">六爻辅助工具</h1>

        {/* 标签切换 */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 px-8 rounded-lg font-semibold transition-all shadow-md ${
              activeTab === 'calendar'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📅 万年历
          </button>
          <button
            onClick={() => setActiveTab('branch')}
            className={`py-3 px-8 rounded-lg font-semibold transition-all shadow-md ${
              activeTab === 'branch'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔍 地支查询
          </button>
          <button
            onClick={() => setActiveTab('yongshen')}
            className={`py-3 px-8 rounded-lg font-semibold transition-all shadow-md ${
              activeTab === 'yongshen'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🎯 用神速查
          </button>
          <button
            onClick={() => setActiveTab('gua')}
            className={`py-3 px-8 rounded-lg font-semibold transition-all shadow-md ${
              activeTab === 'gua'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📖 卦象速查
          </button>
        </div>

        {/* 工具内容 */}
        <div className="card">
          {activeTab === 'calendar' && <CalendarTool toast={toast} />}
          {activeTab === 'branch' && <BranchTool toast={toast} />}
          {activeTab === 'yongshen' && <YongShenTool toast={toast} />}
          {activeTab === 'gua' && <GuaTool toast={toast} />}
        </div>
      </div>
    </>
  );
};

// 万年历工具
const CalendarTool: React.FC<{ toast: any }> = ({ toast }) => {
  const today = new Date();
  const [date, setDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate()
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tools/calendar/solar-to-lunar', {
        params: date
      });
      setResult(normalizeLegacyData(response.data));
    } catch (error) {
      console.error('查询失败:', error);
      toast.error('查询失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">万年历查询</h2>
      <p className="text-gray-600">查询公历日期对应的农历、干支、节气、空亡等信息</p>

      {/* 日期输入 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">年</label>
          <input
            type="number"
            value={date.year}
            onChange={(e) => setDate({ ...date, year: parseInt(e.target.value) })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">月</label>
          <input
            type="number"
            value={date.month}
            min="1"
            max="12"
            onChange={(e) => setDate({ ...date, month: parseInt(e.target.value) })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">日</label>
          <input
            type="number"
            value={date.day}
            min="1"
            max="31"
            onChange={(e) => setDate({ ...date, day: parseInt(e.target.value) })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleQuery}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? '查询中...' : '查询'}
      </button>

      {/* 查询结果 */}
      {result && (
        <div className="space-y-4 mt-6">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800">查询结果</h3>

            {/* 公历信息 */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">公历：</h4>
              <p className="text-lg">
                {result.solar.year}年{result.solar.month}月{result.solar.day}日
                （星期{result.solar.weekDay}）
              </p>
            </div>

            {/* 农历信息 */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">农历：</h4>
              <p className="text-lg">
                {result.lunar.yearGanZhi}年（{result.lunar.yearZodiac}年）
                {result.lunar.monthName} {result.lunar.dayName}
              </p>
            </div>

            {/* 干支 */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">干支：</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">年柱</p>
                  <p className="text-lg font-bold text-primary">{result.lunar.yearGanZhi}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">月柱</p>
                  <p className="text-lg font-bold text-primary">{result.lunar.monthGanZhi}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">日柱</p>
                  <p className="text-lg font-bold text-primary">{result.lunar.dayGanZhi}</p>
                </div>
              </div>
            </div>

            {/* 节气 */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">节气：</h4>
              <div className="space-y-2">
                <p>
                  当前节气：<span className="font-bold text-accent">{result.jieQi.current}</span>
                </p>
                {result.jieQi.nextJie && result.jieQi.nextJie !== '无' && (
                  <p>
                    下一个节：<span className="font-bold text-green-600">{result.jieQi.nextJie}</span>
                    <span className="ml-2 text-sm text-gray-600">({result.jieQi.nextJieDate})</span>
                  </p>
                )}
                {result.jieQi.nextQi && result.jieQi.nextQi !== '无' && (
                  <p>
                    下一个气：<span className="font-bold text-blue-600">{result.jieQi.nextQi}</span>
                    <span className="ml-2 text-sm text-gray-600">({result.jieQi.nextQiDate})</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  💡 二十四节气分为十二节和十二气
                </p>
              </div>
            </div>

            {/* 空亡 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">空亡：</h4>
              <p className="text-lg">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded">
                  {result.kongWang.description}
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                （空亡的地支：{result.kongWang.branches.join('、')}）
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 地支查询工具
const BranchTool: React.FC<{ toast: any }> = ({ toast }) => {
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const [selectedBranch, setSelectedBranch] = useState('子');
  const [result, setResult] = useState<any>(null);

  const handleQuery = async (branch: string) => {
    setSelectedBranch(branch);
    try {
      const response = await api.get('/tools/branch/relations', {
        params: { branch }
      });
      setResult(normalizeLegacyData(response.data));
    } catch (error) {
      console.error('查询失败:', error);
      toast.error('查询失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">地支关系查询</h2>
      <p className="text-gray-600">查询十二地支的五行、六合、六冲、三合关系</p>

      {/* 地支选择 */}
      <div className="grid grid-cols-6 gap-3">
        {branches.map((branch) => (
          <button
            key={branch}
            onClick={() => handleQuery(branch)}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              selectedBranch === branch
                ? 'bg-primary text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {branch}
          </button>
        ))}
      </div>

      {/* 查询结果 */}
      {result && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg space-y-4">
          <h3 className="text-2xl font-bold text-center text-primary mb-6">{result.branch}</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">五行属性</h4>
              <p className="text-xl font-bold text-accent">{result.element}</p>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">基本信息</h4>
              <p className="text-sm text-gray-600">{result.description}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">六合</h4>
              {result.he ? (
                <p className="text-xl font-bold text-green-600">{result.branch} 与 {result.he} 合</p>
              ) : (
                <p className="text-gray-400">无</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">六冲</h4>
              {result.chong ? (
                <p className="text-xl font-bold text-red-600">{result.branch} 与 {result.chong} 冲</p>
              ) : (
                <p className="text-gray-400">无</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">三合局</h4>
              {result.sanhe ? (
                <>
                  <p className="text-lg font-bold text-blue-600">{result.sanhe.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.sanhe.branches.join(' + ')}
                  </p>
                </>
              ) : (
                <p className="text-gray-400">无</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 用神速查工具
const YongShenTool: React.FC<{ toast: any }> = ({ toast }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [result, setResult] = useState<any>(null);

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/tools/yongshen/categories');
      setCategories(normalizeLegacyData(response.data));
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const handleQuery = async (category: string) => {
    setSelectedCategory(category);
    try {
      const response = await api.get('/tools/yongshen/helper', {
        params: { category }
      });
      setResult(normalizeLegacyData(response.data));
    } catch (error) {
      console.error('查询失败:', error);
      toast.error('查询失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">用神速查</h2>
      <p className="text-gray-600">根据占问类型快速查询用神、原神、忌神、仇神</p>

      {/* 类型选择 */}
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleQuery(cat.id)}
            className={`py-4 px-4 rounded-lg font-semibold transition-all flex flex-col items-center gap-2 ${
              selectedCategory === cat.id
                ? 'bg-primary text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 查询结果 */}
      {result && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg space-y-4">
          <h3 className="text-xl font-bold text-center text-gray-800 mb-4">
            {selectedCategory} - 用神配置
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-semibold text-gray-700 mb-2">用神（最重要）</h4>
              <p className="text-2xl font-bold text-green-600">{result.yongShen}</p>
              <p className="text-sm text-gray-600 mt-1">主事之神，宜旺相有力</p>
            </div>

            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-700 mb-2">原神（帮助）</h4>
              <p className="text-2xl font-bold text-blue-600">{result.yuanShen}</p>
              <p className="text-sm text-gray-600 mt-1">生扶用神之神</p>
            </div>

            <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
              <h4 className="font-semibold text-gray-700 mb-2">忌神（阻碍）</h4>
              <p className="text-2xl font-bold text-red-600">{result.jiShen}</p>
              <p className="text-sm text-gray-600 mt-1">克制用神之神，宜衰弱</p>
            </div>

            <div className="bg-white p-4 rounded-lg border-l-4 border-gray-500">
              <h4 className="font-semibold text-gray-700 mb-2">仇神（间接）</h4>
              <p className="text-2xl font-bold text-gray-600">{result.chouShen}</p>
              <p className="text-sm text-gray-600 mt-1">生助忌神之神</p>
            </div>
          </div>

          <div className="bg-amber-100 p-4 rounded-lg mt-4">
            <p className="text-sm text-gray-700">
              <strong>💡 说明：</strong>{result.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// 卦象速查工具
const GuaTool: React.FC<{ toast: any }> = ({ toast }) => {
  const [guaList, setGuaList] = useState<any[]>([]);
  const [selectedGua, setSelectedGua] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // 八卦顺序（伏羲八卦次序）
  const trigrams = [
    { name: '乾', symbol: '☰', nature: '天' },
    { name: '兑', symbol: '☱', nature: '泽' },
    { name: '离', symbol: '☲', nature: '火' },
    { name: '震', symbol: '☳', nature: '雷' },
    { name: '巽', symbol: '☴', nature: '风' },
    { name: '坎', symbol: '☵', nature: '水' },
    { name: '艮', symbol: '☶', nature: '山' },
    { name: '坤', symbol: '☷', nature: '地' }
  ];

  React.useEffect(() => {
    loadGuaList();
  }, []);

  const loadGuaList = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tools/gua/list');
      setGuaList(normalizeLegacyData(response.data));
    } catch (error) {
      console.error('加载卦象列表失败:', error);
      toast.error('加载卦象列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 根据上下卦查找对应的卦
  const findGua = (upperTrigram: string, lowerTrigram: string) => {
    return guaList.find(
      (gua) => gua.upperTrigram === upperTrigram && gua.lowerTrigram === lowerTrigram
    );
  };

  const handleGuaClick = async (gua: any) => {
    if (!gua) return;
    try {
      const response = await api.get(`/tools/gua/${gua.number}`);
      setSelectedGua(normalizeLegacyData(response.data));
      setShowDetail(true);
    } catch (error) {
      console.error('加载卦象详情失败:', error);
      toast.error('加载卦象详情失败');
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedGua(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">六十四卦方圆图</h2>
      <p className="text-gray-600">横向为外卦（上卦），纵向为内卦（下卦）</p>

      {/* 64卦方阵表格 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-primary to-secondary text-white">
                <th className="border border-gray-300 p-3 text-sm font-bold">
                  外卦→<br />内卦↓
                </th>
                {trigrams.map((trigram) => (
                  <th key={trigram.name} className="border border-gray-300 p-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl">{trigram.symbol}</div>
                      <div className="text-xs">{trigram.name}</div>
                      <div className="text-xs opacity-80">{trigram.nature}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trigrams.map((lowerTrigram) => (
                <tr key={lowerTrigram.name}>
                  <th className="border border-gray-300 bg-gradient-to-r from-primary/10 to-secondary/10 p-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl">{lowerTrigram.symbol}</div>
                      <div className="text-xs font-bold">{lowerTrigram.name}</div>
                      <div className="text-xs text-gray-600">{lowerTrigram.nature}</div>
                    </div>
                  </th>
                  {trigrams.map((upperTrigram) => {
                    const gua = findGua(upperTrigram.name, lowerTrigram.name);
                    return (
                      <td
                        key={`${upperTrigram.name}-${lowerTrigram.name}`}
                        className="border border-gray-300 p-2"
                      >
                        {gua ? (
                          <button
                            onClick={() => handleGuaClick(gua)}
                            className="w-full h-full p-2 hover:bg-gradient-to-br hover:from-primary/20 hover:to-secondary/20 transition-all rounded flex flex-col items-center gap-1 min-h-[80px]"
                          >
                            <div className="text-xs text-gray-500">第{gua.number}卦</div>
                            <div className="text-lg">
                              {gua.upperSymbol}
                              <br />
                              {gua.lowerSymbol}
                            </div>
                            <div className="text-xs font-bold text-gray-800 text-center leading-tight">
                              {gua.name}
                            </div>
                          </button>
                        ) : (
                          <div className="text-center text-gray-400 text-xs">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 详情弹窗 */}
      {showDetail && selectedGua && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-primary">
                第{selectedGua.number}卦 {selectedGua.name}
              </h3>
              <button
                onClick={handleCloseDetail}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 卦象展示 */}
              <div className="flex justify-center items-center gap-8 bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                <div className="text-center">
                  <div className="text-6xl mb-2">
                    {selectedGua.upperSymbol}
                    <br />
                    {selectedGua.lowerSymbol}
                  </div>
                  <div className="text-xl font-bold">{selectedGua.name}</div>
                </div>

                <div className="text-left space-y-2">
                  <div>
                    <span className="text-gray-600">上卦：</span>
                    <span className="font-bold">{selectedGua.upperTrigram}</span>
                    <span className="text-sm text-gray-500 ml-2">({selectedGua.upperElement})</span>
                  </div>
                  <div>
                    <span className="text-gray-600">下卦：</span>
                    <span className="font-bold">{selectedGua.lowerTrigram}</span>
                    <span className="text-sm text-gray-500 ml-2">({selectedGua.lowerElement})</span>
                  </div>
                </div>
              </div>

              {/* 卦辞 */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-2">卦辞</h4>
                <p className="text-gray-700 leading-relaxed">{selectedGua.guaCi}</p>
              </div>

              {/* 爻辞 */}
              {selectedGua.yaoCi && selectedGua.yaoCi.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-3">爻辞</h4>
                  <div className="space-y-2">
                    {selectedGua.yaoCi.map((yao: string, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-3 rounded border-l-4 border-primary"
                      >
                        <p className="text-gray-700">{yao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t">
              <button
                onClick={handleCloseDetail}
                className="w-full btn-primary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsPage;
