import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import LoginView from './components/LoginView';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import ConfirmationModal from './components/ConfirmationModal';
import { productService, categoryService, calculationService, authService, profileService } from './services/api';
import { useCart } from './hooks/useCart';
import { 
  ShoppingBag, 
  ShoppingCart, 
  User as UserIcon, 
  Search, 
  LayoutGrid, 
  TrendingUp,
  Package,
  Info,
  ArrowRight,
  ShieldCheck,
  LogOut
} from 'lucide-react';

/**
 * @GOAT UI/UX DESIGN SYSTEM
 * Background: Asphalt (#0D0D0D)
 */

function App() {
  const [view, setView] = useState('catalog'); // 'catalog', 'login', 'dashboard', 'orders'
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trm, setTrm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null); // { title, message, type, onConfirm }
  const [wishlist, setWishlist] = useState([]);
  const [profileTab, setProfileTab] = useState('summary');
  
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    calculateTotals 
  } = useCart();

  // Initialization
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);

        // Session Persistence: Check for token
        const token = localStorage.getItem('goat_token');
        if (token) {
          try {
            const userData = await authService.me();
            setUser(userData);
            // Si es admin, por defecto lo mandamos al dashboard
            if (['super_admin', 'vendedor'].includes(userData.rol)) {
              setView('dashboard');
            } else {
              setView('catalog');
            }
          } catch (meError) {
            console.error('Session expired or invalid:', meError);
            authService.logout();
          }
        }

        const [prods, cats, trmData] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
          calculationService.getTrm()
        ]);
        
        setCategories(cats);
        setTrm(trmData);

        // Pre-calculate prices (handling batches of 100 to avoid API limits)
        let productsWithPrice = prods;
        if (prods.length > 0) {
          try {
            const CHUNK_SIZE = 100;
            const chunks = [];
            for (let i = 0; i < prods.length; i += CHUNK_SIZE) {
              chunks.push(prods.slice(i, i + CHUNK_SIZE));
            }

            const allResults = [];
            for (const chunk of chunks) {
              const res = await calculationService.calculateBatch(chunk.map(p => ({
                referencia: p.referencia,
                precioCompraUsd: Number(p.precio_compra_usd),
                pesoLibras: Number(p.peso_libras),
                categoria_id: p.categoria_id
              })));
              allResults.push(...res.productos);
            }

            productsWithPrice = prods.map((p, idx) => ({
              ...p,
              precio_calculado: p.precio_venta_cop > 0 ? p.precio_venta_cop : (allResults[idx]?.precio_final_cop || 0)
            }));
          } catch (batchErr) {
            console.error('Batch calculation failed:', batchErr);
            // Fallback: If batch fails, we can still show 0 or a msg, but at least we don't crash
          }
        }

        setProducts(productsWithPrice.filter(p => p.en_stock && !p.vendido));
        setLoading(false);
      } catch (err) {
        console.error('Data Init Error:', err);
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Wishlist Sync
  useEffect(() => {
    if (user && !['super_admin', 'vendedor'].includes(user.rol)) {
       profileService.getWishlist().then(setWishlist).catch(console.error);
    } else {
       setWishlist([]);
    }
  }, [user]);

  const handleToggleWishlist = async (referencia) => {
    if (!user) {
      setView('login');
      return;
    }
    try {
      const exists = wishlist.find(item => item.referencia === referencia);
      if (exists) {
        await profileService.removeFromWishlist(exists.id);
        setWishlist(prev => prev.filter(item => item.referencia !== referencia));
      } else {
        const newItem = await profileService.addToWishlist(referencia);
        setWishlist(prev => [...prev, newItem]);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const handleTabClick = (tabId, viewId = 'orders') => {
    setProfileTab(tabId);
    setView(viewId);
    window.scrollTo(0,0);
  };

  const handleLogin = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      const userData = await authService.me();
      setUser(userData);
      if (['super_admin', 'vendedor'].includes(userData.rol)) {
        setView('dashboard');
      } else {
        setView('catalog');
      }
    } catch (err) {
      setAlertConfig({
        title: "Acceso Denegado",
        message: "Las credenciales ingresadas no son válidas. Por favor, verifica tu email y contraseña.",
        type: "danger",
        confirmText: "Reintentar"
      });
    }
  };

  const totals = useMemo(() => calculateTotals(trm?.valor || 0), [cartItems, trm, calculateTotals]);

  const groupedProducts = useMemo(() => {
    let baseProducts = activeCategory 
      ? products.filter(p => p.categoria_id === activeCategory) 
      : products;

    const groups = {};
    baseProducts.forEach(p => {
      const key = `${p.referencia}`.toUpperCase();
      if (!groups[key]) {
        groups[key] = {
          ...p,
          variants: [{ id: p.id, talla: p.talla || 'UNISIZE' }]
        };
      } else {
        groups[key].variants.push({ id: p.id, talla: p.talla || 'UNISIZE' });
      }
    });

    return Object.values(groups);
  }, [products, activeCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-goat-black flex items-center justify-center font-hype">
        <div className="flex flex-col items-center gap-6 animate-pulse">
           <div className="text-4xl font-black italic">GOAT<span className="text-goat-red">.</span></div>
           <p className="font-mono text-white/40 text-[10px] uppercase tracking-widest">Iniciando Sistema...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    authService.logout();
    setUser(null);
    setView('catalog');
    setIsLogoutModalOpen(false);
  };

  const isAdmin = user && ['super_admin', 'vendedor'].includes(user.rol);

  // --- RENDERING COMMON ELEMENTS ---
   const NavigationUI = () => (
    <nav className="fixed bottom-0 inset-x-0 h-20 bg-goat-card/80 backdrop-blur-xl border-t border-white/10 z-[60] safe-area-inset-bottom">
      <div className="container mx-auto px-6 h-full flex items-center justify-around max-w-lg">
         <button 
           onClick={() => { setView('catalog'); window.scrollTo(0,0)}}
           className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'catalog' ? 'text-goat-red' : 'text-white/30'}`}
         >
           <LayoutGrid size={22} strokeWidth={view === 'catalog' ? 2.5 : 2} />
           <span className="text-[10px] font-bold font-mono uppercase">Tienda</span>
         </button>

         {isAdmin ? (
            <button 
              onClick={() => setView('dashboard')}
              className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'dashboard' ? 'text-goat-red' : 'text-white/30'}`}
            >
              <ShieldCheck size={22} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] font-bold font-mono uppercase italic tracking-tighter">Admin</span>
            </button>
         ) : user ? (
            <button 
              onClick={() => handleTabClick('orders', 'orders')}
              className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'orders' ? 'text-goat-red' : 'text-white/30'}`}
            >
              <Package size={22} strokeWidth={view === 'orders' ? 2.5 : 2} />
              <span className="text-[10px] font-bold font-mono uppercase tracking-tighter">Pedidos</span>
            </button>
         ) : null}
      </div>
    </nav>
   );

  // --- RENDERING VIEWS ---
  const renderContent = () => {
    if (view === 'login') {
       return <LoginView onLogin={handleLogin} onBack={() => setView('catalog')} />;
    }

    return (
       <>
        <Header 
          cartCount={cartItems.length} 
          onCartClick={() => setIsCartOpen(true)} 
          onUserClick={() => user ? handleTabClick('summary', 'orders') : setView('login')} 
          user={user}
          onLogout={handleLogout}
          onTabClick={handleTabClick}
        />
  
        <main className="container mx-auto px-4 max-w-5xl pt-4">
          {view === 'dashboard' && isAdmin ? (
            <div className="animate-fade-in"><AdminDashboard /></div>
          ) : view === 'orders' && user ? (
            <div className="animate-fade-in"><UserProfile user={user} onViewCatalog={() => setView('catalog')} initialTab={profileTab} onTabChange={handleTabClick} /></div>
          ) : (
            <div className="animate-fade-in">
              {/* Header Stats */}
              <section className="py-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
                    STOCK <span className="text-goat-red">ACTUAL</span>
                  </h1>
                  <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mt-3 flex items-center gap-2 font-bold">
                    <Info size={14} className="text-goat-blue" /> Envíos locales: 1-3 días | Encargos: 15 días
                  </p>
                </div>
              </section>
  
              {/* Categories Bar */}
              <section className="sticky top-16 z-30 -mx-4 px-4 bg-goat-black/80 backdrop-blur-md py-4 mb-8 border-b border-white/5">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className={`px-6 h-11 rounded-xl text-xs font-bold font-mono transition-all border shrink-0 ${
                      !activeCategory ? 'bg-white text-black border-white shadow-xl shadow-white/10' : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                    }`}
                  >
                    TODO EL STOCK
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-6 h-11 rounded-xl text-xs font-bold font-mono transition-all border shrink-0 ${
                        activeCategory === cat.id ? 'bg-goat-red border-goat-red text-white' : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      {cat.nombre.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>
  
              {/* Products Grid */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {groupedProducts.map(product => (
                  <ProductCard 
                    key={product.referencia} 
                    product={product} 
                    trm={trm} 
                    onAddToCart={(variant) => {
                      addToCart(variant || product);
                      setIsCartOpen(true);
                    }}
                    onAddToWishlist={handleToggleWishlist}
                    isFavorited={wishlist.some(w => w.referencia === product.referencia)}
                  />
                ))}
              </section>
            </div>
          )}
        </main>
  
        <NavigationUI />
  
        <CartDrawer 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          totals={totals}
          trm={trm}
        />
       </>
    );
  };

  return (
    <div className="min-h-screen bg-goat-black text-white font-hype pb-32">
      {renderContent()}

      {isLogoutModalOpen && (
        <ConfirmationModal 
          title="¿Cerrar Sesión?"
          message="¿Estás seguro de que deseas salir de tu cuenta de GOAT?"
          confirmText="Sí, Salir"
          cancelText="No, Volver"
          onConfirm={confirmLogout}
          onCancel={() => setIsLogoutModalOpen(false)}
          icon={<LogOut size={28} />}
        />
      )}
      {alertConfig && (
        <ConfirmationModal 
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          confirmText={alertConfig.confirmText || "Entendido"}
          isAlert={true}
          onConfirm={() => {
            if (alertConfig.onConfirm) alertConfig.onConfirm();
            setAlertConfig(null);
          }}
        />
      )}
    </div>
  );
}

export default App;