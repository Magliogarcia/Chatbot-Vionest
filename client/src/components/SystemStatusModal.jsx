import React from 'react';
import { X, Database, Cpu, ShieldCheck, KeyRound, ExternalLink } from 'lucide-react';

export function SystemStatusModal({ isOpen, onClose, systemStatus }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-white text-base">Estado del Sistema y Conexión</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* MongoDB Status Box */}
          <div className="p-4 bg-[#0B0F19] border border-surface-border rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-400" />
                MongoDB (Instancia Local)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                {systemStatus?.database?.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border text-slate-300">
              <div>
                <span className="text-slate-500 block">Base de Datos:</span>
                <span className="font-mono">{systemStatus?.database?.name || 'vionest'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Host y Puerto:</span>
                <span className="font-mono">127.0.0.1:27017</span>
              </div>
              <div>
                <span className="text-slate-500 block">Colección `clientes`:</span>
                <span className="font-semibold text-white">{systemStatus?.database?.clientesCount} registros</span>
              </div>
              <div>
                <span className="text-slate-500 block">Colección `verificacion`:</span>
                <span className="font-semibold text-white">{systemStatus?.database?.verificacionCount} registros</span>
              </div>
            </div>
          </div>

          {/* Gemini AI Status Box */}
          <div className="p-4 bg-[#0B0F19] border border-surface-border rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent-cyan" />
                Google Gemini API
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                systemStatus?.gemini?.configured
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
              }`}>
                {systemStatus?.gemini?.configured ? 'API Key Configurada' : 'Sin API Key (Modo Determinista)'}
              </span>
            </div>
            <div className="text-slate-300 pt-2 border-t border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Modelo Activo:</span>
                <span className="font-mono text-white">{systemStatus?.gemini?.model || 'gemini-2.5-flash'}</span>
              </div>

              {!systemStatus?.gemini?.configured && (
                <div className="mt-2 p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-200">
                  <p className="font-medium mb-1">¿Cómo configurar Google Gemini?</p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-300/90">
                    <li>Ingresa a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-white inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-2.5 h-2.5 inline" /></a></li>
                    <li>Crea tu API Key gratuita.</li>
                    <li>Agrega la clave en <code className="bg-[#0B0F19] px-1 rounded text-white">server/.env</code> en el parámetro <code className="text-white">GEMINI_API_KEY</code>.</li>
                    <li>Reinicia el servidor backend.</li>
                  </ol>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    * Mientras tanto, el chatbot sigue operando con su motor determinista y consultas directas en MongoDB.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security & Access Policy Badge */}
          <div className="p-3 bg-surface-dark border border-surface-border rounded-xl flex items-start gap-2.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Política de Solo Lectura Activa:</strong>
              <span>El chatbot no puede alterar, insertar ni eliminar ningún dato en las colecciones de clientes. Todas las consultas son deterministas, sanitizadas y protegidas contra inyecciones.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl transition-colors cursor-pointer text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
