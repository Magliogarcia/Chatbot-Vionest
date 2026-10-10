import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Database,
  LogOut,
  KeyRound,
  UserPlus,
  Info,
  Menu,
  ChevronDown
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="h-16 border-b border-surface-border bg-surface-dark/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-20 relative">
      {/* Lado izquierdo: Botón menú lateral + Logo + Título */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-surface-card rounded-lg transition-colors md:hidden flex-shrink-0 cursor-pointer"
          aria-label="Abrir menú lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-md shadow-brand-600/20 flex-shrink-0">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Database className="w-4 h-4 text-brand-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-white tracking-wide text-xs sm:text-sm">VIONEST</span>
              <span className="text-[9px] sm:text-[10px] font-semibold bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded border border-brand-500/30">
                CHATBOT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs md:max-w-md">
              {currentTitle || 'Consulta de Clientes en Tiempo Real'}
            </p>
          </div>
        </div>
      </div>

      {/* Lado derecho: Desktop Navigation (md y superior) */}
      <div className="hidden md:flex items-center gap-2">
        {/* DB Connection Indicator */}
        <button
          onClick={onOpenSystemModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-card border border-surface-border text-xs text-slate-300 hover:border-brand-500/50 transition-colors cursor-pointer"
          title="Ver estado de conexión y sistema"
        >
          {systemStatus?.database?.connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] text-slate-300">
                MongoDB: {systemStatus.database.clientesCount} clientes
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] text-amber-400">Verificando BD...</span>
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

      {/* Lado derecho: Mobile Navigation (< md) */}
      <div className="flex md:hidden items-center gap-1.5" ref={menuRef}>
        {/* Indicador compacto de estado BD */}
        <button
          onClick={onOpenSystemModal}
          className="flex items-center justify-center p-2 rounded-lg bg-surface-card border border-surface-border text-slate-300 hover:border-brand-500/50 transition-colors"
          title="Estado del Sistema"
          aria-label="Estado del Sistema"
        >
          <span className={`w-2 h-2 rounded-full ${systemStatus?.database?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        </button>

        {/* Botón de Perfil con Menú Desplegable */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
            mobileMenuOpen
              ? 'bg-brand-600/20 border-brand-500 text-white'
              : 'bg-surface-card border-surface-border text-slate-300 hover:text-white'
          }`}
          title="Menú de usuario"
          aria-label="Menú de usuario"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-brand-600 to-accent-cyan flex items-center justify-center text-[11px] font-bold text-white uppercase shadow-sm">
            {user?.username ? user.username.charAt(0) : 'U'}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Menú Flotante para Móvil (Opaco y con alto contraste) */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop semitransparente para cerrar y aislar el fondo */}
            <div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="absolute right-3 top-16 w-64 bg-[#131B2E] border border-slate-700 rounded-2xl shadow-2xl shadow-black/95 p-2.5 z-50">
              {/* Cabecera del Usuario */}
              <div className="px-3 py-2.5 bg-[#0B0F19] rounded-xl mb-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[130px]">{user?.username}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {user?.role}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${systemStatus?.database?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {systemStatus?.database?.connected
                    ? `MongoDB: ${systemStatus.database.clientesCount} clientes`
                    : 'BD no conectada'}
                </p>
              </div>

              {/* Opciones */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSystemModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/90 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Info className="w-4 h-4 text-brand-400" />
                  <span>Estado del Sistema</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/90 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-brand-400" />
                    <span>Crear Nuevo Usuario</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPasswordModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/90 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Cambiar Contraseña</span>
                </button>

                <div className="h-[1px] bg-slate-800 my-1.5" />

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
