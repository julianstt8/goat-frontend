import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Trash2, 
  Search, 
  Package, 
  Users, 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Activity, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  RefreshCw,
  LayoutGrid,
  ChevronDown,
  Info,
  Calendar
} from 'lucide-react';

const Tooltip = ({ children, text }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);
  // Prevenimos que el tooltip se quede pegado si el componente se desmonta
  useEffect(() => {
    return () => setShow(false);
  }, []);

  if (!text) return children;

  return (
    <>
      <div 
        className="relative w-full h-full flex items-center"
        onMouseEnter={(e) => { 
           setPos({ x: e.clientX, y: e.clientY });
           setShow(true); 
        }}
        onMouseLeave={() => setShow(false)}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      >
        <div className="w-full h-full flex items-center cursor-help">
          {children}
        </div>
      </div>
      {show && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none animate-fade-in drop-shadow-2xl"
          style={{ 
            left: `${pos.x + 15}px`, 
            top: `${pos.y + 15}px`,
            position: 'fixed'
          }}
        >
          <div className="bg-goat-black/95 border border-white/20 px-4 py-2.5 rounded-xl text-[9px] font-mono text-white font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(0,0,0,0.9)] whitespace-pre-wrap leading-relaxed">
             {text}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const PaginationUI = ({ data, onPageChange }) => {
  if (!data || data.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-8 py-6 border-t border-white/5 bg-white/[0.01]">
       <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest italic">{data.totalItems} Items encontrados</p>
       <div className="flex gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
             <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-xl text-[10px] font-mono font-bold transition-all border ${data.currentPage === page ? 'bg-goat-red border-goat-red shadow-lg shadow-goat-red/20 text-white' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
             >
                {page.toString().padStart(2, '0')}
             </button>
          ))}
       </div>
    </div>
  );
};

