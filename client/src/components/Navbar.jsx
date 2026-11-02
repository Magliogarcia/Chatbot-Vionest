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
    <header className="h-16 flex-shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-20 relative shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Lado izquierdo: Botón menú lateral + Logo + Título */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:text-[#1b275d] hover:bg-slate-100 rounded-lg transition-colors md:hidden flex-shrink-0 cursor-pointer"
          aria-label="Abrir menú lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2bace2] to-[#1a78a3] p-0.5 shadow-md shadow-[#2bace2]/20 flex-shrink-0">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
              <img src="/logo.webp" alt="Vionest" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1b275d] tracking-wider text-sm sm:text-base">VIONEST</span>
              <span className="text-[10px] font-bold bg-[#2bace2]/15 text-[#2bace2] px-2 py-0.5 rounded-md border border-[#2bace2]/30 tracking-wide">
                CHATBOT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block truncate max-w-xs md:max-w-md">
              {currentTitle || 'Consulta de Clientes en Tiempo Real'}
            </p>
          </div>
        </div>
      </div>

      {/* Lado derecho: Desktop Navigation (md y superior) */}
      <div className="hidden md:flex items-center gap-2.5">
        {/* DB Connection Indicator */}
        <button
          onClick={onOpenSystemModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-[#1b275d] font-semibold hover:border-[#2bace2] hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
          title="Ver estado de conexión y sistema"
        >
          {systemStatus?.database?.connected ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs text-[#1b275d] font-bold">
                MongoDB: {systemStatus.database.clientesCount} clientes
              </span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-amber-600 font-semibold">Verificando BD...</span>
            </>
          )}
          <Info className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* User Info & Admin Action */}
        {isAdmin && (
          <button
            onClick={onOpenAdminModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#2bace2] text-[#1b275d] font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            title="Crear cuenta de empleado"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#2bace2]" />
            <span className="hidden lg:inline">Crear Usuario</span>
          </button>
        )}

        <button
          onClick={onOpenPasswordModal}
          className="p-2 text-slate-600 hover:text-[#1b275d] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Cambiar Contraseña"
          aria-label="Cambiar Contraseña"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-[#1b275d]">{user?.username}</span>
            <span className="text-[10px] text-[#2bace2] font-bold capitalize">{user?.role}</span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Cerrar Sesión"
            aria-label="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lado derecho: Mobile Navigation (< md) */}
      <div className="flex md:hidden items-center gap-2" ref={menuRef}>
        {/* Indicador compacto de estado BD */}
        <button
          onClick={onOpenSystemModal}
          className="flex items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200 text-[#1b275d] hover:border-[#2bace2] transition-colors"
          title="Estado del Sistema"
          aria-label="Estado del Sistema"
        >
          <span className={`w-2.5 h-2.5 rounded-full ${systemStatus?.database?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        </button>

        {/* Botón de Perfil con Menú Desplegable */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
            mobileMenuOpen
              ? 'bg-[#2bace2]/15 border-[#2bace2] text-[#1b275d]'
              : 'bg-slate-50 border-slate-200 text-[#1b275d] hover:border-[#2bace2]'
          }`}
          title="Menú de usuario"
          aria-label="Menú de usuario"
        >
          <div className="w-6 h-6 rounded-md bg-[#2bace2] flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
            {user?.username ? user.username.charAt(0) : 'U'}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Menú Flotante para Móvil */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="absolute right-3 top-16 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50">
              {/* Cabecera del Usuario */}
              <div className="px-3.5 py-2.5 bg-slate-50 rounded-xl mb-2.5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1b275d] truncate max-w-[130px]">{user?.username}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#2bace2]/15 text-[#2bace2] border border-[#2bace2]/30">
                    {user?.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1.5 font-medium">
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#1b275d] hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer font-semibold"
                >
                  <Info className="w-4 h-4 text-[#2bace2]" />
                  <span>Estado del Sistema</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#1b275d] hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer font-semibold"
                  >
                    <UserPlus className="w-4 h-4 text-[#2bace2]" />
                    <span>Crear Nuevo Usuario</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPasswordModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#1b275d] hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer font-semibold"
                >
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span>Cambiar Contraseña</span>
                </button>

                <div className="h-[1px] bg-slate-200 my-2" />

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer font-bold"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
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
