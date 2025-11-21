import React, { useState } from 'react';
import type { DivinationRecord } from '../types';

interface VerificationModalProps {
  record: DivinationRecord;
  onClose: () => void;
  onSubmit: (data: {
    actual_result: string;
    accuracy_rating: number;
    user_notes: string;
  }) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  record,
  onClose,
  onSubmit
}) => {
  const [actualResult, setActualResult] = useState(record.actualResult || '');
  const [rating, setRating] = useState(record.accuracyRating || 0);
  const [notes, setNotes] = useState(record.userNotes || '');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = () => {
    if (!actualResult.trim()) {
      alert('请填写实际结果');
      return;
    }
    if (rating === 0) {
      alert('请选择准确度评分');
      return;
    }

    onSubmit({
      actual_result: actualResult,
      accuracy_rating: rating,
      user_notes: notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题 */}
        <div className="bg-primary text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">验证卦象</h2>
          <p className="text-sm mt-1 opacity-90">记录事情的实际结果</p>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 原始占问 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">原始占问：</p>
            <p className="font-semibold text-gray-800">{record.question}</p>
            <p className="text-xs text-gray-500 mt-2">
              起卦时间：{new Date(record.timestamp).toLocaleString('zh-CN')}
            </p>
          </div>

          {/* 实际结果 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              实际结果 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={actualResult}
              onChange={(e) => setActualResult(e.target.value)}
              placeholder="请详细描述事情的实际结果..."
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none resize-none"
              rows={4}
            />
          </div>

          {/* 准确度评分 */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              准确度评分 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-4xl transition-all duration-150 hover:scale-110"
                >
                  {(hoveredRating || rating) >= star ? '⭐' : '☆'}
                </button>
              ))}
              <span className="ml-3 text-sm text-gray-600">
                {rating === 0 && '请选择评分'}
                {rating === 1 && '很不准确'}
                {rating === 2 && '不太准确'}
                {rating === 3 && '一般'}
                {rating === 4 && '比较准确'}
                {rating === 5 && '非常准确'}
              </span>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              备注（可选）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="可以记录一些心得体会、应验时间等..."
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* 按钮 */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            保存验证
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