import { calculationService, categoryService, reportService, orderService, userService, productService, paymentService } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('quoter'); // 'quoter', 'orders', 'inventory', 'debtors'
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [users, setUsers] = useState([]);
  const [trm, setTrm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortField, setSortField] = useState('fecha_compra');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // States for Order Update  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuoterFinishModalOpen, setIsQuoterFinishModalOpen] = useState(false);
  const [quoterCustomer, setQuoterCustomer] = useState({ id: '', nombre: '', email: '', telefono: '' });
  const [allUsers, setAllUsers] = useState([]);
  const [notification, setNotification] = useState(null); // { type, message }
  const [confirmState, setConfirmState] = useState(null); // { message, onConfirm }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const askConfirm = (message, onConfirm) => {
    setConfirmState({ message, onConfirm });
  };
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderPayments, setOrderPayments] = useState([]);
  const [inventoryView, setInventoryView] = useState('grid');
  const [inventoryFilter, setInventoryFilter] = useState('available');
  const [modalProductType, setModalProductType] = useState(true);
  const [modalStockQty, setModalStockQty] = useState(1);
  const [modalData, setModalData] = useState({});

  // Quote items state
  const [quoteItems, setQuoteItems] = useState([]);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(console.error);
    calculationService.getTrm().then(setTrm).catch(console.error);
    userService.getAll().then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      paymentService.getByOrder(selectedProduct.id || selectedProduct.pedido_id).then(res => {
         setOrderPayments(res.pagos || []);
      }).catch(console.error);
      
      // Initialize modal states for product editor
      setModalProductType(selectedProduct.es_serializado ?? true);
      setModalStockQty(selectedProduct.stock_disponible ?? 1);
    } else {
      setOrderPayments([]);
      setPaymentAmount('');
    }
  }, [selectedProduct]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, inventoryFilter]);

  useEffect(() => {
    if (activeTab === 'quoter') {
      calculationService.getTrm().then(setTrm).catch(console.error);
    }
    if (activeTab === 'debtors') {
      setLoading(true);
      reportService.getDebtors().then(setDebtors).finally(() => setLoading(false));
    }
    if (activeTab === 'orders') {
      setLoading(true);
      orderService.getAll().then(setOrders).finally(() => setLoading(false));
      if (users.length === 0) userService.getAll().then(setUsers).catch(console.error);
    }
    if (activeTab === 'inventory') {
      setLoading(true);
      productService.getAll()
        .then((prods) => {
          // Now we use the persisted 'precio_venta_cop' from DB
          setAllProducts(prods);
        })
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedProduct) {
      setModalData({
        referencia: selectedProduct.referencia,
        categoria_id: selectedProduct.categoria_id,
        talla: selectedProduct.talla || '',
        peso_libras: selectedProduct.peso_libras,
        precio_venta_cop: selectedProduct.precio_venta_cop,
        en_stock: selectedProduct.en_stock,
        es_serializado: selectedProduct.es_serializado || false,
        stock_disponible: selectedProduct.stock_disponible || 1
      });
      setModalProductType(selectedProduct.es_serializado !== false);
      setModalStockQty(selectedProduct.stock_disponible || 1);
    }
  }, [selectedProduct]);

  const handleRecalculatePrices = async () => {
    const options = [
      { id: 'historico', label: 'TRM DE COMPRA (FECHA CREACIÓN)', icon: <RefreshCw size={12} /> },
      { id: 'actual', label: 'TRM ACTUAL DEL DÍA', icon: <DollarSign size={12} /> },
      { id: 'manual', label: 'TRM MANUAL ESPECÍFICA', icon: <Plus size={12} /> }
    ];

    let choice = 'historico';
    const choiceStr = prompt(`Elige el modo de sincronización:\n1. HISTÓRICO (TRM del día de compra)\n2. ACTUAL (TRM oficial hoy)\n3. MANUAL (Ingresar valor)\n\nEscribe 1, 2 o 3`, "1");
    
    if (choiceStr === "2") choice = 'actual';
    if (choiceStr === "3") choice = 'manual';
    if (!choiceStr) return;

    let manualTrm = null;
    if (choice === 'manual') {
      manualTrm = prompt('¿Qué TRM deseas usar?');
      if (!manualTrm) return;
    }

    askConfirm(`¿Recalcular precios usando el modo: ${choice.toUpperCase()}?`, async () => {
      setLoading(true);
      try {
        await productService.recalculateAll(choice, manualTrm ? Number(manualTrm) : null);
        showNotification('success', '¡Stock sincronizado con éxito!');
        productService.getAll().then(setAllProducts);
      } catch (err) {
        showNotification('error', 'Error en la sincronización masiva');
      } finally {
        setLoading(false);
      }
    });
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const addQuoteItem = () => {
     setQuoteItems([...quoteItems, {
        id: Date.now(),
        referencia: '',
        precioCompraUsd: '',
        pesoLibras: 1.0,
        categoria_id: ''
     }]);
  };

  const removeQuoteItem = (id) => {
    setQuoteItems(quoteItems.filter(item => item.id !== id));
  };

  const updateQuoteItem = (id, field, value) => {
    setQuoteItems(quoteItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const [totalQuotedCop, setTotalQuotedCop] = useState(0);

  useEffect(() => {
    if (activeTab === 'quoter' && quoteItems.length > 0) {
      const calculateTotal = async () => {
        try {
          const res = await calculationService.calculateBatch(quoteItems.map(item => ({
             referencia: item.referencia,
             precioCompraUsd: Number(item.precioCompraUsd || 0),
             pesoLibras: Number(item.pesoLibras || 1),
             categoria_id: item.categoria_id ? Number(item.categoria_id) : null
          })));
          const total = res.productos.reduce((acc, p) => acc + (p.precio_final_cop || 0), 0);
          setTotalQuotedCop(total);
        } catch (err) { console.error('Error calculating total:', err); }
      };
      calculateTotal();
    } else {
      setTotalQuotedCop(0);
    }
  }, [quoteItems, activeTab]);

  const handleResetQuoter = () => {
    askConfirm('¿Limpiar todos los ítems de la cotización?', () => {
      setQuoteItems([]);
    });
  };

  const handleFinishQuote = async () => {
    if (quoteItems.length === 0) return;
    setLoading(true);
    try {
      const users = await userService.getAll();
      // Filter for both client types: standard and vip
      setAllUsers(users.filter(u => u.rol.startsWith('cliente')));
      setIsQuoterFinishModalOpen(true);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreateOrderFromQuote = async () => {
    if (!quoterCustomer.id && (!quoterCustomer.nombre || !quoterCustomer.email)) {
      showNotification('error', 'Nombre y Email son obligatorios para nuevos clientes');
      return;
    }

    setLoading(true);
    try {
      let targetCustomerId = quoterCustomer.id;
      
      if (!targetCustomerId) {
        const newU = await userService.create({ 
          nombre_completo: quoterCustomer.nombre, 
          email: quoterCustomer.email,
          telefono: quoterCustomer.telefono,
          rol: 'cliente_standard'
        });
        targetCustomerId = newU.id;
      }

      // Calculate the items individually for the order data
      const calcRes = await calculationService.calculateBatch(quoteItems.map(item => ({
        referencia: item.referencia,
        precioCompraUsd: Number(item.precioCompraUsd || 0),
        pesoLibras: Number(item.pesoLibras || 1),
        categoria_id: item.categoria_id ? Number(item.categoria_id) : null
      })));

      // Create an order for each item
      for (let i = 0; i < quoteItems.length; i++) {
        const item = quoteItems[i];
        const calc = calcRes.productos[i];
        
        await orderService.create({
          usuario_id: targetCustomerId,
          referencia: item.referencia,
          categoria_id: item.categoria_id,
          talla: item.talla || 'N/A',
          precio_compra_usd: Number(item.precioCompraUsd || 0),
          peso_libras: Number(item.pesoLibras || 1),
          precio_venta_cop: calc?.precio_final_cop || 0,
          trm_utilizada: trm?.valor || 0,
          costo_total_usd: Number(item.precioCompraUsd || 0),
          fecha_compra: new Date().toISOString()
        });
      }

      showNotification('success', `¡${quoteItems.length} pedidos registrados!`);
      setQuoteItems([]);
      setIsQuoterFinishModalOpen(false);
      setQuoterCustomer({ id: '', nombre: '', email: '', telefono: '' });
      // Refresh orders
      reportService.getDebtors().then(setDebtors);
    } catch (err) {
      showNotification('error', 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const processedOrders = useMemo(() => {
    const list = [...orders];
    const filtered = list.filter(o => 
      (o.producto?.referencia || o.referencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.cliente?.nombre_completo || o.cliente || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const sorted = filtered.sort((a, b) => {
      let valA, valB;
      if (sortField === 'referencia') { valA = a.producto?.referencia || a.referencia; valB = b.producto?.referencia || b.referencia; }
      else if (sortField === 'cliente') { valA = a.cliente?.nombre_completo || a.cliente; valB = b.cliente?.nombre_completo || b.cliente; }
      else if (sortField === 'precio_venta_cop') { valA = a.precio_venta_cop; valB = b.precio_venta_cop; }
      else { valA = a[sortField]; valB = b[sortField]; }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = sorted.slice(startIndex, startIndex + itemsPerPage);
    return { items, totalPages, totalItems };
  }, [orders, searchTerm, sortField, sortOrder, currentPage, itemsPerPage]);

  const processedDebtors = useMemo(() => {
    const list = [...debtors];
    const filtered = list.filter(d => 
      (d.referencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = filtered.sort((a, b) => {
       let valA = a[sortField]; let valB = b[sortField];
       if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
       if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
       return 0;
    });
    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = sorted.slice(startIndex, startIndex + itemsPerPage);
    return { items, totalPages, totalItems };
  }, [debtors, searchTerm, sortField, sortOrder, currentPage, itemsPerPage]);

  const processedInventory = useMemo(() => {
    let list = [...allProducts];
    
    // Apply Inventory Filter (In Stock vs Sold vs Pre-Order)
    if (inventoryFilter === 'available') list = list.filter(p => !p.vendido && p.en_stock);
    if (inventoryFilter === 'sold') list = list.filter(p => p.vendido);
    if (inventoryFilter === 'preorder') list = list.filter(p => !p.vendido && !p.en_stock);

    const filtered = list.filter(p => 
      (p.referencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categoria?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const sorted = filtered.sort((a, b) => {
      let valA, valB;
      if (sortField === 'categoria') { valA = a.categoria?.nombre || ''; valB = b.categoria?.nombre || ''; }
      else { valA = a[sortField]; valB = b[sortField]; }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = sorted.slice(startIndex, startIndex + itemsPerPage);
    return { items, totalPages, totalItems };
  }, [allProducts, searchTerm, sortField, sortOrder, currentPage, itemsPerPage, inventoryFilter]);

  const handleUpdateOrder = async () => {
     if (!selectedOrder) return;
     setLoading(true);
     try {
        const orderId = selectedOrder.id || selectedOrder.pedido_id;
        
        // 1. Actualizar Datos del Pedido
        await orderService.updateStatus(orderId, {
           estado_logistico: newStatus || selectedOrder.estado_logistico || 'pendiente',
           tracking_number: trackingNumber || selectedOrder.tracking_number || '',
           fecha_compra: newPurchaseDate || selectedOrder.fecha_compra
        });
        
        // 2. Registrar Abono si existe monto
        if (paymentAmount && Number(paymentAmount) > 0) {
           await paymentService.create(orderId, {
              monto_cop: Number(paymentAmount),
              metodo_pago: 'Transferencia',
              tipo_abono: 'Abono',
              fecha_pago: paymentDate || new Date().toISOString()
           });
        }

        showNotification('success', '¡Pedido y cartera actualizados!');
        setSelectedOrder(null);
        setNewStatus('');
        setTrackingNumber('');
        setNewPurchaseDate('');
        setPaymentAmount('');
        
        // Refrescar ambas listas
        orderService.getAll().then(setOrders);
        reportService.getDebtors().then(setDebtors);
     } catch (err) {
        showNotification('error', 'Error al actualizar: ' + (err.response?.data?.message || err.message));
     } finally {
        setLoading(false);
     }
   };

  const SortHeader = ({ label, field, currentField, onSort, align = 'left' }) => (
    <th 
      className={`px-4 py-3 font-black italic cursor-pointer hover:text-white transition-colors uppercase ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {currentField === field && <TrendingUp size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
      </div>
    </th>
  );

  const PaginationUI = ({ data, onPageChange }) => (
    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20 text-[10px] font-mono text-white/30 uppercase tracking-widest">
       <p>Mostrando {data.items.length} de {data.totalItems} resultados</p>
       <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-4 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-20 transition-all font-black"
          >
            Anterior
          </button>
          <div className="flex items-center px-4 font-black text-white/60">
             {currentPage} / {data.totalPages || 1}
          </div>
          <button 
            disabled={currentPage >= data.totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-4 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-20 transition-all font-black"
          >
            Siguiente
          </button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-goat-black text-white p-4 md:p-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="bg-goat-red p-2 rounded-xl"><Activity size={24} /></div>
              <h1 className="text-3xl font-hype font-black italic tracking-tight uppercase">Dashboard <span className="text-goat-red">Admin</span></h1>
           </div>
           <p className="text-white/40 font-mono text-xs uppercase tracking-widest pl-1">Control de Operaciones @GOAT.ENCARGOS</p>
        </div>

        <div className="bg-white/5 p-1.5 rounded-2xl border border-white/5 flex gap-1 overflow-x-auto max-w-full">
           <button onClick={() => setActiveTab('quoter')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black font-mono flex items-center shrink-0 gap-2 transition-all ${activeTab === 'quoter' ? 'bg-goat-red text-white' : 'text-white/40 hover:text-white'}`}><Calculator size={14} /> COTIZADOR</button>
           <button onClick={() => setActiveTab('orders')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black font-mono flex items-center shrink-0 gap-2 transition-all ${activeTab === 'orders' ? 'bg-goat-blue text-white' : 'text-white/40 hover:text-white'}`}><Package size={14} /> PEDIDOS</button>
           <button onClick={() => setActiveTab('debtors')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black font-mono flex items-center shrink-0 gap-2 transition-all ${activeTab === 'debtors' ? 'bg-amber-500 text-white' : 'text-white/40 hover:text-white'}`}><Users size={14} /> DEUDORES</button>
           <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black font-mono flex items-center shrink-0 gap-2 transition-all ${activeTab === 'inventory' ? 'bg-goat-red text-white' : 'text-white/40 hover:text-white'}`}><Plus size={14} /> STOCK</button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${activeTab === 'quoter' ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-8`}>
        <div className={`${activeTab === 'quoter' ? 'lg:col-span-2' : ''} space-y-6`}>
           {activeTab === 'quoter' && (
             <div className="bg-goat-card border border-white/5 rounded-3xl overflow-hidden animate-slide-in-right">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                   <h3 className="text-sm font-black italic uppercase tracking-tighter">Ítems a Cotizar</h3>
                   <div className="flex gap-2">
                      <button onClick={handleResetQuoter} className="p-2.5 bg-white/5 hover:bg-white/10 text-white/40 rounded-xl transition-all" title="Limpiar todo"><Trash2 size={16} /></button>
                      <button onClick={addQuoteItem} className="px-5 py-2.5 bg-goat-red text-white text-[11px] font-black uppercase rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-goat-red/20 transition-all active:scale-95 italic tracking-tighter"><Plus size={16} /> Agregar Producto</button>
                   </div>
                </div>
                
                <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-white/5 bg-black/20 text-white/40 uppercase tracking-widest text-[9px]">
                          <th className="px-6 py-4 font-black italic">Ref. / Producto</th>
                          <th className="px-6 py-4 font-black italic text-right">Compra USD</th>
                          <th className="px-6 py-4 font-black italic text-right">Lb.</th>
                          <th className="px-6 py-4 font-black italic">Categoría</th>
                          <th className="px-6 py-4 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {quoteItems.map(item => (
                          <tr key={item.id} className="hover:bg-white/[0.01] transition-colors border-l-2 border-l-transparent hover:border-l-goat-red">
                            <td className="px-6 py-4">
                               <Tooltip text={`EDITAR REFERENCIA: ${item.referencia || 'N/A'}`}>
                                 <input 
                                   type="text" 
                                   value={item.referencia}
                                   onChange={(e) => updateQuoteItem(item.id, 'referencia', e.target.value)}
                                   className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/10 font-bold uppercase italic"
                                   placeholder="EJ: JORDAN 1 RETRO"
                                 />
                               </Tooltip>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <Tooltip text={`COSTO DE COMPRA: $${item.precioCompraUsd} USD`}>
                                 <div className="flex items-center justify-end gap-1">
                                    <span className="text-goat-red opacity-30">$</span>
                                    <input 
                                      type="number" 
                                      value={item.precioCompraUsd}
                                      onChange={(e) => updateQuoteItem(item.id, 'precioCompraUsd', e.target.value)}
                                      className="bg-transparent border-none outline-none text-white w-16 text-right font-black"
                                      placeholder="0"
                                    />
                                 </div>
                               </Tooltip>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <Tooltip text={`PESO: ${item.pesoLibras} LB`}>
                                 <input 
                                   type="number" 
                                   step="0.1"
                                   value={item.pesoLibras}
                                   onChange={(e) => updateQuoteItem(item.id, 'pesoLibras', e.target.value)}
                                   className="bg-transparent border-none outline-none text-white w-10 text-right opacity-50"
                                 />
                               </Tooltip>
                            </td>
                            <td className="px-6 py-4">
                               <Tooltip text={`CATEGORÍA SELECCIONADA`}>
                                 <select 
                                   value={item.categoria_id}
                                   onChange={(e) => updateQuoteItem(item.id, 'categoria_id', e.target.value)}
                                   className="bg-transparent border-none outline-none text-white/40 appearance-none cursor-pointer hover:text-white transition-colors"
                                 >
                                   <option value="">GENERAL</option>
                                   {categories.map(c => (
                                     <option key={c.id} value={c.id}>{c.nombre.toUpperCase()}</option>
                                   ))}
                                 </select>
                               </Tooltip>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <button onClick={() => removeQuoteItem(item.id)} className="text-white/10 hover:text-goat-red transition-colors p-2"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                        {quoteItems.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-10 py-16 text-center text-white/10 italic font-medium uppercase tracking-[0.3em] text-xs">Aún no hay ítems para cotizar</td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {(activeTab === 'orders' || activeTab === 'debtors') && (
              <div className="bg-goat-card border border-white/5 rounded-3xl overflow-visible animate-slide-in-right">
                 <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="relative w-full max-sm:max-w-full max-w-sm">
                       <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                       <input type="text" placeholder="Buscar pedido o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 text-xs font-mono outline-none focus:border-white/10" />
                    </div>
                 </div>
                 <div className="w-full overflow-x-auto">
                    <table className="w-full text-left font-mono table-auto">
                        <thead>
                           <tr className="border-b border-white/5 text-[10px] text-white/40 text-left uppercase tracking-widest">
                              <SortHeader label="Ref / Producto" field="referencia" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Cliente / Cel" field="cliente" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Fecha" field="fecha_compra" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Logística" field="estado_logistico" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Financiero (COP)" field="precio_venta_cop" currentField={sortField} onSort={toggleSort} align="right" />
                              <th className="px-4 py-3 font-black italic text-right">Acción</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {(activeTab === 'orders' ? processedOrders : processedDebtors).items.map((item) => (
                             <tr key={item.id || item.pedido_id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-4 py-3">
                                   <Tooltip text={`${item.producto?.referencia || item.referencia || 'SIN NOMBRE'}\nTRACKING: ${item.tracking_number || 'N/A'}`}>
                                      <div className="flex flex-col">
                                         <span className="text-[10px] font-bold text-white uppercase line-clamp-1 max-w-[120px]">
                                            {item.producto?.referencia || (typeof item.producto === 'string' ? item.producto : '') || item.referencia || 'Sin nombre'}
                                         </span>
                                         <span className="text-[8px] text-white/40 line-clamp-1">{item.tracking_number || 'Sin Tracking'}</span>
                                      </div>
                                   </Tooltip>
                                </td>
                                <td className="px-4 py-3">
                                   <Tooltip text={`CLIENTE: ${item.cliente?.nombre_completo || item.cliente || 'CONSUMIDOR'}\nCEL: ${item.telefono || 'N/A'}`}>
                                      <div className="flex flex-col">
                                         <span className="text-[10px] text-goat-red font-black uppercase italic tracking-tighter line-clamp-1 max-w-[100px]">
                                            {item.cliente?.nombre_completo || (typeof item.cliente === 'string' ? item.cliente : '') || item.cliente || 'Consumidor'}
                                         </span>
                                         <span className="text-[8px] text-white/20">{item.telefono || 'N/A'}</span>
                                      </div>
                                   </Tooltip>
                                </td>
                                <td className="px-4 py-3 text-[9px] text-white/40 whitespace-nowrap">
                                   {(() => {
                                      const d = item.fecha_compra || item.createdAt;
                                      if (!d) return 'SIN FECHA';
                                      return (
                                        <Tooltip text={`FECHA DE COMPRA: ${new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`}>
                                          <div className="flex items-center gap-1.5">
                                            <Calendar size={10} className="text-white/20" />
                                            {new Date(d).toLocaleDateString()}
                                          </div>
                                        </Tooltip>
                                      );
                                   })()}
                                </td>
                                <td className="px-4 py-3">
                                   <Tooltip text={`ESTADO LOGÍSTICO ACTUAL: ${item.estado_logistico?.toUpperCase() || 'PENDIENTE'}`}>
                                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${item.estado_logistico === 'entregado' ? 'bg-green-500/10 text-green-500' : item.estado_logistico === 'en_transito' ? 'bg-goat-blue/10 text-goat-blue' : item.estado_logistico === 'en_casillero' ? 'bg-amber-500/10 text-amber-500' : 'bg-white/10 text-white/40'}`}>{(item.estado_logistico || 'pend.').replace('_', ' ').slice(0, 10)}</span>
                                   </Tooltip>
                                </td>
                                <td className="px-4 py-3 text-right">
                                   <Tooltip text={`TOTAL VENTA: $${new Intl.NumberFormat('es-CO').format(item.precio_venta_cop)} COP\nABONADO: $${new Intl.NumberFormat('es-CO').format(item.total_pagado || 0)} COP`}>
                                      <div className="flex flex-col items-end">
                                         <span className="text-[10px] font-black italic">$ {new Intl.NumberFormat('es-CO').format(item.precio_venta_cop)}</span>
                                         <div className="flex flex-col items-end opacity-60">
                                            <span className="text-[8px] text-green-500 font-mono">P: $ {new Intl.NumberFormat('es-CO').format(item.total_pagado || 0)}</span>
                                         </div>
                                      </div>
                                   </Tooltip>
                                </td>
                                <td className="px-4 py-3 text-right">
                                   <div className="flex gap-1 justify-end">
                                      <button onClick={() => setSelectedOrder(item)} className="p-1.5 bg-white/5 hover:bg-goat-blue rounded-lg transition-all" title="Gestionar Pedido"><Activity size={10} /></button>
                                      <button 
                                        onClick={() => {
                                           askConfirm(`¿Eliminar pedido de ${item.cliente?.nombre_completo || 'cliente'}?\nEl producto volverá a estar disponible para la venta.`, async () => {
                                              await orderService.delete(item.id || item.pedido_id);
                                              orderService.getAll().then(setOrders);
                                              productService.getAll().then(setAllProducts);
                                              reportService.getDebtors().then(setDebtors);
                                              showNotification('success', 'Pedido eliminado y stock retornado');
                                           });
                                        }} 
                                        className="p-1.5 bg-white/5 hover:bg-goat-red rounded-lg transition-all" 
                                        title="Eliminar Pedido"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                     <PaginationUI 
                       data={{ ...(activeTab === 'orders' ? processedOrders : processedDebtors), currentPage }} 
                       onPageChange={setCurrentPage} 
                     />
                  </div>
               </div>
            )}

           {activeTab === 'inventory' && (
              <div className="space-y-6">
                  {/* Inventory Metrics Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-right">
                     <div className="bg-goat-card border border-white/5 rounded-[32px] p-6 flex items-center gap-5 transition-all hover:bg-white/[0.03]">
                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 shadow-lg shadow-green-500/5">
                           <DollarSign size={24} />
                        </div>
                        <div>
                           <div className="text-[10px] uppercase font-mono text-white/30 font-black italic tracking-widest leading-none mb-1">Capital (En Stock)</div>
                           <div className="text-xl font-hype font-black text-white italic tracking-tighter">$ {new Intl.NumberFormat('es-CO').format(allProducts.filter(p => !p.vendido && p.en_stock).reduce((acc, p) => acc + (Number(p.precio_venta_cop) || 0), 0))} <span className="text-[10px] opacity-20">COP</span></div>
                        </div>
                     </div>
                     <div className="bg-goat-card border border-white/5 rounded-[32px] p-6 flex items-center gap-5 transition-all hover:bg-white/[0.03]">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 shadow-lg shadow-white/5">
                           <Package size={24} />
                        </div>
                        <div>
                           <div className="text-[10px] uppercase font-mono text-white/30 font-black italic tracking-widest leading-none mb-1">Unidades Disponibles</div>
                           <div className="text-xl font-hype font-black text-white italic tracking-tighter">{allProducts.filter(p => !p.vendido).length} <span className="text-xs opacity-30">Total</span></div>
                        </div>
                     </div>
                     <div className="bg-goat-card border border-white/5 rounded-[32px] p-6 flex items-center gap-5 transition-all hover:bg-white/[0.03]">
                        <div className="w-14 h-14 bg-goat-red/10 rounded-2xl flex items-center justify-center text-goat-red shadow-lg shadow-goat-red/5">
                           <RefreshCw size={24} />
                        </div>
                        <div>
                           <div className="text-[10px] uppercase font-mono text-white/30 font-black italic tracking-widest leading-none mb-1">Rotación (Vendidos)</div>
                           <div className="text-xl font-hype font-black text-white italic tracking-tighter">{allProducts.filter(p => p.vendido).length} <span className="text-xs opacity-30">Ventas</span></div>
                        </div>
                     </div>
                  </div>

                 {/* Inventory Toggles & Filters */}
                 <div className="bg-goat-card border border-white/5 rounded-3xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:max-w-3xl">
                       <div className="relative w-full max-sm:max-w-full max-w-sm">
                          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                          <input type="text" placeholder="Filtrar por nombre o categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 text-xs font-mono outline-none focus:border-white/10" />
                       </div>
                       <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto shrink-0">
                          <button onClick={() => setInventoryFilter('available')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${inventoryFilter === 'available' ? 'bg-green-500 text-black' : 'text-white/30 hover:text-white'}`}>EN STOCK</button>
                          <button onClick={() => setInventoryFilter('sold')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${inventoryFilter === 'sold' ? 'bg-goat-red text-white' : 'text-white/30 hover:text-white'}`}>VENDIDOS</button>
                          <button onClick={() => setInventoryFilter('all')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${inventoryFilter === 'all' ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}>TODOS</button>
                       </div>
                    </div>
                     <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 self-end xl:self-auto shrink-0">
                        <button 
                          onClick={handleRecalculatePrices}
                          className="px-4 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 text-white/40 hover:text-green-500 transition-all mr-2"
                          title="Recalcular precios de stock"
                        >
                          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> SINCRONIZAR
                        </button>
                        <button onClick={() => setInventoryView('grid')} className={`px-4 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 transition-all ${inventoryView === 'grid' ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}><LayoutGrid size={14} /> MOSAICO</button>
                        <button onClick={() => setInventoryView('list')} className={`px-4 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 transition-all ${inventoryView === 'list' ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}><Plus className="rotate-45" size={14} /> LISTA</button>
                     </div>
                 </div>

                 {inventoryView === 'grid' ? (
                   <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                      {processedInventory.items.map((prod) => (
                        <div key={prod.id} className="group bg-goat-card rounded-3xl border border-white/5 overflow-hidden transition-all duration-300 ring-1 ring-white/5 flex flex-col hover:shadow-2xl hover:shadow-goat-red/5">
                           <div className="relative aspect-square bg-[#0a0a0a] flex items-center justify-center p-8">
                              <Package size={80} strokeWidth={1} className="text-white/5 group-hover:text-white/10 group-hover:scale-110 transition-all duration-700" />
                              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${prod.vendido ? 'bg-goat-red text-white' : 'bg-green-500 text-black'}`}>
                                    {prod.vendido ? 'VENDIDO' : 'STOCK'}
                                 </span>
                                 <span className="bg-white/10 backdrop-blur-md text-white/40 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight">
                                    {prod.en_stock ? 'EN STOCK' : 'PRE-ORDEN'}
                                 </span>
                              </div>
                              <div className="absolute top-4 right-4 flex gap-1 transform translate-x-12 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all">
                                 <button onClick={() => setSelectedProduct(prod)} className="p-2 bg-white text-black hover:bg-goat-blue hover:text-white rounded-xl shadow-lg transition-colors"><Activity size={12} /></button>
                                 <button onClick={() => {
                                      askConfirm('¿Deseas eliminar este producto definitivamente?', async () => {
                                         await productService.delete(prod.id);
                                         productService.getAll().then(setAllProducts);
                                         showNotification('success', 'Producto eliminado');
                                      });
                                 }} className="p-2 bg-white text-black hover:bg-goat-red hover:text-white rounded-xl shadow-lg transition-colors"><Trash2 size={12} /></button>
                              </div>
                           </div>
                           <div className="p-5 flex flex-col flex-grow bg-white/[0.01]">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-[11px] font-hype font-bold text-white uppercase italic tracking-tight opacity-90 line-clamp-2 min-h-[32px]">{prod.referencia}</h3>
                                <span className="text-[8px] bg-white/5 text-white/40 font-mono px-2 py-0.5 rounded border border-white/5">{prod.talla || 'N/A'}</span>
                              </div>
                              <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-4">
                                 <div className="flex flex-col">
                                    <span className="text-[8px] text-white/20 font-mono uppercase tracking-widest mb-1">Precio Venta</span>
                                    <span className="text-sm font-black text-green-500 font-mono uppercase italic tracking-tighter">$ {new Intl.NumberFormat('es-CO').format(prod.precio_venta_cop || 0)} COP</span>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-[8px] text-white/20 font-mono uppercase tracking-widest mb-1 block">Peso</span>
                                    <span className="text-[10px] font-bold text-white/40 font-mono italic">{prod.peso_libras} Lb</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 ) : (
                    <div className="bg-goat-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                       <table className="w-full text-left font-mono table-auto">
                        <thead>
                           <tr className="border-b border-white/5 text-[10px] text-white/40 text-left uppercase tracking-widest">
                              <SortHeader label="Referencia" field="referencia" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Categoría" field="categoria" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Estado" field="vendido" currentField={sortField} onSort={toggleSort} />
                              <th className="px-4 py-3 font-black italic text-right text-[10px] uppercase">Admin</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {processedInventory.items.map((prod) => (
                             <tr key={prod.id} className="hover:bg-white/[0.02] transition-all group border-l-2 border-l-transparent hover:border-l-goat-red">
                                <td className="px-4 py-3 font-bold text-white text-[10px] uppercase">
                                   <Tooltip text={`REFERENCIA: ${prod.referencia}\nTALLA: ${prod.talla || 'N/A'}`}>
                                      <div className="line-clamp-1 max-w-[200px]">{prod.referencia}</div>
                                   </Tooltip>
                                </td>
                                <td className="px-4 py-3 text-[10px] text-white/40 uppercase">
                                   <Tooltip text={`CATEGORÍA: ${prod.categoria?.nombre || 'GENERAL'}`}>
                                      {prod.categoria?.nombre || 'General'}
                                   </Tooltip>
                                </td>
                                <td className="px-4 py-3">
                                   <Tooltip text={`ESTADO DEL ÍTEM: ${prod.vendido ? 'VENDIDO' : 'EN STOCK'}`}>
                                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${prod.vendido ? 'bg-goat-red/10 text-goat-red' : 'bg-green-500/10 text-green-500'}`}>
                                         {prod.vendido ? 'VENDIDO' : 'STOCK'}
                                      </span>
                                   </Tooltip>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex gap-1 justify-end">
                                      <button onClick={() => setSelectedProduct(prod)} className="p-1.5 bg-white/5 hover:bg-goat-blue rounded-lg transition-all"><Activity size={10} /></button>
                                      <button onClick={() => {
                                         askConfirm('¿Eliminar producto del inventario?', async () => {
                                            await productService.delete(prod.id);
                                            productService.getAll().then(setAllProducts);
                                            showNotification('success', 'Eliminado correctamente');
                                         });
                                      }} className="p-1.5 bg-white/5 hover:bg-goat-red rounded-lg transition-all"><Trash2 size={10} /></button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                       </table>
                    </div>
                 )}
                 
                 <PaginationUI data={{ ...processedInventory, currentPage }} onPageChange={setCurrentPage} />
              </div>
           )}
        </div>

        {/* Info Column (Only for Quoter) */}
        {activeTab === 'quoter' && trm && (
          <div className="space-y-6">
             <div className="bg-goat-card border border-white/5 rounded-3xl p-8 sticky top-8 animate-slide-up">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-sm font-black italic uppercase tracking-tighter">Resumen Global</h3>
                   <div className="flex flex-col items-end gap-1.5">
                      <div className="bg-green-500/10 text-green-500 text-[9px] font-bold px-3 py-1.5 rounded-full border border-green-500/20">TRM OFICIAL: ${new Intl.NumberFormat('es-CO').format(trm.valor)}</div>
                      <div className="bg-goat-red/10 text-goat-red text-[10px] font-black px-3 py-1.5 rounded-full border border-goat-red/20 italic tracking-tighter shadow-lg shadow-goat-red/5">VALOR DOLAR @GOAT: ${new Intl.NumberFormat('es-CO').format(trm.valor + 200)}</div>
                   </div>
                </div>

                <div className="space-y-4 mb-8">
                   <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white/30 uppercase">Cant. Ítems</span>
                      <span className="text-white font-black">{quoteItems.length}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white/30 uppercase">Total USD</span>
                      <span className="text-green-500 font-black">${new Intl.NumberFormat('en-US').format(quoteItems.reduce((acc, current) => acc + Number(current.precioCompraUsd || 0), 0))}</span>
                   </div>
                   <div className="border-t border-white/5 pt-4 flex justify-between items-center gap-4">
                      <span className="text-[10px] font-black italic uppercase text-white/40 shrink-0">Total Estimado</span>
                      <span className="text-xl font-hype font-black italic tracking-tighter text-white">
                          {totalQuotedCop > 0 ? (
                            `$ ${new Intl.NumberFormat('es-CO').format(totalQuotedCop)} COP`
                          ) : (
                            <span className="text-white/20">Calculando<span className="text-goat-red">...</span></span>
                          )}
                       </span>
                   </div>
                </div>

                <div className="space-y-3">
                    <button onClick={handleFinishQuote} className="w-full h-14 bg-goat-red text-white text-[11px] font-hype font-black uppercase italic tracking-tighter rounded-2xl shadow-xl shadow-goat-red/20 hover:scale-[1.02] transition-all">Finalizar y Guardar Pedido</button>
                    <button className="w-full h-14 bg-white text-black text-[11px] font-hype font-black uppercase italic tracking-tighter rounded-2xl hover:scale-[1.02] transition-all">Generar Cotización PDF</button>
                 </div>
             </div>
          </div>
        )}
      </div>

      {/* Order Update Modal */}
      {selectedOrder && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-goat-card border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
               <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                  <div>
                    <h4 className="text-xl font-hype font-black italic uppercase">Actualizar <span className="text-goat-red">Pedido</span></h4>
                    <p className="text-[10px] font-mono text-white/30 uppercase mt-1">ID: #{selectedOrder.id || selectedOrder.pedido_id}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"><Plus size={24} className="rotate-45" /></button>
               </div>
               
               <div className="p-8 space-y-8 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Estado Logístico</label>
                        <select 
                          value={newStatus || selectedOrder.estado_logistico}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm appearance-none outline-none focus:border-goat-red/50"
                        >
                           <option value="pendiente">PENDIENTE</option>
                           <option value="comprado">COMPRADO</option>
                           <option value="en_casillero">EN CASILLERO</option>
                           <option value="en_transito">EN TRÁNSITO</option>
                           <option value="entregado">ENTREGADO</option>
                           <option value="cancelado">CANCELADO</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Tracking Number</label>
                        <input 
                          type="text"
                          value={trackingNumber === '' ? (selectedOrder.tracking_number || '') : trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none focus:border-goat-red/50"
                          placeholder="ABC123XYZ"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Fecha de Compra</label>
                        <input 
                          type="date"
                          value={newPurchaseDate || (selectedOrder.fecha_compra ? new Date(selectedOrder.fecha_compra).toISOString().split('T')[0] : '')}
                          onChange={(e) => setNewPurchaseDate(e.target.value)}
                          className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none focus:border-goat-red/50"
                        />
                      </div>
                   </div>

                  <div className="space-y-4 border-t border-white/5 pt-8">
                     <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">Gestión de Abonos</h5>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Monto Abono (COP)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-goat-red font-bold text-xs">$</span>
                              <input 
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl pl-8 pr-4 font-mono text-sm outline-none focus:border-goat-red/50"
                                placeholder="0"
                              />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Fecha Pago</label>
                           <input 
                             type="date"
                             value={paymentDate}
                             onChange={(e) => setPaymentDate(e.target.value)}
                             className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-[10px] outline-none"
                           />
                        </div>
                     </div>
                     <div className="bg-black/20 p-4 rounded-2xl border border-white/5 mt-4">
                        <div className="text-[9px] font-black uppercase text-white/20 mb-3 flex items-center gap-2 italic"><RefreshCw size={10} /> Historial de pagos</div>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 no-scrollbar">
                           {orderPayments.length > 0 ? orderPayments.map(p => (
                             <div key={p.id} className="flex justify-between items-center text-[10px] font-mono bg-white/[0.02] p-2 rounded-lg border border-white/5">
                                <span className="text-white/40">{new Date(p.fecha_pago).toLocaleDateString()}</span>
                                <span className="text-green-500 font-bold">$ {new Intl.NumberFormat('es-CO').format(p.monto)}</span>
                             </div>
                           )) : <div className="text-[10px] text-white/10 italic py-2">No hay pagos registrados</div>}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-8 grid grid-cols-2 gap-3 shrink-0 border-t border-white/5 bg-white/[0.01]">
                  <button onClick={() => setSelectedOrder(null)} className="h-14 bg-white/5 text-white/40 font-mono font-bold text-xs rounded-2xl hover:bg-white/10 transition-all uppercase">Cerrar</button>
                  <button onClick={handleUpdateOrder} className="h-14 bg-goat-red text-white font-hype font-black rounded-2xl shadow-xl shadow-goat-red/20 active:scale-95 transition-all uppercase italic">Actualizar Ahora</button>
               </div>
            </div>
         </div>
      )}

      {selectedProduct && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-goat-card border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
               <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                  <div>
                    <h4 className="text-xl font-hype font-black italic uppercase">Editar <span className="text-goat-red">Stock</span></h4>
                    <p className="text-[10px] font-mono text-white/30 uppercase mt-1">ID: #{selectedProduct.id}</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"><Plus size={24} className="rotate-45" /></button>
               </div>
               
               <div className="p-8 space-y-6 overflow-y-auto">
                  <div className="space-y-1.5">
                     <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Nombre / Referencia</label>
                     <input 
                       type="text" 
                       value={modalData.referencia} 
                       onChange={(e) => setModalData({...modalData, referencia: e.target.value})}
                       className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none focus:border-goat-red/50" 
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Categoría</label>
                        <select 
                          value={modalData.categoria_id} 
                          onChange={(e) => setModalData({...modalData, categoria_id: e.target.value})}
                          className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm appearance-none outline-none"
                        >
                           {categories.map(c => <option key={c.id} value={c.id}>{c.nombre.toUpperCase()}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Talla (Disponibles)</label>
                        <input 
                          type="text" 
                          value={modalData.talla} 
                          onChange={(e) => setModalData({...modalData, talla: e.target.value})}
                          placeholder="EJ: 9 / 10 / 11.5" 
                          className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none" 
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Precio Venta COP</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">$</span>
                           <input 
                             type="number" 
                             value={modalData.precio_venta_cop} 
                             onChange={(e) => setModalData({...modalData, precio_venta_cop: e.target.value})}
                             className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl pl-8 pr-4 font-mono text-sm outline-none" 
                           />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Peso (Lb)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={modalData.peso_libras} 
                          onChange={(e) => setModalData({...modalData, peso_libras: e.target.value})}
                          className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none" 
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Tipo de Inventario</label>
                        <div className="flex bg-goat-black p-1 rounded-xl border border-white/10 h-14">
                           <button 
                             onClick={() => { setModalProductType(true); setModalStockQty(1); }} 
                             className={`flex-1 rounded-lg text-[9px] font-black transition-all ${modalProductType ? 'bg-goat-blue text-white' : 'text-white/40 hover:text-white'}`}
                           >
                             ÚNICO
                           </button>
                           <button 
                             onClick={() => setModalProductType(false)} 
                             className={`flex-1 rounded-lg text-[9px] font-black transition-all ${!modalProductType ? 'bg-amber-500 text-white' : 'text-white/40 hover:text-white'}`}
                           >
                             LOTE
                           </button>
                        </div>
                     </div>
                  </div>

                  {!modalProductType && (
                    <div className="space-y-1.5 animate-fade-in">
                       <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Cantidad / Stock Disponible</label>
                       <input 
                          type="number" 
                          value={modalStockQty}
                          onChange={(e) => setModalStockQty(Number(e.target.value))}
                          className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none border-white/20" 
                       />
                    </div>
                  )}

                  <div className="bg-black/20 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                     <div>
                        <div className="text-[10px] uppercase font-mono text-white/60 font-black italic tracking-widest">Estado físico</div>
                        <div className="text-[9px] text-white/30 font-mono mt-1">¿Está disponible para entrega?</div>
                     </div>
                     <div className="flex bg-goat-black p-1 rounded-xl border border-white/10">
                        <button 
                          onClick={() => setModalData({...modalData, en_stock: true})} 
                          className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${modalData.en_stock ? 'bg-green-500 text-black' : 'text-white/40 hover:text-white'}`}
                        >
                          SÍ
                        </button>
                        <button 
                          onClick={() => setModalData({...modalData, en_stock: false})} 
                          className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${!modalData.en_stock ? 'bg-goat-red text-white' : 'text-white/40 hover:text-white'}`}
                        >
                          NO
                        </button>
                     </div>
                  </div>
               </div>

               <div className="p-8 grid grid-cols-2 gap-3 shrink-0 border-t border-white/5 bg-white/[0.01]">
                  <button onClick={() => setSelectedProduct(null)} className="h-14 bg-white/5 text-white/40 font-mono font-bold text-xs rounded-2xl hover:bg-white/10 transition-all uppercase">Cerrar</button>
                  <button onClick={async () => {
                     setLoading(true);
                     try {
                        await productService.update(selectedProduct.id, { 
                           ...modalData,
                           es_serializado: modalProductType,
                           stock_disponible: modalStockQty
                        });
                        showNotification('success', '¡Información actualizada!');
                        productService.getAll().then(setAllProducts);
                        setSelectedProduct(null);
                     } catch (err) { showNotification('error', 'Error al guardar cambios'); } finally { setLoading(false); }
                  }} className="h-14 bg-goat-red text-white font-hype font-black rounded-2xl shadow-xl shadow-goat-red/20 active:scale-95 transition-all uppercase italic">Guardar Producto</button>
               </div>
            </div>
         </div>
      )}
      {/* Notification Toast */}
      {notification && createPortal(
         <div className="fixed bottom-10 right-10 z-[10000] animate-slide-in-right">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-goat-red/10 border-goat-red/50 text-goat-red'}`}>
               {notification.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
               <span className="text-[10px] font-black uppercase tracking-widest">{notification.message}</span>
            </div>
         </div>,
         document.body
      )}

      {/* Action Confirm Modal */}
      {confirmState && createPortal(
         <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-goat-card border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-scale-in">
               <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-goat-red/10 text-goat-red rounded-full flex items-center justify-center mx-auto mb-6">
                     <Plus size={32} className="rotate-45" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-white/90 leading-relaxed italic">{confirmState.message}</h4>
                  <div className="grid grid-cols-2 gap-3 mt-8">
                     <button onClick={() => setConfirmState(null)} className="h-12 bg-white/5 hover:bg-white/10 text-white/40 font-mono font-bold text-[10px] rounded-xl transition-all uppercase">Cancelar</button>
                     <button onClick={() => { confirmState.onConfirm(); setConfirmState(null); }} className="h-12 bg-goat-red text-white font-hype font-black text-[10px] rounded-xl shadow-lg shadow-goat-red/20 active:scale-95 transition-all uppercase italic">Confirmar</button>
                  </div>
               </div>
            </div>
         </div>,
         document.body
      )}

      {/* Quoter Finish Modal (Select Customer) */}
      {isQuoterFinishModalOpen && createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-goat-card border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
               <div>
                  <h4 className="text-xl font-hype font-black italic uppercase">Vincular al <span className="text-goat-red">Cliente</span></h4>
                  <p className="text-[10px] font-mono text-white/30 uppercase mt-1">Cotización: {quoteItems.length} ítems</p>
               </div>
               <button onClick={() => setIsQuoterFinishModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"><Plus size={24} className="rotate-45" /></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto">
               <div className="space-y-4">
                    <div className="flex items-center justify-between pl-1 mb-1.5">
                      <label className="text-[10px] uppercase font-mono text-white/40 italic">Vincular Cliente Existente</label>
                      {quoterCustomer.id && (
                        <button 
                          onClick={() => setQuoterCustomer({ id: '', nombre: '', email: '', telefono: '' })}
                          className="text-[9px] font-black text-goat-red uppercase hover:underline"
                        >
                          Limpiar Selección [X]
                        </button>
                      )}
                    </div>
                    <select 
                      value={quoterCustomer.id}
                      onChange={(e) => {
                        const u = allUsers.find(user => user.id === e.target.value);
                        if (u) setQuoterCustomer({ id: u.id, nombre: u.nombre_completo, email: u.email, telefono: u.telefono || '' });
                      }}
                      className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm appearance-none outline-none focus:border-white/20"
                    >
                      <option value="">-- SELECCIONAR CLIENTE --</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre_completo.toUpperCase()} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative flex items-center gap-4 py-2">
                     <div className="h-px bg-white/5 flex-grow"></div>
                     <span className="text-[10px] text-white/20 font-mono italic">INFORMACIÓN DEL REGISTRO</span>
                     <div className="h-px bg-white/5 flex-grow"></div>
                  </div>

                  <div className={`space-y-4 px-2 py-4 rounded-3xl border transition-all ${quoterCustomer.id ? 'bg-green-500/5 border-green-500/10' : 'bg-white/[0.02] border-white/5'}`}>
                    {quoterCustomer.id && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-tighter mb-2 italic">
                        <CheckCircle size={12} /> Cliente Vinculado Correctamente
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={quoterCustomer.nombre}
                        readOnly={!!quoterCustomer.id}
                        onChange={(e) => setQuoterCustomer({...quoterCustomer, nombre: e.target.value})}
                        className={`w-full bg-goat-black border h-14 rounded-2xl px-4 font-mono text-sm outline-none ${quoterCustomer.id ? 'border-green-500/20 text-white/50 cursor-not-allowed' : 'border-white/10 focus:border-white/20'}`} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Correo Electrónico (Requerido)</label>
                      <input 
                        type="email" 
                        value={quoterCustomer.email}
                        readOnly={!!quoterCustomer.id}
                        onChange={(e) => setQuoterCustomer({...quoterCustomer, email: e.target.value})}
                        className={`w-full bg-goat-black border h-14 rounded-2xl px-4 font-mono text-sm outline-none ${quoterCustomer.id ? 'border-green-500/20 text-white/50 cursor-not-allowed' : 'border-white/10 focus:border-white/20'}`} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Teléfono / WhatsApp</label>
                      <input 
                        type="text" 
                        value={quoterCustomer.telefono}
                        readOnly={!!quoterCustomer.id}
                        onChange={(e) => setQuoterCustomer({...quoterCustomer, telefono: e.target.value})}
                        className={`w-full bg-goat-black border h-14 rounded-2xl px-4 font-mono text-sm outline-none ${quoterCustomer.id ? 'border-green-500/20 text-white/50 cursor-not-allowed' : 'border-white/10 focus:border-white/20'}`} 
                      />
                    </div>
                  </div>
               </div>

            <div className="p-8 grid grid-cols-2 gap-3 shrink-0 border-t border-white/5 bg-white/[0.01]">
               <button onClick={() => setIsQuoterFinishModalOpen(false)} className="h-14 bg-white/5 text-white/40 font-mono font-bold text-xs rounded-2xl hover:bg-white/10 transition-all uppercase">Cancelar</button>
               <button onClick={handleCreateOrderFromQuote} className="h-14 bg-goat-red text-white font-hype font-black rounded-2xl shadow-xl shadow-goat-red/20 active:scale-95 transition-all uppercase italic">Confirmar y Guardar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
