import React, { useState } from 'react';
import { User, Lock, ArrowRight, X } from 'lucide-react';

const LoginView = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  return (
    <div className="min-h-screen bg-goat-black flex items-center justify-center px-4 relative">
      <button 
        onClick={onBack}
        className="absolute top-8 right-8 p-2 text-white/40 hover:text-white transition-all bg-white/5 rounded-full"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
           <h1 className="text-4xl font-hype font-black text-white tracking-tight mb-2">
             GOAT<span className="text-goat-red">.</span>ADMIN
           </h1>
           <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.3em]">
             Gestión de Ventas y Deudores
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="relative group">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-goat-blue transition-colors" />
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 bg-goat-card border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:border-goat-blue/50 transition-all font-mono text-sm"
              />
           </div>

           <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-goat-blue transition-colors" />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 bg-goat-card border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:border-goat-blue/50 transition-all font-mono text-sm"
              />
           </div>

           <button 
             type="submit"
             className="w-full h-14 bg-goat-red hover:bg-red-700 text-white font-hype font-bold rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-goat-red/20 group"
           >
             INICIAR SESIÓN
             <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-[10px] text-white/20 font-mono uppercase tracking-widest leading-loose">
             Acceso restringido para administradores de @goat.encargos
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
