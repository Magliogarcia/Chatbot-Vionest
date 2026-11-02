import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api.js';
import { X, UserPlus, Users, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export function AdminCreateUserModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('create'); // 'create' | 'list'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && tab === 'list') {
      loadUsers();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await authApi.getUsers();
      if (res.success) {
        setUsersList(res.users);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (username.trim().length < 3) {
      setErrorMsg('El usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      await authApi.createUser({ username: username.trim(), password, role });
      setSuccessMsg(`Usuario "${username.trim()}" creado exitosamente.`);
      setUsername('');
      setPassword('');
      setRole('employee');
      setTimeout(() => {
        setTab('list');
        setSuccessMsg('');
        loadUsers();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#2bace2]" />
            <h3 className="font-bold text-[#1b275d] text-base">Administración de Empleados</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#1b275d] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'create'
                ? 'bg-[#2bace2] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#1b275d]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Empleado</span>
          </button>
          <button
            onClick={() => setTab('list')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'list'
                ? 'bg-[#2bace2] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#1b275d]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Ver Cuentas ({usersList.length})</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1b275d] mb-1.5">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: carlos.perez"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#1b275d] font-semibold text-sm focus:bg-white focus:border-[#2bace2] focus:ring-1 focus:ring-[#2bace2] focus:outline-none placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1b275d] mb-1.5">
                Contraseña Temporal
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#1b275d] font-semibold text-sm focus:bg-white focus:border-[#2bace2] focus:ring-1 focus:ring-[#2bace2] focus:outline-none placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1b275d] mb-1.5">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#1b275d] font-semibold text-sm focus:bg-white focus:border-[#2bace2] focus:ring-1 focus:ring-[#2bace2] focus:outline-none cursor-pointer"
              >
                <option value="employee">Empleado (Solo consulta de clientes)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#2bace2] hover:bg-[#3fb8e8] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-[#2bace2]/25"
              >
                {loading ? 'Creando...' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-6 text-xs text-slate-500">Cargando cuentas...</div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No hay cuentas adicionales.</div>
            ) : (
              usersList.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-bold text-[#1b275d] text-sm">{u.username}</span>
                    <span className="ml-2.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#2bace2]/15 border border-[#2bace2]/30 text-[#2bace2]">
                      {u.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
