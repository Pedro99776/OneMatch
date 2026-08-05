import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, MapPin, Sparkles, Loader2, RefreshCw, User } from 'lucide-react';
import { discoveryAPI, matchingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';

export default function DiscoveryPage() {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [showMatch, setShowMatch] = useState(null);
  const { profile, loadProfile } = useAuth();
  const navigate = useNavigate();

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await discoveryAPI.getFeed();
      setProfiles(Array.isArray(data) ? data : data.results || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.has_active_match) {
      navigate('/chat');
      return;
    }
    loadFeed();
  }, [profile, navigate, loadFeed]);

  const currentProfile = profiles[currentIndex];

  const handleLike = async (isSuperLike = false) => {
    if (!currentProfile || isLiking) return;
    setIsLiking(true);
    setSwipeDirection('right');

    try {
      // Usa user_id (não profile id) para identificar o destinatário do like
      const { data } = await matchingAPI.giveLike(currentProfile.user_id, isSuperLike);

      if (data.is_match) {
        setTimeout(() => {
          setSwipeDirection(null);
          setShowMatch(currentProfile);
        }, 400);
      } else {
        setTimeout(() => {
          setSwipeDirection(null);
          setCurrentIndex((prev) => prev + 1);
        }, 400);
      }
    } catch (err) {
      setSwipeDirection(null);
      const code = err.response?.data?.code;
      const serverMsg = err.response?.data?.message;

      if (code === 'has_active_match') {
        // Não deveria acontecer (feed já bloqueia), mas como segurança extra
        navigate('/chat');
      } else if (code === 'daily_limit') {
        alert(serverMsg || 'Você atingiu o limite de likes por dia.');
      } else if (code === 'target_unavailable' || code === 'generic_error' || err.response?.status === 409) {
        // Erro genérico — não revela que o outro deu match com alguém
        setCurrentIndex((prev) => prev + 1);
      } else {
        console.error('Error giving like:', err);
        setCurrentIndex((prev) => prev + 1);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handlePass = () => {
    setSwipeDirection('left');
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex((prev) => prev + 1);
    }, 400);
  };

  const handleMatchContinue = async () => {
    await loadProfile();
    navigate('/chat');
  };

  // Match Celebration Modal
  if (showMatch) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0f]/95 flex items-center justify-center p-6">
        <div className="text-center animate-match-celebration">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full gradient-bg flex items-center justify-center mx-auto animate-pulse-glow">
              <Heart className="w-16 h-16 text-white fill-white animate-heartbeat" />
            </div>
            <div className="absolute -top-4 -left-4 text-4xl animate-float" style={{ animationDelay: '0.2s' }}>💜</div>
            <div className="absolute -top-2 -right-6 text-3xl animate-float" style={{ animationDelay: '0.5s' }}>❤️</div>
            <div className="absolute -bottom-4 -right-2 text-4xl animate-float" style={{ animationDelay: '0.8s' }}>🔥</div>
          </div>

          <h1 className="text-5xl font-extrabold font-heading gradient-text mb-3">
            It&apos;s a Match!
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            Você e <strong className="text-gray-100">{showMatch.display_name}</strong> se curtiram!
          </p>
          <p className="text-gray-500 text-sm mb-10">
            Agora vocês podem conversar. Lembre-se: esse é seu único match!
          </p>

          <button onClick={handleMatchContinue} className="btn-primary text-lg !px-10 !py-4">
            <span className="flex items-center gap-2">Ir para o Chat 💬</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-gray-400">Carregando perfis...</p>
          </div>
        ) : !currentProfile || currentIndex >= profiles.length ? (
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-[#1a1a2e] flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold font-heading mb-3">Por enquanto é só!</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              Não encontramos mais perfis para você no momento. Volte mais tarde!
            </p>
            <button onClick={loadFeed} className="btn-secondary group">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
                Atualizar feed
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            {/* Card */}
            <div
              className={`relative rounded-3xl overflow-hidden bg-[#1a1a2e] border border-[rgba(139,92,246,0.15)] transition-all duration-[400ms] ${
                swipeDirection === 'right'
                  ? 'animate-[card-swipe-right_0.4s_ease-out_forwards]'
                  : swipeDirection === 'left'
                  ? 'animate-[card-swipe-left_0.4s_ease-out_forwards]'
                  : 'animate-fade-in'
              }`}
            >
              <div className="aspect-[3/4] bg-gradient-to-b from-purple-900/30 to-red-900/20 flex items-center justify-center relative">
                {currentProfile.photos && currentProfile.photos.length > 0 ? (
                  <img
                    src={currentProfile.photos.find(p => p.is_primary)?.image || currentProfile.photos[0].image}
                    alt={currentProfile.display_name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-24 h-24 text-gray-600/30" />
                )}

                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl font-bold text-white mb-1">{currentProfile.display_name}</h2>
                  <div className="flex items-center gap-1.5 text-white/70 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{currentProfile.city}, {currentProfile.state}</span>
                  </div>
                </div>

                {swipeDirection === 'right' && (
                  <div className="absolute top-8 left-6 px-4 py-2 rounded-xl border-2 border-green-400 text-green-400 font-bold text-xl rotate-[-15deg] animate-fade-in">
                    LIKE 💚
                  </div>
                )}
                {swipeDirection === 'left' && (
                  <div className="absolute top-8 right-6 px-4 py-2 rounded-xl border-2 border-red-400 text-red-400 font-bold text-xl rotate-[15deg] animate-fade-in">
                    NOPE
                  </div>
                )}
              </div>

              {currentProfile.bio && (
                <div className="p-5 border-t border-[rgba(139,92,246,0.15)]">
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{currentProfile.bio}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <button
                id="discovery-pass"
                onClick={handlePass}
                className="w-16 h-16 rounded-full border-2 border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-all hover:scale-110 active:scale-95"
              >
                <X className="w-7 h-7" />
              </button>

              <button
                id="discovery-super-like"
                onClick={() => handleLike(true)}
                disabled={isLiking}
                className="w-14 h-14 rounded-full border-2 border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/60 transition-all hover:scale-110 active:scale-95"
              >
                <Sparkles className="w-6 h-6" />
              </button>

              <button
                id="discovery-like"
                onClick={() => handleLike(false)}
                disabled={isLiking}
                className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all glow-purple"
              >
                <Heart className="w-7 h-7 fill-white" />
              </button>
            </div>

            <p className="text-center text-gray-500 text-xs mt-6">
              {currentIndex + 1} / {profiles.length} perfis
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
