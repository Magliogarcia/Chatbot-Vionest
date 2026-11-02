import React from 'react';
import { Plus, MessageSquare, Trash2, X, Clock, Database } from 'lucide-react';

export function Sidebar({
  isOpen,
  onClose,
  conversations,
  currentConvId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRequestDelete,
  loadingConvs
}) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#1b275d] border-r border-[#3d4e8a] flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header: New Conversation Button */}
        <div className="p-3.5 border-b border-[#3d4e8a] flex items-center justify-between gap-2 bg-[#1b275d]">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#2bace2] hover:bg-[#3fb8e8] active:bg-[#1e94c8] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#2bace2]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Conversación</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-200 hover:text-white rounded-lg md:hidden cursor-pointer hover:bg-white/10"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
            <span>Historial Reciente</span>
            <span className="text-[10px] bg-[#283160] border border-[#3d4e8a] px-2 py-0.5 rounded-full text-white font-bold">
              {conversations.length}
            </span>
          </div>

          {loadingConvs ? (
            <div className="p-6 text-center text-xs text-slate-200">
              <div className="w-5 h-5 border-2 border-[#2bace2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Cargando historial...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-300 italic">
              No hay conversaciones previas. Inicia una consulta para comenzar.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === currentConvId;
              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#283160] text-white font-bold border-l-4 border-l-[#2bace2] border-y border-r border-[#3d4e8a] shadow-sm'
                      : 'text-slate-100 hover:bg-white/10 hover:text-white font-medium border border-transparent'
                  }`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                >
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#2bace2]' : 'text-slate-300'}`} />
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`truncate text-xs ${isActive ? 'text-white font-bold' : 'text-slate-100 font-medium'}`}>{conv.title}</p>
                    <span className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(conv.updatedAt)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRequestDelete) {
                        onRequestDelete(conv);
                      } else {
                        onDeleteConversation(conv.id);
                      }
                    }}
                    className="absolute right-2 opacity-80 sm:opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                    title="Eliminar conversación"
                    aria-label="Eliminar conversación"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Status */}
        <div className="p-3 border-t border-[#3d4e8a] bg-[#17204d] text-xs text-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Database className="w-3.5 h-3.5 text-[#2bace2]" />
            <span className="text-white font-semibold">MongoDB vionest</span>
          </div>
          <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Solo lectura
          </span>
        </div>
      </aside>
    </>
  );
}
