import React, { useState } from 'react';
import { Bot, User, Copy, Check, ExternalLink, Building2, Phone, MapPin } from 'lucide-react';

// Formateador robusto y seguro de Markdown para respuestas
function formatMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const processInline = (str) => {
    // 1. Tokens para código inline `codigo`
    const codeTokens = [];
    let processed = str.replace(/`([^`]+)`/g, (_, code) => {
      const token = `__CODE_${codeTokens.length}__`;
      codeTokens.push(`<code class="bg-[#1b275d] text-[#2bace2] px-1.5 py-0.5 rounded text-xs font-mono font-semibold border border-[#3d4e8a]">${code}</code>`);
      return token;
    });

    // 2. Tokens para enlaces [texto](url)
    const linkTokens = [];
    processed = processed.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, (_, label, url) => {
      const token = `__LINK_${linkTokens.length}__`;
      linkTokens.push(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#2bace2] font-semibold underline underline-offset-2 hover:text-[#6ec8f0] inline-flex items-center gap-1">${label} <svg class="w-3.5 h-3.5 inline opacity-85" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`);
      return token;
    });

    // 3. Negritas **texto**
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>');

    // 4. Cursiva *texto*
    processed = processed.replace(/\*([^*]+)\*/g, '<em class="text-slate-100 italic font-medium">$1</em>');

    // 5. Restaurar enlaces y código
    linkTokens.forEach((linkHtml, i) => {
      processed = processed.replace(`__LINK_${i}__`, linkHtml);
    });

    codeTokens.forEach((codeHtml, i) => {
      processed = processed.replace(`__CODE_${i}__`, codeHtml);
    });

    return processed;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers ###
    if (trimmed.startsWith('### ')) {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 my-2 space-y-1.5 text-white">
            {currentList.map((li, i) => (
              <li key={i} className="text-white font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(li) }} />
            ))}
          </ul>
        );
        currentList = [];
      }
      elements.push(
        <h3 key={index} className="text-base font-bold text-[#2bace2] border-b border-[#3d4e8a] pb-1.5 mt-3.5 mb-2">
          {trimmed.replace('### ', '')}
        </h3>
      );
      return;
    }

    // List items - o *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.substring(2));
      return;
    }

    // Numbered items (1. Item)
    const numMatch = trimmed.match(/^([0-9]+)\.\s*(.+)/);
    if (numMatch) {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 my-2 space-y-1.5 text-white">
            {currentList.map((li, i) => (
              <li key={i} className="text-white font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(li) }} />
            ))}
          </ul>
        );
        currentList = [];
      }
      elements.push(
        <div key={index} className="flex gap-2 my-1.5 text-white">
          <span className="font-bold text-[#2bace2] flex-shrink-0">{numMatch[1]}.</span>
          <span className="text-white font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(numMatch[2]) }} />
        </div>
      );
      return;
    }

    // Si había una lista acumulada y encontramos una línea normal
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${index}`} className="list-disc pl-5 my-2 space-y-1.5 text-white">
          {currentList.map((li, i) => (
            <li key={i} className="text-white font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(li) }} />
          ))}
        </ul>
      );
      currentList = [];
    }

    // Párrafo normal o línea en blanco
    if (trimmed.length > 0) {
      elements.push(
        <p key={index} className="my-1.5 text-white font-normal leading-relaxed text-[14.5px]" dangerouslySetInnerHTML={{ __html: processInline(trimmed) }} />
      );
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-final" className="list-disc pl-5 my-2 space-y-1.5 text-white">
        {currentList.map((li, i) => (
          <li key={i} className="text-white font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: processInline(li) }} />
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
        <div className="w-8 h-8 rounded-xl bg-[#283160] border border-[#2bace2]/40 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <Bot className="w-4 h-4 text-[#2bace2]" />
        </div>
      )}

      <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-5 py-4 text-sm shadow-lg transition-all ${
            isUser
              ? 'bg-[#2bace2] text-white font-medium rounded-tr-xs shadow-[#2bace2]/15'
              : 'bg-[#283160] border border-[#3d4e8a] text-white rounded-tl-xs'
          }`}
        >
          {/* Message Content */}
          <div className="markdown-body space-y-1 text-white">
            {isUser ? (
              <p className="whitespace-pre-wrap font-medium text-white text-[14.5px] leading-relaxed">{message.text}</p>
            ) : (
              formatMarkdown(message.text)
            )}
          </div>

          {/* Interactive Company Disambiguation Cards */}
          {!isUser && message.matches && message.matches.length > 1 && (
            <div className="mt-4 pt-3.5 border-t border-[#3d4e8a]">
              <p className="text-xs font-bold text-[#2bace2] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Haz clic en una empresa o escribe su número:
              </p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {message.matches.map((item, idx) => (
                  <button
                    key={item._id || idx}
                    onClick={() => onSelectMatch && onSelectMatch(idx + 1)}
                    className="flex items-start gap-2.5 p-3 bg-[#1b275d] hover:bg-[#324078] border border-[#3d4e8a] hover:border-[#2bace2] rounded-xl text-left transition-all group cursor-pointer shadow-sm"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#2bace2]/25 text-[#2bace2] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#2bace2] group-hover:text-white transition-colors border border-[#2bace2]/40">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-xs group-hover:text-[#2bace2] transition-colors">
                        {item.nombreEmpresa}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-200 mt-1">
                        {item.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-[#2bace2]" />
                            {item.telefono}
                          </span>
                        )}
                        {item.ubicacion && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-[#2bace2]" />
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
            <div className="mt-3 pt-2.5 border-t border-[#3d4e8a]/70 flex items-center justify-between text-xs text-slate-200">
              <span className="font-medium text-slate-300">Vionest Database</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-0.5 text-slate-200 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer font-medium"
                title="Copiar respuesta"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[11px] text-slate-300 font-medium mt-1 px-1">
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-[#2bace2] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}
