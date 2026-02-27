import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import type { Transaction } from '../../types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { TransactionModal } from '../dashboard/TransactionModal';
import { toast } from 'sonner';
import { Trash2, Filter, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { transactions, setTransactions, deleteTransaction } = useFinanceStore();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all'); // Default to all months
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const fetchTransactions = async () => {
    if (!user) {
      console.warn("TransactionsPage: No user found, skipping fetch");
      return;
    }
    try {
      console.log("TransactionsPage: Fetching for user", user.id);
      setLoading(true);
      const q = query(collection(db, 'transactions'), where('userId', '==', user.id));
      const snap = await getDocs(q);
      console.log("TransactionsPage: Snap size", snap.size);
      
      const fetched: Transaction[] = [];
      snap.forEach(d => {
        const data = d.data();
        try {
          fetched.push({
            id: d.id,
            userId: data.userId,
            type: data.type,
            amount: Number(data.amount),
            category: data.category || 'Outros',
            date: data.date?.toDate() || new Date(),
            description: data.description || 'S/ Descrição',
            createdAt: data.createdAt?.toDate() || new Date()
          });
        } catch (innerErr) {
          console.error("TransactionsPage: Error parsing doc", d.id, innerErr);
        }
      });
      
      fetched.sort((a, b) => b.date.getTime() - a.date.getTime());
      console.log("TransactionsPage: Total fetched items", fetched.length);
      setTransactions(fetched);
    } catch (err: any) {
      console.error("TransactionsPage: Fetch error", err);
      toast.error('Erro ao carregar transações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("TransactionsPage: Mounted");
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      deleteTransaction(id);
      toast.success('Transação excluída com sucesso');
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesMonth = monthFilter === 'all' || t.date.getMonth().toString() === monthFilter;
    const matchesYear = yearFilter === 'all' || t.date.getFullYear().toString() === yearFilter;
    
    return matchesSearch && matchesType && matchesMonth && matchesYear;
  });

  const periodIncome = filteredTransactions
    .filter(t => t.type === 'income' || t.type === 'recurring')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const periodExpense = filteredTransactions
    .filter(t => t.type === 'expense' || t.type === 'installment')
    .reduce((acc, t) => acc + t.amount, 0);

  const months = [
    { value: 'all', label: 'Todos os Meses' },
    { value: '0', label: 'Janeiro' },
    { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' },
    { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' },
    { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' },
    { value: '11', label: 'Dezembro' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-foreground/70">Gerencie seu histórico financeiro detalhadamente.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nova Transação</Button>
      </div>

      {/* Summary Cards for Filtered Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Receitas do Período</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {periodIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Despesas do Período</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {periodExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Saldo do Período</p>
                <p className="text-2xl font-bold text-primary">
                  {(periodIncome - periodExpense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <Filter className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter size={18} /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Busca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="installment">Parcelamento</SelectItem>
                  <SelectItem value="recurring">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium">Data</th>
                  <th className="text-left p-4 font-medium">Descrição</th>
                  <th className="text-left p-4 font-medium">Categoria</th>
                  <th className="text-left p-4 font-medium text-right">Valor</th>
                  <th className="text-right p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 whitespace-nowrap">{tx.date.toLocaleDateString('pt-BR')}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{tx.description}</span>
                        <span className="text-xs text-muted-foreground capitalize">{tx.type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-accent rounded-full text-xs">{tx.category}</span>
                    </td>
                    <td className={`p-4 text-right font-bold ${tx.type === 'income' || tx.type === 'recurring' ? 'text-green-500' : 'text-foreground'}`}>
                      {tx.type === 'income' || tx.type === 'recurring' ? '+' : '-'}{tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                      {loading ? 'Carregando...' : 'Nenhuma transação encontrada para os filtros selecionados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TransactionModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        onSuccess={fetchTransactions}
      />
    </div>
  );
};
