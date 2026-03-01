import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { User as UserIcon, Mail, Lock, Camera, ShieldCheck, UserCircle, ArrowRight } from 'lucide-react';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { cn } from '../../lib/utils';
import gsap from 'gsap';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab ] = useState<'general' | 'email' | 'security'>('general');
  const [name, setName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Direct GSAP staggered animation for entrance
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.reveal-item', 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.05, 
          ease: 'power2.out',
          delay: 0.1
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Animation for tab change
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { opacity: 0, x: 20 }, 
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      await updateProfile({ name, photoURL });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !email) return;
    if (email === user?.email) {
      toast.info('O e-mail é o mesmo atual.');
      return;
    }
    try {
      setLoading(true);
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      await updateEmail(auth.currentUser, email);
      await updateProfile({ email });
      toast.success('E-mail atualizado com sucesso!');
      setCurrentPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Por favor, informe sua senha atual para confirmar a alteração de e-mail.');
      } else {
        toast.error('Erro ao atualizar e-mail: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      setLoading(true);
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Por favor, informe sua senha atual para confirmar a alteração de senha.');
      } else {
        toast.error('Erro ao alterar senha: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Dados Gerais', icon: UserCircle, description: 'Nome e foto de perfil' },
    { id: 'email', label: 'E-mail', icon: Mail, description: 'E-mail de acesso e notificações' },
    { id: 'security', label: 'Segurança', icon: Lock, description: 'Alteração de senha e acessos' }
  ];

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto pb-20">
      {/* Header Profile Section */}
      <div className="reveal-item relative h-48 md:h-64 rounded-3xl overflow-hidden mb-[-4rem] z-0">
         <div className="absolute inset-0 bg-linear-to-r from-primary/80 to-purple-600/80 backdrop-blur-sm" />
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay opacity-40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 px-4 md:px-0">
        {/* Sidebar / Info Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card shadow-2xl border-white/20 reveal-item">
            <CardContent className="pt-10 flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full ring-4 ring-background border-4 border-primary/40 overflow-hidden shadow-2xl bg-muted flex items-center justify-center">
                   {photoURL ? (
                     <img src={photoURL} alt={user?.name} className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-4xl font-bold text-primary">
                        {user?.name?.charAt(0).toUpperCase()}
                     </span>
                   )}
                </div>
                <div className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                   <Camera size={16} />
                </div>
              </div>
              
              <div className="text-center space-y-1 mb-6">
                <h2 className="text-2xl font-black tracking-tight">{user?.name}</h2>
                <p className="text-sm font-medium text-muted-foreground">{user?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full border-t border-white/5 pt-6 pb-2">
                 <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none capitalize font-bold">
                       {user?.status}
                    </Badge>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Nível</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary capitalize font-bold border-none">
                       {user?.role}
                    </Badge>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation Menu */}
          <Card className="glass-card border-white/10 overflow-hidden reveal-item">
            <div className="p-2 flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 relative group",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "hover:bg-white/5 text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl transition-colors",
                      isActive ? "bg-white/20" : "bg-muted"
                    )}>
                       <Icon size={18} />
                    </div>
                    <div className="text-left flex-1">
                       <p className="font-bold text-sm tracking-tight">{tab.label}</p>
                       <p className={cn("text-[10px] truncate max-w-[150px]", isActive ? "opacity-90" : "opacity-60")}>
                          {tab.description}
                       </p>
                    </div>
                    {isActive && <ArrowRight size={14} className="animate-in fade-in slide-in-from-left-2" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 reveal-item">
          <div ref={contentRef} className="space-y-6">
             {activeTab === 'general' && (
               <Card className="glass-card border-none shadow-xl min-h-[400px]">
                 <CardHeader>
                   <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <UserIcon size={24} />
                      </div>
                      Dados Pessoais
                   </CardTitle>
                   <CardDescription className="text-sm font-medium">Mantenha seus dados de exibição sempre atualizados.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <form onSubmit={handleUpdateInfo} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome de Exibição</Label>
                           <Input 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Como quer ser chamado?"
                              className="glass-input h-12 text-sm font-medium"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">URL da Imagem</Label>
                           <Input 
                              value={photoURL}
                              onChange={(e) => setPhotoURL(e.target.value)}
                              placeholder="https://sua-foto.com/perfil.jpg"
                              className="glass-input h-12 text-sm font-medium"
                           />
                        </div>
                     </div>
                     <div className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full md:w-auto h-12 px-8 font-bold shadow-lg shadow-primary/20">
                           {loading ? 'Sincronizando...' : 'Salvar Alterações'}
                        </Button>
                     </div>
                   </form>
                 </CardContent>
               </Card>
             )}

             {activeTab === 'email' && (
               <Card className="glass-card border-none shadow-xl min-h-[400px]">
                 <CardHeader>
                   <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Mail size={24} />
                      </div>
                      E-mail e Comunicação
                   </CardTitle>
                   <CardDescription className="text-sm font-medium">Este e-mail é utilizado para login e notificações importantes.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <form onSubmit={handleUpdateEmail} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Endereço de E-mail</Label>
                        <Input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="glass-input h-12 text-sm font-medium"
                        />
                      </div>

                      {email !== user?.email && (
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-4 animate-in fade-in zoom-in-95">
                           <div className="flex items-center gap-2 text-rose-500">
                              <ShieldCheck size={18} />
                              <p className="text-sm font-black italic">Verificação Requerida</p>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70 ml-1">Senha Atual para Confirmar</Label>
                              <Input 
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="******"
                                className="glass-input border-rose-500/20 focus:border-rose-500/50 h-12"
                                required
                              />
                           </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button type="submit" disabled={loading} className="w-full md:w-auto h-12 px-8 font-bold shadow-lg shadow-primary/20">
                           {loading ? 'Processando...' : 'Atualizar E-mail'}
                        </Button>
                      </div>
                   </form>
                 </CardContent>
               </Card>
             )}

             {activeTab === 'security' && (
               <Card className="glass-card border-none shadow-xl min-h-[400px]">
                 <CardHeader>
                   <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                        <Lock size={24} />
                      </div>
                      Segurança da Conta
                   </CardTitle>
                   <CardDescription className="text-sm font-medium">Recomendamos trocar sua senha periodicamente.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha Atual</Label>
                         <Input 
                           type="password"
                           value={currentPassword}
                           onChange={(e) => setCurrentPassword(e.target.value)}
                           placeholder="Sua senha de segurança"
                           className="glass-input h-12"
                           required
                         />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</Label>
                           <Input 
                             type="password"
                             value={newPassword}
                             onChange={(e) => setNewPassword(e.target.value)}
                             placeholder="Mínimo 6 caracteres"
                             className="glass-input h-12"
                             required
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nova Senha</Label>
                           <Input 
                             type="password"
                             value={confirmPassword}
                             onChange={(e) => setConfirmPassword(e.target.value)}
                             placeholder="Repita a nova senha"
                             className="glass-input h-12"
                             required
                           />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <Button type="submit" disabled={loading} variant="destructive" className="w-full md:w-auto h-12 px-8 font-extrabold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-none">
                           {loading ? 'Alterando...' : 'Mudar Senha Agora'}
                        </Button>
                      </div>
                   </form>
                 </CardContent>
               </Card>
             )}

             {/* Subscription Card - Quick access */}
             <Card className="glass-card border-white/10 mt-6 overflow-hidden reveal-item group">
                <div className="p-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 ring-4 ring-amber-500/5 group-hover:scale-110 transition-transform">
                         <ShieldCheck size={24} />
                      </div>
                      <div>
                         <p className="text-sm font-black tracking-tight">Plano Premium {user?.plano}</p>
                         <p className="text-xs text-muted-foreground font-medium">Sua conta possui todos os recursos ativos.</p>
                      </div>
                   </div>
                   <Button variant="ghost" size="sm" className="font-bold text-xs opacity-60 hover:opacity-100">
                      Gerenciar <ArrowRight size={14} className="ml-1" />
                   </Button>
                </div>
                <div className="h-1 bg-linear-to-r from-amber-500/50 to-transparent w-0 group-hover:w-full transition-all duration-700" />
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
