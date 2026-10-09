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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-white text-base">Administración de Empleados</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 p-1 bg-surface-dark rounded-xl border border-surface-border">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'create'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Crear Empleado</span>
          </button>
          <button
            onClick={() => setTab('list')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'list'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ver Cuentas ({usersList.length})</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: carlos.perez"
                className="w-full px-3 py-2 bg-[#0B0F19] border border-surface-border rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Contraseña Temporal
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-[#0B0F19] border border-surface-border rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-surface-border rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="employee">Empleado (Solo consulta de clientes)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface-dark hover:bg-[#1A253D] text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
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
              <div className="text-center py-6 text-xs text-slate-500">No hay cuentas adicionales.</div>
            ) : (
              usersList.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 bg-surface-dark border border-surface-border rounded-xl text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{u.username}</span>
                    <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-brand-300">
                      {u.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
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
