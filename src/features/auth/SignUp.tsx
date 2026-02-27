import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      navigate('/');
    } catch (error: any) {
      toast.error('Falha ao criar conta: ' + (error.message || 'Erro desconhecido'));
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Crie sua Conta</h2>
      <p className="text-sm text-foreground/60 mb-6">Insira seus dados para se registrar na Aurora Finance.</p>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input 
            id="name"
            type="text" 
            placeholder="João Silva" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input 
            id="email"
            type="email" 
            placeholder="voce@exemplo.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input 
            id="password"
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full mt-4" 
          disabled={loading}
        >
          {loading ? 'Criando Conta...' : 'Cadastrar'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-foreground/70">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};
