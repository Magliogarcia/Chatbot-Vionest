import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

const THINKING_PHRASES = [
  'Pensando...',
  'Consultando base de datos de clientes en MongoDB...',
  'Analizando contexto y parámetros comerciales...',
  'Sintetizando respuesta con agente de Inteligencia Artificial...',
  'Conectando con agente alternativo de respaldo...',
  'Verificando registros y números telefónicos...',
  'Estructurando informe final de la consulta...'
];

export function ThinkingIndicator({ onRetry, onCancel, lastUserQuery }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Contador de segundos transcurridos
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotador de frases estilo Claude cada 2.4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const isOverTimeout = elapsedSeconds >= 40;

  return (
    <div className="flex gap-3 mb-6 animate-fade-in">
      {/* Bot Avatar animado con halo de brillo */}
      <div className="w-8 h-8 rounded-xl bg-white border border-[#2bace2]/40 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 relative">
        <Bot className={`w-4 h-4 text-[#2bace2] ${isOverTimeout ? 'text-amber-500' : 'animate-pulse'}`} />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#2bace2] rounded-full animate-ping" />
      </div>

      <div className="flex-1 max-w-[90%] md:max-w-[75%] space-y-2">
        {/* Burbuja Principal Dinámica estilo Claude */}
        <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2bace2] animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-xs font-bold text-[#1b275d] tracking-wide">
                {elapsedSeconds < 10
                  ? 'Agente 1 activo'
                  : elapsedSeconds < 20
                  ? 'Agente 2 (Respaldo en progreso)'
                  : elapsedSeconds < 30
                  ? 'Agente 3 (Respaldo final)'
                  : 'Procesando en cascada'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
              {elapsedSeconds}s / 40s
            </span>
          </div>

          {/* Frase animada rotativa */}
          <div className="flex items-center gap-2.5 min-h-[26px]">
            <span
              key={phraseIndex}
              className="text-xs text-[#1b275d] font-medium animate-fade-in transition-all"
            >
              {THINKING_PHRASES[phraseIndex]}
            </span>
            <span className="flex gap-1 items-center flex-shrink-0 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2bace2] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#2bace2] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#2bace2] animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        </div>

        {/* Alerta si supera los 40 segundos sin respuesta */}
        {isOverTimeout && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 animate-fade-in shadow-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Aviso: Han transcurrido más de 40 segundos
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  Los agentes de Inteligencia Artificial de OpenRouter están experimentando alta latencia o saturación temporal en sus servidores.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-[#2bace2] hover:bg-[#3fb8e8] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar consulta</span>
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

