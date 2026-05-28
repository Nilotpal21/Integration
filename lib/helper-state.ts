'use client';

import { create } from 'zustand';
import {
  helperContextSpecs,
  getHelperReply,
  type HelperContext,
  type HelperContextKind,
  type HelperTurn,
} from './mock-data/helper';

interface HelperState {
  isOpen: boolean;
  context: HelperContext;
  turns: HelperTurn[];
  open: (ctx?: Partial<HelperContext>) => void;
  close: () => void;
  toggle: () => void;
  ask: (text: string) => void;
  reset: () => void;
}

const defaultContext: HelperContext = {
  kind: 'general',
  label: 'General',
};

let turnSeq = 0;
const nextId = () => `t_${++turnSeq}_${Date.now()}`;

export const useHelper = create<HelperState>((set, get) => ({
  isOpen: false,
  context: defaultContext,
  turns: [],

  open: (ctx) =>
    set((state) => {
      const newContext = ctx ? { ...defaultContext, ...ctx } : state.context;
      // Reset conversation when opening with a different context kind.
      const turns = ctx && ctx.kind && ctx.kind !== state.context.kind ? [] : state.turns;
      return { isOpen: true, context: newContext as HelperContext, turns };
    }),

  close: () => set({ isOpen: false }),

  toggle: () =>
    set((state) => ({ isOpen: !state.isOpen })),

  ask: (text) => {
    const userTurn: HelperTurn = { id: nextId(), role: 'user', text };
    const ctx = get().context.kind;
    const scripted = getHelperReply(ctx, text);
    const helperTurn: HelperTurn = scripted
      ? {
          id: nextId(),
          role: 'helper',
          text: scripted.text,
          citations: scripted.citations,
          action: scripted.action,
        }
      : {
          id: nextId(),
          role: 'helper',
          text:
            "In a live Helper I'd reach into your tenant data to answer that. For the prototype, try one of the suggestion chips above — they're scripted end-to-end.",
        };
    set((state) => ({ turns: [...state.turns, userTurn, helperTurn] }));
  },

  reset: () => set({ turns: [] }),
}));

export function getContextSpec(kind: HelperContextKind) {
  return helperContextSpecs[kind];
}
