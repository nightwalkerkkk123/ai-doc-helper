import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import ParamsTab from './ParamsTab';
import EvalTab from './EvalTab';
import { useRagStore } from '../../stores/useRagStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 评测 / 配置用的参数快照
export type SavedParamsSnapshot = {
  temperature: number;
  chunkTopK: number;
  systemPrompt: string;
};

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'params' | 'eval'>('params');

  // 从 Zustand 取当前全局配置
  const storeTemperature = useRagStore((s) => s.temperature);
  const setTemperature = useRagStore((s) => s.setTemperature);

  const storeChunkTopK = useRagStore((s) => s.chunk_top_k);
  const setChunkTopK = useRagStore((s) => s.setChunkTopK);

  const storeSystemPrompt = useRagStore((s) => s.systemPrompt);
  const setSystemPrompt = useRagStore((s) => s.setSystemPrompt);

  // 和 ParamsTab / PromptPanel 默认文案保持一致
  const DEFAULT_SYSTEM_PROMPT =
    '你是一个专业的 AI 文档助手。请根据用户问题和提供的上下文片段，用简洁、准确的语言回答。';

  const defaultSystemPrompt =
    (storeSystemPrompt && storeSystemPrompt.trim().length > 0
      ? storeSystemPrompt
      : DEFAULT_SYSTEM_PROMPT);

  const initialSaved: SavedParamsSnapshot = {
    temperature:
      typeof storeTemperature === 'number' ? storeTemperature : 0.7,
    chunkTopK:
      typeof storeChunkTopK === 'number' ? storeChunkTopK : 20,
    systemPrompt: defaultSystemPrompt,
  };

  // 当前“已保存生效”的配置（给 ParamsTab、EvalTab 用）
  const [savedParams, setSavedParams] =
    useState<SavedParamsSnapshot>(initialSaved);

  // 最近一次评测时使用的参数快照
  const [lastEvalParams, setLastEvalParams] =
    useState<SavedParamsSnapshot | null>(null);

  const [evalState, setEvalState] =
    useState<'idle' | 'loading' | 'done'>('idle');

  const hasEvaluated = lastEvalParams !== null;
  const isParamsChanged = hasEvaluated
    ? JSON.stringify(savedParams) !== JSON.stringify(lastEvalParams)
    : true;
  const isEvalButtonDisabled = hasEvaluated && !isParamsChanged;

  // Config Tab 点“保存配置”时调用：同步到本地状态 + Zustand
  const handleSaveConfig = (next: SavedParamsSnapshot) => {
    setSavedParams(next);

    // 推到全局 store，让实际 RAG 请求用这份配置
    setTemperature(next.temperature);
    setChunkTopK(next.chunkTopK);
    setSystemPrompt(next.systemPrompt);

    if (typeof window !== 'undefined' && window.alert) {
      window.alert('配置已保存！现在可以前往评测面板进行新一轮测试。');
    }
  };

  const startEvaluation = () => {
    if (evalState === 'loading') return;
    setEvalState('loading');

    // 模拟一段 loading，然后记录这次评测参数
    setTimeout(() => {
      setEvalState('done');
      setLastEvalParams(savedParams);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl min-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Settings className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <div>
              <div className="text-md font-semibold text-gray-900">
                RAG 设置
              </div>
              <div className="text-xs text-gray-500">
                调优参数配置，观察 RAG 系统在真实文档上的表现
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-gray-100 bg-white/80">
          <TabButton
            active={activeTab === 'params'}
            onClick={() => setActiveTab('params')}
          >
            参数配置
          </TabButton>
          <TabButton
            active={activeTab === 'eval'}
            onClick={() => setActiveTab('eval')}
          >
            评测面板
          </TabButton>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col bg-slate-50/60 p-0">
          <div className="h-full px-6 py-4 overflow-y-auto custom-scrollbar">
            {activeTab === 'params' ? (
              <ParamsTab
                savedParams={savedParams}
                onSaveConfig={handleSaveConfig}
              />
            ) : (
              <EvalTab
                evalState={evalState}
                onStartEvaluation={startEvaluation}
                hasEvaluated={hasEvaluated}
                lastEvalParams={lastEvalParams}
                isEvalButtonDisabled={isEvalButtonDisabled}
              />
            )}
          </div>
        </div>
      </div>

      {/* 全局小样式，给两个 tab 共用 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scale-up 0.3s ease-out forwards cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slide-down { from { opacity: 0; height: 0; } to { opacity: 1; height: auto; } }
        .animate-slide-down { animation: slide-down 0.3s ease-out forwards; }
        @keyframes progress-indeterminate { 0% { width: 30%; margin-left: -30%; } 50% { width: 50%; margin-left: 25%; } 100% { width: 30%; margin-left: 100%; } }
        .animate-progress-indeterminate { animation: progress-indeterminate 1.5s infinite linear; }
      `}</style>
    </div>
  );
};

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'relative px-4 py-3 text-sm font-medium transition-all ' +
      (active
        ? 'text-indigo-600'
        : 'text-gray-500 hover:text-gray-700')
    }
  >
    {children}
    {active && (
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600 rounded-t-full" />
    )}
  </button>
);

export default SettingsModal;
