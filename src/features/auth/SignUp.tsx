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
import { Loader2 } from 'lucide-react';

export const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        role: 'user',
        status: 'active',
        subscriptionExpiresAt: Timestamp.fromDate(expiryDate),
        createdAt: Timestamp.now(),
        onboardingCompleted: false
      });

      toast.success('Conta mestre criada com sucesso');
    } catch (error: any) {
      toast.error('Falha ao criar conta: ' + (error.message || 'Erro desconhecido'));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-6">
      <div className="mb-12">
        <h1 className="text-slate-900 dark:text-white text-3xl font-semibold">Faça parte de nosso time</h1>
        <p className="text-slate-600 dark:text-slate-400 text-[15px] mt-6 leading-relaxed">
          Crie sua conta hoje mesmo e comece sua jornada financeira conosco. Leva menos de um minuto.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="text-slate-900 dark:text-slate-200 text-sm font-medium mb-2 block">Nome Completo</Label>
          <div className="relative flex items-center">
            <Input 
              name="name" 
              type="text" 
              required 
              className="w-full text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 pl-4 pr-10 py-3 h-10 rounded-md outline-blue-600 bg-transparent" 
              placeholder="Como deseja ser chamado?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="#bbb" stroke="#bbb" className="w-[18px] h-[18px] absolute right-4" viewBox="0 0 24 24">
              <circle cx="10" cy="7" r="6" data-original="#000000"></circle>
              <path d="M14 15H6a5 5 0 0 0-5 5 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 5 5 0 0 0-5-5zm8-4h-2.59l.3-.29a1 1 0 0 0-1.42-1.42l-2 2a1 1 0 0 0 0 1.42l2 2a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-.3-.29H22a1 1 0 0 0 0-2z" data-original="#000000"></path>
            </svg>
          </div>
        </div>

        <div>
          <Label className="text-slate-900 dark:text-slate-200 text-sm font-medium mb-2 block">E-mail de Trabalho</Label>
          <div className="relative flex items-center">
            <Input 
              name="email" 
              type="email" 
              required 
              className="w-full text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 pl-4 pr-10 py-3 h-10 rounded-md outline-blue-600 bg-transparent" 
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="#bbb" stroke="#bbb" className="w-[18px] h-[18px] absolute right-4" viewBox="0 0 24 24">
              <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" data-original="#000000"></path>
            </svg>
          </div>
        </div>

        <div>
          <Label className="text-slate-900 dark:text-slate-200 text-sm font-medium mb-2 block">Senha Segura</Label>
          <div className="relative flex items-center">
            <Input 
              name="password" 
              type="password" 
              required 
              className="w-full text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 pl-4 pr-10 py-3 h-10 rounded-md outline-blue-600 bg-transparent" 
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="#bbb" stroke="#bbb" className="w-[18px] h-[18px] absolute right-4 cursor-pointer" viewBox="0 0 128 128">
              <path d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z" data-original="#000000"></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="!mt-12">
        <Button 
          type="submit" 
          className="w-full shadow-xl py-5 px-4 text-[15px] font-medium tracking-wide rounded-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin size-4" />
              <span>Criando...</span>
            </div>
          ) : (
            'Criar minha conta'
          )}
        </Button>
        <p className="text-sm !mt-6 text-center text-slate-600 dark:text-slate-400">
          Possui uma conta? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline ml-1 whitespace-nowrap">Entrar</Link>
        </p>
      </div>
    </form>
  );
};
