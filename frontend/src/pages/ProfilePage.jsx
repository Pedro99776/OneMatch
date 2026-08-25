import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Save, LogOut, Loader2, Trash2, Heart, MapPin, Pencil, Lock, Shield, AlertTriangle, X, LocateFixed, MessageSquareQuote } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../services/api';
import { reverseGeocode } from '../services/geocoding';
import AppLayout from '../components/AppLayout';
import { educationOptions, religionOptions, politicsOptions, childrenOptions } from '../data/choices';
import { useToast } from '../contexts/ToastContext';
import RangeSlider from '../components/RangeSlider';

export default function ProfilePage() {
  const { profile, updateProfile, logout, loadProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  // Accordion states
  const [openSections, setOpenSections] = useState({
    info: true,
    preferences: false,
    security: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toast = useToast();
  
  const isHeightError = formData.height_cm && (formData.height_cm < 100 || formData.height_cm > 250);

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    gender: profile?.gender || '',
    looking_for: profile?.looking_for || '',
    city: profile?.city || '',
    state: profile?.state || '',
    latitude: profile?.latitude || null,
    longitude: profile?.longitude || null,
    max_distance_km: profile?.max_distance_km || 50,
    min_age_preference: profile?.min_age_preference || 18,
    max_age_preference: profile?.max_age_preference || 99,
    height_cm: profile?.height_cm || '',
    religion: profile?.religion || '',
    politics: profile?.politics || '',
    children: profile?.children || '',
    education: profile?.education || '',
    university: profile?.university || '',
    job_title: profile?.job_title || '',
    company: profile?.company || '',
  });

  const [isLocating, setIsLocating] = useState(false);

  // Sync state if profile loads later
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        ...profile,
        height_cm: profile.height_cm || '',
      }));
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setProfileError('');
    let minAge = parseInt(formData.min_age_preference) || 18;
    let maxAge = parseInt(formData.max_age_preference) || 99;
    
    if (minAge < 18 || maxAge < 18) {
      setProfileError('A idade mínima permitida é 18 anos.');
      return;
    }
    if (minAge > maxAge) {
      setProfileError('A idade mínima não pode ser maior que a máxima.');
      return;
    }
    
    const validatedData = {
      ...formData,
      min_age_preference: minAge,
      max_age_preference: maxAge,
      height_cm: formData.height_cm === '' ? null : formData.height_cm,
    };
    
    setIsSaving(true);
    const result = await updateProfile(validatedData);
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const geoResult = await reverseGeocode(lat, lng);
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        city: geoResult?.city || prev.city,
        state: geoResult?.state || prev.state
      }));
      setIsLocating(false);
    }, (error) => {
      console.error(error);
      toast.error("Não foi possível obter sua localização. Verifique as permissões do navegador.");
      setIsLocating(false);
    });
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
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Canvas is empty'));
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Limite máximo de 5MB.'); return; }
    setIsUploadingPhoto(true);
    try {
      const compressedFile = await compressImage(file);
      const fd = new FormData();
      fd.append('image', compressedFile);
      if (!profile?.photos || profile.photos.length === 0) fd.append('is_primary', 'true');
      await profileAPI.uploadPhoto(fd);
      await loadProfile();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar foto.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = null;
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await profileAPI.deletePhoto(photoId);
      await loadProfile();
    } catch (err) {
      toast.error('Erro ao excluir a foto.');
    }
  };

  const handleDeletePrompt = async (promptId) => {
    try {
      await profileAPI.deletePrompt(promptId);
      await loadProfile();
    } catch (err) {
      toast.error('Erro ao excluir prompt.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);
    try {
      await profileAPI.changePassword(passwordData);
      toast.success('Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao alterar senha.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await profileAPI.deleteAccount();
      logout();
      navigate('/');
    } catch (err) {
      toast.error('Erro ao excluir conta.');
      setIsDeleting(false);
    }
  };

  const genderLabels = { M: 'Masculino', F: 'Feminino' };
  const lookingForLabels = { M: 'Homens', F: 'Mulheres', A: 'Todos' };
  
  const getChoiceLabel = (choices, val) => choices.find(c => c.value === val)?.label || '—';

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-lg mx-auto animate-fade-in-up">
          
          <div className="text-center mb-8">
            <div className="relative inline-block mb-5">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-red-600 p-0.5">
                <div className="w-full h-full rounded-full bg-[#1a1a2e] flex items-center justify-center overflow-hidden">
                  {profile?.photos?.length > 0 ? (
                    <img src={profile.photos.find(p => p.is_primary)?.image || profile.photos[0].image} alt="" className="w-full h-full object-cover" />
                  ) : <User className="w-12 h-12 text-gray-500" />}
                </div>
              </div>
              <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full gradient-bg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-2 border-[#0a0a0f]">
                {isUploadingPhoto ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
              </label>
            </div>
            <h1 className="text-2xl font-bold font-heading">{profile?.display_name || 'Seu Perfil'}</h1>
            {profile?.city && (
              <div className="flex items-center justify-center gap-1.5 text-gray-400 text-sm mt-1">
                <MapPin className="w-4 h-4" /><span>{profile.city}, {profile.state}</span>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Suas fotos ({profile?.photos?.length || 0}/6)</h3>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, index) => {
                const photo = profile?.photos?.[index];
                if (photo) {
                  return (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group border border-[rgba(139,92,246,0.15)] flex flex-col">
                      <div className="relative flex-1 w-full h-full">
                        <img src={photo.image} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {photo.is_primary && <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-purple-600/80 text-[10px] text-white font-medium uppercase tracking-wider">Perfil</div>}
                      </div>
                      {photo.caption && (
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-black/70 backdrop-blur-md">
                          <p className="text-[10px] text-gray-200 line-clamp-2 leading-tight">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <label key={`empty-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-dashed border-[rgba(139,92,246,0.2)] bg-[#16162a]/50 hover:bg-[#16162a] flex items-center justify-center cursor-pointer transition-colors group">
                      {isUploadingPhoto ? <Loader2 className="w-5 h-5 text-gray-500 animate-spin" /> : <span className="text-purple-400 text-lg font-medium">+</span>}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                    </label>
                  );
                }
              })}
            </div>
          </div>

          {profile?.prompts?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Seus Prompts ({profile.prompts.length}/3)</h3>
              <div className="space-y-3">
                {profile.prompts.map(prompt => (
                  <div key={prompt.id} className="bg-[#16162a] border border-[rgba(139,92,246,0.2)] rounded-xl p-4 relative group">
                    <button onClick={() => handleDeletePrompt(prompt.id)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-semibold text-purple-300 mb-1 pr-6">{prompt.question}</div>
                    <div className="text-sm text-gray-200">{prompt.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card mb-6 overflow-hidden">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => toggleSection('info')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg text-gray-100">Informações do Perfil</h3>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditing) handleSave();
                    else setIsEditing(true);
                  }}
                  disabled={isSaving}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${isEditing ? 'gradient-bg text-white' : 'border border-[rgba(139,92,246,0.15)] text-gray-400 hover:border-[rgba(139,92,246,0.35)]'}`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <><Save className="w-4 h-4" /> Salvar</> : <><Pencil className="w-4 h-4" /> Editar</>}
                </button>
              </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out ${openSections.info ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="p-6 pt-0 space-y-6 border-t border-[rgba(139,92,246,0.1)] mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Nome</label>
                  {isEditing ? <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="input-field text-sm" /> : <p className="text-gray-100 bg-[#16162a] p-3 rounded-xl border border-[rgba(139,92,246,0.1)]">{profile?.display_name || '—'}</p>}
                </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
                {isEditing ? <textarea name="bio" value={formData.bio} onChange={handleChange} className="input-field text-sm resize-none h-20" maxLength={500} /> : <p className="text-gray-400 text-sm">{profile?.bio || '—'}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Gênero</label>
                  {isEditing ? (
                    <select name="gender" value={formData.gender} onChange={handleChange} className="input-field text-sm">
                      <option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option>
                    </select>
                  ) : <p className="text-gray-100 text-sm">{genderLabels[profile?.gender] || '—'}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Interessado em</label>
                  {isEditing ? (
                    <select name="looking_for" value={formData.looking_for} onChange={handleChange} className="input-field text-sm">
                      <option value="">Selecione</option><option value="M">Homens</option><option value="F">Mulheres</option><option value="A">Todos</option>
                    </select>
                  ) : <p className="text-gray-100 text-sm">{lookingForLabels[profile?.looking_for] || '—'}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Altura (cm)</label>
                  {isEditing ? (
                    <>
                      <input 
                        type="number" 
                        name="height_cm" 
                        value={formData.height_cm} 
                        onChange={handleChange} 
                        className={`input-field text-sm ${isHeightError ? 'border-red-500' : ''}`}
                      />
                      {isHeightError && <p className="text-red-500 text-xs mt-1">Inválido (100 a 250cm).</p>}
                    </>
                  ) : <p className="text-gray-100 text-sm">{profile?.height_cm ? `${profile.height_cm} cm` : '—'}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Filhos</label>
                  {isEditing ? (
                    <select name="children" value={formData.children} onChange={handleChange} className="input-field text-sm">
                      <option value="">Selecione</option>{childrenOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <p className="text-gray-100 text-sm">{getChoiceLabel(childrenOptions, profile?.children)}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Religião</label>
                  {isEditing ? (
                    <select name="religion" value={formData.religion} onChange={handleChange} className="input-field text-sm">
                      <option value="">Selecione</option>{religionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <p className="text-gray-100 text-sm">{getChoiceLabel(religionOptions, profile?.religion)}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Política</label>
                  {isEditing ? (
                    <select name="politics" value={formData.politics} onChange={handleChange} className="input-field text-sm">
                      <option value="">Selecione</option>{politicsOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <p className="text-gray-100 text-sm">{getChoiceLabel(politicsOptions, profile?.politics)}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Escolaridade</label>
                  {isEditing ? (
                    <select name="education" value={formData.education} onChange={handleChange} className="input-field text-sm">
                      <option value="">Selecione</option>{educationOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <p className="text-gray-100 text-sm">{getChoiceLabel(educationOptions, profile?.education)}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Universidade</label>
                  {isEditing ? <input type="text" name="university" value={formData.university} onChange={handleChange} className="input-field text-sm" /> : <p className="text-gray-100 text-sm">{profile?.university || '—'}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Profissão</label>
                  {isEditing ? <input type="text" name="job_title" value={formData.job_title} onChange={handleChange} className="input-field text-sm" /> : <p className="text-gray-100 text-sm">{profile?.job_title || '—'}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Empresa</label>
                  {isEditing ? <input type="text" name="company" value={formData.company} onChange={handleChange} className="input-field text-sm" /> : <p className="text-gray-100 text-sm">{profile?.company || '—'}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Cidade</label>
                  {isEditing ? <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field text-sm" /> : <p className="text-gray-100 text-sm">{profile?.city || '—'}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Estado</label>
                  {isEditing ? <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-field text-sm" /> : <p className="text-gray-100 text-sm">{profile?.state || '—'}</p>}
                </div>
              </div>

              {isEditing && (
                <div className="pt-2">
                  <button type="button" onClick={handleGetLocation} disabled={isLocating} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm font-medium transition-colors">
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />} Atualizar Localização
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card mb-6 overflow-hidden">
          <div 
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
            onClick={() => toggleSection('preferences')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-semibold text-lg text-gray-100">Preferências de Busca</h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditing) handleSave();
                  else setIsEditing(true);
                  if (!openSections.preferences && !isEditing) toggleSection('preferences');
                }}
                disabled={isSaving}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${isEditing ? 'gradient-bg text-white' : 'border border-[rgba(139,92,246,0.15)] text-gray-400 hover:border-[rgba(139,92,246,0.35)]'}`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <><Save className="w-4 h-4" /> Salvar</> : <><Pencil className="w-4 h-4" /> Editar</>}
              </button>
            </div>
          </div>

          <div className={`transition-all duration-300 ease-in-out ${openSections.preferences ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="p-6 pt-0 border-t border-[rgba(139,92,246,0.1)] mt-2">
              {profileError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{profileError}</div>}
              <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Distância Máxima</label>
                      <span className="text-xs text-purple-400 font-medium">{isEditing ? formData.max_distance_km : profile?.max_distance_km} km</span>
                    </div>
                    {isEditing ? (
                      <RangeSlider name="max_distance_km" min="2" max="150" value={formData.max_distance_km} onChange={handleChange} />
                    ) : <div className="w-full bg-gray-800 rounded-full h-2 mt-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(profile?.max_distance_km / 150) * 100}%` }}></div></div>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Idade Mín.</label>
                      {isEditing ? <input type="number" name="min_age_preference" min="18" max="99" value={formData.min_age_preference} onChange={handleChange} className="input-field text-sm" /> : <p className="text-gray-100 text-sm">{profile?.min_age_preference || '18'} anos</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Idade Máx.</label>
                      {isEditing ? <input type="number" name="max_age_preference" min="18" max="99" value={formData.max_age_preference} onChange={handleChange} className="input-field text-sm" /> : <p className="text-gray-100 text-sm">{profile?.max_age_preference || '99'} anos</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        <div className="card mb-8 overflow-hidden">
          <div 
            className="flex items-center gap-3 p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
            onClick={() => toggleSection('security')}
          >
            <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg text-gray-100">Segurança da Conta</h3>
          </div>
          
          <div className={`transition-all duration-300 ease-in-out ${openSections.security ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="p-6 pt-0 border-t border-[rgba(139,92,246,0.1)] mt-2 space-y-4">
              <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center p-4 rounded-xl bg-[#16162a] border border-[rgba(139,92,246,0.15)] hover:border-purple-500/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mr-3"><Lock className="w-5 h-5 text-purple-400" /></div>
                <div className="text-left"><h4 className="text-sm font-medium text-gray-200">Alterar Senha</h4><p className="text-xs text-gray-500">Atualize sua senha</p></div>
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="w-full flex items-center p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mr-3"><Trash2 className="w-5 h-5 text-red-400" /></div>
                <div className="text-left"><h4 className="text-sm font-medium text-red-400">Excluir Conta</h4><p className="text-xs text-red-400/60">Apagar permanentemente</p></div>
              </button>
            </div>
          </div>
        </div>

          <button onClick={logout} className="w-full py-3.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 mb-10">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setShowPasswordModal(false)}>
          <div className="glass-strong rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold">Alterar Senha</h3><X className="w-5 h-5 cursor-pointer text-gray-400" onClick={() => setShowPasswordModal(false)}/></div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" placeholder="Senha Atual" required className="input-field w-full text-sm" value={passwordData.current_password} onChange={e => setPasswordData({...passwordData, current_password: e.target.value})} />
              <input type="password" placeholder="Nova Senha" required className="input-field w-full text-sm" value={passwordData.new_password} onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} />
              <button type="submit" disabled={isChangingPassword} className="w-full btn-primary !py-3 flex justify-center">{isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Confirmar'}</button>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setShowDeleteModal(false)}>
          <div className="glass-strong border border-red-500/20 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div><h3 className="text-lg font-bold text-red-400">Excluir Conta?</h3></div>
            <p className="text-gray-300 text-sm mb-6">Esta ação é <strong>permanente e irreversível</strong>.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1 !py-3">Cancelar</button>
              <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors flex justify-center">{isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Excluir'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
