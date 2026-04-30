import React from 'react';
import type { Gua, GuaDecoration } from '../types';

interface GuaDisplayProps {
  gua: Gua;
  decoration?: GuaDecoration;
  title?: string;
  showDecoration?: boolean;
}

const YAO_NAMES = ['初', '二', '三', '四', '五', '上'];

const GuaDisplay: React.FC<GuaDisplayProps> = ({ gua, decoration, title, showDecoration = false }) => {
  const renderYaoVisual = (lineValue: number, size: 'large' | 'normal' = 'normal') => {
    const isYang = lineValue === 1;
    const lineClassName = size === 'large' ? 'yao-line-large' : 'yao-line';
    const gapClassName = size === 'large' ? 'gap-3' : 'gap-2';

    if (isYang) {
      return <div className={`${lineClassName} yao-yang w-full`} />;
    }

    return (
      <div className={`flex ${gapClassName} w-full`}>
        <div className={`${lineClassName} yao-yin flex-1`} />
        <div className={`${lineClassName} yao-yin flex-1`} />
      </div>
    );
  };

  return (
    <div className="card">
      {title && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">{title}</h2>
          <div className="mx-auto mb-3 w-24 space-y-2">
            {Array.from({ length: 6 }).map((_, index) => {
              const i = 5 - index;
              return <div key={`header-${i}`}>{renderYaoVisual(Number(gua.lines?.[i]), 'large')}</div>;
            })}
          </div>
          <div className="text-sm text-gray-500 mb-2">
            上{gua.trigrams.upper}下{gua.trigrams.lower}
          </div>
          <p className="text-lg text-secondary font-semibold">{gua.name}</p>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => {
          const i = 5 - index;
          const lineValue = Number(gua.lines?.[i]);
          const isChange = Boolean(gua.changes?.[i]);

          const sixSpirit = decoration?.sixSpirits?.[i] ?? '-';
          const stem = decoration?.heavenlyStems?.[i] ?? '';
          const branch = decoration?.earthBranches?.[i] ?? '-';
          const element = decoration?.fiveElements?.[i] ?? '-';
          const relative = decoration?.sixRelatives?.[i] ?? '-';
          const shi = decoration?.shiYing?.[0] === i;
          const ying = decoration?.shiYing?.[1] === i;

          return (
            <div key={i} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-12 text-center font-semibold text-gray-700">{YAO_NAMES[i]}爻</div>

                <div className="w-full sm:flex-1 sm:min-w-[160px] flex items-center gap-2">
                  {renderYaoVisual(lineValue)}
                  {isChange && <span className="text-sm px-2 py-1 rounded bg-red-50 text-red-600 font-semibold">动</span>}
                </div>

                {showDecoration && decoration && (
                  <div className="w-full sm:w-auto sm:min-w-[260px] grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-4 text-sm">
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
