import React, { useEffect, useState } from 'react';
import { Thermometer, Search, MessageSquare, RotateCcw, Save } from 'lucide-react';
import type { SavedParamsSnapshot } from './SettingsModal';
import Slider from '../common/Slider';
import { NumberInput } from '../common/NumberInput';
import PromptPanel from './PromptPanel';

interface ParamsTabProps {
  savedParams: SavedParamsSnapshot;
  onSaveConfig: (next: SavedParamsSnapshot) => void;
}

// 卡片容器
const SettingCard = ({
  icon: Icon,
  title,
  description,
  children,
  valueLabel,
  statusLabel,
  statusColor = 'bg-gray-100 text-gray-600',
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  children: React.ReactNode;
  valueLabel?: string | number;
  statusLabel?: string;
  statusColor?: string;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex items-start gap-4 mb-4">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            {statusLabel && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}
              >
                {statusLabel}
              </span>
            )}
            {valueLabel !== undefined && (
              <span className="text-sm font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                {valueLabel}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
    <div className="pl-[52px]">{children}</div>
  </div>
);

const DEFAULT_SYSTEM_PROMPT =
  '你是一个专业的 AI 文档助手。请根据用户问题和提供的上下文片段，用简洁、准确的语言回答。如果上下文没有相关信息，请明确指出，而不是编造答案。';

const ParamsTab: React.FC<ParamsTabProps> = ({ savedParams, onSaveConfig }) => {
  const [editingParams, setEditingParams] = useState<SavedParamsSnapshot>({
    temperature: savedParams.temperature,
    chunkTopK: savedParams.chunkTopK,
    systemPrompt: savedParams.systemPrompt || DEFAULT_SYSTEM_PROMPT,
  });

  // 外部快照更新时（例如重新打开弹窗），同步到本地编辑态
  useEffect(() => {
    setEditingParams({
      temperature: savedParams.temperature,
      chunkTopK: savedParams.chunkTopK,
      systemPrompt: savedParams.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    });
  }, [savedParams]);

  // UI 文案
  const getTempLabel = (val: number) => {
    if (val <= 0.3)
      return { text: '严谨精确', color: 'bg-blue-100 text-blue-700' };
    if (val <= 0.7)
      return { text: '平衡标准', color: 'bg-green-100 text-green-700' };
    return { text: '发散创意', color: 'bg-purple-100 text-purple-700' };
  };
  const getChunkLabel = (val: number) => {
    if (val < 10)
      return { text: '极速模式', color: 'bg-yellow-100 text-yellow-700' };
    if (val <= 30)
      return { text: '平衡模式', color: 'bg-blue-100 text-blue-700' };
    return { text: '高召回模式', color: 'bg-indigo-100 text-indigo-700' };
  };

  const tempStatus = getTempLabel(editingParams.temperature);
  const chunkStatus = getChunkLabel(editingParams.chunkTopK);

  const handleReset = () => {
    setEditingParams({
      temperature: 0.7,
      chunkTopK: 20,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    });
  };

  const handleSaveClick = () => {
    onSaveConfig(editingParams);
  };

  return (
    <div className="flex-1 flex flex-col min-h-full">
      <div className="flex-1 pb-28">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-2">
          {/* Temperature */}
          <SettingCard
            icon={Thermometer}
            title="温度"
            description="控制回答的创造性。值越大回答越发散。"
            valueLabel={editingParams.temperature.toFixed(1)}
            statusLabel={tempStatus.text}
            statusColor={tempStatus.color}
          >
            <Slider
              value={editingParams.temperature}
              onChange={(val) =>
                setEditingParams((prev) => ({
                  ...prev,
                  temperature: val,
                }))
              }
              min={0}
              max={1}
              step={0.1}
              minLabel="0（精确）"
              maxLabel="1（创意）"
            />
          </SettingCard>

          {/* Chunk Top K */}
          <SettingCard
            icon={Search}
            title="文本块召回数量"
            description="文档文本块召回数量。数值越大，召回越全，但也更慢。"
            valueLabel={editingParams.chunkTopK}
            statusLabel={chunkStatus.text}
            statusColor={chunkStatus.color}
          >
            <NumberInput
              value={editingParams.chunkTopK}
              onChange={(val: number) =>
                setEditingParams((prev) => ({
                  ...prev,
                  chunkTopK: val,
                }))
              }
              min={1}
              max={100}
              step={1}
              suffix="文本块"
            />
          </SettingCard>

          {/* System Prompt */}
          <SettingCard
            icon={MessageSquare}
            title="系统提示词"
            description="定义模型角色、回答风格等全局行为。"
          >
            <PromptPanel
              value={editingParams.systemPrompt}
              onChange={(val) =>
                setEditingParams((prev) => ({
                  ...prev,
                  systemPrompt: val,
                }))
              }
            />
          </SettingCard>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-3 flex justify-end gap-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <button
          onClick={handleReset}
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <RotateCcw size={16} />
          恢复默认
        </button>
        <button
          onClick={handleSaveClick}
          type="button"
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <Save size={16} />
          保存配置
        </button>
      </div>
    </div>
  );
};

export default ParamsTab;
