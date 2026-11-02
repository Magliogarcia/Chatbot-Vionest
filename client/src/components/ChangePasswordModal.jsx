import React, { useState } from 'react';
import { authApi } from '../services/api.js';
import { X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword(currentPassword, newPassword);
      setSuccessMsg('Contraseña actualizada correctamente.');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#283160] border border-[#3d4e8a] rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#3d4e8a]">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#2bace2]" />
            <h3 className="font-bold text-white text-base">Cambiar Contraseña</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-2.5 text-white text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
              Contraseña Actual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1b275d] border border-[#3d4e8a] rounded-xl text-white font-medium text-sm focus:border-[#2bace2] focus:ring-1 focus:ring-[#2bace2] focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
              Nueva Contraseña (mín. 6 caracteres)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1b275d] border border-[#3d4e8a] rounded-xl text-white font-medium text-sm focus:border-[#2bace2] focus:ring-1 focus:ring-[#2bace2] focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1b275d] border border-[#3d4e8a] rounded-xl text-white font-medium text-sm focus:border-[#2bace2] focus:ring-1 focus:ring-[#2bace2] focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#3d4e8a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1b275d] hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#2bace2] hover:bg-[#3fb8e8] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-[#2bace2]/25"
            >
              {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
