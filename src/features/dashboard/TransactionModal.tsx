import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarIcon, 
  DollarSign, 
  Tag, 
  AlignLeft, 
  PlusCircle,
  CreditCard,
  RefreshCcw,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuthStore();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (user.status === 'pending') {
      toast.error('Pagamento pendente: A criação de transações está bloqueada.');
      return;
    }

    if (!amount || !category || !date) {
      toast.error('Preencha os campos obrigatórios (Valor, Categoria e Data)');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'transactions'), {
        userId: user.id,
        type,
        amount: Number(amount),
        category,
        description: description.trim() || category,
        date: Timestamp.fromDate(date!),
        createdAt: Timestamp.now()
      });
      
      toast.success('Transação registrada com sucesso');
      onSuccess();
      onOpenChange(false);
      
      // Reset
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date());
      setType('expense');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] gap-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="size-5 text-primary" />
            Nova Transação
          </DialogTitle>
          <DialogDescription>
            Registre uma nova movimentação financeira em sua conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type - Minimalist Toggle */}
          <div className="flex p-1 bg-muted rounded-lg border">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                type === 'expense' 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                type === 'income' 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Receita
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</Label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0,00" 
                  className="pl-9 bg-muted/30 border-muted group-hover:border-primary/50 transition-colors"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-muted/30 border-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Eventual</SelectItem>
                  <SelectItem value="income">Eventual</SelectItem>
                  <SelectItem value="installment">
                    <span className="flex items-center gap-2"><CreditCard size={14} /> Parcelado</span>
                  </SelectItem>
                  <SelectItem value="recurring">
                    <span className="flex items-center gap-2"><RefreshCcw size={14} /> Recorrente</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</Label>
              <div className="relative group">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  placeholder="Ex: Alimentação, Lazer..." 
                  className="pl-9 bg-muted/30 border-muted group-hover:border-primary/50 transition-colors"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</Label>
                <span className="text-[10px] font-medium text-muted-foreground/50 italic">opcional</span>
              </div>
              <div className="relative group">
                <AlignLeft className="absolute left-3 top-3 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  placeholder="Mais detalhes..." 
                  className="pl-9 bg-muted/30 border-muted group-hover:border-primary/50 transition-colors"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted/30 border-muted hover:border-primary/50 transition-colors",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full sm:w-auto min-w-[140px]" 
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Transação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
