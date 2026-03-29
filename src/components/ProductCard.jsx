import React, { useState } from 'react';
import { Package, LayoutGrid, ShoppingCart, ChevronDown } from 'lucide-react';

/**
 * ProductCard Premium con Selector de Tallas (Best Practice)
 * Agrupa variantes del mismo producto para una experiencia de tienda nivel PRO.
 */
const ProductCard = ({ product, trm, onAddToCart }) => {
  // Manejamos la selección de variante si existen múltiples tallas
  const variants = product.variants || [{ id: product.id, talla: product.talla || 'UNISIZE' }];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const [showSizes, setShowSizes] = useState(false);

  const isExclusive = product.peso_libras > 2;

  // El precio calculado ya viene del padre (App.jsx)
  const finalPrice = product.precio_calculado || 0;

  const handleAddToCart = () => {
    // IMPORTANTE: Enviamos al carrito el ID específico de la unidad física seleccionada
    // Pero mantenemos los datos visuales de la referencia base.
    onAddToCart({
      ...product,
      id: selectedVariant.id,
      talla: selectedVariant.talla
    });
  };

  return (
    <div className="group bg-goat-card rounded-[32px] border border-white/5 overflow-hidden active:scale-[0.98] transition-all duration-500 shadow-2xl flex flex-col h-full ring-1 ring-white/5 hover:ring-white/10">
      <div className="relative aspect-square bg-[#0a0a0a] overflow-hidden flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-gradient-to-tr from-goat-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        {/* Product Visual Placeholder */}
        <div className="text-white/5 group-hover:text-white/10 group-hover:scale-110 transition-all duration-1000 ease-out">
           <Package size={120} strokeWidth={0.5} />
        </div>
        
        {/* Status Badges */}
        <div className="absolute top-5 left-5 flex flex-col gap-2 z-10">
          <span className="bg-goat-blue/10 backdrop-blur-md text-goat-blue text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-goat-blue/20">
            EN STOCK
          </span>
          {isExclusive && (
            <span className="bg-white/10 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/10">
              LIMITED
            </span>
          )}
        </div>

        {/* Quick Size Toggle (Mobile Friendly) */}
        {variants.length > 1 && (
          <div className="absolute bottom-4 inset-x-4 flex justify-center z-20">
             <button 
               onClick={(e) => { e.stopPropagation(); setShowSizes(!showSizes); }}
               className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2 hover:bg-white hover:text-black transition-all"
             >
                TALLA: {selectedVariant.talla} <ChevronDown size={14} className={`transition-transform duration-300 ${showSizes ? 'rotate-180' : ''}`} />
             </button>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow bg-white/[0.01]">
        {/* Size Selection Overlay (Clean and Modern) */}
        {showSizes && variants.length > 1 && (
          <div className="grid grid-cols-3 gap-2 mb-4 animate-fade-in p-2 bg-black/20 rounded-2xl border border-white/5">
            {variants.map(v => (
              <button 
                key={v.id}
                onClick={() => { setSelectedVariant(v); setShowSizes(false); }}
                className={`py-2 rounded-xl text-[10px] font-black font-mono transition-all border ${
                  selectedVariant.id === v.id 
                  ? 'bg-goat-red border-goat-red text-white' 
                  : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                }`}
              >
                {v.talla}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[9px] text-white/20 font-mono uppercase tracking-[0.2em]">
            <LayoutGrid size={10} className="text-goat-red" /> 
            {product.categoria?.nombre || 'General'}
          </div>
          <h3 className="text-base font-hype font-bold text-white uppercase italic tracking-tight opacity-90 leading-tight line-clamp-2 min-h-[44px]">
            {product.referencia}
          </h3>
        </div>
        
        <div className="mt-auto pt-6 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest leading-none mb-2">Pagar Ahora</span>
            <div className="text-2xl font-hype font-black text-white leading-none tracking-tighter">
              <span className="text-sm text-goat-red mr-1">$</span>
              {new Intl.NumberFormat('es-CO').format(finalPrice)}
            </div>
            {variants.length > 1 && (
              <span className="text-[9px] text-white/40 font-mono mt-2 flex items-center gap-1 italic">
                 <Package size={10} /> {variants.length} Tallas disponibles
              </span>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="group/btn w-14 h-14 bg-white text-black rounded-[22px] flex items-center justify-center hover:bg-goat-red hover:text-white transition-all duration-500 shadow-xl shadow-white/5 active:scale-90"
          >
            <ShoppingCart size={24} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
