import React from 'react';
import { Trash2, X } from 'lucide-react';

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#283160] border border-[#3d4e8a] rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#3d4e8a]">
          <div className="flex items-center gap-2 text-red-400">
            <Trash2 className="w-4 h-4" />
            <h3 className="font-bold text-white text-sm">{title || 'Confirmar eliminación'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3.5 text-xs text-slate-100 font-medium leading-relaxed">
          {message || '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.'}
        </p>

        <div className="mt-5 flex justify-end gap-2.5 pt-3.5 border-t border-[#3d4e8a]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#1b275d] hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
