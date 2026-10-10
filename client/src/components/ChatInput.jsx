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
    <div className="flex-shrink-0 border-t border-surface-border bg-surface-dark/95 backdrop-blur-md p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Active Context Banner */}
        {currentContext?.clientName && (
          <div className="mb-2 flex items-center justify-between bg-brand-950/40 border border-brand-500/30 rounded-lg px-3 py-1.5 text-xs text-brand-300 animate-fade-in">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
              <span>Cliente en contexto:</span>
              <strong className="text-white truncate">{currentContext.clientName}</strong>
            </div>
            {onClearContext && (
              <button
                onClick={onClearContext}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors ml-2 cursor-pointer"
                title="Limpiar contexto actual"
              >
                <X className="w-3.5 h-3.5" />
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
          className="relative flex items-end gap-2 bg-surface-card border border-surface-border focus-within:border-brand-500 rounded-2xl p-2 shadow-lg transition-colors"
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
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none px-3 py-2 max-h-40 min-h-[40px]"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex-shrink-0 cursor-pointer shadow-md shadow-brand-600/20"
            title="Enviar mensaje (Enter)"
            aria-label="Enviar mensaje"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-1.5 px-2 text-[10px] text-slate-500">
          <span className="hidden sm:flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            Presiona <strong className="text-slate-400">Enter</strong> para enviar, <strong className="text-slate-400">Shift + Enter</strong> para salto de línea
          </span>
          <span className="sm:hidden text-[10px] text-slate-500">
            Consultas sobre base de datos
          </span>
          <span>Solo datos de MongoDB</span>
        </div>
      </div>
    </div>
  );
}
