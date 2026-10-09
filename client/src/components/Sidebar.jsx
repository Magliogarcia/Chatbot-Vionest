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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-surface-dark border-r border-surface-border flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header: New Conversation Button */}
        <div className="p-3 border-b border-surface-border flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-brand-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Conversación</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg md:hidden cursor-pointer"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Historial Reciente</span>
            <span className="text-[10px] bg-surface-card px-1.5 py-0.2 rounded text-slate-400">
              {conversations.length}
            </span>
          </div>

          {loadingConvs ? (
            <div className="p-4 text-center text-xs text-slate-500">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Cargando historial...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              No hay conversaciones previas. Inicia una consulta para comenzar.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === currentConvId;
              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-surface-card text-white font-medium border border-brand-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-surface-card/60 hover:text-white border border-transparent'
                  }`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                >
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="truncate text-xs">{conv.title}</p>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
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
                    className="absolute right-2 opacity-80 sm:opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
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
        <div className="p-3 border-t border-surface-border bg-[#0B0F19]/50 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand-400" />
            <span>MongoDB vionest</span>
          </div>
          <span className="text-emerald-400 font-mono text-[10px]">● Solo lectura</span>
        </div>
      </aside>
    </>
  );
}
