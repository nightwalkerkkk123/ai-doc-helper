import React, { useState } from 'react';
import { Play, Target, SearchCheck, Quote, ListFilter, ChevronDown, HelpCircle, Activity, RotateCcw, Check, ArrowUp, ArrowDown } from 'lucide-react';
import type { SavedParamsSnapshot } from './SettingsModal';
import { EvalSample, EvalStatus, RagasMetricKey, RagasMetrics } from '@/types/index';
import { MOCK_EVAL_RESULT } from '@/data/mock';
import { METRIC_ORDER, METRIC_META } from '@/lib/constants';
import { toPercent, getSampleStatus } from '@/lib/utils';

/* 顶层入口 */
interface EvalTabProps {
  evalState: EvalStatus;
  onStartEvaluation: () => void;
  hasEvaluated: boolean;
  lastEvalParams: SavedParamsSnapshot | null;
  isEvalButtonDisabled: boolean;
}

const EvalTab: React.FC<EvalTabProps> = ({
  evalState,
  onStartEvaluation,
  hasEvaluated,
  lastEvalParams,
  isEvalButtonDisabled,
}) => {
  // 首次：还没评测 & idle
  if (!hasEvaluated && evalState === 'idle') {
    return <EvalButton onStartEvaluation={onStartEvaluation} />;
  }

  // Loading
  if (evalState === 'loading') {
    return <LoadingDisplay />;
  }

  // 已有结果
  return (
    <EvalResultDisplay
      lastEvalParams={lastEvalParams}
      isEvalButtonDisabled={isEvalButtonDisabled}
      hasEvaluated={hasEvaluated}
      onStartEvaluation={onStartEvaluation}
    />
  );
};

/* 环形进度条 & Metric 卡片 */
const CircularProgress: React.FC<{ value: number; color: string }> = ({
  value,
  color,
}) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = 28;

  return (
    <svg className="w-14 h-14">
      <circle
        className="text-gray-100"
        strokeWidth="4"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={center}
        cy={center}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <circle
        className={color}
        strokeWidth="4"
        stroke="currentColor"
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={radius}
        cx={center}
        cy={center}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-gray-900 font-bold text-lg"
      >
        {value}
        <tspan className="text-sm font-normal text-gray-400 ml-0.5">%</tspan>
      </text>
    </svg>
  );
};

const MetricCard: React.FC<{
  metricKey: RagasMetricKey;
  value: number;
  previousValue?: number;
}> = ({ metricKey, value, previousValue }) => {
  const def = METRIC_META[metricKey];
  const Icon = def.icon;
  const diff = previousValue !== undefined ? value - previousValue : 0;
  const isPositive = diff > 0;

  return (
    <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all relative">
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-2 relative">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{def.label}</span>
          <div className="group/tooltip relative">
            <HelpCircle
              size={12}
              className="text-gray-300 cursor-help hover:text-indigo-500 transition-colors"
            />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl pointer-events-none">
              {def.desc}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {previousValue !== undefined && (
            <div
              className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
                isPositive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {isPositive ? (
                <ArrowUp size={10} className="mr-0.5" />
              ) : (
                <ArrowDown size={10} className="mr-0.5" />
              )}
              {Math.abs(diff)}%
            </div>
          )}
        </div>
      </div>
      <div className="opacity-90 group-hover:opacity-100 transition-opacity pl-4 border-l border-gray-50">
        <CircularProgress value={value} color={def.color} />
      </div>
    </div>
  );
};

