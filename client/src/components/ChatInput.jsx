import React, { useRef, useEffect } from 'react';
import { Send, CornerDownLeft, Building2, X } from 'lucide-react';

export function ChatInput({
  input,
  setInput,
  onSend,
  loading,
  currentContext,
  onClearContext
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-[#3d4e8a] bg-[#1b275d] backdrop-blur-md p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Active Context Banner */}
        {currentContext?.clientName && (
          <div className="mb-2.5 flex items-center justify-between bg-[#283160] border border-[#2bace2]/50 rounded-xl px-3.5 py-2 text-xs text-[#2bace2] animate-fade-in shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-4 h-4 text-[#2bace2] flex-shrink-0" />
              <span className="font-medium text-slate-200">Cliente en contexto:</span>
              <strong className="text-white font-bold truncate text-sm">{currentContext.clientName}</strong>
            </div>
            {onClearContext && (
              <button
                onClick={onClearContext}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-2 cursor-pointer"
                title="Limpiar contexto actual"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading && input.trim()) {
              onSend();
            }
          }}
          className="relative flex items-end gap-2 bg-[#283160] border border-[#3d4e8a] focus-within:border-[#2bace2] focus-within:ring-2 focus-within:ring-[#2bace2]/30 rounded-2xl p-2.5 shadow-lg transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentContext?.clientName
                ? `Pregunta sobre ${currentContext.clientName} (ej. "¿Cuál es su teléfono?", "¿Tiene demo?")`
                : 'Escribe tu pregunta sobre clientes en español...'
            }
            disabled={loading}
            className="w-full bg-transparent text-sm text-white font-medium placeholder:text-slate-300 resize-none outline-none px-3 py-2 max-h-40 min-h-[42px] leading-relaxed"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-[#2bace2] hover:bg-[#3fb8e8] active:bg-[#1e94c8] text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex-shrink-0 cursor-pointer shadow-md shadow-[#2bace2]/25"
            title="Enviar mensaje (Enter)"
            aria-label="Enviar mensaje"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-2 text-[11px] text-slate-200">
          <span className="hidden sm:flex items-center gap-1.5 font-medium">
            <CornerDownLeft className="w-3.5 h-3.5 text-[#2bace2]" />
            Presiona <strong className="text-white font-bold bg-[#283160] border border-[#3d4e8a] px-1.5 py-0.2 rounded text-[10px]">Enter</strong> para enviar, <strong className="text-white font-bold bg-[#283160] border border-[#3d4e8a] px-1.5 py-0.2 rounded text-[10px]">Shift + Enter</strong> para salto de línea
          </span>
          <span className="sm:hidden text-[11px] text-slate-200 font-medium">
            Consultas sobre base de datos
          </span>
          <span className="text-[#2bace2] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2bace2]" />
            Solo datos de MongoDB
          </span>
        </div>
      </div>
    </div>
  );
}
