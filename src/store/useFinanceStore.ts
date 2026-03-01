import { create } from 'zustand';
import type { Transaction, Goal } from '../types';

interface FinanceState {
  transactions: Transaction[];
  goals: Goal[];
  loading: boolean;
  consolidatedBalance: number;
  refreshCounter: number;
  setTransactions: (transactions: Transaction[]) => void;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setLoading: (loading: boolean) => void;
  calculateBalance: () => void;
  triggerRefresh: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  goals: [],
  loading: false,
  consolidatedBalance: 0,
  refreshCounter: 0,
  
  setTransactions: (transactions) => {
    set({ transactions });
    get().calculateBalance();
  },
  
  setGoals: (goals) => set({ goals }),
  
  addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
  
  updateGoal: (goal) => set((state) => ({
    goals: state.goals.map((g) => (g.id === goal.id ? goal : g))
  })),
  
  deleteGoal: (id) => set((state) => ({
    goals: state.goals.filter((g) => g.id !== id)
  })),

  addTransaction: (transaction) => {
    set((state) => ({ transactions: [...state.transactions, transaction] }));
    get().calculateBalance();
  },

  deleteTransaction: (id) => {
    set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
    get().calculateBalance();
  },
  
  setLoading: (loading) => set({ loading }),
  
  calculateBalance: () => {
    const { transactions } = get();
    const balance = transactions.reduce((acc, curr) => {
      const isPositive = curr.type === 'income' || curr.type === 'recurring';
      return isPositive ? acc + curr.amount : acc - curr.amount;
    }, 0);
    set({ consolidatedBalance: balance });
  },

  triggerRefresh: () => set((state) => ({ refreshCounter: state.refreshCounter + 1 }))
}));
