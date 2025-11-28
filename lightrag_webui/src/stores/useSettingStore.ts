// src/stores/useLabSettingsStore.ts
import { create } from 'zustand';

export type SavedParamsSnapshot = {
  temperature: number;
  chunkTopK: number;
  systemPrompt: string;
};

type EvalStatus = 'idle' | 'loading' | 'done';

interface LabSettingsState {
  // 配置相关
  savedParams: SavedParamsSnapshot;
  editingParams: SavedParamsSnapshot;

  // 评测相关
  evalStatus: EvalStatus;
  lastEvalParams: SavedParamsSnapshot | null;

  // actions
  setEditingParams: (partial: Partial<SavedParamsSnapshot>) => void;
  resetEditingParams: () => void;
  commitParams: () => void;

  startEval: () => Promise<void>; // 真实项目里调后端
}

export const useLabSettingsStore = create<LabSettingsState>((set, get) => ({
  savedParams: {
    temperature: 0.7,
    chunkTopK: 20,
    systemPrompt: '你是一个专业的 AI 文档助手……',
  },
  editingParams: {
    temperature: 0.7,
    chunkTopK: 20,
    systemPrompt: '你是一个专业的 AI 文档助手……',
  },
  evalStatus: 'idle',
  lastEvalParams: null,

  setEditingParams: (partial) =>
    set((s) => ({ editingParams: { ...s.editingParams, ...partial } })),

  resetEditingParams: () =>
    set((s) => ({ editingParams: { ...s.savedParams } })),

  commitParams: () =>
    set((s) => ({
      savedParams: { ...s.editingParams },
      lastEvalParams: null, // 配置变了，上一次评测作废
    })),

  startEval: async () => {
    const { evalStatus, editingParams } = get();
    if (evalStatus === 'loading') return;

    set({ evalStatus: 'loading' });

    // TODO: 在这里调后端 / ragas / mock
    await new Promise((r) => setTimeout(r, 1500));

    set({
      evalStatus: 'done',
      lastEvalParams: { ...editingParams },
    });
  },
}));
