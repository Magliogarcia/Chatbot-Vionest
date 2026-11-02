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
      <div className="w-16 h-16 rounded-2xl bg-[#2bace2]/10 border border-[#2bace2]/30 flex items-center justify-center mb-5 shadow-sm shadow-[#2bace2]/10">
        <Database className="w-8 h-8 text-[#2bace2]" />
      </div>

      <h2 className="text-2xl font-extrabold text-[#1b275d] mb-2 tracking-tight">
        Chatbot Interno de Vionest
      </h2>
      <p className="text-sm text-slate-600 font-normal max-w-md mb-8 leading-relaxed">
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
              className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#2bace2] rounded-xl transition-all group flex items-start gap-3 text-left cursor-pointer shadow-xs hover:shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:border-[#2bace2]/40 group-hover:bg-[#2bace2]/10 transition-colors">
                <IconComponent className="w-4 h-4 text-[#2bace2] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#2bace2] transition-colors">
                  {item.category}
                </span>
                <span className="text-xs text-[#1b275d] font-semibold transition-colors leading-relaxed line-clamp-2 mt-0.5">
                  {item.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-[#2bace2]" />
        <span>Conexión segura de solo lectura a MongoDB (1737 clientes)</span>
      </div>
    </div>
  );
}
