import { create } from 'zustand';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { User } from '../types';

interface AdminState {
  users: User[];
  loading: boolean;
  error: string | null;
  subscribeToUsers: () => () => void;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  users: [],
  loading: true,
  error: null,

  subscribeToUsers: () => {
    set({ loading: true, error: null });
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          subscriptionExpiresAt: data.subscriptionExpiresAt instanceof Timestamp 
            ? data.subscriptionExpiresAt.toDate() 
            : new Date(data.subscriptionExpiresAt),
          createdAt: data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt),
        } as User;
      });
      
      set({ users: usersData, loading: false });
    }, (err: any) => {
      console.error('Error subscribing to users:', err);
      if (err.message?.includes('permissions')) {
        set({ error: 'Permissão negada no Firestore. Verifique se seu cargo no Console é "admin" ou "owner".', loading: false });
      } else {
        set({ error: err.message, loading: false });
      }
    });

    return unsubscribe;
  },

  updateUser: async (userId: string, data: Partial<User>) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData: any = { ...data };
      
      if (data.subscriptionExpiresAt) {
        updateData.subscriptionExpiresAt = Timestamp.fromDate(data.subscriptionExpiresAt);
      }
      if (data.createdAt) {
        updateData.createdAt = Timestamp.fromDate(data.createdAt);
      }

      await updateDoc(userRef, updateData);
    } catch (err: any) {
      console.error('Error updating user:', err);
      throw err;
    }
  }
}));
