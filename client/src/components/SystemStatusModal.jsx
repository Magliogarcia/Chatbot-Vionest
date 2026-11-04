import React from 'react';
import { X, Database, Cpu, ShieldCheck, ExternalLink, Network, ArrowRight } from 'lucide-react';

export function SystemStatusModal({ isOpen, onClose, systemStatus }) {
  if (!isOpen) return null;

  const isConfigured = Boolean(systemStatus?.openRouter?.configured || systemStatus?.gemini?.configured);
  const models = systemStatus?.openRouter?.models || [
    'nvidia/nemotron-3.5-lightning:free',
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#2bace2]" />
            <h3 className="font-bold text-[#1b275d] text-base">Estado del Sistema y Conexión</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#1b275d] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* MongoDB Status Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1b275d] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#2bace2]" />
                MongoDB
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                systemStatus?.database?.connected
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                {systemStatus?.database?.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-200 text-slate-600">
              <div>
                <span className="text-slate-400 font-medium block">Base de Datos:</span>
                <span className="font-mono text-[#1b275d] font-bold">{systemStatus?.database?.name || 'vionest'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Host y Puerto:</span>
                <span className="font-mono text-[#1b275d] font-bold">127.0.0.1:27017</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Colección `clientes`:</span>
                <span className="font-bold text-[#1b275d] text-sm">{systemStatus?.database?.clientesCount} registros</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Colección `verificacion`:</span>
                <span className="font-bold text-[#1b275d] text-sm">{systemStatus?.database?.verificacionCount} registros</span>
              </div>
            </div>
          </div>

          {/* OpenRouter AI Status Box (Cascada de Agentes) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1b275d] flex items-center gap-2">
                <Network className="w-4 h-4 text-[#2bace2]" />
                OpenRouter AI (Cascada de 3 Agentes)
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isConfigured
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                {isConfigured ? '3 Agentes Conectados' : 'Sin API Key (Modo Determinista)'}
              </span>
            </div>

            <div className="text-slate-600 pt-2 border-t border-slate-200 space-y-2">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Orden secuencial de respuesta:</span>
                <span className="font-mono text-[#2bace2] font-bold">10s timeout por agente</span>
              </div>

              {/* Lista secuencial de agentes */}
              <div className="space-y-1.5 font-mono text-[11px]">
                {models.map((mod, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="w-4 h-4 rounded-full bg-[#2bace2]/15 text-[#2bace2] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-[#1b275d] font-bold truncate flex-1">{mod}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-medium">
                      {index === 0 ? 'Principal' : index === 1 ? 'Respaldo 1' : 'Respaldo 2'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                <span>Tiempo límite total antes de alerta:</span>
                <span className="font-bold text-[#1b275d]">40 segundos</span>
              </div>
            </div>
          </div>

          {/* Security & Access Policy Badge */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-slate-600">
            <ShieldCheck className="w-5 h-5 text-[#2bace2] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1b275d] block font-bold mb-0.5">Política de Solo Lectura y Respaldo Fáctico:</strong>
              <span className="text-slate-600 font-normal leading-relaxed">
                Los agentes de OpenRouter reciben exclusivamente datos de lectura desde MongoDB y no pueden alterar la base de datos. Si todos los agentes fallaran, el sistema recurre al formateo determinista interno.
              </span>
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
