import { create } from 'zustand';
import type { User } from '../types';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

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
    console.log("Auth State Changed: User Logged In", firebaseUser.email);
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    
    try {
      // First fetch to ensure we have data immediately (and to run validation)
      const initialDoc = await getDoc(userDocRef);
      
      if (initialDoc.exists()) {
        console.log("User Profile Found in Firestore");
        const data = initialDoc.data();
        
        try {
          // Obtém o token para verificar Custom Claims (admin: true)
          const tokenResult = await firebaseUser.getIdTokenResult();
          const isAdminClaim = !!tokenResult.claims.admin;
          console.log("Custom Claims Checked:", { isAdmin: isAdminClaim });

          let userData: User = {
            id: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || 'Usuário',
            email: data.email || firebaseUser.email || '',
            role: isAdminClaim ? (data.role === 'owner' ? 'owner' : 'admin') : (data.role || 'user'),
            status: data.status || 'active',
            subscriptionExpiresAt: data.subscriptionExpiresAt?.toDate() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdAt: data.createdAt?.toDate() || new Date(),
            onboardingCompleted: data.onboardingCompleted || false,
            cpfCnpj: data.cpfCnpj,
            phone: data.phone,
            repasseLimpaNome: data.repasseLimpaNome,
            plano: data.plano
          };
          
          // Se o usuário tem a claim de admin mas o Firestore diz que é user, sincroniza o banco
          if (isAdminClaim && data.role !== 'admin' && data.role !== 'owner') {
             console.log("Syncing Firestore role with Admin Custom Claim...");
             await updateDoc(userDocRef, { role: 'admin' });
             userData.role = 'admin';
          }
          
          userData = await store.validateSubscription(userData);
          store.setUser(userData);
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          // Fallback if dates are corrupted
          store.setUser({
            id: firebaseUser.uid,
            name: data.name || 'Usuário',
            email: data.email || '',
            role: data.role || 'user',
            status: data.status || 'active',
            subscriptionExpiresAt: new Date(),
            createdAt: new Date(),
            onboardingCompleted: true
          });
        }
      } else {
        console.warn("User Profile MISSING in Firestore. Creating default...");
        // Auto-create profile for users that might have been created manually in Firebase Auth
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        const defaultProfile = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Novo Usuário',
          email: firebaseUser.email || '',
          role: 'user', // Default to user, admin can upgrade themselves in console later
          status: 'active',
          subscriptionExpiresAt: Timestamp.fromDate(expiryDate),
          createdAt: Timestamp.now(),
          onboardingCompleted: false
        };
        
        await setDoc(userDocRef, defaultProfile);
        
        store.setUser({
          id: firebaseUser.uid,
          ...defaultProfile,
          subscriptionExpiresAt: expiryDate,
          createdAt: new Date()
        } as User);
      }
      
      // Setup real-time listener for subsequent changes
      unsubUser = onSnapshot(userDocRef, async (snapshot) => {
        if (snapshot.exists()) {
          const updatedData = snapshot.data();
          
          try {
            // Se o papel no Firestore for 'user' mas já somos 'admin'/'owner' via Claims, mantemos o nível elevado
            let finalRole = updatedData.role || 'user';
            
            // Re-verificamos claims se houver dúvida ou para garantir persistência
            if (finalRole === 'user') {
              const tokenResult = await firebaseUser.getIdTokenResult(true); // force refresh
              if (tokenResult.claims.admin) finalRole = 'admin';
              if (tokenResult.claims.owner) finalRole = 'owner';
            }

            const userState: User = {
              id: firebaseUser.uid,
              name: updatedData.name || '',
              email: updatedData.email || '',
              role: finalRole as any,
              status: updatedData.status || 'active',
              subscriptionExpiresAt: updatedData.subscriptionExpiresAt?.toDate() || new Date(),
              createdAt: updatedData.createdAt?.toDate() || new Date(),
              onboardingCompleted: updatedData.onboardingCompleted || false,
              cpfCnpj: updatedData.cpfCnpj,
              phone: updatedData.phone,
              repasseLimpaNome: updatedData.repasseLimpaNome,
              plano: updatedData.plano
            };
            store.setUser(userState);
          } catch (snapError) {
            console.error("Error in onSnapshot data parse:", snapError);
          }
        }
      });
    } catch (firebaseError: any) {
      console.error("Firestore error in auth listener:", firebaseError);
      if (firebaseError.message?.includes('permissions')) {
        toast.error('Erro de permissão ao carregar seu perfil.');
      }
    }
  } else {
    console.log("Auth State Changed: User Logged Out");
    store.setUser(null);
  }
  store.setLoading(false);
});
