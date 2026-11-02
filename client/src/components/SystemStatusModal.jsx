import React from 'react';
import { X, Database, Cpu, ShieldCheck, ExternalLink } from 'lucide-react';

export function SystemStatusModal({ isOpen, onClose, systemStatus }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#283160] border border-[#3d4e8a] rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#3d4e8a]">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#2bace2]" />
            <h3 className="font-bold text-white text-base">Estado del Sistema y Conexión</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* MongoDB Status Box */}
          <div className="p-4 bg-[#1b275d] border border-[#3d4e8a] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#2bace2]" />
                MongoDB
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                systemStatus?.database?.connected
                  ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-400'
                  : 'bg-amber-950/80 border border-amber-500/60 text-amber-300'
              }`}>
                {systemStatus?.database?.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-[#3d4e8a] text-slate-200">
              <div>
                <span className="text-slate-300 font-medium block">Base de Datos:</span>
                <span className="font-mono text-white font-bold">{systemStatus?.database?.name || 'vionest'}</span>
              </div>
              <div>
                <span className="text-slate-300 font-medium block">Host y Puerto:</span>
                <span className="font-mono text-white font-bold">127.0.0.1:27017</span>
              </div>
              <div>
                <span className="text-slate-300 font-medium block">Colección `clientes`:</span>
                <span className="font-bold text-white text-sm">{systemStatus?.database?.clientesCount} registros</span>
              </div>
              <div>
                <span className="text-slate-300 font-medium block">Colección `verificacion`:</span>
                <span className="font-bold text-white text-sm">{systemStatus?.database?.verificacionCount} registros</span>
              </div>
            </div>
          </div>

          {/* Gemini AI Status Box */}
          <div className="p-4 bg-[#1b275d] border border-[#3d4e8a] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#2bace2]" />
                Google Gemini AI
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                systemStatus?.gemini?.configured
                  ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-400'
                  : 'bg-amber-950/80 border border-amber-500/60 text-amber-300'
              }`}>
                {systemStatus?.gemini?.configured ? 'API Key Configurada' : 'Sin API Key (Modo Determinista)'}
              </span>
            </div>
            <div className="text-slate-200 pt-2.5 border-t border-[#3d4e8a] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Modelo Activo:</span>
                <span className="font-mono text-white font-bold">{systemStatus?.gemini?.model || 'gemini-2.5-flash'}</span>
              </div>

              {!systemStatus?.gemini?.configured && (
                <div className="mt-2.5 p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-200">
                  <p className="font-bold mb-1 text-white">¿Cómo configurar Google Gemini?</p>
                  <ol className="list-decimal pl-4 space-y-1 text-xs text-amber-200">
                    <li>Ingresa a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-white inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3 inline" /></a></li>
                    <li>Crea tu API Key gratuita.</li>
                    <li>Agrega la clave en <code className="bg-[#283160] px-1.5 py-0.5 rounded text-white font-mono border border-[#3d4e8a]">server/.env</code> en el parámetro <code className="text-[#2bace2]">GEMINI_API_KEY</code>.</li>
                    <li>Reinicia el servidor backend.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* Security & Access Policy Badge */}
          <div className="p-3.5 bg-[#1b275d] border border-[#3d4e8a] rounded-xl flex items-start gap-3 text-slate-200">
            <ShieldCheck className="w-5 h-5 text-[#2bace2] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold mb-0.5">Política de Solo Lectura Activa:</strong>
              <span className="text-slate-200 font-normal leading-relaxed">El chatbot no altera, inserta ni elimina ningún dato en las colecciones de clientes. Todas las consultas son deterministas, sanitizadas y protegidas.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#2bace2] hover:bg-[#3fb8e8] text-white font-bold rounded-xl transition-colors cursor-pointer text-xs shadow-md shadow-[#2bace2]/25"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
