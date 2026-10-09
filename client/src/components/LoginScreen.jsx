import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Database } from 'lucide-react';

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(username.trim(), password);
    } catch (err) {
      setErrorMsg(err.message || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#070A12] via-[#0B0F19] to-[#121028]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-surface-card border border-surface-border/70 rounded-2xl shadow-2xl p-8 backdrop-blur-xl animate-fade-in">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-lg shadow-brand-600/25 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
              <Database className="w-7 h-7 text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">VIONEST</h1>
          <p className="text-xs uppercase tracking-widest text-brand-400 font-semibold mt-0.5">Chatbot Interno de Clientes</p>
          <p className="text-sm text-slate-400 mt-2">
            Acceso exclusivo para personal autorizado
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-3 text-red-200 text-sm animate-fade-in" role="alert">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="username">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. admin"
                autoComplete="username"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19]/80 border border-surface-border text-white placeholder-slate-500 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19]/80 border border-surface-border text-white placeholder-slate-500 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-medium text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Development Helper Badge */}
        <div className="mt-6 pt-5 border-t border-surface-border/60 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-surface-dark px-3 py-1.5 rounded-lg border border-surface-border">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>Usuario inicial de prueba: <strong className="text-slate-200">admin</strong> / <strong className="text-slate-200">123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
