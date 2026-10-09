import React, { useState } from 'react';
import { Bot, User, Copy, Check, ExternalLink, Building2, Phone, MapPin } from 'lucide-react';

// Formateador simple y seguro de Markdown para las respuestas
function formatMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const processInline = (str) => {
    // Reemplazar enlaces [texto](url)
    let processed = str.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent-cyan hover:underline inline-flex items-center gap-0.5">$1 <svg class="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>');
    // Reemplazar negritas **texto**
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    // Reemplazar cursiva *texto* o _texto_
    processed = processed.replace(/(?:\*|_)([^*_]+)(?:\*|_)/g, '<em class="text-slate-300 italic">$1</em>');
    // Reemplazar código `codigo`
    processed = processed.replace(/`([^`]+)`/g, '<code class="bg-[#0B0F19] text-brand-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
    return processed;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 my-2 space-y-1 text-slate-200">
            {currentList.map((li, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: processInline(li) }} />
            ))}
          </ul>
        );
        currentList = [];
      }
      elements.push(
        <h3 key={index} className="text-sm font-bold text-brand-300 border-b border-surface-border/60 pb-1 mt-3 mb-2">
          {trimmed.replace('### ', '')}
        </h3>
      );
      return;
    }

    // List items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.substring(2));
      return;
    }

    // Numbered items (1. Item)
    const numMatch = trimmed.match(/^([0-9]+)\.\s*(.+)/);
    if (numMatch) {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 my-2 space-y-1 text-slate-200">
            {currentList.map((li, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: processInline(li) }} />
            ))}
          </ul>
        );
        currentList = [];
      }
      elements.push(
        <div key={index} className="flex gap-2 my-1 text-slate-200">
          <span className="font-semibold text-brand-400 flex-shrink-0">{numMatch[1]}.</span>
          <span dangerouslySetInnerHTML={{ __html: processInline(numMatch[2]) }} />
        </div>
      );
      return;
    }

    // Si había una lista acumulada y encontramos una línea normal
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${index}`} className="list-disc pl-5 my-2 space-y-1 text-slate-200">
          {currentList.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: processInline(li) }} />
          ))}
        </ul>
      );
      currentList = [];
    }

    // Párrafo normal o línea en blanco
    if (trimmed.length > 0) {
      elements.push(
        <p key={index} className="my-1.5 text-slate-200" dangerouslySetInnerHTML={{ __html: processInline(trimmed) }} />
      );
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-final" className="list-disc pl-5 my-2 space-y-1 text-slate-200">
        {currentList.map((li, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: processInline(li) }} />
        ))}
      </ul>
    );
  }

  return elements;
}

export function MessageBubble({ message, onSelectMatch }) {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 mb-6 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <Bot className="w-4 h-4 text-brand-400" />
        </div>
      )}

      <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-4 py-3.5 text-sm shadow-md transition-all ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-xs'
              : 'bg-surface-card border border-surface-border text-slate-200 rounded-tl-xs'
          }`}
        >
          {/* Message Content */}
          <div className="markdown-body space-y-1">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.text}</p>
            ) : (
              formatMarkdown(message.text)
            )}
          </div>

          {/* Interactive Company Disambiguation Cards (Sección 9) */}
          {!isUser && message.matches && message.matches.length > 1 && (
            <div className="mt-4 pt-3 border-t border-surface-border/80">
              <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Haz clic en una empresa o escribe su número:
              </p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {message.matches.map((item, idx) => (
                  <button
                    key={item._id || idx}
                    onClick={() => onSelectMatch && onSelectMatch(idx + 1)}
                    className="flex items-start gap-2.5 p-2.5 bg-[#0B0F19]/80 hover:bg-[#1A253D] border border-surface-border hover:border-brand-500/60 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-xs group-hover:text-brand-300 transition-colors">
                        {item.nombreEmpresa}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-1">
                        {item.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-slate-500" />
                            {item.telefono}
                          </span>
                        )}
                        {item.ubicacion && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-slate-500" />
                            <span className="truncate max-w-[200px]">{item.ubicacion}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assistant Action Bar */}
          {!isUser && (
            <div className="mt-2 pt-2 border-t border-surface-border/40 flex items-center justify-between text-[11px] text-slate-500">
              <span>Vionest Database</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-1.5 py-0.5 hover:text-slate-300 rounded transition-colors cursor-pointer"
                title="Copiar respuesta"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-slate-500 mt-1 px-1">
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-brand-700 border border-brand-500/50 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}
