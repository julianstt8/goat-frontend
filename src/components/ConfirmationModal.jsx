import React from 'react';
import { LogOut, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const ConfirmationModal = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  type = 'danger', // danger, success, info
  isAlert = false,
  icon: customIcon
}) => {
  const getColors = () => {
    switch (type) {
      case 'success': return { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-500', shadow: 'shadow-green-500/20', btn: 'bg-green-500' };
      case 'info': return { bg: 'bg-goat-blue/10', border: 'border-goat-blue/20', text: 'text-goat-blue', shadow: 'shadow-goat-blue/20', btn: 'bg-goat-blue' };
      default: return { bg: 'bg-goat-red/10', border: 'border-goat-red/20', text: 'text-goat-red', shadow: 'shadow-goat-red/20', btn: 'bg-goat-red' };
    }
  };

  const colors = getColors();

  const renderIcon = () => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'success': return <CheckCircle2 size={28} />;
      case 'info': return <Info size={28} />;
      default: return <AlertCircle size={28} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" 
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div className="relative bg-goat-card border border-white/10 rounded-[40px] w-full max-w-sm p-8 shadow-2xl shadow-black/50 animate-fade-in-up">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="absolute top-6 right-6 text-white/20 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center ${colors.text} mb-6 border ${colors.border} shadow-lg ${colors.shadow}`}>
               {renderIcon()}
            </div>

            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-4">{title}</h3>
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest leading-relaxed mb-8">{message}</p>

            <div className={`grid ${isAlert ? 'grid-cols-1' : 'grid-cols-2'} gap-4 w-full`}>
               {!isAlert && (
                 <button 
                   onClick={onCancel}
                   className="h-14 rounded-2xl border border-white/5 bg-white/5 text-white/40 font-mono text-[10px] font-black uppercase hover:bg-white/10 transition-all"
                 >
                   {cancelText}
                 </button>
               )}
               <button 
                 onClick={onConfirm}
                 className={`h-14 rounded-2xl ${colors.btn} text-white font-hype font-black uppercase text-xs hover:scale-105 active:scale-95 transition-all shadow-xl ${colors.shadow}`}
               >
                 {confirmText}
               </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
