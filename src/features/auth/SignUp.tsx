import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useGsapStagger } from '../../hooks/useGsap';
import { Mail, Lock, User, RefreshCw, ArrowRight } from 'lucide-react';

export const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Handle automatic redirect after store sync
  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 30 days initial access
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Create firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        role: 'user', // default role
        status: 'active', // default status
        subscriptionExpiresAt: Timestamp.fromDate(expiryDate),
        createdAt: Timestamp.now(),
        onboardingCompleted: false
      });

      toast.success('Conta criada com sucesso');
      // Navigation is now handled by the useEffect above
    } catch (error: any) {
      toast.error('Falha ao criar conta: ' + (error.message || 'Erro desconhecido'));
      setLoading(false);
    }
  };

  const containerRef = useGsapStagger('.reveal-item', 0.1, 0.1);

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="reveal-item space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-gradient">Criar conta master</h2>
        <p className="text-sm font-medium text-muted-foreground">Comece a gerenciar suas finanças de forma inteligente.</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-5 reveal-item">
        <div className="space-y-4">
          <div className="space-y-2 group">
            <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest ml-1 opacity-70 group-focus-within:text-primary transition-colors">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 group-focus-within:text-primary transition-colors" />
              <Input 
                id="name"
                placeholder="Como quer ser chamado?" 
                className="pl-11 h-12 glass border-white/10 focus-visible:ring-primary focus-visible:border-primary/50 transition-all font-medium rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest ml-1 opacity-70 group-focus-within:text-primary transition-colors">E-mail Corporativo</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 group-focus-within:text-primary transition-colors" />
              <Input 
                id="email"
                type="email" 
                placeholder="exemplo@empresa.com" 
                className="pl-11 h-12 glass border-white/10 focus-visible:ring-primary focus-visible:border-primary/50 transition-all font-medium rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest ml-1 opacity-70 group-focus-within:text-primary transition-colors">Senha de Acesso</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 group-focus-within:text-primary transition-colors" />
              <Input 
                id="password"
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                className="pl-11 h-12 glass border-white/10 focus-visible:ring-primary focus-visible:border-primary/50 transition-all font-medium rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 mt-4 font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all rounded-xl" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="animate-spin size-4" />
              <span>Processando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Finalizar Cadastro</span>
              <ArrowRight size={18} />
            </div>
          )}
        </Button>
      </form>

      <div className="reveal-item pt-4 text-center border-t border-white/5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Já tem acesso?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 transition-colors ml-1 font-black">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
};
