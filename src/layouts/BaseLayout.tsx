import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';
import { Sun, Moon, LogOut, LayoutDashboard, Receipt, Target, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { ActionFAB } from '../components/ActionFAB';
import { TransactionModal } from '../features/dashboard/TransactionModal';
import { GoalModal } from '../features/dashboard/GoalModal';
import { useModalStore } from '../store/useModalStore';
import { useFinanceStore } from '../store/useFinanceStore';

export const BaseLayout: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const { user, signOut } = useAuthStore();
  const { modals, closeModal } = useModalStore();
  const { triggerRefresh } = useFinanceStore();
  const location = useLocation();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navItems = [
    { name: 'Painel', path: '/', icon: LayoutDashboard, exact: true },
    { name: 'Transações', path: '/transactions', icon: Receipt, exact: false },
    { name: 'Planejamento', path: '/planning', icon: Target, exact: false },
  ];

  if (user?.role === 'admin' || user?.role === 'owner') {
    navItems.push({ name: 'Administração', path: '/admin', icon: ShieldCheck, exact: false });
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden pb-16 md:pb-0">
      
      {/* Top Header */}
      <header className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-card border-b border-border shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            A
          </div>
          <h1 className="text-xl font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="hidden xs:inline">Aurora Finance</span>
            <span className="xs:hidden">Aurora</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-accent transition-colors outline-none cursor-pointer">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-sm font-medium leading-none">{user?.name}</span>
                <span className="text-xs text-foreground/60 mt-1 capitalize">{user?.role === 'owner' ? 'Dono' : user?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Floating DownBar Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-2 pt-2 px-2 sm:px-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
        <nav className="flex items-center bg-card border border-border rounded-full px-1.5 py-1.5 shadow-lg gap-1 sm:gap-2 pointer-events-auto backdrop-blur-md bg-card/90">
          {navItems.map((item) => {
            const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300 ease-out font-medium text-xs sm:text-sm
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-md scale-100' 
                    : 'text-foreground/60 hover:text-foreground hover:bg-accent hover:scale-105'
                  }`}
              >
                <Icon size={isActive ? 18 : 20} className={isActive ? 'animate-pulse' : ''} />
                {isActive && <span className="animate-in fade-in slide-in-from-left-2 truncate max-w-[80px] sm:max-w-none">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global FAB */}
      <ActionFAB />

      {/* Global Modals */}
      <TransactionModal 
        open={modals.transaction} 
        onOpenChange={(open) => !open && closeModal('transaction')} 
        onSuccess={triggerRefresh}
      />
      <GoalModal 
        open={modals.goal} 
        onOpenChange={(open) => !open && closeModal('goal')} 
        onSuccess={triggerRefresh}
      />

    </div>
  );
};
