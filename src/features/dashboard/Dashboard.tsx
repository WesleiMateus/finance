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

  if (loading) {
    return <div className="p-8 text-center text-foreground/50">Carregando Dados Financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-foreground/70">Bem-vindo de volta, aqui está sua visão financeira geral.</p>
        </div>
        <div className="flex items-center gap-4">
          {user?.status === 'pending' && (
            <div className="px-3 py-1 bg-destructive/10 text-destructive text-sm font-medium rounded-full border border-destructive/20 shadow-sm animate-pulse">
              Pagamento Pendente - Somente Leitura
            </div>
          )}
          {user?.status === 'blocked' && (
            <div className="px-3 py-1 bg-destructive text-destructive-foreground text-sm font-medium rounded-full shadow-sm animate-pulse">
              Conta Bloqueada
            </div>
          )}
          <Button onClick={() => setModalOpen(true)} disabled={user?.status === 'pending' || user?.status === 'blocked'}>
            + Nova Transação
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${consolidatedBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {consolidatedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Acompanhamento da Meta Mensal (Receita)</CardTitle>
               <CardDescription>Alvo: {monthlyTarget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex justify-between text-xs mb-2 text-foreground/70">
                  <span>{currentMonthIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                  <span>{monthlyProgress.toFixed(1)}%</span>
               </div>
               <Progress value={monthlyProgress} className="h-2 bg-muted" />
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Acompanhamento da Meta Anual</CardTitle>
               <CardDescription>{mainGoal?.name || 'Renda Anual'}: {annualTarget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex justify-between text-xs mb-2 text-foreground/70">
                  <span>{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                  <span>{annualProgress.toFixed(1)}%</span>
               </div>
               <Progress value={annualProgress} className="h-2 bg-muted" />
            </CardContent>
         </Card>
      </div>

      {/* Charts Layer 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
            <CardDescription>Métrica de comparação do ciclo financeiro</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}/>
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição dos seus gastos</CardDescription>
          </CardHeader>
          <CardContent className="h-72 relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}/>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="text-muted-foreground flex items-center justify-center h-full">Sem despesas para mostrar</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Evolution Chart */}
      <Card>
         <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>Desempenho financeiro histórico dos últimos 6 meses</CardDescription>
         </CardHeader>
         <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={monthlyEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}/>
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{r: 4}} name="Receita" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} name="Despesa" />
                  <Line type="monotone" dataKey="balance" stroke="#a855f7" strokeWidth={3} dot={{r: 4}} name="Saldo Líquido" />
               </LineChart>
            </ResponsiveContainer>
         </CardContent>
      </Card>

      {/* Recent Transactions List */}
      <Card>
         <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors rounded-lg">
                     <div className="flex flex-col">
                       <span className="font-medium">{tx.description || tx.category}</span>
                       <span className="text-xs text-muted-foreground">{tx.date.toLocaleDateString('pt-BR')} • {tx.type === 'income' ? 'Receita' : tx.type === 'expense' ? 'Despesa' : tx.type === 'recurring' ? 'Recorrente' : 'Parcelamento'}</span>
                     </div>
                     <span className={`font-bold ${tx.type === 'income' || tx.type === 'recurring' ? 'text-green-500' : 'text-foreground'}`}>
                       {tx.type === 'income' || tx.type === 'recurring' ? '+' : '-'}{tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </span>
                  </div>
               ))}
               {transactions.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg border-border">Nenhuma transação ainda.</div>
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
