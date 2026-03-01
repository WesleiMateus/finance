import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Target, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name || !targetAmount || !deadline) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'goals'), {
        userId: user.id,
        name,
        targetAmount: Number(targetAmount),
        currentAmount: 0,
        deadline: Timestamp.fromDate(deadline!),
        createdAt: Timestamp.now(),
        color: '#a855f7' // Default purple color for goals
      });
      
      toast.success('Meta criada com sucesso');
      onSuccess();
      onOpenChange(false);
      
      // Reset
      setName('');
      setTargetAmount('');
      setDeadline(new Date());
    } catch (err: any) {
      toast.error('Falha ao adicionar meta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target size={20} />
            </div>
            <DialogTitle>Nova Meta Financeira</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Meta</Label>
            <Input 
              placeholder="Ex: Viagem, Reserva de Emergência" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Valor Alvo (R$)</Label>
            <Input 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Prazo / Data Limite</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Meta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
