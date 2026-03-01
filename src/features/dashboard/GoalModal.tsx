import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Target, CalendarIcon, Palette, DollarSign, TrendingUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Goal } from '../../types';

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingGoal?: Goal | null;
}

const COLORS = [
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

export const GoalModal: React.FC<GoalModalProps> = ({ open, onOpenChange, onSuccess, editingGoal }) => {
  const { user } = useAuthStore();
  const { addGoal, updateGoal } = useFinanceStore();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(new Date());
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setTargetAmount(editingGoal.targetAmount.toString());
      setCurrentAmount(editingGoal.currentAmount?.toString() || '0');
      setDeadline(new Date(editingGoal.deadline));
      setColor(editingGoal.color || COLORS[0]);
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline(new Date());
      setColor(COLORS[0]);
    }
  }, [editingGoal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name || !targetAmount || !deadline) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const goalData = {
        userId: user.id,
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        deadline: Timestamp.fromDate(deadline!),
        color,
        updatedAt: Timestamp.now(),
      };

      if (editingGoal) {
        await updateDoc(doc(db, 'goals', editingGoal.id), goalData);
        updateGoal({
          ...editingGoal,
          ...goalData,
          deadline: deadline!,
        } as Goal);
        toast.success('Meta atualizada com sucesso');
      } else {
        const docRef = await addDoc(collection(db, 'goals'), {
          ...goalData,
          createdAt: Timestamp.now(),
        });
        addGoal({
          id: docRef.id,
          ...goalData,
          deadline: deadline!,
        } as Goal);
        toast.success('Meta criada com sucesso');
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro ao processar meta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden glass-card">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary animate-pulse">
              <Target size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}</DialogTitle>
              <DialogDescription className="text-xs font-medium">Defina seus objetivos e acompanhe seu progresso.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Nome da Meta</Label>
            <Input 
              placeholder="Ex: Reserva de Emergência, Viagem..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Valor Alvo</Label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="glass-input pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Valor Atual</Label>
              <div className="relative">
                <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="glass-input pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Prazo / Data Limite</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-bold glass-input h-11",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {deadline ? format(deadline, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-card" align="start">
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

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
              <Palette size={14} /> Cor de Identificação
            </Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                    color === c ? "border-white" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full h-12 mt-4 font-bold text-lg shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? 'Processando...' : editingGoal ? 'Salvar Alterações' : 'Criar Meta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
