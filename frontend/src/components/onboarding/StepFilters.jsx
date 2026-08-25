import { useState } from 'react';
import { MapPin, Loader2, LocateFixed, ChevronDown, ChevronUp } from 'lucide-react';
import { reverseGeocode } from '../../services/geocoding';
import { educationOptions, religionOptions, politicsOptions } from '../../data/choices';
import { useToast } from '../../contexts/ToastContext';
import RangeSlider from '../RangeSlider';

export default function StepFilters({ formData, setFormData }) {
  const [isLocating, setIsLocating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const toast = useToast();

  const isMinAgeError = formData.min_age_preference && (formData.min_age_preference < 18 || formData.min_age_preference > 99);
  const isMaxAgeError = formData.max_age_preference && (formData.max_age_preference < 18 || formData.max_age_preference > 99);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMultiSelect = (name, value) => {
    const currentList = formData[name] || [];
    let newList;
    if (currentList.includes(value)) {
      newList = currentList.filter(item => item !== value);
    } else {
      newList = [...currentList, value];
    }
    setFormData({ ...formData, [name]: newList });
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-heading mb-2">Seus Filtros</h2>
        <p className="text-gray-400 text-sm">Quem você quer conhecer?</p>
      </div>

      <div className="card p-5 space-y-5">
        <h3 className="font-semibold text-purple-300">Localização <span className="text-red-400">*</span></h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Cidade</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Sua cidade"
                className="input-field !pl-10 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Estado</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Ex: SP"
              className="input-field text-sm"
              required
            />
          </div>
        </div>

        <button 
          type="button" 
          onClick={handleGetLocation} 
          disabled={isLocating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm transition-colors"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          Preencher com minha localização (GPS)
        </button>
      </div>

      <div className="card p-5 space-y-5">
        <h3 className="font-semibold text-purple-300">Básico (Estrito)</h3>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-400">Distância Máxima</label>
            <span className="text-sm text-purple-400 font-medium">{formData.max_distance_km} km</span>
          </div>
          <RangeSlider 
            name="max_distance_km" 
            min="2" max="150" 
            value={formData.max_distance_km || 50} 
            onChange={handleChange} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Idade Mínima</label>
            <input 
              type="number" 
              name="min_age_preference" 
              value={formData.min_age_preference || ''} 
              onChange={handleChange} 
              className={`input-field text-sm ${isMinAgeError ? 'border-red-500' : ''}`}
            />
            {isMinAgeError && <p className="text-red-500 text-xs mt-1">Idade inválida (18 a 99).</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Idade Máxima</label>
            <input 
              type="number" 
              name="max_age_preference" 
              value={formData.max_age_preference || ''} 
              onChange={handleChange} 
              className={`input-field text-sm ${isMaxAgeError ? 'border-red-500' : ''}`}
            />
            {isMaxAgeError && <p className="text-red-500 text-xs mt-1">Idade inválida (18 a 99).</p>}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <button 
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-[#1a1a2e] transition-colors"
        >
          <div>
            <h3 className="font-semibold text-purple-300">Filtros Avançados (Sugestivos)</h3>
            <p className="text-xs text-gray-500 mt-1">Daremos preferência para quem se encaixar aqui.</p>
          </div>
          {showAdvanced ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-[rgba(139,92,246,0.15)] space-y-6 bg-[#16162a]/50">
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Altura (cm)</label>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" name="filter_min_height" placeholder="Mínima" value={formData.filter_min_height || ''} onChange={handleChange} className="input-field text-sm" />
                <input type="number" name="filter_max_height" placeholder="Máxima" value={formData.filter_max_height || ''} onChange={handleChange} className="input-field text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Escolaridade (Selecione vários)</label>
              <div className="flex flex-wrap gap-2">
                {educationOptions.filter(opt => opt.value !== 'prefer_not_to_say').map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMultiSelect('filter_education', opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      (formData.filter_education || []).includes(opt.value)
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-transparent border-[rgba(139,92,246,0.3)] text-gray-400 hover:border-purple-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Religião</label>
              <div className="flex flex-wrap gap-2">
                {religionOptions.filter(opt => opt.value !== 'prefer_not_to_say').map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMultiSelect('filter_religion', opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      (formData.filter_religion || []).includes(opt.value)
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-transparent border-[rgba(139,92,246,0.3)] text-gray-400 hover:border-purple-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Política</label>
              <div className="flex flex-wrap gap-2">
                {politicsOptions.filter(opt => opt.value !== 'prefer_not_to_say').map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMultiSelect('filter_politics', opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      (formData.filter_politics || []).includes(opt.value)
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-transparent border-[rgba(139,92,246,0.3)] text-gray-400 hover:border-purple-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
