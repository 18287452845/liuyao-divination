import React from 'react';
import type { Gua, GuaDecoration } from '../types';

interface GuaDisplayProps {
  gua: Gua;
  decoration?: GuaDecoration;
  title?: string;
  showDecoration?: boolean;
}

const TRIGRAM_SYMBOLS: { [key: string]: string } = {
  '乾': '☰',
  '兑': '☱',
  '离': '☲',
  '震': '☳',
  '巽': '☴',
  '坎': '☵',
  '艮': '☶',
  '坤': '☷'
};

const GuaDisplay: React.FC<GuaDisplayProps> = ({
  gua,
  decoration,
  title,
  showDecoration = false
}) => {
  const yaoNames = ['初', '二', '三', '四', '五', '上'];

  return (
    <div className="card">
      {title && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">{title}</h2>
          <div className="text-4xl mb-2">
            {TRIGRAM_SYMBOLS[gua.trigrams.upper]}
            {TRIGRAM_SYMBOLS[gua.trigrams.lower]}
          </div>
          <p className="text-lg text-secondary font-semibold">{gua.name}</p>
        </div>
      )}

      <div className="space-y-3">
        {[...Array(6)].map((_, index) => {
          const i = 5 - index; // 从上往下显示
          const isYang = gua.lines[i] === 1;
          const isChange = gua.changes[i];

          return (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* 爻名 */}
              <div className="w-12 text-center font-semibold text-gray-700">
                {yaoNames[i]}爻
              </div>

              {/* 爻象 */}
              <div className="flex-1 flex items-center gap-2">
                {isYang ? (
                  <div className="yao-line yao-yang w-full"></div>
                ) : (
                  <div className="flex gap-2 w-full">
                    <div className="yao-line yao-yin flex-1"></div>
                    <div className="yao-line yao-yin flex-1"></div>
                  </div>
                )}
                {isChange && (
                  <span className="text-2xl text-primary">○</span>
                )}
              </div>

              {/* 装卦信息 */}
              {showDecoration && decoration && (
                <div className="flex gap-4 text-sm">
                  <span className="text-purple-600 font-medium">
                    {decoration.sixSpirits[i]}
                  </span>
                  <span className="text-blue-600">
                    {decoration.heavenlyStems[i]}
                    {decoration.earthBranches[i]}
                  </span>
                  <span className="text-green-600">
                    {decoration.fiveElements[i]}
                  </span>
                  <span className="text-red-600">
                    {decoration.sixRelatives[i]}
                  </span>
                  {decoration.shiYing[0] === i && (
                    <span className="text-accent font-bold">世</span>
                  )}
                  {decoration.shiYing[1] === i && (
                    <span className="text-accent font-bold">应</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GuaDisplay;
