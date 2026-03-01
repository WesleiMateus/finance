import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../services/firebase';
import { doc, getDocs, collection, getDoc } from 'firebase/firestore';
import type { User } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { 
  MoreHorizontal, Users, RefreshCw, 
  Search, ShieldCheck, Activity, AlertCircle, CheckCircle2,
  Clock, UserPlus, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import { useAdminStore } from '../../store/useAdminStore';
import { useGsapStagger, useGsapReveal } from '../../hooks/useGsap';

export const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { error, users, loading, subscribeToUsers, updateUser } = useAdminStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    status: 'idle' | 'running' | 'success' | 'error';
    message: string;
    details?: any;
  }>({ status: 'idle', message: 'Aguardando início...' });

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'owner') {
      const unsubscribe = subscribeToUsers();
      return () => unsubscribe();
    }
  }, [currentUser, subscribeToUsers]);

  const promoteToAdmin = async (userId: string) => {
    console.group(`📝 Aurora Admin: Promoting User ${userId} to Admin`);
    try {
      await updateUser(userId, { role: 'admin' });
      console.log('✅ Firestore update successful');
      toast.success(`Usuário promovido com sucesso no banco de dados.`);
    } catch (err: any) {
      console.error('❌ Promotion failed:', err);
      toast.error('Falha ao promover: ' + err.message);
    } finally {
      console.groupEnd();
    }
  };

  const updateUserField = async (userId: string, field: keyof User, value: any) => {
    console.group(`📝 Aurora Admin: Updating Field ${field} for User ${userId}`);
    try {
      await updateUser(userId, { [field]: value });
      console.log('✅ Firestore update successful');
      toast.success(`Campo ${field} atualizado.`);
    } catch (err: any) {
      console.error('❌ Update failed:', err);
      toast.error('Falha ao atualizar: ' + err.message);
    } finally {
      console.groupEnd();
    }
  };

  const addMonthsToSubscription = (currentExpiry: Date, userId: string, months: number) => {
    const newDate = new Date(currentExpiry);
    const baseDate = newDate < new Date() ? new Date() : newDate;
    baseDate.setMonth(baseDate.getMonth() + months);
    updateUserField(userId, 'subscriptionExpiresAt', baseDate);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        u.name.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search) ||
        (u.cpfCnpj && u.cpfCnpj.includes(search));
      
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const admin = users.filter(u => u.role === 'admin' || u.role === 'owner').length;
    const expired = users.filter(u => u.subscriptionExpiresAt < new Date()).length;
    return { total, active, admin, expired };
  }, [users]);

  const runDeepDiagnostic = async () => {
    setDiagnosticResult({ status: 'running', message: 'Iniciando testes de profundidade...' });
    try {
      const userRef = doc(db, 'users', currentUser?.id || '');
      const selfSnap = await getDoc(userRef);
      if (!selfSnap.exists()) throw new Error("Documento próprio não encontrado.");
      
      const role = selfSnap.data().role;
      try {
        const snap = await getDocs(collection(db, 'users'));
        setDiagnosticResult({ 
          status: 'success', 
          message: 'Tudo OK! Você tem permissões administrativas completas.',
          details: { role, uid: currentUser?.id, documentCount: snap.size }
        });
      } catch (listErr: any) {
        setDiagnosticResult({ 
          status: 'error', 
          message: `Erro de Permissão: Você pode ler seu perfil (${role}), mas não pode listar a coleção.`,
          details: { error: listErr.message, role }
        });
      }
    } catch (err: any) {
      setDiagnosticResult({ status: 'error', message: 'Falha crítica: ' + err.message });
    }
  };

  const headerRef = useGsapReveal(0);
  const containerRef = useGsapStagger('.reveal-item', 0.1, 0.1);

  return (
    <div ref={containerRef} className="space-y-10 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Header section */}
      <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-2 text-center md:text-left">
        <div className="space-y-1 w-full md:w-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-1">
            <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
              <ShieldCheck className="text-primary w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gradient">Painel Master</h1>
          </div>
          <p className="text-muted-foreground font-medium ml-1">Monitoramento global e gestão de acessos do Aurora Finance.</p>
          
          {error && (
            <div className="p-4 glass rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-semibold flex flex-col gap-1 mt-6 border-rose-500/20 shadow-xl shadow-rose-500/5">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span>Erro de Permissão: {error}</span>
              </div>
              <p className="text-[11px] opacity-80 ml-7 font-medium">
                Sua conta não possui privilégios para listar usuários. Verifique no Console do Firebase.
              </p>
              <div className="mt-2 ml-7 p-2 bg-black/5 dark:bg-white/5 rounded-lg font-mono text-[10px] break-all">
                UID: {currentUser?.id}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setIsDiagnosticOpen(!isDiagnosticOpen)}
            className="gap-2 px-5 h-11 border-primary/20 hover:bg-primary/5 font-bold rounded-xl transition-all w-full sm:w-auto justify-center"
          >
            <Activity size={18} /> {isDiagnosticOpen ? 'Fechar Saúde' : 'Saúde do Sistema'}
          </Button>
          <Button 
            onClick={() => subscribeToUsers()} 
            disabled={loading} 
            className="gap-2 h-11 px-8 shadow-xl shadow-primary/25 hover:scale-[1.03] active:scale-95 transition-all font-bold rounded-xl w-full sm:w-auto justify-center"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Sincronizando...' : 'Atualizar Dados'}
          </Button>
        </div>
      </div>

      {/* Diagnostics Card */}
      {isDiagnosticOpen && (
        <Card className="glass-card border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-3 text-sm">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="size-5" /> Status de Acesso
            </CardTitle>
            <CardDescription className="font-medium opacity-70">Verificação em tempo real das permissões de banco de dados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2 text-sm font-mono">
                <p>Seu UID (Auth): <span className="text-primary font-bold">{currentUser?.id}</span></p>
                <p>Seu Perfil (Front): <Badge variant="outline" className="font-bold">{currentUser?.role}</Badge></p>
                <p>Caminho Firestore: <span className="opacity-60 italic">/users/{currentUser?.id}</span></p>
                <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 ${
                  diagnosticResult.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                  diagnosticResult.status === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                  'bg-muted/50 border-border'
                }`}>
                  {diagnosticResult.status === 'running' ? <RefreshCw className="animate-spin size-4 mt-1" /> :
                   diagnosticResult.status === 'success' ? <CheckCircle2 className="size-4 mt-1" /> :
                   <AlertCircle className="size-4 mt-1" />
                  }
                  <div>
                    <p className="font-bold mb-1">{diagnosticResult.message}</p>
                    {diagnosticResult.details && (
                      <pre className="text-[10px] opacity-70 mt-1 whitespace-pre-wrap font-mono">
                        {JSON.stringify(diagnosticResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="secondary" size="sm" onClick={runDeepDiagnostic} disabled={diagnosticResult.status === 'running'} className="font-bold">
                  Rodar Diagnóstico
                </Button>
                <p className="text-[10px] text-muted-foreground w-48 italic font-semibold">
                  Se você alterou seu cargo no console agora, rode este teste para limpar o cache de regras.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1 reveal-item">
        <Card className="glass-card group overflow-hidden border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total de Usuários</CardTitle>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-2xl md:text-3xl lg:text-4xl font-black text-gradient">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1 font-bold opacity-70 uppercase tracking-tighter justify-center md:justify-start">
              <UserPlus size={12} /> Base sincronizada
            </p>
          </CardContent>
          <div className="h-1 w-full bg-linear-to-r from-primary/40 to-transparent absolute bottom-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
        
        <Card className="glass-card group overflow-hidden border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Usuários Ativos</CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-4xl font-black text-emerald-500">{stats.active}</div>
            <p className="text-[10px] text-emerald-500/80 mt-2 font-bold uppercase tracking-tighter">Status regular</p>
          </CardContent>
        </Card>

        <Card className="glass-card group overflow-hidden border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Administradores</CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-4xl font-black text-blue-500">{stats.admin}</div>
            <p className="text-[10px] text-blue-500/80 font-bold mt-2 uppercase tracking-tighter">Acesso elevado</p>
          </CardContent>
        </Card>

        <Card className="glass-card group overflow-hidden border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vencidos</CardTitle>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-4xl font-black text-rose-500">{stats.expired}</div>
            <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-tighter">Ação necessária</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="glass-card reveal-item border-none shadow-2xl overflow-hidden py-0">
        <CardHeader className="border-b border-white/5 bg-white/5 py-8 px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <CardTitle className="text-3xl font-black flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                  <Users size={26} className="text-primary" />
                </div>
                Gestão Militar
              </CardTitle>
              <CardDescription className="mt-1 font-medium italic opacity-70">Controle total sobre a base de usuários do sistema.</CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all h-4 w-4" />
                <Input 
                  placeholder="Pesquisar por nome ou e-mail..." 
                  className="pl-10 h-11 bg-background/50 border-muted-foreground/10 focus-visible:ring-primary shadow-sm hover:border-primary/20 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 h-11 w-11 border-muted-foreground/10 hover:bg-muted transition-colors rounded-xl">
                    <Filter size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10">
                  <DropdownMenuLabel className="font-bold uppercase text-[10px] tracking-widest opacity-50">Filtrar por Cargo</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterRole('all')} className="font-semibold">Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('owner')} className="font-semibold">Donos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('admin')} className="font-semibold">Admins</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('user')} className="font-semibold">Usuários</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[500px]">
            {loading ? (
              <div className="h-[500px] flex flex-col items-center justify-center gap-5 italic text-muted-foreground animate-pulse">
                <div className="relative size-20 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-primary absolute size-20 opacity-20" />
                  <Users className="text-primary/40 size-10" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-black uppercase tracking-widest text-xs opacity-50">Sincronizando</span>
                  <span className="font-medium text-sm">Aguardando dados da nuvem...</span>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="h-[500px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <div className="p-8 rounded-full bg-muted/20 border border-muted-foreground/5 mb-2 shadow-inner">
                  <Users size={72} className="opacity-10" />
                </div>
                <div className="text-center">
                  <p className="font-black text-3xl text-foreground tracking-tight">Vazio por aqui</p>
                  <p className="text-sm opacity-60 mt-1 font-medium">Nenhum registro corresponde aos filtros atuais.</p>
                </div>
                <Button variant="outline" className="mt-6 border-primary/20 text-primary font-bold px-8 h-11 rounded-xl" onClick={() => {setSearchTerm(''); setFilterRole('all')}}>Limpar Todos os Filtros</Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5 border-b border-white/5">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-black py-7 pl-8 uppercase text-[11px] tracking-widest opacity-50">Usuário Operacional</TableHead>
                    <TableHead className="font-black py-7 uppercase text-[11px] tracking-widest opacity-50">Dados de Contato</TableHead>
                    <TableHead className="font-black py-7 uppercase text-[11px] tracking-widest opacity-50">Nível Hierárquico</TableHead>
                    <TableHead className="font-black py-7 text-center uppercase text-[11px] tracking-widest opacity-50">Estado</TableHead>
                    <TableHead className="font-black py-7 uppercase text-[11px] tracking-widest opacity-50">Expiração</TableHead>
                    <TableHead className="text-right py-7 pr-8 uppercase text-[11px] tracking-widest opacity-50">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="group hover:bg-primary/10 transition-all border-b border-white/5">
                      <TableCell className="font-bold py-7 pl-8">
                        <div className="flex items-center gap-5">
                          <div className="size-12 rounded-2xl bg-linear-to-br from-primary/30 to-primary/5 flex items-center justify-center font-black text-primary text-base border border-white/10 shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-3">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base group-hover:text-primary transition-colors tracking-tight font-black">{u.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">ID: {u.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-7">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm tracking-tight">{u.email}</span>
                          <div className="flex items-center gap-2">
                             {u.cpfCnpj && <span className="text-[10px] opacity-60 font-mono font-bold bg-muted/50 px-1.5 rounded">CPF: {u.cpfCnpj}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-7">
                        <Badge 
                          variant={u.role === 'owner' ? 'destructive' : u.role === 'admin' ? 'default' : 'secondary'}
                          className="font-black uppercase text-[9px] tracking-widest py-1 px-3 rounded-xl shadow-sm"
                        >
                          {u.role === 'owner' ? 'Master' : u.role === 'admin' ? 'Admin' : 'Civil'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-7">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                          u.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                          'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          <div className={`size-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 animate-pulse' : u.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          {u.status === 'active' ? 'Ativo' : u.status === 'pending' ? 'Pendente' : 'Suspenso'}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs py-7">
                        <div className="flex items-center gap-2">
                          <span className={`${u.subscriptionExpiresAt < new Date() ? 'text-rose-500 font-black' : 'font-bold opacity-80'}`}>
                            {u.subscriptionExpiresAt.toLocaleDateString('pt-BR')}
                          </span>
                          {u.subscriptionExpiresAt < new Date() && (
                            <div className="size-2 rounded-full bg-rose-500 animate-ping" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-7">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/15 transition-all rounded-xl border border-white/5 hover:border-primary/20 shadow-sm active:scale-95">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60 glass-card p-2 border-white/10 shadow-2xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pb-2 px-2">Célula: {u.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            
                            <div className="p-1 space-y-1">
                              <DropdownMenuItem onClick={() => updateUserField(u.id, 'status', 'active')} className="gap-3 rounded-lg font-bold">
                                <CheckCircle2 size={16} className="text-emerald-500" /> Ativar Operação
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateUserField(u.id, 'status', 'blocked')} className="text-rose-500 focus:text-rose-600 gap-3 rounded-lg font-bold">
                                <AlertCircle size={16} /> Suspender Acesso
                              </DropdownMenuItem>
                            </div>
                            
                            <DropdownMenuSeparator className="bg-white/5" />
                            <div className="p-1 space-y-1">
                              <DropdownMenuItem onClick={() => promoteToAdmin(u.id)} className="gap-3 rounded-lg font-bold">
                                <ShieldCheck size={16} className="text-primary" /> Promover a Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateUserField(u.id, 'role', 'user')} className="gap-3 rounded-lg font-bold">
                                <Users size={16} /> Rebaixar a Civil
                              </DropdownMenuItem>
                            </div>
                            
                            <DropdownMenuSeparator className="bg-white/5" />
                            <div className="p-2 space-y-2">
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 px-1">Extensão de Licença</span>
                              <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black border-white/10 hover:bg-primary/10" onClick={() => addMonthsToSubscription(u.subscriptionExpiresAt, u.id, 1)}>+1M</Button>
                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black border-white/10 hover:bg-primary/10" onClick={() => addMonthsToSubscription(u.subscriptionExpiresAt, u.id, 3)}>+3M</Button>
                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black border-white/10 hover:bg-primary/10" onClick={() => addMonthsToSubscription(u.subscriptionExpiresAt, u.id, 12)}>+1A</Button>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
