import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../services/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

export const Onboarding: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [income, setIncome] = useState('');
  const [objective, setObjective] = useState('');
  const [loading, setLoading] = useState(false);

  // If already completed, don't show
  if (user?.onboardingCompleted) {
    navigate('/');
    return null;
  }

  const handleSetup = async () => {
    if (!user) return;
    if (!income || !objective) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);

      // Create an initial income goal or goal record based on selection
      await addDoc(collection(db, 'goals'), {
        userId: user.id,
        name: 'Objetivo Principal: ' + objective,
        targetAmount: Number(income) * 12, // example annualized logic
        currentAmount: 0,
        deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        color: '#a855f7'
      });

      // Optionally record the income as a recurring transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.id,
        type: 'recurring',
        amount: Number(income),
        category: 'Salário/Renda',
        date: new Date(),
        description: 'Renda Principal',
        createdAt: new Date()
      });

      // Mark user as onboarded
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { onboardingCompleted: true });

      // Update local state
      setUser({ ...user, onboardingCompleted: true });
      
      toast.success('Configuração concluída! Bem-vindo(a) à Aurora.');
      navigate('/');
    } catch (err: any) {
      toast.error('Erro ao salvar as informações: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo à Aurora!</h1>
      <p className="text-foreground/70 max-w-md mb-8">
        Antes de começar a controlar suas finanças, vamos configurar suas informações iniciais.
      </p>
      
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md text-left">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meta de Renda Mensal</Label>
            <Input 
              type="number" 
              placeholder="Ex. 5000" 
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Objetivo Financeiro Principal</Label>
            <Select value={objective} onValueChange={setObjective} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Crescimento Agressivo">Crescimento Agressivo</SelectItem>
                <SelectItem value="Estabilidade Financeira">Estabilidade Financeira</SelectItem>
                <SelectItem value="Reservas de Caixa">Reservas de Caixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full mt-4" 
            onClick={handleSetup}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Concluir Configuração'}
          </Button>
        </div>
      </div>
    </div>
  );
};
