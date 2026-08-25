import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, User, AlertTriangle, X, CheckCheck, Check } from 'lucide-react';
import { matchingAPI, chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Formata data ISO para HH:mm
function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Retorna true se duas datas sao no mesmo dia
function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

// Label do separador de data
function formatDateSeparator(isoString) {
  const d = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(isoString, today.toISOString())) return 'Hoje';
  if (isSameDay(isoString, yesterday.toISOString())) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getLastActiveText(lastLogin) {
  if (!lastLogin) return 'Offline';
  const loginDate = new Date(lastLogin);
  const now = new Date();
  const diffHours = (now - loginDate) / (1000 * 60 * 60);
  if (diffHours < 1) return 'Online recentemente';
  if (diffHours < 24) return `Visto há ${Math.floor(diffHours)}h`;
  return 'Offline';
}

export default function ChatPage() {
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [isUnmatching, setIsUnmatching] = useState(false);
  // Mapa de msg_id -> is_read para atualizacao em tempo real
  const [readMap, setReadMap] = useState({});
  // Controla se o outro usuario esta digitando
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimerRef = useRef(null);
  const sendTypingTimerRef = useRef(null);
  const markReadTimerRef = useRef(null);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { profile, loadProfile } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping, scrollToBottom]);

  const emitMarkRead = useCallback(() => {
    if (markReadTimerRef.current) return;
    
    // Só envia se a página estiver focada/visível
    if (document.visibilityState !== 'visible') return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'read_receipt' }));
      markReadTimerRef.current = setTimeout(() => {
        markReadTimerRef.current = null;
      }, 2000);
    }
  }, []);

  // Emite leitura quando a aba ganha foco
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        emitMarkRead();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [emitMarkRead]);

  useEffect(() => {
    let isMounted = true;
    let localWs = null;

    const loadMatch = async () => {
      try {
        const { data } = await matchingAPI.getCurrentMatch();
        if (data && data.id) {
          if (!isMounted) return;
          setMatch(data);

          try {
            const msgsRes = await chatAPI.getMessages(data.id);
            if (msgsRes.data && isMounted) {
              setMessages(msgsRes.data);
              const initialReadMap = {};
              msgsRes.data.forEach(m => { initialReadMap[m.id] = m.is_read; });
              setReadMap(initialReadMap);
            }
          } catch (e) {
            console.error('Error loading messages:', e);
          }

          if (isMounted) {
            localWs = connectWebSocket(data.id);
          }
        } else {
          navigate('/discover');
        }
      } catch (err) {
        if (err.response?.status === 204 && isMounted) navigate('/discover');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadMatch();

    return () => {
      isMounted = false;
      if (localWs) localWs.close();
      else if (wsRef.current) wsRef.current.close();
      clearTimeout(typingTimerRef.current);
      clearTimeout(sendTypingTimerRef.current);
    };
  }, [navigate, emitMarkRead]);

  const connectWebSocket = (matchId) => {
    const token = localStorage.getItem('access_token');
    let wsHost;
    if (import.meta.env.VITE_API_URL) {
      wsHost = import.meta.env.VITE_API_URL.replace('http', 'ws');
    } else {
      wsHost = 'ws://127.0.0.1:8000';
    }
    const wsUrl = `${wsHost}/ws/chat/${matchId}/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      emitMarkRead();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chat_message') {
        setMessages((prev) => [
          ...prev,
          {
            id: data.msg_id || Date.now(),
            content: data.message,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
            created_at: data.created_at || new Date().toISOString(),
            is_read: false,
          },
        ]);
        if (data.msg_id) {
          setReadMap(prev => ({ ...prev, [data.msg_id]: false }));
        }
        emitMarkRead();
      }

      if (data.type === 'typing') {
        if (data.is_typing) {
          setIsOtherTyping(true);
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setIsOtherTyping(false), 5000);
        } else {
          setIsOtherTyping(false);
          clearTimeout(typingTimerRef.current);
        }
      }

      if (data.type === 'read_receipt') {
        setReadMap(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(k => { updated[k] = true; });
          return updated;
        });
      }
    };

    wsRef.current = ws;
    return ws;
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    const isAdding = val.length > newMessage.length;
    setNewMessage(val);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (val.trim() === '') {
        // Se apagou tudo, corta o digitando imediatamente
        wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
        clearTimeout(sendTypingTimerRef.current);
        sendTypingTimerRef.current = null;
      } else if (isAdding && !sendTypingTimerRef.current) {
        // Só emite se estiver ADICIONANDO texto (pra não bugar se ficar apagando)
        wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));
        sendTypingTimerRef.current = setTimeout(() => {
          sendTypingTimerRef.current = null;
        }, 2000);
      }
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current) return;
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: newMessage.trim() }));
      // Corta o digitando assim que envia
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
      setNewMessage('');
      clearTimeout(sendTypingTimerRef.current);
      sendTypingTimerRef.current = null;
    }
  };

  const handleUnmatch = async () => {
    if (!match) return;
    setIsUnmatching(true);
    try {
      await matchingAPI.unmatch(match.id);
      await loadProfile();
      navigate('/discover');
    } catch (err) {
      console.error('Error unmatching:', err);
    } finally {
      setIsUnmatching(false);
    }
  };

  const myId = profile?.user_id;

  const otherUser = match
    ? match.user_1_id !== myId
      ? match.profile_user_1
      : match.profile_user_2
    : null;

  const otherPhoto = otherUser?.photos?.find(p => p.is_primary)?.image
    || otherUser?.photos?.[0]?.image
    || null;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-gray-400">Carregando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-[#0a0a0f] flex flex-col">

      {/* Header */}
      <header className="flex items-center gap-4 px-5 py-4 glass-strong border-b border-[rgba(139,92,246,0.15)] flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border-2 border-purple-500/30">
            {otherPhoto ? (
              <img src={otherPhoto} alt={otherUser?.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-bg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {otherUser?.display_name || otherUser?.username || 'Seu Match'}
            </h2>
            <div className="flex items-center gap-1.5">
              {isOtherTyping ? (
                <span className="text-xs text-purple-400 italic animate-pulse">digitando...</span>
              ) : (
                <>
                  {otherUser?.last_login && (new Date() - new Date(otherUser.last_login)) / (1000 * 60 * 60) < 1 && (
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  )}
                  <span className="text-xs text-gray-500">{getLastActiveText(otherUser?.last_login)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowUnmatchModal(true)}
          className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Desfazer match"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
            emitMarkRead();
          }
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 h-full animate-fade-in">
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mb-4 animate-pulse-glow">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Voces deram match!</h3>
            <p className="text-gray-400 text-sm max-w-xs">
              Esse e o seu unico match. Mande a primeira mensagem e comece uma conexao de verdade!
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMine = msg.sender_id === myId;
          const prevMsg = messages[index - 1];
          const nextMsg = messages[index + 1];

          const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
          const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

          const showDateSep = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);

          const wasRead = isMine && (readMap[msg.id] ?? msg.is_read);

          return (
            <div key={msg.id}>
              {showDateSep && msg.created_at && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[rgba(139,92,246,0.15)]" />
                  <span className="text-xs text-gray-500 font-medium px-2">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                  <div className="flex-1 h-px bg-[rgba(139,92,246,0.15)]" />
                </div>
              )}

              <div
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${
                  isLastInGroup ? 'mb-3' : 'mb-0.5'
                } animate-fade-in`}
              >
                <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-5 py-3 text-sm leading-relaxed shadow-lg ${
                      isMine
                        ? `bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-[0_4px_16px_rgba(168,85,247,0.3)] ${
                            isFirstInGroup ? 'rounded-t-3xl' : 'rounded-t-[4px]'
                          } ${isLastInGroup ? 'rounded-bl-3xl rounded-br-[4px]' : 'rounded-br-[4px] rounded-bl-3xl'}`
                        : `bg-white/5 backdrop-blur-md border border-white/5 text-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${
                            isFirstInGroup ? 'rounded-t-3xl' : 'rounded-t-[4px]'
                          } ${isLastInGroup ? 'rounded-br-3xl rounded-bl-[4px]' : 'rounded-bl-[4px] rounded-br-3xl'}`
                    }`}
                  >
                    {msg.content}
                  </div>

                  {isLastInGroup && (
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] text-gray-600">
                        {formatTime(msg.created_at)}
                      </span>
                      {isMine && (
                        wasRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-600" />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isOtherTyping && (
          <div className="flex justify-start mb-3 animate-fade-in">
            <div className="bg-[#1a1a2e] border border-[rgba(139,92,246,0.15)] px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-3 px-4 py-4 border-t border-[rgba(139,92,246,0.15)] bg-[#12121a] flex-shrink-0"
      >
        <input
          id="chat-input"
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Digite sua mensagem..."
          className="input-field flex-1 !rounded-full"
          autoComplete="off"
        />
        <button
          id="chat-send"
          type="submit"
          disabled={!newMessage.trim()}
          className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white disabled:opacity-30 hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Unmatch Modal */}
      {showUnmatchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-strong rounded-2xl p-8 max-w-sm w-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-bold">Desfazer match?</h3>
              </div>
              <button onClick={() => setShowUnmatchModal(false)} className="text-gray-500 hover:text-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Ao desfazer o match, <strong className="text-gray-100">ambos os perfis ficam livres</strong> para dar novos likes.
              A conversa sera encerrada.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowUnmatchModal(false)} className="btn-secondary flex-1 !py-3">
                <span>Cancelar</span>
              </button>
              <button
                onClick={handleUnmatch}
                disabled={isUnmatching}
                className="flex-1 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUnmatching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Desfazer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
