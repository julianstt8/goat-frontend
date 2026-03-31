import React from 'react';
import { ShoppingCart, X, Plus, Minus, Send, CheckCircle2 } from 'lucide-react';
import { orderService } from '../services/api';

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemove, 
  onClear,
  totals, 
  trm,
  user // Añadir usuario prop
}) => {
  const [customer, setCustomer] = React.useState({ 
    nombre: '', 
    telefono: '',
    ciudad: '',
    direccion: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleWhatsAppCheckout = async () => {
    // Si no está registrado y no llenó datos básicos, pedirlos
    if (!user && (!customer.nombre || !customer.telefono || !customer.ciudad || !customer.direccion)) {
       alert("Por favor, completa todos los campos de envío para registrar tu pedido.");
       return;
    }

    setIsSubmitting(true);
    try {
      // Registrar pedido vía API para congelar stock
      const response = await orderService.createBatch({
        items: cartItems,
        cliente: user ? { id: user.id } : { ...customer, email: `${customer.telefono}@goat.com` },
        trm_used: trm.valor + 200,
        es_reserva: true,
        ciudad_envio: user ? (user.ciudad || customer.ciudad) : customer.ciudad,
        direccion_envio: user ? (user.direccion || customer.direccion) : customer.direccion
      });

      const pedidoId = response.pedidos?.[0]?.id?.split('-')[0] || 'N/A';
      
      // Mapeo seguro de dirección e información de cliente
      const clientName = (user?.nombre_completo || customer.nombre || 'Invitado').toUpperCase();
      const phone = user?.telefono || customer.telefono || 'N/A';
      
      // Buscar dirección en raíz o en listado de direcciones si existe
      const city = (user?.ciudad || customer.ciudad || 'Por confirmar').toUpperCase();
      const addr = (user?.direccion || customer.direccion || 'Por confirmar').toUpperCase();

      const text = `🔥 *ORDEN DE COMPRA GOAT* 🔥\n\n` +
        `🆔 *PEDIDO:* #${pedidoId}\n\n` +
        `👤 *CLIENTE:* ${clientName}\n` +
        `📱 *WhatsApp:* ${phone}\n\n` +
        `📍 *DATOS DE ENVÍO:*\n` +
        `Ciudad: ${city}\n` +
        `Dirección: ${addr}\n\n` +
        `👟 *PRODUCTOS:* \n` +
        cartItems.map(item => `- ${item.referencia} (Talla: ${item.talla || 'N/A'})`).join('\n') +
        `\n\n💰 *RESUMEN DE PAGO:*\n` +
        `*Total:* $ ${new Intl.NumberFormat('es-CO').format(totals.totalCop)}\n` +
        `*Abono (50%):* $ ${new Intl.NumberFormat('es-CO').format(totals.depositCop)}\n\n` +
        `✅ _Registrado en la web oficial. Adjunto comprobante..._`;
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=573117780713&text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
      onClear();
      onClose();
    } catch (err) {
      console.error('Checkout error:', err);
      alert("Hubo un error al registrar tu pedido. Por favor, intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-goat-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-goat-card h-full shadow-2xl flex flex-col border-l border-white/5 animate-slide-in-right">
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <ShoppingCart className="text-goat-red" size={24} />
             <h2 className="text-xl font-hype font-bold">Carrito <span className="text-white/20 ml-1">({cartItems.length})</span></h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
              <ShoppingCart size={64} className="mb-4" />
              <p className="text-lg">Tu carrito está vacío</p>
              <p className="text-sm mt-2">Agrega tus productos favoritos de @GOAT</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                <div className="w-20 h-20 bg-black/40 rounded-lg flex items-center justify-center border border-white/5">
                   <div className="text-white/10 group-hover:scale-110 transition-transform">📦</div>
                </div>
                <div className="flex-grow py-1">
                  <h4 className="text-sm font-semibold pr-4 leading-tight">{item.referencia}</h4>
                  <p className="text-[11px] text-white/30 font-mono mt-1">
                    Talla: {item.talla || 'N/A'} | {item.peso_libras} Lb
                  </p>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center bg-black/40 rounded-lg border border-white/5 h-8">
                       <button 
                         onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                         className="px-2.5 h-full opacity-60 hover:opacity-100 transition-opacity"
                       >
                         <Minus size={14} />
                       </button>
                       <span className="px-3 text-xs font-mono font-bold">{item.quantity}</span>
                       <button 
                         onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                         className="px-2.5 h-full opacity-60 hover:opacity-100 transition-opacity"
                       >
                         <Plus size={14} />
                       </button>
                    </div>
                    <div className="text-right">
                       <div className="text-xs font-mono text-white/30 truncate max-w-[100px]">
                         {new Intl.NumberFormat('es-CO').format(item.precio_calculado)}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 bg-white/[0.03] border-t border-white/10 space-y-4">
             {(!user || (!user.ciudad || !user.direccion)) && (
               <div className="space-y-3 mb-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Nombre Completo" 
                      value={customer.nombre}
                      onChange={(e) => setCustomer({...customer, nombre: e.target.value})}
                      className="bg-black/40 border border-white/10 h-12 rounded-xl px-4 text-xs font-mono outline-none focus:border-goat-red/30"
                    />
                    <input 
                      type="text" 
                      placeholder="WhatsApp" 
                      value={customer.telefono}
                      onChange={(e) => setCustomer({...customer, telefono: e.target.value})}
                      className="bg-black/40 border border-white/10 h-12 rounded-xl px-4 text-xs font-mono outline-none focus:border-goat-red/30"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ciudad (Ej: Medellín)" 
                    value={customer.ciudad}
                    onChange={(e) => setCustomer({...customer, ciudad: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 h-12 rounded-xl px-4 text-xs font-mono outline-none focus:border-goat-red/30"
                  />
                  <input 
                    type="text" 
                    placeholder="Dirección Completa" 
                    value={customer.direccion}
                    onChange={(e) => setCustomer({...customer, direccion: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 h-12 rounded-xl px-4 text-xs font-mono outline-none focus:border-goat-red/30"
                  />
               </div>
             )}
             <div className="space-y-1">
               <div className="flex justify-between items-center text-lg font-hype font-bold">
                 <span>Total a Pagar</span>
                 <span className="text-white">$ {new Intl.NumberFormat('es-CO').format(totals.totalCop)}</span>
               </div>
               <p className="text-[10px] text-white/30 font-mono text-right italic font-medium uppercase tracking-wider">
                 Precios finales según stock disponible
               </p>
             </div>

             <div className="p-4 bg-goat-blue/10 border border-goat-blue/20 rounded-xl mt-4">
               <div className="flex justify-between items-center text-goat-blue font-bold">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono leading-none mb-1 opacity-70">Abono Inicial (50%)</span>
                    <span className="text-xl">$ {new Intl.NumberFormat('es-CO').format(totals.depositCop)}</span>
                  </div>
                  <div className="text-[10px] text-right max-w-[100px] leading-tight font-mono opacity-60">
                    Reserva hoy y paga lo demás cuando llegue.
                  </div>
               </div>
             </div>

             <button 
               onClick={handleWhatsAppCheckout}
               disabled={isSubmitting}
               className={`w-full bg-goat-red hover:bg-red-700 h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-hype font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-goat-red/20 border border-white/10 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {isSubmitting ? (
                 <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
               ) : (
                 <Send size={20} />
               )}
               {isSubmitting ? 'REGISTRANDO...' : 'FINALIZAR EN WHATSAPP'}
             </button>
             
             <p className="text-[10px] text-center text-white/20 font-mono uppercase tracking-[0.2em]">
               @GOAT.ENCARGOS — ENVÍOS 10-15 DÍAS
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
