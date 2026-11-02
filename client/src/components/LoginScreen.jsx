import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#2bace2]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl p-8 backdrop-blur-xl animate-fade-in">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#2bace2] to-[#1a78a3] p-0.5 shadow-md shadow-[#2bace2]/25 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
              <img src="/logo.webp" alt="Vionest Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1b275d]">VIONEST</h1>
          <p className="text-xs uppercase tracking-widest text-[#2bace2] font-bold mt-1">Chatbot Interno de Clientes</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Acceso exclusivo para personal autorizado
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium animate-fade-in" role="alert">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1b275d] mb-2" htmlFor="username">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2bace2]">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-[#1b275d] font-semibold placeholder:text-slate-400 rounded-xl focus:bg-white focus:border-[#2bace2] focus:ring-1 focus:ring-[#2bace2] transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1b275d] mb-2" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2bace2]">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-[#1b275d] font-semibold placeholder:text-slate-400 rounded-xl focus:bg-white focus:border-[#2bace2] focus:ring-1 focus:ring-[#2bace2] transition-colors text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#2bace2] hover:bg-[#3fb8e8] active:bg-[#1e94c8] text-white font-bold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#2bace2]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Development Helper Badge */}
        <div className="mt-6 pt-5 border-t border-slate-200 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#2bace2]" />
            <span>Usuario inicial de prueba: <strong className="text-[#1b275d] font-bold">admin</strong> / <strong className="text-[#1b275d] font-bold">123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
