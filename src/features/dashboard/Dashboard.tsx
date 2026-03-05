import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Transaction, Goal } from '../../types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useGsapStagger, useGsapReveal } from '../../hooks/useGsap';
import { 
  Wallet, TrendingUp, TrendingDown, Target, ArrowUpRight, 
  Search, Filter, Sparkles, ArrowDownRight, Zap, Info
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { transactions, setTransactions, consolidatedBalance, goals, setGoals, refreshCounter } = useFinanceStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [timeRange, setTimeRange] = useState<'6M' | '1Y'>('6M');

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
  }, [user, refreshCounter]);

  // Derived Statistics with Memoization
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income' || t.type === 'recurring').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense' || t.type === 'installment').reduce((acc, t) => acc + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    
    // Sparkline data (dynamic range based on timeRange state)
    const rangeMonths = timeRange === '6M' ? 6 : 12;
    const items = [];
    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toLocaleDateString('pt-BR', { month: 'short' });
      const fullDateStr = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const monthIncome = transactions
        .filter(t => (t.type === 'income' || t.type === 'recurring') && 
          t.date.getMonth() === d.getMonth() && t.date.getFullYear() === d.getFullYear())
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthExpense = transactions
        .filter(t => (t.type === 'expense' || t.type === 'installment') && 
          t.date.getMonth() === d.getMonth() && t.date.getFullYear() === d.getFullYear())
        .reduce((sum, t) => sum + t.amount, 0);
        
      items.push({ 
        name: mStr, 
        fullName: fullDateStr,
        income: monthIncome, 
        expense: monthExpense, 
        balance: monthIncome - monthExpense 
      });
    }

    return { totalIncome, totalExpense, savingsRate, sparklineData: items };
  }, [transactions, timeRange]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = (tx.description || tx.category).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'income' && (tx.type === 'income' || tx.type === 'recurring')) ||
      (activeFilter === 'expense' && (tx.type === 'expense' || tx.type === 'installment'));
    return matchesSearch && matchesFilter;
  });

  const expenseByCategory = transactions
    .filter(t => t.type === 'expense' || t.type === 'installment')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expenseByCategory).map((k, i) => ({
    name: k,
    value: expenseByCategory[k],
    fill: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][i % 5]
  }));

  // Insights Logic
  const insights = useMemo(() => {
    const list = [];
    if (stats.savingsRate > 30) list.push({ icon: <Sparkles className="text-amber-400" />, text: "Taxa de economia incrível! Você está no caminho certo." });
    if (stats.totalExpense > stats.totalIncome) list.push({ icon: <Zap className="text-rose-500" />, text: "Alerta: Seus gastos superaram sua receita este mês." });
    if (goals.some(g => (g.currentAmount / g.targetAmount) > 0.9)) list.push({ icon: <Target className="text-primary" />, text: "Você está quase atingindo um de seus objetivos!" });
    return list.length ? list : [{ icon: <Info className="text-blue-400" />, text: "Continue registrando suas transações para insights personalizados." }];
  }, [stats, goals]);

  const containerRef = useGsapStagger('.reveal-item', 0.1, 0.1);
  const headerRef = useGsapReveal(0);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-bold tracking-tight text-gradient">AURORA ESTÁ ACORDANDO...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8 pb-20 font-sans">
      {/* Header section */}
      <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gradient leading-none">Minha Aurora</h1>
             <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black tracking-widest uppercase py-1">Premium</Badge>
          </div>
          <p className="text-muted-foreground font-medium text-sm md:text-base">Bem-vindo de volta, {user?.name?.split(' ')[0]}. Veja sua saúde financeira hoje.</p>
        </div>
      </div>

      {/* Aurora Insights Bar */}
      <div className="reveal-item flex scrollbar-none overflow-x-auto gap-4 pb-2">
        {insights.map((insight, idx) => (
          <div 
            key={idx} 
            className="flex-shrink-0 flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 pr-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group active:scale-95"
            onClick={() => toast.success(insight.text)}
          >
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 group-hover:scale-110 group-hover:bg-primary/5 transition-all">
              {insight.icon}
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{insight.text}</span>
          </div>
        ))}
      </div>

      {/* Premium Summary Cards - Re-engineered for compactness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 reveal-item">
        {[
          { 
            title: 'Patrimônio', 
            val: consolidatedBalance, 
            color: consolidatedBalance >= 0 ? 'text-primary' : 'text-rose-500', 
            icon: <Wallet className="size-4 text-primary" />,
            dataKey: 'balance',
            chartColor: '#3b82f6',
            label: 'Total'
          },
          { 
            title: 'Receita', 
            val: stats.totalIncome, 
            color: 'text-emerald-500', 
            icon: <TrendingUp className="size-4 text-emerald-500" />,
            dataKey: 'income',
            chartColor: '#10b981',
            label: 'Este Mês'
          },
          { 
            title: 'Despesas', 
            val: stats.totalExpense, 
            color: 'text-rose-500', 
            icon: <TrendingDown className="size-4 text-rose-500" />,
            dataKey: 'expense',
            chartColor: '#ef4444',
            label: 'Este Mês'
          },
          { 
            title: 'Economia', 
            val: `${stats.savingsRate.toFixed(1)}%`, 
            color: 'text-amber-500', 
            icon: <Zap className="size-4 text-amber-500" />,
            dataKey: 'balance', 
            chartColor: '#f59e0b',
            label: 'Taxa'
          }
        ].map((c, i) => (
          <Card 
            key={i} 
            className="glass-card group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer active:scale-[0.98] border-none"
            onClick={() => navigate('/transactions')}
          >
            <CardContent className="p-4 flex flex-col justify-between h-[100px] relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 shadow-sm group-hover:scale-110 transition-transform">
                    {c.icon}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tighter text-muted-foreground/80">{c.title}</span>
                </div>
                <Badge variant="ghost" className="text-[8px] opacity-30 group-hover:opacity-100 transition-opacity font-bold uppercase p-0">{c.label}</Badge>
              </div>
              
              <div className={`text-xl font-black tracking-tight ${c.color} leading-none mb-1`}>
                {typeof c.val === 'number' ? c.val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : c.val}
              </div>

              <div className="h-6 w-full absolute bottom-0 left-0 opacity-40 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.sparklineData.slice(-7)}>
                    <defs>
                      <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c.chartColor} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={c.chartColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey={c.dataKey} 
                      stroke={c.chartColor} 
                      fill={`url(#grad-${i})`} 
                      strokeWidth={2} 
                      isAnimationActive={false} 
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-30" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 glass-card reveal-item border-none shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Análise de Fluxo</CardTitle>
              <CardDescription className="text-xs font-medium">Entradas vs Saídas no tempo</CardDescription>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <Button 
                variant="ghost" 
                onClick={() => setTimeRange('6M')}
                className={`h-8 px-3 text-[10px] font-bold rounded-lg transition-all ${timeRange === '6M' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'opacity-50 hover:opacity-100'}`}
              >
                6 MESES
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setTimeRange('1Y')}
                className={`h-8 px-3 text-[10px] font-bold rounded-lg transition-all ${timeRange === '1Y' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'opacity-50 hover:opacity-100'}`}
              >
                1 ANO
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-6 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sparklineData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dx={-10} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(val: number) => [val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), '']}
                  labelFormatter={(name, payload) => payload[0]?.payload?.fullName || name}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Intelligence Side */}
        <div className="space-y-6 reveal-item">
          <Card onClick={() => navigate('/transactions')} className="glass-card cursor-pointer group hover:border-primary/20 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 group-hover:text-primary transition-colors">
                <PieChart className="size-4" /> Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={10}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />)}
                  </Pie>
                  <RechartsTooltip formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-rose-500">{(stats.totalExpense / (stats.totalIncome || 1) * 100).toFixed(0)}%</span>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Gastos</span>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate('/planning')} className="glass-card border-none bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors group">
             <CardHeader className="p-5 pb-2">
               <div className="flex items-center gap-2 mb-1">
                 <Target className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                 <CardTitle className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">Top Objetivos</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="p-5 pt-0 space-y-4">
                {goals.slice(0, 2).map((goal, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                       <span className="truncate mr-2">{goal.name}</span>
                       <span className="text-primary">{((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2 rounded-full" />
                  </div>
                ))}
                {!goals.length && <p className="text-xs italic text-muted-foreground">Nenhuma meta ativa.</p>}
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Modern Transactions List with Search & Tabs */}
      <Card className="glass-card reveal-item border-none overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <CardTitle className="text-2xl font-black tracking-tighter">Transações</CardTitle>
             <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
               {(['all', 'income', 'expense'] as const).map(f => (
                 <button 
                  key={f} 
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all cursor-pointer ${activeFilter === f ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'opacity-40 hover:opacity-100'}`}
                 >
                   {f === 'all' ? 'Tudo' : f === 'income' ? 'Ganhos' : 'Gastos'}
                 </button>
               ))}
             </div>
          </div>
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-10 h-10 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-xl focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.slice(0, 8).map(tx => (
              <div 
                key={tx.id} 
                onClick={() => navigate('/transactions')}
                className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group cursor-pointer active:bg-slate-100 dark:active:bg-slate-900"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${tx.type === 'income' || tx.type === 'recurring' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {tx.type === 'income' || tx.type === 'recurring' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{tx.description || tx.category}</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60 flex items-center gap-1.5">
                      {tx.category} • {tx.date.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-sm ${tx.type === 'income' || tx.type === 'recurring' ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-100'}`}>
                    {tx.type === 'income' || tx.type === 'recurring' ? '+' : '-'}{tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <Badge variant="outline" className="text-[8px] font-black h-4 px-1 border-slate-200 dark:border-slate-800 text-muted-foreground uppercase">{tx.type}</Badge>
                </div>
              </div>
            ))}
            {!filteredTransactions.length && (
              <div className="py-20 text-center flex flex-col items-center gap-3 opacity-50">
                <Filter className="size-10 text-muted-foreground" />
                <p className="font-bold text-sm tracking-tight">Nenhuma transação encontrada</p>
                <button 
                  onClick={() => {setSearchQuery(''); setActiveFilter('all')}} 
                  className="text-xs font-black text-primary underline underline-offset-4 uppercase tracking-tighter cursor-pointer hover:opacity-80"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
          {filteredTransactions.length > 0 && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 text-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/transactions')}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:bg-transparent cursor-pointer hover:underline underline-offset-8"
              >
                Ver Histórico Completo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
