import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, MapPin, Sparkles, Loader2, RefreshCw, User, Info, ArrowLeft, MessageCircle, SlidersHorizontal, Save } from 'lucide-react';
import { discoveryAPI, matchingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AppLayout from '../components/AppLayout';
import RangeSlider from '../components/RangeSlider';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Cache simples em memória para manter a sessão ao navegar entre abas
let cachedProfiles = [];
let cachedCurrentIndex = 0;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

export default function DiscoveryPage() {
  const [profiles, setProfiles] = useState(cachedProfiles);
  const [currentIndex, setCurrentIndex] = useState(cachedCurrentIndex);
  const [isLoading, setIsLoading] = useState(cachedProfiles.length === 0);
  const [isLiking, setIsLiking] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [showMatch, setShowMatch] = useState(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { profile, loadProfile, updateProfile } = useAuth();
  const [filterData, setFilterData] = useState({
    max_distance_km: profile?.max_distance_km || 50,
    min_age_preference: profile?.min_age_preference || 18,
    max_age_preference: profile?.max_age_preference || 99,
  });
  const [filterError, setFilterError] = useState('');
  const [isSavingFilters, setIsSavingFilters] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Sincroniza filterData caso o profile seja atualizado em background
  useEffect(() => {
    if (profile) {
      setFilterData({
        max_distance_km: profile.max_distance_km,
        min_age_preference: profile.min_age_preference,
        max_age_preference: profile.max_age_preference,
      });
    }
  }, [profile]);

  const handleSaveFilters = async (e) => {
    e.preventDefault();
    setFilterError('');
    
    let minAge = parseInt(filterData.min_age_preference) || 18;
    let maxAge = parseInt(filterData.max_age_preference) || 99;
    
    if (minAge < 18 || maxAge < 18) {
      setFilterError('A idade mínima permitida é 18 anos.');
      return;
    }
    if (minAge > maxAge) {
      setFilterError('A idade mínima não pode ser maior que a máxima.');
      return;
    }
    
    const validatedData = {
      ...filterData,
      min_age_preference: minAge,
      max_age_preference: maxAge
    };
    
    setFilterData(validatedData);

    setIsSavingFilters(true);
    await updateProfile(validatedData);
    setIsSavingFilters(false);
    setShowFilters(false);
    loadFeed();
  };

  const loadFeed = useCallback(async (force = false) => {
    // Se não for forçado e o cache for válido, não recarrega
    if (!force && cachedProfiles.length > 0 && (Date.now() - cacheTimestamp < CACHE_TTL)) {
      setProfiles(cachedProfiles);
      setCurrentIndex(cachedCurrentIndex);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await discoveryAPI.getFeed();
      const newProfiles = Array.isArray(data) ? data : data.results || [];
      setProfiles(newProfiles);
      setCurrentIndex(0);
      
      // Atualiza o cache
      cachedProfiles = newProfiles;
      cachedCurrentIndex = 0;
      cacheTimestamp = Date.now();
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile?.has_active_match) {
      loadFeed();
    }
  }, [profile, loadFeed]);

  // WebSocket para notificações em tempo real (substitui o polling)
  useEffect(() => {
    if (profile?.has_active_match || showMatch) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('http://', '').replace('https://', '') : window.location.host;
    
    let ws = null;
    let retryCount = 0;
    let reconnectTimer = null;
    let isMounted = true;

    const connectWS = () => {
      if (!isMounted) return;
      ws = new WebSocket(`${protocol}//${host}/ws/notifications/?token=${token}`);
      
      ws.onopen = () => {
        retryCount = 0;
      };
      
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'match_created') {
            const matchResponse = await matchingAPI.getCurrentMatch();
            if (matchResponse.data && matchResponse.data.id) {
              const otherUser = matchResponse.data.user_1?.user_id !== profile?.user_id ? matchResponse.data.user_1 : matchResponse.data.user_2;
              setShowMatch(otherUser);
              await loadProfile();
            }
          }
        } catch (err) {
          console.error('Error handling WS notification:', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        const timeout = Math.min(1000 * (2 ** retryCount), 30000);
        retryCount += 1;
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectWS, timeout);
      };
    };

    connectWS();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [profile, showMatch, loadProfile]);

  const currentProfile = profiles[currentIndex];

  const handleLike = async (isSuperLike = false) => {
    if (!currentProfile || isLiking) return;
    setIsLiking(true);
    setSwipeDirection('right');

    // Haptic feedback ao dar like (vibração leve)
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }

    try {
      // Usa user_id (não profile id) para identificar o destinatário do like
      const { data } = await matchingAPI.giveLike(currentProfile.user_id, isSuperLike);

      if (data.is_match) {
        // Haptic feedback de match! (vibração forte de sucesso)
        if (Capacitor.isNativePlatform()) {
          Haptics.notification({ type: NotificationType.Success }).catch(() => {});
        }
        setTimeout(() => {
          setSwipeDirection(null);
          setShowMatch(currentProfile);
          cachedCurrentIndex = currentIndex + 1; // atualiza o cache
        }, 400);
      } else {
        setTimeout(() => {
          setSwipeDirection(null);
          setCurrentIndex((prev) => {
            cachedCurrentIndex = prev + 1;
            return prev + 1;
          });
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
        toast.error(serverMsg || 'Você atingiu o limite de likes por dia.');
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

  const handlePass = async () => {
    if (!currentProfile) return;
    setSwipeDirection('left');
    
    try {
      // Chama a API silenciosamente sem bloquear a UI
      matchingAPI.givePass(currentProfile.user_id).catch(console.error);
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex((prev) => {
        cachedCurrentIndex = prev + 1;
        return prev + 1;
      });
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

  if (profile?.has_active_match) {
    return (
      <AppLayout disableScroll={true}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-red-500 fill-red-500" />
          </div>
          <h2 className="text-2xl font-bold font-heading mb-3">Você já tem um match!</h2>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">
            Você não pode ver novos cards enquanto tiver um match ativo. 
          </p>
          <button onClick={() => navigate('/chat')} className="btn-primary group">
            <span className="flex items-center gap-2">
              Ir para a Conversa <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </span>
          </button>
        </div>
      </AppLayout>
    );
  }

  if (showFullProfile && currentProfile) {
    return (
      <AppLayout disableScroll={false}>
        <div className="flex-1 overflow-y-auto bg-[#0a0a0f] relative hide-scrollbar flex justify-center">
          <div className="w-full max-w-md relative pb-32">
               <button 
            onClick={() => setShowFullProfile(false)}
            className="back-button-intercept fixed z-[110] w-11 h-11 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors backdrop-blur-md border border-white/20"
            style={{ top: 'calc(var(--sat) + 12px)', left: '16px' }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {/* Photos and Content Interleaved */}
          <div className="w-full flex flex-col gap-6 pb-32">
            
            {/* Primeira Foto (Primary) */}
            {currentProfile.photos && currentProfile.photos.length > 0 ? (
              <div className="relative w-full aspect-[4/5] bg-[#1a1a2e]">
                <img src={currentProfile.photos.find(p => p.is_primary)?.image || currentProfile.photos[0].image} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent flex flex-col justify-end p-6">
                  {(() => {
                    const primary = currentProfile.photos.find(p => p.is_primary) || currentProfile.photos[0];
                    return primary.caption ? (
                      <p className="text-white/90 text-sm mb-3 font-medium bg-black/40 inline-block px-3 py-1.5 rounded-lg backdrop-blur-sm self-start">
                        {primary.caption}
                      </p>
                    ) : null;
                  })()}
                  <h2 className="text-3xl font-bold text-white mb-1">{currentProfile.display_name}</h2>
                  <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                    <MapPin className="w-4 h-4" />
                    <span>{currentProfile.city}, {currentProfile.state}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[4/5] bg-[#1a1a2e] flex flex-col justify-end p-6 relative">
                <User className="w-24 h-24 text-gray-600/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <h2 className="text-3xl font-bold text-white mb-1 relative z-10">{currentProfile.display_name}</h2>
                <div className="flex items-center gap-1.5 text-purple-300 font-medium relative z-10">
                  <MapPin className="w-4 h-4" />
                  <span>{currentProfile.city}, {currentProfile.state}</span>
                </div>
              </div>
            )}

            {/* Bio, Vitals and Info Sections */}
            <div className="px-6 bg-[#0a0a0f] space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-[rgba(139,92,246,0.1)] flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Gênero</span>
                  <span className="text-sm font-bold text-gray-200">
                    {currentProfile.gender === 'M' ? 'Masculino' : currentProfile.gender === 'F' ? 'Feminino' : 'Não especificado'}
                  </span>
                </div>
                <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-[rgba(139,92,246,0.1)] flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Busca por</span>
                  <span className="text-sm font-bold text-gray-200">
                    {currentProfile.looking_for === 'M' ? 'Homens' : currentProfile.looking_for === 'F' ? 'Mulheres' : 'Todos'}
                  </span>
                </div>
              </div>

              {currentProfile.bio && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sobre mim</h3>
                  <p className="text-gray-200 text-sm leading-relaxed bg-[#1a1a2e] p-5 rounded-2xl border border-[rgba(139,92,246,0.1)]">
                    {currentProfile.bio}
                  </p>
                </div>
              )}
              
              {/* Vitals & Career */}
              <div className="flex flex-wrap gap-2">
                {currentProfile.height_cm && (
                  <div className="px-3 py-1.5 bg-[#1a1a2e] rounded-full text-xs font-medium text-gray-300 border border-[rgba(139,92,246,0.1)]">
                    📏 {currentProfile.height_cm} cm
                  </div>
                )}
                {currentProfile.job_title && (
                  <div className="px-3 py-1.5 bg-[#1a1a2e] rounded-full text-xs font-medium text-gray-300 border border-[rgba(139,92,246,0.1)]">
                    💼 {currentProfile.job_title} {currentProfile.company && `na ${currentProfile.company}`}
                  </div>
                )}
                {currentProfile.university && (
                  <div className="px-3 py-1.5 bg-[#1a1a2e] rounded-full text-xs font-medium text-gray-300 border border-[rgba(139,92,246,0.1)]">
                    🎓 {currentProfile.university}
                  </div>
                )}
              </div>
            </div>
            
            {/* Intercalando o resto das fotos e prompts */}
            <div className="flex flex-col gap-8 px-6">
              {(() => {
                const extraPhotos = (currentProfile.photos || []).slice(1);
                const prompts = currentProfile.prompts || [];
                const maxLen = Math.max(extraPhotos.length, prompts.length);
                const items = [];
                
                for (let i = 0; i < maxLen; i++) {
                  if (prompts[i]) {
                    items.push(
                      <div key={`prompt-${prompts[i].id}`} className="bg-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                        <h3 className="text-sm font-bold text-gray-800 mb-2">{prompts[i].question}</h3>
                        <p className="text-xl text-gray-900 font-heading leading-tight">{prompts[i].answer}</p>
                      </div>
                    );
                  }
                  if (extraPhotos[i]) {
                    items.push(
                      <div key={`photo-${extraPhotos[i].id}`} className="relative w-full aspect-[4/5] bg-[#1a1a2e] rounded-2xl overflow-hidden shadow-lg border border-[rgba(139,92,246,0.15)]">
                        <img src={extraPhotos[i].image} alt="Profile" className="w-full h-full object-cover" />
                        {extraPhotos[i].caption && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-md">
                            <p className="text-white text-sm font-medium">{extraPhotos[i].caption}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                }
                return items;
              })()}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="fixed bottom-[5rem] inset-x-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent flex items-center justify-center gap-6 pointer-events-none z-[60]">
            <button
              onClick={() => { setShowFullProfile(false); handlePass(); }}
              className="pointer-events-auto w-14 h-14 rounded-full border-2 border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all hover:scale-110 active:scale-95 bg-[#0a0a0f] shadow-lg shadow-red-500/20"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => { setShowFullProfile(false); handleLike(true); }}
              disabled={isLiking}
              className="pointer-events-auto w-12 h-12 rounded-full border-2 border-purple-500/40 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 hover:border-purple-500 transition-all hover:scale-110 active:scale-95 bg-[#0a0a0f] shadow-lg shadow-purple-500/20"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowFullProfile(false); handleLike(false); }}
              disabled={isLiking}
              className="pointer-events-auto w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all glow-purple"
            >
              <Heart className="w-6 h-6 fill-white" />
            </button>
          </div>
        </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout disableScroll={true}>
      <div className="flex-1 flex flex-col items-center justify-center pb-12 px-6 relative overflow-hidden" style={{ paddingTop: 'calc(var(--sat) + 10px)' }}>
        {/* Filters Button (reposicionado no topo centralizado ou no canto, garantindo z-index alto) */}
        <div 
          className="fixed z-[60]"
          style={{ top: 'calc(var(--sat) + 16px)', right: '16px' }}
        >
          <button 
            onClick={() => setShowFilters(true)}
            className="w-10 h-10 rounded-full bg-[#1a1a2e]/80 backdrop-blur-md border border-[rgba(139,92,246,0.3)] flex items-center justify-center text-purple-400 hover:bg-[rgba(139,92,246,0.2)] transition-colors shadow-lg"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

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
            <button onClick={() => loadFeed(true)} className="btn-secondary group">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
                Atualizar feed
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm h-[70vh] max-h-[650px] flex flex-col relative mb-4">
            {/* Card */}
            <div
              className={`relative w-full h-full rounded-3xl overflow-hidden bg-[#0a0a0f] shadow-[0_0_40px_rgba(139,92,246,0.1)] border border-white/5 transition-all duration-[400ms] ${
                swipeDirection === 'right'
                  ? 'animate-[card-swipe-right_0.4s_ease-out_forwards]'
                  : swipeDirection === 'left'
                  ? 'animate-[card-swipe-left_0.4s_ease-out_forwards]'
                  : 'animate-fade-in-up'
              }`}
            >
              {/* Imagem de Fundo Completa */}
              {currentProfile.photos && currentProfile.photos.length > 0 ? (
                <img
                  src={currentProfile.photos.find(p => p.is_primary)?.image || currentProfile.photos[0].image}
                  alt={currentProfile.display_name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-[#15141c] flex flex-col items-center justify-center">
                  <User className="w-32 h-32 text-gray-600/30 mb-4" />
                </div>
              )}

              {/* Gradiente Inferior para legibilidade */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

              {/* Info Container */}
              <div className="absolute bottom-24 left-0 right-0 p-6 pointer-events-none">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md font-heading">
                      {currentProfile.display_name}
                    </h2>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium drop-shadow-md">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{currentProfile.city}, {currentProfile.state}</span>
                      </div>
                      {currentProfile.job_title && (
                        <div className="flex items-center gap-1.5 text-white/80 text-sm drop-shadow-md">
                          <span className="opacity-80">💼</span> {currentProfile.job_title}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowFullProfile(true)}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors pointer-events-auto shadow-lg border border-white/20"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
                {currentProfile.bio && (
                  <p className="text-gray-300 text-sm leading-relaxed mt-4 line-clamp-2 drop-shadow-md font-medium max-w-[90%]">
                    {currentProfile.bio}
                  </p>
                )}
              </div>

              {/* Indicadores de Swipe Animados */}
              {swipeDirection === 'right' && (
                <div className="absolute top-8 left-6 px-6 py-2 rounded-2xl border-4 border-green-400/80 bg-green-500/20 backdrop-blur-sm text-green-400 font-black text-3xl rotate-[-15deg] animate-fade-in shadow-[0_0_30px_rgba(74,222,128,0.4)] tracking-wider">
                  LIKE
                </div>
              )}
              {swipeDirection === 'left' && (
                <div className="absolute top-8 right-6 px-6 py-2 rounded-2xl border-4 border-red-400/80 bg-red-500/20 backdrop-blur-sm text-red-400 font-black text-3xl rotate-[15deg] animate-fade-in shadow-[0_0_30px_rgba(248,113,113,0.4)] tracking-wider">
                  NOPE
                </div>
              )}

              {/* Action Buttons Flutuantes (sobrepostos no final do card) */}
              <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6">
                <button
                  id="discovery-pass"
                  onClick={handlePass}
                  className="w-16 h-16 rounded-full border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all hover:scale-110 active:scale-95 bg-[#0a0a0f]/80 backdrop-blur-md shadow-[0_8px_32px_rgba(220,38,38,0.2)]"
                >
                  <X className="w-7 h-7" />
                </button>

                <button
                  id="discovery-super-like"
                  onClick={() => handleLike(true)}
                  disabled={isLiking}
                  className="w-12 h-12 rounded-full border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/60 transition-all hover:scale-110 active:scale-95 bg-[#0a0a0f]/80 backdrop-blur-md shadow-[0_8px_32px_rgba(168,85,247,0.2)]"
                >
                  <Sparkles className="w-5 h-5" />
                </button>

                <button
                  id="discovery-like"
                  onClick={() => handleLike(false)}
                  disabled={isLiking}
                  className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all glow-purple shadow-[0_8px_32px_rgba(168,85,247,0.4)]"
                >
                  <Heart className="w-7 h-7 fill-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Modal */}
        {showFilters && (
          <div 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFilters(false);
            }}
          >
            <div className="bg-[#0a0a0f] rounded-t-3xl w-full border-t border-[rgba(139,92,246,0.2)] shadow-[0_-10px_40px_rgba(139,92,246,0.1)]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-heading">Filtros de Busca</h3>
                  <button onClick={() => setShowFilters(false)} type="button" className="back-button-intercept text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveFilters} className="space-y-6">
                  {filterError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {filterError}
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-300">Distância Máxima</label>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={filterData.max_distance_km} 
                          onChange={(e) => setFilterData({...filterData, max_distance_km: parseInt(e.target.value) || 2})}
                          className="bg-[#1a1a2e] border border-[rgba(139,92,246,0.3)] rounded-md text-purple-400 font-bold text-sm w-16 text-center px-1 py-0.5 focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-sm text-purple-400 font-bold">km</span>
                      </div>
                    </div>
                    <div className="relative pt-2 pb-6">
                      <RangeSlider 
                        name="max_distance_km" 
                        min="2" max="150" 
                        list="distance-markers"
                        value={filterData.max_distance_km} 
                        onChange={(e) => {
                          let val = parseInt(e.target.value);
                          const anchors = [25, 50, 75, 100, 125, 150];
                          const closest = anchors.find(a => Math.abs(a - val) <= 4);
                          if (closest) val = closest;
                          setFilterData({...filterData, max_distance_km: val});
                        }} 
                        className="relative z-10" 
                      />
                      <datalist id="distance-markers">
                        {[25, 50, 75, 100, 125, 150].map(val => <option key={val} value={val}></option>)}
                      </datalist>
                      <div className="absolute top-7 left-0 right-0 pointer-events-none px-[2px]">
                        {[25, 50, 75, 100, 125, 150].map(val => (
                          <div key={`visual-${val}`}>
                            <div 
                              className="absolute w-[2px] h-1.5 bg-purple-500/50 -mt-[18px]" 
                              style={{ left: `calc(${((val - 2) / 148) * 100}% - 1px)` }}
                            />
                            <div 
                              className="absolute text-[10px] text-gray-400 font-medium transform -translate-x-1/2" 
                              style={{ left: `${((val - 2) / 148) * 100}%` }}
                            >
                              {val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Idade Mínima</label>
                      <input 
                        type="number" 
                        min="18" max="99" 
                        value={filterData.min_age_preference} 
                        onChange={(e) => setFilterData({...filterData, min_age_preference: parseInt(e.target.value)})} 
                        className="input-field text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Idade Máxima</label>
                      <input 
                        type="number" 
                        min="18" max="99" 
                        value={filterData.max_age_preference} 
                        onChange={(e) => setFilterData({...filterData, max_age_preference: parseInt(e.target.value)})} 
                        className="input-field text-sm" 
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingFilters}
                    className="w-full btn-primary !py-3.5 mt-4"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSavingFilters ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Aplicar Filtros
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
