import { useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';

export default function StepPhotos({ formData, setFormData }) {
  const [error, setError] = useState('');

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
              if (!blob) return reject(new Error('Canvas is empty'));
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async (e, index) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem é muito grande. O limite máximo é 5MB.');
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressedFile);
      
      const newPhotos = [...(formData.photos || [])];
      newPhotos[index] = {
        file: compressedFile,
        preview: previewUrl,
        caption: newPhotos[index]?.caption || '',
        is_primary: index === 0
      };
      
      setFormData({ ...formData, photos: newPhotos });
    } catch (err) {
      console.error(err);
      setError('Erro ao processar imagem.');
    }
    e.target.value = null;
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = [...(formData.photos || [])];
    if (newPhotos[index]?.preview) {
      URL.revokeObjectURL(newPhotos[index].preview);
    }
    newPhotos[index] = null;
    
    // Ensure index 0 is always marked as primary if it exists
    const nextPrimaryIndex = newPhotos.findIndex(p => p !== null);
    if (nextPrimaryIndex !== -1) {
      newPhotos[nextPrimaryIndex].is_primary = true;
    }
    
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleCaptionChange = (index, value) => {
    const newPhotos = [...(formData.photos || [])];
    if (newPhotos[index]) {
      newPhotos[index].caption = value;
      setFormData({ ...formData, photos: newPhotos });
    }
  };

  const photos = formData.photos || Array(6).fill(null);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-heading mb-2">Suas Fotos</h2>
        <p className="text-gray-400 text-sm">Adicione até 6 fotos (adicione legendas se quiser!)</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, index) => {
          const photo = photos[index];
          return (
            <div key={index} className="flex flex-col gap-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#16162a] border border-[rgba(139,92,246,0.15)] group">
                {photo?.preview ? (
                  <>
                    <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-600 transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {photo.is_primary && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-purple-600 text-[10px] text-white font-medium uppercase tracking-wider shadow-lg">
                        Principal
                      </div>
                    )}
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a1a2e] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                      <Camera className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Adicionar</span>
                    <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={(e) => handlePhotoUpload(e, index)} />
                  </label>
                )}
              </div>
              
              {/* Caption input appears only if photo exists */}
              {photo?.preview && (
                <input
                  type="text"
                  value={photo.caption || ''}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  placeholder="Escreva uma legenda..."
                  className="w-full bg-[#16162a] border border-[rgba(139,92,246,0.15)] rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  maxLength={150}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
