import React from 'react';
import { ShoppingBag, Search, User, LogOut } from 'lucide-react';

const Header = ({ cartCount, onCartClick, onUserClick, user, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-goat-black/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex flex-col">
            <h1 className="text-xl font-hype font-black text-white tracking-tighter leading-none">
              GOAT<span className="text-goat-red">.</span>
            </h1>
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-0.5">Encargos</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-white/60 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          
          <button 
            onClick={onCartClick}
            className="relative p-2 text-white/60 hover:text-white transition-colors group"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-goat-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-goat-black">
                {cartCount}
              </span>
            )}
          </button>

          <button 
            onClick={onUserClick}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <User size={20} />
          </button>

          {user && (
            <button 
              onClick={onLogout}
              className="p-2 text-white/30 hover:text-goat-red transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
