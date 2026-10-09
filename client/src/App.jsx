import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { MessageBubble } from './components/MessageBubble.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { ChatInput } from './components/ChatInput.jsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.jsx';
import { AdminCreateUserModal } from './components/AdminCreateUserModal.jsx';
import { SystemStatusModal } from './components/SystemStatusModal.jsx';
import { ConfirmModal } from './components/ConfirmModal.jsx';
import { chatApi, systemApi } from './services/api.js';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentContext, setCurrentContext] = useState(null);
  const [input, setInput] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [chatError, setChatError] = useState(null);

  // Modales
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [systemModalOpen, setSystemModalOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingMessage]);

  // Cargar estado del sistema y conversaciones al autenticarse
  useEffect(() => {
    if (user) {
      loadSystemStatus();
      loadConversations();
    }
  }, [user]);

  async function loadSystemStatus() {
    try {
      const res = await systemApi.getStatus();
      if (res.success) {
        setSystemStatus(res);
      }
    } catch (err) {
      console.warn('No se pudo cargar el estado del sistema:', err);
    }
  }

  async function loadConversations() {
    try {
      setLoadingConvs(true);
      const res = await chatApi.getConversations();
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
    } finally {
      setLoadingConvs(false);
    }
  }

  async function handleSelectConversation(convId) {
    try {
      setLoadingMessage(true);
      setChatError(null);
      const res = await chatApi.getConversation(convId);
      if (res.success && res.conversation) {
        setCurrentConvId(res.conversation.id);
        setMessages(res.conversation.messages || []);
        setCurrentContext(res.conversation.currentClientContext || null);
      }
    } catch (err) {
      setChatError('Error al cargar la conversación seleccionada.');
    } finally {
      setLoadingMessage(false);
    }
  }

  function handleNewConversation() {
    setCurrentConvId(null);
    setMessages([]);
    setCurrentContext(null);
    setChatError(null);
    setInput('');
  }

  async function handleDeleteConversation(convId) {
    if (!convId) return;
    try {
      await chatApi.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConvId === convId) {
        handleNewConversation();
      }
    } catch (err) {
      console.error('Error al eliminar conversación:', err);
      setChatError('No se pudo eliminar la conversación.');
    } finally {
      setConvToDelete(null);
    }
  }

  async function handleSendMessage(overrideText = null) {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || loadingMessage) return;

    setChatError(null);
    setInput('');

    // Mensaje del usuario temporal para feedback inmediato
    const tempUserMsg = {
      id: `tmp_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoadingMessage(true);

    try {
      const res = await chatApi.sendMessage(textToSend, currentConvId);
      if (res.success) {
        // Actualizar conversación actual
        setCurrentConvId(res.conversationId);
        setCurrentContext(res.currentContext);

        // Reemplazar mensaje temporal y agregar respuesta del asistente
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, res.userMessage, res.assistantMessage];
        });

        // Recargar lista lateral de conversaciones
        loadConversations();
      }
    } catch (err) {
      setChatError(err.message || 'Error al procesar la consulta.');
      // Dejar mensaje de error en chat
      const errorMsg = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Ocurrió un problema:** ${err.message || 'No fue posible completar la consulta en la base de datos.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoadingMessage(false);
    }
  }

  // Si está cargando la sesión inicial
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-dark text-slate-300">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-medium">Iniciando Vionest Chatbot...</span>
      </div>
    );
  }

  // Si no está autenticado, mostrar Login
  if (!user) {
    return <LoginScreen />;
  }

  const activeConvTitle = conversations.find((c) => c.id === currentConvId)?.title;

  return (
    <div className="min-h-screen flex flex-col bg-surface-dark text-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        systemStatus={systemStatus}
        onOpenSystemModal={() => setSystemModalOpen(true)}
        onOpenPasswordModal={() => setPasswordModalOpen(true)}
        onOpenAdminModal={() => setAdminModalOpen(true)}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
        currentTitle={activeConvTitle}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          currentConvId={currentConvId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRequestDelete={(conv) => setConvToDelete(conv)}
          loadingConvs={loadingConvs}
        />

        {/* Central Chat Workspace */}
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-[#0B0F19] to-[#0E1422] overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {messages.length === 0 ? (
                <EmptyState onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
              ) : (
                <div className="flex-1 space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onSelectMatch={(optionNum) => handleSendMessage(String(optionNum))}
                    />
                  ))}

                  {/* Loading indicator */}
                  {loadingMessage && (
                    <div className="flex gap-3 mb-6 animate-fade-in">
                      <div className="w-8 h-8 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center flex-shrink-0 shadow-sm">
                        <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                        <span>Consultando base de datos de clientes...</span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Chat Input */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            loading={loadingMessage}
            currentContext={currentContext}
            onClearContext={() => setCurrentContext(null)}
          />
        </main>
      </div>

      {/* Modales */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

      <AdminCreateUserModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      <SystemStatusModal
        isOpen={systemModalOpen}
        onClose={() => setSystemModalOpen(false)}
        systemStatus={systemStatus}
      />

      <ConfirmModal
        isOpen={Boolean(convToDelete)}
        onClose={() => setConvToDelete(null)}
        onConfirm={() => {
          if (convToDelete) {
            handleDeleteConversation(convToDelete.id);
          }
        }}
        title="Eliminar Conversación"
        message={convToDelete ? `¿Deseas eliminar permanentemente la conversación "${convToDelete.title}"?` : ''}
        confirmText="Eliminar"
      />
    </div>
  );
}
