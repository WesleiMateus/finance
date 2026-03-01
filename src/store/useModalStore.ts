import { create } from 'zustand';

type ModalType = 'transaction' | 'goal' | 'planning';

interface ModalState {
  modals: Record<ModalType, boolean>;
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  toggleModal: (type: ModalType) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modals: {
    transaction: false,
    goal: false,
    planning: false,
  },
  openModal: (type) =>
    set((state) => ({
      modals: { ...state.modals, [type]: true },
    })),
  closeModal: (type) =>
    set((state) => ({
      modals: { ...state.modals, [type]: false },
    })),
  toggleModal: (type) =>
    set((state) => ({
      modals: { ...state.modals, [type]: !state.modals[type] },
    })),
}));
