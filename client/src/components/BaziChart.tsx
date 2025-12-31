import React from 'react';
import type { BaZi, ShiShenAnalysis, WuXingAnalysis, WUXING_COLORS, SHISHEN_COLORS } from '../types/bazi';

interface BaziChartProps {
  bazi: BaZi;
  shiShen: ShiShenAnalysis;
  wuXing: WuXingAnalysis;
  showDetails?: boolean;
}

/**
 * 八字四柱展示组件
 *
 * 以传统的竖排形式展示四柱八字，包括天干、地支、十神、五行等信息
 */
const BaziChart: React.FC<BaziChartProps> = ({
  bazi,
  shiShen,
  wuXing,
  showDetails = true
}) => {
  const WUXING_COLORS: Record<string, string> = {
    '木': '#10b981',
    '火': '#ef4444',
    '土': '#f59e0b',
    '金': '#fbbf24',
    '水': '#3b82f6'
  };

  const SHISHEN_COLORS: Record<string, string> = {
    '比肩': '#8b5cf6',
    '劫财': '#a855f7',
    '食神': '#10b981',
    '伤官': '#14b8a6',
    '偏财': '#f59e0b',
    '正财': '#eab308',
    '七杀': '#ef4444',
    '正官': '#dc2626',
    '偏印': '#6366f1',
    '正印': '#4f46e5'
  };

  // 渲染单柱
  const renderPillar = (
    pillarName: string,
    pillar: any,
    shiShenData: any,
    isRiZhu: boolean = false
  ) => {
    return (
      <div
        className={`flex flex-col items-center min-w-[120px] p-4 bg-white rounded-xl shadow-md border-2 ${
          isRiZhu ? 'border-red-400 bg-red-50' : 'border-gray-200'
        }`}
      >
        {/* 柱名 */}
        <div className="text-sm font-bold text-gray-600 mb-3">{pillarName}</div>

        {/* 天干十神 */}
        {showDetails && !isRiZhu && (
          <div
            className="text-xs px-2 py-1 rounded mb-2"
            style={{
              backgroundColor: `${SHISHEN_COLORS[shiShenData.gan]}20`,
              color: SHISHEN_COLORS[shiShenData.gan]
            }}
          >
            {shiShenData.gan}
          </div>
        )}

        {/* 天干 */}
        <div className="relative">
          <div className="text-4xl font-bold text-gray-800 mb-2">{pillar.gan}</div>
          {showDetails && (
            <div
              className="absolute -right-2 top-0 w-3 h-3 rounded-full"
              style={{ backgroundColor: WUXING_COLORS[pillar.ganWuXing] }}
              title={`${pillar.ganWuXing}${pillar.gan}`}
            />
          )}
        </div>

        {/* 日主标记 */}
        {isRiZhu && (
          <div className="text-xs font-bold text-red-600 my-1">⭐️ 日主</div>
        )}

        {/* 地支 */}
        <div className="relative">
          <div className="text-4xl font-bold text-gray-800 mb-2">{pillar.zhi}</div>
          {showDetails && (
            <div
              className="absolute -right-2 top-0 w-3 h-3 rounded-full"
              style={{ backgroundColor: WUXING_COLORS[pillar.zhiWuXing] }}
              title={`${pillar.zhiWuXing}${pillar.zhi}`}
            />
          )}
        </div>

        {/* 地支十神 */}
        {showDetails && !isRiZhu && (
          <div
            className="text-xs px-2 py-1 rounded mt-2"
            style={{
              backgroundColor: `${SHISHEN_COLORS[shiShenData.zhi]}20`,
              color: SHISHEN_COLORS[shiShenData.zhi]
            }}
          >
            {shiShenData.zhi}
          </div>
        )}

        {/* 藏干 */}
        {showDetails && pillar.cangGan && pillar.cangGan.length > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            <div className="text-gray-400 mb-1">藏干</div>
            <div className="flex gap-1">
              {pillar.cangGan.map((gan: string, idx: number) => (
                <span key={idx} className="text-gray-600">
                  {gan}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 纳音（如果有） */}
        {showDetails && pillar.naYin && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="text-gray-400">纳音</div>
            <div className="text-gray-600">{pillar.naYin}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bazi-chart">
      {/* 标题 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">四柱八字</h2>
        <p className="text-sm text-gray-500">日主：{bazi.riGan}</p>
      </div>

      {/* 四柱展示 */}
      <div className="flex justify-center gap-4 mb-8">
        {renderPillar('年柱', bazi.year, shiShen.year)}
        {renderPillar('月柱', bazi.month, shiShen.month)}
        {renderPillar('日柱', bazi.day, { gan: '', zhi: '' }, true)}
        {renderPillar('时柱', bazi.hour, shiShen.hour)}
      </div>

      {/* 五行统计 */}
      {showDetails && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">五行分析</h3>

          {/* 五行计数条形图 */}
          <div className="space-y-3 mb-6">
            {Object.entries(wuXing.count).map(([element, count]) => (
              <div key={element} className="flex items-center gap-3">
                <div className="w-12 text-sm font-medium text-gray-700">{element}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full flex items-center px-2 text-white text-xs font-bold transition-all duration-300"
                    style={{
                      width: `${(count / 8) * 100}%`,
                      backgroundColor: WUXING_COLORS[element],
                      minWidth: count > 0 ? '30px' : '0'
                    }}
                  >
                    {count > 0 && count}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 五行强弱分析 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">最旺：</span>
              <span
                className="font-bold ml-1"
                style={{ color: WUXING_COLORS[wuXing.strongest] }}
              >
                {wuXing.strongest}
              </span>
            </div>
            <div>
              <span className="text-gray-500">最弱：</span>
              <span
                className="font-bold ml-1"
                style={{ color: WUXING_COLORS[wuXing.weakest] }}
              >
                {wuXing.weakest}
              </span>
            </div>
            <div>
              <span className="text-gray-500">用神：</span>
              <span className="font-bold ml-1 text-green-600">{wuXing.yongShen}</span>
            </div>
            <div>
              <span className="text-gray-500">忌神：</span>
              <span className="font-bold ml-1 text-red-600">{wuXing.jiShen}</span>
            </div>
          </div>

          {/* 平衡度 */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">五行平衡度：</span>
              <span className="text-lg font-bold text-gray-800">{wuXing.balance}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${wuXing.balance}%`,
                  backgroundColor:
                    wuXing.balance >= 70
                      ? '#10b981'
                      : wuXing.balance >= 40
                      ? '#f59e0b'
                      : '#ef4444'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaziChart;
