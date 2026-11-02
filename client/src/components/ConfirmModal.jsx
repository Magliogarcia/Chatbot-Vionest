import React from 'react';
import { Trash2, X } from 'lucide-react';

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-4 h-4" />
            <h3 className="font-bold text-[#1b275d] text-sm">{title || 'Confirmar eliminación'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-[#1b275d] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3.5 text-xs text-slate-600 font-medium leading-relaxed">
          {message || '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.'}
        </p>

        <div className="mt-5 flex justify-end gap-2.5 pt-3.5 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-red-600/25 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
