import { X, MapPin, User } from 'lucide-react';

export default function ProfilePreviewModal({ profile, onClose }) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex justify-center overflow-y-auto hide-scrollbar">
      <div className="w-full max-w-md relative bg-[#0a0a0f] min-h-dvh" style={{ paddingTop: 'var(--sat)', paddingBottom: 'calc(var(--sab) + 80px)' }}>
        <button 
          onClick={onClose}
          className="back-button-intercept fixed z-[110] w-11 h-11 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors backdrop-blur-md border border-white/20"
          style={{ top: 'calc(var(--sat) + 12px)', left: '16px' }}
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="w-full flex flex-col gap-6 pb-32">
          {/* Primeira Foto (Primary) */}
          {profile.photos && profile.photos.length > 0 ? (
            <div className="relative w-full aspect-[4/5] bg-[#1a1a2e]">
              <img src={profile.photos.find(p => p.is_primary)?.image || profile.photos[0].image} alt="Profile" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent flex flex-col justify-end p-6">
                {(() => {
                  const primary = profile.photos.find(p => p.is_primary) || profile.photos[0];
                  return primary.caption ? (
                    <p className="text-white/90 text-sm mb-3 font-medium bg-black/40 inline-block px-3 py-1.5 rounded-lg backdrop-blur-sm self-start">
                      {primary.caption}
                    </p>
                  ) : null;
                })()}
                <h2 className="text-3xl font-bold text-white mb-1">{profile.display_name}</h2>
                <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}, {profile.state}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-[4/5] bg-[#1a1a2e] flex flex-col justify-end p-6 relative">
              <User className="w-24 h-24 text-gray-600/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <h2 className="text-3xl font-bold text-white mb-1 relative z-10">{profile.display_name}</h2>
              <div className="flex items-center gap-1.5 text-purple-300 font-medium relative z-10">
                <MapPin className="w-4 h-4" />
                <span>{profile.city}, {profile.state}</span>
              </div>
            </div>
          )}

          {/* Bio, Vitals and Info Sections */}
          <div className="px-6 bg-[#0a0a0f] space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-[rgba(139,92,246,0.1)] flex flex-col items-center justify-center text-center">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Gênero</span>
                <span className="text-sm font-bold text-gray-200">
                  {profile.gender === 'M' ? 'Masculino' : profile.gender === 'F' ? 'Feminino' : 'Não especificado'}
                </span>
              </div>
              <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-[rgba(139,92,246,0.1)] flex flex-col items-center justify-center text-center">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Busca por</span>
                <span className="text-sm font-bold text-gray-200">
                  {profile.looking_for === 'M' ? 'Homens' : profile.looking_for === 'F' ? 'Mulheres' : 'Todos'}
                </span>
              </div>
            </div>

            {profile.bio && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sobre mim</h3>
                <p className="text-gray-200 text-sm leading-relaxed bg-[#1a1a2e] p-5 rounded-2xl border border-[rgba(139,92,246,0.1)]">
                  {profile.bio}
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {profile.height_cm && (
                <div className="px-3 py-1.5 bg-[#1a1a2e] rounded-full text-xs font-medium text-gray-300 border border-[rgba(139,92,246,0.1)]">
                  📏 {profile.height_cm} cm
                </div>
              )}
              {profile.job_title && (
                <div className="px-3 py-1.5 bg-[#1a1a2e] rounded-full text-xs font-medium text-gray-300 border border-[rgba(139,92,246,0.1)]">
                  💼 {profile.job_title} {profile.company && `na ${profile.company}`}
                </div>
              )}
              {profile.university && (
                <div className="px-3 py-1.5 bg-[#1a1a2e] rounded-full text-xs font-medium text-gray-300 border border-[rgba(139,92,246,0.1)]">
                  🎓 {profile.university}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-8 px-6">
            {(() => {
              let primaryImg = profile.photos && profile.photos.length > 0 ? (profile.photos.find(p => p.is_primary) || profile.photos[0]) : null;
              const extraPhotos = (profile.photos || []).filter(p => p !== primaryImg);
              const prompts = profile.prompts || [];
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
      </div>
    </div>
  );
}
