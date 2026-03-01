import React from 'react';
import { Plus, Receipt, Target, CalendarDays } from 'lucide-react';
import { useModalStore } from '../store/useModalStore';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { cn } from '../lib/utils';

export const ActionFAB: React.FC = () => {
  const { openModal } = useModalStore();

  const actions = [
    { 
      id: 'transaction', 
      label: 'Nova Transação', 
      icon: Receipt, 
      onClick: () => openModal('transaction'),
      color: 'text-emerald-400'
    },
    { 
      id: 'goal', 
      label: 'Nova Meta', 
      icon: Target, 
      onClick: () => openModal('goal'),
      color: 'text-primary'
    },
    { 
      id: 'planning', 
      label: 'Novo Planejamento', 
      icon: CalendarDays, 
      onClick: () => openModal('planning'),
      color: 'text-amber-400'
    },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-50 md:bottom-8">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className={cn(
              "group relative flex items-center justify-center size-14 rounded-full bg-slate-900",
              "border-2 border-blue-500 hover:border-blue-400 transition-all duration-300",
              "shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]",
              "active:scale-90 hover:rotate-90"
            )}
          >
            <Plus className="size-8 text-blue-500 group-hover:text-blue-500 transition-colors" />
            
            {/* Pulse effect */}
            <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20 pointer-events-none" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 p-2 rounded-2xl glass mb-3 border-white/10 shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
          <div className="px-2 py-1.5 mb-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Ações Rápidas</p>
          </div>
          {actions.map((action) => (
            <DropdownMenuItem 
              key={action.id}
              onClick={action.onClick}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-white/10 transition-colors group"
            >
              <div className={cn("p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform", action.color)}>
                <action.icon size={18} />
              </div>
              <span className="font-bold text-sm tracking-tight">{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
