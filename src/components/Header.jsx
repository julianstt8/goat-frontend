import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, User, LogOut, Package, Heart, CreditCard, ShieldCheck, ChevronDown } from 'lucide-react';

const Header = ({ cartCount, onCartClick, onUserClick, user, onLogout, onTabClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside (Standard Best Practice)
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const menuItems = [
    { id: 'summary', label: 'Mi Perfil', icon: <User size={16} /> },
    { id: 'orders', label: 'Mis Pedidos', icon: <Package size={16} /> },
    { id: 'wishlist', label: 'Favoritos (Hype)', icon: <Heart size={16} /> },
    { id: 'payments', label: 'Pagos', icon: <CreditCard size={16} /> },
  ];

  const isAdmin = user && ['super_admin', 'vendedor'].includes(user.rol);

  return (
    <header className="sticky top-0 z-[80] w-full bg-goat-black/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex flex-col cursor-pointer" onClick={() => onTabClick && onTabClick('summary', 'catalog')}>
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
              <span className="absolute -top-0.5 -right-0.5 bg-goat-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-goat-black shadow-lg">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => {
                if (!user) {
                  onUserClick();
                } else {
                  setIsMenuOpen(!isMenuOpen);
                }
              }}
              className={`flex items-center gap-1.5 p-2 rounded-xl transition-all ${
                isMenuOpen ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <User size={20} strokeWidth={isMenuOpen ? 2.5 : 2} />
              {user && <ChevronDown size={14} className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-black' : ''}`} />}
            </button>

            {/* DROPDOWN MENU */}
            {isMenuOpen && user && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-goat-card border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up z-[90] ring-1 ring-white/5">
                 <div className="p-5 border-b border-white/5 bg-white/[0.03]">
                    <div className="text-[10px] font-bold uppercase font-mono text-white/30 tracking-widest mb-1 italic">Sesión de</div>
                    <div className="text-sm font-black italic text-white uppercase truncate tracking-tight">{user.nombre_completo}</div>
                 </div>
                 
                 <div className="py-3 px-2">
                    {isAdmin && (
                      <button 
                        onClick={() => { onTabClick('summary', 'dashboard'); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-goat-red hover:bg-white/5 rounded-2xl transition-all"
                      >
                         <ShieldCheck size={18} /> Dashboard Admin
                      </button>
                    )}

                    {menuItems.map(item => (
                       <button 
                         key={item.id}
                         onClick={() => { onTabClick(item.id, 'orders'); setIsMenuOpen(false); }}
                         className="w-full flex items-center gap-4 px-4 py-3 text-[10px] font-black uppercase text-white/60 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                       >
                          <span className="text-white/20 group-hover:text-white">{item.icon}</span> 
                          <span>{item.label}</span>
                       </button>
                    ))}
                 </div>

                 <button 
                   onClick={() => { onLogout(); setIsMenuOpen(false); }}
                   className="w-full border-t border-white/5 flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase text-white/30 hover:text-goat-red hover:bg-white/5 transition-all group"
                 >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> Cerrar Sesión
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
