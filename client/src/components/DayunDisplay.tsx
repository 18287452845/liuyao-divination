import React from 'react';
import type { DaYunResult, DaYunStep } from '../types/bazi';

interface DayunDisplayProps {
  dayun: DaYunResult;
  currentAge?: number;
  showDetails?: boolean;
}

/**
 * 大运展示组件
 *
 * 展示八字大运排盘，包括起运年龄、顺逆排、以及各步大运的详细信息
 */
const DayunDisplay: React.FC<DayunDisplayProps> = ({
  dayun,
  currentAge,
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

  // 判断某步大运是否是当前运
  const isCurrentDayun = (step: DaYunStep): boolean => {
    if (!currentAge) return false;
    return currentAge >= step.startAge && currentAge <= step.endAge;
  };

  // 渲染单步大运
  const renderDayunStep = (step: DaYunStep, index: number) => {
    const isCurrent = isCurrentDayun(step);

    return (
      <div
        key={index}
        className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
          isCurrent
            ? 'bg-blue-50 border-blue-400 shadow-lg scale-105'
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* 大运序号 */}
        <div className="text-xs text-gray-500 mb-2">第{index + 1}步</div>

        {/* 天干十神 */}
        {showDetails && step.shiShen && (
          <div
            className="text-xs px-2 py-1 rounded mb-2"
            style={{
              backgroundColor: `${SHISHEN_COLORS[step.shiShen.gan]}20`,
              color: SHISHEN_COLORS[step.shiShen.gan]
            }}
          >
            {step.shiShen.gan}
          </div>
        )}

        {/* 天干 */}
        <div className="relative mb-2">
          <div className="text-3xl font-bold text-gray-800">{step.gan}</div>
          {showDetails && (
            <div
              className="absolute -right-2 top-0 w-3 h-3 rounded-full"
              style={{ backgroundColor: WUXING_COLORS[step.wuXing.gan] }}
              title={`${step.wuXing.gan}${step.gan}`}
            />
          )}
        </div>

        {/* 地支 */}
        <div className="relative mb-2">
          <div className="text-3xl font-bold text-gray-800">{step.zhi}</div>
          {showDetails && (
            <div
              className="absolute -right-2 top-0 w-3 h-3 rounded-full"
              style={{ backgroundColor: WUXING_COLORS[step.wuXing.zhi] }}
              title={`${step.wuXing.zhi}${step.zhi}`}
            />
          )}
        </div>

        {/* 地支十神 */}
        {showDetails && step.shiShen && (
          <div
            className="text-xs px-2 py-1 rounded mb-2"
            style={{
              backgroundColor: `${SHISHEN_COLORS[step.shiShen.zhi]}20`,
              color: SHISHEN_COLORS[step.shiShen.zhi]
            }}
          >
            {step.shiShen.zhi}
          </div>
        )}

        {/* 年龄范围 */}
        <div className="text-sm font-medium text-gray-700 mt-2">
          {step.startAge}-{step.endAge}岁
        </div>

        {/* 当前标记 */}
        {isCurrent && (
          <div className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
            当前运
          </div>
        )}

        {/* 藏干 */}
        {showDetails && step.cangGan && step.cangGan.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="text-gray-400 mb-1">藏干</div>
            <div className="flex gap-1">
              {step.cangGan.map((gan: string, idx: number) => (
                <span key={idx} className="text-gray-600">
                  {gan}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dayun-display">
      {/* 标题和信息 */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">大运排盘</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">起运年龄：</span>
              <span className="font-bold text-blue-600">{dayun.qiyunAge}岁</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">排盘方式：</span>
              <span className="font-bold text-gray-700">
                {dayun.shunPai ? '顺排' : '逆排'}
              </span>
            </div>
            {currentAge && (
              <div className="text-sm">
                <span className="text-gray-500">当前年龄：</span>
                <span className="font-bold text-green-600">{currentAge}岁</span>
              </div>
            )}
          </div>
        </div>

        {/* 说明文字 */}
        <div className="text-sm text-gray-600">
          {dayun.shunPai ? (
            <p>阳男阴女顺排大运，按月份顺推</p>
          ) : (
            <p>阴男阳女逆排大运，按月份逆推</p>
          )}
        </div>
      </div>

      {/* 大运步骤展示 - 横向滚动 */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {dayun.steps.map((step, index) => renderDayunStep(step, index))}
        </div>
      </div>

      {/* 大运时间轴（简化版） */}
      {showDetails && (
        <div className="mt-6 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">大运时间轴</h3>
          <div className="relative">
            {/* 时间线 */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200" />

            {/* 时间点 */}
            <div className="relative flex justify-between">
              {dayun.steps.map((step, index) => {
                const isCurrent = isCurrentDayun(step);
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / dayun.steps.length}%` }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        isCurrent
                          ? 'bg-blue-500 border-blue-600 scale-125'
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <div className={`mt-2 text-xs ${isCurrent ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                      {step.startAge}岁
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{step.ganZhi}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 大运列表（详细信息） */}
      {showDetails && (
        <div className="mt-6 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">大运详情</h3>
          <div className="space-y-2">
            {dayun.steps.map((step, index) => {
              const isCurrent = isCurrentDayun(step);
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                      第{index + 1}步
                    </div>
                    <div className="font-bold text-lg text-gray-800">{step.ganZhi}运</div>
                    <div className="text-sm text-gray-600">
                      {step.startAge}-{step.endAge}岁
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="text-gray-500">五行：</span>
                      <span style={{ color: WUXING_COLORS[step.wuXing.gan] }}>
                        {step.wuXing.gan}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span style={{ color: WUXING_COLORS[step.wuXing.zhi] }}>
                        {step.wuXing.zhi}
                      </span>
                    </div>
                    {step.shiShen && (
                      <div className="text-sm">
                        <span className="text-gray-500">十神：</span>
                        <span style={{ color: SHISHEN_COLORS[step.shiShen.gan] }}>
                          {step.shiShen.gan}
                        </span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span style={{ color: SHISHEN_COLORS[step.shiShen.zhi] }}>
                          {step.shiShen.zhi}
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                        当前
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayunDisplay;
