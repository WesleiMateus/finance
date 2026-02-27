import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { User } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { MoreHorizontal, Users, CreditCard, Settings2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'users'));
      const fetched: User[] = [];
      snap.forEach((d) => {
        const data = d.data();
        fetched.push({
          id: d.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'user',
          status: data.status || 'pending',
          subscriptionExpiresAt: data.subscriptionExpiresAt ? data.subscriptionExpiresAt.toDate() : new Date(),
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          onboardingCompleted: data.onboardingCompleted
        });
      });
      setUsers(fetched);
    } catch (err: any) {
      if (err.message.includes('Missing or insufficient permissions')) {
        toast.error('Permissão negada. Você precisa ser Administrador.');
      } else {
        toast.error('Falha ao carregar usuários');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const updateUserField = async (userId: string, field: string, value: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { [field]: value });
      toast.success(`Dados atualizados com sucesso`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Falha ao atualizar: ' + err.message);
    }
  };

  const addMonthsToSubscription = (currentExpiry: Date, userId: string, months: number) => {
    const newDate = new Date(currentExpiry);
    // If it's already expired, start from today
    const baseDate = newDate < new Date() ? new Date() : newDate;
    baseDate.setMonth(baseDate.getMonth() + months);
    updateUserField(userId, 'subscriptionExpiresAt', Timestamp.fromDate(baseDate));
  };

  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Administração</h1>
          <p className="text-muted-foreground">Gerencie usuários, planos e permissões do sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDebug(!showDebug)} variant="ghost" size="sm" className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {showDebug ? 'Ocultar Dados do Usuário' : 'Dados do Usuário'}
          </Button>
          <Button onClick={fetchUsers} disabled={loading} className="gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Sincronizando...' : 'Atualizar Dados'}
          </Button>
        </div>
      </div>

      {showDebug && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 font-mono text-xs">
            <p className="font-bold text-primary mb-2 uppercase">Informações de Sessão:</p>
            <p>ID: {currentUser?.id}</p>
            <p>Email: {currentUser?.email}</p>
            <p>Cargo: <span className="text-primary font-bold">{currentUser?.role}</span></p>
            <p>Status: {currentUser?.status}</p>
            <p className="mt-2 text-muted-foreground italic">Se o cargo acima não for "admin", o painel terá erros de permissão ao tentar modificar dados.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Usuários registrados no Firestore</p>
          </CardContent>
        </Card>
        
        <Card className="opacity-60 border-dashed">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Gestão de planos em breve</p>
          </CardContent>
        </Card>

        <Card className="opacity-60 border-dashed">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Configurações Base</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Parâmetros globais v2</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} /> Lista de Usuários
          </CardTitle>
          <CardDescription>Visualize e gerencie todos os perfis cadastrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium whitespace-nowrap">{u.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'active' ? 'default' : u.status === 'pending' ? 'outline' : 'destructive'}>
                        {u.status === 'active' ? 'Ativo' : u.status === 'pending' ? 'Pendente' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {u.subscriptionExpiresAt.toLocaleDateString('pt-BR')}
                      {u.subscriptionExpiresAt < new Date() && (
                        <span className="text-destructive text-[10px] font-bold ml-1 block">EXPIRADO</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Gestão</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase py-1">Alterar Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => updateUserField(u.id, 'status', 'active')}>Ativar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateUserField(u.id, 'status', 'pending')}>Pendente</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateUserField(u.id, 'status', 'blocked')} className="text-destructive focus:bg-destructive/10">Bloquear</DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase py-1">Alterar Cargo</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => updateUserField(u.id, 'role', 'admin')}>Promover a Admin</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateUserField(u.id, 'role', 'user')}>Rebaixar a Usuário</DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase py-1">Assinatura</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => addMonthsToSubscription(u.subscriptionExpiresAt, u.id, 1)}>+1 Mês</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addMonthsToSubscription(u.subscriptionExpiresAt, u.id, 3)}>+3 Meses</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addMonthsToSubscription(u.subscriptionExpiresAt, u.id, 12)}>+1 Ano</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 opacity-50 italic">
            <RefreshCw size={20} /> Configurações de Planos (Futuro)
          </CardTitle>
          <CardDescription>Área reservada para definir valores de mensalidade e limites de cada plano.</CardDescription>
        </CardHeader>
        <CardContent className="h-24 flex items-center justify-center text-muted-foreground/50 italic border-t border-dashed">
          Módulo em fase de especificação técnica.
        </CardContent>
      </Card>
    </div>
  );
};
