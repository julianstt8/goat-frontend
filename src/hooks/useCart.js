import { useState, useEffect } from 'react';

export const useCart = () => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('goat_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('goat_cart', JSON.stringify(cartItems));
  }, [cartItems]);

   const addToCart = (product) => {
     setCartItems((prev) => {
       const existing = prev.find((item) => item.id === product.id);
       const maxStock = product.stock_disponible || 1;
 
       if (existing) {
         // Limit to available stock
         if (existing.quantity >= maxStock) return prev;
         
         return prev.map((item) =>
           item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
         );
       }
       return [...prev, { ...product, quantity: 1 }];
     });
   };
 
   const removeFromCart = (productId) => {
     setCartItems((prev) => prev.filter((item) => item.id !== productId));
   };
 
   const updateQuantity = (productId, quantity) => {
     if (quantity < 1) return removeFromCart(productId);
     
     setCartItems((prev) =>
       prev.map((item) => {
         if (item.id === productId) {
           const maxStock = item.stock_disponible || 1;
           const finalQuantity = Math.min(quantity, maxStock);
           return { ...item, quantity: finalQuantity };
         }
         return item;
       })
     );
   };

  const clearCart = () => setCartItems([]);

  // Calculation Logic for Phase 1 (Simplified for Stock Products)
  const calculateTotals = () => {
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const baseTotalUsd = cartItems.reduce((acc, item) => acc + (item.precio_compra_usd * item.quantity), 0);
    
    // As per user: "Stock products have final price, no combo discount applies"
    const totalCop = cartItems.reduce((acc, item) => acc + (item.precio_calculado * item.quantity), 0);
    
    const depositCop = totalCop * 0.5;

    return {
      totalItems,
      baseTotalUsd,
      shippingDiscountUsd: 0,
      totalCop: Math.ceil(totalCop / 1000) * 1000,
      depositCop: Math.ceil(depositCop / 1000) * 1000,
      savingsCop: 0
    };
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    calculateTotals
  };
};
