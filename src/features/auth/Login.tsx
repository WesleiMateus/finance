import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, RefreshCw, LogIn } from 'lucide-react';
import { useGsapStagger } from '../../hooks/useGsap';

export const Login: React.FC = () => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully logged in');
      // Navigation is now handled by the useEffect above
    } catch (error: any) {
      toast.error('Failed to log in: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const containerRef = useGsapStagger('.reveal-item', 0.1, 0.1);

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="reveal-item space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-gradient">Bem-vindo de volta</h2>
        <p className="text-sm font-medium text-muted-foreground">Insira suas credenciais para acessar o painel.</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-6 reveal-item">
        <div className="space-y-4">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest ml-1 opacity-70 group-focus-within:text-primary transition-colors">E-mail Corporativo</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 group-focus-within:text-primary transition-colors" />
              <Input 
                id="email"
                type="email" 
                placeholder="nome@empresa.com" 
                className="pl-11 h-12 glass border-white/10 focus-visible:ring-primary focus-visible:border-primary/50 transition-all font-medium rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest opacity-70 group-focus-within:text-primary transition-colors">Senha de Acesso</Label>
              <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Esqueceu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 group-focus-within:text-primary transition-colors" />
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
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
              <span>Verificando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn size={18} />
              <span>Entrar no Sistema</span>
            </div>
          )}
        </Button>
      </form>

      <div className="reveal-item pt-4 text-center">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Novo por aqui?{' '}
          <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors ml-1">
            Criar conta master
          </Link>
        </p>
      </div>
    </div>
  );
};
