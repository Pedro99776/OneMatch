import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Heart, Loader2, User, AlertTriangle, X } from 'lucide-react';
import { matchingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ChatPage() {
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [isUnmatching, setIsUnmatching] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { profile, loadProfile } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const { data } = await matchingAPI.getCurrentMatch();
        if (data && data.id) {
          setMatch(data);
          connectWebSocket(data.id);
        } else {
          navigate('/discover');
        }
      } catch (err) {
        if (err.response?.status === 204) {
          navigate('/discover');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadMatch();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [navigate]);

  const connectWebSocket = (matchId) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat/${matchId}/`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: data.message,
          sender_id: data.sender_id,
          sender_name: data.sender_name,
          created_at: new Date().toISOString(),
        },
      ]);
    };

    wsRef.current = ws;
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current) return;

    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: newMessage.trim() }));
      setNewMessage('');
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

  const otherUser = match
    ? match.user_1?.email !== profile?.user_email
      ? match.user_1
      : match.user_2
    : null;

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
          onClick={() => navigate('/discover')}
          className="text-gray-400 hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {otherUser?.username || 'Seu Match'}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">Match ativo</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowUnmatchModal(true)}
          className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Desfazer match"
        >
          <Heart className="w-5 h-5" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mb-4 animate-pulse-glow">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Vocês deram match! 🎉</h3>
            <p className="text-gray-400 text-sm max-w-xs">
              Essa é a única pessoa que você pode conversar agora. Envie a primeira mensagem!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_name === profile?.display_name;

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'gradient-bg text-white rounded-br-md'
                    : 'bg-[#1a1a2e] border border-[rgba(139,92,246,0.15)] text-gray-100 rounded-bl-md'
                }`}
              >
                {!isMine && (
                  <span className="block text-xs text-purple-400 font-medium mb-1">{msg.sender_name}</span>
                )}
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-3 px-5 py-4 border-t border-[rgba(139,92,246,0.15)] bg-[#12121a] flex-shrink-0"
      >
        <input
          id="chat-input"
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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
              A conversa será encerrada.
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
