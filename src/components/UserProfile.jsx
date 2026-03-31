import React, { useState, useEffect } from 'react';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  CreditCard, 
  MessageCircle, 
  Settings, 
  ChevronRight,
  TrendingUp,
  Award,
  Footprints,
  Shirt,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Activity,
  ShoppingBag,
  Plus
} from 'lucide-react';
import { profileService, orderService } from '../services/api';

const UserProfile = ({ user: initialUser, onViewCatalog, initialTab = 'summary' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // summary, orders, wishlist, addresses, payments, support
  const [profile, setProfile] = useState(initialUser);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Sync internal tab state with external prop changes (e.g. from Header menu)
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Stats y Datos
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [me, ords, adds, wish, pays] = await Promise.all([
          profileService.getMe(),
          orderService.getAll(),
          profileService.getAddresses(),
          profileService.getWishlist(),
          profileService.getPayments()
        ]);
        setProfile(me);
        setOrders(ords);
        setAddresses(adds);
        setWishlist(wish);
        setPayments(pays);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center py-32 animate-pulse">
         <Activity size={48} className="text-goat-red mb-4 animate-spin-slow" />
         <p className="text-white/20 font-mono text-xs uppercase tracking-widest text-center">Coleccionando tus datos...</p>
       </div>
     );
  }

  const getNivelColor = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case 'bronze': return 'text-[#CD7F32]';
      case 'silver': return 'text-[#C0C0C0]';
      case 'gold': return 'text-[#FFD700]';
      case 'diamond': return 'text-goat-blue brightness-150';
      default: return 'text-white/40';
    }
  };

  const tabs = [
    { id: 'summary', label: 'Resumen', icon: <User size={18} /> },
    { id: 'orders', label: 'Pedidos', icon: <Package size={18} /> },
    { id: 'wishlist', label: 'Favoritos', icon: <Heart size={18} /> },
    { id: 'addresses', label: 'Direcciones', icon: <MapPin size={18} /> },
    { id: 'payments', label: 'Pagos', icon: <CreditCard size={18} /> },
    { id: 'support', label: 'Soporte', icon: <MessageCircle size={18} /> },
  ];

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white mb-2">
           MI <span className="text-goat-red">PERFIL</span>
        </h1>
        <div className="flex items-center gap-2 text-white/40 font-mono text-[10px] uppercase tracking-[0.2em]">
           <Award size={14} className={getNivelColor(profile.nivel)} />
           <span>Miembro {profile.nivel} • {orders.length} pedidos realizados</span>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 sticky top-16 z-30 -mx-4 px-4 bg-goat-black/80 backdrop-blur-md mb-8 border-b border-white/5">
        {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`flex items-center gap-2 px-5 h-11 rounded-xl text-[10px] font-black font-mono uppercase transition-all whitespace-nowrap border ${
               activeTab === tab.id ? 'bg-white text-black border-white shadow-xl shadow-white/10 scale-105' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
             }`}
           >
             {tab.icon}
             {tab.label}
           </button>
        ))}
      </div>

      <div className="space-y-8">
         {/* RENDERING SECTIONS BASED ON ACTIVE TAB */}
         
         {activeTab === 'summary' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
              {/* PROFILE CARD */}
              <div className="bg-goat-card border border-white/5 rounded-[40px] p-8 md:p-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-goat-red/10 blur-[60px] -mr-10 -mt-10 group-hover:bg-goat-red/20 transition-all" />
                 
                 <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                       <User size={32} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black italic text-white uppercase leading-none mb-2">{profile.nombre_completo}</h3>
                       <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">{profile.email}</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                       <div className="flex items-center justify-between mb-4">
                          <div className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest">Nivel Hype</div>
                          <TrendingUp size={14} className={getNivelColor(profile.nivel)} />
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${getNivelColor(profile.nivel).replace('text', 'bg')} opacity-50 transition-all duration-1000`} style={{ width: `${profile.porcentaje_avance || 0}%` }} />
                       </div>
                       <div className="flex justify-between mt-3">
                          <span className="text-[9px] font-black uppercase font-mono text-white/20 italic">{profile.nivel}</span>
                          <span className="text-[9px] font-black uppercase font-mono text-white/40">
                             {profile.proximo_nivel ? `Próximo: ${profile.proximo_nivel.toUpperCase()}` : 'NIVEL MÁXIMO'}
                          </span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                           <Footprints size={20} className="text-goat-blue mb-3" />
                           <div className="text-[9px] uppercase font-mono text-white/30 font-bold tracking-widest mb-1">Calzado US</div>
                           <div className="text-xl font-black italic text-white flex items-baseline gap-1.5">
                               {profile.genero === 'unisex' && (profile.talla_calzado_us || '').includes('/') ? (
                                  (() => {
                                     const parts = profile.talla_calzado_us.split('/');
                                     return `${(parts[0] || '').trim()}M / ${(parts[1] || '').trim()}W`;
                                  })()
                               ) : (
                                  profile.talla_calzado_us || '—'
                               )}
                               <span className="text-[10px] text-white/30 not-italic font-mono uppercase">
                                  {profile.genero === 'hombre' ? 'M' : 
                                   profile.genero === 'mujer' ? 'W' : 
                                   profile.genero === 'junior' ? 'GS' : 'UNISEX'}
                               </span>
                           </div>
                        </div>
                       <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                          <Shirt size={20} className="text-goat-red mb-3" />
                          <div className="text-[9px] uppercase font-mono text-white/30 font-bold tracking-widest mb-1">Ropa (Talla)</div>
                          <div className="text-xl font-black italic text-white uppercase">{profile.talla_ropa || '—'}</div>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => {
                     setEditFormData({
                        nombre_completo: profile.nombre_completo,
                        telefono: profile.telefono,
                        talla_calzado_us: profile.talla_calzado_us,
                        genero: profile.genero,
                        talla_ropa: profile.talla_ropa
                     });
                     setIsEditing(true);
                   }}
                   className="mt-8 w-full h-14 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-2xl font-mono text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                 >
                   <Settings size={14} /> Editar Perfil
                 </button>
              </div>

              {/* STATS CARD */}
              <div className="space-y-6">
                  <div className="bg-goat-blue/5 border border-goat-blue/10 rounded-[40px] p-8 flex flex-col md:flex-row justify-between gap-6">
                     <div>
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 bg-goat-blue/10 rounded-2xl flex items-center justify-center text-goat-blue">
                              <CreditCard size={20} />
                           </div>
                           <h4 className="text-sm font-black italic text-white uppercase tracking-tighter">Inversión en Hype</h4>
                        </div>
                        <div className="text-2xl font-black italic text-white mb-2">$ {new Intl.NumberFormat('es-CO').format(orders.reduce((acc, o) => acc + (Number(o.precio_venta_cop) || 0), 0))}</div>
                        <p className="text-white/30 font-mono text-[8px] uppercase tracking-widest">Total invertido en GOAT.</p>
                     </div>
                     <div className="md:border-l border-white/5 md:pl-8">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                              <TrendingUp size={20} />
                           </div>
                           <h4 className="text-sm font-black italic text-white uppercase tracking-tighter">Saldo Pendiente</h4>
                        </div>
                        <div className="text-2xl font-black italic text-amber-500 mb-2">$ {new Intl.NumberFormat('es-CO').format(orders.reduce((acc, o) => acc + (Number(o.saldo_restante) || 0), 0))}</div>
                        <p className="text-white/30 font-mono text-[8px] uppercase tracking-widest">Total acumulado a pagar.</p>
                     </div>
                  </div>

                 <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 flex items-center justify-between group cursor-pointer hover:border-white/20 transition-all" onClick={() => setActiveTab('orders')}>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
                          <Package size={20} />
                       </div>
                       <div>
                          <div className="text-[10px] font-black uppercase font-mono text-white/20">Último Pedido</div>
                          <div className="text-sm font-black italic text-white uppercase">{orders[0]?.producto?.referencia || orders[0]?.referencia || 'Sin pedidos'}</div>
                       </div>
                    </div>
                    <ChevronRight size={20} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </div>

                 <div className="bg-goat-red/5 border border-goat-red/10 rounded-[40px] p-8 flex items-center justify-between group cursor-pointer hover:border-goat-red/20 transition-all" onClick={() => setActiveTab('support')}>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-goat-red">
                          <MessageCircle size={20} />
                       </div>
                       <div>
                          <div className="text-[10px] font-black uppercase font-mono text-white/20">Atención Directa</div>
                          <div className="text-sm font-black italic text-white uppercase">Soporte GOAT</div>
                       </div>
                    </div>
                    <ExternalLink size={18} className="text-white/20 group-hover:text-goat-red transition-all" />
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'orders' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
              {orders.length === 0 ? (
                <div className="col-span-full py-20 text-center text-white/20 font-mono uppercase text-[10px] tracking-widest">Aún no has realizado pedidos</div>
              ) : orders.map(order => (
                <div key={order.id} className="bg-goat-card border border-white/5 rounded-[40px] p-8 group hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase border ${
                             order.estado_logistico === 'entregado' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-goat-blue/10 text-goat-blue border-goat-blue/20'
                          }`}>
                            {order.estado_logistico || 'pendiente'}
                          </span>
                          <h4 className="text-xl font-black italic text-white uppercase mt-4">{order.producto?.referencia || order.referencia}</h4>
                          <p className="text-white/20 font-mono text-[9px] uppercase tracking-widest mt-1 italic">Colección personal</p>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] font-mono text-white/20 uppercase mb-1">{new Date(order.fecha_compra).toLocaleDateString()}</div>
                          <div className="text-lg font-black italic text-white">$ {new Intl.NumberFormat('es-CO').format(order.precio_venta_cop)}</div>
                          <div className="mt-1">
                             {order.saldo_restante > 100 ? (
                                <div className="flex flex-col items-end">
                                   <span className="text-[8px] font-mono text-amber-500/60 uppercase font-black">Pendiente:</span>
                                   <span className="text-xs font-black italic text-amber-500">$ {new Intl.NumberFormat('es-CO').format(order.saldo_restante)}</span>
                                </div>
                             ) : (
                                <span className="text-[8px] font-black bg-green-500/20 text-green-500 px-2 py-0.5 rounded uppercase tracking-tighter italic">¡PAGADO!</span>
                             )}
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-black/40 p-5 rounded-3xl border border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/30"><Clock size={16} /></div>
                          <div>
                             <div className="text-[8px] font-mono text-white/20 uppercase">Track ID</div>
                             <div className="text-[10px] font-bold text-white uppercase">{order.tracking_number || 'En espera...'}</div>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-white/10" />
                    </div>
                </div>
              ))}
           </div>
         )}

         {activeTab === 'wishlist' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up text-center">
               {wishlist.length === 0 ? (
                 <div className="col-span-full py-20 text-white/20 font-mono uppercase text-[10px] tracking-widest">No tienes favoritos guardados</div>
               ) : wishlist.map(item => (
                 <div key={item.id} className="bg-goat-card border border-white/5 rounded-[40px] p-6 group hover:border-goat-red/30 transition-all relative overflow-hidden">
                    <button 
                      onClick={async () => {
                         try {
                           await profileService.removeFromWishlist(item.id);
                           setWishlist(prev => prev.filter(i => i.id !== item.id));
                         } catch (err) { console.error(err); }
                      }}
                      className="absolute top-4 right-4 text-goat-red/30 hover:text-goat-red transition-all"
                      title="Quitar de favoritos"
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                    <div className="bg-white/5 aspect-square rounded-[32px] mb-4 flex items-center justify-center text-white/10 group-hover:scale-110 transition-transform duration-500">
                       <ShoppingBag size={48} />
                    </div>
                    <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1 font-bold">Referencia</div>
                    <div className="text-xs font-black italic text-white uppercase leading-tight line-clamp-1 h-4">{item.referencia}</div>
                    <button 
                      onClick={onViewCatalog}
                      className="mt-6 w-full h-11 border border-white/5 rounded-2xl font-mono text-[9px] font-black uppercase text-white/30 hover:bg-white hover:text-black hover:border-white transition-all shadow-xl shadow-black/20"
                    >
                      Ver en catálogo
                    </button>
                 </div>
               ))}
            </div>
          )}

         {activeTab === 'addresses' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
               {addresses.length === 0 ? (
                 <div className="col-span-full py-20 text-center text-white/20 font-mono uppercase text-[10px] tracking-widest">No has agregado direcciones</div>
               ) : addresses.map(addr => (
                 <div key={addr.id} className={`bg-goat-card border rounded-[40px] p-8 relative overflow-hidden group transition-all ${addr.es_principal ? 'border-goat-blue/40 shadow-xl shadow-goat-blue/10' : 'border-white/5 hover:border-white/10'}`}>
                    {addr.es_principal && (
                       <div className="absolute top-0 right-0 bg-goat-blue text-white text-[8px] font-black px-4 py-2 rounded-bl-3xl uppercase tracking-widest">Principal</div>
                    )}
                    <MapPin size={24} className={addr.es_principal ? 'text-goat-blue' : 'text-white/20'} />
                    <div className="mt-6 mb-2 text-xl font-black italic text-white uppercase">{addr.ciudad}</div>
                    <p className="text-white/40 font-mono text-xs uppercase tracking-tight leading-relaxed line-clamp-2">{addr.direccion_completa}</p>
                    {addr.indicaciones && (
                      <p className="mt-2 text-[10px] font-mono text-white/20 uppercase tracking-widest italic flex items-center gap-2">
                        <Info size={10} className="text-white/10" /> {addr.indicaciones}
                      </p>
                    )}
                    <div className="mt-8 flex gap-3">
                       <button className="text-[9px] font-black uppercase font-mono text-white/30 hover:text-white transition-colors">Editar</button>
                       <button 
                         onClick={() => profileService.deleteAddress(addr.id).then(() => setAddresses(addresses.filter(a => a.id !== addr.id)))}
                         className="text-[9px] font-black uppercase font-mono text-goat-red/30 hover:text-goat-red transition-colors"
                       >
                         Eliminar
                       </button>
                    </div>
                 </div>
               ))}
                <button 
                  onClick={() => setIsAddingAddress(true)}
                  className="bg-white/5 border border-white/5 border-dashed rounded-[40px] p-10 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-all min-h-[220px]"
                >
                   <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-4"><Plus size={20} /></div>
                   <div className="text-[10px] font-black uppercase font-mono tracking-widest">Nueva Dirección</div>
                </button>
            </div>
         )}

         {activeTab === 'payments' && (
           <div className="bg-goat-card border border-white/5 rounded-[40px] overflow-hidden">
              <div className="p-8 border-b border-white/5">
                 <h4 className="text-sm font-black italic text-white uppercase tracking-widest">Historial de Pagos</h4>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-white/5 text-[9px] text-white/30 uppercase tracking-[0.2em] bg-black/20 font-bold">
                          <th className="px-8 py-4">Fecha</th>
                          <th className="px-8 py-4">Concepto</th>
                          <th className="px-8 py-4 text-right">Monto</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                       {payments.length === 0 ? (
                         <tr><td colSpan="3" className="px-8 py-10 text-center italic opacity-20">No registras pagos aún</td></tr>
                       ) : payments.map(pay => (
                         <tr key={pay.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-8 py-4 text-white/40">{new Date(pay.fecha_pago).toLocaleDateString()}</td>
                            <td className="px-8 py-4">
                               <div className="flex flex-col">
                                  <span className="font-bold text-white uppercase">{pay.tipo_abono}</span>
                                  <span className="text-[8px] text-white/20">Ref: {pay.pedido?.producto?.referencia}</span>
                               </div>
                            </td>
                            <td className="px-8 py-4 text-right font-black italic text-green-500">$ {new Intl.NumberFormat('es-CO').format(pay.monto_cop)}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         {activeTab === 'support' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in-up items-center">
               <div className="space-y-6">
                  <div className="bg-goat-red/10 p-10 rounded-[50px] relative overflow-hidden inline-block mb-4">
                     <MessageCircle size={64} className="text-goat-red animate-pulse" />
                     <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 blur-2xl" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-white leading-[0.9]">
                     ATENCIÓN <span className="text-goat-red">DIAMOND</span> PERSONALIZADA
                  </h2>
                  <p className="text-white/40 font-mono text-xs max-w-sm uppercase tracking-widest leading-relaxed">¿Dudas con tu pedido o necesitas asesoría? Chatea directamente con nuestro equipo encargado del Hype.</p>
                  <a 
                    href="https://wa.me/573117780713" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 hover:bg-green-600 h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-hype font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-green-500/20"
                  >
                    Hablar por WhatsApp <ExternalLink size={18} />
                  </a>
               </div>
               <div className="bg-goat-card border border-white/5 rounded-[40px] p-8 space-y-4">
                  <div className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
                     <div className="p-3 bg-white/5 rounded-2xl text-white/30"><Clock size={18} /></div>
                     <div>
                        <div className="text-[10px] font-black uppercase text-white/40">Horario de Atención</div>
                        <div className="text-xs font-bold text-white">Lunes a Sábado: 8:00 AM - 8:00 PM</div>
                     </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
                     <div className="p-3 bg-white/5 rounded-2xl text-white/30"><Calendar size={18} /></div>
                     <div>
                        <div className="text-[10px] font-black uppercase text-white/40">Garantía GOAT</div>
                        <div className="text-xs font-bold text-white">Todos nuestros productos son 100% auténticos.</div>
                     </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
                     <div className="p-3 bg-white/5 rounded-2xl text-white/30"><CheckCircle2 size={18} /></div>
                     <div>
                        <div className="text-[10px] font-black uppercase text-white/40">Envíos</div>
                        <div className="text-xs font-bold text-white">Envíos nacionales asegurados.</div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
           <div className="relative bg-goat-card border border-white/10 rounded-[40px] w-full max-w-md p-8 animate-fade-in-up border-b-4 border-b-goat-red shadow-2xl">
              <h3 className="text-2xl font-black italic text-white uppercase mb-6">Ajustes de Perfil</h3>
              
              <form onSubmit={async (e) => {
                 e.preventDefault();
                 try {
                    await profileService.updateMe(editFormData);
                    setProfile(prev => ({ ...prev, ...editFormData }));
                    setIsEditing(false);
                 } catch (err) { console.error(err); }
              }} className="space-y-4">
                 <div>
                    <label className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest pl-2 mb-2 block">Nombre Completo</label>
                    <input 
                       name="nombre_completo" 
                       value={editFormData.nombre_completo || ''} 
                       onChange={(e) => setEditFormData({ ...editFormData, nombre_completo: e.target.value })}
                       className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-white font-mono text-xs focus:border-goat-blue/50 outline-none transition-all" 
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest pl-2 mb-2 block">WhatsApp / Celular</label>
                    <input 
                       name="telefono" 
                       value={editFormData.telefono || ''} 
                       onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                       className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-white font-mono text-xs focus:border-goat-blue/50 outline-none transition-all" 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest pl-2 mb-2 block">Talla US (Zapato)</label>
                        <input 
                           name="talla_calzado_us" 
                           value={editFormData.talla_calzado_us || ''} 
                           onChange={(e) => {
                              const val = e.target.value;
                              const newGen = val.includes('/') ? 'unisex' : editFormData.genero;
                              setEditFormData({ ...editFormData, talla_calzado_us: val, genero: newGen });
                           }}
                           className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-white font-mono text-xs focus:border-goat-blue/50 outline-none transition-all uppercase" 
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest pl-2 mb-2 block">Género (Sizing)</label>
                        <select 
                           name="genero" 
                           value={editFormData.genero || 'unisex'} 
                           onChange={(e) => setEditFormData({ ...editFormData, genero: e.target.value })}
                           className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-white font-mono text-xs focus:border-goat-blue/50 outline-none transition-all appearance-none cursor-pointer"
                        >
                           <option value="hombre" className="bg-goat-card">Hombre (M)</option>
                           <option value="mujer" className="bg-goat-card">Mujer (W)</option>
                           <option value="junior" className="bg-goat-card">Junior (GS)</option>
                           <option value="unisex" className="bg-goat-card">Unisex</option>
                        </select>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest pl-2 mb-2 block">Talla Ropa</label>
                    <input 
                       name="talla_ropa" 
                       value={editFormData.talla_ropa || ''} 
                       onChange={(e) => setEditFormData({ ...editFormData, talla_ropa: e.target.value })}
                       className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-white font-mono text-xs focus:border-goat-blue/50 outline-none transition-all uppercase" 
                    />
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-14 rounded-2xl bg-white/5 text-white/40 font-mono text-[10px] font-black uppercase hover:bg-white/10 transition-all">Cancelar</button>
                    <button type="submit" className="flex-[2] h-14 rounded-2xl bg-goat-red text-white font-hype font-black uppercase text-xs shadow-xl shadow-goat-red/20 active:scale-95 transition-all">Guardar Cambios</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* ADD ADDRESS MODAL */}
      {isAddingAddress && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center px-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddingAddress(false)} />
           <div className="relative bg-goat-card border border-white/10 rounded-[40px] w-full max-w-sm p-8 animate-fade-in-up border-b-4 border-b-goat-blue shadow-2xl">
              <h3 className="text-2xl font-black italic text-white uppercase mb-6">Nueva Dirección</h3>
              
              <form onSubmit={async (e) => {
                 e.preventDefault();
                 const formData = new FormData(e.target);
                 const data = Object.fromEntries(formData);
                 try {
                    const newAddr = await profileService.addAddress(data);
                    setAddresses(prev => [...prev, newAddr]);
                    setIsAddingAddress(false);
                 } catch (err) { console.error(err); }
              }} className="space-y-4">
                 <div>
                    <label className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest pl-2 mb-2 block">Ciudad</label>
                    <input name="ciudad" placeholder="Ej: Medellín" required className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-white font-mono text-xs focus:border-goat-blue/50 outline-none transition-all uppercase" />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest pl-2 mb-2 block">Dirección Detallada</label>
                    <input name="direccion_completa" placeholder="Cra, Calle, Apto..." required className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-white font-mono text-xs focus:border-goat-blue/50 outline-none transition-all" />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-mono text-white/30 font-bold tracking-widest pl-2 mb-2 block">Indicaciones / Barrio</label>
                    <input name="indicaciones" placeholder="Ej: Edificio X, Portería..." className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-white font-mono text-xs focus:border-goat-blue/50 outline-none transition-all font-mono" />
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsAddingAddress(false)} className="flex-1 h-14 rounded-2xl bg-white/5 text-white/40 font-mono text-[10px] font-black uppercase hover:bg-white/10 transition-all">Cancelar</button>
                    <button type="submit" className="flex-[2] h-14 rounded-2xl bg-goat-blue text-white font-hype font-black uppercase text-xs shadow-xl shadow-goat-blue/20 active:scale-95 transition-all">Añadir Dirección</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
