import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Target, Plus, Pencil, Trash2, Calendar, DollarSign } from 'lucide-react';
import { GoalModal } from '../dashboard/GoalModal';
import { db } from '../../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGsapStagger } from '../../hooks/useGsap';

export const PlanningPage: React.FC = () => {
  const { goals, deleteGoal } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  
  const containerRef = useGsapStagger('.goal-card', 0.1, 0.1);

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta meta?')) return;
    
    try {
      await deleteDoc(doc(db, 'goals', id));
      deleteGoal(id);
      toast.success('Meta excluída com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir meta');
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  return (
    <div ref={containerRef} className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Planejamento & Metas</h1>
          <p className="text-muted-foreground font-medium">Transforme seus sonhos em objetivos alcançáveis.</p>
        </div>
        <Button 
          onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
        >
          <Plus className="mr-2 h-5 w-5" /> Nova Meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="glass-card flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
            <Target size={48} />
          </div>
          <CardTitle className="text-xl mb-2">Nenhuma meta definida</CardTitle>
          <CardDescription className="max-w-xs mb-6 font-medium">
            Você ainda não criou nenhuma meta financeira. Comece definindo seu primeiro objetivo!
          </CardDescription>
          <Button onClick={() => setIsModalOpen(true)} variant="outline" className="font-bold">
            Criar Minha Primeira Meta
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="goal-card glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge 
                      variant="outline" 
                      className="text-[10px] uppercase font-bold tracking-widest"
                      style={{ color: goal.color, borderColor: `${goal.color}33`, backgroundColor: `${goal.color}11` }}
                    >
                      Financeiro
                    </Badge>
                    <CardTitle className="text-xl font-bold line-clamp-1">{goal.name}</CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditGoal(goal)}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteGoal(goal.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-primary">{calculateProgress(goal.currentAmount, goal.targetAmount)}%</span>
                  </div>
                  <Progress 
                    value={calculateProgress(goal.currentAmount, goal.targetAmount)} 
                    className="h-2.5 bg-muted"
                    style={{ '--progress-background': goal.color } as any}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <DollarSign size={10} /> Atual
                    </span>
                    <p className="font-bold text-sm">
                      {goal.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Target size={10} /> Alvo
                    </span>
                    <p className="font-bold text-sm">
                      {goal.targetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Calendar size={14} className="text-primary" />
                    <span>Prazo: {format(goal.deadline, 'dd MMM yyyy', { locale: ptBR })}</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer" onClick={() => handleEditGoal(goal)}>
                    Contribuir
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GoalModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={() => {}} 
        editingGoal={editingGoal}
      />
    </div>
  );
};
