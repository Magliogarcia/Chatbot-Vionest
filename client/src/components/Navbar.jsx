import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Database,
  LogOut,
  KeyRound,
  UserPlus,
  Info,
  Menu,
  Shield,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export function Navbar({
  systemStatus,
  onOpenSystemModal,
  onOpenPasswordModal,
  onOpenAdminModal,
  toggleSidebar,
  currentTitle
}) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="h-16 border-b border-surface-border bg-surface-dark/95 backdrop-blur-md px-4 flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-surface-card rounded-lg transition-colors md:hidden cursor-pointer"
          aria-label="Abrir menú lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-md shadow-brand-600/20">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Database className="w-4 h-4 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide text-sm">VIONEST</span>
              <span className="text-[10px] font-semibold bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded border border-brand-500/30">
                CHATBOT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs md:max-w-md">
              {currentTitle || 'Consulta de Clientes en Tiempo Real'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* DB Connection Indicator */}
        <button
          onClick={onOpenSystemModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-card border border-surface-border text-xs text-slate-300 hover:border-brand-500/50 transition-colors cursor-pointer"
          title="Ver estado de conexión y sistema"
        >
          {systemStatus?.database?.connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline font-mono text-[11px] text-slate-300">
                MongoDB: {systemStatus.database.clientesCount} clientes
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="hidden md:inline text-[11px] text-amber-400">Verificando BD...</span>
            </>
          )}
          <Info className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* User Info & Admin Action */}
        {isAdmin && (
          <button
            onClick={onOpenAdminModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-surface-card hover:bg-surface-hover border border-surface-border text-slate-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
            title="Crear cuenta de empleado"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden lg:inline">Crear Usuario</span>
          </button>
        )}

        <button
          onClick={onOpenPasswordModal}
          className="p-2 text-slate-400 hover:text-white hover:bg-surface-card rounded-lg transition-colors cursor-pointer"
          title="Cambiar Contraseña"
          aria-label="Cambiar Contraseña"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-surface-border mx-1" />

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-white">{user?.username}</span>
            <span className="text-[10px] text-slate-400 capitalize">{user?.role}</span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
            title="Cerrar Sesión"
            aria-label="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
