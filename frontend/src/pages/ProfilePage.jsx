import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Save, LogOut, Loader2, Trash2, Heart, MapPin, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../services/api';
import AppLayout from '../components/AppLayout';

export default function ProfilePage() {
  const { profile, updateProfile, logout, loadProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    gender: profile?.gender || '',
    looking_for: profile?.looking_for || '',
    city: profile?.city || '',
    state: profile?.state || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProfile(formData);
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (5MB limit before compression as a safety check)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. O limite máximo é 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressedFile = await compressImage(file);
      
      const fd = new FormData();
      fd.append('image', compressedFile);
      fd.append('is_primary', 'true');
      
      await profileAPI.uploadPhoto(fd);
      await loadProfile();
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Erro ao enviar foto. Tente novamente.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input so the same file can be selected again
      e.target.value = null;
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await profileAPI.deletePhoto(photoId);
      await loadProfile();
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Erro ao excluir a foto.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const genderLabels = { M: 'Masculino', F: 'Feminino' };
  const lookingForLabels = { M: 'Homens', F: 'Mulheres', A: 'Todos' };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-lg mx-auto animate-fade-in-up">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-5">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-red-600 p-0.5">
                <div className="w-full h-full rounded-full bg-[#1a1a2e] flex items-center justify-center overflow-hidden">
                  {profile?.photos?.length > 0 ? (
                    <img
                      src={profile.photos.find(p => p.is_primary)?.image || profile.photos[0].image}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-500" />
                  )}
                </div>
              </div>
              <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full gradient-bg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-2 border-[#0a0a0f]">
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            <h1 className="text-2xl font-bold font-heading">{profile?.display_name || 'Seu Perfil'}</h1>
            {profile?.city && (
              <div className="flex items-center justify-center gap-1.5 text-gray-400 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.city}, {profile.state}</span>
              </div>
            )}

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mt-4 text-sm ${
              profile?.has_active_match
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-green-500/10 border border-green-500/20 text-green-400'
            }`}>
              <Heart className="w-4 h-4" />
              {profile?.has_active_match ? 'Match ativo' : 'Disponível'}
            </div>
          </div>

          {/* Photos Grid */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Suas fotos ({profile?.photos?.length || 0}/6)</h3>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, index) => {
                const photo = profile?.photos?.[index];
                if (photo) {
                  return (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group border border-[rgba(139,92,246,0.15)]">
                      <img src={photo.image} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {photo.is_primary && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-purple-600/80 text-[10px] text-white font-medium uppercase tracking-wider">
                          Perfil
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <label key={`empty-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-dashed border-[rgba(139,92,246,0.2)] bg-[#16162a]/50 hover:bg-[#16162a] flex items-center justify-center cursor-pointer transition-colors group">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[rgba(139,92,246,0.1)] flex items-center justify-center group-hover:bg-[rgba(139,92,246,0.2)] transition-colors">
                          <span className="text-purple-400 text-lg font-medium">+</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                    </label>
                  );
                }
              })}
            </div>
          </div>

          {/* Profile Info */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Informações do perfil</h3>
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isEditing
                    ? 'gradient-bg text-white'
                    : 'border border-[rgba(139,92,246,0.15)] text-gray-400 hover:border-[rgba(139,92,246,0.35)]'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <><Save className="w-4 h-4" /> Salvar</>
                ) : (
                  <><Pencil className="w-4 h-4" /> Editar</>
                )}
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Nome</label>
                {isEditing ? (
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="input-field text-sm" />
                ) : (
                  <p className="text-gray-100">{profile?.display_name || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
                {isEditing ? (
                  <textarea name="bio" value={formData.bio} onChange={handleChange} className="input-field text-sm resize-none h-20" maxLength={500} />
                ) : (
                  <p className="text-gray-400 text-sm">{profile?.bio || 'Nenhuma bio definida.'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Gênero</label>
                  {isEditing ? (
                    <select name="gender" value={formData.gender} onChange={handleChange} className="input-field text-sm">
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  ) : (
                    <p className="text-gray-100 text-sm">{genderLabels[profile?.gender] || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Interessado em</label>
                  {isEditing ? (
                    <select name="looking_for" value={formData.looking_for} onChange={handleChange} className="input-field text-sm">
                      <option value="">Selecione</option>
                      <option value="M">Homens</option>
                      <option value="F">Mulheres</option>
                      <option value="A">Todos</option>
                    </select>
                  ) : (
                    <p className="text-gray-100 text-sm">{lookingForLabels[profile?.looking_for] || '—'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Cidade</label>
                  {isEditing ? (
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field text-sm" />
                  ) : (
                    <p className="text-gray-100 text-sm">{profile?.city || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Estado</label>
                  {isEditing ? (
                    <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-field text-sm" />
                  ) : (
                    <p className="text-gray-100 text-sm">{profile?.state || '—'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