/* 详情得分徽章 & 折叠摘要 */
const DetailScoreBadges: React.FC<{ metrics: RagasMetrics }> = ({
  metrics,
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
      {METRIC_ORDER.map((key) => {
        const val = metrics[key];
        if (typeof val !== 'number') return null;

        const percent = toPercent(val);
        const meta = METRIC_META[key];

        let scoreColorClass = 'text-gray-900';
        if (percent! >= 80) scoreColorClass = 'text-emerald-600';
        else if (percent! >= 60) scoreColorClass = 'text-amber-600';
        else scoreColorClass = 'text-red-600';

        return (
          <div
            key={key}
            className="flex items-center gap-2 pr-4 border-r border-gray-200 last:border-0 last:pr-0"
          >
            <div className="p-1.5 text-gray-500">
              <meta.icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-gray-500">
                {meta.label}
              </span>
              <span className={`text-sm font-medium font-mono ${scoreColorClass}`}>
                {percent}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CollapsedScoreSummary: React.FC<{ metrics: RagasMetrics }> = ({
  metrics,
}) => {
  return (
    <div className="flex items-center text-sm font-mono text-gray-500 bg-gray-50/80 px-2 py-1.5 rounded border border-gray-100">
      {METRIC_ORDER.map((key, idx) => {
        const val = metrics[key];
        const percent = toPercent(val);

        let colorClass = 'text-gray-600';
        if (percent !== null) {
          if (percent < 60) colorClass = 'text-red-600';
          else if (percent < 80) colorClass = 'text-amber-600';
          else colorClass = 'text-emerald-600';
        }

        return (
          <div key={key} className="flex items-center">
            {idx > 0 && <span className="text-gray-300 mx-1">/</span>}
            <span className={`w-7 text-center font-normal ${colorClass}`}>
              {percent ?? '-'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* 样例行 */
const CollapsibleSampleRow: React.FC<{
  sample: EvalSample;
  index: number;
}> = ({ sample }) => {
  const status = getSampleStatus(sample.metrics);
  const isPass = status === 'pass';

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`group bg-white rounded-lg border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50 my-3'
          : 'border-gray-200 hover:border-gray-300 my-1'
      }`}
    >
      {/* 头部 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 cursor-pointer select-none flex items-center gap-3 transition-colors hover:bg-gray-50/30"
      >
        {/* 状态点 */}
        <div className="flex-shrink-0" title={isPass ? '通过' : '需优化'}>
          {isPass ? (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-50" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm ring-2 ring-red-50" />
          )}
        </div>

        {/* 问题文本 */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm text-gray-700 truncate pr-4 ${
              isExpanded ? 'font-bold text-gray-900' : 'font-medium'
            }`}
          >
            {sample.query}
          </h3>
        </div>

        {/* 右侧：折叠态得分概览 */}
        <div className="flex items-center gap-4">
          {!isExpanded && (
            <div className="hidden sm:flex items-center gap-2 animate-in fade-in duration-300">
              <span className="text-[12px] text-gray-400">得分</span>
              <CollapsedScoreSummary metrics={sample.metrics} />
            </div>
          )}

          <div
            className={`text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-indigo-500' : 'group-hover:text-gray-600'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 展开后详情 */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-white animate-in slide-in-from-top-1 duration-200">
          {/* 详细得分 */}
          <div className="px-4 py-3 bg-gray-50/30 border-b border-gray-50">
            <DetailScoreBadges metrics={sample.metrics} />
          </div>

          {/* 双栏内容 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* 左侧: 生成对比区 */}
            <div className="lg:col-span-7 p-5 space-y-5">
              {/* AI 回答 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  模型回答
                </div>
                <div className="bg-blue-50/20 p-3.5 rounded-lg border border-blue-100/50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {sample.answer}
                </div>
              </div>

              {/* 标注答案 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  标注答案
                </div>
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200/60 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {sample.reference_answer || (
                    <span className="italic text-gray-400">未提供参考答案</span>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧: 检索证据区 */}
            <div className="lg:col-span-5 flex flex-col bg-gray-50/10">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Quote className="w-3.5 h-3.5 text-purple-500 opacity-70" />
                  检索上下文
                </div>
                <span className="text-[12px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-mono font-medium">
                  {sample.contexts.length}个文本块
                </span>
              </div>

              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {sample.contexts.length > 0 ? (
                  sample.contexts.map((ctx, idx) => (
                    <div
                      key={idx}
                      className="group relative pl-3 py-1 transition-all"
                    >
                      <div className="absolute left-0 top-2 w-0.5 h-full bg-gray-200 group-hover:bg-purple-300 transition-colors rounded-full" />
                      <div className="text-[9px] text-gray-400 mb-0.5 font-mono">
                        文本块 #{idx + 1}
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed break-words opacity-90 group-hover:text-gray-900">
                        {ctx}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <SearchCheck className="w-8 h-8 mb-2 opacity-10" />
                    <span className="text-[12px]">无相关片段</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* 首次提示 & Loading */
interface EvalButtonProps {
  onStartEvaluation: () => void;
}

const EvalButton: React.FC<EvalButtonProps> = ({ onStartEvaluation }) => {
  return (
    <div className="h-full min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-full shadow-lg mb-6 ring-4 ring-indigo-50">
        <Target className="w-16 h-16 text-indigo-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        准备好开始评测了吗？
      </h2>
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
        当前暂无评测记录。系统将使用你刚才保存的参数进行首次全量评估。
      </p>
      <button
        onClick={onStartEvaluation}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>开始全量评测</span>
      </button>
    </div>
  );
};

const LoadingDisplay: React.FC = () => {
  return (
    <div className="h-full min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="inline-block animate-spin text-indigo-600 mb-4">
          <Activity size={48} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          正在评估模型表现...
        </h3>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full animate-progress-indeterminate" />
        </div>
      </div>
    </div>
  );
};

/* 结果视图 */
interface EvalResultDisplayProps {
  hasEvaluated: boolean;
  lastEvalParams: SavedParamsSnapshot | null;
  isEvalButtonDisabled: boolean;
  onStartEvaluation: () => void;
}

const EvalResultDisplay: React.FC<EvalResultDisplayProps> = ({
  hasEvaluated,
  lastEvalParams,
  isEvalButtonDisabled,
  onStartEvaluation,
}) => {
  const result = hasEvaluated ? MOCK_EVAL_RESULT : null;

  const topMetricValues: Record<RagasMetricKey, number> = {
    faithfulness: result ? Math.round((result.metrics.faithfulness ?? 0) * 100) : 0,
    answer_relevance: result
      ? Math.round((result.metrics.answer_relevance ?? 0) * 100)
      : 0,
    context_recall: result
      ? Math.round((result.metrics.context_recall ?? 0) * 100)
      : 0,
    context_precision: result
      ? Math.round((result.metrics.context_precision ?? 0) * 100)
      : 0,
  };

  const previousMetricValues: Partial<Record<RagasMetricKey, number>> = {
    faithfulness: topMetricValues.faithfulness - 2,
    answer_relevance: topMetricValues.answer_relevance - 1,
    context_recall: topMetricValues.context_recall + 3,
    context_precision: topMetricValues.context_precision - 4,
  };

  return (
    <div className="relative flex flex-col w-full bg-gray-50/30 gap-5">
      <div className="flex justify-between items-end mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900">评测结果</h2>
          {lastEvalParams && (
            <p className="text-xs text-gray-400 mt-1">
              基于参数: 温度 {lastEvalParams.temperature}, 文本块召回数量 {lastEvalParams.chunkTopK}
            </p>
          )}
        </div>

        <div className="relative group/btn">
          <button
            onClick={onStartEvaluation}
            disabled={isEvalButtonDisabled}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
              isEvalButtonDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-md'
            }`}
          >
            {isEvalButtonDisabled ? (
              <>
                <Check size={16} />
                当前参数已评测
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                {hasEvaluated ? '重新评测' : '开始评测'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 顶部四个指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            'faithfulness',
            'answer_relevance',
            'context_recall',
            'context_precision',
          ] as RagasMetricKey[]
        ).map((key) => (
          <MetricCard
            key={key}
            metricKey={key}
            value={topMetricValues[key]}
            previousValue={previousMetricValues[key]}
          />
        ))}
      </div>

      {/* 下部：样例列表 —— 不在这里搞 overflow，交给外层内容区域滚动 */}
      <div className="w-full max-w-5xl mx-auto pr-1 custom-scrollbar">
        {result && (
          <div className="flex flex-col gap-2 animate-fade-in pb-10 pt-1">
            {/* 列表标题 + 图例 */}
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                <ListFilter className="w-3.5 h-3.5" />
                <span>详情列表</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 mr-3 text-xs font-medium text-gray-600 px-3 py-1.5">
                  <span>{result.total_samples} 样本已评测</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[12px] text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 通过
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> 需优化
                </span>
              </div>
            </div>

            {result.samples.map((sample: EvalSample, idx: number) => (
              <CollapsibleSampleRow key={sample.id} sample={sample} index={idx} />
            ))}

            <div className="text-center text-[12px] text-gray-300 py-6">
              —— 已显示全部内容 ——
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvalTab;
