import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Transaction, Goal } from '../../types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { TransactionModal } from './TransactionModal';
import { toast } from 'sonner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { useGsapStagger, useGsapReveal } from '../../hooks/useGsap';
import { Wallet, TrendingUp, TrendingDown, Target, CalendarDays, ArrowUpRight, Plus } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { transactions, setTransactions, consolidatedBalance, goals, setGoals } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', user.id));
      const txSnap = await getDocs(txQuery);
      const fetchedTx: Transaction[] = [];
      txSnap.forEach(d => {
        const data = d.data();
        fetchedTx.push({
          id: d.id,
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          category: data.category,
          date: data.date.toDate(),
          description: data.description,
          createdAt: data.createdAt.toDate()
        });
      });
      fetchedTx.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      const goalsQuery = query(collection(db, 'goals'), where('userId', '==', user.id));
      const goalsSnap = await getDocs(goalsQuery);
      const fetchedGoals: Goal[] = [];
      goalsSnap.forEach(d => {
        const data = d.data();
        fetchedGoals.push({
          id: d.id,
          userId: data.userId,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount || 0,
          deadline: data.deadline.toDate(),
          color: data.color
        });
      });

      setTransactions(fetchedTx);
      setGoals(fetchedGoals);
    } catch (err: any) {
      toast.error('Falha ao buscar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Derived Statistics
  const totalIncome = transactions.filter(t => t.type === 'income' || t.type === 'recurring').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense' || t.type === 'installment').reduce((acc, t) => acc + t.amount, 0);

  // Category specific expenses
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense' || t.type === 'installment')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expenseByCategory).map((k, i) => ({
    name: k,
    value: expenseByCategory[k],
    fill: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'][i % 7]
  }));

  const incomeExpenseData = [
    { name: 'Receita', amount: totalIncome, fill: '#10b981' },
    { name: 'Despesa', amount: totalExpense, fill: '#ef4444' }
  ];

  // Monthly Evolution Data
  const monthlyDataMap = new Map<string, { month: string, balance: number, income: number, expense: number }>();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStr = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    monthlyDataMap.set(mStr, { month: mStr, balance: 0, income: 0, expense: 0 });
  }

  // Calculate cumulative per month
  transactions.forEach(t => {
    const mStr = t.date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    if (monthlyDataMap.has(mStr)) {
      const data = monthlyDataMap.get(mStr)!;
      if (t.type === 'income' || t.type === 'recurring') {
        data.income += t.amount;
        data.balance += t.amount;
      } else {
        data.expense += t.amount;
        data.balance -= t.amount;
      }
    }
  });
  const monthlyEvolutionData = Array.from(monthlyDataMap.values());

  // Goal Tracking
  const mainGoal = goals.find(g => g.name.startsWith('Objetivo Principal')) || goals[0];
  const annualTarget = mainGoal?.targetAmount || 0;
  const annualProgress = annualTarget > 0 ? Math.min(100, (totalIncome / annualTarget) * 100) : 0;
  
  // Approximate Monthly Target
  const monthlyTarget = annualTarget / 12;
  // Get current month income
  const currentMonthStr = new Date().toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  const currentMonthIncome = monthlyDataMap.get(currentMonthStr)?.income || 0;
  const monthlyProgress = monthlyTarget > 0 ? Math.min(100, (currentMonthIncome / monthlyTarget) * 100) : 0;

  const containerRef = useGsapStagger('.reveal-item', 0.1, 0.1);
  const headerRef = useGsapReveal(0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Sincronizando seus dados financeiros...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8 pb-12">
      {/* Header section */}
      <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Dashboard</h1>
          <p className="text-muted-foreground font-medium">Bem-vindo de volta! Aqui está sua visão financeira premium.</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.status === 'pending' && (
            <Badge variant="destructive" className="animate-pulse py-1.5 px-4 shadow-lg shadow-destructive/20">
              Pagamento Pendente
            </Badge>
          )}
          {user?.status === 'blocked' && (
            <Badge variant="destructive" className="py-1.5 px-4">Conta Bloqueada</Badge>
          )}
          
          <Button 
            onClick={() => setModalOpen(true)} 
            disabled={user?.status === 'pending' || user?.status === 'blocked'}
            className="gap-2 h-11 px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} /> Nova Transação
          </Button>
        </div>
      </div>
      
      {/* Visual Alerts - Balance Warning */}
      {consolidatedBalance < 0 && (
         <div className="p-4 bg-destructive/15 border border-destructive/30 rounded-xl text-destructive font-medium">
            Alerta: Seu saldo consolidado está abaixo de zero. Por favor, revise suas despesas recentes.
         </div>
      )}

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-item">
        <Card className="glass-card overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Saldo Consolidado</CardTitle>
            <Wallet className="w-5 h-5 text-primary opacity-70 group-hover:scale-125 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-extrabold tracking-tight ${consolidatedBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {consolidatedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Saldo atual em todas as contas</p>
          </CardContent>
          <div className="h-1 w-full bg-linear-to-r from-primary/50 to-transparent absolute bottom-0" />
        </Card>

        <Card className="glass-card overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Receita Total</CardTitle>
            <TrendingUp className="w-5 h-5 text-emerald-500 opacity-70 group-hover:scale-125 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold tracking-tight text-emerald-500">
              {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="flex items-center gap-1 text-emerald-500/80 text-xs font-bold mt-2">
              <ArrowUpRight size={14} /> Total acumulado
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Despesas Totais</CardTitle>
            <TrendingDown className="w-5 h-5 text-rose-500 opacity-70 group-hover:scale-125 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold tracking-tight text-rose-500">
              {totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-rose-500/80 mt-2 font-bold">Saídas totais do período</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal-item">
         <Card className="glass-card border-l-4 border-l-primary/40">
            <CardHeader className="pb-2">
               <div className="flex items-center gap-2 mb-1">
                 <Target className="w-4 h-4 text-primary" />
                 <CardTitle className="text-sm font-bold uppercase tracking-wide">Meta Mensal de Receita</CardTitle>
               </div>
               <CardDescription className="font-medium text-xs">Alvo: {monthlyTarget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex justify-between text-xs mb-2 font-bold">
                  <span className="text-muted-foreground">{currentMonthIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                  <span className="text-primary">{monthlyProgress.toFixed(1)}%</span>
               </div>
               <Progress value={monthlyProgress} className="h-2.5 bg-muted rounded-full" />
            </CardContent>
         </Card>
         <Card className="glass-card border-l-4 border-l-emerald-500/40">
            <CardHeader className="pb-2">
               <div className="flex items-center gap-2 mb-1">
                 <CalendarDays className="w-4 h-4 text-emerald-500" />
                 <CardTitle className="text-sm font-bold uppercase tracking-wide">Planejamento Anual</CardTitle>
               </div>
               <CardDescription className="font-medium text-xs">{mainGoal?.name || 'Renda Anual'}: {annualTarget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex justify-between text-xs mb-2 font-bold">
                  <span className="text-muted-foreground">{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                  <span className="text-emerald-500">{annualProgress.toFixed(1)}%</span>
               </div>
               <Progress value={annualProgress} className="h-2.5 bg-muted rounded-full" />
            </CardContent>
         </Card>
      </div>

      {/* Charts Layer 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 reveal-item">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Receitas vs Despesas</span>
            </CardTitle>
            <CardDescription className="font-medium">Métrica de comparação do ciclo financeiro</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-[11px] font-bold" />
                <YAxis axisLine={false} tickLine={false} className="text-[11px] font-bold" />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              <span>Despesas por Categoria</span>
            </CardTitle>
            <CardDescription className="font-medium">Distribuição dos seus gastos</CardDescription>
          </CardHeader>
          <CardContent className="h-72 relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip 
                    contentStyle={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px' 
                    }}
                  />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="text-muted-foreground flex items-center justify-center h-full font-medium italic">Nenhuma despesa registrada</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Evolution Chart */}
      <Card className="glass-card reveal-item">
         <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gradient">
              <LineChart className="w-5 h-5 text-primary" />
              <span>Evolução Mensal</span>
            </CardTitle>
            <CardDescription className="font-medium">Desempenho histórico dos últimos 6 meses</CardDescription>
         </CardHeader>
         <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={monthlyEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-[11px] font-bold" />
                  <YAxis axisLine={false} tickLine={false} className="text-[11px] font-bold" />
                  <RechartsTooltip 
                    contentStyle={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px' 
                    }}
                  />
                  <Line type="monotone" dataKey="income" stroke="oklch(0.65 0.20 150)" strokeWidth={4} dot={{r: 5, fill: 'oklch(0.65 0.20 150)'}} name="Receita" />
                  <Line type="monotone" dataKey="expense" stroke="oklch(0.60 0.22 25)" strokeWidth={4} dot={{r: 5, fill: 'oklch(0.60 0.22 25)'}} name="Despesa" />
                  <Line type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={4} dot={{r: 5, fill: 'var(--primary)'}} name="Saldo Líquido" />
               </LineChart>
            </ResponsiveContainer>
         </CardContent>
      </Card>

      {/* Recent Transactions List */}
      <Card className="glass-card reveal-item">
         <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">Transações Recentes</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5">Ver todas</Button>
         </CardHeader>
         <CardContent>
            <div className="space-y-3">
               {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="group flex items-center justify-between p-4 glass rounded-2xl border-white/5 hover:border-primary/30 hover:scale-[1.01] transition-all duration-300">
                     <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl ${tx.type === 'income' || tx.type === 'recurring' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                         {tx.type === 'income' || tx.type === 'recurring' ? <ArrowUpRight size={20} /> : <TrendingDown size={20} />}
                       </div>
                       <div className="flex flex-col">
                         <span className="font-bold text-sm tracking-tight">{tx.description || tx.category}</span>
                         <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-50">
                            <span>{tx.date.toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span className="text-primary">{tx.category}</span>
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className={`font-black text-lg ${tx.type === 'income' || tx.type === 'recurring' ? 'text-emerald-500' : 'text-foreground'}`}>
                         {tx.type === 'income' || tx.type === 'recurring' ? '+' : '-'}{tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                       </div>
                       <Badge variant="outline" className="text-[9px] h-4 font-bold border-primary/20 text-primary/70">{tx.type}</Badge>
                     </div>
                  </div>
               ))}
               {transactions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-3xl border-border/50 font-medium">
                    <p>Sua jornada financeira começa aqui.</p>
                    <p className="text-xs opacity-60">Adicione sua primeira transação.</p>
                  </div>
               )}
            </div>
         </CardContent>
      </Card>

      <TransactionModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        onSuccess={fetchFinanceData}
      />
    </div>
  );
};
