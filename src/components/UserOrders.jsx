import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, AlertCircle, Wallet, ArrowRight, Activity, ShoppingBag } from 'lucide-react';
import { orderService } from '../services/api';

const UserOrders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderService.getAll();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching user orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'entregado': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'en_transito': return 'bg-goat-blue/10 text-goat-blue border-goat-blue/20';
      case 'en_casillero': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'comprado': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-white/10 text-white/40 border-white/5';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-pulse">
        <Activity size={48} className="text-goat-red mb-4 animate-spin-slow" />
        <p className="text-white/20 font-mono text-xs uppercase tracking-widest">Cargando tus pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-white">
            MIS <span className="text-goat-red">PEDIDOS</span>
          </h1>
          <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mt-3 font-bold">
            HOLA, {user?.nombre_completo.toUpperCase()} • Tienes {orders.length} pedidos activos
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
           <div className="h-10 w-10 bg-goat-red/10 rounded-xl flex items-center justify-center text-goat-red">
             <ShoppingBag size={20} />
           </div>
           <div>
             <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest leading-none mb-1">Total Pedidos</div>
             <div className="text-lg font-black italic text-white leading-none">{orders.length}</div>
           </div>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="bg-goat-card border border-white/5 rounded-[40px] p-20 flex flex-col items-center justify-center text-center">
            <div className="bg-white/5 p-8 rounded-full mb-6">
              <Package size={64} strokeWidth={1} className="text-white/10" />
            </div>
            <h3 className="text-xl font-black italic uppercase text-white mb-2">Aún no tienes pedidos</h3>
            <p className="text-white/40 font-mono text-xs max-w-xs mb-8 uppercase tracking-widest leading-relaxed">Explora nuestro catálogo y empieza a coleccionar hype con GOAT.</p>
            <button onClick={() => window.location.reload()} className="h-14 px-8 bg-white text-black rounded-2xl font-hype font-black uppercase text-sm hover:scale-105 transition-all">Ir al catálogo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {orders.map(order => (
            <div key={order.id} className="bg-goat-card border border-white/5 rounded-[40px] p-8 space-y-6 group hover:border-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${getStatusStyle(order.estado_logistico)}`}>
                        {order.estado_logistico?.replace('_', ' ') || 'pendiente'}
                    </span>
                    <h3 className="text-xl font-hype font-black italic uppercase text-white mt-4 line-clamp-1">{order.producto?.referencia || order.referencia}</h3>
                    <p className="text-white/20 font-mono text-[9px] uppercase tracking-widest mt-1">Guía: {order.tracking_number || 'Pendiente por tramo'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/20 font-mono uppercase block mb-1">{new Date(order.fecha_compra).toLocaleDateString()}</span>
                    <span className="text-lg font-hype font-black italic text-white block">$ {new Intl.NumberFormat('es-CO').format(order.precio_venta_cop)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-black/20 p-5 rounded-3xl border border-white/5">
                   <div>
                     <div className="text-[9px] text-white/20 uppercase font-mono mb-1">Abonado</div>
                     <div className="text-sm font-black italic text-green-500">$ {new Intl.NumberFormat('es-CO').format(order.total_pagado || 0)}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-[9px] text-white/20 uppercase font-mono mb-1">Saldo</div>
                     <div className={`text-sm font-black italic ${order.saldo_restante > 0 ? 'text-goat-red' : 'text-green-500/50'}`}>
                        {order.saldo_restante > 0 ? `$ ${new Intl.NumberFormat('es-CO').format(order.saldo_restante)}` : 'PAGADO'}
                     </div>
                   </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                   {order.estado_logistico === 'entregado' ? (
                     <div className="flex items-center gap-2 text-[10px] font-mono text-green-500 font-bold uppercase tracking-widest">
                       <CheckCircle2 size={14} /> Recibido con éxito
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-[10px] font-mono text-goat-blue font-bold uppercase tracking-widest">
                       <Clock size={14} /> En proceso logístico
                     </div>
                   )}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
