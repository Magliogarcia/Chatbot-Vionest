import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2 text-red-400">
            <Trash2 className="w-4 h-4" />
            <h3 className="font-semibold text-white text-sm">{title || 'Confirmar eliminación'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          {message || '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.'}
        </p>

        <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-surface-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-surface-dark hover:bg-[#1A253D] text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-medium rounded-xl transition-colors shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
