import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { baziApi } from '../utils/baziApi';
import type { Gender } from '../types/bazi';

const BaziInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    gender: '男' as Gender,
    birthDate: '',
    birthTime: '',
    birthLocation: '',
    useTrueSolarTime: false,
    question: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const birthDatetime = new Date(`${formData.birthDate}T${formData.birthTime}`).getTime();

      if (Number.isNaN(birthDatetime)) {
        throw new Error('请输入有效的出生日期和时间');
      }

      const response = await baziApi.createBazi({
        name: formData.name || undefined,
        gender: formData.gender,
        birthDatetime,
        birthLocation: formData.birthLocation || undefined,
        useTrueSolarTime: formData.useTrueSolarTime,
        question: formData.question || undefined,
      });

      if (response.success && response.data) {
        navigate(`/bazi/display/${response.data.id}`);
      } else {
        throw new Error(response.error || response.message || '创建八字记录失败');
      }
    } catch (err: any) {
      console.error('创建八字失败:', err);
      setError(err.response?.data?.message || err.message || '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">八字批命</h1>
          <p className="text-gray-600">请输入出生信息，系统将为您排盘分析</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">姓名（可选）</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性别 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {(['男', '女'] as Gender[]).map((gender) => (
                <label key={gender} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value={gender}
                    checked={formData.gender === gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="mr-2"
                  />
                  <span>{gender}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              出生日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              出生时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.birthTime}
              onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">请输入准确的出生时间（24 小时制）</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">出生地（可选）</label>
            <input
              type="text"
              value={formData.birthLocation}
              onChange={(e) => setFormData({ ...formData, birthLocation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="如：北京市"
            />
          </div>

          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.useTrueSolarTime}
                onChange={(e) => setFormData({ ...formData, useTrueSolarTime: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">使用真太阳时（根据出生地经度调整）</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              真太阳时会根据出生地经度对时间进行修正。当前版本会保留该选项，核心计算按标准时间排盘。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">问题或备注（可选）</label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="如：想了解事业运势、婚姻状况等"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '计算中...' : '开始排盘'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/bazi/history')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              历史记录
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">温馨提示</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 出生时间越准确，八字排盘越精确</li>
            <li>• 如不确定具体时辰，可选择该时辰的中间时间</li>
            <li>• 系统会自动计算四柱八字、十神、五行、大运等信息</li>
            <li>• 可选择使用 AI 进行详细批注分析</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BaziInputPage;
