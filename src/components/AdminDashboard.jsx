import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Package, Users, Plus, Trash2, 
  Search, CheckCircle, Info, Activity, 
  Calendar, RefreshCw, DollarSign, LayoutGrid
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { 
  productService, 
  orderService, 
  reportService, 
  categoryService,
  calculationService,
  userService,
  paymentService 
} from '../services/api';

const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block w-full" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-black/90 text-[9px] text-white font-mono rounded-lg whitespace-pre-line shadow-2xl border border-white/10 backdrop-blur-md animate-fade-in pointer-events-none uppercase tracking-tighter">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90" />
        </div>
      )}
    </div>
  );
};

const SortHeader = ({ label, field, currentField, onSort, align = 'left' }) => (
  <th 
    className={`px-4 py-3 font-black italic cursor-pointer transition-colors hover:text-goat-red group ${align === 'right' ? 'text-right' : 'text-left'}`}
    onClick={() => onSort(field)}
  >
    <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      {label}
      <div className={`size-1.5 rounded-full bg-goat-red transition-all ${currentField === field ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-30'}`} />
    </div>
  </th>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('quoter');
  const [quoteItems, setQuoteItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trm, setTrm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('fecha_compra');
  const [sortDirection, setSortDirection] = useState('desc');
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventoryView, setInventoryView] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Order Edit State
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderPayments, setOrderPayments] = useState([]);

  // Stock Edit Modal State
  const [modalData, setModalData] = useState({ id: '', referencia: '', categoria_id: '', talla: '', precio_venta_cop: 0, peso_libras: 0, en_stock: true });
  const [modalProductType, setModalProductType] = useState(true);
  const [modalStockQty, setModalStockQty] = useState(1);

  // Quoter Finish Modal
  const [isQuoterFinishModalOpen, setIsQuoterFinishModalOpen] = useState(false);
  const [quoterCustomer, setQuoterCustomer] = useState({ id: '', nombre: '', email: '', telefono: '' });
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    calculationService.getTrm().then(setTrm);
    categoryService.getAll().then(setCategories);
    productService.getAll().then(setAllProducts);
    orderService.getAll().then(setOrders);
    reportService.getDebtors().then(setDebtors);
    userService.getAll().then(setAllUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.estado_logistico);
      setTrackingNumber(selectedOrder.tracking_number || '');
      setNewPurchaseDate(selectedOrder.fecha_compra ? new Date(selectedOrder.fecha_compra).toISOString().split('T')[0] : '');
      paymentService.getByOrder(selectedOrder.id || selectedOrder.pedido_id).then(setOrderPayments);
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (selectedProduct) {
       setModalData({
          id: selectedProduct.id,
          referencia: selectedProduct.referencia,
          categoria_id: selectedProduct.categoria_id,
          talla: selectedProduct.talla || '',
          precio_venta_cop: selectedProduct.precio_venta_cop || 0,
          peso_libras: selectedProduct.peso_libras || 0,
          en_stock: selectedProduct.en_stock
       });
       setModalProductType(selectedProduct.es_serializado);
       setModalStockQty(selectedProduct.stock_disponible || 1);
    }
  }, [selectedProduct]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const addQuoteItem = () => {
    setQuoteItems([...quoteItems, { id: Date.now(), referencia: '', precioCompraUsd: '', pesoLibras: 2, categoria_id: '' }]);
  };

  const removeQuoteItem = (id) => {
    setQuoteItems(quoteItems.filter(item => item.id !== id));
  };

  const updateQuoteItem = (id, field, value) => {
    setQuoteItems(quoteItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleResetQuoter = () => {
     setQuoteItems([]);
  };

  const quoterPriceInfo = useMemo(() => {
     if (!trm || quoteItems.length === 0 || quoteItems.some(i => !i.precioCompraUsd)) return null;
     
     const items = quoteItems.map(item => {
        const cat = categories.find(c => String(c.id) === String(item.categoria_id)) || { fixed_shipping_usd: 16 };
        
        // FORMULA EXCEL: (Compra + 16 + (Peso * CargoLb)) * TRM_GOAT * MargenCat
        const cargoLibra = Number(cat.cargo_libra_usd || 2.5);
        const profitMargin = Number(cat.margen_base || 0.15);
        
        const trmUsed = Number(trm.valor) + 200;
        const weightFeeUsd = Number(item.pesoLibras || 0) * cargoLibra;

        const baseCompraCop = Number(item.precioCompraUsd || 0) * trmUsed;
        const logisticaCop = Number(cat.fixed_shipping_usd || 16) * trmUsed;
        const pesoCop = weightFeeUsd * trmUsed; 
        
        const totalCostCop = baseCompraCop + logisticaCop + pesoCop;
        const precioSugerido = totalCostCop * (1 + profitMargin);
        const profitCop = precioSugerido - totalCostCop;
        
        return {
           id: item.id,
           precioSugerido,
           profit_usd: profitCop / trmUsed,
           profit_cop: profitCop,
           total_cost_cop: totalCostCop,
           margin_percent: profitMargin * 100,
           fixed_usd: Number(cat.fixed_shipping_usd || 16),
           weight_usd: weightFeeUsd
        };
     });

     const total_cop = items.reduce((acc, i) => acc + i.precioSugerido, 0);
     const total_profit_usd = items.reduce((acc, i) => acc + i.profit_usd, 0);
     const total_profit_cop = items.reduce((acc, i) => acc + i.profit_cop, 0);
     const avg_margin = items.reduce((acc, i) => acc + i.margin_percent, 0) / items.length;

     return {
        items,
        totales: {
           total_cop,
           profit_usd: total_profit_usd.toFixed(2),
           profit_cop: total_profit_cop,
           avg_margin: avg_margin.toFixed(0) + '%',
           total_fixed_usd: items.reduce((acc, i) => acc + i.fixed_usd, 0),
           weight_fees_usd: items.reduce((acc, i) => acc + i.weight_usd, 0).toFixed(2)
        }
     };
  }, [quoteItems, trm, categories]);

  const totalQuotedCop = quoterPriceInfo?.totales?.total_cop || 0;

  const askConfirm = (message, onConfirm) => {
     setConfirmState({ message, onConfirm });
  };

  const handleUpdateOrder = async () => {
    setLoading(true);
    try {
      await orderService.update(selectedOrder.id || selectedOrder.pedido_id, {
        estado_logistico: newStatus,
        tracking_number: trackingNumber,
        fecha_compra: newPurchaseDate
      });

      if (paymentAmount > 0) {
        await paymentService.create(selectedOrder.id || selectedOrder.pedido_id, {
          monto_cop: paymentAmount,
          fecha_pago: paymentDate,
          tipo_abono: 'parcial'
        });
      }

      showNotification('success', '¡Información actualizada!');
      setSelectedOrder(null);
      setPaymentAmount('');
      orderService.getAll().then(setOrders);
      reportService.getDebtors().then(setDebtors);
    } catch (err) {
      showNotification('error', 'Error al actualizar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishQuote = () => {
     if (quoteItems.some(i => !i.referencia || !i.precioCompraUsd)) {
        showNotification('error', 'Completa los datos de todos los ítems');
        return;
     }
     setIsQuoterFinishModalOpen(true);
  };

  const handleCreateOrderFromQuote = async () => {
     if (!quoterCustomer.email || !quoterCustomer.nombre) {
        showNotification('error', 'Nombre y Email requeridos');
        return;
     }
     
     setLoading(true);
     try {
        await orderService.createBatch({
           items: quoteItems,
           cliente: quoterCustomer,
           trm_used: trm.valor + 200 
        });
        showNotification('success', '¡Pedido registrado con éxito!');
        setIsQuoterFinishModalOpen(false);
        handleResetQuoter();
        orderService.getAll().then(setOrders);
        productService.getAll().then(setAllProducts);
        reportService.getDebtors().then(setDebtors);
     } catch (err) {
        showNotification('error', 'Fallo al registrar pedido');
     } finally {
        setLoading(false);
     }
  };

  const handleRecalculatePrices = async () => {
     setLoading(true);
     try {
       await productService.recalculateAll();
       showNotification('success', 'Precios de stock sincronizados con TRM actual');
       productService.getAll().then(setAllProducts);
     } catch (err) {
       showNotification('error', 'Error al sincronizar precios');
     } finally {
       setLoading(false);
     }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filterAndSort = (items) => {
    let filtered = items.filter(item => {
       const searchStr = searchTerm.toLowerCase();
       const matchesSearch = 
          (item.referencia || '').toLowerCase().includes(searchStr) ||
          (item.producto?.referencia || '').toLowerCase().includes(searchStr) ||
          (item.cliente?.nombre_completo || '').toLowerCase().includes(searchStr);
       
       if (activeTab === 'inventory') {
          if (inventoryFilter === 'available') return matchesSearch && item.en_stock && !item.vendido;
          if (inventoryFilter === 'sold') return matchesSearch && item.en_stock && item.vendido;
          return matchesSearch && item.en_stock;
       }
       return matchesSearch;
    });

    return filtered.sort((a, b) => {
       let valA = a[sortField];
       let valB = b[sortField];
       
       if (sortField === 'cliente') {
          valA = a.cliente?.nombre_completo || a.cliente || '';
          valB = b.cliente?.nombre_completo || b.cliente || '';
       }
       if (sortField === 'referencia' && activeTab !== 'inventory') {
          valA = a.producto?.referencia || a.referencia || '';
          valB = b.producto?.referencia || b.referencia || '';
       }

       if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
       if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
       return 0;
    });
  };

  const paginate = (items) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return {
      items: items.slice(startIndex, startIndex + itemsPerPage),
      totalPages: Math.ceil(items.length / itemsPerPage)
    };
  };

  const processedOrders = useMemo(() => paginate(filterAndSort(orders)), [orders, searchTerm, sortField, sortDirection, currentPage]);
  const processedDebtors = useMemo(() => paginate(filterAndSort(debtors)), [debtors, searchTerm, sortField, sortDirection, currentPage]);
  const processedInventory = useMemo(() => paginate(filterAndSort(allProducts)), [allProducts, searchTerm, sortField, sortDirection, inventoryFilter, currentPage]);

  const PaginationUI = ({ data, onPageChange }) => (
    <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-t border-white/5">
       <div className="text-[10px] font-mono text-white/30 uppercase">Página {currentPage} de {data.totalPages || 1}</div>
       <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-4 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-20 transition-all font-black"
          >
            Anterior
          </button>
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
    <>
    <div className="min-h-screen bg-goat-black text-white p-4 md:p-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="bg-goat-red p-2 rounded-xl shadow-lg shadow-goat-red/20"><Activity size={24} /></div>
              <h1 className="text-3xl font-hype font-black italic tracking-tight uppercase">Dashboard <span className="text-goat-red">Admin</span></h1>
           </div>
           <p className="text-white/40 font-mono text-xs uppercase tracking-widest pl-1">Control de Operaciones @GOAT.ENCARGOS</p>
        </div>

        <div className="bg-white/5 p-1.5 rounded-2xl border border-white/5 flex gap-1 overflow-x-auto max-w-full">
           <button onClick={() => { setActiveTab('quoter'); setCurrentPage(1); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black font-mono flex items-center shrink-0 gap-2 transition-all ${activeTab === 'quoter' ? 'bg-goat-red text-white shadow-lg shadow-goat-red/20' : 'text-white/40 hover:text-white'}`}><Calculator size={14} /> COTIZADOR</button>
           <button onClick={() => { setActiveTab('orders'); setCurrentPage(1); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black font-mono flex items-center shrink-0 gap-2 transition-all ${activeTab === 'orders' ? 'bg-goat-blue text-white shadow-lg shadow-goat-blue/20' : 'text-white/40 hover:text-white'}`}><Package size={14} /> PEDIDOS</button>
           <button onClick={() => { setActiveTab('debtors'); setCurrentPage(1); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black font-mono flex items-center shrink-0 gap-2 transition-all ${activeTab === 'debtors' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-white/40 hover:text-white'}`}><Users size={14} /> DEUDORES</button>
           <button onClick={() => { setActiveTab('inventory'); setCurrentPage(1); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black font-mono flex items-center shrink-0 gap-2 transition-all ${activeTab === 'inventory' ? 'bg-goat-red text-white shadow-lg shadow-goat-red/20' : 'text-white/40 hover:text-white'}`}><Plus size={14} /> STOCK</button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${activeTab === 'quoter' ? 'lg:grid-cols-12' : 'grid-cols-1'} gap-8`}>
        {/* Main Content Column */}
        <div className={activeTab === 'quoter' ? 'lg:col-span-8 space-y-6' : 'space-y-6'}>
           {activeTab === 'quoter' && (
             <div className="bg-goat-card border border-white/5 rounded-3xl overflow-hidden animate-slide-in-right shadow-2xl">
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
                          <th className="px-5 py-3 font-black italic">Ref. / Producto</th>
                          <th className="px-5 py-3 font-black italic text-right">Compra USD</th>
                          <th className="px-5 py-3 font-black italic text-right">Lb.</th>
                          <th className="px-5 py-3 font-black italic">Categoría</th>
                          <th className="px-5 py-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {quoteItems.map(item => (
                          <tr key={item.id} className="hover:bg-white/[0.01] transition-colors border-l-2 border-l-transparent hover:border-l-goat-red">
                            <td className="px-5 py-2.5">
                               <input 
                                 type="text" 
                                 value={item.referencia}
                                 onChange={(e) => updateQuoteItem(item.id, 'referencia', e.target.value)}
                                 className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/10 font-bold uppercase italic focus:ring-0"
                                 placeholder="EJ: JORDAN 1 RETRO"
                               />
                            </td>
                            <td className="px-5 py-2.5 text-right">
                               <div className="flex items-center justify-end gap-1">
                                  <span className="text-goat-red opacity-40 font-black text-sm">$</span>
                                  <input 
                                    type="number" 
                                    value={item.precioCompraUsd}
                                    onChange={(e) => updateQuoteItem(item.id, 'precioCompraUsd', e.target.value)}
                                    className="bg-transparent border-none outline-none text-white w-12 text-right font-black focus:ring-0 text-[10px]"
                                    placeholder="0"
                                  />
                               </div>
                            </td>
                            <td className="px-5 py-2.5 text-right">
                               <input 
                                 type="number" 
                                 step="0.1"
                                 value={item.pesoLibras}
                                 onChange={(e) => updateQuoteItem(item.id, 'pesoLibras', e.target.value)}
                                 className="bg-transparent border-none outline-none text-white w-8 text-right opacity-50 focus:ring-0 text-[10px]"
                               />
                            </td>
                            <td className="px-5 py-2.5">
                               <select 
                                 value={item.categoria_id}
                                 onChange={(e) => updateQuoteItem(item.id, 'categoria_id', e.target.value)}
                                 className="bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-[8px] font-black text-white/60 outline-none hover:border-white/10 transition-all cursor-pointer focus:border-goat-red/30"
                               >
                                 <option value="" className="bg-goat-black text-white">GENERAL</option>
                                 {categories.map(c => (
                                   <option key={c.id} value={c.id} className="bg-goat-black text-white">{c.nombre.toUpperCase()}</option>
                                 ))}
                               </select>
                            </td>
                            <td className="px-5 py-2.5 text-center">
                               <button onClick={() => removeQuoteItem(item.id)} className="text-white/10 hover:text-goat-red transition-colors p-1"><Trash2 size={12} /></button>
                            </td>
                          </tr>
                        ))}
                        {quoteItems.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-10 py-12 text-center text-white/10 italic font-black uppercase tracking-[0.2em] text-[10px]">Sin ítems en la lista</td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {(activeTab === 'orders' || activeTab === 'debtors') && (
               <div className="bg-goat-card border border-white/5 rounded-3xl overflow-hidden animate-slide-in-right shadow-2xl">
                  <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                     <div className="relative w-full max-w-sm">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input type="text" placeholder="Buscar pedido o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 text-xs font-mono outline-none focus:border-white/10" />
                     </div>
                  </div>
                  <div className="w-full overflow-x-auto">
                     <table className="w-full text-left font-mono table-auto text-[11px]">
                        <thead>
                           <tr className="border-b border-white/5 text-[9px] text-white/40 text-left uppercase tracking-widest bg-black/20">
                              <SortHeader label="Ref / Producto" field="referencia" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Cliente" field="cliente" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Fecha" field="fecha_compra" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Logística" field="estado_logistico" currentField={sortField} onSort={toggleSort} />
                              <SortHeader label="Venta (COP)" field="precio_venta_cop" currentField={sortField} onSort={toggleSort} align="right" />
                              <th className="px-4 py-3 font-black italic text-right">Admin</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {(activeTab === 'orders' ? processedOrders : processedDebtors).items.map((item) => (
                             <tr key={item.id || item.pedido_id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-4 py-3">
                                   <div className="flex flex-col">
                                      <span className="font-bold text-white uppercase line-clamp-1 max-w-[150px]">
                                         {item.producto?.referencia || item.referencia || 'Sin nombre'}
                                      </span>
                                      <span className="text-[9px] text-white/40">{item.tracking_number || 'Sin Tracking'}</span>
                                   </div>
                                </td>
                                <td className="px-4 py-3">
                                   <div className="flex flex-col">
                                      <span className="text-goat-red font-black uppercase italic tracking-tighter line-clamp-1">
                                         {item.cliente?.nombre_completo || item.cliente || 'Consumidor'}
                                      </span>
                                      <span className="text-[9px] text-white/20">{item.telefono || 'N/A'}</span>
                                   </div>
                                </td>
                                <td className="px-4 py-3 text-[10px] text-white/40 whitespace-nowrap">
                                   {new Date(item.fecha_compra || item.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                   <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${item.estado_logistico === 'entregado' ? 'bg-green-500/10 text-green-500' : item.estado_logistico === 'en_transito' ? 'bg-goat-blue/10 text-goat-blue' : 'bg-white/10 text-white/40'}`}>
                                      {(item.estado_logistico || 'pend').replace('_', ' ')}
                                   </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                   <div className="flex flex-col items-end">
                                      <span className="font-black italic">$ {new Intl.NumberFormat('es-CO').format(item.precio_venta_cop)}</span>
                                      <span className="text-[9px] text-green-500/60 font-mono">P: $ {new Intl.NumberFormat('es-CO').format(item.total_pagado || 0)}</span>
                                   </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                   <div className="flex gap-1 justify-end">
                                      <button onClick={() => setSelectedOrder(item)} className="p-1.5 bg-white/5 hover:bg-goat-blue rounded-lg transition-all"><Activity size={12} /></button>
                                      <button 
                                        onClick={() => {
                                           askConfirm(`¿Eliminar pedido?\nEl producto volverá a estar disponible.`, async () => {
                                              await orderService.delete(item.id || item.pedido_id);
                                              orderService.getAll().then(setOrders);
                                              productService.getAll().then(setAllProducts);
                                              reportService.getDebtors().then(setDebtors);
                                              showNotification('success', 'Pedido eliminado y stock retornado');
                                           });
                                        }} 
                                        className="p-1.5 bg-white/5 hover:bg-goat-red rounded-lg transition-all"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                     <PaginationUI data={{ ...(activeTab === 'orders' ? processedOrders : processedDebtors), currentPage }} onPageChange={setCurrentPage} />
                  </div>
               </div>
           )}

           {activeTab === 'inventory' && (
              <div className="space-y-6">
                  {/* Inventory Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-right">
                     <div className="bg-goat-card border border-white/5 rounded-[32px] p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500"><DollarSign size={24} /></div>
                        <div>
                           <div className="text-[10px] uppercase font-mono text-white/30 font-black italic tracking-widest mb-1">Capital (Stock)</div>
                           <div className="text-xl font-hype font-black text-white italic">$ {new Intl.NumberFormat('es-CO').format(allProducts.filter(p => !p.vendido && p.en_stock).reduce((acc, p) => acc + (Number(p.precio_venta_cop) || 0), 0))}</div>
                        </div>
                     </div>
                     <div className="bg-goat-card border border-white/5 rounded-[32px] p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40"><Package size={24} /></div>
                        <div>
                           <div className="text-[10px] uppercase font-mono text-white/30 font-black italic tracking-widest mb-1">Disponibles</div>
                           <div className="text-xl font-hype font-black text-white italic">{allProducts.filter(p => !p.vendido && p.en_stock).length} Unid.</div>
                        </div>
                     </div>
                     <div className="bg-goat-card border border-white/5 rounded-[32px] p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-goat-red/10 rounded-2xl flex items-center justify-center text-goat-red"><RefreshCw size={24} /></div>
                        <div>
                           <div className="text-[10px] uppercase font-mono text-white/30 font-black italic tracking-widest mb-1">Entregados</div>
                           <div className="text-xl font-hype font-black text-white italic">{allProducts.filter(p => p.vendido && p.en_stock).length} Unid.</div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-goat-card border border-white/5 rounded-3xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4">
                     <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                        <div className="relative w-full max-w-sm">
                           <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                           <input type="text" placeholder="Filtrar stock..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 text-xs font-mono outline-none" />
                        </div>
                        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 shrink-0">
                           <button onClick={() => setInventoryFilter('available')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${inventoryFilter === 'available' ? 'bg-green-500 text-black' : 'text-white/30'}`}>EN STOCK</button>
                           <button onClick={() => setInventoryFilter('sold')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${inventoryFilter === 'sold' ? 'bg-goat-red text-white' : 'text-white/30'}`}>VENDIDOS</button>
                           <button onClick={() => setInventoryFilter('all')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${inventoryFilter === 'all' ? 'bg-white text-black' : 'text-white/30'}`}>TODOS</button>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={handleRecalculatePrices} className="p-2.5 bg-white/5 hover:text-green-500 rounded-xl transition-all"><RefreshCw size={16} /></button>
                        <button onClick={() => setInventoryView(inventoryView === 'grid' ? 'list' : 'grid')} className="p-2.5 bg-white/5 text-white/40 rounded-xl hover:text-white transition-all">
                           {inventoryView === 'grid' ? <Plus className="rotate-45" size={16} /> : <LayoutGrid size={16} />}
                        </button>
                     </div>
                  </div>

                  {inventoryView === 'grid' ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                       {processedInventory.items.map((prod) => (
                         <div key={prod.id} className="group bg-goat-card rounded-3xl border border-white/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-goat-red/5">
                            <div className="relative aspect-square bg-black/40 flex items-center justify-center p-8">
                               <Package size={60} strokeWidth={1} className="text-white/5 group-hover:scale-110 transition-transform duration-500" />
                               <div className="absolute top-4 left-4 flex flex-col gap-1">
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${prod.vendido ? 'bg-goat-red text-white' : 'bg-green-500 text-black'}`}>{prod.vendido ? 'VENDIDO' : 'STOCK'}</span>
                               </div>
                               <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setSelectedProduct(prod)} className="p-2 bg-white text-black rounded-lg transition-colors"><Activity size={12} /></button>
                               </div>
                            </div>
                            <div className="p-4 bg-white/[0.01]">
                               <h3 className="text-[10px] font-bold text-white uppercase line-clamp-1 mb-3">{prod.referencia}</h3>
                               <div className="flex justify-between items-end">
                                  <span className="text-[11px] font-black text-green-500 italic">$ {new Intl.NumberFormat('es-CO').format(prod.precio_venta_cop || 0)}</span>
                                  <span className="text-[9px] text-white/20 font-mono">{prod.talla || 'N/A'}</span>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                     <div className="bg-goat-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left font-mono table-auto text-[11px]">
                           <thead>
                              <tr className="border-b border-white/5 text-[9px] text-white/40 uppercase tracking-widest bg-black/20">
                                 <th className="px-4 py-3 font-black text-left">Referencia</th>
                                 <th className="px-4 py-3 font-black text-left">Talla</th>
                                 <th className="px-4 py-3 font-black text-right">Precio</th>
                                 <th className="px-4 py-3 font-black text-center">Acción</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {processedInventory.items.map(prod => (
                                <tr key={prod.id} className="hover:bg-white/[0.02]">
                                   <td className="px-4 py-3 font-bold uppercase">{prod.referencia}</td>
                                   <td className="px-4 py-3 text-white/40">{prod.talla || 'N/A'}</td>
                                   <td className="px-4 py-3 text-right text-green-500">$ {new Intl.NumberFormat('es-CO').format(prod.precio_venta_cop || 0)}</td>
                                   <td className="px-4 py-3 text-center">
                                      <button onClick={() => setSelectedProduct(prod)} className="p-1.5 bg-white/5 hover:bg-goat-blue rounded-lg transition-all"><Activity size={12} /></button>
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

        {/* Right Info Column (Quoter Summary) */}
        <div className={activeTab === 'quoter' ? 'lg:col-span-4 space-y-6' : 'space-y-6'}>
           {activeTab === 'quoter' && trm && (
              <div className="bg-[#050505]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 lg:p-8 sticky top-8 animate-slide-up shadow-2xl overflow-hidden">
                 <div className="absolute -top-20 -right-20 size-64 bg-goat-red/5 blur-[100px] pointer-events-none" />
                 
                 <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
                       <div className="flex items-center gap-3">
                          <div className="size-2 bg-goat-red animate-pulse rounded-full" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Terminal de Cotización</h3>
                       </div>
                       <div className="text-[9px] font-black text-white px-3 py-1 bg-white/5 rounded-full border border-white/5 italic">OPERATIVO</div>
                    </div>

                    {quoterPriceInfo && (
                       <div className="bg-white rounded-[2rem] p-5 space-y-4 shadow-2xl mb-8 animate-slide-up">
                          <div className="flex flex-col gap-0.5">
                             <span className="text-[7px] font-black uppercase tracking-[0.4em] text-black/30">Total Cliente</span>
                             <div className="flex flex-col">
                                <h2 className="text-2xl xl:text-3xl font-hype font-black italic tracking-tighter text-black leading-none">${new Intl.NumberFormat('es-CO').format(quoterPriceInfo.totales.total_cop)}</h2>
                                <span className="text-[9px] font-black text-black/20 italic mt-1 self-end">COP</span>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-black/5">
                             <div>
                                <p className="text-[7px] font-black text-black/30 uppercase mb-1">Abono 50%</p>
                                <p className="text-base font-hype font-black italic text-goat-red tracking-tighter">$ {new Intl.NumberFormat('es-CO').format(Math.ceil((quoterPriceInfo.totales.total_cop * 0.5) / 1000) * 1000)}</p>
                             </div>
                             <div className="text-right border-l border-black/5 pl-3">
                                <p className="text-[7px] font-black text-black/30 uppercase mb-1">Abono 30%</p>
                                <p className="text-[13px] font-black text-black tracking-tighter leading-none">$ {new Intl.NumberFormat('es-CO').format(Math.ceil((quoterPriceInfo.totales.total_cop * 0.3) / 1000) * 1000)}</p>
                             </div>
                          </div>
                       </div>
                    )}

                    <div className="flex flex-col gap-4 mb-8">
                       <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Dólar @GOAT</p>
                          <p className="text-lg font-black text-white italic tracking-tighter shadow-sm shadow-goat-red/10">$ {new Intl.NumberFormat('es-CO').format(trm.valor + 200)}</p>
                       </div>
                       
                       <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                             <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Rentabilidad</p>
                             <div className="bg-green-500/10 text-green-500 text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Calculando...</div>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                             <p className="text-[10px] text-white/40 font-bold uppercase leading-none">Utilidad Est.</p>
                             <div className="flex flex-col items-end gap-1">
                                <p className="text-xl font-hype font-black italic text-green-500 leading-none">$ {new Intl.NumberFormat('es-CO').format(quoterPriceInfo?.totales?.profit_cop || 0)} COP</p>
                                <p className="text-[10px] font-mono text-white/20 italic tracking-tighter">(+ {quoterPriceInfo?.totales?.profit_usd || '0.00'} USD)</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {quoterPriceInfo && (
                        <div className="flex flex-col gap-4 mb-10 border-t border-white/5 pt-8">
                           <div className="space-y-2.5">
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-3 border-l-2 border-goat-red pl-2 italic">Logística</p>
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                 <span className="text-white/30">Envío Fijo:</span>
                                 <span className="text-white/60">${quoterPriceInfo.totales?.total_fixed_usd} USD</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                 <span className="text-white/30">Carga x Peso:</span>
                                 <span className="text-white/60">${quoterPriceInfo.totales?.weight_fees_usd} USD</span>
                              </div>
                           </div>
                           <div className="space-y-2.5">
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-3 border-l-2 border-green-500 pl-2 italic">Costos</p>
                              <div className="flex justify-between items-center text-[9px] font-mono">
                                 <span className="text-white/30">Items:</span>
                                 <span className="text-white/60">{quoteItems.length}</span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-mono text-right">
                                 <span className="text-white/30">Márgen:</span>
                                 <span className="text-white/60 font-black">{quoterPriceInfo.totales?.avg_margin}</span>
                              </div>
                           </div>
                        </div>
                    )}

                    <button onClick={handleFinishQuote} className="w-full mt-8 h-16 bg-goat-red text-white text-[11px] font-black uppercase italic tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-goat-red/30">
                       Registrar Pedido @GOAT
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>

    {/* Modals & Portals */}
    {selectedOrder && (
       <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in shadow-2xl">
          <div className="bg-goat-card border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
             <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <div>
                   <h4 className="text-xl font-hype font-black italic uppercase">Gestión <span className="text-goat-red">Pedido</span></h4>
                   <p className="text-[10px] font-mono text-white/30 uppercase mt-1">ID: #{selectedOrder.id || selectedOrder.pedido_id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"><Plus size={24} className="rotate-45" /></button>
             </div>
             
             <div className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-white/40 uppercase italic pl-1">Estado Logístico</label>
                      <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm appearance-none outline-none focus:border-white/20">
                         <option value="pendiente">PENDIENTE</option>
                         <option value="comprado">COMPRADO</option>
                         <option value="en_casillero">EN CASILLERO</option>
                         <option value="en_transito">EN TRÁNSITO</option>
                         <option value="entregado">ENTREGADO</option>
                         <option value="cancelado">CANCELADO</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-white/40 uppercase italic pl-1">Tracking</label>
                      <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none focus:border-white/20" placeholder="TRACKING ID" />
                   </div>
                </div>

                <div className="border-t border-white/5 pt-6 space-y-4">
                   <h5 className="text-[10px] font-black uppercase text-white/20 italic tracking-widest">Registrar Pago Nuevo</h5>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-mono text-white/40 uppercase pl-1">Monto (COP)</label>
                         <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none" placeholder="$0.00" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-mono text-white/40 uppercase pl-1">Fecha Pago</label>
                         <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-[10px] outline-none" />
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-8 grid grid-cols-2 gap-3 border-t border-white/5 bg-white/[0.01]">
                <button onClick={() => setSelectedOrder(null)} className="h-14 bg-white/5 text-white/40 font-mono font-bold text-xs rounded-2xl hover:bg-white/10 transition-all uppercase">Cerrar</button>
                <button onClick={handleUpdateOrder} className="h-14 bg-goat-red text-white font-hype font-black rounded-2xl shadow-xl shadow-goat-red/20 active:scale-95 transition-all uppercase italic">Actualizar Pedido</button>
             </div>
          </div>
       </div>
    )}

    {selectedProduct && (
       <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-goat-card border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
             <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-hype font-black italic uppercase">Editar <span className="text-goat-red">Stock</span></h4>
                  <p className="text-[10px] font-mono text-white/30 uppercase mt-1">ID: #{selectedProduct.id}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"><Plus size={24} className="rotate-45" /></button>
             </div>
             
             <div className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Venta Final (COP)</label>
                   <input type="number" value={modalData.precio_venta_cop} onChange={(e) => setModalData({...modalData, precio_venta_cop: e.target.value})} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none focus:border-white/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Talla</label>
                      <input type="text" value={modalData.talla} onChange={(e) => setModalData({...modalData, talla: e.target.value})} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-white/40 pl-1 italic">Peso Lb</label>
                      <input type="number" step="0.1" value={modalData.peso_libras} onChange={(e) => setModalData({...modalData, peso_libras: e.target.value})} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none" />
                   </div>
                </div>
             </div>

             <div className="p-8 grid grid-cols-2 gap-3 border-t border-white/5 bg-white/[0.01]">
                <button onClick={() => setSelectedProduct(null)} className="h-14 bg-white/5 text-white/40 font-mono font-bold text-xs rounded-2xl hover:bg-white/10 transition-all uppercase">Cerrar</button>
                <button 
                  onClick={async () => {
                     setLoading(true);
                     try {
                        await productService.update(selectedProduct.id, { 
                           ...modalData,
                           es_serializado: modalProductType,
                           stock_disponible: modalStockQty
                        });
                        showNotification('success', '¡Stock actualizado!');
                        productService.getAll().then(setAllProducts);
                        setSelectedProduct(null);
                     } catch (err) { showNotification('error', 'Error al guardar'); } finally { setLoading(false); }
                  }} 
                  className="h-14 bg-goat-red text-white font-hype font-black rounded-2xl shadow-xl shadow-goat-red/20 transition-all uppercase italic"
                >
                  Guardar Cambios
                </button>
             </div>
          </div>
       </div>
    )}

    {notification && createPortal(
       <div className="fixed bottom-10 right-10 z-[10000] animate-slide-in-right">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-goat-red/10 border-goat-red/20 text-goat-red'}`}>
             <CheckCircle size={20} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">{notification.message}</span>
          </div>
       </div>,
       document.body
    )}

    {confirmState && createPortal(
       <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-goat-card border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8 text-center space-y-6 animate-scale-in">
             <div className="w-16 h-16 bg-goat-red/10 text-goat-red rounded-full flex items-center justify-center mx-auto"><Plus size={32} className="rotate-45" /></div>
             <p className="text-[11px] font-bold text-white uppercase italic leading-loose">{confirmState.message}</p>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setConfirmState(null)} className="h-12 bg-white/5 text-white/40 font-mono font-bold text-[10px] rounded-xl transition-all uppercase">Omitir</button>
                <button onClick={() => { confirmState.onConfirm(); setConfirmState(null); }} className="h-12 bg-goat-red text-white font-hype font-black text-[10px] rounded-xl shadow-lg transition-all uppercase italic">Confirmar</button>
             </div>
          </div>
       </div>,
       document.body
    )}

    {isQuoterFinishModalOpen && createPortal(
      <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in shadow-2xl">
        <div className="bg-goat-card border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
          <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
             <h4 className="text-xl font-hype font-black italic uppercase">Finalizar <span className="text-goat-red">Cotización</span></h4>
             <button onClick={() => setIsQuoterFinishModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"><Plus size={24} className="rotate-45" /></button>
          </div>
          
          <div className="p-8 space-y-6 overflow-y-auto">
             <div className="space-y-4">
                <label className="text-[10px] uppercase font-mono text-white/40 italic pl-1">Seleccionar Cliente Registrado</label>
                <select 
                  value={quoterCustomer.id}
                  onChange={(e) => {
                    const u = allUsers.find(user => user.id === e.target.value);
                    if (u) setQuoterCustomer({ id: u.id, nombre: u.nombre_completo, email: u.email, telefono: u.telefono || '' });
                  }}
                  className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none focus:border-white/20"
                >
                  <option value="">-- NUEVO CLIENTE --</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.nombre_completo.toUpperCase()}</option>)}
                </select>
             </div>
             
             {!quoterCustomer.id && (
               <div className="space-y-4 pt-4 border-t border-white/5 animate-fade-in">
                  <input type="text" placeholder="Nombre Completo" value={quoterCustomer.nombre} onChange={(e) => setQuoterCustomer({...quoterCustomer, nombre: e.target.value})} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none" />
                  <input type="email" placeholder="Email (Requerido)" value={quoterCustomer.email} onChange={(e) => setQuoterCustomer({...quoterCustomer, email: e.target.value})} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none" />
                  <input type="text" placeholder="WhatsApp / Tel" value={quoterCustomer.telefono} onChange={(e) => setQuoterCustomer({...quoterCustomer, telefono: e.target.value})} className="w-full bg-goat-black border border-white/10 h-14 rounded-2xl px-4 font-mono text-sm outline-none" />
               </div>
             )}
          </div>

          <div className="p-8 grid grid-cols-2 gap-3 border-t border-white/5 bg-white/[0.01]">
             <button onClick={() => setIsQuoterFinishModalOpen(false)} className="h-14 bg-white/5 text-white/40 font-mono font-bold text-xs rounded-2xl hover:bg-white/10 transition-all uppercase">Cerrar</button>
             <button onClick={handleCreateOrderFromQuote} className="h-14 bg-goat-red text-white font-hype font-black rounded-2xl shadow-xl shadow-goat-red/20 active:scale-95 transition-all uppercase italic">Confirmar Registro</button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default AdminDashboard;
