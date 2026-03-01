import React, { useState, useEffect, useMemo } from 'react';
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
import { 
  Dialog, DialogContent, DialogTitle, 
  DialogDescription, DialogFooter 
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Trash2, ArrowUpCircle, ArrowDownCircle, Search, 
  Calendar, Tag, Landmark, Receipt,
  Download, FilterX, X, AlertTriangle
} from 'lucide-react';
import { useGsapReveal, useGsapStagger } from '../../hooks/useGsap';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { transactions, setTransactions, deleteTransaction, refreshCounter } = useFinanceStore();
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all'); 
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'transactions'), where('userId', '==', user.id));
      const snap = await getDocs(q);
      
      const fetched: Transaction[] = [];
      snap.forEach(d => {
        const data = d.data();
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
      });
      
      fetched.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTransactions(fetched);
    } catch (err: any) {
      toast.error('Erro ao carregar transações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user, refreshCounter]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'transactions', deleteId));
      deleteTransaction(deleteId);
      toast.success('Transação excluída com sucesso');
      setDeleteId(null);
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = t.description.toLowerCase().includes(search) || 
                           t.category.toLowerCase().includes(search);
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesMonth = monthFilter === 'all' || t.date.getMonth().toString() === monthFilter;
      const matchesYear = yearFilter === 'all' || t.date.getFullYear().toString() === yearFilter;
      
      return matchesSearch && matchesType && matchesMonth && matchesYear;
    });
  }, [transactions, searchTerm, typeFilter, monthFilter, yearFilter]);

  const periodIncome = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === 'income' || t.type === 'recurring')
      .reduce((acc, t) => acc + t.amount, 0),
    [filteredTransactions]
  );
  
  const periodExpense = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === 'expense' || t.type === 'installment')
      .reduce((acc, t) => acc + t.amount, 0),
    [filteredTransactions]
  );

  const months = [
    { value: 'all', label: 'Todos os Meses' },
    { value: '0', label: 'Janeiro' }, { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' }, { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' }, { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' }, { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' }, { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' }, { value: '11', label: 'Dezembro' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  const headerRef = useGsapReveal(0);
  const containerRef = useGsapStagger('.reveal-item', 0.1, 0.05);

  return (
    <div ref={containerRef} className="space-y-10 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 font-outfit">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gradient">Fluxo de Caixa</h1>
          <p className="text-muted-foreground font-medium text-xs md:text-base">Controle granular de todas as movimentações financeiras.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="h-11 px-5 border-white/10 glass hover:bg-white/5 font-bold rounded-xl gap-2 w-full sm:w-auto justify-center">
            <Download size={18} /> Exportar
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-1 reveal-item">
        <Card className="glass-card group overflow-hidden border-none shadow-xl border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entradas no Período</CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-500">
              {periodIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-emerald-500/60 mt-1 font-bold uppercase">Soma de recebíveis</p>
          </CardContent>
        </Card>

        <Card className="glass-card group overflow-hidden border-none shadow-xl border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saídas no Período</CardTitle>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-500">
              {periodExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-rose-500/60 mt-1 font-bold uppercase">Soma de débitos</p>
          </CardContent>
        </Card>

        <Card className="glass-card group overflow-hidden border-none shadow-xl border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saldo do Filtro</CardTitle>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Landmark className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${(periodIncome - periodExpense) >= 0 ? 'text-primary' : 'text-rose-500'}`}>
              {(periodIncome - periodExpense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-primary/60 mt-1 font-bold uppercase">Resultado líquido</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card reveal-item border-none shadow-xl border-t border-white/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-black uppercase tracking-tighter text-primary/80">Filtragem Inteligente</CardTitle>
            <p className="text-[10px] text-muted-foreground font-medium">Refine sua busca por data, tipo ou descrição.</p>
          </div>
          {(searchTerm || typeFilter !== 'all' || monthFilter !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {setSearchTerm(''); setTypeFilter('all'); setMonthFilter('all')}}
              className="h-8 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 gap-2 rounded-lg"
            >
              <FilterX size={14} /> Limpar Filtros
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-2 group">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 group-focus-within:text-primary transition-colors flex items-center gap-1.5">
                <Search size={10} /> Pesquisa por Texto
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Ex: Aluguel, Supermercado, Salário..." 
                  className="pl-10 h-11 glass border-white/10 focus-visible:ring-primary rounded-xl font-medium placeholder:opacity-30"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                   <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-white/10 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
                   >
                     <X size={12} />
                   </button>
                )}
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-2 group">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-1.5">
                <Landmark size={10} /> Categoria/Tipo
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11 glass border-white/10 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="all">Todas as transações</SelectItem>
                  <SelectItem value="income" className="text-emerald-500 font-bold">Receitas (+)</SelectItem>
                  <SelectItem value="expense" className="text-rose-500 font-bold">Despesas (-)</SelectItem>
                  <SelectItem value="installment">Parcelamentos</SelectItem>
                  <SelectItem value="recurring">Recorrentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2 group">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-1.5">
                <Calendar size={10} /> Mês
              </Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="h-11 glass border-white/10 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 max-h-[300px]">
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2 group">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-1.5">
                <Calendar size={10} /> Ano
              </Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-11 glass border-white/10 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="glass-card reveal-item border-none shadow-2xl overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="text-left p-6 font-black uppercase text-[10px] tracking-widest opacity-50 pl-8 text-nowrap">Data</th>
                  <th className="text-left p-6 font-black uppercase text-[10px] tracking-widest opacity-50">Descrição / Tipo</th>
                  <th className="text-left p-6 font-black uppercase text-[10px] tracking-widest opacity-50">Categoria</th>
                  <th className="text-right p-6 font-black uppercase text-[10px] tracking-widest opacity-50">Valor</th>
                  <th className="text-right p-6 font-black uppercase text-[10px] tracking-widest opacity-50 pr-8">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="group hover:bg-primary/5 transition-all">
                    <td className="p-6 pl-8 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl glass border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                          <Calendar size={16} />
                        </div>
                        <span className="font-bold tabular-nums opacity-80">{tx.date.toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-base tracking-tight group-hover:text-primary transition-colors">{tx.description}</span>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                            tx.type === 'income' || tx.type === 'recurring' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {tx.type === 'income' ? 'Receita' : tx.type === 'expense' ? 'Despesa' : tx.type === 'installment' ? 'Parcelado' : 'Recorrente'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="text-primary/50" />
                        <span className="px-3 py-1 glass border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                          {tx.category}
                        </span>
                      </div>
                    </td>
                    <td className={`p-6 text-right font-black text-lg tabular-nums ${
                      tx.type === 'income' || tx.type === 'recurring' ? 'text-emerald-500' : 'text-slate-200'
                    }`}>
                      {tx.type === 'income' || tx.type === 'recurring' ? '+' : '-'}
                      {tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-6 text-right pr-8">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-10 rounded-xl text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all border border-transparent hover:border-rose-500/20"
                        onClick={() => setDeleteId(tx.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <div className="p-6 rounded-3xl glass opacity-10">
                          <Receipt size={64} />
                        </div>
                        <div className="space-y-1">
                           <p className="font-black text-2xl text-foreground/80 tracking-tight">Vazio total</p>
                           <p className="font-medium text-sm italic opacity-50">
                             {loading ? 'Sincronizando dados...' : 'Nenhum registro encontrado para estes filtros.'}
                           </p>
                        </div>
                        {!loading && (
                          <Button variant="outline" className="mt-2 glass border-white/10 font-bold" onClick={() => {setSearchTerm(''); setTypeFilter('all'); setMonthFilter('all')}}>
                            Limpar Filtros
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="glass-card border-white/10 max-w-[400px] p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-3xl bg-rose-500/10 text-rose-500 animate-pulse">
                <AlertTriangle size={48} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-black tracking-tight">Confirmar Exclusão</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium text-sm">
                  Esta ação é irreversível. A transação será removida permanentemente de seus registros.
                </DialogDescription>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
              <Button 
                variant="ghost" 
                className="flex-1 h-12 rounded-2xl glass border-white/5 font-bold hover:bg-white/5"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 font-black"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
