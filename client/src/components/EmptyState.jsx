import React from 'react';
import { Database, Search, ShieldCheck, Sparkles, Building2, PhoneCall, Filter } from 'lucide-react';

export function EmptyState({ onSelectPrompt }) {
  const examplePrompts = [
    {
      icon: Building2,
      category: 'Consulta por empresa',
      text: "¿Qué información tenemos de Academia de idiomas Let's Talk?",
    },
    {
      icon: Filter,
      category: 'Filtro por escuadrón',
      text: '¿Qué empresas están asignadas al Escuadrón 2?',
    },
    {
      icon: Filter,
      category: 'Filtro por estatus',
      text: '¿Qué clientes tienen estatus No interesado?',
    },
    {
      icon: PhoneCall,
      category: 'Verificación telefónica',
      text: '¿Está el número 0414-4006888 registrado en la colección de verificación?',
    },
    {
      icon: Search,
      category: 'Búsqueda por teléfono',
      text: '¿A qué empresa pertenece el número 0412-4814937?',
    },
    {
      icon: Sparkles,
      category: 'Búsqueda aproximada',
      text: 'Información de Aceite Rogil',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto animate-fade-in">
      {/* Central Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-accent-cyan/30 border border-brand-500/30 flex items-center justify-center mb-5 shadow-lg shadow-brand-600/10">
        <Database className="w-8 h-8 text-brand-400" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">
        Chatbot Interno de Vionest
      </h2>
      <p className="text-sm text-slate-400 max-w-md mb-8">
        Consulta información verificada de clientes directamente desde MongoDB en tiempo real. Selecciona una sugerencia o escribe tu pregunta abajo.
      </p>

      {/* Suggestion Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {examplePrompts.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.text)}
              className="p-3.5 bg-surface-card hover:bg-surface-hover border border-surface-border hover:border-brand-500/50 rounded-xl transition-all group flex items-start gap-3 text-left cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-dark border border-surface-border flex items-center justify-center flex-shrink-0 group-hover:border-brand-500/40 transition-colors">
                <IconComponent className="w-4 h-4 text-brand-400 group-hover:text-brand-300 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-hover:text-brand-400 transition-colors">
                  {item.category}
                </span>
                <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-relaxed line-clamp-2">
                  {item.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
        <span>Conexión segura de solo lectura a MongoDB (1737 clientes)</span>
      </div>
    </div>
  );
}
