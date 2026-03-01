import React from 'react';
import { Outlet } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';
import { Sun, Moon, Shield } from 'lucide-react';
import { useGsapReveal } from '../hooks/useGsap';

import { Button } from '../components/ui/button';

export const AuthLayout: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const revealRef = useGsapReveal(0);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden font-outfit">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="absolute top-6 right-6 z-50">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          className="rounded-2xl glass hover:bg-white/10 transition-all active:scale-90"
        >
          {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-primary" />}
        </Button>
      </div>

      <div ref={revealRef} className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-10 space-y-2">
            <div className="inline-flex p-4 rounded-[2rem] bg-linear-to-br from-primary/30 to-primary/5 border border-white/10 shadow-2xl mb-4 group hover:scale-110 transition-transform cursor-pointer">
              <Shield size={42} className="text-primary group-hover:rotate-12 transition-transform" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-gradient leading-none">AURORA</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">Finance Intelligent Systems</p>
          </div>
          
          <div className="glass-card p-8 sm:p-10 border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
