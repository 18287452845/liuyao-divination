import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* 标题骨架 */}
      <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto"></div>

      {/* 卡片骨架 */}
      <div className="card">
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>

      {/* 卦象骨架 */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
