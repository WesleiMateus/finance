import { create } from 'zustand';
import type { User } from '../types';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  validateSubscription: (user: User) => Promise<User>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  
  validateSubscription: async (user) => {
    const now = new Date();
    if (user.subscriptionExpiresAt < now && user.status === 'active') {
      const updatedUser: User = { ...user, status: 'pending' };
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { status: 'pending' });
      return updatedUser;
    }
    return user;
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null });
  }
}));

// Initialize auth listener
let unsubUser: (() => void) | null = null;

onAuthStateChanged(auth, async (firebaseUser) => {
  const store = useAuthStore.getState();
  
  if (unsubUser) {
    unsubUser();
    unsubUser = null;
  }

  if (firebaseUser) {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    
    // First fetch to ensure we have data immediately (and to run validation)
    const initialDoc = await getDoc(userDocRef);
    if (initialDoc.exists()) {
      const data = initialDoc.data();
      let userData: User = {
        id: firebaseUser.uid,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        subscriptionExpiresAt: data.subscriptionExpiresAt.toDate(),
        createdAt: data.createdAt.toDate(),
        onboardingCompleted: data.onboardingCompleted || false,
      };
      
      userData = await store.validateSubscription(userData);
      store.setUser(userData);
      
      // Setup real-time listener for subsequent changes
      unsubUser = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const updatedData = snapshot.data();
          const userState: User = {
            id: firebaseUser.uid,
            name: updatedData.name,
            email: updatedData.email,
            role: updatedData.role,
            status: updatedData.status,
            subscriptionExpiresAt: updatedData.subscriptionExpiresAt.toDate(),
            createdAt: updatedData.createdAt.toDate(),
            onboardingCompleted: updatedData.onboardingCompleted || false,
          };
          store.setUser(userState);
        }
      });
    } else {
      store.setUser(null);
    }
  } else {
    store.setUser(null);
  }
  store.setLoading(false);
});
