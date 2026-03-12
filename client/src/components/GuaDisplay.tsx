import React from 'react';
import type { Gua, GuaDecoration } from '../types';

interface GuaDisplayProps {
  gua: Gua;
  decoration?: GuaDecoration;
  title?: string;
  showDecoration?: boolean;
}

const TRIGRAM_SYMBOLS: Record<string, string> = {
  乾: '☰',
  兑: '☱',
  离: '☲',
  震: '☳',
  巽: '☴',
  坎: '☵',
  艮: '☶',
  坤: '☷'
};

const YAO_NAMES = ['初', '二', '三', '四', '五', '上'];

const GuaDisplay: React.FC<GuaDisplayProps> = ({
  gua,
  decoration,
  title,
  showDecoration = false
}) => {
  return (
    <div className="card">
      {title && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">{title}</h2>
          <div className="text-4xl mb-2">
            {TRIGRAM_SYMBOLS[gua.trigrams.upper] || '?'}
            {TRIGRAM_SYMBOLS[gua.trigrams.lower] || '?'}
          </div>
          <p className="text-lg text-secondary font-semibold">{gua.name}</p>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => {
          const i = 5 - index; // 从上往下显示
          const lineValue = Number(gua.lines?.[i]);
          const isYang = lineValue === 1;
          const isChange = Boolean(gua.changes?.[i]);

          const sixSpirit = decoration?.sixSpirits?.[i] ?? '-';
          const stem = decoration?.heavenlyStems?.[i] ?? '';
          const branch = decoration?.earthBranches?.[i] ?? '-';
          const element = decoration?.fiveElements?.[i] ?? '-';
          const relative = decoration?.sixRelatives?.[i] ?? '-';
          const shi = decoration?.shiYing?.[0] === i;
          const ying = decoration?.shiYing?.[1] === i;

          return (
            <div
              key={i}
              className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-12 text-center font-semibold text-gray-700">
                  {YAO_NAMES[i]}爻
                </div>

                <div className="w-full sm:flex-1 sm:min-w-[160px] flex items-center gap-2">
                  {isYang ? (
                    <div className="yao-line yao-yang w-full" />
                  ) : (
                    <div className="flex gap-2 w-full">
                      <div className="yao-line yao-yin flex-1" />
                      <div className="yao-line yao-yin flex-1" />
                    </div>
                  )}
                  {isChange && <span className="text-2xl text-primary">○</span>}
                </div>

                {showDecoration && decoration && (
                  <div className="w-full sm:w-auto sm:min-w-[230px] grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-4 text-sm">
                    <span className="text-purple-600 font-medium">{sixSpirit}</span>
                    <span className="text-blue-600">{`${stem}${branch}`}</span>
                    <span className="text-green-600">{element}</span>
                    <span className="text-red-600">{relative}</span>
                    {shi && <span className="text-accent font-bold">世</span>}
                    {ying && <span className="text-accent font-bold">应</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GuaDisplay;
